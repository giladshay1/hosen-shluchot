/* api.js – client wrapper for the Apps Script JSON API + offline outbox + read cache.
 *
 * Why text/plain: a POST with Content-Type text/plain is a CORS "simple request" → no OPTIONS preflight
 * (Apps Script cannot answer preflights). Apps Script replies 302 → script.googleusercontent.com, which
 * returns the JSON with Access-Control-Allow-Origin:*; fetch follows the redirect automatically.
 *
 * Offline: write actions marked queueable go to an IndexedDB "outbox" with a client requestId and are
 * flushed on app start, on 'online', on visibilitychange, and after every successful call.
 * (iOS has no Background Sync, so flushing happens only while the app is open.)
 * The server is idempotent for replays: sessions.add dedupes by requestId, events.create by event_id,
 * setStep/contacts.upsert are upserts.
 *
 * Usage (ES module):
 *   import { Api } from './api.js';
 *   const api = new Api(API_URL);            // API_URL is defined once, in app.js
 *   await api.login('username:password');
 *   await api.call('events.setStep', {...}, { queueable: true });
 */

const DB_NAME = 'hosen-app';
const DB_VERSION = 1;
let SEQ = 0;   // tie-breaker for writes queued in the same millisecond
const QUEUEABLE = new Set(['events.create', 'events.setStep', 'events.close', 'events.delete', 'contacts.upsert', 'contacts.delete', 'log', 'sessions.add', 'voice.send']);
const CACHEABLE = new Set(['config', 'docs.list', 'sessions.recent', 'contacts.list', 'events.list', 'events.get', 'flyers.list']);

function uuid() {
  return (crypto.randomUUID ? crypto.randomUUID()
    : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'requestId' });
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const s = tx.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => { result = r; });
    tx.oncomplete = () => resolve(typeof IDBRequest !== 'undefined' && result instanceof IDBRequest ? result.result : result);
    tx.onerror = () => reject(tx.error);
  });
}

export class ApiError extends Error {
  constructor(code, message, details) { super(message); this.code = code; this.details = details; }
}

export class Api {
  constructor(url, { timeoutMs = 25000 } = {}) {
    this.url = url;
    this.timeoutMs = timeoutMs;
    this.token = null;
    this.listeners = new Set();     // UI subscribes to {online, pending, lastError}
    this.flushing = false;
    this.onFlushed = null;          // (item, data) => void – called after a queued action reached the server
    window.addEventListener('online', () => this.flush());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.flush(); });
  }

  // ── auth ──
  async init() {
    const t = await idb('kv', 'readonly', (s) => s.get('token'));
    this.token = t ? t.value : null;
    this.flush();
    return !!this.token;
  }
  async login(code) {
    const data = await this.raw({ action: 'login', payload: { code } });
    this.token = data.token;
    await idb('kv', 'readwrite', (s) => s.put({ key: 'token', value: data.token }));
    await this.putCache('config', {}, data.config);
    return data;
  }
  async setToken(t) {
    this.token = t;
    await idb('kv', 'readwrite', (s) => s.put({ key: 'token', value: t }));
  }
  async logout() {
    this.token = null;
    await idb('kv', 'readwrite', (s) => s.delete('token'));
  }
  /** Unauthenticated health check → {version, dryRun, mockAi}. */
  ping() { return this.raw({ action: 'ping', payload: {} }); }

  // ── core call ──
  /**
   * call(action, payload, { queueable }) →
   *   online: server data.  offline + queueable: {queued:true, requestId}.  offline + cacheable: last cached data with {stale:true}.
   */
  async call(action, payload = {}, opts = {}) {
    const requestId = opts.requestId || uuid();
    const body = { action, payload, token: this.token, requestId };
    const queueable = opts.queueable ?? QUEUEABLE.has(action);
    // Keep write order: while older writes wait in the outbox, newer ones queue behind them.
    if (queueable && (await this.pending()).some((i) => (i.attempts || 0) < 3)) {
      await this.enqueue(body);
      this.flush();
      return { queued: true, requestId, reason: 'order' };
    }
    try {
      const data = await this.raw(body);
      if (CACHEABLE.has(action)) await this.putCache(action, payload, data);
      this.flush();
      return data;
    } catch (e) {
      const network = e.code === 'NETWORK' || e.code === 'TIMEOUT';
      if (network && queueable) {
        await this.enqueue(body);
        return { queued: true, requestId, reason: 'network' };
      }
      if (network && CACHEABLE.has(action)) {
        const c = await this.getCache(action, payload);
        if (c) return { ...c, stale: true };
      }
      if (e.code === 'AUTH' || e.code === 'AUTH_EXPIRED') this.emit({ authRequired: true });
      throw e;
    }
  }

  async raw(body) {
    if (!navigator.onLine) throw new ApiError('NETWORK', 'אין חיבור לרשת');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res;
    try {
      res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // simple request → no preflight
        body: JSON.stringify(body),
        redirect: 'follow',
        signal: ctrl.signal,
        credentials: 'omit'
      });
    } catch (e) {
      throw new ApiError(e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK', 'אין חיבור לשרת');
    } finally { clearTimeout(timer); }
    if (!res.ok) throw new ApiError('NETWORK', 'שגיאת שרת ' + res.status);
    let json;
    try { json = await res.json(); } catch { throw new ApiError('BAD_RESPONSE', 'תשובה לא תקינה מהשרת'); }
    if (!json.ok) throw new ApiError(json.error.code, json.error.message, json.error.details);
    return json.data;
  }

  // ── outbox ──
  async enqueue(body) {
    await idb('outbox', 'readwrite', (s) => s.put({ ...body, createdAt: new Date().toISOString() + '#' + String(++SEQ).padStart(6, '0'), attempts: 0 }));
    this.emit();
  }
  async pending() { return idb('outbox', 'readonly', (s) => s.getAll()); }

  async flush() {
    if (this.flushing || !navigator.onLine || !this.token) return;
    this.flushing = true;
    try {
      const items = (await this.pending()).sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // keep order
      for (const item of items) {
        if ((item.attempts || 0) >= 3) continue;          // parked after repeated permanent errors (shown as "failed")
        try {
          const data = await this.raw({ ...item, token: this.token });
          await idb('outbox', 'readwrite', (s) => s.delete(item.requestId));
          if (this.onFlushed) { try { this.onFlushed(item, data); } catch (e) { /* UI hook */ } }
        } catch (e) {
          if (e.code === 'NETWORK' || e.code === 'TIMEOUT' || e.code === 'BUSY') break;   // try later, keep order
          // Permanent error (validation/auth): park it so the UI can show it, don't block the queue.
          await idb('outbox', 'readwrite', (s) => s.put({ ...item, attempts: item.attempts + 1, lastError: { code: e.code, message: e.message } }));
          if (e.code === 'AUTH' || e.code === 'AUTH_EXPIRED') break;
        }
      }
    } finally { this.flushing = false; this.emit(); }
  }

  // ── read cache (last known server data, for offline display) ──
  cacheKey(action, payload) { return action + ':' + JSON.stringify(payload || {}); }
  async putCache(action, payload, data) {
    await idb('cache', 'readwrite', (s) => s.put({ key: this.cacheKey(action, payload), data, at: new Date().toISOString() }));
  }
  async getCache(action, payload) {
    const r = await idb('cache', 'readonly', (s) => s.get(this.cacheKey(action, payload)));
    return r ? { data: r.data, cachedAt: r.at } : null;
  }

  // ── status for the UI ("3 פעולות ממתינות לשליחה") ──
  onStatus(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  async emit(extra = {}) {
    const all = await this.pending();
    const failed = all.filter((i) => (i.attempts || 0) >= 3).length;
    const pending = all.length - failed;
    this.listeners.forEach((fn) => fn({ online: navigator.onLine, pending, failed, flushing: this.flushing, ...extra }));
  }
  /** Give parked items another chance (user tapped "נסה שוב"). */
  async retryFailed() {
    const all = await this.pending();
    for (const i of all) if ((i.attempts || 0) >= 3) await idb('outbox', 'readwrite', (s) => s.put({ ...i, attempts: 0 }));
    this.emit();
  }
  /** Sign-out on a shared phone: token, queued writes and cached reads are removed. */
  async clearAll() {
    this.token = null;
    for (const st of ['outbox', 'cache', 'kv']) await idb(st, 'readwrite', (s) => s.clear());
    this.emit();
  }
  /** Drop items the server keeps rejecting (validation etc.). */
  async discardFailed() {
    const all = await this.pending();
    for (const i of all) if ((i.attempts || 0) >= 3) await idb('outbox', 'readwrite', (s) => s.delete(i.requestId));
    this.emit();
  }

  // ── typed helpers ──
  addGroupSessions(rows, requestId) { return this.call('sessions.add', { rows }, { requestId, queueable: true }); }
  previewGroupSessions(rows) { return this.call('sessions.preview', { rows }, { queueable: false }); }
  parseGroupMessage(text) { return this.call('ai.parseGroupMessage', { text }, { queueable: false }); }   // → {group, sessions, missing, warnings, rows}
  getFacilitators() { return this.call('getFacilitators', {}, { queueable: false }); }                   // → [{name, home, sessions}]
  analyzeAssessment(summary, eventId) { return this.call('ai.analyzeAssessment', { summary, event_id: eventId }, { queueable: false }); }
  setStep(eventId, day, stage, stepId, done, note) {
    return this.call('events.setStep', { event_id: eventId, day, stage, step_id: stepId, done, note, at: new Date().toISOString() });
  }
  createEvent(eventType, title, authorities) {
    return this.call('events.create', { event_id: uuid(), event_type: eventType, title, authorities, started_at: new Date().toISOString() });
  }
}

/** Register the service worker and expose "update available". */
export async function registerSW(onUpdate) {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.register('./service-worker.js');
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w && w.addEventListener('statechange', () => {
      if (w.state === 'installed' && navigator.serviceWorker.controller && onUpdate) onUpdate(() => w.postMessage('SKIP_WAITING'));
    });
  });
  // Reload once when an UPDATED worker takes over (not on the very first install, which has no previous controller).
  let reloaded = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  if (reg.waiting && navigator.serviceWorker.controller && onUpdate) onUpdate(() => reg.waiting.postMessage('SKIP_WAITING'));
  // Ask the browser not to evict our offline data (Android: usually granted for installed PWAs; iOS 15.2+ supports the API).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  return reg;
}
