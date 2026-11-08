/* =====================================================================
 * חוסן שלוחות – PWA לראשי שלוחות. state · sync · domain · views · router
 * ===================================================================== */
import { Api, registerSW } from './api.js';

// ───────────── CONFIG: the ONLY place to change the backend URL ─────────────
const API_URL = 'https://script.google.com/macros/s/AKfycbxGFyaTL7G5ujUoLk08qmDzLj6GBT-Z5p276HHv875WXkXcd8u-slvTFeQca987CgljqQ/exec';
const APP_VERSION = '1.6.0';

(async function () {
// content files (cached by the service worker for offline use)
const DATA_FILES = { events: 'events', templates: 'templates', flyers: 'flyers', roles: 'roles', services: 'services', facil: 'facil', arDrafts: 'ar_drafts', claude: 'claude' };
let DATA;
try {
  const keys = Object.keys(DATA_FILES);
  const vals = await Promise.all(keys.map((k) => fetch('data/' + DATA_FILES[k] + '.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })));
  DATA = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
} catch (e) {
  document.getElementById('app').innerHTML = '<div style="padding:32px 16px;text-align:center">לא ניתן לטעון את תוכן האפליקציה. בדוק את החיבור ונסה שוב.<br><br><button onclick="location.reload()" style="padding:10px 18px;border-radius:12px;background:#0B3954;color:#fff;font-weight:700">נסה שוב</button></div>';
  return;
}
// Maashavim logo inlined (18 KB) so the login screen never shows without it (no network/cache dependency).
const LOGOS = { maashavim: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADoCAMAAAD2Z0LmAAAKNWlDQ1BJQ0MgUHJvZmlsZQAAeJydU2dUk9kWPd/3pRdaQgSkhN6kSgkgUkIVkCpNVEISIJQQQ0KxF0QFRxQVEazIqIADjg5FxoooFgZFBewDMoio4+AoomJ5K7LW6Jo37715s3/ctde+59x7zz7nAtACgkXiLFQFIFMsk0b4e7Nj4+LZxC5AgQwEsAPg8bMlIZF+UQAAgb5cdnaEvzd8AQLwulexAtywCghjs+H/gypfIpUBIGEAMF0gzOYDIAUAkJErkyj0UQBgJqUrOIpTcGlsXDwAqqHgKZN82ueYSe6p4IJMsQAAVbxZIsgUKHg7AKzLkQsFAFgwABTmiIS5ANhNADDKkGeKALA3itxMIS8bAEdT6DIhPxUAZwsANGlUBBcANwOAREv5iid9xWXCPJmiKG6WJF8qSkmVsc345mw7FxcOO0CYmyGUyazCePx0nlTA5mZlSnjifIDJmj9DTeEtO9CX62Tn4uRkZW9t95VR/3Xzb0LR20n2MvxzzxBW5xftr+KyqgA4YwDYpi9a0g6A5jUAGne+aEZ7AZQLAJquflUPSzEvqTKZxNXGJjc311ok5FsrDP0D/zPgb+Cr+6wVx/1hD9tHmMyTZ8jYCt/4WRlZcik7W8LjC9lWfx7if5z41++YFiFMFkqFYr6QHS0S5orEKWxullggkomyxGyR+D818R+m/QmTcw0AjOqPwFxgDSpXmYD92gk4BhWwhN2Krv/Rt2ByNCh+Xoze8OTcfwby76eiJYolW5TyOY8bEcXmy6U5k3uKbwl4oIAyMEETdMEQzMAK7MEZ3MATfGEWhEIUxMF84EMqZIIUcmEJrIRCKIZNsA0qYA9UQw3Uw1FohhNwFi7AFbgGPXAX+mEInsIovIYJBEGICB1hIJqIHmKMWCL2CAeZifgiwUgEEockIimIGJEjS5DVSDFSilQg+5Aa5HvkOHIWuYR0I7eRAWQE+R15h2IoDWWiOqgJaoNyUC80CI1C56Ep6EJ0EVqAbkTL0Sr0MNqEnkWvoD1oP/oUHcMAo2IsTB+zwjgYFwvF4rFkTIotw4qwMqwKq8dasQ7sBtaPPcPe4gg4Bo6Ns8K54QJwc3B83ELcMtwGXAXuEK4J1467gRvAjeI+4ul4bbwl3hUfiI/Fp+Bz8YX4MvwBfCP+PL4HP4R/TSAQWARTgjMhgBBHSCMsJmwg7CI0EM4QugmDhDEikahJtCS6E0OJPKKMWEjcQTxMPE28ThwiviFRSXoke5IfKZ4kJq0ilZFqSadI10nDpAmyCtmY7EoOJQvI+eQScjW5lXyVPESeoKhSTCnulChKGmUlpZxSTzlPuUd5SaVSDagu1HCqiLqCWk49Qr1IHaC+panRLGhcWgJNTttIO0g7Q7tNe0mn003onvR4uoy+kV5DP0d/QH+jxFCyVgpUEigtV6pUalK6rvRcmaxsrOylPF95kXKZ8jHlq8rPVMgqJipcFZ7KMpVKleMqfSpjqgxVO9VQ1UzVDaq1qpdUH6sR1UzUfNUEagVq+9XOqQ0yMIYhg8vgM1YzqhnnGUNMAtOUGchMYxYzv2N2MUfV1dQd1KPV89Qr1U+q97MwlgkrkJXBKmEdZfWy3k3RmeI1RThl/ZT6KdenjGtM1fDUEGoUaTRo9Gi802Rr+mqma27WbNa8r4XTstAK18rV2q11XuvZVOZUt6n8qUVTj069o41qW2hHaC/W3q/dqT2mo6vjryPR2aFzTueZLkvXUzdNd6vuKd0RPYbeTD2R3la903pP2OpsL3YGu5zdzh7V19YP0Jfr79Pv0p8wMDWYY7DKoMHgviHFkGOYbLjVsM1w1EjPKMRoiVGd0R1jsjHHONV4u3GH8biJqUmMyVqTZpPHphqmgaaLTOtM75nRzTzMFppVmd00J5hzzNPNd5lfs0AtHC1SLSotrlqilk6WIstdlt3T8NNcpomnVU3rs6JZeVnlWNVZDVizrIOtV1k3Wz+3MbKJt9ls02Hz0dbRNsO22vaunZrdLLtVdq12v9tb2PPtK+1vTqdP95u+fHrL9BcOlg5Ch90OtxwZjiGOax3bHD84OTtJneqdRpyNnBOddzr3cZicMM4GzkUXvIu3y3KXEy5vXZ1cZa5HXX9zs3JLd6t1ezzDdIZwRvWMQXcDd577Pvf+meyZiTP3zuz30PfgeVR5PPQ09BR4HvAc9jL3SvM67PXc29Zb6t3oPc515S7lnvHBfPx9iny6fNV85/hW+D7wM/BL8avzG/V39F/sfyYAHxAUsDmgL1AnkB9YEzg6y3nW0lntQbSgyKCKoIfBFsHS4NYQNGRWyJaQe7ONZ4tnN4dCaGDoltD7YaZhC8N+DCeEh4VXhj+KsItYEtERyYhcEFkb+TrKO6ok6u4csznyOW3RytEJ0TXR4zE+MaUx/bE2sUtjr8RpxYniWuKJ8dHxB+LH5vrO3TZ3KMExoTChd57pvLx5l+Zrzc+Yf3KB8gLegmOJ+MSYxNrE97xQXhVvLCkwaWfSKJ/L385/KvAUbBWMCN2FpcLhZPfk0uTHKe4pW1JGUj1Sy1KfibiiCtGLtIC0PWnj6aHpB9M/ZcRkNGSSMhMzj4vVxOni9izdrLysbomlpFDSv9B14baFo9Ig6YFsJHtedouMKZPIOuVm8jXygZyZOZU5b3Kjc4/lqeaJ8zrzLfLX5w8v8lv07WLcYv7itiX6S1YuGVjqtXTfMmRZ0rK25YbLC5YPrfBfcWglZWX6yp9W2a4qXfVqdczq1gKdghUFg2v819QVKhVKC/vWuq3dsw63TrSua/309TvWfywSFF0uti0uK36/gb/h8jd235R/82lj8sauEqeS3ZsIm8Sbejd7bD5Uqlq6qHRwS8iWpq3srUVbX21bsO1SmUPZnu2U7fLt/eXB5S07jHZs2vG+IrWip9K7smGn9s71O8d3CXZd3+25u36Pzp7iPe/2ivbe2ue/r6nKpKpsP2F/zv5H1dHVHd9yvq05oHWg+MCHg+KD/YciDrXXONfU1GrXltShdfK6kcMJh6995/NdS71V/b4GVkPxETgiP/Lk+8Tve48GHW07xjlW/4PxDzsbGY1FTUhTftNoc2pzf0tcS/fxWcfbWt1aG3+0/vHgCf0TlSfVT5acopwqOPXp9KLTY2ckZ56dTTk72Lag7e652HM328Pbu84Hnb94we/CuQ6vjtMX3S+euOR66fhlzuXmK05XmjodOxt/cvypscupq+mq89WWay7XWrtndJ+67nH97A2fGxduBt680jO7p7t3Tu+tvoS+/luCW49vZ9x+cSfnzsTdFffw94ruq9wve6D9oOpn858b+p36Tw74DHQ+jHx4d5A/+PSX7F/eDxU8oj8qG9Ybrnls//jEiN/ItSdznww9lTydeFb4q+qvO5+bPf/hN8/fOkdjR4deSF98+n3DS82XB185vGobCxt78Drz9cR40RvNN4fect52vIt5NzyR+574vvyD+YfWj0Ef733K/PTpXwOY8/zaXQ1IAAABgFBMVEUpW6HnbSpjmjsYlstfl0AGeCRjmUDjjS0Yls7qaSVimUTPlSonOJwYlcsjY6kMV14bdDvOlSrfmyUhZaqwpxYjZKv/qlV3fTzpaCpakz5WkD4yg0BUjz4aczvqayqqqlWtWwD/Xl5UVVRWkUATcTsVlrsQO3+/PzggfEB//38ciMU4lzkKolEbgrwcgr2qVVUQbNEafcB/f/86gT3/Pz8APz87gT3//381gD4cgr3///9/AAB/AH9ISJFmzDMAAAAsTZrMmSstU6Nmm0AYmM5VVaosTJkAf38sTJkAAP/uZio+Pn5so0QsTJkad7YlZaosTJnXiCtZlEEsTJkAVaosTJkZicMrSpdJhz7Woy0VczwJbDpOjEDmdispUp4aotopej1VqVQDfr0AAH///wAcgr2/fz8bbK4/P79/fwA9fj4Af/8A////fwB/f386gT5mm0AA/wAuU5bMmSoAqqpmm0DLmCoYmM7MmiovVKgAqv8YmM3MmCzLmSr/AAAYl8yp2iqbAAAAgHRSTlMZ9BZcmg1f9xMWIaoGk10Ep2kTnQXcAwRcWJ3+6ludAwMCA9LTEgUE/wLkDwhXpQMH/gKXBAR1As7JAQICBwUA/P3+/f0DLwJNAf4E/qz9/Y/9/tADbv0U/f79/f79/v79AwUCAfwE/QQCBQIBAgL9zgESjwOxLtDRCgOxEFABLtnjvWUAADqOSURBVHja7X2HXxvH1vZaRvRi02wc95Z2e3nbVwbLllYbmYQggUxCcFRCUEEBjDFgwP/6e6af2Z0tEuBc3x9zi9FqdjR7njl1zpx1yCfXtqbh//avjxw8Y+3gzfV9uDDbIP8WzfnUJlyfpGgcPFtdXeWA0D8Orh8DJKeXgHz8Btyx/+aZBEM2+PwG2GTrEpCP3SbJJMDxzNIAkmn4+hKQj4zH/oEVDgbJwT7ZuATkI7bTe+T6s1A8qOA6IbOXgHy8NkveRMDBILn+yfOI8ynpcxOPVdH+vRBxPiH+uL5q2FUHI2+uX38zcmDYXIDI5CUgH6P9mZysIjgOmDfIGnglGJF98uASkItvjcax1uerBydUME1vTMN/4Y/j6/i74636JSAX3u4hBbI6An75hgqVbAE4xyP62zfQ+RKQC1fo+1hN+DU3fEQKfx/k2yUgFyyxiGIBwCMYSGwgk3h15FNmkU8DkC3NICCRji06or6hIQMW2boE5ELbhlr/qweTdp1Ntb7GbOMSkAuNmZBJRezQ6MiGsotXD4YuRdYFq3RNa/KfoXJtS/kjn7DMOisgjUqleUO2ZrPSuGCJdRIujTaUK/8RAyieu1dF7Wiv7f1ugHQqNzo2iG40O+eu05XCPiahXl+dHGs7a/ojYNGqVl3L9Vb1qPXRAalXmuzf4VSqv7+/j7f+/rnh4WF2vVmpn6sKEcIIKL0VZRvLbgcX7qu7R0fs38HBD1evXh3jDf76MDjIrleP2h8PkJ0KZYFGaq7v7fbz5y9xe/58+21f/3CFMdDOOT08WvqR9hPyRSIY6Rxam7HAkw9Xx96/ePHiNW4vXrx7P3b1A0VjrydMnB4kFeWM/r7t5xwBX2MXt2/1p6BXpXPOXki0ctBK5NkkubgklNYe5Yyr79+9YAAEGr36buwq5ZQeZFe3gFCtPdz/9rkNCwOV528pJo3K+QJykhCQ/QsDhC57QOOFFQuMyov3FBOG3sUBQqXQcN/zSDA0KM/7qEKp/DsBQhXHh7E4NBQmYx9Avu1dGCAdkMuUOZ4nbZRNQAV8+fFF1vGFAAKkLVHmeJG0UTYBLmldCCB1WOr92y+Tw8HZZBsgOaPJ1Uio1DcuVqm7gMfVd6+Tw6Eh6UK9JwYE4Bh+a4cD2Vi2L98On1luIbP3foKQ8OrBf16ItAI4QsXT6zCkAJIPjLnOFRAQO6m+oLASKGxvb7+F/+kLPsEFuqRRP5/ge3eOYb1+XoziuuSDRVhxGN5Bew//E5ojCMnYk8RM4iRlj34/HMy8BWcwlRoWvVLDw/3CHPZ37T8Tk+DQyelGuBtyokMn042N2S2xoThbPxf28MPBnI4x7QsKL3HsXRCU1++uJmWSRIDcICmftGK+xlxKuYr1Rl25gcP9t7b9htjLtykYhfSccKJIPRK+G1gnOrg4e8yuHB/zFJTp2bPi8eG9Hw7pa3BXse22FQsMMlB83ccGSfW8AKmQuUc+OLb7OFtUblQ6CoqdOoS3uH8+7Ff/L5/Pkc7OmV11atDOxqL2DATW8ckbdmABkoVOJtmmfO+OecvPHoDG1Q/sq2p1r6WgaLdbe1UWUtn7MOZT/6/ffSBH5wII2I/9BnHBmJ2jcNwICe02KpQXmj4DmYmtzplTHFYPpjesEqh+b1oyyOqb+ycjz0QOHftn5KRB6r1G5MFoHQtYToCBV91rh8S5qkR4j8Z9V4nbPjsgVJu/9KtoQCOath2KybBpBlCxVekVkP1VtIVr63KM0hzeHPjOK0Ae1wnpMe93jwwa4oq7e6Qa7Vy0KCY+M+D1GEP3bIBUqPowuAPg+DIJXSsVPyQvt3tGpHGq9AN465N1yzGe6ziPzpKIPbJP/rOHIz1VMoiNXQ7HXgIF7e21/JC8fl8lpbMBAnhsGyQd7iJk2OC+y3kgcg/nLZ6Q+nTgGM/1mDxs0CzXSfdWMKhzAw/qUxy5XYQhDd/l9bsncTzixOAxjPAANZAmXe0JNnz28stHvSIyTXAq3DSoDEXbOti303F58UK3dBtRqZIPaIm/fnG1CzgEJA42CF6/G4zhESdGf2A8+lKwFWIHrh72DVhWmEkoi/WESKNuppKyTFLWqK4+OUiABzWauwzL7wEemD0Gu4tLifgX5jGKSKtXQDo+PCohrgS1e1PcHrO0JrXSDKnV6c05xMnWYDcp1T5JTapnz5IhMt2N1GobeFD2qJJetNCTMRMRtzdA6g2EB7Va241QN75vezvUGW90sNgCRHbqvSgRcuI75gmnEU5O4DyCTYeHI9KYTPzrLtbnVFy1XNKj3XzV0Ox77Z4AuUG0rHn5fDjM024yNx4aWLXN0C4I2rf17p20+zidOuLATgI9kjghxdtD9i7165706ll6VcxqYP1WewGkSW7hZU1SYd2k3qfO+NehsReESF8YcGHtdDbqsGf4kcNV9A9K1Z5NKmrGXmPzqEp6b4NYkby+GjGWExEvMfAIXfxzyo2nYq2ZwHx+OdedYq83og97hli5B29O9o+P90/8bmLCLLoqufoaq/M9cpZmujNXw0dzQgMmqSTuQxPBRnsmQwTkX6ebDcP/86Z79hjZ1ybzCRZ3qwf37nWp0Cl/lAg5MyJabA223S4BqWgFEoHHDRMPtvhDVM1DhMjL7XuVLvAw1Mfqs7DCAcYHahdDAL7R2JqlEgpzWCKh1S7pFZ3AnUvmYiLFHhpodMLwQKZqKB73cC/FIzdCeUTZWtCrkjzSaxwhPDjZt1i5IKCMEgLHBG+C3KO78uieyfhA4xFSIC/OKq+0k4nUyF43gHyJBdZcmBj6kgxb8rKGyZehthYG+cuE/DF9sGrWzxDVTlDxGVrpBHERxWPDH3rcNyytOKFVwmZRsrh5fHuCtBIIrVYXgDxEAmsuzL6qN1BcBf2RStdjBdzLt8lYpGHiAcUzyL3put7tUBse+6uG2p60FOXoQq9D2q4WWFet9q7XbrVae62W2+7G1lJsB0JrLzkgFYNyzVA1g+1izSK3QmmdQjgnElr1B9N45UPkY5oGbKfZAp+d3Id2vIWzIEQ4eDq67EAsixzptWzxGtrtqhHQgqTrZCrGO2przyZEaNkA2Ukr/QvrfacTr2Ze9jXQh1BaNxpKjYClUN9JsHeL9fl1oihdn97Y0qdwh+pYIB1YU98bW5MGizQiMxoGlWh5N9gyeKBd3ZP756zJDfWjvXYSn/2DttyqrpcQEETqCJehUdFWU58hjoDW8c5NuIVsTbRiUXdftkJ9a2uLZbP8GeMWlt24YbLIRkKNbigQ74jl9UKW9Tttw7LsajdZJi9ybkAUHiUDZKeu13G4qG8i1N6SG/UbpC8Bre+hcMxwHIvMonjiKixqWPinW7M0wjvdsCfSiURr63rYOkVsdDBJwjerXG/QGubwjsTOrC/LWmdXx2fyHhEltN4NtpMBgkj9fDhMYIGR9FZLn06apmFvaxg7oVH04edJWWQLn01neKDkkbouHIBTSKMO65wi+4BuOyZikEHXRalA1fAsa4oJbF65rcQBfTuL2DhEGU8RUac6GUaGLjsPoq+AJ94gcZoH1FO0Qr+HHZB9wipmTO+fXIfGYu9KgKH8n6j0X2OPK+Ise5sMWmjW8siTmERSnjYao0tcjfY7W/KcE+HtQYi3Hq8NFGo3lNUVsfh3kF6PZhFcHQsWND2cvv/mQMR4ednL6QAnRSXImxppMjQFEsl5pdG9yETSbtJG3fYgCmkdJQCkoWVRhGma0jbvcL0iNgeHsZKPZ5HtqPxSo5gGM2RP8M7HKvMRpwMSKykg0C2MRdoq6KTCsi1z2y8SEsiI2/MSWQzgi7TiAekgJz1iK0nFul5uK9W8Q2QgPlyJkJ0dHUGJ2s59oAUW2ETTdNfcX4oU7K6tUyqxRnoAJNTO2tO7SaB2Pbnnl/gQAtt4byVjkQ/BzUMnqNKltRTh4SE+QoZYRd76cjtihTSxsKskKFcG8n7SDGghqt4HoTqdrKbctGEcH4RJY20HSQ1StbCHyna3pL2/HqtGia09zSKWjZGgyErdfqniTZ0LAKShlD/dhtwJz2lQ7fh+2P4UIDI72dg34+5hgNTrxiAhZ3qQSoegYpu77b5EUvj0nh25/cCO4Aayq+n2YjWJd/iu3Y4DpKLJ9TZq06KDAGn4LWF0LTKyH+52ovJYVIEch+0Xsop+RkoW5Jra1XWDmMCFKBGt0sEHOaIbuTgkKPN6B80Y1VVfJu/rF1GIuEQx3IeAcHMCAcC+l3GBdEOyIW7AOqQSla8wF2dWIycOqs00yEh4sd4T/2776kl9NubAW5RoQ04IlVjtPRyHV4mkNH5V3YN2BP8SWyZvxDYtwjzYywkc0t/WKjfCk05pxzwlVuQpMNfLWCuL4qb6badiTV6guFlt0cwVXT0YCewVWil9umWyGdNMVoklbSzYlvI8Y1+EKmzKG/60kfaRJZM3HBEtFcHOcqMB0Tu3MQFyZL3OiRy5ys5wMg+josG07+WiWAjQ7RSHckdgn3zSKHsZ3KyyFrie9iWbQgyyHulJs6hJ1eQPMGlDsqx5Jq+h+z+EavaWjp9wNRUOyA1NZyWxOpVUhR3tqFdu3JDlGfQWlrKVKphpKrLoA9xSZw5hJSVroNh+JFS67Nc1g/CdWUbeiF120CKNrej9EBbOsp6OQ14hxMdxogNT1aTajs7kfWEg0op1PQO+oROa+5PiijlgHcqSGTrYO9xosNi6tp5SAo1KwE/3saHdsq4rnmCRqZFVvT81Oduo12nZy4jkarjJv0d732I3W82sPbx4q0aCGz0DFR0WAUmGs338kXuLnRXcbfEBklZ6ebshBD49otZHz3Ruv4UyJilZC6CC/ZWUGTl5C1uOvBecOux7y2+G4jTDhC/Ktv4VW8QXR3lhixCfnpL5o/XjqLLjq28aBB/rgcMKk0G7wL5tKFUIiPeqjvryRNKjBLu0OLkuPJUB/UorCpAdlYggBBE4DW995WVYyYyKb9PkRiqlN9iZCumoEhz4Xu7aNLESaVhqJo9oBjnWJ9XwUZ3G1nFcEtDsvQb14xuz9J0jFrvZtrHoan07Rv5C3uNUqkTnaI+I+/51bCqD5sN3fiXihMRNxFZ6Bx9H0LUAbgAeOze2EQL02AFKG6I5JvSYof847jbbBEEBfotWrxsF/dDW637jXlio0HIYBNlQx7Z3jlgdER03AWJiBXI1aSIQSCkE4wd7KgNSIh8iAdGU4jH1SjDPh0MCWvtrnJP1tu8tzvFpsoMltluZ/YW8T4tWR3nusI+EAJnGm0obpyer0ZmLb07AxSeQumhPjrcGvTClUMwJ0BlMmsngIhvKGj4Uzn+IVndCjCzuXSDDKXDw/GszOR7nnTZSvnOi6JwhxbmOAUlFnEqHCOCWLs9gbPLhyrGomalzB9CCyfG858B1KyBjWqe/R4kOifFg0UOcsrJn9dU/hOX5OmH+d4rq8w55G1LbBCg5bGUf/s1c2G3bXK1LE80WXzw9PtB6954u73cQtp848ka1kSRpprz/iK0ANhLu7Q9IOXeVaI2Tut4NutGuYTQgKKjO3fTUdlixGbZZcsuSKEdtrrnQu7j/37GEJi2UhrDUqVFRxi6y9tHdJwkAOZiOCPyJxQ0gaFUw6Lld5ijGpTKQ9jscMEsACLNcd/TeSLC8DGiZ/18PMBCcEkmZCY2+O4Uo1MB3gkYv3mfFSh2f9UTRlf2NY366bXbjOAkiEB7bOJ61FtzwFCBjHxKdHghDJCaVQemZgGnshATV+0xZD1q7T1RYRLqiciP1NlBCo940DsKxKoxw73Psb+JA/U64CqFSHuHzhgyhIr3HKIOkju6eHFmNT43fuh+yG+LJlXsV7et1nUna8mJSGfYQIHuRfoiW7U3Dpe4X5WXQwXMeQsQn0V++7GvisCOtMpDiSnvYsHObETsnoDS0Crlv5PiYjqFSCYb5Oksa120gDBy8QR9C9gs9HVocSxCTSnLYByheitikCthh/mjvNo7Xor2kudRwisVMhvvwMY9mHQ60aeN3GJu0/NwuFYRwb7+x66XS6mxbWfWDZ7gWU10DBKGT2dktETpBDt6GCSj4HQcBvXHdlGb23RCPVN/5t//e95L6HrNPq4P83QKSMtNDd75MESNBrkMva70Dn5BhBoMQHo2sED8g/WGAILfwQLolmI4iVvgGx6Tqfi0EydjY3oKzVMe+DPhn1vfwtI1TNYKe3l5PZw+i9ml7AsQvsoQD18AiiUZ1K3UFSH0YZ2fRPO1GIPdOiKxQQLSRNcA3NiYJpi2E3yeP6btwlfSxHL+ps/sghYuat9dP9qnqgdjWpMaaCq17NkCevPNXusLruw11xY9aLt2daiXN4rXseSQHxKdDdmwedeMhTqSrGJZZB7uSkNDYCCZDMqWeDBAm6O+T6wNBhYCTQhuWpND6rGHazvIXF29gHrHFFr0Ah+D1vWdq52hMwI7SW/Nu+L5kNCANBYiIi6e2gwkiFZwoRCs4IEB21B3Pn6NdKhRNrJCdSKU+rZYxc6WnA/sYCUKEIhV7Q7StU70rIlXP98/sVctbfpGlqHkk0qzf0wbp1S1eFjPCF4nIh9tTcEVbWRWfw6YTeLcbO7aDIf206A8CBEWpsA8OUX3JNkzgaz7a9kd7TUBOtyYHgHi4ff+9+vw97TPZ3ct0Rwa+RzZcsPkAkfKGkv+qUTaLpfKGlxJAuSWWc+ktBEi0Y9j3com2529VnJx/xmnXlZ3+50vP6WUeR0T3UFnE/l56jtIeGzSnkfURMOl7+vyOIWy1UppDo4DcowQMb6BmuiuCVX9AAZb3Tts89RcvLLkKe2TvakDd81TecKH1zgeq6YAmAkQD8Kgpktqe3+aUvIWjgDduM/reBnoCh9xifeiHDv3AB1hKaZeP5p0u8RvkgcVHfNzngVgW5RAFyBAILEn8ZwE4nj0b6frFLbMK72ffW9J7S1ryo3NObZv1xckZfv6wquvQBTbO0XhjMcHFfk7PpSUW4gCVsLSkLjT1EcQ+QfZHZKepPgAgHfHh9vNbeuk3jVEaeNhgItB9DMgxYpCR7328MgBHqrZOuy+TPYA40KJsgyrEZTX+VoJwrPCNEi9OiQQ8EQBkJSQ5JRQQvnMkCQztka52ojBYeoQ+ACAPG+TR0pJv6UNdjUcSj0fkf/g+mPj8PJCfskUmv1cEU+BQATMJkCg2GRj4fmSol6J9kEAxoIbcslFxRbcXXw3SWHn1Pb5oNLrE7YjsqaFeBGpkQdlA+d3VSKWuKHV7iVMKZNbSbXHlUUrW+2nu9Ilrt1leBOtyewk4pEFui/4qF2WH4nFbjcpVSL+4shRIsDcB0QwC6XIACWjkAWjPvh+hO4L3evDYTk+HFKzHgWNUR35ACJRcAO99JbwBInt2rT64ooh+FIr7YIwfMizX8i2+dOup24qaS/10t68J/yGPFAZQNA4B8iXpk93Jwxu0J2nMLWlMhyUjLilGbPhzshQgI6eT32twNqhrvTFJz+tcnzQO7HTLIgrlyYBadxUVJbGrpcGxFyZPUGHl62Td83iiAakGJaMCpB3pqXc0qf9HHMyRtIPrj/o5RecQbAYgIL/kV3Ncn889kniwaxXOiBK2Ryl/tLdOhpRUUqSDP6mJeh8faav3/hrw70OVSJtUfbR2CMYD/vwK3m301QrGxH7CuY05pOo3sr56oVgwMg2oIgi6tvRKZJJSeq9xcq69Agr2zfXP9S3xS6+AwgyQV+wDs7L62QcGVv/c3C2A45W4/dWSysJKvRJX+ljCkK8NqBWsBJaMj1gPfZIuqzJrFgxqddek/xjBMuzFypg4Bf3k6tgK6mcr2+eFA+Jq5onLy6LCZI22V1K673RABayJ9koQW3xcWkulmch6xe5gOuTGK/UtJ/oreTMIrIbAeFj0WbLknG5pkTKieeU8XwdSF4jbtboJSPsJYpixJ6wszR7Lfxsc0198NRhU7BGAVMkf5Z1/jAEEYoOSfNIgTROECEdF07ifdFIIEDDDbi1Z+gk8BFmpXBPXLHVtZoO+4MC5vpdQIQ441y220covmtJ/In8Sf/1CiQcapS2ijDRvdEV0/WXFEh0BHfKL+N4PyJEYFb5/Ep0oR/c7bgvy3v5am159aKEjOoMwukUe7khAbu2QJpDa2vPVkq4Qu9MQv7H2KhXMsNd2qW6T5/l+lg0EiEXyV4FMsq38CVa5+HPliZlJ2jqi61x8+cugZ8m5EyP52cBTv7Hy33s7MccRmnqJqxOAHXKjz+CRNYRIX1NxyC2K3Jq9LfXdkOoCcaEttRc8w4FAgGSLXAggfw6WD2jB6kWA/Enh4UAmo7+WzB9l15XgpkcLOOQXCYih9I+8q3LUP8WeD6GOxyvWELWgLEA/KIxXtrZ0m/EPuwFkm7UP3Nuvq8gyBPkdtspPWulejMTCgDSCgFQ1lXFbGbekZg0q8Fb+228tkSM1kF/n7+nb/hiwz5zAaZrUK075tVfoxA6U7O0LgWTp9m1xw+3bSyFwwFYueldFSt5gk1gUkQGTRQYmo150dL4ii1pAFjy++pPN14AiNb+sfMt7OP7wCCD7lbj7L8Z3beJwifXtCnzjxR36rOj1i00gWsb91qM1ZUG90uCsrfn/oH9pS+xRn3LxpWejeLAT7bmJNnSuRlYjSqlTRKZWvvU3YJA9a3hk/Cve4atxP2J7ZIp/tzLjt7HUTVNBW8ACyJyg69rtShq/b5V6ebdusa9u9aXm7BJM4NGf6utjf/bdmmvy9x+qvZGd2/IH7LXq7pMhA5ABAOSUnOObdYe02XvfFhQcDwCyMmMvmOF6VdljygcIaO6ZFfmVIbHajvjiW9BLpQS1ToYRwbDObTDqpeCdU8xdn1tbC8WDeelwRCHFwpHNhh3wV1+HUcwI7FJRT87T6kWO4ZDVzgoyyFRIrlybSKrPBAL5juauqhXwlZmSl6C0RhOxSMcnUipNzjM7zYfNUETW1iBS31E9fe8o7pBbcvhbIScRfZ6IVdSfQYWc3hy4Qse9MmAvT1oNyqyV8RBAUN+qqQ7QN+MGH7iDM3+NGDUISJoMK9LazpHvpHfkLscjGyJrj+TOiexpl4ivQKWnQ/ZZgWS6DVw5PU9A7pG7YnRwb6zb6mpt6+aEHA9B8q1q2lneX2a+tX2DJWKVJOEQqtYVi3ydJhFH1Zu3g4is3WpGHd99qO5ZC6/ccTp5ZQADcp46BKxqMfjAleOw7fCpvwYAcUOOQo1r6rrWL/46hRmk3aoiObiXqF5Wmnz92W+8rf1H1PnmCjjma7+Zbe3Wwyg8KuQ/5B1rX5N0qGGKWeQnAOT8HHU99sDdkA2uvSCLdA2IBvWv49iUqiKwq7akesdaJPbvis5pWzhW64Pm301E1v4e+So2l3yNelbCV/HQTz8hRIbO0Q/ZmpXcN3AzbMcRqBkApBQmsv5qE0wlhCkWTOj6X60MYgWkQ/4gyfbZf0WWD4Al/vfPfvtZ4fHZf0S/rLBJu4v2hwio/0zl/E+iAeVON86VQcS4oZKwFGCRMKV+pBb8zCBWCHsa0ikUcvFKzowGqt1OXrf3758JKn92J7Iow85Dckci8jPtHFmMt0k7i3GvRXXdOh366ScNyN1zi2Wd3h+SQMOoG+EVlHwsEmb2et6M6uFaJZnBXFU07njyur1gHn39+LOfWfvts3QskQEL1vW3aPBgnPRnvOvPn/3cdCPsBfIAsQj8e26uOmKQKEHotv2+SNWayFDyHBtkoLln9PUWktgapxnHnhvhhJDujgDk589+a0a+Mwne4XKN94VFP0Ei5dvEf6lRY3hpq45Y5CeQ9ucjsx4QNSwwyAMScUxw/Ntf4T+i/Roisygn/So7uIio/PKvv/6KGYRJQtHd55wkeDvCNUW7x81IvVDpKEDcSOQqrh7zWlyh8VlYykhqDW2dh+Fb1wLrpxhLoQSy6FfdYEFbvGrqsYjvf3VIDWl6ee+3yOaFCuUztuuJAEnvNH/+LRn1KohD3CT9QLj9HMN1VNhPXkE8cjNqOSduQ+SuGvFu+GunTVorCv7F8mqpqW+DBC6hW5FH6bXcqW81viFlUCJe6HJHAhIjixIC0tR4UIH1sAvpwtbz1tY54HETDRjzDpGSXua8jfsRaWs8fkUS6ClxfrUwglfSvelgpW7fQWUQ8BpJ75wJkJ20OVwzkf5FgNy1xQHPgMfN2PGA3DM+RFxMxaeEjMsOMzMlueBHiaME03czVSnoQJrr4WbGwynlJBH5lIShQyQBBOBEgz1uVhK9mu2BKbTOhkj9AcbjbrwI9Fxn5jujjcPFAnulgVcCkeFMzaCvShJGfJfS6PCP7j0zBbB1DwgYRY9/1og0yR/s/f4QD8gESWs8fgYFkk4WJzeF1pnUCCjwu3iw00aC90o6JiDfTSFqOeOI8FIywXGRcX1VM0LBQG+m5NZ6ebEkkPFnA5F0NCBfhAGSJk2MRzraOsZqBAstcKw/P4O4GrrbtY1QwtSVNHacqnfoYPpSTmBOt1cgxh1TVKwJtYK7O1GVhaLehftPckeT8QsgZDptB+SLKEDSLkk//kIPdCcZfwTVCCDSo9TaAgvBFH/J3BoniAgFZcYnyrjAam9SKYbxOHRlGX9jGEfi1P3botMYEUpKGy0VID9bAYE7fIOkCekFkW8oIhu9uCNA/Zv0fq1AkrqZdkS+C+BRIKWsD47vZniE2Nsk7pTZe7P396kDIj/o9sW1NAmKGwoI+9oGCPROi695n67woKVn7v70jWx0aXfPJEOnTFzpUUChJ4Z1IgEi48QpMKXynQ+PFtfmpm0wHqHQ4wHxIfLDD3fSZGfCP2dJ8QAgEyDlfPd3hQd7Cy5CBIgJYqsrh4S6Lzd/MoYgf+6CzQqxiIwzMprcAXgcUizgv7tT33XBH7GA+BH54vEdxhRJAJmg0urxmfAARIZMRK5QJtlKfDOF4wq6n+LRXRRmNBoRMLwOnfGpmeDlEqF8M25+47CLZwEEKJg2iXrtDtfU0YCwWO6da8adP6S7xgOICrYWJug3wCTk/lACom5R6TZ09xsDj5tdH0tkPJKxt+8yU1Mz8I/ZgdpXxCkJONB1EGOj5KyAADsYWgDa4zuUrukJBcgPPkAob5AJHxxfPO4FD2ifG4gISMjG/SjCnm5RyB7cNOH45pubXegP7ZKDFsiEQfJdAK3vMuPksC08FXx9ajfBK46dJIptwrfSf3h8Lc3ZYCLtAwSuMFTS1x777rmW2P+wOBGm2Pnm7k2KyYMH1tVev/8P5mUM3bxigPFNr65MliqCTML2HaU7JexUxgfVFEnyyukEgNDAB1UkP/ox4ev9nwAX/+raBKd4Os1Ux48+9dEbf3C7FSSP2a7cHRriEZGhBxB45O3+g6EhHlMfCqABDTirt20VWGLjmWSQUPecUKXi60+v12rkfADhsQ+gsCIx/+vHa3fuUFQUIAwLIanMzr2zh+CR+3cD9L0CfGIzggGMu0E0qLjqOVfCa9EVn6BRT358KhNED9jmaULXJyEizGD60Wic2o9BOPGP8Je86Ot3h5wJD1aV7OY3tgao3ARcRLt5864VC84eD86wyVWiTJIAkJngtXWKUyJx1QUgZMdlmuTHQEMAWLD4UbBHOk3O1sDYGrr7Tc+N2gFn2+KCKC9jkvV4VNbXTTgy405YuYfeARFOt43ikQ3kWvqs7CFDjeTmld7gYM7LmfeAS0RA0k2j0spJzB5dASIg+fGH3wUOqr/BRuoFkrs3T8EMPocJeF1D0jUc3QHCXA9mzyZDg1vHE2lyXm3IYsvGw0HI2XcbpdxikKwng4TpeDCBS11VYXa6mxGD5A6wyQ+xaIANRuFwyTm2U6oHbjJdwrJBQ2WU+PIK9VdOH5zjDCgku+MUk0wcGutT4063cHQNCMBBA1kUk3BQ6BcMjfPkDgnJ58zlY7bUlfDGvr07BJ3v3z/nGbgQaCc5jklmfX5+nf2PNfaBgwFoUP+w4HU7vNPDlNiqnwBQuJVrmlzUDmbeiYqtnHdjvh/F5Mo3VlQ4GNxH+cfWBUzAy1IClPPjC8V5ZVhp02q+uDCeo2iUSj0M7vQ0pR3uk/+TuoHXrj1+zNB4/Bj+5q4i4HX+zKFb4/MtHhuhqBiSi366Kx3Gz4dOL2oGLsOETOTyy4sLC8XiPG3F4sLC4nK+nGU2WdbraWSn5zlNaA5I82b55uIwefAP6ZdTf1C1IeG8b/3j/unFzsArFZR62Bwtl8uOiqyXCiWv12GdM00KQonpf6YR46TTF8kZga3yf3xuq9n7jwtkjQCnFAqIFdwCfDybGeOQT7yd1reGHnwuGo3/nv4u0/A873wG+uQB+Xdrl4BcAnLZLgG5BOSyXQJyCchluwTkEpDLdgnIJSDknGIHNRea9y/1dDCp8wppwFj0+Wpe/E9285ueP+bikKy9QZjMHyUr6W/x5Vq2kEWRfwh1kmAMTjcv7Bv/j5SCP6yOtOq7XN9ntGsh/84WarExwmBz0UhGxLBUyNrPJEJgsabDjH4q+AblM/TEBL2EHBIbuXTV5Mrl3VzOKfPNgOzvzxxZPiloiR4kfAmLoLpLny+X48MR/2ZHS65eZ3e3DFRoxVPBY1/vlg/LxoBOGTZYgm1xEXZacmWWjiSLOo4uLsi+iziJu0w3acQeDezSLCznKCfi357Qdy4slnXJA8jRzE+ZY47q6SzK/YVNcTv8c8jvysnxFqfy9I3ychTo4cnkz9H8YlHOaDcy88Mjywt+KiwuLKvqPvwB5/UD5h2T2hz8XF6TobiwmHuKTi7TKdPZLqtLLh13kfWHEQ9VX6c8H5rwNV9czOlBPVLU3+T45VJumT41uyQauy9vnKLOkmU06gKiTYEs6jHLlAK1ed8F+qjz5qUsyevhFgkIB/SZzSxLRpfn5aTov/AgpQhAipanL9KFQ7PjivPrvgdcL8Kywjw3mlte4GRYR1RYxsRz5o1nypKymiGbYFlM0HHmI1pmfkF2hCEW1aRm8vCxTcrFeTRTdFtmwZiwSxZ0r8yyXl2baMz5XZirh3sK1OnPyKYAUaMtsiMwxQz+XCC5Ysb3IPlwRIwfVXcsUEAY9lbC5PUDlhcpHWxUyKmcNEG9TJ6f2CmQvDnDTDHHyRINCP1lSZZNWOeIqAUqxMJvK2LJVPOMX9F1WgKAYNQzeYFcLCAFNLXiLn3a+QB92JS7BsQF9gx5wkUxuxrl4HDi1WTaY06M2uF4+O+RhI4DRA8aXJeu7UEUIrsdLLTyGfyo2TBANk1ACskAcfnTirs89MlEJBsvsrRckiKrOI9kMu6yLHjOU/yZCQxTLHeUEcZ70YWqHwB1BnHm1RIAAoNmQwApYHKGriCBiFVoBQAp+NkwmchCSwPgDluxuZDCBqDUpxZ5W+BUokqZK3WXUbsIJk6eGll5qjMzJgdzrqZ0pXfRhvooKognow+l1g9oBLhhQXSGmbtJAJErtYSXIfsdY90H2y4WWmQXf8XWgl1kBdRDEkAKeCblEL7lQiiy5WfYCszvIvW3PJUv4z6dvBg/Uxz1hD7IMONSdyvk1BzkKhAoUMbrjHJmoTqG6yCEcBJAip6nR0RSB4qBRN1mCO0sWvpaaAUA8f1IUqVuqLOFiJUVIrRK4AYXDoXeZfZ31nTsWDYJNPCX4ZOYtFipQIbF3Kjw8HiDP8XjqlWluDgnv4OveJoKXFhXhDYAyQSEIEI5CAiYe8V140YLjtrCxUJLkAYbCsLKKqMBhIRJYGVhY2DdfKD5IMIhnmQuwzt5RgKoW/B5gdmH4seM8bJGLlZWTmi96CgC5Dnego5UygglNCpnD5YWBqSYl215EYthvtYtgJQokYXwXMSiE1FPW1o5U2i5WrBqQAg5LAYGSABIyabIwbpfXjasy1wEIjW5gr24OEMtWxYLURr3wWhRrSQfRP6mWGsgsxYF8Ap3191VD4MAga667S5mAgIqAAhb4CA8lcjN+x4fz/PQZ2kVrIBok4XZx25CQGAuxUxAZzChvpxJYvpK+QtE8BIcXRdCJx8+XrCPNGyWg4tDCvTiBDEAKehGkITJFGtWHQJTz43vChYtsBS+cjEzHzBbpSG+EJDnQUBKpmeYpT+yOx8PiDGSnCMV/Q/xg0TILC1RCrGA1IRgjeosyaUXgWn7G2tD0TZHwjhk08MWlBPUt1lbIusElhzwm7quxwRZ9hmjuyC0Akrd4ohgQIpP7Qa4uVwUeJRBSzX8xWHo+hc/HMVEuPb3QiZWKZWKGZ/572BxbATy21wwwK+HAWKsS5sBlBUhS180HUkc/GzZgMvChtjE/MAACToiBiCFMEACXqr6ddcWjbFxyEIm0hKzyCOtsa1GggSthCJ3IcJTLofFUEBMYZ5jbxW3c4hvpos2QP4WECjs0cvkqX/12py+Xd8MrYAUTKdovXhYM4V5tOErcUsKiPgxJ1zjFJTyLmk7DrGvaxOYC+GABBZWIkA2bZ421IS1BjPK4BJlfEZuyeLt5NCFUhggnhl1sovuCIEkAUkkslpa5rsxXITFmlcrKqf8b1aNUxw9Z0CsoQ/i1oq2mHBxoRhwFo1fKfoIqpwOCyB+qaiWoGtGGDZDDz13AYjbGyCKOgHzrC2X025SQEpnAARU/bqNQ9YzwQCNudBHzSHFiGGAmGa16zOJIueNpfhmgm1EKUZz4fUsLYBoEu4GBhSTzH0MQMwgZFj4S7mRRX80RU+EL0g7IMQ7LGYsJrdHDpP46ptK5Ge7AqTUBSDS+TQ26eRXfPIfBRDPQ5Qq2iPESpnWfKISLXCIO3skAhC36Hf7hUsa8ohW+iVxDPWCjjABbICQbDFjdyilDZX/CICYUihHrPpEWev+LaqgxDJ/BAXvciGcoM3/CEAUymXSBSDdcYia4m7gzbnCX8h0AQiEU3K6xQQMMP1MPe25OUvQaVk9mN9Oo9t5GSXVagHbWgFityfYN8X1eECS6GkbID0odZvgVFZ3N4CQxB5TOCCL4HyYPglPQXCtI/DNjtxikWKi9rVweEWTHgtGWILokXW8cr14pkV/VivLU/745vkAUlLN7RWQZTKazWKhVVweN5J0DAWxILeo8hB+XihMBD0OJY599jJKcyNOEh0irYlEniFM0uDZZIBEwdiTyDoPDsE7mByQspnG5lMFNRYto/IyL/W06ZPLqW2GSaygZxPtiCSJLqrH3I3y1P2AKLvBjVgOvwMgZmQWJrxpFR1GrAiliLodw82U1rLrD/WoKdUMlksQ6sgmeMzFWJMsCEgnHHJttoUCMpEIENfXJlwMCHx0LYCA6VTMhG+sjhbXLXtcPIzplTYJ9mr4zkCAD1i+JWz1ubVayUkcf5d2b4ImIrlR4AUAidJSWpqFArLTE4cQk0OIlUPMKD1EFb1aaFRz83BTNpHxbOQwoNiizRTmu2bzSUInNIomA4axcHi52A2vICBS1BZ3LZ3lbkfZAGQTtcPNBICUc/7mYIvUgQuHFkACQqsQlOXyh812mDc2l+fXZUKiT8JO8HQRyI3OLSbLltMpG/F276j8sVxEtbwAIFkVnMmGxuqLm0aSQ9FooZux1vS3sObAmgwA4mU3Q4WWsWm1sIjaAs149iVSFKQG2UWaZxQzWiZR3okhUbJxpa7zMsQfr04VIHJ82xwkiczwe0Q7AyA5GyB+oVVG7002ucef/x0ScAlILHODLcGOIbZ7fVwECSWoqH1BzT3aIPMDAtRaNy0zeuykBuecspvkqcjUWv69AAkIrWx3o8r7vE7QJmRizLWmofi3Iaxiw0fmXWk2wLEhvlmdl5lGuajMOz8g2ooLvjJQ5dXlfjdAvOxoiNBy7btZ1rRjyVltI1xWDm4gzs/HZYmExHtLZBHySHM5eSAmm5OJi3ZlEKFDNosZ0xlYoEdwDum5Ep1M+vD3AsS/i6iFVi0pIDQN/G8k4CtyOtnyjkHjuNHud8ZibBbZqQ9WLW5hYUEfPMgUnQkvOSAl7abX5Ncqg1sT6/cDJFRoeaEnAPzk1bP6G/Y18nzj15Lhm4t8wagi2ahWNHoysrgi/nmXJAfEH94Ppn1Q4vyN/H6AwMvewyytYuywsKiWC/q1poYGLwcyINUZm4luI4ah8jMWDz8gOtGngBN/AlsQvx8gEEnImcnyLrEm9ASwyNB0yTLBEWIjOpK1EDKjjihFxHvFxgl6WnjEGYtxx5aDS7oApKbRbtmO+dAhmSxzQo//YPfrQgDxZ8SXOsSy4xtokEecz5lnXLOmxOKJyEUjd3xheTQ22qCj42jsFj3LOT+/jk3vBXpAoUa6AURJLOE4gRmygGYIQW+RleFM5BK03ZAf3U1262HISF4W99yMCACoJo4le74KxThWgE8HL7ITxcvswEeCk9EO/42ga06P6ixT53SZH05OdPC7bOzlyZ09tLUsBqVjqiE/wdIabi+FP72C13vhUS9QQeE8ykOUfNEsWTjALcW38Nq1yW7VH31PUrLueYUOG1rawrXMFSi5WYAL2c3ECLq2OQqvsFBgEU4Yy0tc2Rc/lxfc2XP5oEZp2cviM+SyGtBluwTkEpDLdgnIJSCX7RKQS0Au2yUgl4BctktALtsnB4gnirhcAnLZPiFAanTZekki5Gdc3jXi0Epgh8S7iPD9vzLv/YtyCNs1zBQnvEsOidzizNFSeLm43csaraO7uFg+yypmhZ+SHNXonvfOPLmLBSSkynbN+FxTZ2Kg5bOHtoLcsuJ3TVbjzWUds58rK42jGz1RRsh67JinJXglXqDINSuDe6jEdyFQGN1+VZcKtk9OD++qGuduoGC4axY3x8N46tEwXUtoT6skKqaj3+NC1O2OQ7L6kFIu4akdJ8lbZXFtaOJLkSrSBCk366sgbd6PNVoWlRgLvUmkUHxsDslmY7dyeaqgk8sHG5DcwZ+dMlu1ApBlsytKKsvxK6Jina+fy78u0+wDcWOLnlQD3T1eJqb2ZpCyPCWY7aFDUwF4IoCnf6esUgnoEPB1SRU4p6/YdvL8phLxl3mxTa7Nx+RrKMdJQA8/yL+ISpxgV2r8Dz/ZXPVoYo7yC5oXwSdXYJ9LRP+eS//meQ4ldoY7Yzs07s/EKS5PEG8zWNMH1yTgWUG0TKslKW8BYKJ307F35zOsOmeW1uPMyKrcQRUCCT2Qu7UoswZZr5pkQHb25jAvK53jQVxRa1pcfWogYkkygqEOWSJRhqc7Fdn0WBFl/peeFrsyf9iyVDeiuaXszA9NTsz60uCKC3m+mujRq3VZCJMmRYFO43Odn2IS2lmYSQJIhpaqPowGhFeBnilasyTpceicOAHBs6hytOCxrra7i+SsSFnbhZMYy+sZs4J5TcgzelywXMRJbOtikJJRNnrdl2NoB4QztUifRIAEjrgVM7iwqNFmoJqXI3L+Cv5kPzZ3T/w6/A4fmxJjUSULr9PT+s5CIg6hN2dHowGRebBlYn1mfqwCnm+Uc9IiwkPV4EYJnGy2y7qevqwU7fHDOZRQo8UZ/6909DkMdZNxbCAMELliIwHhSZXrdkCg8ocAzNFnrIzq667k7mXBkjAzPBs4SJFNwiHrsppjNCBETcfSD0qlsedbp2eC+YPyWjEZccYJJ/dyFQKpleLMEXA8sPW6wE0AX4SUGuqsiPxnXpTVgXvL7PgGv2meJw+6cYCU5SKJBiSrFriVQ7JEktkxAZF1erMF+TtiVS7nBQ34/4plzzksy5Zjxykzy2Wa/Ffe1dfzC/JIMb5apgvRAMSTDN3exf1olWA2BVYEpujIgxg8kRYKQuf9dachx3SmCJMTj830966oeJpjJOdFG3lRVLA5yrt5WWanLPJbafIvmCaWYgDGQwh1VJb6rxQJiJI4HT2IHKMMWZklHyB51o0eABGiTEkHh0u3Ij1xDKW0D51FsSoN21TCH2h8UfkSSnOZMEBM012tiUMh0Qoo2Zf9Wi5YN3XCVW8tyAvrare4LnT5qKw5VUZVwFnf4iGXKuwEsCeNlojT0GJyh1KeepGAbGJV4x9DJxkrQBzjJDBMSnOiVrRUPUvig5j24Cw3b6Me/zXPofVz3c2J0QL7zh0VdX7BBlGda6O1CEA81M8LAOJ58sgnXZs1b4JPJnhClqr29eImfxmAqPsLpW0FIPzYQYmmEnowZ4kqn0SZV42W5wFxTWc0uaeeWrBcnmZpv0SAuP4H9J56AUByXgnm5pYOJbkxIHldHt7xsiWhgB2LgMyGpIUbOfClhBySDXKIp8/qHFKzKOsJeeEHZBRXLPe8Q0lyBQguiupKA4grMs8o8BBy+laJ9E1hH7EUdA6Il5BDskj9BDlEePwuZ0C3hDo/LeKz80La5UMAYa95yucOcQlVcx5nAUQeCRdKtCafPBBB4YudPKUBGVGZAiwRbzRYyVw9EJGk2GQxjEIY9/kB0WuO1sahQu4cAZEninaJ7qysC4fVTZD2VwggImwlnsM2j7MAoo4PSXvUYdU0/DVXeVHqjAwEKo3q2gDJSriEdCjjME4sIIWSNGgLbJr02I93foCA7GRPiAFxjXfuqGFCAGnJkd0LAUSQqagWELvRv/shi9nO07evocUeA0hO3QSoqPhADCDqER2u3hfp+YBzBER5lLozX5XyZLB0d0N1iJAWXreAZLoARBefLvqmL9SCCOxQFw8t9mhApE/G34mWFBA1uDBM4Vlr5wiIZwFEVNkRb+RyYwApsBfs/SV8HlZAFsB9KJbjAfE6Bi+Z/Igd492ieLNcMbHI2nTLqihg2XTBIwBB02Rz2aWaLtczIBPyj5JPHcKZxWJxhh6ay8oIUIfEAyJKqxY3uwIk4vS3CUhNPKo8GuOGAEJ5abkoAclK08KLBITOkbuytO7OaDKlXlCRUfaePBZozno5f4mtxIAcyrkWDKWOp+wzN84MiLJVYwApeGFmL5Ijrlg/taDBTY/iOTR+7bV2A2avHRBPHmssU+FY1DhZJicnotihVh5fACThpJaSdtleAFnET9hir2igbg4+XyWkREss8HyPgLh8b2vC/Enbe51c7s8tBgDpSBOVbjB63tPsof/AvpZaoy3pu3PnhRaZi+MQd1S+6fhQFO7xY13i7yvWLmlNeYY0cgBS1x0Feek/N9wFIOxi0TOIgFevXAF/86APeI//T8DfG4dQy7k8H18qHffTgEwoL8xDVc9iSxjnlRsVK7JQfEeYlv/X9uZs+TWTLKNFMWhWLAFHvsTL7R6Qgnps2PIsyd/BxApIiUMWGVruFhAI6C07o3SnUXoSrRD6LbL3yJVVv6wCZJQozzyfh+hbbjm02NGmiODtiggnNUqycYBkdVh00V6iyltcLk+w2OO6prmQIDssSw8mJav41XpQ6iVZhm2ZB0aD76hoK7urvOzQuQr4uwTEIyUa2KblzUSBzVpoNTDcDx7LU4Ao7ZyticA0+79gpQX8wo2MDGE/jBFZTvAm3wsMa3py4usJZVjo6m0irA/hqN4Aycl3Ry6Il0AY2khWUN9ty5gWp+fTLgGR7mVmPrr6Gp/POupX0oDojaxy9Gsfs7IMou506JIEgKz7tlbNt4lzEqLJ0fQCsSewblRKy6yb7zRODoguU6E310Y7JCixjF0/M/xuAlIMADJjVmL3vTI5vFwse6yWArlMpMRycImSYtmzAeIrgc31vhL3wfJjebnTgG4qByIAuK4p3d2wvlWM7lv73jEdAsiMBRBGzsD2sy/0xt4ypN8aS/nfB8j6uuKQDGwUIkDW6cyz7NdV/RAnVIHQLSbdj9W1kmOyF8DB7yzzouOiT4BqcvHpCiPs7e4ejwLTgYKAsDk64tXl/psIej+OObmS/K11s5jgQn7C94CbmkTmJNc1IOsZkSvhUndI1zKpGW91pJkecPmQvg1C5WPQ9e0YiYnjLCXHY+kqNLWmpmqK0W94yk+BVmOBCiLLORLpgzwN9ONjAsh5GG2ZvYuYvu0XipHky9ZSJKCJxpd542k/0pplAzm+vnTUcRqsKC+rmxyaBeTZJrfMJpdXk0O/xW9lJU1K/rRHRAiTbDn+cmn2aGKpwGz5z8CuZsFcFh6fZJ5nYtGaLIu0T42Q/wXYvQYXtPzdSwAAAABJRU5ErkJggg==', shield: 'assets/shield.png', shieldText: 'assets/shield-text.png', shieldFull: 'assets/shield-full.png' };

// ───────────── utils ─────────────
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
const pad2 = (n) => String(n).padStart(2, '0');
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const hhmm = (t) => { const d = new Date(t); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const ddmmyyyy = (d) => { d = new Date(d); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); };
const ddmm = (d) => { d = new Date(d); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1); };
const parseDMY = (s) => { const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
const startOfDay = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d; };
const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const dayLabel = (t) => { const d = new Date(t), n = new Date(); if (isSameDay(d, n)) return 'היום'; const y = new Date(n); y.setDate(n.getDate() - 1); if (isSameDay(d, y)) return 'אתמול'; const tm = new Date(n); tm.setDate(n.getDate() + 1); if (isSameDay(d, tm)) return 'מחר'; return 'יום ' + DAYS[d.getDay()] + ' ' + ddmm(d); };
const whenLabel = (t) => dayLabel(t) + ' ' + hhmm(t);
const toLocalInput = (t) => { const d = new Date(t); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const elapsed = (from, to) => { let m = Math.max(0, Math.floor(((to || Date.now()) - from) / 60000)); const d = Math.floor(m / 1440); m -= d * 1440; const s = pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); return d ? d + ' ימים ' + s : s; };
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e2) { return false; }
  }
}

// ───────────── icons (Lucide-style, inline) ─────────────
const IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  back: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8"/><path d="M8 11h6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  grad: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
  exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  table: '<path d="M12 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  wa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const EV_ICON = { missiles: 'alert', direct_hit: 'target', mci: 'users', school: 'grad', terror: 'shield', evacuation: 'exit', return: 'home', earthquake: 'activity', fire_hazmat: 'flame', internal: 'info' };

// ───────────── config ─────────────
const BRANCHES = {
  'ים': { name: 'שלוחת הים', the: 'הים', tab: 'ים', authorities: ['עכו', 'מטה אשר', 'כפר ורדים'] },
  'נחלים': { name: 'שלוחת נחלים', the: 'נחלים', tab: 'נחלים', authorities: ['נהריה', 'מעלה יוסף', 'שלומי', 'מזרעה'] },
  'ציר 70': { name: 'שלוחת ציר 70', the: 'ציר 70', tab: 'ציר 70', authorities: ['כפר יאסיף', "ג'וליס", 'ירכא', "ג'דיידה-מכר", 'אבו סנאן'] },
  'הר': { name: 'שלוחת ההר', the: 'ההר', tab: 'הר', authorities: ['חורפיש', 'פסוטה', "בית ג'ן", 'מעיליא', 'מעלות-תרשיחא', 'כסרא-סמיע', 'פקיעין', 'תפן'] },
};
/** Offline demo user ("מצב הדגמה" on the login screen). Real users come from the server (login → user + config). */
const DEMO_USER = { name: 'אורח', first: 'אורח', branch: 'ים', initials: 'או' };
/** Authority values the tracking sheet accepts in every branch (activities spanning several authorities). */
const EXTRA_AUTH = ['אזורי', 'רוחבי'];
const AUTH_ALIASES = { 'מעלות-תרשיחא': ['מעלות', 'תרשיחא'], "ג'דיידה-מכר": ["ג'דיידה", 'גדיידה', 'מכר'], 'כסרא-סמיע': ['כסרא', 'סמיע'], "ג'וליס": ['גוליס', 'ג׳וליס'], "בית ג'ן": ['בית גן', 'בית ג׳ן'], 'נהריה': ['נהרייה'] };
const INTERNAL_AUTH = 'משאבים / מרכז החוסן';
const ALL_BRANCH = 'כל השלוחה';
const ASSESS_HOURS = [6, 18];
const PHASES = DATA.events.phases;
const PH_NUM = { immediate: '01', initial: '02', ongoing: '03', recovery: '04' };
const EVT = Object.fromEntries(DATA.events.events.map((e) => [e.id, e]));
const ROLE = Object.fromEntries(DATA.roles.map((r) => [r.id, r]));
const TPL = Object.fromEntries(DATA.templates.templates.map((t) => [t.id, t]));
const FLY = Object.fromEntries(DATA.flyers.flyers.map((f) => [f.id, f]));
const SVC = Object.fromEntries(DATA.services.map((s) => [s.id, s]));
const HOT = DATA.templates.constants.hotlines;
const LANG = { he: 'עברית', ar: 'ערבית', en: 'אנגלית', ru: 'רוסית' };
const shortEv = (t) => { const e = EVT[t]; return e ? e.name.split(' / ')[0].replace(/\s*\(.*?\)\s*/g, '').trim() : t; };
const roleName = (id) => (id === 'branch_head' ? 'ראש השלוחה' : (ROLE[id] ? ROLE[id].name : id));
const srcTitle = (codes) => String(codes || '').split(/;\s*/).filter(Boolean).map((c) => DATA.events.sources[c] ? DATA.events.sources[c] : c);

// tracking-sheet columns (BRIEF)
const COLS = ['גורם מממן', 'רשות', 'ישוב', 'מיקום פעילות + שם המוסד', 'תחום הפעילות', 'שם פעילות', 'סוג פעילות', 'כמות מפגשים צפויים', 'קהל יעד', 'מספר משתתפים', 'מספר מפגש מתוך סדרה', 'שם מנחה', 'מקום מגורים מנחה', 'תאריך מפגש', 'שעות מפגש', 'סה"כ קבוצות לתמחור', 'סטטוס', 'הערות', 'מס. הזמנת לקוח', 'מס. הזמנת רכש', 'סכום ההזמנה', 'חודש', 'נסיעות'];
const FIN_COLS = [18, 19, 20, 22];
const OPTS = {
  funder: ['משרד הבריאות', 'תרומה', 'גורם מממן אחר'],
  domain: ['קהילתי', 'רשותי', 'מבוטלת'],
  type: ['סדנה', 'ליווי ויעוץ', 'הצגה', 'זום', 'הנחיה', 'סדנה יחודית'],
  audience: ['ילדים', 'גיל שלישי (65+)', 'נוער (12-18)', 'צוותי חינוך', 'הורה וילד', 'מתנדבים', 'נשים', 'עו"ס ברווחה', 'נשות מילואימניקים', 'הורים', 'צוות בלתי פורמאלי', 'צוותים מובילים ביישוב/קיבוץ', 'בעלי תפקידים ברשות', 'אחר'],
  status: ['תואם', 'בוצעה', 'בוטלה'],
};
const ACTIVITIES = ['משחקי אדמה', 'חוסן בעזרת בע"ח', 'צעדים', 'כלי חוסן - כללי', 'פוטותרפיה', 'בובותרפיה', 'פלייבק', 'גינון טיפולי', 'חוסן באומנות', 'בית בלב', 'גילוף בעץ', 'חוסן בתנועה', 'דרמה תרפיה', 'מוזיאון על גלגלים', 'צח"י', 'נאמני חוסן', 'בשורה מרה', 'התערבות בחירום סיוע נפשי ראשוני', 'סאפ חותרים למטרה', 'מעגלי שיח', 'יוגה טיפולית', 'ליצנות רפואית', 'התיק של כרמל', 'חוסן בשישה ערוצים', 'קלפים טיפוליים'];

// ───────────── storage ─────────────
const LS = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
let G = LS.get('hosen:g2') || { session: null, demo: false, theme: 'light', server: null };
let S = null; // per-user state (local cache of server data + things that live only on the phone)
const saveG = () => LS.set('hosen:g2', G);
const CLUSTER = 'אשכול';
const isCluster = () => !G.demo && !!(G.session && G.session.user && G.session.user.branch === CLUSTER);
const viewBranch = () => (BRANCHES[G.viewBranch] ? G.viewBranch : 'ים');
const userKey = () => (G.demo ? 'demo' : G.session ? G.session.user.userId + (isCluster() ? ':' + viewBranch() : '') : null);
const save = () => { const k = userKey(); if (k && S) LS.set('hosen:u:' + k, S); };
const initialsOf = (name) => { const w = String(name || '').trim().split(/\s+/).filter(Boolean); return w.length > 1 ? w[0][0] + '״' + w[w.length - 1][0] : (w[0] || '?').slice(0, 2); };
const ME = () => {
  if (G.demo) return DEMO_USER;
  const u = G.session && G.session.user; if (!u) return null;
  return { name: u.name, first: String(u.name || '').trim().split(/\s+/)[0], branch: isCluster() ? viewBranch() : u.branch, title: u.title || '', cluster: isCluster(), initials: initialsOf(u.name), isAdmin: !!u.isAdmin };
};
const BR = () => {
  const me = ME(); const b = BRANCHES[me.branch];
  if (b) return b;
  const auths = ((G.session && G.session.config && G.session.config.authorities) || []).filter((a) => !EXTRA_AUTH.includes(a));
  return { name: 'שלוחת ' + me.branch, the: me.branch, tab: me.branch, authorities: auths };
};
const live = () => !G.demo && !!(G.session && G.session.user);
const UI = { phase: {}, weekOff: 0, ct: { by: 'role', q: '' }, fl: { sit: '', lang: '', aud: '', q: '' }, intake: null, msg: null, assess: null, report: {} };

function seedState() {
  if (!G.demo) return { v: 2, settings: { phone: '' }, contacts: [], events: [], assessments: [], sessions: [], notified: {}, pendingDeletes: [] };
  // demo: fictitious names and numbers only (this file is public)
  const c = (name, phone, role) => ({ id: uid(), name, phone, role, authority: INTERNAL_AUTH, seed: true });
  return {
    v: 2, demo: true,
    settings: { phone: '' },
    contacts: [
      c('מנהלת המרכז (דמה)', '050-0000001', 'center_director'),
      c('רכזת תפעול (דמה)', '050-0000002', 'operations_coord'),
      c('מתאמת קלינית (דמה)', '050-0000003', 'clinical_coordinator'),
    ],
    events: [], assessments: [], sessions: seedSessions(BRANCHES[DEMO_USER.branch]), notified: {}, pendingDeletes: [],
  };
}
function seedSessions(br) {
  const a = br.authorities, sun = startOfDay(new Date()); sun.setDate(sun.getDate() - sun.getDay());
  const at = (dayOff) => { const d = new Date(sun); d.setDate(d.getDate() + dayOff); return ddmmyyyy(d); };
  const mk = (o) => ({ id: uid(), demo: true, status: 'תואם', funder: 'משרד הבריאות', domain: 'קהילתי', type: 'סדנה', notes: '', tab: br.tab, ...o });
  const sett2 = br.tab === 'ים' ? 'שבי ציון' : a[1];
  return [
    mk({ authority: a[0], settlement: a[0], location: 'גן שקד, ' + a[0], activity: 'משחקי אדמה', audience: 'ילדים', participants: '14', facilitator: 'מיכל אברהם', facResidence: 'קריית ביאליק', date: at(1), hours: '09:00-10:30', no: 4, total: 8, status: 'בוצעה' }),
    mk({ authority: a[1], settlement: a[1], location: 'בניין המועצה, ' + a[1], activity: 'צעדים', type: 'הנחיה', domain: 'רשותי', audience: 'בעלי תפקידים ברשות', participants: '12', facilitator: 'יואב כהן', facResidence: 'כרמיאל', date: at(2), hours: '12:00-14:00', no: 1, total: 3 }),
    mk({ authority: a[2] || a[0], settlement: a[2] || a[0], location: 'מתנ"ס, ' + (a[2] || a[0]), activity: 'חוסן בעזרת בע"ח', audience: 'נוער (12-18)', participants: '10', facilitator: 'שירן דהן', facResidence: 'נהריה', date: at(3), hours: '16:00-17:30', no: 3, total: 8 }),
    mk({ authority: a[0], settlement: a[0], location: 'מועדון גיל הזהב, ' + a[0], activity: 'מעגלי שיח', audience: 'גיל שלישי (65+)', participants: '18', facilitator: 'רונית לוי', facResidence: 'נהריה', date: at(4), hours: '10:00-11:30', no: 2, total: 6 }),
    mk({ authority: a[1], settlement: sett2, location: 'מועדון חברים, ' + sett2, activity: 'יוגה טיפולית', audience: 'נשים', participants: '15', facilitator: 'נועה פרץ', facResidence: 'עכו', date: at(4), hours: '19:00-20:30', no: 5, total: 10 }),
  ];
}
function loadUser() {
  S = LS.get('hosen:u:' + userKey());
  if (!S || S.v !== 2) { S = seedState(); save(); }
  S.pendingDeletes = S.pendingDeletes || [];
}
function applyTheme() { document.documentElement.dataset.theme = G.theme === 'dark' ? 'dark' : 'light'; const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = G.theme === 'dark' ? '#0A1F2A' : '#0B3954'; }

// ───────────── domain: events ─────────────
const getEv = (id) => S.events.find((e) => e.id === id);
const openEvents = () => S.events.filter((e) => !e.closedAt).sort((a, b) => b.startedAt - a.startedAt);
const allItems = (ev) => PHASES.flatMap((p) => (EVT[ev.typeId].checklist[p.id] || []).map((it) => ({ ...it, phase: p.id })));
const findItem = (ev, itemId) => allItems(ev).find((i) => i.id === itemId);
function addLog(ev, text, kind = 'auto') { const e = { t: Date.now(), text, kind }; ev.log.push(e); if (kind !== 'done') logSync(ev, e); }
function phaseCounts(ev, ph) { const items = EVT[ev.typeId].checklist[ph] || []; return { done: items.filter((i) => ev.done[i.id]).length, total: items.length }; }
function totalCounts(ev) { const it = allItems(ev); return { done: it.filter((i) => ev.done[i.id]).length, total: it.length }; }
function nextAssessment(from = Date.now()) {
  const d = new Date(from); const cands = [];
  for (let add = 0; add < 2; add++) for (const h of ASSESS_HOURS) { const x = new Date(d); x.setDate(d.getDate() + add); x.setHours(h, 0, 0, 0); if (x.getTime() > from) cands.push(x.getTime()); }
  return Math.min(...cands);
}
function evTitle(ev) { return shortEv(ev.typeId) + ' · ' + ev.authorities.join(', '); }
function remindersFor(ev) {
  const r = [], now = Date.now();
  if (!ev.closedAt) {
    const n1 = nextAssessment(now), n2 = nextAssessment(n1 + 60000);
    r.push({ key: ev.id + ':as:' + n1, at: n1, title: 'הערכת מצב (06:00 / 18:00)', sub: 'סנכרון עם הערכות המצב הרשותיות והארגוניות', act: 'assess' });
    if (ev.mode === 'ongoing') {
      r.push({ key: ev.id + ':as:' + n2, at: n2, title: 'הערכת מצב (06:00 / 18:00)', sub: 'השוואה למגמה מהערכה הקודמת', act: 'assess' });
      const nd = new Date(now); nd.setHours(6, 0, 0, 0); if (nd.getTime() <= now) nd.setDate(nd.getDate() + 1);
      r.push({ key: ev.id + ':day:' + nd.getTime(), at: nd.getTime(), title: 'יום חדש באירוע מתמשך – "התחל יום חדש"', sub: 'איפוס הצ\'קליסט היומי (ההיסטוריה נשמרת)', act: 'newday' });
    }
  }
  if (ev.debriefAt) r.push({ key: ev.id + ':deb2', at: ev.debriefAt + 14 * 864e5, title: 'מפגש דיבוב שני', sub: 'כשבועיים אחרי הדיבוב הראשון (' + ddmm(ev.debriefAt) + ')' });
  else r.push({ key: ev.id + ':deb2', at: null, title: 'מפגש דיבוב שני – כשבועיים אחרי הראשון', sub: 'יתוזמן אחרי סימון "התקיים דיבוב ראשון"', act: 'debrief' });
  if (ev.closedAt) r.push({ key: ev.id + ':aar', at: ev.closedAt + 24 * 36e5, title: 'תחקיר הפקת לקחים (AAR)', sub: 'תוך 24–48 שעות מסיום האירוע – עד ' + whenLabel(ev.closedAt + 48 * 36e5) });
  else r.push({ key: ev.id + ':aar', at: null, title: 'תחקיר הפקת לקחים (AAR)', sub: '24–48 שעות מסיום האירוע – יתוזמן בסגירה' });
  return r.sort((a, b) => (a.at || 9e15) - (b.at || 9e15));
}
function checkNotifications() {
  if (!S) return;
  const now = Date.now();
  for (const ev of S.events) for (const r of remindersFor(ev)) {
    if (!r.at || r.at > now || S.notified[r.key]) continue;
    S.notified[r.key] = now; save();
    toast('תזכורת: ' + r.title);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(r.title, { body: evTitle(ev) + ' · ' + r.sub }); } catch (e) { /* ignore */ }
  }
}

// ───────────── server sync (Apps Script API; offline queue lives in api.js / IndexedDB) ─────────────
const api = new Api(API_URL);
{ const raw = api.call.bind(api); api.call = (action, payload = {}, opts = {}) => raw(action, isCluster() && payload && !payload.branch ? { ...payload, branch: viewBranch() } : payload, opts); }
const SYNC = { online: navigator.onLine, pending: 0, failed: 0, flushing: false, err: null, needPull: false, lastPull: null, pulling: false };
const aiAvailable = () => live() && !!G.server && G.server.mockAi === false;   // server AI only when the server says it is real
function syncState() {
  if (G.demo) return { cls: 'demo', label: 'מצב אורח', short: 'אורח' };
  const off = !navigator.onLine || SYNC.err === 'NETWORK' || SYNC.err === 'TIMEOUT';
  if (SYNC.failed) return { cls: 'fail', label: SYNC.failed + ' פעולות נכשלו', short: SYNC.failed + ' נכשלו' };
  if (off) return { cls: 'off', label: 'לא מקוון' + (SYNC.pending ? ' · ' + SYNC.pending + ' ממתינות' : ''), short: SYNC.pending ? 'לא מקוון · ' + SYNC.pending : 'לא מקוון' };
  if (SYNC.pending || SYNC.flushing) return { cls: 'pend', label: SYNC.pending ? SYNC.pending + ' ממתינות לשליחה' : 'שולח…', short: SYNC.pending ? SYNC.pending + ' ממתינות' : 'שולח…' };
  return { cls: 'ok', label: 'מסונכרן', short: '' };
}
const syncChipInner = (compact) => { const st = syncState(); return st.cls === 'ok' && compact ? '' : `<button class="sync-chip st-${st.cls}" data-act="sync" aria-label="מצב סנכרון: ${esc(st.label)}"><i></i>${esc(compact ? st.short || st.label : st.label)}</button>`; };
const syncSlot = (compact) => `<span class="sync-slot" data-compact="${compact ? 1 : 0}">${syncChipInner(compact)}</span>`;
function paintSync() { document.querySelectorAll('.sync-slot').forEach((el) => { el.innerHTML = syncChipInner(el.dataset.compact === '1'); }); }
api.onStatus((st) => {
  Object.assign(SYNC, { online: st.online, pending: st.pending, failed: st.failed || 0, flushing: !!st.flushing });
  if (st.authRequired) { authLost(); return; }
  paintSync();
  if (SYNC.needPull && !st.pending && !st.flushing) pullAll();
});
api.onFlushed = (item, data) => {
  SYNC.err = null;
  if (item.action === 'contacts.upsert' || item.action === 'contacts.delete') SYNC.needPull = true;
  if (item.action === 'sessions.add') sessionsFlushed(item.requestId, data);
};
window.addEventListener('online', () => { SYNC.err = null; paintSync(); });
window.addEventListener('offline', paintSync);
/** Fire-and-forget write (queued offline). Returns server data, {queued:true}, or null on a permanent error. */
async function send(action, payload, opts = {}) {
  if (!live()) return null;
  try { const r = await api.call(action, payload, opts); if (!r || !r.queued) SYNC.err = null; else if (r.reason === 'network') SYNC.err = 'NETWORK'; paintSync(); return r; } catch (e) {
    SYNC.err = e.code || 'ERR'; paintSync();
    if (e.code !== 'AUTH' && e.code !== 'AUTH_EXPIRED' && !opts.quiet) toast('השרת: ' + (e.message || 'שגיאה'));
    return null;
  }
}
const arrOf = (r) => (Array.isArray(r) ? r : r && Array.isArray(r.data) ? r.data : null);   // cached reads come back as {data, stale}
// events
const PH_STAGE = { immediate: 1, initial: 2, ongoing: 3, recovery: 4 };
function eventCreateSync(ev) { send('events.create', { event_id: ev.id, event_type: ev.typeId, title: evTitle(ev), authorities: ev.authorities, started_at: new Date(ev.startedAt).toISOString(), notes: 'mode:' + ev.mode }); }
function stepSync(ev, itemId, done) { const it = findItem(ev, itemId); send('events.setStep', { event_id: ev.id, day: ev.day || 1, stage: PH_STAGE[it ? it.phase : 'immediate'] || 1, step_id: itemId, done: !!done, note: '', at: new Date(done || Date.now()).toISOString() }); }
function logSync(ev, e) { if (live()) send('log', { type: 'event_' + e.kind, details: { event_id: ev.id, text: String(e.text).slice(0, 900), at: new Date(e.t).toISOString() } }, { quiet: true }); }
// contacts: server row ↔ local contact. Internal (Maashavim/center) contacts have no authority on the server, marked by tag.
const SERVER_ALL = 'כלל השלוחה';
function fmtPhone(raw) { const p = normPhone(raw); if (!p.valid || !p.local) return String(raw || ''); const l = p.local; return /^05\d{8}$/.test(l) ? l.slice(0, 3) + '-' + l.slice(3) : /^0[2-9]\d{7}$/.test(l) ? l.slice(0, 2) + '-' + l.slice(2) : l; }
function toServerContact(c) {
  const internal = c.authority === INTERNAL_AUTH;
  return { contact_id: c._local ? undefined : c.id, name: c.name, phone: c.phone, role: c.role,
    authority: internal ? '' : c.authority === ALL_BRANCH ? SERVER_ALL : c.authority,
    tags: ['lang:' + (c.lang === 'ar' ? 'ar' : 'he'), internal ? 'scope:internal' : 'scope:authority'], source: c.source || 'manual' };
}
function fromServerContact(x) {
  const tags = String(x.tags || '');
  const auth = /scope:internal/.test(tags) || !x.authority ? INTERNAL_AUTH : x.authority === SERVER_ALL ? ALL_BRANCH : x.authority;
  return { id: x.contact_id, name: x.name, phone: fmtPhone(x.phone), role: x.role, authority: auth, lang: /lang:ar/.test(tags) ? 'ar' : 'he', source: x.source };
}
async function pushContacts(cs) {
  if (!live() || !cs.length) return;
  const r = await send('contacts.upsert', { contacts: cs.map(toServerContact) });
  if (!r || r.queued) return;
  (r.saved || []).forEach((x) => { const loc = S.contacts.find((c) => c.id === x.contact_id) || S.contacts.find((c) => c._local && normPhone(c.phone).wa === normPhone(x.phone).wa); if (loc) { loc.id = x.contact_id; delete loc._local; } });
  (r.rejected || []).forEach((x) => toast('לא נשמר בשרת: ' + (x.name || '') + ' – ' + x.reason, 4000));
  save(); softRender();
}
// facilitators: bundled list (data/facil.json) until the server list arrives; then cached for offline
function setFacilitators(list) {
  if (!Array.isArray(list) || !list.length) return;
  const mapped = list.filter((f) => f && f.name).map((f) => ({ n: String(f.name).trim(), h: String(f.home || '').trim(), s: Number(f.sessions) || 0 }));
  FACS.length = 0; mapped.forEach((f) => FACS.push({ ...f, weak: isWeakFac(f.n), k: nrm(f.n) }));
  FACS.forEach((f) => { if (f.h) KNOWN_PLACES.add(nrm(f.h)); });
}
async function loadFacilitators() {
  if (!live()) return;
  try { const r = arrOf(await api.call('getFacilitators', {}, { queueable: false })); if (r && r.length) { setFacilitators(r); LS.set('hosen:fac', r); } } catch (e) { /* keep cached / bundled list */ }
}
async function pullServerEvent(se) {
  if (se.status === 'deleted' || (S.deletedEvents || []).includes(se.event_id)) { if (getEv(se.event_id)) S.events = S.events.filter((e) => e.id !== se.event_id); return; }
  let ev = getEv(se.event_id);
  const isNew = !ev;
  if (isNew) {
    ev = { id: se.event_id, typeId: EVT[se.event_type] ? se.event_type : 'internal', mode: /mode:ongoing/.test(se.notes || '') ? 'ongoing' : 'point',
      authorities: String(se.authorities || '').split(',').map((x) => x.trim()).filter(Boolean), startedAt: Date.parse(se.started_at) || Date.now(),
      closedAt: null, day: 1, done: {}, history: [], log: [], phase: 'immediate', debriefAt: null, summary: '', reports: 0, fromServer: true };
    ev.log.push({ t: Date.now(), text: 'האירוע נטען מהשרת (נפתח במכשיר אחר)', kind: 'auto' });
    S.events.push(ev);
  }
  if (se.status === 'closed' && !ev.closedAt) ev.closedAt = Date.parse(se.closed_at) || Date.now();
  if (!isNew && ev.closedAt) return;
  if (se.status === 'closed' && isNew) return;
  const k = userKey(); let r; try { r = await api.call('events.get', { event_id: se.event_id }, { queueable: false }); } catch (e) { return; }
  if (userKey() !== k) return;
  const steps = (r && (r.steps || (r.data && r.data.steps))) || [];
  const isTrue = (v) => v === true || String(v).toUpperCase() === 'TRUE';
  if (isNew) {
    const maxDay = steps.reduce((m, x) => Math.max(m, Number(x.day) || 1), 1);
    ev.day = maxDay;
    for (let d = 1; d < maxDay; d++) ev.history.push({ day: d, date: '', done: Object.fromEntries(steps.filter((x) => Number(x.day) === d && isTrue(x.done)).map((x) => [x.step_id, Date.parse(x.done_at) || Date.now()])), q6: {} });
  }
  steps.filter((x) => Number(x.day) === (ev.day || 1) && isTrue(x.done) && !ev.done[x.step_id] && findItem(ev, x.step_id)).forEach((x) => { ev.done[x.step_id] = Date.parse(x.done_at) || Date.now(); });
}
async function pullAll() {
  if (!live() || SYNC.pulling || !navigator.onLine) return;
  SYNC.pulling = true; const k0 = userKey(); const stale = () => userKey() !== k0;
  try {
    const hasPending = (await api.pending()).some((i) => (i.attempts || 0) < 3);
    if (!hasPending) {
      const list = arrOf(await api.call('contacts.list', {}, { queueable: false }));
      if (stale()) return;
      if (list) {
        const keepLocal = S.contacts.filter((c) => c._local);
        S.contacts = list.map(fromServerContact).concat(keepLocal.filter((c) => !list.some((x) => normPhone(x.phone).wa === normPhone(c.phone).wa)));
        const del = S.pendingDeletes.splice(0);   // contacts deleted before their creation reached the server
        list.filter((x) => del.includes(normPhone(x.phone).wa)).forEach((x) => { S.contacts = S.contacts.filter((c) => c.id !== x.contact_id); send('contacts.delete', { contact_id: x.contact_id }); });
      }
      SYNC.needPull = false;
    }
    const evs = arrOf(await api.call('events.list', { includeDeleted: true }, { queueable: false }));
    if (stale()) return;
    if (evs) for (const se of evs.slice(0, 40)) { await pullServerEvent(se); if (stale()) return; }
    SYNC.lastPull = Date.now(); SYNC.err = null;
    save(); softRender();
  } catch (e) {
    SYNC.err = e.code || 'ERR';
  } finally { SYNC.pulling = false; paintSync(); if (stale()) setTimeout(pullAll, 0); }
  if (stale()) return;
  loadFacilitators();
}
async function refreshServerInfo() {
  if (G.demo || !navigator.onLine) return;
  try { const p = await api.ping(); G.server = { version: p.version, dryRun: !!p.dryRun, mockAi: p.mockAi !== false, at: Date.now() }; saveG(); } catch (e) { /* offline – keep last known */ }
}
function authLost() {
  if (!G.session) return;
  G.session = null; saveG(); S = null; closeSheet();
  UI.loginMsg = 'פג תוקף הכניסה – התחבר שוב. פעולות שלא נשלחו יישלחו אחרי הכניסה.';
  render();
}
/** Re-render only when the user is not typing (server data arrived in the background). */
function softRender() { const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox') return; if (G.demo || G.session) render(); }

// ───────────── domain: contacts / messages ─────────────
function normPhone(raw) {
  let s = String(raw || '').trim(); const plus = s.startsWith('+'); let d = s.replace(/\D/g, '');
  if (!d) return { wa: '', valid: false };
  if (!plus && d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('972')) { d = d.slice(3); if (d.startsWith('0')) d = d.slice(1); } else if (plus) return { wa: d, valid: d.length >= 8 && d.length <= 15 }; else if (d.startsWith('0')) d = d.slice(1);
  const mobile = /^5\d{8}$/.test(d), land = /^[23489]\d{7}$/.test(d) || /^7\d{8}$/.test(d);
  return { wa: '972' + d, valid: mobile || land, mobile, local: '0' + d };
}
const waLink = (phone, text) => { const p = normPhone(phone); return p.valid ? 'https://wa.me/' + p.wa + '?text=' + encodeURIComponent(text || '') : 'https://wa.me/?text=' + encodeURIComponent(text || ''); };
const waNoRecipient = (text) => 'https://wa.me/?text=' + encodeURIComponent(text || '');
function recipientsFor(ev, roles) {
  const out = [], seen = new Set();
  for (const role of roles) {
    const r = ROLE[role]; if (!r) continue;
    if (r.group === 'public') { out.push({ role, public: true }); continue; }
    if (r.group === 'authority') {
      for (const auth of ev.authorities) {
        const cs = S.contacts.filter((c) => c.role === role && (c.authority === auth || c.authority === ALL_BRANCH));
        if (!cs.length) out.push({ role, auth, missing: true });
        cs.forEach((c) => { if (!seen.has(c.id)) { seen.add(c.id); out.push({ role, auth, contact: c }); } });
      }
    } else {
      const cs = S.contacts.filter((c) => c.role === role);
      if (!cs.length) out.push({ role, missing: true });
      cs.forEach((c) => { if (!seen.has(c.id)) { seen.add(c.id); out.push({ role, contact: c }); } });
    }
  }
  return out;
}
function variantFor(tpl, role, lang = 'he') {
  return tpl.variants.find((v) => v.role === role && v.lang === lang) || tpl.variants.find((v) => v.role === role) || tpl.variants.find((v) => v.lang === lang) || tpl.variants[0];
}
const EV_AR = { missiles: 'إطلاق الصواريخ', direct_hit: 'سقوط القذيفة', mci: 'الحادث متعدد الإصابات', school: 'الحادث في المؤسسة التعليمية', terror: 'الحادث الأمني', evacuation: 'الإخلاء', return: 'العودة من الإخلاء', earthquake: 'الزلزال', fire_hazmat: 'الحريق', internal: 'الحادث الداخلي' };
const AUTH_AR = { 'עכו': 'عكا', 'מטה אשר': 'ماطيه أشير', 'כפר ורדים': 'كفار فراديم', 'נהריה': 'نهاريا', 'מעלה יוסף': 'معليه يوسف', 'שלומי': 'شلومي', 'מזרעה': 'المزرعة', 'כפר יאסיף': 'كفر ياسيف', "ג'וליס": 'جولس', 'ירכא': 'يركا', "ג'דיידה-מכר": 'الجديدة-المكر', 'אבו סנאן': 'أبو سنان', 'חורפיש': 'حرفيش', 'פסוטה': 'فسوطة', "בית ג'ן": 'بيت جن', 'מעיליא': 'معليا', 'מעלות-תרשיחא': 'معالوت-ترشيحا', 'כסרא-סמיע': 'كسرى-سميع', 'פקיעין': 'البقيعة', 'תפן': 'تيفن' };
const BRANCH_AR = { 'ים': 'البحر', 'נחלים': 'نحاليم', 'ציר 70': 'شارع 70', 'הר': 'الجبل' };
/** Arabic text for a template+role: real variant, else a marked draft (authority roles only), else null. */
function arVariant(tpl, role) {
  const real = tpl.variants.find((v) => v.role === role && v.lang === 'ar');
  if (real) return { text: real.text, draft: false };
  const d = (DATA.arDrafts || {})[tpl.id];
  const r = ROLE[role];
  if (d && r && r.group === 'authority' && (d[role] || d['*'])) return { text: d[role] || d['*'], draft: true };
  if (d && d[role]) return { text: d[role], draft: true };
  return null;
}
function baseValues(ev, auth, lang) {
  const now = new Date();
  if (lang === 'ar') {
    const au = auth ? (AUTH_AR[auth] || auth) : (ev ? ev.authorities.map((a) => AUTH_AR[a] || a).join(' / ') : '');
    return { ...baseValues(ev, auth), 'רשות': au, 'יישוב': au, 'סוג_אירוע': ev ? (EV_AR[ev.typeId] || shortEv(ev.typeId)) : '', 'שלוחה': BRANCH_AR[ME().branch] || BR().the };
  }
  return {
    'שם_ראש_שלוחה': ME().name, 'טלפון_ראש_שלוחה': S.settings.phone || '', 'שלוחה': BR().the,
    'רשות': auth || (ev ? ev.authorities.join(' / ') : ''), 'יישוב': auth || (ev ? ev.authorities.join(' / ') : ''),
    'סוג_אירוע': ev ? shortEv(ev.typeId) : '', 'שעה': hhmm(now), 'תאריך': ddmmyyyy(now),
    ...Object.fromEntries(Object.entries(HOT).filter(([k, v]) => k !== 'verify' && v)),
  };
}
const fillTpl = (text, vals) => String(text).replace(/\{([^{}]+)\}/g, (m, k) => (vals[k] != null && vals[k] !== '' ? vals[k] : m));
const unfilled = (text) => [...new Set((String(text).match(/\{[^{}]+\}/g) || []).filter((p) => p !== '{שם_נמען}'))];
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';

// flyer file: bundled core flyers (flyers/*.jpg, cached offline). Catalog-only flyers have no file → text only.
const flyerName = (f) => f.id + '.jpg';
async function flyerFile(f) {
  if (!f || !f.file) return null;
  try { const r = await fetch(f.file); if (!r.ok) return null; const b = await r.blob(); return new File([b], flyerName(f), { type: b.type || 'image/jpeg' }); } catch (e) { return null; }
}
async function shareWithFile(text, file) {
  await copyText(text);
  try {
    if (file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return 'shared'; }
    if (navigator.share) { await navigator.share({ text }); return 'shared-text'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  return 'copied';
}

// ───────────── domain: report / summary ─────────────
function buildReport(ev, needs) {
  const dir = S.contacts.find((c) => c.role === 'center_director');
  const items = allItems(ev);
  const done = items.filter((i) => ev.done[i.id]).sort((a, b) => ev.done[a.id] - ev.done[b.id]);
  const open = (EVT[ev.typeId].checklist[ev.phase] || []).filter((i) => !ev.done[i.id]);
  const phName = PHASES.find((p) => p.id === ev.phase).name;
  const notes = ev.log.filter((l) => l.kind === 'note').slice(-5);
  const prevDays = (ev.history || []).reduce((n, h) => n + Object.keys(h.done).length, 0);
  const L = [];
  L.push(`${firstName(dir ? dir.name : 'עדי')}, דיווח ${ev.reports ? 'שוטף' : 'ראשוני'} – ${shortEv(ev.typeId)}, ${ev.authorities.join(', ')}, ${hhmm(Date.now())}.`);
  L.push(ev.mode === 'ongoing' ? `אירוע מתמשך – יום ${ev.day} (מאז ${whenLabel(ev.startedAt)}).` : `אירוע נקודתי, החל ${whenLabel(ev.startedAt)}.`);
  const qa = q6Lines(ev);
  if (qa.length) { L.push(''); L.push(`*בירור ראשוני (${qa.length}/6):*`); qa.forEach((x) => L.push(x)); }
  L.push('');
  L.push(`*מה בוצע (${done.length}):*`);
  done.forEach((i) => L.push(`• ${i.text} (${hhmm(ev.done[i.id])})`));
  if (!done.length) L.push('• עדיין לא סומנו פעולות');
  if (prevDays) L.push(`• בימים קודמים: ${prevDays} פעולות`);
  L.push('');
  L.push(`*פתוח בשלב "${phName}" (${open.length}):*`);
  open.slice(0, 6).forEach((i) => L.push(`• ${i.text}`));
  if (open.length > 6) L.push(`• ועוד ${open.length - 6}`);
  if (notes.length) { L.push(''); L.push('*עדכונים מהשטח:*'); notes.forEach((n) => L.push(`• ${hhmm(n.t)} ${n.text}`)); }
  L.push(''); L.push('*מה צריך:* ' + (needs && needs.trim() ? needs.trim() : '{מה_צריך}'));
  L.push('*הערכת מצב הבאה:* ' + whenLabel(nextAssessment()));
  L.push(''); L.push(`${ME().name}, ראש ${BR().name}`);
  return L.join('\n');
}
function durText(ms) { const h = Math.floor(ms / 36e5); if (h < 1) return 'פחות משעה'; if (h < 48) return h === 1 ? 'כשעה' : 'כ-' + h + ' שעות'; return 'כ-' + Math.round(h / 24) + ' ימים'; }
function buildSummary(ev) {
  const items = allItems(ev);
  const doneAll = new Map();
  (ev.history || []).forEach((h) => Object.keys(h.done).forEach((id) => doneAll.set(id, true)));
  Object.keys(ev.done).forEach((id) => doneAll.set(id, true));
  const doneTxt = items.filter((i) => doneAll.has(i.id)).map((i) => i.text);
  const msgs = ev.log.filter((l) => l.kind === 'msg').length;
  const notes = ev.log.filter((l) => l.kind === 'note').map((l) => l.text);
  const asses = S.assessments.filter((a) => a.eventId === ev.id);
  const ins = [...new Set(asses.flatMap((a) => a.result.insights.map((i) => i.text)))].slice(0, 6);
  const recs = [...new Set(asses.flatMap((a) => a.result.recs.map((r) => r.text)))].slice(0, 6);
  const openRec = (EVT[ev.typeId].checklist.recovery || []).filter((i) => !doneAll.has(i.id)).map((i) => i.text);
  const d = new Date(ev.startedAt), end = ev.closedAt || Date.now();
  const L = [];
  L.push(`סיכום והמלצות לרשות – ${shortEv(ev.typeId)} ב${ev.authorities.join(', ')}`);
  L.push(`מרכז חוסן אשכול גליל מערבי | ${MONTHS[new Date(end).getMonth()]} ${new Date(end).getFullYear()}`);
  L.push(''); L.push('סיכום האירוע');
  L.push(`ב-${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}, בשעה ${hhmm(d)}, החל אירוע "${EVT[ev.typeId].name}" ב${ev.authorities.join(', ')}. האירוע הוגדר כ${ev.mode === 'ongoing' ? 'מתמשך' + (ev.day > 1 ? ' (' + ev.day + ' ימים)' : '') : 'נקודתי'} ונמשך ${durText(end - ev.startedAt)}.`);
  if (notes.length) L.push('מהשטח: ' + notes.filter((n) => !n.startsWith('בירור – ')).join('; ') + '.');
  const qa = q6Lines(ev); if (qa.length) { L.push('בירור ראשוני:'); qa.forEach((x) => L.push(x)); }
  L.push('[להשלמה: מה קרה, נפגעים, מסגרות ואוכלוסיות שנחשפו, פערים שעלו]');
  L.push(''); L.push('פעולות שנעשו על ידי מרכז החוסן');
  L.push(doneTxt.length ? doneTxt.join('; ') + '.' : '[להשלמה]');
  if (msgs) L.push(`נשלחו ${msgs} הודעות לבעלי תפקידים ולגורמים ברשות.`);
  L.push(''); L.push('תובנות מרכזיות');
  if (ins.length) ins.forEach((t) => L.push('• ' + t)); else L.push('[להשלמה – לפי הערכות המצב]');
  L.push(''); L.push('המלצות');
  const R = recs.length ? recs : openRec.slice(0, 4);
  if (R.length) R.forEach((t, i) => L.push(`${i + 1}. ${t}`)); else L.push('[להשלמה]');
  L.push(''); L.push('חידוד נהלים והפקת לקחים');
  L.push('[להשלמה אחרי תחקיר ה-AAR, 24–48 שעות מסיום האירוע]. לבדיקה מול לקחי אורט מעלות: חמ"ל ומנהל אירוע מוגדרים מראש, תמונת מצב אחת מאומתת, רשימות מעודכנות, נוהל עדכון הורים ומשפחות, נוהל בשורה מרה, מענה לתקשורת, מיפוי קבוע של מעגלי הפגיעות כולל חינוך בלתי פורמלי ורשויות שותפות.');
  L.push(''); L.push('לסיכום, אנו ממליצים על הקמת פורום רשותי של כל בעלי התפקידים הרלוונטיים, בליווי מרכז החוסן. הדבר יאפשר ניהול מתמשך, מתואם ורב-מערכתי של השלכות האירוע, תוך זיהוי צרכים משתנים, הבטחת רציפות המענים, חיזוק החוסן הקהילתי והפקת לקחים להמשך.');
  L.push(''); L.push(`${ME().name}, ראש ${BR().name}, מרכז חוסן גליל מערבי`);
  return L.join('\n');
}

// ───────────── domain: group intake parser (local, regex) ─────────────
const HEB_NUM = { 'אחד': 1, 'אחת': 1, 'שני': 2, 'שתי': 2, 'שניים': 2, 'שלושה': 3, 'שלוש': 3, 'ארבעה': 4, 'ארבע': 4, 'חמישה': 5, 'חמש': 5, 'שישה': 6, 'שש': 6, 'שבעה': 7, 'שבע': 7, 'שמונה': 8, 'תשעה': 9, 'תשע': 9, 'עשרה': 10, 'עשר': 10, 'שנים עשר': 12, 'שתים עשרה': 12 };
const WD = { 'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6 };
function inferYear(d, m, today = new Date()) {
  let y = today.getFullYear(); const dt = new Date(y, m - 1, d);
  if (dt.getTime() < startOfDay(today).getTime() - 60 * 864e5) y++;
  return y;
}
// ---- facilitators & settlements (from the real tracking sheet: content/facilitators.json) ----
const nrm = (x) => String(x || '').replace(/[׳`]/g, "'").replace(/['"״]/g, '').replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim();
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
const ACT_N = new Set([...ACTIVITIES, ...DATA.facil.activities].map(nrm));
const isWeakFac = (n) => { const t = nrm(n); return t.split(' ').length < 2 || ACT_N.has(t) || /[()\/]|צעדים|^אונ|מרכז|פוטו|רופאי|באובב|דוג ?זון/.test(n); };
const FACS = DATA.facil.facilitators.map((f) => ({ n: f.n, h: f.h, s: f.s, weak: isWeakFac(f.n), k: nrm(f.n) }));
function facScore(q, f) { const a = nrm(q); if (!a) return 0; if (a === f.k) return 1; const qt = a.split(' '), ft = f.k.split(' '); if (qt.every((t) => ft.includes(t))) return 0.86; if (f.k.startsWith(a)) return 0.84; const d = lev(a, f.k); return 1 - d / Math.max(a.length, f.k.length); }
function matchFacilitator(name) {
  const a = nrm(name); if (!a) return null;
  const ex = FACS.find((f) => f.k === a); if (ex) return { f: ex, exact: true };
  let best = null, bs = 0; FACS.forEach((f) => { const sc = facScore(a, f) - (f.weak ? 0.05 : 0); if (sc > bs) { bs = sc; best = f; } });
  return best && bs >= 0.78 ? { f: best, exact: false, score: bs } : null;
}
function facSuggestions(q) {
  const a = nrm(q);
  let list = a ? FACS.map((f) => ({ f, sc: f.k.includes(a) ? 0.9 + (f.k.startsWith(a) ? 0.05 : 0) : facScore(a, f) })).filter((x) => x.sc >= 0.6) : FACS.map((f) => ({ f, sc: 0.5 }));
  list.sort((x, y) => (x.f.weak - y.f.weak) || (y.sc - x.sc) || (y.f.s - x.f.s));
  const strong = list.filter((x) => !x.f.weak).slice(0, 6), weak = list.filter((x) => x.f.weak).slice(0, a ? 3 : 0);
  return strong.concat(weak).map((x) => x.f);
}
const AUTH_ALL = Object.values(BRANCHES).flatMap((b) => b.authorities);
const KNOWN_PLACES = new Set([...FACS.map((f) => nrm(f.h)).filter(Boolean), ...AUTH_ALL.map(nrm), ...Object.values(DATA.facil.settlements).flat().map(nrm), 'טבעון', 'קריית טבעון', 'חיפה', 'כרמיאל', 'נצרת', 'עכו', 'נהריה']);
const AUTH_OF_BRANCH = Object.fromEntries(Object.entries(BRANCHES).flatMap(([bn, b]) => b.authorities.map((a) => [a, bn])));
const SETT_LIST = Object.entries(DATA.facil.settlements).flatMap(([a, l]) => l.map((s) => ({ s, a }))).sort((x, y) => y.s.length - x.s.length);
const authNames = (a) => [a, ...(AUTH_ALIASES[a] || []), ...((DATA.facil.authAliases || {})[a] || [])];
function placeRe(w) { return new RegExp('(^|\\s)[בלמוה]?' + escRe(nrm(w)) + '(?=\\s|$)'); }
function parseIntake(raw, user) {
  const br = BRANCHES[user.branch];
  const text = String(raw || '').replace(/[‏‎]/g, '').replace(/[–—]/g, '-').replace(/״/g, '"').replace(/׳/g, "'");
  const F = {}, flag = {}, warn = [];
  const set = (k, v, how = 'ok') => { F[k] = v; flag[k] = how; };
  // hours
  let rest = text;
  const hm = text.match(/(\d{1,2})[:.](\d{2})\s*(?:-|עד|ל-?)\s*(\d{1,2})[:.](\d{2})/);
  if (hm) { set('hours', `${pad2(hm[1])}:${hm[2]}-${pad2(hm[3])}:${hm[4]}`); rest = rest.replace(hm[0], ' '); }
  else { const h1 = text.match(/בשעה\s*(\d{1,2})[:.](\d{2})/); if (h1) { set('hours', `${pad2(h1[1])}:${h1[2]}-`, 'inferred'); warn.push('צוינה רק שעת התחלה – השלם שעת סיום'); rest = rest.replace(h1[0], ' '); } else set('hours', '', 'missing'); }
  // dates
  const dates = []; const dre = /(^|[^\d])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?!\d)/g; let m;
  while ((m = dre.exec(rest))) { const d = +m[2], mo = +m[3]; if (d < 1 || d > 31 || mo < 1 || mo > 12) continue; let y = m[4] ? +m[4] : inferYear(d, mo); if (y < 100) y += 2000; dates.push(new Date(y, mo - 1, d)); }
  // weekday
  const wm = text.match(/(?:בימי|ביום|ימי|יום|כל יום)\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)(?![א-ת])/);
  const wd = wm ? WD[wm[1]] : null;
  if (wm) set('weekday', wm[1]); else set('weekday', '', dates.length ? 'ok' : 'missing');
  // count
  let count = null; const cm = text.match(/(\d{1,2})\s*(?:מפגשים|מפגשי|פגישות|מפגש)/);
  if (cm) count = +cm[1];
  else { const cw = text.match(/(שנים עשר|שתים עשרה|אחד|שתי|שני|שלושה|שלוש|ארבעה|ארבע|חמישה|חמש|שישה|שש|שבעה|שבע|שמונה|תשעה|תשע|עשרה|עשר)\s+(?:מפגשים|מפגשי|פגישות)/); if (cw) count = HEB_NUM[cw[1]]; else if (/מפגש\s*(?:אחד|בודד)|חד[- ]?פעמי/.test(text)) count = 1; }
  // sessions dates
  let sessions = [];
  if (dates.length >= 2) { sessions = dates.slice(); if (count && count > dates.length) { const last = dates[dates.length - 1]; for (let i = dates.length; i < count; i++) { const d = new Date(last); d.setDate(d.getDate() + 7 * (i - dates.length + 1)); sessions.push(d); } } if (!count) count = sessions.length; }
  else if (dates.length === 1) { if (!count) { count = 1; flag.expected = 'inferred'; } for (let i = 0; i < count; i++) { const d = new Date(dates[0]); d.setDate(d.getDate() + 7 * i); sessions.push(d); } if (wd != null && dates[0].getDay() !== wd) warn.push(`תאריך ההתחלה ${ddmmyyyy(dates[0])} חל ביום ${DAYS[dates[0].getDay()]}, אבל בהודעה כתוב יום ${DAYS[wd]} – בדוק`); }
  else if (wd != null) { const d0 = startOfDay(new Date()); d0.setDate(d0.getDate() + ((wd - d0.getDay() + 7) % 7 || 7)); if (!count) count = 1; for (let i = 0; i < count; i++) { const d = new Date(d0); d.setDate(d.getDate() + 7 * i); sessions.push(d); } warn.push('לא צוין תאריך התחלה – הונח יום ' + DAYS[wd] + ' הקרוב'); flag.startDate = 'inferred'; }
  else warn.push('לא נמצאו תאריכים בהודעה – הוסף תאריך התחלה');
  set('expected', count ? String(count) : '', count ? (flag.expected || 'ok') : 'missing');
  F.startDate = sessions[0] ? ddmmyyyy(sessions[0]) : ''; flag.startDate = flag.startDate || (sessions[0] ? 'ok' : 'missing');
  // authority / settlement (settlement lists from the tracking sheet; spelling variants cleaned)
  let auth = '', sett = '';
  const nt = nrm(text.replace(/[,.;:!?()]/g, ' '));
  const hit = (w) => placeRe(w).test(nt);
  const aHit = AUTH_ALL.find((a) => authNames(a).some(hit));
  const sHit = SETT_LIST.find((x) => hit(x.s));
  if (sHit && (!aHit || aHit === sHit.a)) { auth = sHit.a; sett = sHit.s; } else if (aHit) { auth = aHit; sett = aHit; }
  if (auth && !br.authorities.includes(auth)) { warn.push(`"${sett}" שייך ל${auth} – ${BRANCHES[AUTH_OF_BRANCH[auth]].name}, לא לשלוחה שלך`); auth = ''; sett = ''; }
  set('authority', auth, auth ? 'ok' : 'missing'); set('settlement', sett, sett ? (sett === auth ? 'inferred' : 'ok') : 'missing');
  // location / institution
  const lm = text.match(/(?:^|[\s,(])ב(גן|בית\s*ה?ספר|ביה"ס|בי"ס|מועדון|מתנ"ס|מרכז|ספרייה|ספריה|תיכון|מקלט|אולם|ישיבה|אולפנה|פנימייה|פנימיה|מעון|מכללה|בניין|מבנה|קריית|היכל)\s+([^\s,.;]+)(?:\s+([^\s,.;]+))?/);
  if (lm) { let name = lm[2]; if (lm[3] && !/^[בלמו]/.test(lm[3]) && !br.authorities.includes(lm[3])) name += ' ' + lm[3]; let inst = (lm[1] + ' ' + name).replace(/\s+/g, ' '); set('location', inst + (sett ? ', ' + sett : '')); }
  else set('location', '', 'missing');
  // activity
  const act = ACTIVITIES.slice().sort((a, b) => b.length - a.length).find((a) => text.includes(a) || text.includes(a.replace('"', '')));
  if (act) set('activity', act); else { const am = text.match(/סדנ(?:ת|ה)\s+([^,.\n]+?)(?=\s+(?:ב|ל|עם|של)[א-ת]|[,.\n]|$)/); set('activity', am ? am[1].trim() : '', am ? 'inferred' : 'missing'); }
  // type
  const typ = /סדנ(?:ה|ת|אות)/.test(text) ? 'סדנה' : /הצגה|הצגת/.test(text) ? 'הצגה' : /זום|מקוון/.test(text) ? 'זום' : /ליווי|ייעוץ|יעוץ/.test(text) ? 'ליווי ויעוץ' : /הנחיה|הנחיית/.test(text) ? 'הנחיה' : '';
  set('type', typ || 'סדנה', typ ? 'ok' : 'inferred');
  // audience
  const AUD = [[/הורה\s*(?:ו|-)\s*ילד|הורים\s*וילד/, 'הורה וילד'], [/נשות\s*מילואימניקים|נשות\s*מילואים|בנות\s*זוג\s*של\s*מילואימניקים/, 'נשות מילואימניקים'], [/צוותי?\s*חינוך|גננות|מורים|מורות|צוות\s*הגן|צוות\s*בית\s*ה?ספר/, 'צוותי חינוך'], [/גיל\s*ה?שלישי|גיל\s*הזהב|ותיקים|ותיקות|קשישים|65\+/, 'גיל שלישי (65+)'], [/נוער|נערים|נערות|תיכון|חטיבת?\s*ביניים/, 'נוער (12-18)'], [/ילדים|ילדות|לילדי|ילדי\s*הגן|תלמידי\s*יסודי/, 'ילדים'], [/עו"ס|עובדות?\s*סוציאל/, 'עו"ס ברווחה'], [/מתנדבים|מתנדבות/, 'מתנדבים'], [/בעלי\s*תפקידים/, 'בעלי תפקידים ברשות'], [/צח"י|צוות\s*צח/, 'צוותים מובילים ביישוב/קיבוץ'], [/נשים/, 'נשים'], [/הורים/, 'הורים']];
  const au = AUD.find(([re]) => re.test(text)); set('audience', au ? au[1] : '', au ? 'ok' : 'missing');
  // participants
  const pm = text.match(/(\d{1,3})\s*(?:משתתפים|משתתפות|ילדים|ילדות|נשים|הורים|תלמידים|תלמידות|נערים|נערות|בני\s*נוער|ותיקים|גמלאים|אנשים|איש|מתנדבים|אנשי\s*צוות|גננות|מורים)/);
  set('participants', pm ? pm[1] : '', pm ? 'ok' : 'missing');
  // facilitator + residence
  let fac = '', res = '';
  const fm = text.match(/(?:ה?מנח(?:ה|ת)|ה?מטפל(?:ת)?|ה?מדריכ(?:ה)?)\s*:?\s*([^,.;\n(]+)/);
  if (fm) {
    const toks = fm[1].trim().split(/\s+/).slice(0, 5);
    // try every split "name | מ+place": prefer a split whose name matches the facilitators list
    let best = null;
    for (let k = Math.min(3, toks.length); k >= 1; k--) {
      const rest = toks.slice(k); if (rest.length && !/^מ-?[א-ת]/.test(rest[0])) continue;
      const m = matchFacilitator(toks.slice(0, k).join(' ')); const place = rest.join(' ').replace(/^מ-?/, '');
      const sc = (m ? (m.exact ? 2 : 1 + (m.score || 0)) : 0) + (place && KNOWN_PLACES.has(nrm(place)) ? 0.5 : 0);
      if (!best || sc > best.sc) best = { sc, name: toks.slice(0, k).join(' '), place };
    }
    if (best && best.sc > 0) { fac = best.name; res = best.place; }
    else { let idx = toks.findIndex((t, i) => i >= 2 && /^מ-?[א-ת]/.test(t)); if (idx < 0 && toks.length === 2 && /^מ-?[א-ת]/.test(toks[1]) && KNOWN_PLACES.has(nrm(toks[1].replace(/^מ-?/, '')))) idx = 1; if (idx >= 1) { fac = toks.slice(0, idx).join(' '); res = toks.slice(idx).join(' ').replace(/^מ-?/, ''); } else fac = toks.slice(0, 3).join(' '); }
  }
  const rm = text.match(/(?:גר|גרה|מתגורר|מתגוררת)\s+ב-?\s*([א-ת"' -]+?)(?=[,.)\n]|$)/); if (rm) res = rm[1].trim();
  let mf = fac ? matchFacilitator(fac) : null;
  if (!fac) { const f = FACS.find((x) => !x.weak && x.k.length >= 5 && placeRe(x.n).test(nrm(text.replace(/[,.;:!?()]/g, ' ')))); if (f) { mf = { f, exact: true }; fac = f.n; } }
  if (mf) {
    set('facilitator', mf.f.n, mf.exact ? 'ok' : 'matched'); if (!mf.exact) F._facOrig = fac;
    if (res) set('facResidence', res, 'ok'); else if (mf.f.h) set('facResidence', mf.f.h, mf.exact ? 'list' : 'matched'); else set('facResidence', '', 'missing');
    if (res && mf.f.h && nrm(res) !== nrm(mf.f.h)) warn.push(`בהודעה: ${res}. ברשימת המנחים: ${mf.f.h}`);
  } else { set('facilitator', fac, fac ? 'inferred' : 'missing'); set('facResidence', res, res ? 'ok' : 'missing'); if (fac) F._facNew = true; }
  // defaults
  set('funder', 'משרד הבריאות', 'inferred'); set('domain', 'קהילתי', 'inferred'); set('notes', '', 'ok');
  return { F, flag, warn, sessions: sessions.map((d) => ddmmyyyy(d)), g15: sessions.map(() => '') };
}
function regenSessions(I) {
  const d0 = parseDMY(I.F.startDate), n = Math.max(0, Math.min(60, parseInt(I.F.expected, 10) || 0));
  if (!d0 || !n) { I.sessions = []; I.g15 = []; return; }
  I.sessions = Array.from({ length: n }, (_, i) => { const d = new Date(d0); d.setDate(d.getDate() + 7 * i); return ddmmyyyy(d); });
  I.g15 = Array.from({ length: n }, (_, i) => (I.g15 || [])[i] || '');
}
function rowFor(F, date, i, n, g15) {
  const d = parseDMY(date);
  return [F.funder, F.authority, F.settlement, F.location, F.domain, F.activity, F.type, String(n), F.audience, F.participants, String(i + 1), F.facilitator, F.facResidence, date, F.hours, g15 || '', 'תואם', F.notes, '', '', '', d ? MONTHS[d.getMonth()] : '', ''];
}

// ───────────── domain: assessment engine (local rules from assessment.md) ─────────────
const RULES = [
  { re: /בכי|קיפאון|קפואים|בלבול|מבולבלים|הלם|היסטרי|צרחות|חרדה חריפה|התקף חרדה/, dim: 'מעגלי פגיעות', ins: 'יש אנשים במצוקה אקוטית בשטח – זה מעגל הפגיעה הראשון וזקוק למענה מיידי.', recs: [{ text: 'הצע לרשות צוות סיוע נפשי ראשוני (מעש"ה) לאנשים במצוקה אקוטית.', svc: 'svc_maase', owner: 'branch_team', leg: 'טיפולית', max: 48 }, { text: 'מי שהמצוקה שלו נמשכת – הפנה לנוהל חרדה דרך מתאמת השלוחה.', svc: 'svc_anxiety_protocol', owner: 'clinical_coordinator', leg: 'טיפולית', min: 336 }], src: 'MAASE; KURS; HAREDA' },
  { re: /מוצפ|עמוס|עומס|לא יודעים מה לעשות|ביקש(?:ה|ו)? עזרה|ביקש(?:ה|ו)? ליווי|מנהלת הרווחה ביקשה|מבקשים עזרה/, dim: 'שלוש הרגליים', ins: 'בעלי תפקידים ברשות מבקשים עזרה או מוצפים – הרגל הרשותית דורשת ליווי צמוד.', recs: [{ text: 'חבר את בעלי התפקידים לאיש מקצוע ממשאבים שילווה אותם בשלבים הבאים.', svc: 'svc_role_consult', owner: 'maashavim_expert', leg: 'רשותית', tpl: 'T_CONNECT_EXPERT' }], src: 'TZT24; KATALOG' },
  { re: /צוות(?:ים)? (?:ש)?פעל|כוחות|מגיבים ראשונים|חובשים|צוותי ההצלה|היו בזירה|הגיעו לזירה|פינו פצועים/, dim: 'שחיקת צוות', ins: 'צוותים פעלו בזירה – חשופים לטראומטיזציה משנית.', recs: [{ text: 'הצע דיפיוזינג (נטרול) לצוותים שפעלו בזירה.', svc: 'svc_defusing', owner: 'maashavim_expert', leg: 'רשותית', max: 12 }, { text: 'תאם מפגש מענה ראשוני "בתפירה אישית" לצוותים ולמתנדבים שנחשפו.', svc: 'svc_first_response', owner: 'welfare_manager', leg: 'קהילתית', min: 48, max: 336 }], src: 'DIBUV; KATALOG' },
  { re: /נכחו|עדים|ראו את|היו במקום|חוו את/, dim: 'מעגלי פגיעות', ins: 'יש קבוצה שנכחה באירוע (מעגל ראשון). מיון לפי מעגלי פגיעות קובע מי צריך מענה פרטני ומי קבוצתי.', recs: [{ text: 'הצע דיבוב קבוצתי לבני 18+ שנכחו באירוע; מפגש שני כשבועיים אחרי.', svc: 'svc_debriefing', owner: 'welfare_manager', leg: 'טיפולית', min: 48, max: 336 }, { text: 'למי שחשיפה הדדית מסוכנת לו או שעבר חלון הדיבוב – MSI קבוצתי בכלים יצירתיים.', svc: 'svc_msi', owner: 'shefach', leg: 'טיפולית', min: 48 }], src: 'KATALOG; DIBUV; ORT26' },
  { re: /שמוע|ברשת|פייסבוק|וואטסאפ|פייק|לא ברור מה קרה|סותר|מידע לא מדויק|ואקום/, dim: 'פערי מידע ותיאום', ins: 'יש שמועות או מידע סותר בקהילה – רציפות קוגניטיבית מעורערת. "בוואקום מידע נוצרות שמועות".', basisRumor: true, recs: [{ text: 'הצע לדוברות הרשות מסר מאומת לפי CERC (מה קרה, מה עושים, למי פונים, מתי העדכון הבא) עם הפניה למוקד.', svc: 'svc_briefing', owner: 'ceo_authority', leg: 'רשותית', tpl: 'T_RESIDENTS_HOTLINE' }], risk: { text: 'שמועות יגבירו חרדה ויפגעו באמון ברשות.', ifNotHandled: 'עלייה בפניות ובהימנעות' }, src: 'DIBUV; KURS; ORT26' },
  { re: /ילדים|תלמידים|בית ספר|בית הספר|גן |גנים|כיתות/, dim: 'אוכלוסיות פגיעות', ins: 'ילדים ותלמידים מושפעים – הורים וצוותי חינוך הם מעגל התמיכה הקרוב.', recs: [{ text: 'שלח להורים דרך מחלקת החינוך את דף "איך משוחחים עם ילדים" בעברית ובערבית.', svc: null, owner: 'education_manager', leg: 'קהילתית', tpl: 'T_PARENTS_GUIDE' }, { text: 'לגנים ולכיתות א\'–ב\': הצע "מה עוזר לי כשקשה לי" או משחקי אדמה.', svc: 'svc_earth_games', owner: 'education_manager', leg: 'קהילתית', min: 48 }], src: 'HASB-KIDS; KATALOG' },
  { re: /הורים (?:מוצפים|לחוצים|בלחץ|חרדים|כועסים)|הורים הגיעו|הורים חיכו/, dim: 'מעגלי פגיעות', ins: 'הורים במצוקה – מעגל שני שזקוק למידע ולהדרכה.', recs: [{ text: 'הצע הדרכת הורים ("הורות ב-6 ערוצים") וחומרי הסברה להורים.', svc: 'svc_parenting6', owner: 'education_manager', leg: 'קהילתית' }], src: 'KATALOG; HASB-KIDS' },
  { re: /קשיש|ותיקים|ערירי|מוגבלות|נכים|סיעוד|חינוך מיוחד|נתמכי נשימה|ניצולי שואה|עולים/, dim: 'אוכלוסיות פגיעות', ins: 'יש אוכלוסיות פגיעות – צריך לוודא רשימות מעודכנות ואיתור אקטיבי.', recs: [{ text: 'הצע לרווחה לוודא רשימות מעודכנות (כולל רשימות "כספת") ואיתור אקטיבי של אוכלוסיות פגיעות.', svc: null, owner: 'welfare_manager', leg: 'קהילתית', tpl: 'T_VULNERABLE_OUTREACH' }], src: 'TORA21; MUGBAL; MCHL25' },
  { re: /שחיק|עייפ|מותש|תשושים|שחוק|לא ישנו|עובדים ברצף|עובדי הרווחה/, dim: 'שחיקת צוות', ins: 'סימני שחיקה בצוותי הרשות – הערכת מצב אוכלוסייה כוללת גם את הצוות.', recs: [{ text: 'הצע "מי יציל את המציל" / חוסן רשותי לעובדי הרווחה, ותכנון משמרות ונקודת שקט לצוות.', svc: 'svc_save_savior', owner: 'welfare_manager', leg: 'רשותית' }], risk: { text: 'שחיקת הצוותים תפגע ברציפות המענים לתושבים.', ifNotHandled: 'היעדרויות וטעויות' }, src: 'SAGAT; MCHL25; KATALOG' },
  { re: /מגויס|מילואים|מילואימניק|בני זוג|בנות זוג/, dim: 'משאבים', ins: 'משפחות של מגויסים בקהילה – קהל עם צרכים מתמשכים.', recs: [{ text: 'הצע קבוצות לבנות ובני זוג של מגויסים ולאמהות.', svc: 'svc_reservist_groups', owner: 'welfare_manager', leg: 'קהילתית' }], src: 'KRIT; HASB-SEC' },
  { re: /מלון|מלונות|מפונים|פונו/, dim: 'משאבים', ins: 'קהילה מפונה – צריך רציפות קהילתית ותפקודית גם מחוץ לבית.', recs: [{ text: 'תאם סיירת רכזים / זמן יקר במלונות.', svc: 'svc_coord_patrol', owner: 'branch_head', leg: 'קהילתית' }], src: 'OCT24' },
  { re: /חוזרים הביתה|חזרה הביתה|חזרה מפינוי|חזרו ליישוב/, dim: 'רציפויות', ins: 'קהילה בשלב חזרה – רציפות היסטורית ותפקודית מתחדשת, עם קצב שונה לכל אחד.', recs: [{ text: 'הצע ליווי שלב המעבר ("הדרך בה רציתי לשוב בחזרה").', svc: 'svc_way_back', owner: 'welfare_manager', leg: 'קהילתית' }], src: 'MAAVAR; KATALOG; GALGAL' },
  { re: /שני חמ"לים|כמה חמ"לים|אין מנהל אירוע|רשימות לא מעודכנות|לא היו רשימות|חוסר תיאום|בלגן|כאוס|אין תמונת מצב/, dim: 'פערי מידע ותיאום', ins: 'פערי תיאום ושליטה (כמו באורט מעלות) – אין מנהל אירוע אחד או תמונת מצב אחת מאומתת.', recs: [{ text: 'הצע לרשות מנהל אירוע אחד, חמ"ל אחד ותמונת מצב אחת מאומתת (ידיעה מול עובדה).', svc: null, owner: 'ceo_authority', leg: 'רשותית', tpl: 'T_SITREP_AUTHORITY' }, { text: 'בשלב השיקום: פורום רשותי בליווי מרכז החוסן לחידוד נהלים.', svc: 'svc_authority_forum', owner: 'ceo_authority', leg: 'רשותית', min: 168 }], risk: { text: 'החלטה בלי בעלים וזמן יעד "היא לא משימה, היא רצון".', ifNotHandled: 'משימות נופלות בין הכיסאות' }, src: 'ORT26; KURS; TORA21' },
  { re: /כעס|זעם|מאשימים|חוסר אמון|מתוסכלים|תסכול/, dim: 'זעם ואמון', ins: 'כעס וחוסר אמון בקהילה – המענה הוא שקיפות, אחריותיות ו-one stop shop.', recs: [{ text: 'הצע להנהלת הרשות "גלגל תנופה" ומסרים שקופים ("תבדקו אותי, תהיו שותפים").', svc: 'svc_galgal', owner: 'ceo_authority', leg: 'רשותית', min: 72 }], src: 'GALGAL' },
  { re: /הרוג|נהרג|נהרגה|נפטר|הלוויה|הלוויות|שכול|אובדן|הרוגים/, dim: 'מעגלי פגיעות', ins: 'יש אובדן – מעגל חברתי ופסיכולוגי רחב, וצורך בצוות הודעה (בשורה מרה).', recs: [{ text: 'ודא עם הרווחה שקיים צוות הודעה (בשורה מרה) ומעגלי תמיכה למשפחות.', svc: null, owner: 'welfare_manager', leg: 'טיפולית' }], src: 'BSHORA; MCHL25' },
  { re: /שבועיים|ממשיכים לסבול|סיוטים|לא ישנים|לא מתפקד|נמשכת/, dim: 'מעגלי פגיעות', ins: 'מצוקה שנמשכת לאורך זמן – זו סיבה להפנות לטיפול.', recs: [{ text: 'הפנה לנוהל חרדה (מתחת לגיל 6: "מדברים ביחד") דרך מתאמת השלוחה.', svc: 'svc_anxiety_protocol', owner: 'clinical_coordinator', leg: 'טיפולית' }], src: 'HAREDA; HASB-KIDS' },
  { re: /רשימת המתנה|רשימות המתנה|המתנה ארוכה/, dim: 'שלוש הרגליים', ins: 'רשימות המתנה ארוכות – כדאי לפתוח מענים קבוצתיים.', recs: [{ text: 'בדוק עם מתאמת השלוחה קבוצה טיפולית בנוהל חרדה והדרכת הורים.', svc: 'svc_anxiety_group', owner: 'clinical_coordinator', leg: 'טיפולית' }], src: 'CLINIC' },
  { re: /מסגרות סגורות|ממ"ד|מקלט|אזעקות|נשארים בבית|אין לימודים/, dim: 'רציפויות', ins: 'מסגרות סגורות ושהייה במרחב מוגן – הרציפות התפקודית קטועה.', recs: [{ text: 'הנגש סל מענים מרחוק וסדרת וובינרים; לילדים בבית – "זום של חלום".', svc: 'svc_remote_basket', owner: 'branch_head', leg: 'קהילתית' }], src: 'OCT24' },
];
const SAFETY_ABUSE = /פגיעה מינית|תקיפה מינית|אלימות במשפחה|אלימות במשפחתה|הזנחת (?:ילד|קטין|חסרי ישע)|התעללות/;
const SAFETY_LIFE = /אובדנ|התאבד|כאב בחזה|קושי בנשימה|סכנת חיים/;
const Q6_KW = {
  q1: /נפילה|אזעקה|פיגוע|שריפה|רעידת|ירי|פיצוץ|טיל|רקטה|תאונה|חדירה|פינוי|האיום|איום|אירוע/,
  q2: /רווחה|קב"ט|מנכ"ל|חינוך|שפ"ח|צח"י|פקע"ר|משטרה|מד"א|כיבוי|ראש העיר|ראש המועצה|שותפ|יקל"ר|מל"ח/,
  q3: /צורך|צרכים|ביקש|מבקש|זקוק|חסר|נדרש/,
  q4: /משאב|מתנדב|מוקד|נאמני|זמינ|קיים|יש לנו|כוח אדם/,
  q5: /באחריות|אחריות|לוקחים על עצמנו|אנחנו נטפל|נטפל|מטפלים|לא שלנו|שייך ל/,
  q6: /עכשיו|(?:^|[\s,.])מיד(?:י|ית)?(?=[\s,.]|$)|בהמשך|מחר|השבוע|לטווח|בשלב הבא/,
};
function analyze(text, ctx) {
  const answers = ctx.q6 || {};
  const qaText = DATA.events.questions6.filter((q) => String(answers[q.id] || '').trim()).map((q) => answers[q.id]).join(' . ');
  const t = String(text || '') + (qaText ? ' . ' + qaText : '');
  const H = ctx.eventTime ? (Date.now() - ctx.eventTime) / 36e5 : null;
  const out = { phase: null, insights: [], recs: [], risks: [], questions: [], H };
  if (SAFETY_ABUSE.test(t)) {
    out.recs.push({ text: 'דווח מיידית למנהלת היחידה במשאבים (מועבר לפי חובת הדיווח). אין צעדים נוספים במסגרת זו.', svc: null, owner: 'maashavim_unit_manager', leg: 'טיפולית', timing: 'מיד', src: 'HARIG' });
    out.insights.push({ text: 'עלה חשד לפגיעה – מסלול דיווח בלבד, בלי פרטים מזהים בוואטסאפ.', dim: 'מעגלי פגיעות', basis: 'ידיעה' });
    return out;
  }
  if (H != null) out.phase = H < 12 ? 'immediate' : H < 168 ? 'initial' : H < 720 ? 'ongoing' : 'recovery';
  if (SAFETY_LIFE.test(t)) out.recs.push({ text: 'סכנה מיידית לחיים: פנה ל-101 / 100 ולגורמי החירום לפני כל צעד אחר.', svc: null, owner: 'branch_head', leg: 'טיפולית', timing: 'מיד', src: 'STRESS; HARIG' });
  const rumor = /לא מאומת|כנראה|ייתכן|אומרים ש|לא ברור אם/.test(t);
  const seen = new Set();
  for (const r of RULES) {
    if (!r.re.test(t)) continue;
    if (out.insights.length < 5 && !out.insights.some((i) => i.text === r.ins)) out.insights.push({ text: r.ins, dim: r.dim, basis: r.basisRumor || rumor ? 'ידיעה' : 'עובדה', src: r.src });
    if (r.risk && out.risks.length < 4) out.risks.push({ ...r.risk, src: r.src });
    for (const rec of r.recs) {
      if (seen.has(rec.text)) continue;
      const timed = rec.min != null || rec.max != null;
      if (timed && H == null) { if (!out.questions.includes('מתי בדיוק קרה האירוע? בלי זה אין המלצות שתלויות בזמן (דיבוב, דיפיוזינג, MSI).')) out.questions.push('מתי בדיוק קרה האירוע? בלי זה אין המלצות שתלויות בזמן (דיבוב, דיפיוזינג, MSI).'); continue; }
      if (rec.min != null && H < rec.min) { if (rec.svc === 'svc_debriefing') out.notes = (out.notes || []).concat('דיבוב קבוצתי – רק מ-48 שעות מהאירוע (' + whenLabel(ctx.eventTime + 48 * 36e5) + ').'); continue; }
      if (rec.max != null && H > rec.max) continue;
      seen.add(rec.text);
      let timing = rec.timing || (rec.max === 12 ? 'עד 12 שעות מהאירוע (עד ' + hhmm(ctx.eventTime + 12 * 36e5) + ')' : rec.min === 48 && rec.max === 336 ? 'מ-48 שעות ועד כשבועיים' : rec.min === 48 ? 'מ-48 שעות, ללא הגבלה' : rec.max === 48 ? 'מיד, בתוך 48 השעות הראשונות' : SVC[rec.svc] ? SVC[rec.svc].timing : 'בהקדם');
      out.recs.push({ ...rec, timing, src: r.src });
    }
  }
  if (!/מוקד/.test(t) && (!out.phase || out.phase !== 'recovery')) out.recs.push({ text: 'הנגש את מוקד הסיוע הטלפוני לתושבים ולבעלי התפקידים (פלייר רק בתיאום עם היחידה הקלינית).', svc: 'svc_hotline', owner: 'branch_head', leg: 'טיפולית', timing: 'מיידי ומתמשך', tpl: 'T_RESOURCES_TO_AUTHORITY', src: 'NHL25; HASB-HOTLINE' });
  out.recs.push({ text: 'עדכן את מנהלת מרכז החוסן בתמונת המצב ובהמלצות.', svc: null, owner: 'center_director', leg: 'רשותית', timing: 'היום', tpl: 'T_REPORT_DIRECTOR', src: 'NHL25' });
  if (out.phase === 'recovery' || (ctx.closed)) out.recs.push({ text: 'קבע תחקיר הפקת לקחים (AAR) בתוך 24–48 שעות מסיום האירוע.', svc: null, owner: 'branch_head', leg: 'רשותית', timing: '24–48 שעות מהסיום', src: 'KURS' });
  out.recs = out.recs.slice(0, 7);
  DATA.events.questions6.forEach((q) => { if (!String(answers[q.id] || '').trim() && !Q6_KW[q.id].test(t)) out.recs.push({ text: 'חסר בירור: ' + q.q, svc: null, owner: 'branch_head', leg: 'רשותית', timing: 'מיד', src: 'IDIT', miss: true }); });
  if (!/פצוע|נפגע|הרוג|נהרג|אין פצועים|ללא נפגעים/.test(t)) out.questions.push('האם יש נפגעים (מספר, גילאים) או הרוגים?');
  if (!/רווחה|קב"ט|מנכ"ל|חינוך|שפ"ח|ראש העיר|ראש המועצה/.test(t)) out.questions.push('עם אילו בעלי תפקידים ברשות כבר יש קשר?');
  if (!out.insights.length) out.insights.push({ text: 'לא זוהו בסיכום ממצאים לפי הממדים המקצועיים. כדאי לפרט: מי נחשף, מה ביקשה הרשות, מצב הצוותים ומה ידוע מול מה שמועה.', dim: 'שלב', basis: 'עובדה' });
  out.questions = out.questions.slice(0, 4);
  return out;
}

// ───────────── domain: "נתח עם Claude" (user's own claude.ai subscription – no API) ─────────────
const CL = DATA.claude;
const CLAUDE_URL_MAX = 6000;
const redact = (t) => String(t || '')
  .replace(/(?:\+?972[-\s]?|0)(?:[2-9]|5\d|7\d)[-\s]?\d{3}[-\s]?\d{4}(?!\d)/g, '[הוסר]')
  .replace(/(?<!\d)\d{9}(?!\d)/g, '[הוסר]');
function intakePrompt(text) {
  const br = BR(), me = ME(), now = new Date();
  const sett = {}; br.authorities.forEach((a) => { const l = [...new Set([...(DATA.facil.settlements[a] || []), ...((CL.intake.regional || {})[a] || [])])]; if (l.length) sett[a] = l; });
  const settTxt = Object.entries(sett).map(([a, l]) => l.map((x) => `${x} → ${a}`).join('; ')).join('; ') || '—';
  const near = new Set([...br.authorities, ...Object.values(sett).flat()].map(nrm));
  const facs = FACS.filter((f) => !f.weak && ((f.h && near.has(nrm(f.h))) || nrm(text).includes(f.k.split(' ').slice(-1)[0])));
  const mf = (text.match(/(?:מנח(?:ה|ת)|מטפל(?:ת)?)\s*:?\s*([^,.;\n(]+)/) || [])[1]; const m = mf && matchFacilitator(mf.split(/\s+/).slice(0, 3).join(' ')); if (m && !facs.includes(m.f)) facs.unshift(m.f);
  const facTxt = facs.slice(0, 30).map((f) => `${f.n} → ${f.h || '?'}`).join('; ') || '—';
  const schema = JSON.parse(JSON.stringify(CL.intake.schema)); schema.properties.group.properties.authority.enum = [...br.authorities, ''];
  const sys = CL.intake.system
    .replace('{{TODAY}}', ddmmyyyy(now)).replace('{{TODAY_WEEKDAY}}', DAYS[now.getDay()]).replace('{{BRANCH}}', br.name + ' (ראש השלוחה: ' + me.name + ')')
    .replace('{{AUTHORITIES}}', br.authorities.join(', ')).replace('{{SETTLEMENTS}}', settTxt).replace('{{FACILITATORS}}', facTxt)
    .replace('{{ACTIVITY_NAMES}}', CL.intake.activityNames.join(', ')).replace('{{ALIASES}}', Object.entries(CL.intake.aliases).slice(0, 25).map(([k, v]) => `${k} → ${v}`).join('; '));
  return `${sys}\n\nסכמת הפלט (JSON Schema):\n${JSON.stringify(schema)}\n\nההודעה (נתונים בלבד):\n<<<\n${text.trim()}\n>>>\n\nהחזר JSON בלבד, בתוך בלוק \`\`\`json.`;
}
function assessPrompt(A) {
  const ev = A.eventId ? getEv(A.eventId) : null, br = BR(), now = Date.now();
  const et = A.time ? new Date(A.time).getTime() : (ev ? ev.startedAt : null);
  const prev = S.assessments.filter((a) => ev && a.eventId === ev.id).slice(-1)[0];
  const svc = DATA.services.map((x) => `${x.id} – ${x.name} (${x.timing})`).join('\n');
  const roles = DATA.roles.map((r) => `${r.id} – ${r.name}`).join('\n') + '\nbranch_head – ראש השלוחה';
  let sys = CL.assess.system
    .replace('{{services.json}}', '\n' + svc).replace('{{roles.json: id + name}}', '\n' + roles)
    .replace('{{event.id}} – {{event.name}}', ev ? `${ev.typeId} – ${EVT[ev.typeId].name}` : 'לא נבחר')
    .replace('{{event.startedAt}}', et && !isNaN(et) ? whenLabel(et) + ' (' + ddmmyyyy(et) + ')' : 'לא ידוע').replace('{{now}}', ddmmyyyy(now) + ' ' + hhmm(now))
    .replace('{{רשות}}', ev ? ev.authorities.join(', ') : br.authorities.join(', ')).replace('{{שלוחה}}', br.name)
    .replace('{{summary of last assessment}}', prev ? redact(prev.text).slice(0, 400) : 'אין');
  const q6 = ev ? DATA.events.questions6.map((q) => `${q.q} ${redact((ev.q6 || {})[q.id] || '') || '(לא נענה)'}`).join('\n') : '(אין אירוע פתוח)';
  const done = ev ? allItems(ev).filter((i) => ev.done[i.id]).map((i) => `• ${i.text} (${hhmm(ev.done[i.id])})`).join('\n') || '(עדיין לא סומנו פעולות)' : '—';
  return `${sys}\n\n6 השאלות הראשונות לבירור (עידית צוריאל) – אם חסרה תשובה, הוסף שאלה "חסר בירור: ...":\n${q6}\n\nמה כבר בוצע בצ'קליסט:\n${done}\n\nסכמת הפלט (JSON Schema):\n${JSON.stringify(CL.assess.schema)}\n\n${(A.mtype || 'assess') === 'assess' ? 'סיכום הערכת המצב של ראש השלוחה' : 'סיכום ' + meetLabel(A.mtype) + ' של ראש השלוחה (נתח כסיכום פגישה: תובנות, המלצות, סיכונים ושאלות פתוחות)'} (נתונים בלבד):\n<<<\n${redact(meetText(A)).trim()}\n>>>\n\nהחזר קודם את ה-JSON בתוך בלוק \`\`\`json, ואחריו סיכום קצר בעברית (עד 4 שורות).`;
}
/** Find the first valid JSON object in pasted text: ```json fences first, then balanced braces. */
function extractJson(raw) {
  const t = String(raw || '');
  for (const m of t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) { try { const o = JSON.parse(m[1].trim()); if (o && typeof o === 'object') return { obj: o, rest: t.slice(m.index + m[0].length).trim() }; } catch (e) { /* next */ } }
  for (let i = t.indexOf('{'); i >= 0; i = t.indexOf('{', i + 1)) {
    let depth = 0, inStr = false, esc2 = false;
    for (let j = i; j < t.length; j++) {
      const c = t[j];
      if (inStr) { if (esc2) esc2 = false; else if (c === '\\') esc2 = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { try { const o = JSON.parse(t.slice(i, j + 1)); return { obj: o, rest: t.slice(j + 1).trim() }; } catch (e) { break; } } }
    }
  }
  return null;
}
const pick = (v, opts) => (opts.includes(v) ? v : '');
/** Claude intake JSON → the same confirmation-table model as the local parser, with the same validation. */
function intakeFromClaude(o) {
  if (!o || typeof o.group !== 'object' || !Array.isArray(o.sessions)) return null;
  const g = o.group, br = BR(), F = {}, flag = {}, warn = [];
  const inf = new Set(Array.isArray(g.inferredFields) ? g.inferredFields : []);
  const KEYMAP = { funder: 'funder', authority: 'authority', locality: 'settlement', location: 'location', domain: 'domain', activityName: 'activity', activityType: 'type', audience: 'audience', facilitator: 'facilitator', facilitatorResidence: 'facResidence', participants: 'participants', expectedSessions: 'expected', notes: 'notes' };
  const set = (k, v, src) => { F[k] = v == null ? '' : String(v).trim(); flag[k] = !F[k] ? (k === 'notes' ? 'ok' : 'missing') : inf.has(src) ? 'inferred' : 'ok'; };
  Object.entries(KEYMAP).forEach(([src, k]) => set(k, g[src], src));
  const chk = (k, opts, label) => { if (F[k] && !opts.includes(F[k])) { warn.push(`${label} "${F[k]}" אינו ערך מותר – בחר מהרשימה`); F[k] = ''; flag[k] = 'missing'; } };
  chk('funder', OPTS.funder, 'גורם מממן'); chk('domain', OPTS.domain.filter((x) => x !== 'מבוטלת'), 'תחום'); chk('type', OPTS.type, 'סוג פעילות'); chk('audience', OPTS.audience, 'קהל יעד');
  if (F.authority && !br.authorities.includes(F.authority) && !EXTRA_AUTH.includes(F.authority)) { warn.push(`הרשות "${F.authority}" אינה בשלוחה שלך`); F.authority = ''; flag.authority = 'missing'; }
  if (F.participants && !/^\d+$/.test(F.participants)) { F.participants = (F.participants.match(/\d+/) || [''])[0]; flag.participants = F.participants ? 'inferred' : 'missing'; }
  if (F.facilitator) { const m = matchFacilitator(F.facilitator); if (m && !m.exact) { F._facOrig = F.facilitator; F.facilitator = m.f.n; flag.facilitator = 'matched'; } else if (!m) F._facNew = true, flag.facilitator = 'inferred'; if (m && !F.facResidence && m.f.h) { F.facResidence = m.f.h; flag.facResidence = 'list'; } }
  const ses = o.sessions.map((x) => ({ d: parseDMY(String(x && x.date || '')), h: String(x && x.hours || '') })).filter((x) => { if (!x.d) { warn.push('תאריך לא תקין בתשובה – דולג'); return false; } return true; }).sort((a, b) => a.d - b.d);
  const hrs = [...new Set(ses.map((x) => x.h).filter(Boolean))];
  F.hours = hrs[0] && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(hrs[0]) ? hrs[0] : ''; flag.hours = F.hours ? 'ok' : 'missing';
  if (hrs.length > 1) warn.push('שעות שונות במפגשים (' + hrs.join(', ') + ') – בטבלה נכתבות ' + (F.hours || '—') + '. תקן לפי הצורך');
  F.startDate = ses[0] ? ddmmyyyy(ses[0].d) : ''; flag.startDate = F.startDate ? 'ok' : 'missing';
  F.weekday = ses[0] ? DAYS[ses[0].d.getDay()] : ''; flag.weekday = F.weekday ? 'ok' : 'missing';
  if (!F.expected) { F.expected = ses.length ? String(ses.length) : ''; flag.expected = ses.length ? 'inferred' : 'missing'; }
  (Array.isArray(o.warnings) ? o.warnings : []).forEach((w) => typeof w === 'string' && warn.push(w));
  (Array.isArray(o.missing) ? o.missing : []).forEach((m) => m && m.question && warn.push('שאלה: ' + m.question + (m.options && m.options.length ? ' (' + m.options.join(' / ') + ')' : '')));
  return { F, flag, warn, sessions: ses.map((x) => ddmmyyyy(x.d)), g15: ses.map(() => ''), by: 'claude' };
}
function assessFromClaude(o, rest) {
  if (!o || typeof o !== 'object') return null;
  const arr = (x) => (Array.isArray(x) ? x : []);
  const recsIn = arr(o.recommendations || o.recs);
  if (!arr(o.insights).length && !recsIn.length) return null;
  const txt = (x) => (typeof x === 'string' ? x : x && x.text ? String(x.text) : '');
  return {
    by: 'claude', phase: PHASES.some((p) => p.id === o.phase) ? o.phase : null, H: null,
    insights: arr(o.insights).map((i) => ({ text: txt(i), dim: (i && i.dimension) || '', basis: (i && i.basis) || '' })).filter((i) => i.text),
    recs: recsIn.map((r) => ({ text: txt(r), owner: (r && r.owner) || '', timing: (r && r.timing) || '', svc: (r && r.service) || null, leg: (r && r.leg) || '', miss: /^חסר בירור/.test(txt(r)) })).filter((r) => r.text),
    risks: arr(o.risks).map((r) => ({ text: txt(r), ifNotHandled: (r && r.ifNotHandled) || '' })).filter((r) => r.text),
    questions: arr(o.questions).map(txt).filter(Boolean),
    summary: String(rest || '').replace(/^[\s\-–:]+/, '').slice(0, 1200),
  };
}
function claudePanel(kind, C) {
  return `<div class="claude-box" id="cl-${kind}">
  ${C.manual ? `<label class="lbl" for="cl-manual">ההעתקה האוטומטית לא עבדה – סמן והעתק ידנית:</label><textarea class="ta" id="cl-manual" rows="5" readonly data-select>${esc(C.prompt)}</textarea>` : `<p class="muted small">${icon('check', 'ic-xs')} ${C.long ? 'הפרומפט הועתק – הדבק ב-Claude' : 'הפרומפט הועתק ונפתח ב-Claude'}</p>`}
  <label class="lbl" for="cl-paste-${kind}">הדבק כאן את התשובה של Claude</label>
  <textarea class="ta" id="cl-paste-${kind}" rows="5" data-in="cl-paste" data-k="${kind}" placeholder="העתק את כל התשובה מ-Claude והדבק כאן">${esc(C.paste || '')}</textarea>
  ${C.err ? `<div class="banner-demo" role="alert" style="background:var(--risk-bg);color:var(--live-ink)">${icon('alert', 'ic-s')}<span>${esc(C.err)}</span></div>` : ''}
  <div class="btn-row" style="margin-top:8px"><button class="btn btn-pri" data-act="cl-load" data-k="${kind}">טען תוצאה</button><button class="btn btn-out" data-act="cl-close" data-k="${kind}">סגור</button></div></div>`;
}
const claudeBtn = (kind) => `<a class="btn btn-out claude-btn" href="https://claude.ai/new" target="_blank" rel="noopener" data-act="cl-go" data-k="${kind}">${icon('bulb', 'ic-s')} נתח עם Claude</a>`;
const privacyLine = '<p class="muted small" style="margin-top:4px">לפני שליחה ל-Claude: לא לכלול שמות תושבים או פרטים מזהים.</p>';

// ───────────── views: shared parts ─────────────
const back = (href) => `<a class="ab-back" href="${href}" aria-label="חזרה">${icon('back')}</a>`;
const appBar = (title, sub, backHref, actions = '') => `<header class="ab">${actions ? '' : `<img class="ab-mash" src="${LOGOS.maashavim}" alt="משאבים">`}${backHref ? back(backHref) : ''}<div class="ab-t"><div class="ab-title">${esc(title)}</div>${sub ? `<div class="ab-sub">${esc(sub)}</div>` : ''}</div>${syncSlot(true)}${presenceSlot()}${actions}</header>`;
function statusBar(ev) {
  return `<div class="sbar" role="status"><span class="live-dot"></span><span class="sb-live">אירוע פעיל</span><span>${esc(evTitle(ev))}</span><span class="sb-sep">|</span><span class="sb-k">${icon('clock', 'ic-xs')}<span data-elapsed="${ev.startedAt}">${elapsed(ev.startedAt)}</span></span><span class="sb-sep">|</span><span class="sb-k">הערכת מצב הבאה ${esc(whenLabel(nextAssessment()).replace('היום ', ''))}</span></div>`;
}
const tabbar = (on) => `<nav class="tabbar" aria-label="ניווט ראשי">${[['home', '#/home', 'בית'], ['book', '#/events', 'יומן אירועים'], ['users', '#/contacts', 'אנשי קשר'], ['image', '#/flyers', 'חומרי הסברה'], ['grid', '#/maanim', 'מאגר מענים']].map(([ic, h, l]) => `<a href="${h}" class="${on === h ? 'on' : ''}">${icon(ic)}<span>${l}</span></a>`).join('')}</nav>`;
const srcLine = (codes, max = 2) => { if (!codes) return ''; const T = srcTitle(codes); return `<div class="src">${icon('file')} מקור: ${esc(T.slice(0, max).join(' · '))}${T.length > max ? ' ועוד ' + (T.length - max) : ''}</div>`; };
function flyerThumb(f, cls = '') {
  if (f.file) return `<div class="fl-img has-img ${cls}" aria-hidden="true"><img src="${esc(f.file)}" alt="" loading="lazy" decoding="async"></div>`;
  return `<div class="fl-img ${cls} lang-${f.languages[0]} dist-${f.distribution}" aria-hidden="true"><span class="fl-k">${esc((f.format || '').toUpperCase())} · ${esc(f.languages.map((l) => LANG[l] || l).join('/'))}</span><span class="fl-title">${esc(f.title)}</span><span class="fl-k">חוסן גליל מערבי</span></div>`;
}
function flyerTags(f) {
  return `<div class="tags">${(f.situations || []).map((s) => `<span class="tag">${esc(DATA.flyers.situationValues[s] || s)}</span>`).join('')}${f.languages.map((l) => `<span class="tag">${LANG[l] || l}</span>`).join('')}${f.requiresApproval || f.distribution === 'approval' ? '<span class="tag warn">בתיאום עם היחידה הקלינית</span>' : ''}${f.internalOnly || f.distribution === 'internal' ? '<span class="tag red">פנימי – לא להפצה</span>' : ''}</div>`;
}

// ───────────── views ─────────────
const V = {};

V.login = () => `
<div class="login">
  <div class="login-top"><img src="${LOGOS.maashavim}" alt="מרכז משאבים" width="400" height="232"></div>
  <form class="shield" data-form="login" autocomplete="on">
    <img class="frame" src="${LOGOS.shield}" alt="">
    <div class="shield-in">
      <img class="stext" src="${LOGOS.shieldText}" alt="מרכז חוסן גליל מערבי">
      <label class="sr" for="lu">שם משתמש</label>
      <input id="lu" name="u" placeholder="שם משתמש" autocapitalize="none" autocomplete="username" spellcheck="false" dir="ltr" required>
      <label class="sr" for="lp">סיסמה</label>
      <input id="lp" name="p" type="password" placeholder="סיסמה" autocomplete="current-password" dir="ltr" required>
      <button class="go" type="submit" ${UI.loggingIn ? 'disabled' : ''}>${UI.loggingIn ? 'מתחבר…' : 'כניסה'}</button>
    </div>
  </form>
  <div class="login-err" id="lerr" role="alert">${esc(UI.loginMsg || '')}</div>
  ${installBtn()}
  <button class="login-guest" data-act="demo">👤 כניסה כאורח</button>
  <div class="login-guest-sub">להתנסות באפליקציה עם נתוני דוגמה – בלי שם משתמש ובלי חיבור לטבלה</div>
  <div class="login-foot">מרכז חוסן אשכול גליל מערבי · בהפעלת משאבים · גרסה ${APP_VERSION}</div>
</div>`;

V.home = () => {
  const me = ME(), br = BR(), evs = openEvents();
  const rems = evs.flatMap((e) => remindersFor(e).filter((r) => r.at).map((r) => ({ ...r, ev: e }))).sort((a, b) => a.at - b.at).slice(0, 3);
  if (live() && !WEEK.cache[weekKey(0)]) setTimeout(() => loadWeek(0, false), 0);
  const weekCount = live() && weekCountLive() !== null ? weekCountLive() : sessionsInWeek(0).filter((s) => s.status === 'תואם').length;
  return `
<header class="hero hero-c"><div class="hc-bar"><span class="hc-org">מרכז חוסן גליל מערבי</span><div class="hc-pill"><span class="sync-slot" data-compact="0">${syncChipInner(false)}</span><span class="hc-sep"></span>${presenceSlot()}<button class="hero-av" data-act="settings" aria-label="הגדרות ופרופיל">${esc(me.initials)}</button></div></div>
<div class="hc-center"><div class="hc-logos"><img class="hero-logo" src="${LOGOS.shieldFull}" alt="מרכז חוסן"><span class="hero-mash"><img src="${LOGOS.maashavim}" alt="משאבים"></span></div><div class="hero-k">שלום ${esc(me.first)}${me.title ? ' · ' + esc(me.title) : ''}</div><div class="hero-n">${esc(br.name)}</div></div>
${me.cluster ? `<div class="br-sw" role="tablist" aria-label="בחירת שלוחה">${Object.keys(BRANCHES).map((b) => `<button role="tab" aria-selected="${b === me.branch}" class="${b === me.branch ? 'on' : ''}" data-act="set-branch" data-b="${esc(b)}">${esc(b)}</button>`).join('')}</div>` : ''}
<div class="hero-towns">${br.authorities.map((a) => `<span>${esc(a)}</span>`).join('')}</div></header>
<main class="pad">
  ${isStandalone() ? '' : `<div style="text-align:center;margin-bottom:10px">${installBtn()}</div>`}
  <a class="sos" href="#/emergency">${icon('alert')}<span><b>מצב חירום</b><small>בחירת סוג אירוע ופתיחת צ'קליסט</small></span></a>
  ${evs.map((e) => { const c = totalCounts(e); const ph = PHASES.find((p) => p.id === e.phase); return `<a class="active-ev" href="#/event/${e.id}"><span class="pulse"></span><span class="ae-t"><b>אירוע פעיל: ${esc(evTitle(e))}</b><span>${e.mode === 'ongoing' ? 'יום ' + e.day + ' · ' : ''}שלב ${PH_NUM[e.phase]} ${esc(ph.name)} · ${c.done}/${c.total} בוצעו</span></span>${icon('chevL')}</a>`; }).join('')}
  <div class="grid">
    <a class="tile" href="#/intake"><span class="tile-ic">${icon('msg')}</span><b>קליטת קבוצה מהודעה</b><small>הדבקה ← טבלת המעקב</small></a>
    <a class="tile" href="#/assess"><span class="tile-ic">${icon('clip')}</span><b>סיכום פגישה</b><small>הערכת מצב · פגישה שוטפת · מוסד · איש קשר</small></a>
    <a class="tile" href="#/week"><span class="tile-ic">${icon('cal')}</span><b>השבוע שלי</b><small>${weekCount} מפגשים מתואמים השבוע</small></a>
    <a class="tile" href="#/contacts"><span class="tile-ic">${icon('phone')}</span><b>אנשי קשר</b><small>${S.contacts.length} · לפי תפקיד ורשות</small></a>
    <a class="tile" href="#/flyers"><span class="tile-ic">${icon('image')}</span><b>חומרי הסברה</b><small>פליירים לפי מצב, קהל ושפה · פליירים של מענים</small></a>
    <a class="tile" href="#/events"><span class="tile-ic">${icon('book')}</span><b>יומן אירועים</b><small>${S.events.length} אירועים · ${S.assessments.length} סיכומים</small></a>
    <a class="tile" href="#/docs"><span class="tile-ic">${icon('file')}</span><b>נהלי עבודה</b><small>חירום · אירוע חריג · מענים</small></a>
    <a class="tile" href="#/alerts"><span class="tile-ic">${icon('bell')}</span><b>מבזקי חירום</b><small>חדשות לפי רשויות השלוחה</small></a>
  </div>
  ${rems.length ? `<div class="sec"><span>${icon('bell', 'ic-s')} תזכורות קרובות</span></div>${rems.map((r) => remRow(r, r.ev)).join('')}` : ''}
  ${G.demo ? `<div class="sec"><span class="demo-badge">${icon('info', 'ic-xs')} מצב הדגמה – נתוני דמה, נשמרים רק בטלפון הזה ולא נשלחים לשרת</span></div>` : G.server && G.server.dryRun ? `<div class="sec"><span class="demo-badge">${icon('info', 'ic-xs')} השרת במצב בדיקה: קליטת קבוצות לא נכתבת לטבלת המעקב</span></div>` : ''}
</main>${tabbar('#/home')}`;
};
function remRow(r, ev, showName = true) {
  const due = r.at && r.at <= Date.now();
  const when = r.at ? `<span class="when">${hhmm(r.at)}<small>${esc(dayLabel(r.at))}</small></span>` : `<span class="when">${icon('clock', 'ic-s')}</span>`;
  const act = r.act === 'debrief' ? `<button class="btn btn-sec btn-s" data-act="debrief" data-ev="${ev.id}">דיבוב ראשון התקיים</button>` : r.act === 'assess' ? `<a class="icon-btn" href="#/assess?e=${ev.id}" aria-label="פתח הערכת מצב">${icon('chevL')}</a>` : '';
  const below = r.act === 'debrief';
  return `<div class="rem ${due ? 'due' : ''}">${when}<div class="row-t"><b>${esc(r.title)}</b><span>${esc(r.sub)}${ev && showName ? ' · ' + esc(shortEv(ev.typeId)) : ''}</span>${below ? `<span style="margin-top:6px">${act}</span>` : ''}</div>${below ? '' : act}</div>`;
}

V.emergency = () => {
  const d = UI.newEv || (UI.newEv = { typeId: null, mode: null, auths: [], time: toLocalInput(Date.now()) });
  const br = BR();
  const mode = d.mode || (d.typeId && EVT[d.typeId].flags.ongoing ? 'ongoing' : 'point');
  const ok = d.typeId && d.auths.length;
  return `${appBar('פתיחת אירוע', br.name, '#/home')}
<main class="pad">
  ${d.fromAlert ? `<div class="banner-demo">${icon('bell', 'ic-s')}<span>מולא מהתראה: "${esc(d.fromAlert)}". בדוק ואשר.</span></div>` : ''}
  <h2 class="h2">איזה אירוע?</h2>
  <div class="evs" role="radiogroup" aria-label="סוג האירוע">${DATA.events.events.map((e) => `<button class="ev ${d.typeId === e.id ? 'on' : ''}" role="radio" aria-checked="${d.typeId === e.id}" data-act="ev-type" data-id="${e.id}"><span class="ev-ic">${icon(EV_ICON[e.id] || 'alert')}</span><span>${esc(e.name)}</span></button>`).join('')}</div>
  ${d.typeId ? `<p class="muted" style="margin-top:8px">${esc(EVT[d.typeId].description)}</p>` : ''}
  <h2 class="h2">משך</h2>
  <div class="seg" role="radiogroup" aria-label="משך האירוע">
    <button class="${mode === 'point' ? 'on' : ''}" data-act="ev-mode" data-v="point" role="radio" aria-checked="${mode === 'point'}">נקודתי<small>פעם אחת, 4 שלבים</small></button>
    <button class="${mode === 'ongoing' ? 'on' : ''}" data-act="ev-mode" data-v="ongoing" role="radio" aria-checked="${mode === 'ongoing'}">מתמשך<small>${icon('repeat', 'ic-xs')} חזרה יומית על השלבים</small></button>
  </div>
  <h2 class="h2">באיזו רשות? <span class="muted">אפשר כמה</span></h2>
  <div class="chips">${br.authorities.map((a) => `<button class="chip ${d.auths.includes(a) ? 'on' : ''}" data-act="ev-auth" data-v="${esc(a)}" aria-pressed="${d.auths.includes(a)}">${d.auths.includes(a) ? icon('check', 'ic-xs') : ''}${esc(a)}</button>`).join('')}</div>
  <label class="lbl" for="evtime">מתי התחיל?</label>
  <input class="inp" id="evtime" type="datetime-local" data-in="ev-time" value="${esc(d.time)}">
</main>
<div class="bottom"><button class="btn btn-pri btn-xl" data-act="ev-start" ${ok ? '' : 'disabled'}>פתח צ'קליסט ${icon('chevL')}</button>${ok ? '' : '<p class="hint" style="margin:8px 0 0">בחר סוג אירוע ולפחות רשות אחת</p>'}</div>`;
};

V.event = (id) => {
  const ev = getEv(id); if (!ev) return V.notFound();
  const t = EVT[ev.typeId], ph = ev.phase, phObj = PHASES.find((p) => p.id === ph);
  const items = t.checklist[ph] || [];
  const closed = !!ev.closedAt;
  return `<div class="head" style="position:sticky;top:0;z-index:20">${closed ? '' : statusBar(ev)}${appBar(shortEv(ev.typeId) + ' · ' + ev.authorities.join(', '), (ev.mode === 'ongoing' ? 'מתמשך' : 'נקודתי') + ' · נפתח ' + whenLabel(ev.startedAt) + (closed ? ' · נסגר' : ''), '#/home', `<a class="ab-act" href="#/event/${ev.id}/log" aria-label="יומן אירוע">${icon('book')}</a><button class="ab-act ab-del" data-act="del-ev" data-ev="${ev.id}" aria-label="מחיקת האירוע">${icon('trash')}</button>`)}</div>
<main class="pad">
  ${principlesBanner()}
  ${ev.mode === 'ongoing' && !closed ? `<div class="dayrow">${icon('repeat')}<div class="row-t"><b>יום ${ev.day} לאירוע</b><span>${ev.history.length ? 'ימים קודמים נשמרו ביומן' : 'חזרה יומית על השלבים'}</span></div><button class="btn btn-sec btn-s" data-act="newday" data-ev="${ev.id}">התחל יום חדש</button></div>` : ''}
  <div class="stepper" role="tablist">${PHASES.map((p) => { const c = phaseCounts(ev, p.id); return `<button class="stp ${p.id === ph ? 'on' : ''} ${c.done === c.total && c.total ? 'full' : ''}" data-ph="${p.id}" role="tab" aria-selected="${p.id === ph}" data-act="phase" data-ev="${ev.id}" data-v="${p.id}"><span class="stp-n">${PH_NUM[p.id]}</span><span class="stp-t">${esc(p.name)}</span><span class="stp-c">${c.done}/${c.total}</span></button>`; }).join('')}</div>
  <div class="stg-h"><span class="num">${PH_NUM[ph]}</span><div><h2>${esc(phObj.name)}</h2><p>${esc(phObj.summary)} · ${esc(phObj.timingHint)}</p></div></div>
  ${MAASE_EV.includes(ev.typeId) ? maaseLink(ev) : ''}
  ${ph === 'immediate' ? q6Card(ev) : ''}
  <ul class="its">${items.map((it) => itemCard(ev, it)).join('')}</ul>
  ${t.sourceGaps ? `<p class="src">${icon('info')} פערי מקור: ${esc([].concat(t.sourceGaps).join(' · '))}</p>` : ''}
  <div class="sec"><span>${icon('bell', 'ic-s')} תזכורות לאירוע</span><button class="lnk" data-act="notif">אפשר התראות</button></div>
  ${remindersFor(ev).map((r) => remRow(r, ev, false)).join('')}
  <div class="btn-row" style="margin-top:16px">
    <a class="btn btn-out" href="#/assess?e=${ev.id}">${icon('clip', 'ic-s')} הערכת מצב</a>
    <a class="btn btn-out" href="#/event/${ev.id}/log">${icon('book', 'ic-s')} יומן אירוע</a>
    <a class="btn btn-out" href="#/docs">${icon('file', 'ic-s')} נהלי עבודה</a>
  </div>
</main>
<div class="bottom"><div class="btn-row"><a class="btn btn-pri" style="flex:2" href="#/event/${ev.id}/report">${icon('send', 'ic-s')} דיווח למנהלת המרכז</a>${closed ? `<a class="btn btn-sec" href="#/event/${ev.id}/summary">סיכום</a>` : `<button class="btn btn-sec" data-act="close-ev" data-ev="${ev.id}">סגור אירוע</button>`}</div></div>`;
};
const Q6 = DATA.events.questions6;

// ───────────── מודל מעש"ה – עזרה ראשונה נפשית (לפי הנחיית מנהלת המרכז ומצגת משאבים) ─────────────
const MAASE_EV = ['mci', 'direct_hit', 'terror'];
const MAASE = {
  goal: 'המטרה היא לא לעבד את הטראומה אלא לספק סיוע ראשוני: להפחית חוסר אונים, להשיב תחושת ביטחון ולסייע להתמצא במה שקורה עכשיו. המודל מחזיר אדם לתפקוד תוך דקה וחצי עד שתי דקות.',
  medical: ['נפגע פיזית – לוודא שהוא מקבל טיפול רפואי מתאים', 'מבולבל או מתקשה להתמצא', 'מתקשה לנשום', 'מצבו מחמיר'],
  steps: [
    { l: 'מ', t: 'יצירת מחויבות', from: 'בדידות', to: 'שייכות', c: '#0B3954',
      d: ['לדבר ברוגע, במשפטים קצרים וברורים', 'להישאר איתו ולוודא שאינו נשאר לבד במצוקה'],
      say: ['״אני כאן איתך עכשיו. אתה לא צריך להתמודד עם זה לבד.״'] },
    { l: 'ע', t: 'עידוד לפעולה', from: 'חוסר אונים', to: 'תחושת מסוגלות ורצון לפעול', c: '#0F766E',
      d: ['לשאול שאלות פשוטות שמחזירות תחושת בחירה ושליטה', 'לתת לו משימה קטנה ומיידית'],
      say: ['״אתה רוצה שאשב לידך?״', '״למי חשוב לך שנודיע?״', '״מה יעזור לך כרגע – שאהיה כאן בשקט או שנדבר קצת?״'] },
    { l: 'ש', t: 'שאלות המחייבות מחשבה', from: 'הצפה רגשית', to: 'מסוגלות לתקשורת יעילה', c: '#2E8B7A',
      d: ['שאלות ממוקדות שמפעילות חשיבה – לא שאלות על רגשות', 'לא ללחוץ לספר מה קרה; לאפשר שתיקה, בכי, בלבול'],
      say: ['״אתה עובר משהו קשה מאוד. אנחנו כאן איתך, ונעבור את הדקות הקרובות צעד־צעד.״'] },
    { l: 'ה', t: 'הבניית רצף', from: 'בלבול', to: 'הבנה שהאירוע המאיים הסתיים', c: '#4FA88B',
      d: ['לעזור לו להבין את רצף האירועים ומה צפוי בהמשך, בלי להיכנס לפרטי האירוע', 'להסביר מה יקרה בשלב הבא'],
      say: ['״היה פיצוץ, נפגעת, ועכשיו אנחנו כאן כדי לעזור לך. אני אסביר לך מה עומד לקרות בשלב הבא.״'] },
  ],
  dont: ['לא ללחוץ עליו לספר מה קרה', 'לא לבקש ממנו לשחזר את האירוע', 'לא לומר ״הכול בסדר״ או ״תהיה חזק״'],
  close: ['לוודא שיש אדם משמעותי שילווה אותו', 'להסביר מה יקרה בשעות הקרובות', 'לתאם המשך קשר ותמיכה (מוקד הסיוע / הפניה לטיפול)'],
};
function maaseLink(ev) {
  return `<a class="maase-lnk" href="#/maase?e=${ev.id}"><span class="maase-ic">מעש"ה</span><span class="row-t"><b>עזרה ראשונה נפשית – מודל מעש"ה</b><span>מה עושים ומה אומרים לנפגע חרדה, בדקה וחצי</span></span>${icon('chevL')}</a>`;
}
V.maase = (q) => {
  const ev = q.e ? getEv(q.e) : null;
  return `${appBar('מודל מעש"ה', 'עזרה ראשונה נפשית בזמן אירוע', ev ? '#/event/' + ev.id : '#/home')}
<main class="pad maase">
  <div class="maase-med" role="alert">${icon('alert')}<div><b>קודם כל – בדיקה רפואית</b><span>אם מתקיים אחד מאלה, פונים מיד לצוות הרפואי ולא מסתפקים בשיחת סיוע:</span><ul>${MAASE.medical.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
  <p class="muted">${esc(MAASE.goal)}</p>
  ${MAASE.steps.map((s) => `<section class="mstep" style="--mc:${s.c}"><div class="mstep-h"><span class="ml">${s.l}</span><div><h3>${esc(s.t)}</h3><span class="mft">${esc(s.from)} ← ${esc(s.to)}</span></div></div>
    <ul>${s.d.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="msay"><b>מה אפשר לומר</b>${s.say.map((x) => `<p>${esc(x)}</p>`).join('')}</div></section>`).join('')}
  <section class="mdont"><h3>${icon('alert', 'ic-s')} לא לעשות</h3><ul>${MAASE.dont.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
  <section class="card"><h3 class="h3">${icon('flag', 'ic-s')} סיום השיחה</h3><ul class="mlist">${MAASE.close.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
  ${FLY.auth_maase_model ? `<button class="fl" style="width:100%;text-align:right;margin-top:12px" data-act="fl-open" data-id="auth_maase_model">${flyerThumb(FLY.auth_maase_model)}<span class="fl-t"><b>${esc(FLY.auth_maase_model.title)}</b>${flyerTags(FLY.auth_maase_model)}</span></button>` : ''}
  <p class="src">${icon('info')} מקור: מודל מעש"ה (משאבים) והנחיית מנהלת המרכז לסיוע ראשוני</p>
</main>${tabbar('')}`;
};
const GP = DATA.events.guidingPrinciples;
function principlesBanner() {
  return `<details class="principles"><summary>${icon('bulb', 'ic-s')} עקרונות – "צופה משתתף" ועקרונות מנחים${icon('chevD', 'ic-s chev')}</summary>
  <h4>עקרונות פעולה בחירום (נוהל)</h4><ul>${DATA.events.principles.map((p) => `<li>${esc(p.text)}</li>`).join('')}</ul>
  <h4>${esc(GP.title)}</h4><ul>${GP.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  <h4>מוכנות בשגרה</h4><ul>${GP.readiness.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  <div class="motto">${esc(GP.motto)}</div>${srcLine(GP.source)}</details>`;
}
const q6Answered = (ev) => Q6.filter((q) => ev.q6 && String(ev.q6[q.id] || '').trim()).length;
function q6Card(ev) {
  const n = q6Answered(ev);
  return `<section class="q6 ${n === 6 ? 'ok' : ''}" aria-label="6 שאלות ראשונות לבירור"><div class="q6-h">${icon('list')}<b>6 שאלות ראשונות לבירור</b><span class="tag ${n === 6 ? 'ok' : ''}">${n}/6</span></div>
  <p class="muted small">תשובה קצרה לכל שאלה. נשמר ליומן, לדיווח לעדי ולהערכת המצב.${ev.mode === 'ongoing' && ev.day > 1 ? ' השאלות מתאפסות בכל יום חדש.' : ''}</p>
  ${Q6.map((q, i) => { const prev = String((ev.q6Prev || {})[q.id] || '').trim(); const cur = (ev.q6 || {})[q.id] || '';
    return `<label class="q6-l" for="q6-${q.id}"><span class="n">${i + 1}</span>${esc(q.q)}</label><input class="inp" id="q6-${q.id}" data-in="q6" data-ev="${ev.id}" data-q="${q.id}" value="${esc(cur)}" placeholder="${esc(q.ph)}">${prev ? `<div class="q6-prev"><span>אתמול: ${esc(prev)}</span>${cur.trim() ? '' : `<button class="lnk" data-act="q6-copy" data-ev="${ev.id}" data-q="${q.id}">העתק מאתמול</button>`}</div>` : ''}`; }).join('')}
  ${srcLine('IDIT')}</section>`;
}
function q6Lines(ev) { return Q6.filter((q) => ev.q6 && String(ev.q6[q.id] || '').trim()).map((q) => `• ${q.q} ${ev.q6[q.id].trim()}`); }
function itemCard(ev, it) {
  const done = ev.done[it.id];
  const msgs = (it.messages || []).filter((m) => TPL[m.templateId]);
  const isAssess = /הערכת מצב/.test(it.text);
  const fls = (it.flyers || []).filter((f) => FLY[f]);
  return `<li class="it ${done ? 'done' : ''}" id="it-${esc(it.id)}">
  <button class="it-chk" data-act="toggle" data-ev="${ev.id}" data-id="${esc(it.id)}" role="checkbox" aria-checked="${!!done}"><span class="box">${icon('check')}</span><span class="it-txt"><b>${esc(it.text)}</b>${done ? `<span class="it-done">בוצע ${hhmm(done)}</span>` : ''}</span></button>
  <div class="it-more">
    <details><summary>פרטים ומקור</summary><p>${esc(it.detail || '')}</p>${it.timing ? `<p><b>עיתוי:</b> ${esc(it.timing)}</p>` : ''}${it.note ? `<div class="note">${esc(it.note)}</div>` : ''}${srcLine(it.source)}</details>
    ${(msgs.length || isAssess || fls.length) ? `<div class="it-acts">${msgs.map((m, i) => `<a class="btn btn-msg" href="#/event/${ev.id}/msg/${encodeURIComponent(it.id)}/${(it.messages || []).indexOf(m)}">${icon('send', 'ic-s')} הכן הודעה${msgs.length > 1 ? ': ' + esc(TPL[m.templateId].title) : ''}</a>`).join('')}${isAssess ? `<a class="btn btn-sec" href="#/assess?e=${ev.id}">${icon('clip', 'ic-s')} פתח הערכת מצב</a>` : ''}${!msgs.length && fls.length ? `<button class="btn btn-sec" data-act="item-flyers" data-ev="${ev.id}" data-id="${esc(it.id)}">${icon('image', 'ic-s')} פליירים (${fls.length})</button>` : ''}</div>` : ''}
  </div></li>`;
}

V.msg = (id, itemId, mi) => {
  const ev = getEv(id); if (!ev) return V.notFound();
  const it = findItem(ev, itemId); if (!it) return V.notFound();
  const m = (it.messages || [])[+mi]; const tpl = m && TPL[m.templateId]; if (!tpl) return V.notFound();
  const key = id + '|' + itemId + '|' + mi;
  if (!UI.msg || UI.msg.key !== key) {
    const rec = recipientsFor(ev, m.recipientsRoles);
    const lang = {}; rec.forEach((r) => { if (r.contact && r.contact.lang === 'ar') lang[r.role] = 'ar'; });
    UI.msg = { key, sel: Object.fromEntries(rec.filter((r) => r.contact).map((r) => [r.contact.id, true])), role: m.recipientsRoles[0], lang, texts: {}, flyerIdx: 0, file: null };
  }
  const M = UI.msg;
  const rec = recipientsFor(ev, m.recipientsRoles);
  const roles = m.recipientsRoles.filter((r) => ROLE[r]);
  const cur = M.role; const curLang = M.lang[cur] || 'he';
  const MT = msgText(M, ev, tpl, cur, curLang); const curText = MT.text;
  const fls = (it.flyers || []).filter((f) => FLY[f]);
  const fl = fls.length ? FLY[fls[M.flyerIdx % fls.length]] : null;
  const nSel = rec.filter((r) => r.contact && M.sel[r.contact.id]).length;
  const miss = unfilled(curText);
  if (fl && fl.file && (!M.file || M.file.name !== flyerName(fl))) flyerFile(fl).then((f) => { if (UI.msg === M) M.file = f; });   // pre-load before the tap (iOS share needs it ready)
  if (fl && !fl.file) M.file = null;
  return `<div class="head" style="position:sticky;top:0;z-index:20">${ev.closedAt ? '' : statusBar(ev)}${appBar('הכנת הודעה', 'שלב ' + PH_NUM[it.phase] + ' · ' + it.text, '#/event/' + ev.id)}</div>
<main class="pad">
  <div class="card" style="margin-bottom:12px"><b>${esc(tpl.title)}</b><p class="muted">${esc(tpl.purpose || '')}</p>${tpl.requiresApproval ? `<p class="tag warn" style="margin-top:6px;white-space:normal">${esc(typeof tpl.requiresApproval === 'string' ? tpl.requiresApproval : 'דורש תיאום לפני הפצה')}</p>` : ''}</div>
  <h2 class="h2">נמענים לפי תפקיד <span class="muted">(מאנשי הקשר)</span></h2>
  <ul class="list">${rec.map((r) => r.contact ? `<li class="rc ${M.sel[r.contact.id] ? '' : 'off'}"><span class="av">${esc(r.contact.name[0] || '?')}</span><span class="row-t"><b>${esc(roleName(r.role))}${r.auth ? ' · ' + esc(r.auth) : ''}</b><span>${esc(r.contact.name)} · <span dir="ltr">${esc(r.contact.phone)}</span>${r.contact.lang === 'ar' ? ' · <span class="tag">ערבית</span>' : ''}</span></span><button class="tg icon-btn" data-act="msg-sel" data-id="${r.contact.id}" role="checkbox" aria-checked="${!!M.sel[r.contact.id]}" aria-label="${M.sel[r.contact.id] ? 'הסר נמען' : 'הוסף נמען'}">${icon(M.sel[r.contact.id] ? 'x' : 'plus')}</button></li>`
    : r.public ? `<li class="rc miss"><span class="av">${icon('users', 'ic-s')}</span><span class="row-t"><b>${esc(roleName(r.role))}</b><span>לקבוצה או לרשימת תפוצה – דרך "שתף עם פלייר"</span></span></li>`
    : `<li class="rc miss"><span class="av">?</span><span class="row-t"><b>${esc(roleName(r.role))}${r.auth ? ' · ' + esc(r.auth) : ''}</b><span>אין איש קשר לתפקיד</span></span><a class="btn btn-sec btn-s" href="#/contacts?add=${r.role}&auth=${encodeURIComponent(r.auth || INTERNAL_AUTH)}">${icon('plus', 'ic-s')} הוסף</a></li>`).join('')}</ul>
  <h2 class="h2">נוסח ההודעה <span class="muted">ניתן לעריכה</span></h2>
  ${roles.length > 1 ? `<div class="hscroll" style="margin-bottom:8px">${roles.map((r) => `<button class="chip s ${r === cur ? 'on' : ''}" data-act="msg-role" data-v="${r}">${esc(roleName(r))}</button>`).join('')}</div>` : ''}
  <div class="seg s" style="margin-bottom:8px" role="radiogroup" aria-label="שפת ההודעה"><button class="${curLang === 'he' ? 'on' : ''}" data-act="msg-lang" data-v="he" role="radio" aria-checked="${curLang === 'he'}">עברית</button><button class="${curLang === 'ar' ? 'on' : ''}" data-act="msg-lang" data-v="ar" role="radio" aria-checked="${curLang === 'ar'}" lang="ar">عربية</button></div>
  ${MT.none ? `<div class="banner-demo" style="background:var(--warn-bg);color:var(--warn-ink)">${icon('info', 'ic-s')}<span><b>אין עדיין נוסח בערבית לתבנית הזו.</b> לא מתרגמים אוטומטית – ההודעה תישלח בעברית.</span></div>` : ''}
  ${MT.draft ? `<div class="banner-demo" style="background:var(--warn-bg);color:var(--warn-ink)">${icon('alert', 'ic-s')}<span><b>טיוטה – דורש בדיקת דובר ערבית</b> לפני שליחה.</span></div>` : ''}
  <textarea class="ta" data-in="msg-text" rows="9" ${MT.lang === 'ar' ? 'lang="ar"' : ''}>${esc(curText)}</textarea>
  <p class="muted" style="margin-top:6px">{שם_נמען} יוחלף אוטומטית בשם של כל נמען.</p>
  ${miss.length ? `<div class="tags" style="margin-top:6px">${miss.map((p) => p === '{טלפון_ראש_שלוחה}' ? `<button class="tag warn" data-act="settings">להשלים: ${esc(p)} · הגדר בפרופיל</button>` : `<span class="tag warn">להשלים: ${esc(p)}</span>`).join('')}</div>` : ''}
  ${fl ? `<h2 class="h2">פלייר מצורף</h2><div class="fl">${flyerThumb(fl)}<div class="fl-t"><b>${esc(fl.title)}</b>${flyerTags(fl)}${fl.notes ? `<span class="muted">${esc(fl.notes)}</span>` : ''}<span class="muted small">קהל: ${esc(fl.audience)}</span>${fls.length > 1 ? `<button class="lnk" data-act="msg-flyer">החלף פלייר (${(M.flyerIdx % fls.length) + 1}/${fls.length})</button>` : ''}</div></div><p class="muted small" style="margin-top:6px">${fl.file ? 'הקובץ המקורי יצורף בשיתוף.' : 'הקובץ לא כלול באפליקציה (קטלוג בלבד) – ישותף הנוסח בלבד. את הקובץ מקבלים מצוות המרכז.'}</p>` : ''}
</main>
<div class="bottom"><p class="hint">וואטסאפ ייפתח לכל נמען בנפרד (${nSel}). הנוסח והפלייר מוכנים.</p>
<div class="btn-row"><button class="btn btn-out" style="flex:0 0 auto" data-act="msg-copy" aria-label="העתק נוסח">${icon('copy', 'ic-s')}</button><button class="btn btn-sec" data-act="msg-share">${icon('share', 'ic-s')} ${fl && fl.file ? 'שתף עם פלייר' : 'שתף'}</button><button class="btn btn-wa" style="flex:1.4" data-act="msg-send" ${nSel ? '' : 'disabled'}>${icon('wa', 'ic-s')} שלח בוואטסאפ (${nSel})</button></div></div>`;
};

V.report = (id) => {
  const ev = getEv(id); if (!ev) return V.notFound();
  const R = UI.report[id] || (UI.report[id] = { needs: '', text: null });
  if (R.text == null) R.text = buildReport(ev, R.needs);
  const dir = S.contacts.find((c) => c.role === 'center_director');
  return `<div class="head" style="position:sticky;top:0;z-index:20">${ev.closedAt ? '' : statusBar(ev)}${appBar('דיווח למנהלת המרכז', dir ? dir.name : 'מנהלת מרכז החוסן', '#/event/' + ev.id)}</div>
<main class="pad">
  <p class="muted" style="margin-bottom:8px">נבנה אוטומטית מהצ'קליסט ומהיומן: מה בוצע, מה פתוח ומה צריך.</p>
  <label class="lbl" for="needs">מה צריך ממנה / מהמרכז?</label>
  <input class="inp" id="needs" data-in="rep-needs" value="${esc(R.needs)}" placeholder="למשל: אישור לאיש מקצוע מלווה לעכו">
  <label class="lbl" for="rtext">הנוסח</label>
  <textarea class="ta" id="rtext" data-in="rep-text" rows="16">${esc(R.text)}</textarea>
  <button class="lnk" data-act="rep-regen">בנה מחדש מהצ'קליסט</button>
</main>
<div class="bottom"><div class="btn-row"><button class="btn btn-out" style="flex:0 0 auto" data-act="rep-copy" aria-label="העתק">${icon('copy', 'ic-s')}</button>${dir ? `<a class="btn btn-wa" style="flex:1" target="_blank" rel="noopener" href="${waLink(dir.phone, R.text)}" data-act="rep-send" data-ev="${ev.id}">${icon('wa', 'ic-s')} שלח ל${esc(firstName(dir.name))} בוואטסאפ</a>` : `<a class="btn btn-sec" href="#/contacts?add=center_director&auth=${encodeURIComponent(INTERNAL_AUTH)}">הוסף מנהלת מרכז לאנשי הקשר</a>`}</div></div>`;
};

V.log = (id) => {
  const ev = getEv(id); if (!ev) return V.notFound();
  const kinds = { auto: 'מערכת', note: 'הערה', msg: 'הודעה', done: 'בוצע' };
  const byDay = {}; ev.log.slice().reverse().forEach((l) => { const k = ddmmyyyy(l.t); (byDay[k] = byDay[k] || []).push(l); });
  return `<div class="head" style="position:sticky;top:0;z-index:20">${ev.closedAt ? '' : statusBar(ev)}${appBar('יומן אירוע', evTitle(ev), '#/event/' + ev.id)}</div>
<main class="pad">
  <label class="lbl" for="note">הוסף הערה ליומן</label>
  <div style="display:flex;gap:8px"><input class="inp" id="note" placeholder="מה קרה, עם מי דיברת, מה סוכם" data-enter="log-add"><button class="btn btn-pri" data-act="log-add" data-ev="${ev.id}">הוסף</button></div>
  ${Object.entries(byDay).map(([d, ls]) => `<div class="day-h">${icon('cal', 'ic-s')} ${esc(dayLabel(parseDMY(d)))} · ${d}</div><ul class="log">${ls.map((l) => `<li class="${l.kind}"><time>${hhmm(l.t)}</time><div><div class="txt">${esc(l.text)}</div><div class="k">${kinds[l.kind] || ''}</div></div></li>`).join('')}</ul>`).join('')}
  ${(ev.history || []).length ? `<div class="sec">ימים קודמים</div>${ev.history.map((h) => `<div class="row"><b>יום ${h.day}</b><span class="row-t"><span>${h.date} · ${Object.keys(h.done).length} פעולות בוצעו</span></span></div>`).join('')}` : ''}
</main>
<div class="bottom">${ev.closedAt ? `<a class="btn btn-pri btn-xl" href="#/event/${ev.id}/summary">${icon('file', 'ic-s')} סיכום והמלצות לרשות</a>` : `<button class="btn btn-pri btn-xl" data-act="close-ev" data-ev="${ev.id}">סגור אירוע והפק סיכום לרשות</button>`}</div>`;
};

V.summary = (id) => {
  const ev = getEv(id); if (!ev) return V.notFound();
  if (!ev.summary) { ev.summary = buildSummary(ev); save(); }
  return `${appBar('סיכום והמלצות לרשות', evTitle(ev), '#/event/' + ev.id)}
<main class="pad">
  <div class="banner-demo">${icon('info', 'ic-s')}<span>טיוטה לפי מבנה הסיכום של אורט מעלות. השלם את הסעיפים המסומנים [להשלמה] לפני שליחה.</span></div>
  <textarea class="ta" data-in="sum-text" data-ev="${ev.id}" rows="24">${esc(ev.summary)}</textarea>
  <button class="lnk" data-act="sum-regen" data-ev="${ev.id}">בנה מחדש מהיומן</button>
  <div class="sec">תזכורות אחרי האירוע</div>
  ${remindersFor(ev).map((r) => remRow(r, ev, false)).join('')}
</main>
<div class="bottom"><div class="btn-row"><button class="btn btn-out" data-act="sum-copy" data-ev="${ev.id}">${icon('copy', 'ic-s')} העתק</button><button class="btn btn-sec" data-act="sum-share" data-ev="${ev.id}">${icon('share', 'ic-s')} שתף</button></div></div>`;
};

V.events = () => {
  const evs = S.events.slice().sort((a, b) => b.startedAt - a.startedAt);
  return `${appBar('יומן אירועים', BR().name, '#/home')}
<main class="pad">
  <a class="btn btn-danger btn-xl" href="#/emergency">${icon('alert', 'ic-s')} פתיחת אירוע חדש</a>
  <div class="sec">אירועים</div>
  ${evs.length ? `<ul class="list">${evs.map((e) => { const c = totalCounts(e); return `<li><a class="row" href="#/event/${e.id}">${e.closedAt ? `<span class="av">${icon('check', 'ic-s')}</span>` : '<span class="pulse" style="margin:0 14px"></span>'}<span class="row-t"><b>${esc(evTitle(e))}</b><span>${e.closedAt ? 'נסגר ' + whenLabel(e.closedAt) : 'פעיל · ' + elapsed(e.startedAt)} · ${c.done}/${c.total} · ${e.log.length} רשומות</span></span>${icon('chevL')}</a></li>`; }).join('')}</ul>` : '<div class="empty">עדיין אין אירועים. כל פעולה באירוע נרשמת כאן אוטומטית עם שעה.</div>'}
  <div class="sec">הערכות מצב שנשמרו</div>
  ${S.assessments.length ? `<ul class="list">${S.assessments.slice().reverse().map((a) => `<li><button class="row" style="width:100%;text-align:right" data-act="as-open" data-id="${a.id}"><span class="av">${icon('clip', 'ic-s')}</span><span class="row-t"><b>${esc(a.text.slice(0, 60))}${a.text.length > 60 ? '…' : ''}</b><span>${whenLabel(a.t)}${a.eventId && getEv(a.eventId) ? ' · ' + esc(evTitle(getEv(a.eventId))) : ''} · ${a.result.recs.length} המלצות${a.result.by === 'claude' ? ' · <span class="tag claude">נותח ע"י Claude</span>' : ''}</span></span></button></li>`).join('')}</ul>` : '<div class="empty">אין עדיין הערכות מצב.</div>'}
</main>${tabbar('#/events')}`;
};

// ---------- intake ----------
const SAMPLE_INTAKE = 'שלום גלעד, תיאמנו סדנת משחקי אדמה בגן רימון בכפר ורדים לילדים, 6 מפגשים בימי שלישי החל מ-17.11 בשעות 10:00-11:30, המנחה טל מיכאליס מטבעון, 15 ילדים';
const IF = [['funder', 'גורם מממן', 'sel'], ['authority', 'רשות', 'auth'], ['settlement', 'ישוב'], ['location', 'מיקום + שם המוסד'], ['domain', 'תחום הפעילות', 'sel'], ['activity', 'שם פעילות'], ['type', 'סוג פעילות', 'sel'], ['audience', 'קהל יעד', 'sel'], ['participants', 'מספר משתתפים', 'num'], ['facilitator', 'שם מנחה'], ['facResidence', 'מקום מגורים מנחה'], ['expected', 'כמות מפגשים', 'num'], ['startDate', 'תאריך התחלה'], ['weekday', 'יום בשבוע'], ['hours', 'שעות מפגש'], ['notes', 'הערות']];
V.intake = () => {
  const I = UI.intake || (UI.intake = { text: '', res: null, written: false });
  const br = BR();
  let body = '';
  if (I.res) {
    const R = I.res, nOk = IF.filter(([k]) => R.flag[k] === 'ok' && R.F[k]).length;
    body = `
  <h2 class="h2">2. בדוק את מה שחולץ ${R.by === 'claude' ? '<span class="tag claude">נותח ע"י Claude</span>' : '<span class="tag">ניתוח אוטומטי בסיסי</span>'} <span class="tag ok">${nOk} שדות זוהו</span> <span class="tag warn">צהוב = הוסק / חסר</span></h2>
  ${R.warn.length ? R.warn.map((w) => `<div class="banner-demo" style="background:var(--warn-bg);color:var(--warn-ink)">${icon('alert', 'ic-s')}<span>${esc(w)}</span></div>`).join('') : ''}
  <div class="fs">${IF.map(([k, label, kind]) => { const v = R.F[k] || ''; const f = R.flag[k]; const w = (f !== 'ok' && f !== 'list') || (!v && k !== 'notes');
      const note = f === 'matched' ? (k === 'facilitator' && R.F._facOrig ? `הותאם מ"${R.F._facOrig}" – לאשר` : 'הותאם – לאשר') : f === 'list' ? 'מרשימת המנחים' : f === 'inferred' ? (k === 'facilitator' && R.F._facNew ? 'לא ברשימת המנחים' : 'הוסק') : (!v && k !== 'notes') ? (k === 'facResidence' && R.F.facilitator ? 'חסר' : 'לא צוין') : '';
      let ctl;
      if (kind === 'sel' || kind === 'auth') { const opts = kind === 'auth' ? [...br.authorities, ...EXTRA_AUTH] : OPTS[k]; ctl = `<select data-in="in-f" data-k="${k}" aria-label="${label}"><option value="">—</option>${opts.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; }
      else if (k === 'facilitator') ctl = `<input data-in="in-fac" data-k="${k}" value="${esc(v)}" aria-label="${label}" autocomplete="off" role="combobox" aria-controls="fac-sugg" aria-autocomplete="list" placeholder="הקלד שם מהרשימה">`;
      else ctl = `<input data-in="in-f" data-k="${k}" value="${esc(v)}" aria-label="${label}" ${kind === 'num' ? 'inputmode="numeric"' : ''} ${k === 'startDate' ? 'placeholder="dd/mm/yyyy" dir="ltr"' : ''} ${k === 'hours' ? 'placeholder="HH:MM-HH:MM" dir="ltr"' : ''}>`;
      return `<div class="f ${w ? 'warn' : ''} ${f === 'matched' ? 'match' : ''}"><span class="f-k">${label}${note ? `<small>${note}</small>` : ''}</span><span class="f-v">${ctl}</span></div>${k === 'facilitator' ? '<ul class="sugg" id="fac-sugg" role="listbox" hidden></ul>' : ''}`; }).join('')}</div>
  <button class="lnk" data-act="in-regen">עדכן מפגשים לפי תאריך התחלה וכמות</button>
  <h2 class="h2">מפגשים · ${R.sessions.length} שורות · סטטוס "תואם"</h2>
  <div class="g15-all"><label for="g15all" class="muted" style="flex:1;min-width:150px"><b style="color:var(--ink)">סה"כ קבוצות לתמחור</b> (עמודה 15) – ממלא הרכז, אין חישוב אוטומטי</label><input id="g15all" inputmode="decimal" data-in="g15-allv" value="${esc(R.g15AllV || '')}" aria-label="ערך לכל המפגשים"><button class="btn btn-sec btn-s" data-act="g15-all">החל על כל המפגשים</button></div>
  <table class="tb"><thead><tr><th class="c">#</th><th>תאריך</th><th>שעות</th><th>חודש</th><th style="text-align:center">קבוצות לתמחור</th></tr></thead><tbody>${R.sessions.map((d, i) => { const dt = parseDMY(d); return `<tr><td class="c">${i + 1}</td><td>${d}<div class="muted small">${dt ? 'יום ' + DAYS[dt.getDay()] : ''}</div></td><td dir="ltr" style="text-align:right;white-space:nowrap">${esc(R.F.hours)}</td><td>${dt ? MONTHS[dt.getMonth()] : ''}</td><td style="text-align:center"><input class="g15" inputmode="decimal" data-in="g15" data-i="${i}" value="${esc((R.g15 || [])[i] || '')}" aria-label="קבוצות לתמחור, מפגש ${i + 1}"></td></tr>`; }).join('')}</tbody></table>
  <div class="ses">${R.sessions.map((d, i) => { const row = rowFor(R.F, d, i, R.sessions.length, (R.g15 || [])[i]); return `<details><summary><span class="n">${i + 1}</span><span class="d">${d}</span><span class="m">כל 23 העמודות ${icon('chevD', 'ic-xs')}</span></summary><div class="fs cols23">${COLS.map((c, ci) => `<div class="f ${FIN_COLS.includes(ci) ? 'fin' : ''}"><span class="f-k">${ci} · ${esc(c)}</span><span class="f-v">${FIN_COLS.includes(ci) ? 'ריק – כספים' : ci === 15 && !row[ci] ? '<span class="muted">ריק – ממלא הרכז</span>' : esc(row[ci]) || '<span class="muted">—</span>'}</span></div>`).join('')}</div></details>`; }).join('')}</div>
  <p class="muted small" style="margin-top:8px">עמודות הכספים (18, 19, 20, 22) נשארות ריקות. עמודה 15 נכתבת רק כפי שהרכז מילא.</p>
  ${I.serverErr ? serverErrBlock(I.serverErr) : ''}
  ${I.written ? writtenBlock(I) : ''}`;
  }
  return `${appBar('קליטת קבוצה מהודעה', 'לשונית יעד: ' + br.tab, '#/home')}
<main class="pad">
  <h2 class="h2">1. הדבק את ההודעה מהמנחה או מהמוסד</h2>
  <textarea class="ta" data-in="in-text" rows="6" placeholder="הדבק כאן הודעת וואטסאפ…">${esc(I.text)}</textarea>
  <div class="btn-row" style="margin-top:8px"><button class="btn btn-sec" data-act="in-paste">${icon('copy', 'ic-s')} הדבק מהלוח</button><button class="btn btn-out" data-act="in-sample">דוגמה</button><button class="btn btn-pri" data-act="in-parse">חלץ שדות</button></div>
  <p class="muted small" style="margin-top:6px">"חלץ שדות" = ניתוח אוטומטי בסיסי, על הטלפון.</p>
  <div class="btn-row" style="margin-top:8px">${claudeBtn('in')}${aiAvailable() ? `<button class="btn btn-sec" data-act="in-ai" ${I.aiBusy ? 'disabled' : ''}>${icon('bulb', 'ic-s')} ${I.aiBusy ? 'מנתח…' : 'ניתוח AI בשרת'}</button>` : ''}</div>${privacyLine}
  ${I.claude ? claudePanel('in', I.claude) : ''}
  ${body}
  ${tabPanel()}
</main>
${I.res && !I.written ? `<div class="bottom">${missingReq(I.res).length ? `<button class="btn btn-pri btn-xl" data-act="in-fill">${icon('alert', 'ic-s')} השלם ${missingReq(I.res).length} פרטים חסרים</button>` : `<button class="btn btn-pri btn-xl" data-act="in-write" ${I.res.sessions.length && !I.busy ? '' : 'disabled'}>${icon('table', 'ic-s')} ${I.busy ? 'שולח לשרת…' : 'כתוב ' + I.res.sessions.length + ' שורות לטבלת המעקב'}</button>`}${G.server && G.server.dryRun && live() ? '<p class="hint" style="margin:8px 0 0">השרת במצב בדיקה – יוצג מה היה נכתב, בלי לכתוב לטבלה.</p>' : ''}</div>` : ''}`;
};
// ---------- intake: guided completion of missing fields ("השלמת פרטים חסרים") ----------
/** Fields that must be filled before writing to the tracking sheet. Not required: facResidence, notes, order numbers, amount, travel. */
const REQ = ['funder', 'authority', 'settlement', 'location', 'domain', 'activity', 'type', 'audience', 'participants', 'facilitator', 'expected', 'startDate', 'hours', 'g15'];
const REQ_LABEL = { g15: 'סה"כ קבוצות לתמחור', startDate: 'תאריך המפגש הראשון', expected: 'כמות מפגשים צפויים', location: 'מיקום הפעילות + שם המוסד' };
const fillLabel = (k) => REQ_LABEL[k] || (IF.find((x) => x[0] === k) || [k, k])[1];
function reqValid(R, k) {
  if (k === 'g15') return R.sessions.length > 0 && R.sessions.every((_, i) => String((R.g15 || [])[i] || '').trim());
  const v = String(R.F[k] || '').trim(); if (!v) return false;
  if (k === 'startDate') return !!parseDMY(v);
  if (k === 'hours') return /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(v);
  if (k === 'participants' || k === 'expected') return /^\d+$/.test(v) && +v > 0;
  return true;
}
const missingReq = (R) => (R ? REQ.filter((k) => !reqValid(R, k)) : []);
/** cells the branch head is asked about: everything empty, plus values the parser only guessed (defaults / inferred / fuzzy match) */
const askReq = (R) => (R ? REQ.filter((k) => !reqValid(R, k) || (k !== 'g15' && ['inferred', 'matched'].includes(R.flag[k]))) : []);
function settOptions(auth) {
  if (!auth) return [];
  const l = [...new Set([...(DATA.facil.settlements[auth] || []), ...(((CL.intake || {}).regional || {})[auth] || [])])];
  return l.length ? l : [auth];
}
function fillOptions(k, R) {
  if (k === 'authority') return [...BR().authorities, ...EXTRA_AUTH];
  if (k === 'settlement') return settOptions(R.F.authority);
  if (k === 'activity') return [...new Set([...ACTIVITIES, ...DATA.facil.activities])];
  if (k === 'location') { const br = BR(); const l = (S.sessions || []).filter((x) => x.tab === br.tab && x.location && (!R.F.settlement || x.settlement === R.F.settlement)).map((x) => x.location); return l.length ? [...new Set(l)].slice(-8).reverse() : null; }
  return OPTS[k] || null;
}
function openFill(auto) {
  const R = UI.intake && UI.intake.res; if (!R) return;
  const keys = auto ? askReq(R) : (missingReq(R).length ? missingReq(R) : askReq(R));
  if (!keys.length) { if (!auto) toast('כל הפרטים מלאים'); return; }
  UI.fill = { keys, i: 0, q: '', v: '', v2: '' };
  fillSheet();
}
function fillSheet() {
  const P = UI.fill, R = UI.intake.res, k = P.keys[P.i], n = P.keys.length;
  const cur = k === 'g15' ? ((R.g15 || []).find((x) => x) || '') : (R.F[k] || '');
  let ctl = '';
  const opts = fillOptions(k, R);
  if (k === 'facilitator') {
    if (P.q == null || (P.qFor !== k && !P.q)) { P.q = cur; } P.qFor = k;
    const list = facSuggestions(P.q).slice(0, 8);
    ctl = `<input class="inp" type="search" data-in="mf-q" value="${esc(P.q)}" placeholder="הקלד שם מנחה" autocomplete="off" aria-label="חיפוש מנחה">
    <div class="mf-list">${list.length ? list.map((f) => `<button class="mf-row" data-act="mf-fac" data-i="${FACS.indexOf(f)}"><b>${esc(f.n)}</b><small>${f.h ? esc(f.h) : ''}</small></button>`).join('') : '<p class="muted small">אין התאמה ברשימת המנחים</p>'}</div>
    ${P.q.trim() ? `<button class="btn btn-out btn-s" data-act="mf-free" style="margin-top:8px">השתמש ב"${esc(P.q.trim())}" (לא ברשימה)</button>` : ''}`;
  } else if (opts && k === 'activity') {
    const q = nrm(P.q), list = opts.filter((o) => !q || nrm(o).includes(q)).slice(0, 14);
    ctl = `<input class="inp" type="search" data-in="mf-q" value="${esc(P.q)}" placeholder="חיפוש פעילות" autocomplete="off" aria-label="חיפוש פעילות">
    <div class="chips mf-chips">${list.map((o) => `<button class="chip ${o === cur ? 'on' : ''}" data-act="mf-pick" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
    ${P.q.trim() && !opts.some((o) => nrm(o) === q) ? `<button class="btn btn-out btn-s" data-act="mf-free" style="margin-top:8px">השתמש ב"${esc(P.q.trim())}"</button>` : ''}`;
  } else if (opts) {
    if (k === 'settlement' && !R.F.authority) ctl = '<p class="muted">בחר קודם רשות – הישובים מוצגים לפי הרשות.</p>';
    ctl += `<div class="chips mf-chips">${opts.map((o) => `<button class="chip ${o === cur ? 'on' : ''}" data-act="mf-pick" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    if (k === 'settlement' || k === 'location') ctl += `<input class="inp" style="margin-top:10px" data-in="mf-in" value="${esc(P.v)}" placeholder="${k === 'location' ? 'מוסד אחר – הקלד כאן' : 'ישוב אחר – הקלד כאן'}" aria-label="אחר">`;
  } else if (k === 'startDate') {
    const d = parseDMY(cur); const iso = d ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` : '';
    ctl = `<input class="inp" type="date" data-in="mf-in" value="${esc(P.v || iso)}" aria-label="תאריך" dir="ltr">`;
  } else if (k === 'hours') {
    const [a, b] = String(cur).split('-');
    ctl = `<div class="mf-hours"><label>התחלה<input class="inp" type="time" data-in="mf-in" value="${esc(P.v || (/^\d{2}:\d{2}$/.test(a || '') ? a : ''))}" dir="ltr"></label><label>סיום<input class="inp" type="time" data-in="mf-in2" value="${esc(P.v2 || (/^\d{2}:\d{2}$/.test(b || '') ? b : ''))}" dir="ltr"></label></div>`;
  } else if (k === 'participants' || k === 'expected' || k === 'g15') {
    const quick = k === 'expected' ? [1, 4, 6, 8, 10, 12] : k === 'g15' ? [1, 0.5, 2] : [10, 12, 15, 20, 25, 30];
    ctl = `<input class="inp" inputmode="${k === 'g15' ? 'decimal' : 'numeric'}" data-in="mf-in" value="${esc(P.v || cur)}" aria-label="${esc(fillLabel(k))}" dir="ltr">
    <div class="chips mf-chips" style="margin-top:8px">${quick.map((q) => `<button class="chip s" data-act="mf-pick" data-v="${q}">${q}</button>`).join('')}</div>
    ${k === 'g15' ? `<p class="muted small" style="margin-top:6px">הערך יוחל על כל ${R.sessions.length} המפגשים.</p>` : ''}`;
  } else {
    ctl = `<input class="inp" data-in="mf-in" value="${esc(P.v || cur)}" placeholder="${k === 'location' ? 'לדוגמה: גן רימון, כפר ורדים' : ''}" aria-label="${esc(fillLabel(k))}">`;
  }
  const typed = !opts || k === 'settlement' || ['startDate', 'hours', 'participants', 'expected', 'g15', 'location'].includes(k);
  const keep = cur && k !== 'g15' && reqValid(R, k) ? `<button class="btn btn-sec" data-act="mf-keep">השאר "${esc(cur)}"</button>` : '';
  sheet(`<div class="mf-top"><span class="tag warn">${P.i + 1} מתוך ${n}</span>${cur && k !== 'g15' ? '<span class="tag">לאשר או לשנות</span>' : '<span class="tag">חסר בהודעה</span>'}<div class="mf-bar"><i style="width:${Math.round((P.i / n) * 100)}%"></i></div></div>
  <h3>${esc(fillLabel(k))}</h3>
  ${ctl}
  <div class="btn-row" style="margin-top:14px">${keep}${typed ? `<button class="btn btn-pri" data-act="mf-next">${P.i + 1 < n ? 'הבא' : 'סיום'}</button>` : ''}<button class="btn btn-out" data-act="mf-skip">דלג</button><button class="btn btn-out" data-act="mf-close">השלם אחר כך</button></div>`);
}
/** stores a value for the current step; returns false (with a toast) if it is not valid */
function fillSet(k, raw) {
  const R = UI.intake.res; let v = String(raw == null ? '' : raw).trim();
  if (!v) { toast('בחר או הקלד ערך, או "דלג"'); return false; }
  if (k === 'startDate') { const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) v = `${m[3]}/${m[2]}/${m[1]}`; if (!parseDMY(v)) { toast('תאריך לא תקין'); return false; } }
  if ((k === 'participants' || k === 'expected') && !/^\d+$/.test(v)) { toast('הקלד מספר'); return false; }
  if (k === 'g15') { if (!/^\d+(\.\d+)?$/.test(v)) { toast('הקלד מספר'); return false; } R.g15 = R.sessions.map(() => v); R.g15AllV = v; return true; }
  R.F[k] = v; R.flag[k] = 'ok';
  if (k === 'authority' && R.F.settlement && !settOptions(v).includes(R.F.settlement) && !(DATA.facil.settlements[v] || []).length) { R.F.settlement = ''; R.flag.settlement = 'missing'; }
  if (k === 'settlement' && !R.F.authority) { const hit = SETT_LIST.find((x) => x.s === v); if (hit && BR().authorities.includes(hit.a)) { R.F.authority = hit.a; R.flag.authority = 'ok'; } }
  if (k === 'startDate') { const d = parseDMY(v); R.F.weekday = DAYS[d.getDay()]; R.flag.weekday = 'ok'; }
  if (k === 'startDate' || k === 'expected') { const g = R.g15AllV; regenSessions(R); if (g) R.g15 = R.sessions.map(() => g); }
  return true;
}
function fillAdvance() {
  const P = UI.fill, R = UI.intake.res;
  P.q = ''; P.v = ''; P.v2 = ''; P.qFor = null;
  // later steps may already be solved (e.g. authority inferred from settlement); steps may also appear (sessions regenerated → g15)
  const rest = missingReq(R).filter((k) => !P.keys.includes(k));
  const later = P.keys.slice(P.i + 1).filter((k) => !reqValid(R, k) || ['inferred', 'matched'].includes(R.flag[k]));
  P.keys = [...P.keys.slice(0, P.i + 1), ...later, ...rest];
  P.i++;
  if (P.i >= P.keys.length) { closeSheet(); UI.fill = null; rerender(); const left = missingReq(R).length; toast(left ? `נשארו ${left} פרטים חסרים` : 'כל הפרטים הושלמו – אפשר לכתוב לטבלה'); return; }
  fillSheet();
}
// ---------- my tab in the tracking sheet (sessions.recent) ----------
const TAB = { key: null, data: null, loading: false, err: null, at: 0 };
async function loadTab(force) {
  if (!live() || TAB.loading) return;
  const key = userKey(); if (!force && TAB.key === key && Date.now() - TAB.at < 120000) return;
  if (!force && TAB.key === key && TAB.failAt && Date.now() - TAB.failAt < 60000) return;
  TAB.loading = true; TAB.err = null; TAB.key = key;
  try { const r = await api.call('sessions.recent', { limit: 15 }, { queueable: false }); if (r && Array.isArray(r.rows)) { TAB.data = r; TAB.at = Date.now(); } }
  catch (e) { TAB.err = (e && e.message) || 'שגיאה'; TAB.failAt = Date.now(); }
  TAB.loading = false; if (location.hash.startsWith('#/intake')) rerender();
}
function tabPanel() {
  const br = BR();
  if (!live()) return `<h2 class="h2" style="margin-top:22px">הלשונית שלי בטבלת המעקב · ${esc(br.tab)}</h2><p class="muted small">במצב הדגמה לא מוצגות שורות מהטבלה. אחרי כניסה יופיעו כאן המפגשים האחרונים שנרשמו בלשונית "${esc(br.tab)}".</p>`;
  if (TAB.key !== userKey() || Date.now() - TAB.at > 120000) setTimeout(() => loadTab(false), 0);
  const d = TAB.key === userKey() ? TAB.data : null;
  const rows = d ? d.rows : [];
  const card = (r) => `<article class="tab-row"><div class="tr-top"><b>${esc(r.date || '—')}</b>${r.hours ? `<span class="muted">${esc(r.hours)}</span>` : ''}${r.status ? `<span class="tag ${/בוצע/.test(r.status) ? 'ok' : /בוטל/.test(r.status) ? 'bad' : ''}">${esc(r.status)}</span>` : ''}<span class="muted small tr-n">שורה ${r.row}</span></div>
  <div class="tr-mid">${esc(r.activityName || r.activityType || '')}${r.sessionNumber ? ` · מפגש ${esc(r.sessionNumber)}${r.expectedSessions ? '/' + esc(r.expectedSessions) : ''}` : ''}</div>
  <div class="muted small">${[r.authority, r.locality && r.locality !== r.authority ? r.locality : '', r.location, r.facilitator].filter(Boolean).map(esc).join(' · ')}</div></article>`;
  return `<h2 class="h2" style="margin-top:22px">הלשונית שלי בטבלת המעקב · ${esc(d ? d.tab : br.tab)}</h2>
  <div class="sec"><span>${TAB.loading ? 'טוען…' : d ? `${rows.length} השורות האחרונות${d.total ? ' מתוך ' + d.total : ''}` : ''}</span><button class="lnk" data-act="tab-refresh">רענן</button></div>
  ${TAB.err ? `<div class="banner-demo">${icon('info', 'ic-s')}<span>לא הצלחתי לטעון את הלשונית (${esc(TAB.err)}).</span></div>` : ''}
  ${d && !rows.length ? '<div class="empty">אין עדיין שורות בלשונית.</div>' : ''}
  ${rows.slice().reverse().map(card).join('')}
  ${d && d.url ? `<a class="btn btn-out" style="margin-top:10px;width:100%" href="${esc(d.url)}" target="_blank" rel="noopener">${icon('table', 'ic-s')} פתח את הלשונית בגוגל שיטס</a><p class="muted small" style="margin-top:4px">נפתח רק למי שיש לו הרשאה לטבלה.</p>` : ''}`;
}
function showFacSugg(q) {
  const ul = $('#fac-sugg'); if (!ul) return;
  const list = facSuggestions(q);
  if (!list.length) { ul.hidden = true; ul.innerHTML = ''; return; }
  let sepDone = false;
  ul.innerHTML = list.map((f) => { const i = FACS.indexOf(f); const sep = f.weak && !sepDone ? (sepDone = true, '<li class="sep-h" role="presentation">שמות חלקיים / שמות פעילות</li>') : ''; return `${sep}<li class="${f.weak ? 'weak' : ''}" role="option"><button type="button" data-act="fac-pick" data-i="${i}"><span class="sn">${esc(f.n)}</span><span class="sh">${f.h ? esc(f.h) : 'מקום מגורים חסר'}</span></button></li>`; }).join('');
  ul.hidden = false;
}
function cellsTable(rows) {
  return `<div class="tbwrap" tabindex="0" aria-label="שורות לטבלת המעקב (גלילה לצדדים)"><table><thead><tr>${COLS.map((c, i) => `<th class="${FIN_COLS.includes(i) ? 'fin' : ''}">${i} ${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${COLS.map((c, i) => `<td class="${FIN_COLS.includes(i) ? 'fin' : ''}">${esc(r[i] == null ? '' : r[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function writtenBlock(I) {
  const R = I.res, local = R.sessions.map((d, i) => rowFor(R.F, d, i, R.sessions.length, (R.g15 || [])[i]));
  const r = I.result || {}, tab = r.tab || BR().tab;
  const nav = `<div class="btn-row" style="margin-top:12px"><a class="btn btn-pri" href="#/week">${icon('cal', 'ic-s')} להשבוע שלי</a><button class="btn btn-sec" data-act="in-new">קליטה חדשה</button></div>`;
  if (r.demo) return `<div id="written"><h2 class="h2">${icon('check')} ${local.length} שורות מוכנות ללשונית "${esc(tab)}"</h2>
  <div class="banner-demo">${icon('info', 'ic-s')}<span>מצב הדגמה: השורות <b>לא</b> נשלחו לשרת. כך הן ייכתבו לטבלת המעקב, לשונית "${esc(tab)}". הן נוספו ל"השבוע שלי".</span></div>${cellsTable(local)}${nav}</div>`;
  if (r.queued) return `<div id="written"><h2 class="h2">${icon('clock')} ${local.length} שורות ממתינות לשליחה</h2>
  <div class="banner-demo" style="background:var(--warn-bg);color:var(--warn-ink)">${icon('alert', 'ic-s')}<span><b>אין חיבור לשרת.</b> השורות נשמרו בתור ויישלחו אוטומטית כשהחיבור יחזור (פעם אחת בלבד).</span></div>${cellsTable(local)}${nav}</div>`;
  if (r.dryRun) return `<div id="written"><h2 class="h2">${icon('info')} השרת החזיר ${r.rows || local.length} שורות</h2>
  <div class="banner-dry" role="status">${icon('alert', 'ic-s')}<span><b>מצב בדיקה – לא נכתב לטבלה.</b> השרת פועל במצב בדיקה (DRY_RUN). אלה התאים שהיו נכתבים ללשונית "${esc(tab)}".${r.duplicate ? ' (הבקשה כבר נשלחה קודם.)' : ''}</span></div>${cellsTable(r.cells || local)}${nav}</div>`;
  return `<div id="written"><h2 class="h2">${icon('check')} נכתבו ${r.rows || local.length} שורות לטבלת המעקב</h2>
  <div class="banner-ok" role="status">${icon('check', 'ic-s')}<span>לשונית "${esc(tab)}", החל משורה ${esc(r.firstRow)}.${r.duplicate ? ' הבקשה כבר נשלחה קודם – לא נכתב שוב.' : ''}${r.warning ? '<br>' + esc(r.warning) : ''}</span></div>${cellsTable(local)}${nav}</div>`;
}
function serverErrBlock(E) {
  const rows = Array.isArray(E.details) ? E.details : [];
  return `<div class="banner-demo" role="alert" style="background:var(--risk-bg);color:var(--live-ink);margin-top:12px">${icon('alert', 'ic-s')}<span><b>השרת לא כתב את השורות:</b> ${esc(E.message || E.code || 'שגיאה')}${rows.length ? `<br>${rows.slice(0, 6).map((x) => `מפגש ${(x.index || 0) + 1}: ${esc((x.errors || []).join(' · '))}`).join('<br>')}` : ''}<br>תקן בטבלת האישור ונסה שוב.</span></div>`;
}

// ---------- assessment → סיכום פגישה ----------
const MEET_TYPES = [['assess', 'הערכת מצב'], ['routine', 'פגישה שוטפת'], ['institution', 'פגישה עם מוסד'], ['contact', 'פגישה עם איש קשר']];
const meetLabel = (t) => (MEET_TYPES.find(([k]) => k === (t || 'assess')) || MEET_TYPES[0])[1];
/** Text sent to analysis: for meetings other than situation assessment, prefix the meeting context. */
function meetText(A) { const t = A.mtype || 'assess'; if (t === 'assess') return A.text; return `סוג: ${meetLabel(t)}${A.mwith ? ' – ' + A.mwith : ''}\n${A.text}`; }
V.assess = (q) => {
  const A = UI.assess || (UI.assess = { eventId: q.e || (openEvents()[0] ? openEvents()[0].id : ''), text: '', time: '', res: null, saved: null, mtype: 'assess', mwith: '' });
  if (q.e && A.eventId !== q.e && !A.text) A.eventId = q.e;
  if (q.e && !A.text) A.mtype = 'assess';
  const ev = A.eventId ? getEv(A.eventId) : null;
  if (!A.time) A.time = ev ? toLocalInput(ev.startedAt) : '';
  const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const R = A.res;
  return `${ev && !ev.closedAt ? `<div class="head" style="position:sticky;top:0;z-index:20">${statusBar(ev)}` : '<div class="head" style="position:sticky;top:0;z-index:20">'}${appBar('סיכום פגישה', A.mtype && A.mtype !== 'assess' ? meetLabel(A.mtype) + (A.mwith ? ' · ' + A.mwith : '') : ev ? evTitle(ev) + (ev.mode === 'ongoing' ? ' · יום ' + ev.day : '') : 'ללא אירוע פעיל', ev ? '#/event/' + ev.id : '#/home')}</div>
<main class="pad">
  <div class="lbl">סוג הפגישה</div>
  <div class="chips">${MEET_TYPES.map(([k, l]) => `<button class="chip s ${(A.mtype || 'assess') === k ? 'on' : ''}" data-act="as-type" data-v="${k}">${esc(l)}</button>`).join('')}</div>
  ${(A.mtype === 'institution' || A.mtype === 'contact') ? `<label class="lbl" for="aswith">${A.mtype === 'institution' ? 'שם המוסד' : 'עם מי הפגישה'}</label><input class="inp" id="aswith" data-in="as-with" value="${esc(A.mwith || '')}" placeholder="${A.mtype === 'institution' ? 'לדוגמה: בי״ס יסודי אורט, עכו' : 'שם ותפקיד'}" ${A.mtype === 'contact' ? 'list="as-ct"' : ''}>${A.mtype === 'contact' ? `<datalist id="as-ct">${S.contacts.map((c) => `<option value="${esc(c.name + (c.role ? ' – ' + roleName(c.role) : ''))}">`).join('')}</datalist>` : ''}` : ''}
  <label class="lbl" for="asev">אירוע${(A.mtype || 'assess') === 'assess' ? '' : ' <span class="muted">(לא חובה)</span>'}</label>
  <select class="sel" id="asev" data-in="as-ev"><option value="">ללא אירוע</option>${S.events.map((e) => `<option value="${e.id}" ${e.id === A.eventId ? 'selected' : ''}>${esc(evTitle(e))}${e.closedAt ? ' (נסגר)' : ''}</option>`).join('')}</select>
  <label class="lbl" for="astime">${(A.mtype || 'assess') === 'assess' ? 'מתי קרה האירוע? <span class="muted">קובע את כללי העיתוי</span>' : 'מתי הייתה הפגישה?'}</label>
  <input class="inp" id="astime" type="datetime-local" data-in="as-time" value="${esc(A.time)}">
  ${ev ? `<div class="card" style="margin-top:12px"><b>${icon('list', 'ic-s')} 6 השאלות הראשונות · ${q6Answered(ev)}/6</b>${q6Lines(ev).length ? `<div class="muted" style="white-space:pre-line;margin-top:4px">${esc(q6Lines(ev).join('\n'))}</div>` : '<p class="muted">עוד לא נענו.</p>'}<a class="lnk" href="#/event/${ev.id}">ענה בצ'קליסט (שלב 01)</a><p class="muted small">התשובות נכנסות לניתוח.</p></div>` : ''}
  <label class="lbl" for="astext">סיכום הפגישה (הקלדה או הכתבה)</label>
  <textarea class="ta" id="astext" data-in="as-text" rows="7" placeholder="מה קרה, מה ראית, עם מי דיברת, מה ביקשו ממך…">${esc(A.text)}</textarea>
  <div class="btn-row" style="margin-top:8px">${hasSpeech ? `<button class="btn btn-out mic ${UI.rec ? 'on' : ''}" data-act="as-mic">${icon('mic', 'ic-s')} ${UI.rec ? 'עצור הכתבה' : 'הכתבה'}</button>` : `<span class="muted small" style="align-self:center">הכתבה: השתמש במיקרופון של המקלדת</span>`}<button class="btn btn-out" data-act="as-sample">דוגמה</button><button class="btn btn-pri" data-act="as-run" ${A.text.trim() ? '' : 'disabled'}>נתח</button></div>
  <p class="muted small" style="margin-top:6px">"נתח" = ניתוח אוטומטי בסיסי, על הטלפון.</p>
  <div class="btn-row" style="margin-top:8px">${claudeBtn('as')}${aiAvailable() ? `<button class="btn btn-sec" data-act="as-ai" ${A.aiBusy ? 'disabled' : ''}>${icon('bulb', 'ic-s')} ${A.aiBusy ? 'מנתח…' : 'ניתוח AI בשרת'}</button>` : ''}</div>${privacyLine}
  ${A.claude ? claudePanel('as', A.claude) : ''}
  ${R ? assessResult(R, A) : ''}
  ${S.assessments.length ? `<div class="sec">סיכומים קודמים</div><ul class="list">${S.assessments.slice().reverse().slice(0, 6).map((a) => `<li><button class="row" style="width:100%;text-align:right" data-act="as-open" data-id="${a.id}"><span class="av">${icon('clip', 'ic-s')}</span><span class="row-t"><b>${esc(a.text.slice(0, 50))}${a.text.length > 50 ? '…' : ''}</b><span>${esc(meetLabel(a.mtype))}${a.mwith ? ' · ' + esc(a.mwith) : ''} · ${whenLabel(a.t)} · ${a.result.recs.length} המלצות${a.result.by === 'claude' ? ' · <span class="tag claude">נותח ע"י Claude</span>' : ''}</span></span></button></li>`).join('')}</ul>` : ''}
</main>`;
};
function assessResult(R, A) {
  const phName = R.phase ? PHASES.find((p) => p.id === R.phase).name : null;
  return `<div id="as-res">
  <p style="margin-top:16px">${R.by === 'claude' ? '<span class="tag claude">נותח ע"י Claude</span>' : '<span class="tag">ניתוח אוטומטי בסיסי</span>'}</p>
  ${phName ? `<p class="tag" style="margin-top:8px;display:inline-block">שלב משוער: ${PH_NUM[R.phase]} ${esc(phName)}${R.H != null ? ' · ' + Math.round(R.H) + ' שעות מהאירוע' : ''}</p>` : ''}
  ${R.summary ? `<div class="ins" style="margin-top:10px"><b>סיכום</b><p style="white-space:pre-line">${esc(R.summary)}</p></div>` : ''}
  <h2 class="h2">${icon('bulb')} תובנות</h2>
  ${R.insights.map((i) => `<div class="ins"><b>${esc(i.text)}</b>${i.dim || i.basis ? `<div class="tags">${i.dim ? `<span class="tag">${esc(i.dim)}</span>` : ''}${i.basis ? `<span class="tag ${i.basis === 'ידיעה' ? 'warn' : 'ok'}">${esc(i.basis)}</span>` : ''}</div>` : ''}</div>`).join('')}
  <h2 class="h2">${icon('check')} המלצות להמשך</h2>
  ${R.recs.map((r) => `<div class="rec ${r.miss ? 'miss-rec' : ''}"><b>${esc(r.text)}</b><div class="meta">${r.owner ? icon('user', 'ic-xs') + ' ' + esc(roleName(r.owner)) : ''}${r.timing ? ' · ' + icon('clock', 'ic-xs') + ' ' + esc(r.timing) : ''}${r.leg ? ' · רגל ' + esc(r.leg) : ''}</div>${r.svc && SVC[r.svc] ? `<div class="svc">מענה משאבים: ${esc(SVC[r.svc].name)}</div>` : r.svc ? `<div class="svc">מענה: ${esc(r.svc)}</div>` : ''}${r.src ? srcLine(r.src) : ''}</div>`).join('')}
  ${(R.notes || []).map((n) => `<p class="muted">${icon('info', 'ic-xs')} ${esc(n)}</p>`).join('')}
  ${R.risks.length ? `<h2 class="h2">${icon('alert')} סיכונים</h2>${R.risks.map((r) => `<div class="risk"><b>${esc(r.text)}</b>${r.ifNotHandled ? `<div class="muted">אם לא מטפלים: ${esc(r.ifNotHandled)}</div>` : ''}</div>`).join('')}` : ''}
  ${R.questions.length ? `<h2 class="h2">${icon('info')} שאלות להשלמה</h2><ul class="qs">${R.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
  <p class="src" ${R.by === 'claude' ? 'hidden' : ''}>${icon('file')} לפי: המסגרת המקצועית למודול הערכת מצב (משאבים) – נוהל הפעלה בחירום 2025, קטלוג מענים, לקחי אורט מעלות</p>
  <div class="btn-row" style="margin-top:10px"><button class="btn btn-out" data-act="as-copy">${icon('copy', 'ic-s')} העתק</button>${A.saved ? `<span class="tag ok" style="align-self:center">${icon('check', 'ic-xs')} נשמר${A.eventId ? ' ביומן האירוע' : ''}</span>` : ''}</div>
  </div>`;
}
function assessText(R) {
  const L = ['*תובנות:*', ...R.insights.map((i) => '• ' + i.text), '', '*המלצות:*', ...R.recs.map((r, i) => `${i + 1}. ${r.text} (${roleName(r.owner)}, ${r.timing})`)];
  if (R.risks.length) L.push('', '*סיכונים:*', ...R.risks.map((r) => '• ' + r.text));
  if (R.questions.length) L.push('', '*שאלות פתוחות:*', ...R.questions.map((q) => '• ' + q));
  return L.join('\n');
}
const SAMPLE_ASSESS = 'עכו, נפילה ליד בית ספר יסודי. אין פצועים פיזית. הרבה ילדים בבכי, ההורים הגיעו בהמוניהם וחיכו בלי מידע. השפ"ח היה שם. מנהלת הרווחה ביקשה עזרה לצוות בית הספר. יש שמועות ברשת שהיו פצועים. צוותי החירום עובדים ברצף ונראים מותשים.';

// ---------- week ----------
function sessionsInWeek(off) {
  const sun = startOfDay(new Date()); sun.setDate(sun.getDate() - sun.getDay() + 7 * off); const sat = new Date(sun); sat.setDate(sun.getDate() + 7);
  return S.sessions.filter((s) => { const d = parseDMY(s.date); return d && d >= sun && d < sat; }).sort((a, b) => parseDMY(a.date) - parseDMY(b.date) || String(a.hours).localeCompare(String(b.hours)));
}
V.weekLocal = () => {
  const off = UI.weekOff; const sun = startOfDay(new Date()); sun.setDate(sun.getDate() - sun.getDay() + 7 * off); const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
  const list = sessionsInWeek(off); const byDay = {}; list.forEach((s) => (byDay[s.date] = byDay[s.date] || []).push(s));
  const upcoming = S.sessions.filter((s) => { const d = parseDMY(s.date); return d && d > sat; }).length;
  return `${appBar('השבוע שלי', BR().name + ' · מפגשים מתואמים', '#/home')}
<main class="pad">
  <div class="weeknav"><button class="icon-btn" data-act="wk" data-v="-1" aria-label="שבוע קודם">${icon('chevR')}</button><div style="text-align:center"><b>${ddmm(sun)} – ${ddmm(sat)}</b><div class="muted">${off === 0 ? 'השבוע' : off === 1 ? 'שבוע הבא' : off === -1 ? 'שבוע שעבר' : ''}</div></div><button class="icon-btn" data-act="wk" data-v="1" aria-label="שבוע הבא">${icon('chevL')}</button></div>
  <div class="tags" style="justify-content:center;margin-bottom:6px"><span class="tag">${list.filter((s) => s.status === 'תואם').length} תואם</span><span class="tag ok">${list.filter((s) => s.status === 'בוצעה').length} בוצעה</span><span class="tag">${list.filter((s) => s.status === 'בוטלה').length} בוטלה</span></div>
  ${list.length ? Object.entries(byDay).map(([d, ss]) => { const dt = parseDMY(d); return `<div class="day-h ${isSameDay(dt, new Date()) ? 'today' : ''}">${icon('cal', 'ic-s')} יום ${DAYS[dt.getDay()]} · ${d}${isSameDay(dt, new Date()) ? ' · היום' : ''}</div>${ss.map(sessionCard).join('')}`; }).join('') : '<div class="empty">אין מפגשים בשבוע הזה.</div>'}
  ${upcoming ? `<p class="muted" style="margin-top:14px;text-align:center">${upcoming} מפגשים נוספים בשבועות הבאים</p>` : ''}
  <p class="muted small" style="margin-top:14px">"השבוע שלי" מציג קבוצות שנקלטו מהטלפון הזה. סימון "בוצעה" / "בוטלה" נשמר בטלפון בלבד – את עמודת הסטטוס בטבלת המעקב מעדכנים ידנית.</p>
</main>
<div class="bottom"><a class="btn btn-sec btn-xl" href="#/intake">${icon('plus', 'ic-s')} קליטת קבוצה מהודעה</a></div>`;
};
// ---------- "השבוע שלי" from the branch tab in the tracking sheet (sessions.week / sessions.setStatus) ----------
const WEEK = { cache: {}, loading: null, err: null, fail: {} };
function weekBounds(off) { const sun = startOfDay(new Date()); sun.setDate(sun.getDate() - sun.getDay() + 7 * off); const sat = new Date(sun); sat.setDate(sun.getDate() + 6); return { sun, sat }; }
const weekKey = (off) => userKey() + '|' + off;
async function loadWeek(off, force) {
  if (!live()) return; const k = weekKey(off), c = WEEK.cache[k];
  if (!force && c && Date.now() - c.at < 120000) return; if (WEEK.loading === k) return;
  if (!force && WEEK.fail[k] && Date.now() - WEEK.fail[k] < 60000) return;
  WEEK.loading = k; WEEK.err = null; if (location.hash.startsWith('#/week')) rerender();
  const { sun, sat } = weekBounds(off);
  try { const r = await api.call('sessions.week', { from: ddmmyyyy(sun), to: ddmmyyyy(sat) }, { queueable: false }); if (r && Array.isArray(r.rows)) WEEK.cache[k] = { ...r, at: Date.now() }; }
  catch (e) { WEEK.err = (e && e.message) || 'שגיאה'; WEEK.fail[k] = Date.now(); }
  WEEK.loading = null; if (location.hash.startsWith('#/week') || location.hash === '#/home' || location.hash === '') rerender();
}
function weekCountLive() { const c = WEEK.cache[weekKey(0)]; return c ? c.rows.filter((r) => r.status === 'תואם').length : null; }
V.week = () => {
  if (!live()) return V.weekLocal();
  const off = UI.weekOff || 0, { sun, sat } = weekBounds(off), k = weekKey(off), c = WEEK.cache[k];
  if (!c || Date.now() - c.at > 120000) setTimeout(() => loadWeek(off, false), 0);
  const rows = c ? c.rows.slice().sort((a, b) => (parseDMY(a.date) - parseDMY(b.date)) || String(a.hours).localeCompare(String(b.hours))) : [];
  const byDay = {}; rows.forEach((r) => (byDay[r.date] = byDay[r.date] || []).push(r));
  const cnt = (st) => rows.filter((r) => r.status === st).length;
  return `${appBar('השבוע שלי', 'מתוך טבלת המעקב · לשונית ' + (c ? c.tab : BR().tab), '#/home')}
<main class="pad">
  <div class="weeknav"><button class="icon-btn" data-act="wk" data-v="-1" aria-label="שבוע קודם">${icon('chevR')}</button><div style="text-align:center"><b>${ddmm(sun)} – ${ddmm(sat)}</b><div class="muted">${off === 0 ? 'השבוע' : off === 1 ? 'שבוע הבא' : off === -1 ? 'שבוע שעבר' : ''}</div></div><button class="icon-btn" data-act="wk" data-v="1" aria-label="שבוע הבא">${icon('chevL')}</button></div>
  <div class="tags" style="justify-content:center;margin-bottom:6px"><span class="tag">${cnt('תואם')} תואם</span><span class="tag ok">${cnt('בוצע')} בוצע</span><span class="tag bad">${cnt('בוטלה')} בוטלה</span></div>
  <div class="sec"><span>${WEEK.loading === k ? 'טוען מהטבלה…' : c ? rows.length + ' מפגשים בלשונית' : ''}</span><button class="lnk" data-act="wk-refresh">רענן</button></div>
  ${WEEK.err ? `<div class="banner-demo">${icon('info', 'ic-s')}<span>לא הצלחתי לטעון מהטבלה (${esc(WEEK.err)}).</span></div>` : ''}
  ${c && !rows.length ? '<div class="empty">אין מפגשים בשבוע הזה בלשונית.</div>' : ''}
  ${Object.entries(byDay).map(([d, ss]) => { const dt = parseDMY(d); return `<div class="day-h ${dt && isSameDay(dt, new Date()) ? 'today' : ''}">${icon('cal', 'ic-s')} ${dt ? 'יום ' + DAYS[dt.getDay()] + ' · ' : ''}${esc(d)}${dt && isSameDay(dt, new Date()) ? ' · היום' : ''}</div>${ss.map(weekCard).join('')}`; }).join('')}
  ${c && c.url ? `<a class="btn btn-out" style="margin-top:12px;width:100%" href="${esc(c.url)}" target="_blank" rel="noopener">${icon('table', 'ic-s')} פתח את הלשונית בגוגל שיטס</a>` : ''}
  <p class="muted small" style="margin-top:10px">מוצגים כל המפגשים מהלשונית של השלוחה, לא משנה מי הזין אותם. סימון "בוצע" / "בוטלה" מעדכן את עמודת הסטטוס בטבלה – אחרי אישור.</p>
</main>
<div class="bottom"><a class="btn btn-sec btn-xl" href="#/intake">${icon('plus', 'ic-s')} קליטת קבוצה מהודעה</a></div>`;
};
function weekCard(r) {
  const cls = r.status === 'בוצע' ? 's-done' : r.status === 'בוטלה' ? 's-cancel' : '';
  const b = (v, label, ic) => `<button class="btn btn-out ${r.status === v ? (v === 'בוטלה' ? 'sel-cancel' : 'sel-done') : ''}" data-act="wst" data-row="${r.row}" data-v="${v}" ${r.status === v ? 'disabled' : ''}>${icon(ic, 'ic-s')} ${label}</button>`;
  return `<div class="ss ${cls}"><div class="ss-top"><b>${esc(r.activityName || r.activityType)}${r.audience ? ' · ' + esc(r.audience) : ''}</b><span class="ss-h" dir="ltr">${esc(r.hours)}</span></div>
  <div class="meta">${esc([r.authority, r.locality && r.locality !== r.authority ? r.locality : '', r.location].filter(Boolean).join(' · '))}${r.sessionNumber ? ' · מפגש ' + esc(r.sessionNumber) + (r.expectedSessions ? '/' + esc(r.expectedSessions) : '') : ''}</div>
  <div class="meta">מנחה: ${esc(r.facilitator || '—')} · סטטוס בטבלה: <b>${esc(r.status || '—')}</b> · שורה ${r.row}</div>
  <div class="btn-row">${b('בוצע', 'בוצע', 'check')}${b('בוטלה', 'בוטלה', 'x')}${r.status && r.status !== 'תואם' ? b('תואם', 'החזר לתואם', 'cal') : ''}</div></div>`;
}
function weekRowByNum(row) { const c = WEEK.cache[weekKey(UI.weekOff || 0)]; return c ? c.rows.find((r) => String(r.row) === String(row)) : null; }
function sessionCard(s) {
  const cls = s.status === 'בוצעה' ? 's-done' : s.status === 'בוטלה' ? 's-cancel' : '';
  return `<div class="ss ${cls}"><div class="ss-top"><b>${esc(s.activity)} · ${esc(s.audience)}</b><span class="ss-h" dir="ltr">${esc(s.hours)}</span></div>
  <div class="meta">${esc(s.location || s.settlement)} · מפגש ${s.no}/${s.total}</div>
  <div class="meta">מנחה: ${esc(s.facilitator || '—')}${s.participants ? ' · ' + esc(s.participants) + ' משתתפים' : ''}${s.demo ? ' · <span class="tag">הדגמה</span>' : s.queued ? ' · <span class="tag warn">ממתין לשליחה</span>' : s.dry ? ' · <span class="tag warn">מצב בדיקה – לא בטבלה</span>' : ''}</div>
  <div class="btn-row"><button class="btn btn-out ${s.status === 'בוצעה' ? 'sel-done' : ''}" data-act="ss" data-id="${s.id}" data-v="בוצעה">${icon('check', 'ic-s')} בוצעה</button><button class="btn btn-out ${s.status === 'בוטלה' ? 'sel-cancel' : ''}" data-act="ss" data-id="${s.id}" data-v="בוטלה">${icon('x', 'ic-s')} בוטלה</button></div></div>`;
}

// ---------- contacts ----------
const KEY_AUTH_ROLES = ['welfare_manager', 'ceo_authority', 'kabat', 'education_manager', 'head_of_authority', 'community_sw', 'tzachi_coord', 'shefach'];
V.contacts = (q) => {
  const C = UI.ct, br = BR();
  const qq = C.q.trim();
  const list = S.contacts.filter((c) => !qq || (c.name + ' ' + c.phone + ' ' + roleName(c.role) + ' ' + c.authority).includes(qq));
  const groups = [];
  if (C.by === 'role') DATA.roles.forEach((r) => { const cs = list.filter((c) => c.role === r.id); if (cs.length) groups.push([r.name, cs]); });
  else [INTERNAL_AUTH, ALL_BRANCH, ...br.authorities].forEach((a) => { const cs = list.filter((c) => c.authority === a); groups.push([a, cs, a]); });
  const picker = 'contacts' in navigator && 'ContactsManager' in window;
  if (q && q.add && !UI.ctAddDone) { UI.ctAddDone = true; setTimeout(() => editContact(null, { role: q.add, authority: q.auth || INTERNAL_AUTH }), 0); }
  return `${appBar('אנשי קשר', 'לפי תפקיד ורשות · ' + br.name, '#/home')}
<main class="pad">
  <div class="btn-row"><button class="btn btn-pri" data-act="ct-pick" ${picker ? '' : 'aria-disabled="true"'}>${icon('users', 'ic-s')} בחר מאנשי הקשר</button><label class="btn btn-sec" style="cursor:pointer">${icon('upload', 'ic-s')} ייבוא vCard<input type="file" accept=".vcf,text/vcard,text/x-vcard" class="sr" data-in="ct-vcf"></label><button class="btn btn-out" data-act="ct-add">${icon('plus', 'ic-s')} ידני</button></div>
  <p class="muted small" style="margin-top:6px">${picker ? 'בחירה ישירה מאנשי הקשר בטלפון.' : 'באייפון: אנשי קשר ← בחירה ← שתף ← שמירה כקובץ vCard, ואז "ייבוא vCard". בחירה ישירה זמינה באנדרואיד (Chrome).'}</p>
  <div style="display:flex;gap:8px;margin-top:14px;align-items:center"><div class="seg s" style="flex:1"><button class="${C.by === 'role' ? 'on' : ''}" data-act="ct-by" data-v="role">לפי תפקיד</button><button class="${C.by === 'auth' ? 'on' : ''}" data-act="ct-by" data-v="auth">לפי רשות</button></div></div>
  <input class="inp" style="margin-top:10px" type="search" placeholder="חיפוש שם, תפקיד או רשות" data-in="ct-q" value="${esc(C.q)}" aria-label="חיפוש">
  ${groups.map(([g, cs, auth]) => `<div class="sec"><span>${esc(g)}</span><span class="muted">${cs.length}</span></div>
    ${cs.length ? `<ul class="list">${cs.map((c) => `<li class="row"><span class="av">${esc(c.name[0] || '?')}</span><span class="row-t"><b>${esc(c.name)}</b><span>${esc(C.by === 'role' ? c.authority : roleName(c.role))} · <span dir="ltr">${esc(c.phone)}</span>${c.lang === 'ar' ? ' · <span class="tag">ערבית</span>' : ''}</span></span><a class="icon-btn wa" href="${waLink(c.phone, '')}" target="_blank" rel="noopener" aria-label="וואטסאפ ל${esc(c.name)}">${icon('wa')}</a><a class="icon-btn" href="tel:${esc(normPhone(c.phone).local || c.phone)}" aria-label="חייג">${icon('phone')}</a><button class="icon-btn" data-act="ct-edit" data-id="${c.id}" aria-label="ערוך">${icon('edit')}</button></li>`).join('')}</ul>` : ''}
    ${auth && br.authorities.includes(auth) ? (() => { const miss = KEY_AUTH_ROLES.filter((r) => !S.contacts.some((c) => c.role === r && (c.authority === auth || c.authority === ALL_BRANCH))); return miss.length ? `<div class="hscroll" style="margin-top:8px">${miss.map((r) => `<button class="chip s" data-act="ct-addrole" data-role="${r}" data-auth="${esc(auth)}">${icon('plus', 'ic-xs')} ${esc(roleName(r))}</button>`).join('')}</div>` : ''; })() : (!cs.length ? '<div class="empty" style="padding:12px">אין עדיין</div>' : '')}`).join('')}
  ${C.by === 'role' && !S.contacts.some((c) => ROLE[c.role] && ROLE[c.role].group === 'authority') ? `<div class="empty" style="margin-top:14px">עוד אין אנשי קשר ברשויות. הוסף מנהלי רווחה, מנכ"לים, קב"טים ומנהלי חינוך – ההודעות בצ'קליסט יישלחו אליהם לפי תפקיד.</div>` : ''}
</main>${tabbar('#/contacts')}`;
};
function roleOptions(sel) {
  const g = { internal: 'משאבים / מרכז החוסן', authority: 'ברשות' };
  return Object.entries(g).map(([k, l]) => `<optgroup label="${l}">${DATA.roles.filter((r) => r.group === k).map((r) => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</optgroup>`).join('');
}
function authOptions(sel) { return [INTERNAL_AUTH, ALL_BRANCH, ...BR().authorities].map((a) => `<option ${a === sel ? 'selected' : ''}>${esc(a)}</option>`).join(''); }
function editContact(id, preset = {}) {
  const c = id ? S.contacts.find((x) => x.id === id) : { name: '', phone: '', role: preset.role || 'welfare_manager', authority: preset.authority || BR().authorities[0] };
  sheet(`<h3>${icon(id ? 'edit' : 'plus')} ${id ? 'עריכת איש קשר' : 'איש קשר חדש'}</h3>
  <form data-form="ct-save" data-id="${id || ''}">
  <label class="lbl" for="cn">שם</label><input class="inp" id="cn" name="name" value="${esc(c.name)}" required>
  <label class="lbl" for="cp">טלפון</label><input class="inp" id="cp" name="phone" type="tel" value="${esc(c.phone)}" required placeholder="050-0000000">
  <label class="lbl" for="cr">תפקיד</label><select class="sel" id="cr" name="role">${roleOptions(c.role)}</select>
  <label class="lbl" for="ca">רשות</label><select class="sel" id="ca" name="authority">${authOptions(c.authority)}</select>
  <label class="lbl" for="cl">שפה מועדפת להודעות</label><select class="sel" id="cl" name="lang"><option value="he" ${c.lang !== 'ar' ? 'selected' : ''}>עברית</option><option value="ar" ${c.lang === 'ar' ? 'selected' : ''}>ערבית</option></select>
  <div class="btn-row" style="margin-top:16px"><button class="btn btn-pri" type="submit">שמור</button>${id ? `<button class="btn btn-out" type="button" data-act="ct-del" data-id="${id}">${icon('trash', 'ic-s')} מחק</button>` : ''}<button class="btn btn-out" type="button" data-act="sheet-close">ביטול</button></div></form>`);
}
function assignImported(list) {
  if (!list.length) { toast('לא נמצאו אנשי קשר עם מספר טלפון תקין'); return; }
  UI.imported = list;
  sheet(`<h3>${icon('users')} שיוך תפקיד ורשות (${list.length})</h3><p class="muted" style="margin-bottom:8px">סמן מי להוסיף, ובחר לכל אחד תפקיד ורשות.</p>
  <form data-form="ct-import">${list.map((c, i) => `<div class="card"><label style="display:flex;gap:10px;align-items:center;min-height:44px"><input type="checkbox" name="inc${i}" checked style="width:22px;height:22px"> <b>${esc(c.name)}</b> <span class="muted" dir="ltr">${esc(c.phone)}</span></label>
  <div style="display:flex;gap:8px;margin-top:6px"><select class="sel" name="role${i}" aria-label="תפקיד">${roleOptions('welfare_manager')}</select><select class="sel" name="auth${i}" aria-label="רשות">${authOptions(BR().authorities[0])}</select></div><select class="sel" style="margin-top:6px" name="lang${i}" aria-label="שפה מועדפת"><option value="he">שפה מועדפת: עברית</option><option value="ar">שפה מועדפת: ערבית</option></select></div>`).join('')}
  <div class="btn-row" style="margin-top:14px"><button class="btn btn-pri" type="submit">הוסף</button><button class="btn btn-out" type="button" data-act="sheet-close">ביטול</button></div></form>`);
}
function parseVcf(text) {
  const unfolded = String(text).replace(/\r\n/g, '\n').replace(/\n[ \t]/g, ''); const out = [];
  for (const card of unfolded.split(/BEGIN:VCARD/i).slice(1)) {
    let fn = '', n = ''; const tels = [];
    for (const line of card.split('\n')) { const idx = line.indexOf(':'); if (idx < 0) continue; const key = line.slice(0, idx), val = line.slice(idx + 1).trim(); const prop = key.split(';')[0].split('.').pop().toUpperCase(); let v = val; if (/QUOTED-PRINTABLE/i.test(key)) { try { v = decodeURIComponent(val.replace(/=([0-9A-F]{2})/gi, '%$1')); } catch (e) { /* keep */ } } if (prop === 'FN') fn = v; else if (prop === 'N') n = v.split(';').slice(0, 2).reverse().filter(Boolean).join(' '); else if (prop === 'TEL') tels.push(v.replace(/^tel:/i, '')); }
    const ph = tels.map((t) => ({ t, p: normPhone(t) })).filter((x) => x.p.valid); if (!ph.length) continue;
    const best = ph.find((x) => x.p.mobile) || ph[0]; out.push({ name: (fn || n || best.t).trim(), phone: best.p.local || best.t, source: 'vcf' });
  }
  return out;
}

// ---------- flyers ----------
/** פליירים של מענים = חוברות מענים, נהלים ותכניות שאפשר להציע (קטגוריית הדרייב "מענים", חוברות svc_, או kind: maanim בנתונים). */
const isMaanimFlyer = (f) => f.kind === 'maanim' || /מענים/.test(f.category || '') || /^svc_/.test(f.id);
V.flyers = () => {
  const F = UI.fl, all0 = DATA.flyers.flyers;
  const all = F.cat === 'maanim' ? all0.filter(isMaanimFlyer) : F.cat === 'hasbara' ? all0.filter((f) => !isMaanimFlyer(f)) : all0;
  const auds = [...new Set(all.map((f) => f.audience))].sort((a, b) => a.localeCompare(b, 'he'));
  const list = all.filter((f) => (!F.sit || (f.situations || []).includes(F.sit)) && (!F.lang || f.languages.includes(F.lang)) && (!F.aud || f.audience === F.aud) && (!F.q || (f.title + ' ' + f.audience + ' ' + (f.notes || '')).includes(F.q)));
  return `${appBar('חומרי הסברה', 'של משאבים · ' + all.length + ' פריטים', '#/home')}
<main class="pad">
  <div class="seg-cat">${[['', 'הכול', all0.length], ['hasbara', 'חומרי הסברה', all0.filter((f) => !isMaanimFlyer(f)).length], ['maanim', 'פליירים של מענים', all0.filter(isMaanimFlyer).length]].map(([k, l, n]) => `<button class="${(F.cat || '') === k ? 'on' : ''}" data-act="fl-cat" data-v="${k}">${esc(l)} <small>${n}</small></button>`).join('')}</div>
  <input class="inp" type="search" placeholder="חיפוש פלייר" data-in="fl-q" value="${esc(F.q)}" aria-label="חיפוש פלייר">
  <div class="lbl">מצב</div>
  <div class="hscroll"><button class="chip s ${!F.sit ? 'on' : ''}" data-act="fl-sit" data-v="">הכול</button>${Object.entries(DATA.flyers.situationValues).map(([k, v]) => `<button class="chip s ${F.sit === k ? 'on' : ''}" data-act="fl-sit" data-v="${k}">${esc(v)}</button>`).join('')}</div>
  <div class="lbl">שפה</div>
  <div class="hscroll"><button class="chip s ${!F.lang ? 'on' : ''}" data-act="fl-lang" data-v="">הכול</button>${Object.entries(LANG).map(([k, v]) => `<button class="chip s ${F.lang === k ? 'on' : ''}" data-act="fl-lang" data-v="${k}">${v}</button>`).join('')}</div>
  <label class="lbl" for="flaud">קהל</label>
  <select class="sel" id="flaud" data-in="fl-aud"><option value="">כל הקהלים</option>${auds.map((a) => `<option ${a === F.aud ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
  <div class="sec"><span>${list.length} פליירים</span></div>
  ${list.length ? `<div class="fgrid">${list.map((f) => `<button class="fcard" data-act="fl-open" data-id="${f.id}">${flyerThumb(f)}<span class="fb"><b>${esc(f.title)}</b><span class="muted small">${esc(f.audience)}</span>${f.distribution !== 'public' ? `<span class="tag ${f.distribution === 'professional' ? '' : 'warn'}" style="align-self:flex-start;white-space:normal">${esc(DATA.flyers.distributionValues[f.distribution] || '')}</span>` : ''}</span></button>`).join('')}</div>` : '<div class="empty">אין פליירים שמתאימים לסינון.</div>'}
</main>${tabbar('#/flyers')}`;
};
function openFlyer(id) {
  const f = FLY[id]; if (!f) return;
  UI.flFile = null; flyerFile(f).then((x) => { if (x) UI.flFile = x; });
  sheet(`<h3>${icon('image')} ${esc(f.title)}</h3>
  <div class="fl">${flyerThumb(f)}<div class="fl-t">${flyerTags(f)}<dl class="kv"><dt>קהל</dt><dd>${esc(f.audience)}</dd><dt>הפצה</dt><dd>${esc(DATA.flyers.distributionValues[f.distribution] || '')}</dd><dt>קטגוריה</dt><dd>${esc(f.category || '')}</dd>${f.dated ? `<dt>הערה</dt><dd>מתוארך – לבדוק עדכניות</dd>` : ''}</dl></div></div>
  ${f.notes ? `<p class="muted" style="margin-top:8px">${esc(f.notes)}</p>` : ''}
  ${(f.events || []).length ? `<p class="small muted" style="margin-top:6px">מתאים לאירועים: ${f.events.map((e) => esc(shortEv(e))).join(', ')}</p>` : ''}
  ${f.file ? `<img class="fl-big" src="${esc(f.file)}" alt="${esc(f.title)}"><p class="small muted" style="margin-top:6px">הקובץ נשמר באפליקציה וזמין גם בלי רשת. בשיתוף בוחרים וואטסאפ ← איש קשר או קבוצה.</p>` : '<p class="small muted" style="margin-top:6px">הקובץ לא כלול באפליקציה (קטלוג בלבד) – ישותף הנוסח בלבד. את הקובץ מקבלים מצוות המרכז.</p>'}
  <div class="btn-row" style="margin-top:14px"><button class="btn btn-wa" data-act="fl-share" data-id="${f.id}" ${f.internalOnly ? 'disabled' : ''}>${icon('share', 'ic-s')} שתף</button><button class="btn btn-out" data-act="sheet-close">סגור</button></div>`);
}

// ---------- news & emergency alerts: real feed from server (news.list) – ynet, וואלה, i24NEWS, ערוץ 14 ----------
const ALERT_KW = [['אזעק', 'missiles', 'אזעקה'], ['צבע אדום', 'missiles', 'צבע אדום'], ['רקט', 'missiles', 'רקטות'], ['טיל', 'missiles', 'טילים'], ['כטב', 'missiles', 'כטב"ם'], ['נפיל', 'direct_hit', 'נפילה'], ['פגיעה ישירה', 'direct_hit', 'פגיעה ישירה'], ['פיגוע', 'terror', 'פיגוע'], ['מחבל', 'terror', 'מחבל'], ['חדיר', 'terror', 'חדירה'], ['דקיר', 'terror', 'דקירה'], ['שריפ', 'fire_hazmat', 'שריפה'], ['שרפ', 'fire_hazmat', 'שריפה'], ['חומ"ס', 'fire_hazmat', 'חומ"ס'], ['חומרים מסוכנים', 'fire_hazmat', 'חומ"ס'], ['רעידת אדמה', 'earthquake', 'רעידת אדמה'], ['אר"ן', 'mci', 'אר"ן'], ['רב נפגעים', 'mci', 'רב נפגעים'], ['רבת נפגעים', 'mci', 'רב נפגעים']];
const NEWS = { items: LS.get('hosen:news') || [], status: null, at: LS.get('hosen:news-at') || 0, loading: false, err: null };
function demoFeed() {
  const a = BR().authorities, now = Date.now(), m = 60000;
  return [
    { src: 'פיקוד העורף', t: now - 4 * m, title: `אזעקה: ירי רקטות וטילים – ${a[0]}` },
    { src: 'אתר חדשות', t: now - 11 * m, title: `דיווח על נפילה בשטח פתוח סמוך ל${a[1]}; אין דיווח על נפגעים` },
    { src: 'אתר חדשות', t: now - 26 * m, title: `שריפה בחורש סמוך ל${a[2] || a[0]}; צוותי כיבוי בשטח` },
    { src: 'פיקוד העורף', t: now - 48 * m, title: 'אזעקה: ירי רקטות וטילים – קריית שמונה' },
    { src: 'אתר חדשות', t: now - 130 * m, title: 'רעידת אדמה קלה הורגשה ברחבי הצפון', regional: true },
  ].map((x) => ({ ...x, demo: true }));
}
/** finds which of the branch's authorities a headline mentions (authority names, aliases, settlements) */
const newsRe = (w) => new RegExp('(^|\\s)[ובלמהשכ]{0,3}' + escRe(nrm(w)) + '(?=[\\s,.:;!?)]|$)');
function newsAuths(text) {
  const t = ' ' + nrm(text) + ' ', br = BR(), hit = new Set(), placeRe = newsRe;
  br.authorities.forEach((a) => { if (authNames(a).some((w) => placeRe(w).test(t))) hit.add(a); });
  SETT_LIST.forEach(({ s: st, a }) => { if (br.authorities.includes(a) && placeRe(st).test(t)) hit.add(a); });
  return [...hit];
}
const REGIONAL_RE = /גליל מערבי|גליל המערבי|קו העימות|גבול הצפון|בצפון|ברחבי הצפון|הצפון כולו/;
function alertFeed() {
  const raw = G.demo || !live() ? demoFeed() : NEWS.items;
  return raw.map((x, i) => {
    const text = x.title + ' ' + (x.desc || '');
    const kw = ALERT_KW.find(([k]) => text.includes(k));
    const auths = newsAuths(text), regional = !!x.regional || (!auths.length && REGIONAL_RE.test(text));
    return { ...x, id: 'al' + i, kw: kw ? kw[2] : (x.kw || null), typeId: kw ? kw[1] : null, auths: regional && !auths.length ? BR().authorities.slice() : auths, regional, match: auths.length > 0 || regional };
  });
}
async function loadNews(refresh) {
  if (!live() || NEWS.loading) return;
  if (!refresh && NEWS.failAt && Date.now() - NEWS.failAt < 60000) return;
  NEWS.loading = true; NEWS.err = null; if (location.hash === '#/alerts') rerender();
  try {
    const r = await api.call('news.list', refresh ? { refresh: true } : {}, { queueable: false });
    if (r && Array.isArray(r.items)) { NEWS.items = r.items; NEWS.status = r.status || null; NEWS.at = r.fetchedAt || Date.now(); LS.set('hosen:news', r.items); LS.set('hosen:news-at', NEWS.at); }
  } catch (e) { NEWS.err = (e && e.message) || 'שגיאה'; NEWS.failAt = Date.now(); }
  NEWS.loading = false; if (location.hash === '#/alerts') rerender();
}
let NEWS_TIMER = null;
function newsAuto() { if (NEWS_TIMER) return; NEWS_TIMER = setInterval(() => { if (location.hash === '#/alerts' && document.visibilityState === 'visible') loadNews(false); }, 3 * 60000); }
V.alerts = () => {
  const demo = G.demo || !live();
  if (!demo) { newsAuto(); if (!NEWS.loading && Date.now() - NEWS.at > 3 * 60000) setTimeout(() => loadNews(false), 0); }
  const all = alertFeed(), show = UI.alAll ? all : all.filter((x) => x.match);
  const st = NEWS.status ? Object.values(NEWS.status) : [];
  const srcLine = st.length ? st.map((x) => `<span class="tag ${x.ok ? 'ok' : ''}">${esc(x.name)}${x.ok ? '' : ' ✕'}</span>`).join('') : ['ynet', 'וואלה', 'i24NEWS', 'ערוץ 14'].map((n) => `<span class="tag">${n}</span>`).join('');
  return `${appBar('מבזקי חירום', BR().name + ' · ' + BR().authorities.join(', '), '#/home')}
<main class="pad">
  ${demo ? `<div class="banner-demo">${icon('info', 'ic-s')}<span><b>מצב הדגמה – כותרות דמה.</b> אחרי כניסה עם שם משתמש וקוד מוצגים מבזקים אמיתיים.</span></div>` : `<p class="small muted">רק מבזקים שקשורים לחירום, בלי פוליטיקה. מתעדכן כל 3 דקות. ${NEWS.at ? 'עודכן ' + esc(whenLabel(NEWS.at)) : ''}</p>`}
  <div class="chips">${srcLine}</div>
  ${NEWS.err && !demo ? `<div class="banner-demo">${icon('info', 'ic-s')}<span>לא הצלחתי לרענן (${esc(NEWS.err)}). מוצגות הכותרות האחרונות שנשמרו.</span></div>` : ''}
  <div class="sec"><span>${NEWS.loading && !demo ? 'מרענן…' : show.length + ' כותרות' + (UI.alAll ? '' : ' ברשויות השלוחה')}</span><span>${demo ? '' : `<button class="lnk" data-act="al-refresh">רענן</button> · `}<button class="lnk" data-act="al-all">${UI.alAll ? 'רק השלוחה' : 'כל החירום (' + all.length + ')'}</button></span></div>
  ${show.length ? '' : `<div class="empty">${UI.alAll ? 'אין כרגע מבזקי חירום.' : 'אין כרגע מבזקי חירום ברשויות השלוחה.'}</div>`}
  ${show.map((x) => `<article class="alert-it ${x.match ? '' : 'out'}"><div class="meta"><span class="tag">${esc(x.src)}${x.demo ? ' · דמה' : ''}</span><span>${x.t ? esc(whenLabel(x.t)) : ''}</span>${x.kw ? `<span class="tag">${esc(x.kw)}</span>` : ''}${x.match ? `<span class="tag ok">${esc(x.regional ? 'כל השלוחה' : x.auths.join(', '))}</span>` : '<span class="tag">מחוץ לשלוחה</span>'}</div><b>${esc(x.title)}</b>
  <div class="btn-row" style="margin-top:8px">${x.match ? `<button class="btn btn-sec btn-s" data-act="al-open" data-id="${x.id}">${icon('alert', 'ic-s')} פתח אירוע מזה</button>` : ''}${x.link ? `<a class="btn btn-out btn-s" href="${esc(x.link)}" target="_blank" rel="noopener">לכתבה</a>` : ''}</div></article>`).join('')}
</main>${tabbar('')}`;
};
V.notFound = () => `${appBar('לא נמצא', '', '#/home')}<main class="pad"><div class="empty">המסך לא נמצא. <a class="lnk" href="#/home">לבית</a></div></main>`;

// ---------- מאגר המענים (embedded site, persistent iframe outside #app so it doesn't reload on every render) ----------
const MAANIM_BASE = 'https://explain-awesome-pages.lovable.app';
const MAANIM_CATS = [['', 'הכול'], ['children-3-6', 'גיל רך'], ['elementary', 'יסודי'], ['youth', 'נוער'], ['women', 'נשים'], ['men', 'גברים'], ['parents-families', 'הורים ומשפחות'], ['seniors', 'גיל שלישי'], ['educators', 'צוותים'], ['officials', 'רשותי'], ['facilitators', 'טבלת המנחים']];
const maanimPath = (k) => (k === 'facilitators' ? '/facilitators-table' : k ? '/audience/' + k : '/');
V.maanim = (cat) => {
  if (cat !== undefined && cat !== UI.mnCat) { UI.mnCat = cat; UI.mnGo = true; }
  const cur = UI.mnCat || '';
  return `${appBar('מאגר המענים', 'מרכז החוסן גליל מערבי · לשימוש פנימי', '#/home', `<a class="ab-act" href="${MAANIM_BASE + maanimPath(cur)}" target="_blank" rel="noopener" aria-label="פתיחה בדפדפן">${icon('share')}</a>`)}
<div class="mn-chips" id="mn-chips">${MAANIM_CATS.map(([k, l]) => `<a class="chip ${k === cur ? 'on' : ''}" href="#/maanim/${k}">${esc(l)}</a>`).join('')}</div>
${navigator.onLine === false ? `<div class="banner-demo" style="margin:8px 16px">${icon('info', 'ic-s')}<span>אין חיבור לאינטרנט – מאגר המענים נטען רק עם רשת.</span></div>` : ''}
<div id="mn-slot" class="mn-slot"></div>
${tabbar('#/maanim')}`;
};
function syncMaanim(show) {
  let host = document.getElementById('mn-host');
  if (!show) { if (host) host.hidden = true; return; }
  if (!host) {
    host = document.createElement('div'); host.id = 'mn-host'; host.className = 'mn-host';
    host.innerHTML = `<div class="mn-load" id="mn-load">טוען את מאגר המענים…</div><iframe id="mn-frame" title="מאגר המענים" referrerpolicy="no-referrer" loading="eager"></iframe>`;
    document.body.appendChild(host);
    const fr = host.querySelector('iframe'); fr.addEventListener('load', () => { const l = document.getElementById('mn-load'); if (l) l.hidden = true; });
    UI.mnGo = true; window.addEventListener('resize', () => { if (!host.hidden) placeMaanim(); });
  }
  host.hidden = false;
  const fr = host.querySelector('iframe');
  if (UI.mnGo || !fr.src) { UI.mnGo = false; const l = document.getElementById('mn-load'); if (l) l.hidden = false; fr.src = MAANIM_BASE + maanimPath(UI.mnCat || ''); }
  placeMaanim();
}
function placeMaanim() {
  const host = document.getElementById('mn-host'), slot = document.getElementById('mn-slot'), tb = document.querySelector('.tabbar');
  if (!host || !slot) return;
  const top = slot.getBoundingClientRect().top, bottom = tb ? tb.getBoundingClientRect().height : 0;
  host.style.top = Math.max(0, top) + 'px'; host.style.bottom = bottom + 'px';
}
// ---------- "מי מחובר" + ווקי טוקי (live.ping / voice.send / voice.get) ----------
const LIVE = { presence: [], me: null, since: 0, timer: null, busy: false, lastOk: 0 };
const VOICE = { list: [], unheard: 0, playing: false, queue: [], blobs: {}, target: LS.get('hosen:ptt-target') || 'all', autoplay: LS.get('hosen:ptt-auto') !== false, rec: null };
const agoLabel = (t) => { if (!t) return 'עוד לא התחבר'; const s = Math.max(0, (Date.now() - t) / 1000); if (s < 90) return 'עכשיו'; const m = Math.round(s / 60); if (m < 60) return 'לפני ' + m + ' דק׳'; const h = Math.round(m / 60); if (h < 24) return 'לפני ' + h + ' שע׳'; return whenLabel(t); };
const presenceSlot = () => (live() || G.demo) ? `<button class="pres-pill" data-act="pres" aria-label="מי מחובר">${presInner()}</button>` : '';
function presInner() { const n = LIVE.presence.filter((p) => p.online).length; return `<span class="pres-dot ${n ? 'on' : ''}"></span><b>${LIVE.lastOk ? n : '·'}</b>`; }
function paintPresence() { document.querySelectorAll('.pres-pill').forEach((b) => { b.innerHTML = presInner(); }); paintPtt(); if ($('#sheet-root .pres-sheet')) actPres(); }
async function livePing() {
  if (G.demo) { demoPresence(); paintPresence(); return; }
  if (!live() || LIVE.busy || document.hidden || !navigator.onLine) return;
  LIVE.busy = true;
  try {
    const r = await api.call('live.ping', { since: LIVE.since }, { queueable: false });
    if (r && Array.isArray(r.presence)) {
      LIVE.presence = r.presence; LIVE.me = r.me; LIVE.lastOk = Date.now();
      (r.voice || []).forEach((m) => { LIVE.since = Math.max(LIVE.since, m.ts); if (VOICE.list.some((x) => x.id === m.id)) return; const mine = m.fromId === LIVE.me; VOICE.list.push({ ...m, heard: mine }); if (!mine) incomingVoice(m); });
      VOICE.list = VOICE.list.slice(-40);
      paintPresence();
    }
  } catch (e) { /* ננסה שוב בסבב הבא */ }
  LIVE.busy = false;
}
function demoPresence() {
  const now = Date.now(), m = 60000;
  LIVE.me = 'me'; LIVE.lastOk = now;
  LIVE.presence = [
    { id: 'me', name: 'אורח (אתה)', branch: 'ים', title: '', lastSeen: now, online: true },
    { id: 'd1', name: 'מנהלת המרכז (דוגמה)', branch: CLUSTER, title: 'מנהלת מרכז החוסן', lastSeen: now - 20000, online: true },
    { id: 'd2', name: 'ראש שלוחת נחלים (דוגמה)', branch: 'נחלים', title: '', lastSeen: now - 40000, online: true },
    { id: 'd3', name: 'ראש שלוחת ציר 70 (דוגמה)', branch: 'ציר 70', title: '', lastSeen: now - 25 * m, online: false },
    { id: 'd4', name: 'ראש שלוחת ההר (דוגמה)', branch: 'הר', title: '', lastSeen: now - 3 * 60 * m, online: false },
  ];
}
function liveStart() {
  if (LIVE.timer) return;
  if (!LIVE.since) LIVE.since = Date.now() - 10 * 60000; // בכניסה: הודעות מ-10 הדקות האחרונות
  livePing(); LIVE.timer = setInterval(livePing, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) livePing(); });
  window.addEventListener('online', () => livePing());
}
function actPres() {
  const me = LIVE.me, list = LIVE.presence.slice().sort((a, b) => (b.online - a.online) || ((b.lastSeen || 0) - (a.lastSeen || 0)));
  const on = list.filter((p) => p.online), off = list.filter((p) => !p.online);
  const row = (p) => `<li class="pres-row"><span class="pres-dot ${p.online ? 'on' : ''}"></span><span style="flex:1;min-width:0"><b>${esc(p.name)}${p.id === me ? ' (אני)' : ''}</b><br><small class="muted">${esc([p.branch === CLUSTER ? 'אשכול' : p.branch ? 'שלוחת ' + p.branch : '', p.title].filter(Boolean).join(' · '))}</small></span><small class="${p.online ? 'ok-t' : 'muted'}">${p.online ? 'מחובר/ת' : esc(agoLabel(p.lastSeen))}</small></li>`;
  sheet(`<div class="pres-sheet"><h3>מי מחובר עכשיו</h3>${!LIVE.lastOk ? '<p class="muted">טוען…</p>' : ''}
  ${on.length ? `<ul class="pres-list">${on.map(row).join('')}</ul>` : LIVE.lastOk ? '<p class="muted">אין כרגע אף אחד מחובר.</p>' : ''}
  ${off.length ? `<div class="lbl" style="margin-top:10px">נראו לאחרונה</div><ul class="pres-list">${off.map(row).join('')}</ul>` : ''}
  <p class="muted small" style="margin-top:8px">"מחובר" = האפליקציה פתוחה אצלו בדקה וחצי האחרונות.</p>
  <div class="btn-row" style="margin-top:12px"><button class="btn btn-out" data-act="sheet-close">סגור</button></div></div>`);
};

// ---- push-to-talk ----
const PTT_TARGETS = () => [['all', 'כל הצוות'], ...Object.keys(BRANCHES).map((b) => [b, 'שלוחת ' + b])];
const pttTargetLabel = (t) => (PTT_TARGETS().find(([k]) => k === t) || ['', 'כל הצוות'])[1];
function ensurePtt() {
  let b = document.getElementById('ptt');
  if (!b) {
    b = document.createElement('div'); b.id = 'ptt'; b.className = 'ptt';
    b.innerHTML = `<button class="ptt-btn" id="ptt-btn" aria-label="לחץ ודבר – החזק כדי להקליט"><svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg><span class="ptt-badge" hidden></span></button><span class="ptt-tg"></span>
    <div class="ptt-rec" hidden><span class="rec-dot"></span><b class="rec-t">0:00</b><span class="rec-to"></span><small>שחרר לשליחה · גרור הצידה לביטול</small></div>`;
    document.body.appendChild(b);
    const btn = b.querySelector('#ptt-btn');
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    btn.addEventListener('pointerdown', pttDown);
    btn.addEventListener('pointerup', pttUp); btn.addEventListener('pointercancel', () => pttStop(true));
    btn.addEventListener('pointermove', (e) => { if (VOICE.rec && PTT_XY && Math.hypot(e.clientX - PTT_XY[0], e.clientY - PTT_XY[1]) > 90) pttStop(true); });
  }
  return b;
}
function paintPtt() {
  const b = document.getElementById('ptt'); if (!b) return;
  const show = (live() || G.demo) && !/^#\/(maanim|assess|intake)/.test(location.hash) && !$('#sheet-root .sheet');
  b.hidden = !show;
  const bd = b.querySelector('.ptt-badge'); bd.hidden = !VOICE.unheard; bd.textContent = VOICE.unheard || '';
  b.querySelector('.ptt-tg').textContent = pttTargetLabel(VOICE.target);
}
let PTT_T0 = 0, PTT_TAP = null, PTT_XY = null;
async function pttDown(e) {
  e.preventDefault(); if (VOICE.rec) return;
  PTT_T0 = Date.now(); PTT_XY = [e.clientX, e.clientY]; const btn = e.currentTarget; try { btn.setPointerCapture(e.pointerId); } catch (_) {}
  PTT_TAP = setTimeout(() => { PTT_TAP = null; pttStart(); }, 250); // לחיצה קצרה = פתיחת הלוח; החזקה = הקלטה
}
function pttUp(e) {
  if (PTT_TAP) { clearTimeout(PTT_TAP); PTT_TAP = null; actVoice(); return; }
  pttStop(false);
}
async function pttStart() {
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('הטלפון הזה לא תומך בהקלטה מהאפליקציה'); return; }
  const R = VOICE.rec = { chunks: [], t0: Date.now(), cancelled: false, stopped: false };
  const ui = document.querySelector('#ptt .ptt-rec'); ui.hidden = false; ui.querySelector('.rec-to').textContent = 'אל: ' + pttTargetLabel(VOICE.target);
  document.getElementById('ptt').classList.add('recording');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    if (R.stopped) { stream.getTracks().forEach((t) => t.stop()); pttReset(); if (!R.cancelled) toast('המיקרופון מוכן – עכשיו החזק את הכפתור ודבר'); return; }
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
    R.mr = mr; R.stream = stream; R.t0 = Date.now();
    mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) R.chunks.push(ev.data); };
    mr.onstop = () => pttFinish(R);
    mr.start(500);
    R.tick = setInterval(() => { const s = Math.floor((Date.now() - R.t0) / 1000); ui.querySelector('.rec-t').textContent = Math.floor(s / 60) + ':' + pad2(s % 60); if (s >= 60) pttStop(false); }, 250);
    if (navigator.vibrate) navigator.vibrate(30);
  } catch (err) { pttReset(); toast('אין גישה למיקרופון – צריך לאשר הרשאת מיקרופון לאפליקציה'); }
}
function pttStop(cancel) {
  const R = VOICE.rec; if (!R || R.stopped) return; R.stopped = true; R.cancelled = !!cancel;
  clearInterval(R.tick);
  if (R.mr && R.mr.state !== 'inactive') R.mr.stop(); else if (!R.mr) { /* עוד מחכה להרשאה */ }
}
function pttReset() { VOICE.rec = null; const b = document.getElementById('ptt'); if (b) { b.classList.remove('recording'); b.querySelector('.ptt-rec').hidden = true; } }
async function pttFinish(R) {
  if (R.stream) R.stream.getTracks().forEach((t) => t.stop());
  const dur = (Date.now() - R.t0) / 1000; pttReset();
  if (R.cancelled) { toast('ההקלטה בוטלה'); return; }
  if (dur < 0.7 || !R.chunks.length) { toast('קצר מדי – החזק את הכפתור בזמן שאתה מדבר'); return; }
  const blob = new Blob(R.chunks, { type: (R.mr && R.mr.mimeType) || 'audio/webm' });
  const data = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(blob); });
  const requestId = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  VOICE.blobs[requestId] = URL.createObjectURL(blob);
  if (G.demo) { VOICE.list.push({ id: requestId, ts: Date.now(), fromId: 'me', fromName: 'אורח', target: VOICE.target, duration: Math.round(dur), heard: true }); toast('מצב אורח: ההודעה הוקלטה אבל לא נשלחה. אפשר לשמוע אותה בלוח הקשר', 3500); if ($('#sheet-root .voice-sheet')) actVoice(); return; }
  const meName = (ME() && ME().name) || 'אני';
  VOICE.list.push({ id: requestId, ts: Date.now(), fromId: LIVE.me, fromName: meName, target: VOICE.target, duration: Math.round(dur), heard: true, pending: true });
  if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
  try {
    const r = await api.call('voice.send', { data, mime: blob.type.split(';')[0] || 'audio/webm', duration: Math.round(dur), target: VOICE.target, recordedAt: R.t0 }, { requestId, queueable: true });
    const m = VOICE.list.find((x) => x.id === requestId);
    if (r && r.queued) { toast('אין קליטה – ההודעה תישלח לבד כשיחזור חיבור'); if (m) m.queued = true; }
    else { toast('ההודעה הקולית נשלחה ל' + pttTargetLabel(VOICE.target)); if (m) { m.pending = false; if (r && r.ts) LIVE.since = Math.max(LIVE.since, r.ts); } }
  } catch (e) { toast('השליחה נכשלה: ' + ((e && e.message) || '')); }
  if ($('#sheet-root .voice-sheet')) actVoice();
}
async function voiceBlobUrl(m) {
  if (VOICE.blobs[m.id]) return VOICE.blobs[m.id];
  const r = await api.call('voice.get', { id: m.id }, { queueable: false });
  const bin = atob(r.data), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return (VOICE.blobs[m.id] = URL.createObjectURL(new Blob([u8], { type: r.mime || 'audio/webm' })));
}
async function playVoice(m) {
  try {
    const url = await voiceBlobUrl(m); const au = new Audio(url); VOICE.playing = true;
    await au.play();
    if (!m.heard) { m.heard = true; VOICE.unheard = Math.max(0, VOICE.unheard - 1); paintPtt(); }
    await new Promise((res) => { au.onended = res; au.onerror = res; });
  } finally { VOICE.playing = false; }
}
function incomingVoice(m) {
  VOICE.unheard++; paintPtt();
  toast('🎙 הודעה קולית מ' + m.fromName + (m.target === 'all' ? '' : ' (לשלוחת ' + m.target + ')'), 3500);
  if (VOICE.autoplay) { VOICE.queue.push(m); drainVoice(); }
  if ($('#sheet-root .voice-sheet')) actVoice();
}
async function drainVoice() { if (VOICE.playing) return; const m = VOICE.queue.shift(); if (!m) return; try { await playVoice(m); } catch (e) { /* הדפדפן חסם השמעה אוטומטית – נשאר מסומן כלא נשמע */ } drainVoice(); }
function actVoice() {
  const list = VOICE.list.slice().reverse();
  sheet(`<div class="voice-sheet"><h3>🎙 קשר – לחץ ודבר</h3>
  <p class="muted small">מחזיקים את כפתור המיקרופון, מדברים ומשחררים. ההודעה מגיעה לכל מי שהאפליקציה פתוחה אצלו, ומושמעת אוטומטית. בלי קליטה – היא נשמרת ונשלחת כשחוזר חיבור.</p>
  <div class="lbl">למי לשדר</div><div class="chips">${PTT_TARGETS().map(([k, l]) => `<button class="chip ${VOICE.target === k ? 'on' : ''}" data-act="ptt-target" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>
  <label class="tg-row" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" data-act="ptt-auto" ${VOICE.autoplay ? 'checked' : ''}> השמעה אוטומטית של הודעות נכנסות</label>
  <div class="lbl" style="margin-top:12px">הודעות אחרונות (6 שעות)</div>
  ${list.length ? `<ul class="voice-list">${list.map((m) => `<li class="${m.heard ? '' : 'new'}"><button class="btn btn-sec btn-s" data-act="v-play" data-id="${esc(m.id)}" aria-label="השמע">▶</button><span style="flex:1;min-width:0"><b>${esc(m.fromId === LIVE.me ? 'אני' : m.fromName)}</b> → ${esc(pttTargetLabel(m.target))}<br><small class="muted">${esc(whenLabel(m.ts))} · ${m.duration || 0} שנ׳${m.queued ? ' · ממתינה לחיבור' : m.pending ? ' · נשלחת…' : ''}</small></span></li>`).join('')}</ul>` : '<p class="muted">אין עדיין הודעות.</p>'}
  <div class="btn-row" style="margin-top:12px"><button class="btn btn-out" data-act="sheet-close">סגור</button></div></div>`);
  paintPtt();
};

// ---------- נהלי עבודה (docs.list – הרשימה והקישורים מגיעים מהשרת, רק למשתמשים מחוברים) ----------
const DOCS = { data: LS.get('hosen:docs') || null, loading: false, err: null, at: 0 };
const DOCS_DEMO = [{ group: 'חירום – תפקיד ותפיסת עבודה', items: [{ title: 'הרכזים בחירום – שאגת הארי', type: 'pdf', desc: 'מה עושה רכז השלוחה בחירום, שלב אחר שלב' }, { title: 'התנהלות צוות מרכזי החוסן בזמן חירום', type: 'docx', desc: 'נוהל עבודת הצוות באירוע חירום' }] }, { group: 'אירוע חריג', items: [{ title: 'נוהל תפעול ודיווח אירוע חריג', type: 'docx', desc: 'מתי ואיך מדווחים על אירוע חריג' }, { title: 'דוח אירוע חריג (טופס)', type: 'docx', desc: 'הטופס למילוי ולשליחה' }] }, { group: 'נהלי מענים', items: [{ title: 'נוהל חרדה', type: 'drive', desc: 'טיפול קצר מועד ללא עלות' }] }];
async function loadDocs() {
  if (!live() || DOCS.loading) return; DOCS.loading = true; DOCS.err = null;
  try { const r = await api.call('docs.list', {}, { queueable: false }); if (r && Array.isArray(r.groups)) { DOCS.data = r; DOCS.at = Date.now(); LS.set('hosen:docs', r); } }
  catch (e) { DOCS.err = (e && e.message) || 'שגיאה'; DOCS.at = Date.now(); }
  DOCS.loading = false; if (location.hash.startsWith('#/docs')) rerender();
}
const DOC_ICON = { pdf: 'PDF', docx: 'Word', pptx: 'מצגת', drive: 'תיקייה/מסמך' };
V.docs = () => {
  const demo = !live();
  if (!demo && (!DOCS.at || Date.now() - DOCS.at > 10 * 60000)) setTimeout(loadDocs, 0);
  const groups = demo ? DOCS_DEMO : (DOCS.data ? DOCS.data.groups : []);
  const q = (UI.docQ || '').trim();
  const filt = groups.map((g) => ({ ...g, items: g.items.filter((d) => !q || (d.title + ' ' + d.desc).includes(q)) })).filter((g) => g.items.length);
  return `${appBar('נהלי עבודה', 'נהלים, טפסים ולקחים · מרכז החוסן', '#/home')}
<main class="pad">
  ${demo ? `<div class="banner-demo">${icon('info', 'ic-s')}<span><b>מצב אורח:</b> מוצגת רשימה לדוגמה. אחרי כניסה רואים את כל הנהלים ופותחים אותם.</span></div>` : ''}
  <input class="inp" type="search" placeholder="חיפוש נוהל" data-in="doc-q" value="${esc(UI.docQ || '')}" aria-label="חיפוש נוהל">
  ${DOCS.err && !demo && !DOCS.data ? `<div class="banner-demo">${icon('info', 'ic-s')}<span>לא הצלחתי לטעון את הרשימה (${esc(DOCS.err)}).</span></div>` : ''}
  ${!demo && !DOCS.data && DOCS.loading ? '<p class="muted">טוען…</p>' : ''}
  ${filt.map((g) => `<div class="lbl" style="margin-top:14px">${esc(g.group)}</div><ul class="doc-list">${g.items.map((d) => `<li>${d.url ? `<a class="doc-row" href="${esc(d.url)}" target="_blank" rel="noopener">` : '<div class="doc-row">'}<span class="doc-ic">${icon('file')}</span><span style="flex:1;min-width:0"><b>${esc(d.title)}</b><small class="muted">${esc(d.desc || '')}</small></span><span class="tag">${esc(DOC_ICON[d.type] || '')}</span>${d.url ? '</a>' : '</div>'}</li>`).join('')}</ul>`).join('')}
  ${q && !filt.length ? '<div class="empty">לא נמצא נוהל מתאים.</div>' : ''}
  ${!demo && DOCS.data && DOCS.data.folder ? `<a class="btn btn-out" style="width:100%;margin-top:14px" href="${esc(DOCS.data.folder)}" target="_blank" rel="noopener">${icon('share', 'ic-s')} פתח את תיקיית הנהלים בדרייב</a><p class="muted small" style="margin-top:6px">המסמכים נפתחים בגוגל דרייב, לפי הרשאות התיקייה.</p>` : ''}
</main>${tabbar('')}`;
};
// ───────────── sheets ─────────────
function sheet(html) { $('#sheet-root').innerHTML = `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`; const f = $('#sheet-root .sheet input:not([type=checkbox]), #sheet-root .sheet button'); if (f && f.tagName === 'INPUT') f.focus();  try { paintPtt(); } catch (_) {} }
function closeSheet() { $('#sheet-root').innerHTML = ''; UI.queue = null; try { paintPtt(); } catch (_) {} }
// ───────────── install to home screen ─────────────
let INSTALL_EVT = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const UA = navigator.userAgent || '';
const isIOS = () => /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInApp = () => /WhatsApp|FBAN|FBAV|Instagram|Line\//.test(UA);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); INSTALL_EVT = e; if (location.hash === '' || /login/.test(location.hash) || !G.session) try { render(); } catch (_) {} });
window.addEventListener('appinstalled', () => { INSTALL_EVT = null; toast('האפליקציה נוספה למסך הבית'); try { render(); } catch (_) {} });
const installBtn = () => isStandalone() ? '' : `<button class="install-btn" data-act="install">📲 הוספה למסך הבית</button>`;
function installHelp() {
  const ios = isIOS(), inApp = isInApp(), android = /Android/.test(UA);
  let steps;
  if (inApp) steps = `<p><b>הדף נפתח בתוך וואטסאפ.</b> צריך לפתוח אותו בדפדפן:</p><ol><li>לוחצים על ⋮ או על סמל המצפן/הדפדפן למעלה.</li><li>בוחרים "פתיחה ב-${ios ? 'Safari' : 'Chrome'}".</li><li>שם לוחצים שוב על "הוספה למסך הבית".</li></ol>`;
  else if (ios) steps = `<ol><li>חייבים להיות ב-<b>Safari</b> (לא בכרום).</li><li>לוחצים על כפתור השיתוף <b>⬆︎</b> – ריבוע עם חץ למעלה, בשורה התחתונה (או ליד שורת הכתובת).</li><li>גוללים מטה ובוחרים <b>"הוסף למסך הבית"</b>.</li><li>לוחצים <b>"הוסף"</b> בפינה.</li></ol>`;
  else if (android) steps = `<ol><li>בכרום: לוחצים על <b>⋮</b> (שלוש נקודות) למעלה.</li><li>בוחרים <b>"התקנת אפליקציה"</b> או <b>"הוספה למסך הבית"</b>.</li><li>מאשרים <b>"התקנה"</b>.</li></ol><p class="muted">בדפדפן סמסונג: ☰ למטה ← "הוספת דף אל" ← "מסך הבית".</p>`;
  else steps = `<ol><li>במחשב בכרום/אדג': בשורת הכתובת, בצד, יש סמל של מסך עם חץ <b>⊕</b> – לוחצים עליו ← "התקנה".</li><li>או: ⋮ ← "העברה, שיתוף ושמירה" ← "התקנת הדף כאפליקציה".</li><li>בטלפון: פותחים את אותה כתובת ומוסיפים למסך הבית.</li></ol>`;
  sheet(`<h3>📲 הוספה למסך הבית</h3>${steps}<div class="btn-row" style="margin-top:12px"><button class="btn btn-pri" data-act="sheet-close">הבנתי</button></div>`);
}

function settingsSheet() {
  const me = ME(), perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const sv = G.server, st = syncState();
  sheet(`<h3>${icon('user')} ${esc(me.name)}</h3><p class="muted">ראש ${esc(BR().name)} · לשונית "${esc(BR().tab)}" בטבלת המעקב</p>
  <div class="card" style="margin:10px 0"><b>${G.demo ? 'מצב הדגמה – לא מחובר לשרת' : 'חיבור לשרת'}</b>${G.demo ? '<p class="muted">הנתונים כאן הם דמה ונשמרים רק בטלפון.</p>' : `<p class="muted">${esc(st.label)}${SYNC.lastPull ? ' · עודכן ' + hhmm(SYNC.lastPull) : ''}${sv ? ' · שרת ' + esc(sv.version || '') : ''}</p>${sv && sv.dryRun ? '<p class="tag warn" style="margin-top:4px;white-space:normal">מצב בדיקה: כתיבה לטבלת המעקב לא מתבצעת</p>' : ''}<p class="muted small">AI בשרת: ${aiAvailable() ? 'פעיל' : 'לא פעיל – ניתוח בטלפון + "נתח עם Claude"'}</p><div class="btn-row" style="margin-top:8px"><button class="btn btn-sec btn-s" data-act="sync-now">${icon('repeat', 'ic-s')} סנכרן עכשיו</button></div>`}</div>
  <label class="lbl" for="myphone">הטלפון שלי (נכנס להודעות)</label><input class="inp" id="myphone" type="tel" data-in="set-phone" value="${esc(S.settings.phone)}" placeholder="050-0000000">
  <div class="switch" style="margin-top:10px"><span>${icon('moon', 'ic-s')} מצב כהה</span><button class="btn btn-sec btn-s" data-act="theme">${G.theme === 'dark' ? 'כבה' : 'הפעל'}</button></div>
  <div class="switch"><span>${icon('bell', 'ic-s')} התראות: ${perm === 'granted' ? 'מאושרות' : perm === 'denied' ? 'חסומות בדפדפן' : perm === 'unsupported' ? 'לא נתמך' : 'לא הופעלו'}</span><button class="btn btn-sec btn-s" data-act="notif">${perm === 'granted' ? 'בדיקה' : 'אפשר'}</button></div>
  <hr class="sep"><div class="btn-row">${G.demo ? '<button class="btn btn-out" data-act="reset">איפוס נתוני הדגמה</button>' : ''}${G.demo ? '' : `<button class="btn btn-out" data-act="pw">${icon('shield', 'ic-s')} שינוי סיסמה</button>`}<button class="btn btn-out" data-act="logout">${icon('exit', 'ic-s')} ${G.demo ? 'יציאה ממצב אורח' : 'יציאה'}</button></div><p class="muted small" style="margin-top:10px">גרסת אפליקציה ${APP_VERSION}</p>`);
}
function queueSheet() {
  const Q = UI.queue; if (!Q) return;
  const i = Q.i, n = Q.list.length;
  if (i >= n) {
    sheet(`<div class="queue"><h3 style="justify-content:center">${icon('check')} כל ${n} ההודעות נפתחו בוואטסאפ</h3><p class="muted">ההודעות נרשמו ביומן האירוע.</p>
    <div class="btn-row" style="margin-top:14px">${Q.itemId && !getEv(Q.evId).done[Q.itemId] ? `<button class="btn btn-pri" data-act="q-done">סמן את הפעולה כבוצעה</button>` : ''}<button class="btn btn-out" data-act="sheet-close">סגור</button></div></div>`);
    return;
  }
  const r = Q.list[i];
  sheet(`<div class="queue"><div class="q-n">${i + 1} מתוך ${n}</div><div class="progress"><i style="width:${(i / n) * 100}%"></i></div>
  <div class="q-who">${esc(r.contact.name)}</div><div class="q-role">${esc(roleName(r.role))}${r.auth ? ' · ' + esc(r.auth) : ''} · <span dir="ltr">${esc(r.contact.phone)}</span></div>
  ${r.lang === 'ar' ? `<div class="tags" style="justify-content:center;margin-bottom:8px"><span class="tag">בערבית</span>${r.draft ? '<span class="tag warn">טיוטה – דורש בדיקת דובר ערבית</span>' : ''}</div>` : ''}
  <div class="out" style="text-align:right;max-height:180px;overflow:auto" ${r.lang === 'ar' ? 'lang="ar"' : ''}>${esc(r.text)}</div>
  <a class="btn btn-wa btn-xl" style="margin-top:12px" href="${waLink(r.contact.phone, r.text)}" target="_blank" rel="noopener" data-act="q-open">${icon('wa', 'ic-s')} פתח וואטסאפ ל${esc(firstName(r.contact.name))}</a>
  <div class="btn-row" style="margin-top:8px"><button class="btn btn-out" data-act="q-skip">דלג</button><button class="btn btn-out" data-act="sheet-close">עצור</button></div></div>`);
}

// ───────────── router ─────────────
function parseHash() {
  const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?');
  const q = {}; (qs || '').split('&').filter(Boolean).forEach((p) => { const [k, v] = p.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q };
}
let lastRoute = '';
function render() {
  applyTheme();
  const app = $('#app');
  if (!G.demo && !live()) { app.innerHTML = V.login(); document.title = 'כניסה · חוסן שלוחות'; return; }
  if (!S) loadUser();
  const { parts, q } = parseHash(); const [a, b, c, d, e] = parts;
  const routeKey = location.hash;
  let html;
  switch (a) {
    case undefined: case 'home': html = V.home(); break;
    case 'emergency': html = V.emergency(); break;
    case 'event': html = c === 'msg' ? V.msg(b, d, e) : c === 'report' ? V.report(b) : c === 'log' ? V.log(b) : c === 'summary' ? V.summary(b) : V.event(b); break;
    case 'events': html = V.events(); break;
    case 'intake': html = V.intake(); break;
    case 'assess': html = V.assess(q); break;
    case 'week': html = V.week(); break;
    case 'contacts': html = V.contacts(q); break;
    case 'flyers': html = V.flyers(); break;
    case 'alerts': html = V.alerts(); break;
    case 'maase': html = V.maase(q); break;
    case 'maanim': html = V.maanim(b); break;
    case 'docs': html = V.docs(); break;
    default: html = V.notFound();
  }
  const y = window.scrollY;
  app.innerHTML = html;
  try { syncMaanim(a === 'maanim'); } catch (_) {}
  try { if (live() || G.demo) { ensurePtt(); liveStart(); } paintPtt(); } catch (_) {}
  if (routeKey !== lastRoute) { window.scrollTo(0, 0); lastRoute = routeKey; if (a !== 'contacts') UI.ctAddDone = false; } else window.scrollTo(0, y);
  const t = $('.ab-title') || $('.hero-n'); document.title = (t ? t.textContent + ' · ' : '') + 'חוסן שלוחות';
}
const rerender = () => render();

// ───────────── actions ─────────────
const A = {};
A['ev-type'] = (el) => { UI.newEv.typeId = el.dataset.id; UI.newEv.mode = null; rerender(); };
A['ev-mode'] = (el) => { UI.newEv.mode = el.dataset.v; rerender(); };
A['ev-auth'] = (el) => { const L = UI.newEv.auths, v = el.dataset.v; const i = L.indexOf(v); if (i >= 0) L.splice(i, 1); else L.push(v); rerender(); };
A['ev-start'] = () => {
  const d = UI.newEv; const mode = d.mode || (EVT[d.typeId].flags.ongoing ? 'ongoing' : 'point');
  const t = d.time ? new Date(d.time).getTime() : Date.now();
  const ev = { id: newId(), typeId: d.typeId, mode, authorities: d.auths.slice(), startedAt: isNaN(t) ? Date.now() : t, closedAt: null, day: 1, done: {}, history: [], log: [], phase: 'immediate', debriefAt: null, summary: '', reports: 0 };
  eventCreateSync(ev);
  addLog(ev, `נפתח אירוע: ${EVT[ev.typeId].name} · ${ev.authorities.join(', ')} · ${mode === 'ongoing' ? 'מתמשך' : 'נקודתי'}${d.fromAlert ? ' · מהתראה: ' + d.fromAlert : ''}`);
  S.events.push(ev); save(); UI.newEv = null; location.hash = '#/event/' + ev.id;
};
A.phase = (el) => { const ev = getEv(el.dataset.ev); ev.phase = el.dataset.v; save(); rerender(); };
A.toggle = (el) => {
  const ev = getEv(el.dataset.ev), id = el.dataset.id, it = findItem(ev, id);
  if (ev.done[id]) { delete ev.done[id]; addLog(ev, 'בוטל סימון: ' + it.text); stepSync(ev, id, 0); } else { ev.done[id] = Date.now(); addLog(ev, 'בוצע: ' + it.text, 'done'); stepSync(ev, id, ev.done[id]); }
  save(); rerender();
};
A.newday = (el) => {
  const ev = getEv(el.dataset.ev);
  sheet(`<h3>${icon('repeat')} להתחיל יום ${ev.day + 1}?</h3><p class="muted">סימוני "בוצע" של היום (${Object.keys(ev.done).length}) יישמרו בהיסטוריה, והצ'קליסט יתאפס לחזרה יומית על השלבים.</p><div class="btn-row" style="margin-top:14px"><button class="btn btn-pri" data-act="newday-ok" data-ev="${ev.id}">התחל יום חדש</button><button class="btn btn-out" data-act="sheet-close">ביטול</button></div>`);
};
A['newday-ok'] = (el) => { const ev = getEv(el.dataset.ev); ev.history.push({ day: ev.day, date: ddmmyyyy(Date.now()), done: ev.done, q6: ev.q6 || {} }); ev.done = {}; ev.q6Prev = ev.q6 || {}; ev.q6 = {}; ev.day++; ev.phase = 'immediate'; addLog(ev, `התחיל יום ${ev.day} באירוע – הצ'קליסט היומי אופס`); save(); closeSheet(); rerender(); toast('יום ' + ev.day + ' התחיל'); };
A['del-ev'] = (el) => { const ev = getEv(el.dataset.ev); if (!ev) return; sheet(`<h3 class="del-q">${icon('trash')} האם אתה רוצה למחוק את האירוע?</h3><p class="muted">"${esc(evTitle(ev))}" נפתח ${esc(whenLabel(ev.startedAt))}. האירוע, הצ'קליסט והיומן שלו יימחקו מהאפליקציה ומהשרת. מתאים לאירוע שנפתח בטעות.</p><p class="muted small">אם האירוע אמיתי והסתיים – עדיף "סגור אירוע", כדי לשמור תיעוד וסיכום.</p><div class="btn-row" style="margin-top:14px"><button class="btn btn-danger" data-act="del-ok" data-ev="${ev.id}">כן, למחוק</button><button class="btn btn-out" data-act="sheet-close">לא, ביטול</button></div>`); };
A['del-ok'] = (el) => {
  const id = el.dataset.ev, ev = getEv(id); if (!ev) return;
  S.events = S.events.filter((e) => e.id !== id);
  S.deletedEvents = (S.deletedEvents || []).concat(id).slice(-200);
  (S.assessments || []).forEach((a) => { if (a.eventId === id) a.eventId = ''; });
  if (UI.assess && UI.assess.eventId === id) UI.assess.eventId = '';
  save(); send('events.delete', { event_id: id, title: evTitle(ev) });
  closeSheet(); location.hash = '#/home'; rerender(); toast('האירוע נמחק');
};
A['close-ev'] = (el) => { const ev = getEv(el.dataset.ev); sheet(`<h3>${icon('flag')} לסגור את האירוע?</h3><p class="muted">תיווצר טיוטת "סיכום והמלצות לרשות", ותתוזמן תזכורת לתחקיר AAR (24–48 שעות).</p><div class="btn-row" style="margin-top:14px"><button class="btn btn-pri" data-act="close-ok" data-ev="${ev.id}">סגור והפק סיכום</button><button class="btn btn-out" data-act="sheet-close">ביטול</button></div>`); };
A['close-ok'] = (el) => { const ev = getEv(el.dataset.ev); ev.closedAt = Date.now(); addLog(ev, 'האירוע נסגר. נוצרה טיוטת סיכום לרשות'); send('events.close', { event_id: ev.id }); ev.summary = ''; save(); closeSheet(); location.hash = '#/event/' + ev.id + '/summary'; };
A.debrief = (el) => { const ev = getEv(el.dataset.ev) || openEvents()[0]; if (!ev) return; ev.debriefAt = Date.now(); addLog(ev, 'התקיים דיבוב ראשון – תזכורת למפגש שני בעוד כשבועיים'); save(); rerender(); toast('תזכורת נקבעה ל-' + ddmm(ev.debriefAt + 14 * 864e5)); };
A['item-flyers'] = (el) => { const ev = getEv(el.dataset.ev), it = findItem(ev, el.dataset.id); sheet(`<h3>${icon('image')} פליירים לפעולה</h3><p class="muted" style="margin-bottom:8px">${esc(it.text)}</p>${(it.flyers || []).filter((f) => FLY[f]).map((f) => `<button class="fl" style="width:100%;text-align:right;margin-bottom:8px" data-act="fl-open" data-id="${f}">${flyerThumb(FLY[f])}<span class="fl-t"><b>${esc(FLY[f].title)}</b>${flyerTags(FLY[f])}</span></button>`).join('')}`); };
// message
A['msg-sel'] = (el) => { const M = UI.msg; M.sel[el.dataset.id] = !M.sel[el.dataset.id]; rerender(); };
A['msg-role'] = (el) => { UI.msg.role = el.dataset.v; rerender(); };
A['msg-lang'] = (el) => { UI.msg.lang[UI.msg.role] = el.dataset.v; rerender(); };
A['msg-flyer'] = () => { UI.msg.flyerIdx++; UI.msg.file = null; rerender(); };
function msgContext() {
  const { parts } = parseHash(); const ev = getEv(parts[1]); const it = findItem(ev, parts[3]); const m = it.messages[+parts[4]]; const tpl = TPL[m.templateId];
  return { ev, it, m, tpl };
}
/** Text for role in lang. Arabic falls back to Hebrew (never auto-translated) and says so. Edits are kept per role+lang. */
function msgText(M, ev, tpl, role, lang) {
  let draft = false, none = false, src;
  if (lang === 'ar') { const v = arVariant(tpl, role); if (v) { src = v.text; draft = v.draft; } else { none = true; lang = 'he'; } }
  if (lang === 'he') src = (tpl.variants.find((v) => v.role === role && v.lang === 'he') || variantFor(tpl, role, 'he')).text;
  const k = role + ':' + lang;
  if (M.texts[k] == null) M.texts[k] = fillTpl(src, baseValues(ev, null, lang));
  return { text: M.texts[k], lang, draft, none, key: k };
}
function textForRole(role, lang) { const M = UI.msg; const { ev, tpl } = msgContext(); return msgText(M, ev, tpl, role, lang || M.lang[role] || 'he'); }
A['msg-copy'] = async () => { const ok = await copyText(textForRole(UI.msg.role).text); toast(ok ? 'הנוסח הועתק' : 'לא ניתן להעתיק'); };
A['msg-share'] = async () => {
  const { ev, tpl } = msgContext(); const text = fillTpl(textForRole(UI.msg.role).text, { 'שם_נמען': '' }).replace(/^שלום\s*,/, 'שלום,').replace(/\s+,/g, ',');
  const r = await shareWithFile(text, UI.msg.file);
  if (r !== 'cancelled') { addLog(ev, `שותף: "${tpl.title}"${UI.msg.file ? ' + פלייר' : ''}`, 'msg'); save(); }
  toast(r === 'copied' ? 'הנוסח הועתק. השיתוף לא נתמך בדפדפן הזה – הדבק בוואטסאפ' : r === 'cancelled' ? 'השיתוף בוטל' : 'הנוסח גם הועתק – הדבק אם חסר');
};
A['msg-send'] = () => {
  const { ev, it, m } = msgContext(); const M = UI.msg;
  const list = recipientsFor(ev, m.recipientsRoles).filter((r) => r.contact && M.sel[r.contact.id]).map((r) => {
    const T = textForRole(r.role, r.contact.lang === 'ar' ? 'ar' : (M.lang[r.role] || 'he'));
    const vals = { ...baseValues(ev, r.auth, T.lang), 'שם_נמען': firstName(r.contact.name) };
    return { ...r, text: fillTpl(T.text, vals), lang: T.lang, draft: T.draft };
  });
  UI.queue = { evId: ev.id, itemId: it.id, title: TPL[m.templateId].title, list, i: 0 }; queueSheet();
};
A['q-open'] = (el) => { const Q = UI.queue; const r = Q.list[Q.i]; const ev = getEv(Q.evId); addLog(ev, `נשלחה הודעה "${Q.title}" ל${r.contact.name} (${roleName(r.role)}${r.auth ? ', ' + r.auth : ''})`, 'msg'); save(); Q.i++; setTimeout(queueSheet, 300); return 'follow'; };
A['q-skip'] = () => { UI.queue.i++; queueSheet(); };
A['q-done'] = () => { const Q = UI.queue; const ev = getEv(Q.evId); const it = findItem(ev, Q.itemId); ev.done[it.id] = Date.now(); addLog(ev, 'בוצע: ' + it.text, 'done'); stepSync(ev, it.id, ev.done[it.id]); save(); closeSheet(); rerender(); toast('סומן כבוצע'); };
// report
A['rep-regen'] = () => { const { parts } = parseHash(); const R = UI.report[parts[1]]; R.text = buildReport(getEv(parts[1]), R.needs); rerender(); };
A['rep-copy'] = async () => { const { parts } = parseHash(); toast((await copyText(UI.report[parts[1]].text)) ? 'הדיווח הועתק' : 'לא ניתן להעתיק'); };
A['rep-send'] = (el) => { const ev = getEv(el.dataset.ev); const dir = S.contacts.find((c) => c.role === 'center_director'); if (!dir) return 'block'; ev.reports = (ev.reports || 0) + 1; addLog(ev, 'נשלח דיווח למנהלת המרכז', 'msg'); save(); el.href = waLink(dir.phone, UI.report[ev.id].text); return 'follow'; };
// log & summary
A['log-add'] = (el) => { const inp = $('#note'); const v = inp.value.trim(); if (!v) return; const { parts } = parseHash(); const ev = getEv(parts[1]); addLog(ev, v, 'note'); save(); rerender(); setTimeout(() => { const n = $('#note'); if (n) n.focus(); }, 0); };
A['sum-regen'] = (el) => { const ev = getEv(el.dataset.ev); ev.summary = buildSummary(ev); save(); rerender(); };
A['sum-copy'] = async (el) => { toast((await copyText(getEv(el.dataset.ev).summary)) ? 'הסיכום הועתק' : 'לא ניתן להעתיק'); };
A['sum-share'] = async (el) => { const r = await shareWithFile(getEv(el.dataset.ev).summary, null); toast(r === 'copied' ? 'הסיכום הועתק – הדבק בוואטסאפ או במייל' : r === 'cancelled' ? 'בוטל' : 'שותף'); };
// intake
A['in-sample'] = () => { UI.intake = { text: SAMPLE_INTAKE, res: null, written: false }; rerender(); };
A['in-paste'] = async () => { try { const t = await navigator.clipboard.readText(); if (t) { UI.intake.text = t; UI.intake.res = null; UI.intake.written = false; rerender(); return; } } catch (e) { /* fallthrough */ } toast('לא ניתן לקרוא מהלוח – הדבק ידנית בתיבה'); };
A['in-parse'] = () => { const I = UI.intake; if (!I.text.trim()) { toast('הדבק קודם הודעה'); return; } I.res = parseIntake(I.text, ME()); I.written = false; I.result = null; I.requestId = null; I.serverErr = null; rerender(); setTimeout(() => { const h = document.querySelectorAll('.h2')[1]; if (h) h.scrollIntoView({ block: 'start' }); }, 0); setTimeout(() => openFill(true), 350); };
A['in-regen'] = () => { regenSessions(UI.intake.res); rerender(); };
/** One server row object per session (keys = sessions.add contract, SHEETS.md §1). */
function sessionRows(R) {
  const n = R.sessions.length;
  return R.sessions.map((d, i) => ({ funder: R.F.funder, authority: R.F.authority, locality: R.F.settlement, location: R.F.location, domain: R.F.domain,
    activityName: R.F.activity, activityType: R.F.type, expectedSessions: n, audience: R.F.audience, participants: R.F.participants, sessionNumber: i + 1,
    facilitator: R.F.facilitator, facilitatorResidence: R.F.facResidence, date: d, hours: R.F.hours, pricingGroups: (R.g15 || [])[i] || '', status: 'תואם', notes: R.F.notes }));
}
function addLocalSessions(R, mark) {
  const br = BR(), n = R.sessions.length;
  R.sessions.forEach((d, i) => S.sessions.push({ id: uid(), tab: br.tab, status: 'תואם', funder: R.F.funder, domain: R.F.domain, type: R.F.type, authority: R.F.authority, settlement: R.F.settlement, location: R.F.location, activity: R.F.activity, audience: R.F.audience, participants: R.F.participants, facilitator: R.F.facilitator, facResidence: R.F.facResidence, date: d, hours: R.F.hours, no: i + 1, total: n, notes: R.F.notes, groups15: (R.g15 || [])[i] || '', ...mark }));
}
function sessionsFlushed(requestId, data) {
  S.sessions.forEach((x) => { if (x.req === requestId) { x.queued = false; x.dry = !!(data && data.dryRun); } }); save();
  const I = UI.intake; if (I && I.requestId === requestId) { I.result = data; softRender(); }
  toast(data && data.dryRun ? 'קליטת הקבוצה נשלחה – מצב בדיקה, לא נכתב לטבלה' : 'קליטת הקבוצה נכתבה לטבלת המעקב');
}
const scrollWritten = () => setTimeout(() => { const w = $('#written'); if (w) w.scrollIntoView({ block: 'start' }); }, 0);
A['in-write'] = async () => {
  const I = UI.intake, R = I.res, n = R.sessions.length;
  if (missingReq(R).length) { openFill(false); return; }
  if (G.demo) { addLocalSessions(R, { demo: true }); save(); I.written = true; I.result = { demo: true }; rerender(); toast(n + ' שורות מוכנות · נוספו להשבוע שלי'); scrollWritten(); return; }
  if (I.busy) return;
  I.busy = true; I.serverErr = null; rerender();
  I.requestId = I.requestId || newId();   // same id on retry → the server never writes twice
  try {
    const r = await api.call('sessions.add', { rows: sessionRows(R) }, { requestId: I.requestId, queueable: true });
    I.result = r; I.written = true; setTimeout(() => { loadTab(true); WEEK.cache = {}; }, 1500); if (r.queued && r.reason === 'network') { SYNC.err = 'NETWORK'; paintSync(); }
    if (!r.duplicate || !S.sessions.some((x) => x.req === I.requestId)) addLocalSessions(R, { req: I.requestId, queued: !!r.queued, dry: !!r.dryRun });
    save();
    toast(r.queued ? 'אין חיבור – נשמר בתור ויישלח אוטומטית' : r.dryRun ? 'מצב בדיקה – לא נכתב לטבלה' : n + ' שורות נכתבו לטבלת המעקב');
  } catch (e) {
    I.serverErr = { code: e.code, message: e.message, details: e.details };
    SYNC.err = e.code; paintSync();
  } finally { I.busy = false; rerender(); scrollWritten(); }
};
A['in-new'] = () => { UI.intake = null; rerender(); };
A['mf-pick'] = (el) => { const P = UI.fill, k = P.keys[P.i]; if (['participants', 'expected', 'g15'].includes(k)) { P.v = el.dataset.v; } if (fillSet(k, el.dataset.v)) fillAdvance(); };
A['mf-fac'] = (el) => { const P = UI.fill, R = UI.intake.res, f = FACS[+el.dataset.i]; R.F.facilitator = f.n; R.flag.facilitator = 'ok'; delete R.F._facOrig; R.F._facNew = false; if (f.h) { R.F.facResidence = f.h; R.flag.facResidence = 'list'; } fillAdvance(); };
A['mf-free'] = () => { const P = UI.fill, R = UI.intake.res, k = P.keys[P.i]; if (!fillSet(k, P.q)) return; if (k === 'facilitator') R.F._facNew = true; fillAdvance(); };
A['mf-next'] = () => { const P = UI.fill, k = P.keys[P.i]; const R0 = UI.intake.res; const i1 = $('#sheet-root [data-in="mf-in"]'), i2 = $('#sheet-root [data-in="mf-in2"]'); if (i1) P.v = i1.value; if (i2) P.v2 = i2.value; if (k === 'settlement' || k === 'location') { if (!P.v.trim() && !reqValid(R0, k)) { toast('בחר מהרשימה או הקלד'); return; } } if (k !== 'hours' && k !== 'g15' && !String(P.v || '').trim() && reqValid(R0, k)) { R0.flag[k] = 'ok'; fillAdvance(); return; } const v = k === 'hours' ? (P.v && P.v2 ? `${P.v}-${P.v2}` : '') : P.v; if (k === 'hours' && !(P.v && P.v2)) { toast('בחר שעת התחלה ושעת סיום'); return; } if (k === 'hours' && P.v2 <= P.v) { toast('שעת הסיום לפני שעת ההתחלה'); return; } if (fillSet(k, v)) fillAdvance(); };
A['mf-skip'] = () => fillAdvance();
A['mf-keep'] = () => { const P = UI.fill, R = UI.intake.res, k = P.keys[P.i]; R.flag[k] = 'ok'; fillAdvance(); };
A['mf-close'] = () => { closeSheet(); UI.fill = null; rerender(); };
A['in-fill'] = () => openFill(false);
A['in-ai'] = async () => {
  const I = UI.intake; if (!I.text.trim()) { toast('הדבק קודם הודעה'); return; }
  I.aiBusy = true; rerender();
  try { const r = await api.call('ai.parseGroupMessage', { text: I.text }, { queueable: false }); const res = intakeFromClaude(r); if (!res) throw new Error('תשובה לא צפויה מהשרת'); I.res = res; I.written = false; I.result = null; I.requestId = null; toast('ה-AI בשרת מילא את טבלת האישור'); setTimeout(() => openFill(true), 350); }
  catch (e) { toast('ניתוח AI נכשל: ' + (e.message || '') + ' – אפשר "חלץ שדות" או "נתח עם Claude"', 4000); }
  finally { I.aiBusy = false; rerender(); }
};
// assessment
A['as-sample'] = () => { const Aa = UI.assess; Aa.text = SAMPLE_ASSESS; if (!Aa.time) { Aa.time = toLocalInput(Date.now() - 26 * 36e5); } rerender(); };
A['as-run'] = () => {
  const Aa = UI.assess; const ev = Aa.eventId ? getEv(Aa.eventId) : null; const et = Aa.time ? new Date(Aa.time).getTime() : null;
  const res = analyze(meetText(Aa), { eventTime: et && !isNaN(et) ? et : null, closed: ev && !!ev.closedAt, type: ev && ev.typeId, q6: ev ? ev.q6 : null });
  Aa.res = res;
  const rec = { id: uid(), eventId: Aa.eventId || null, t: Date.now(), text: Aa.text, eventTime: et, result: res, mtype: Aa.mtype || 'assess', mwith: Aa.mwith || '' };
  S.assessments.push(rec); Aa.saved = rec.id; assessSync(rec);
  if (ev) addLog(ev, `${meetLabel(Aa.mtype)} נשמר/ה: ${res.insights.length} תובנות, ${res.recs.length} המלצות`);
  save(); rerender(); setTimeout(() => { const r = $('#as-res'); if (r) r.scrollIntoView({ block: 'start' }); }, 0);
};
function assessSync(rec) {
  if (!live()) return;
  const R = rec.result;
  send('log', { type: 'assessment', details: { event_id: rec.eventId || '', by: R.by || 'local', at: new Date(rec.t).toISOString(), summary: String(rec.text).slice(0, 3000),
    insights: R.insights.map((i) => i.text).slice(0, 8), recommendations: R.recs.filter((r) => !r.miss).map((r) => r.text).slice(0, 10) } }, { quiet: true });
}
/** ai.analyzeAssessment result → the same view model as the pasted Claude JSON. */
function assessFromServer(res) {
  if (!res || typeof res !== 'object') return null;
  const t = (x) => (typeof x === 'string' ? x : x && (x.text || x.action || x.risk || x.question) ? String(x.text || x.action || x.risk || x.question) : '');
  const o = {
    insights: (res.insights || []).map((i) => ({ text: t(i), dimension: i && i.dimension, basis: i && i.basis })),
    recommendations: (res.recommendations || []).map((r) => ({ text: t(r), owner: r && (r.ownerRole || r.owner), timing: r && (r.timeframe || r.timing) })),
    risks: (res.keyRisks || res.risks || []).map((r) => ({ text: t(r), ifNotHandled: r && r.ifNotHandled })),
    questions: (res.openQuestions || res.questions || []).map(t),
  };
  return assessFromClaude(o, res.situationSummary || '');
}
A['as-ai'] = async () => {
  const Aa = UI.assess; if (!Aa.text.trim()) { toast('כתוב קודם סיכום'); return; }
  Aa.aiBusy = true; rerender();
  try {
    const r = await api.call('ai.analyzeAssessment', { summary: meetText(Aa), event_id: Aa.eventId || undefined }, { queueable: false });
    const res = assessFromServer(r && r.result); if (!res) throw new Error('תשובה לא צפויה מהשרת');
    const ev = Aa.eventId ? getEv(Aa.eventId) : null; const et = Aa.time ? new Date(Aa.time).getTime() : null;
    const rec = { id: uid(), eventId: Aa.eventId || null, t: Date.now(), text: Aa.text, eventTime: et, result: res, serverId: r.assessmentId, mtype: Aa.mtype || 'assess', mwith: Aa.mwith || '' };
    S.assessments.push(rec); Aa.res = res; Aa.saved = rec.id;
    if (ev) addLog(ev, `${meetLabel(Aa.mtype)} (AI בשרת) נשמר/ה: ${res.insights.length} תובנות, ${res.recs.length} המלצות`);
    save();
  } catch (e) { toast('ניתוח AI נכשל: ' + (e.message || '') + ' – אפשר "נתח" או "נתח עם Claude"', 4000); }
  finally { Aa.aiBusy = false; rerender(); setTimeout(() => { const x = $('#as-res'); if (x) x.scrollIntoView({ block: 'start' }); }, 0); }
};
A['as-copy'] = async () => { toast((await copyText(assessText(UI.assess.res))) ? 'ההמלצות הועתקו' : 'לא ניתן להעתיק'); };
A['as-open'] = (el) => { const a = S.assessments.find((x) => x.id === el.dataset.id); if (!a) return; sheet(`<h3>${icon('clip')} ${esc(meetLabel(a.mtype))}${a.mwith ? ' · ' + esc(a.mwith) : ''} · ${whenLabel(a.t)}</h3><div class="out" style="margin-bottom:10px">${esc(a.text)}</div>${assessResult(a.result, { saved: a.id, eventId: a.eventId }).replace('data-act="as-copy"', 'data-act="as-copy-h" data-id="' + a.id + '"')}<button class="btn btn-out" style="width:100%;margin-top:10px" data-act="sheet-close">סגור</button>`); };
A['as-copy-h'] = async (el) => { const a = S.assessments.find((x) => x.id === el.dataset.id); toast((await copyText(assessText(a.result))) ? 'ההמלצות הועתקו' : 'לא ניתן להעתיק'); };
A['as-mic'] = () => {
  if (UI.rec) { try { UI.rec.stop(); } catch (e) { /* ignore */ } UI.rec = null; rerender(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  try {
    const r = new SR(); r.lang = 'he-IL'; r.continuous = true; r.interimResults = false;
    const base = UI.assess.text ? UI.assess.text.trim() + ' ' : '';
    let acc = '';
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) acc += e.results[i][0].transcript + ' '; UI.assess.text = base + acc; const ta = $('#astext'); if (ta) ta.value = UI.assess.text; };
    r.onend = () => { UI.rec = null; rerender(); };
    r.onerror = () => { toast('ההכתבה לא זמינה – השתמש במיקרופון של המקלדת'); };
    r.start(); UI.rec = r; rerender();
  } catch (e) { toast('ההכתבה לא זמינה'); }
};
// week
A.wk = (el) => { UI.weekOff += +el.dataset.v; rerender(); };
A.ss = (el) => { const s = S.sessions.find((x) => x.id === el.dataset.id); s.status = s.status === el.dataset.v ? 'תואם' : el.dataset.v; save(); rerender(); toast('סטטוס: ' + s.status + ' – נשמר בטלפון. בטבלת המעקב מעדכנים ידנית'); };
// contacts
A['ct-by'] = (el) => { UI.ct.by = el.dataset.v; rerender(); };
A['ct-add'] = () => editContact(null);
A['ct-addrole'] = (el) => editContact(null, { role: el.dataset.role, authority: el.dataset.auth });
A['ct-edit'] = (el) => editContact(el.dataset.id);
A['ct-del'] = (el) => {
  const c = S.contacts.find((x) => x.id === el.dataset.id); if (!c) return;
  S.contacts = S.contacts.filter((x) => x.id !== c.id);
  if (live()) { if (c._local) S.pendingDeletes.push(normPhone(c.phone).wa); else send('contacts.delete', { contact_id: c.id }); }
  save(); closeSheet(); rerender(); toast('נמחק');
};
A['ct-pick'] = async () => {
  if (!('contacts' in navigator && 'ContactsManager' in window)) { toast('בחירה מאנשי הקשר זמינה באנדרואיד. באייפון – ייבוא vCard'); return; }
  try { const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true }); const list = []; picked.forEach((c) => { const tels = (c.tel || []).map((t) => normPhone(t)).filter((p) => p.valid); if (tels.length) { const best = tels.find((p) => p.mobile) || tels[0]; list.push({ name: (c.name && c.name[0]) || best.local, phone: best.local, source: 'picker' }); } }); assignImported(list); } catch (e) { toast('הבחירה בוטלה'); }
};
// flyers
A['fl-sit'] = (el) => { UI.fl.sit = el.dataset.v; rerender(); };
A['fl-lang'] = (el) => { UI.fl.lang = el.dataset.v; rerender(); };
A['fl-open'] = (el) => openFlyer(el.dataset.id);
A['fl-share'] = async (el) => { const f = FLY[el.dataset.id]; const r = await shareWithFile(f.title + '\nמרכז חוסן גליל מערבי · מוקד סיוע: ' + HOT['מוקד_עברית'], UI.flFile); toast(r === 'copied' ? 'הטקסט הועתק – השיתוף לא נתמך כאן' : r === 'cancelled' ? 'בוטל' : 'שותף'); };
// misc
A.settings = () => settingsSheet();
A['cl-go'] = (el) => {
  const kind = el.dataset.k;
  const holder = kind === 'in' ? UI.intake : UI.assess;
  const text = holder.text;
  if (!String(text || '').trim()) { toast(kind === 'in' ? 'הדבק קודם הודעה' : 'כתוב קודם סיכום'); return 'block'; }
  const prompt = kind === 'in' ? intakePrompt(text) : assessPrompt(holder);
  const full = 'https://claude.ai/new?q=' + encodeURIComponent(prompt);
  const long = full.length > CLAUDE_URL_MAX;
  el.href = long ? 'https://claude.ai/new' : full;
  holder.claude = { prompt, long, manual: false, paste: (holder.claude || {}).paste || '', err: '' };
  const done = (ok) => { if (!ok) holder.claude.manual = true; rerender(); const m = $('#cl-manual'); if (m) { m.focus(); m.select(); } toast(ok ? (long ? 'הפרומפט הועתק – הדבק ב-Claude' : 'הפרומפט הועתק') : 'ההעתקה נכשלה – העתק ידנית מהתיבה'); setTimeout(() => { const b = $('#cl-' + kind); if (b) b.scrollIntoView({ block: 'start' }); }, 0); };
  try { navigator.clipboard.writeText(prompt).then(() => done(true), () => done(false)); } catch (e) { setTimeout(() => done(false), 0); }
  return 'follow';
};
A['cl-close'] = (el) => { const h = el.dataset.k === 'in' ? UI.intake : UI.assess; h.claude = null; rerender(); };
A['cl-load'] = (el) => {
  const kind = el.dataset.k, h = kind === 'in' ? UI.intake : UI.assess; const C = h.claude;
  const ex = extractJson(C.paste);
  const bad = () => { C.err = 'לא נמצא JSON תקין בתשובה – ודא שהעתקת את כל התשובה'; rerender(); };
  if (!ex) return bad();
  if (kind === 'in') {
    const res = intakeFromClaude(ex.obj); if (!res) return bad();
    h.res = res; h.written = false; h.result = null; h.requestId = null; h.claude = null; rerender(); toast('התוצאה של Claude נטענה לטבלת האישור'); setTimeout(() => openFill(true), 350);
    setTimeout(() => { const t = document.querySelectorAll('.h2')[1]; if (t) t.scrollIntoView({ block: 'start' }); }, 0);
  } else {
    const res = assessFromClaude(ex.obj, ex.rest); if (!res) return bad();
    const ev = h.eventId ? getEv(h.eventId) : null; const et = h.time ? new Date(h.time).getTime() : null;
    const rec = { id: uid(), eventId: h.eventId || null, t: Date.now(), text: h.text, eventTime: et, result: res, mtype: h.mtype || 'assess', mwith: h.mwith || '' };
    S.assessments.push(rec); h.res = res; h.saved = rec.id; h.claude = null; assessSync(rec);
    if (ev) addLog(ev, `${meetLabel(h.mtype)} (נותח ע"י Claude) נשמר/ה: ${res.insights.length} תובנות, ${res.recs.length} המלצות`);
    save(); rerender(); toast('התוצאה של Claude נטענה ונשמרה');
    setTimeout(() => { const r = $('#as-res'); if (r) r.scrollIntoView({ block: 'start' }); }, 0);
  }
};
A['g15-all'] = () => { const R = UI.intake.res; const v = (R.g15AllV || '').trim(); if (!v) { toast('הקלד ערך ואז "החל על כל המפגשים"'); return; } R.g15 = R.sessions.map(() => v); rerender(); toast('הוחל על ' + R.sessions.length + ' מפגשים'); };
A['fac-pick'] = (el) => { const f = FACS[+el.dataset.i]; const R = UI.intake.res; R.F.facilitator = f.n; R.flag.facilitator = 'ok'; delete R.F._facOrig; R.F._facNew = false; R.F.facResidence = f.h || ''; R.flag.facResidence = f.h ? 'list' : 'missing'; rerender(); };
A['q6-copy'] = (el) => { const ev = getEv(el.dataset.ev); const q = Q6.find((x) => x.id === el.dataset.q); const v = String((ev.q6Prev || {})[q.id] || '').trim(); if (!v) return; ev.q6 = ev.q6 || {}; ev.q6[q.id] = v; addLog(ev, `בירור – ${q.q} ${v} (הועתק מאתמול)`, 'note'); save(); rerender(); };
A['al-all'] = () => { UI.alAll = !UI.alAll; rerender(); };
A['al-refresh'] = () => loadNews(true);
A['fl-cat'] = (el) => { UI.fl.cat = el.dataset.v; rerender(); };
A['as-type'] = (el) => { const Aa = UI.assess; Aa.mtype = el.dataset.v; if (Aa.mtype !== 'institution' && Aa.mtype !== 'contact') Aa.mwith = ''; rerender(); };
A.pres = actPres; A.voice = actVoice;
A['ptt-target'] = (el) => { VOICE.target = el.dataset.v; LS.set('hosen:ptt-target', VOICE.target); actVoice(); };
A['ptt-auto'] = (el) => { VOICE.autoplay = !VOICE.autoplay; LS.set('hosen:ptt-auto', VOICE.autoplay); actVoice(); };
A['v-play'] = async (el) => { const m = VOICE.list.find((x) => x.id === el.dataset.id); if (!m) return; el.disabled = true; try { await playVoice(m); } catch (e) { toast((e && e.message) || 'לא הצלחתי להשמיע'); } el.disabled = false; if ($('#sheet-root .voice-sheet')) actVoice(); };
A['wk-refresh'] = () => { loadWeek(UI.weekOff || 0, true); rerender(); };
A.wst = (el) => { const r = weekRowByNum(el.dataset.row), v = el.dataset.v; if (!r) return; UI.wst = { row: r.row, v };
  sheet(`<h3>לעדכן את הסטטוס בטבלת המעקב?</h3><p><b>${esc(r.activityName)}</b> · ${esc(r.date)} ${esc(r.hours || '')}<br><span class="muted">${esc([r.authority, r.location].filter(Boolean).join(' · '))} · שורה ${r.row} בלשונית "${esc((WEEK.cache[weekKey(UI.weekOff || 0)] || {}).tab || BR().tab)}"</span></p><p>הסטטוס ישתנה מ<b>"${esc(r.status || '—')}"</b> ל<b>"${esc(v)}"</b>.</p><div class="btn-row" style="margin-top:14px"><button class="btn ${v === 'בוטלה' ? 'btn-danger' : 'btn-pri'}" data-act="wst-ok">כן, לעדכן בטבלה</button><button class="btn btn-out" data-act="sheet-close">ביטול</button></div>`); };
A['wst-ok'] = async (el) => { const q = UI.wst; const r = q && weekRowByNum(q.row); if (!r) { closeSheet(); return; } el.disabled = true; el.textContent = 'מעדכן…';
  try { const res = await api.call('sessions.setStatus', { row: r.row, status: q.v, expect: { date: r.date, activityName: r.activityName } }, { queueable: false });
    closeSheet(); if (res && res.dryRun) toast('מצב בדיקה – הטבלה לא עודכנה'); else { r.status = q.v; toast('עודכן בטבלה: ' + q.v); } rerender();
  } catch (e) { closeSheet(); toast((e && e.message) || 'העדכון נכשל'); loadWeek(UI.weekOff || 0, true); } };
A['tab-refresh'] = () => { loadTab(true); rerender(); };
A['al-open'] = (el) => { const x = alertFeed().find((a) => a.id === el.dataset.id); if (!x) return; UI.newEv = { typeId: x.typeId, mode: null, auths: x.regional ? [BR().authorities[0]] : x.auths.slice(), time: toLocalInput(x.t || Date.now()), fromAlert: x.title }; location.hash = '#/emergency'; };
A.theme = () => { G.theme = G.theme === 'dark' ? 'light' : 'dark'; saveG(); applyTheme(); settingsSheet(); };
A.notif = async () => {
  if (!('Notification' in window)) { toast('התראות לא נתמכות בדפדפן הזה. התזכורות מופיעות באפליקציה'); return; }
  let p = Notification.permission; if (p === 'default') { try { p = await Notification.requestPermission(); } catch (e) { /* ignore */ } }
  if (p === 'granted') { try { new Notification('חוסן שלוחות', { body: 'התראות פעילות. תזכורות יופיעו כשהאפליקציה פתוחה.' }); } catch (e) { /* ignore */ } toast('התראות פעילות'); } else toast('ההתראות חסומות – התזכורות יופיעו באפליקציה');
};
A.reset = () => { if (!G.demo || !confirm('לאפס את כל נתוני ההדגמה?')) return; LS.del('hosen:u:demo'); S = null; UI.intake = null; UI.assess = null; UI.msg = null; UI.report = {}; closeSheet(); loadUser(); location.hash = '#/home'; rerender(); toast('הנתונים אופסו'); };
A.logout = async () => {
  if (!G.demo) {
    const n = SYNC.pending + SYNC.failed;
    if (n && !confirm(`יש ${n} פעולות שעוד לא נשלחו לשרת. ביציאה הן יימחקו מהטלפון. לצאת בכל זאת?`)) return;
    const k = userKey(); if (k) LS.del('hosen:u:' + k);   // shared phones: nothing of this user stays behind
    LS.del('hosen:fac');
    await api.clearAll();
  }
  G.session = null; G.demo = false; saveG(); S = null; closeSheet(); UI.loginMsg = ''; Object.assign(UI, { intake: null, assess: null, msg: null, report: {}, newEv: null }); location.hash = ''; rerender();
};
A.install = async () => {
  if (INSTALL_EVT) { const ev = INSTALL_EVT; INSTALL_EVT = null; ev.prompt(); try { await ev.userChoice; } catch (_) {} render(); return; }
  installHelp();
};
A.pw = () => sheet(`<h3>${icon('shield')} שינוי סיסמה</h3>
  <form data-form="pw">
  <label class="lbl" for="pw0">הסיסמה הנוכחית</label><input class="inp" id="pw0" name="p0" type="password" dir="ltr" autocomplete="current-password" required>
  <label class="lbl" for="pw1">סיסמה חדשה <span class="muted">(לפחות 6 תווים)</span></label><input class="inp" id="pw1" name="p1" type="password" dir="ltr" autocomplete="new-password" minlength="6" required>
  <label class="lbl" for="pw2">שוב את הסיסמה החדשה</label><input class="inp" id="pw2" name="p2" type="password" dir="ltr" autocomplete="new-password" minlength="6" required>
  <div class="login-err" id="pwerr"></div>
  <div class="btn-row" style="margin-top:12px"><button class="btn btn-pri" type="submit">שמור</button><button class="btn btn-out" type="button" data-act="sheet-close">ביטול</button></div></form>
  <p class="muted small" style="margin-top:8px">אחרי השינוי, טלפונים אחרים שמחוברים עם המשתמש הזה יצטרכו להיכנס מחדש.</p>`);
A['set-branch'] = (el) => {
  const b = el.dataset.b; if (!BRANCHES[b] || b === viewBranch()) return;
  G.viewBranch = b; saveG(); S = null; loadUser(); render(); toast('עברת ל' + BRANCHES[b].name); pullAll();
};
A.demo = () => { G.demo = true; G.session = null; saveG(); S = null; loadUser(); location.hash = '#/home'; render(); toast('מצב אורח – נתוני דוגמה בלבד, שום דבר לא נשמר בטבלה', 3500); };
A.sync = () => {
  if (G.demo) { toast('במצב הדגמה אין חיבור לשרת'); return; }
  if (SYNC.failed) { sheet(`<h3>${icon('alert')} ${SYNC.failed} פעולות נכשלו</h3><p class="muted">השרת דחה אותן כמה פעמים (למשל ערך לא תקין). אפשר לנסות שוב, או למחוק אותן מהתור.</p><div class="btn-row" style="margin-top:14px"><button class="btn btn-pri" data-act="sync-now">נסה שוב</button><button class="btn btn-out" data-act="sync-discard">מחק מהתור</button></div>`); return; }
  A['sync-now']();
};
A['sync-now'] = async () => { closeSheet(); SYNC.err = null; await api.retryFailed(); toast(navigator.onLine ? 'מסנכרן…' : 'אין חיבור – הפעולות ממתינות בתור'); await api.flush(); await refreshServerInfo(); await pullAll(); };
A['sync-discard'] = async () => { await api.discardFailed(); closeSheet(); toast('הפעולות שנכשלו נמחקו מהתור'); };
A['sheet-close'] = () => closeSheet();
A['sheet-bg'] = (el, e) => { if (e.target === el) closeSheet(); };

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'sheet-bg' && e.target !== el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'A' && (el.dataset.act === 'q-open' || el.dataset.act === 'rep-send' || el.dataset.act === 'cl-go')) { if (fn(el, e) === 'block') e.preventDefault(); return; } // let the link open WhatsApp / Claude
  if (el.getAttribute('aria-disabled') === 'true' && el.dataset.act !== 'ct-pick') return;
  e.preventDefault(); fn(el, e);
});
const IN = {
  'ev-time': (el) => { UI.newEv.time = el.value; },
  'msg-text': (el) => { const M = UI.msg; M.texts[textForRole(M.role).key] = el.value; },
  'rep-needs': (el) => { const { parts } = parseHash(); const R = UI.report[parts[1]]; R.needs = el.value; R.text = buildReport(getEv(parts[1]), R.needs); const ta = $('#rtext'); if (ta) ta.value = R.text; },
  'rep-text': (el) => { const { parts } = parseHash(); UI.report[parts[1]].text = el.value; },
  'sum-text': (el) => { const ev = getEv(el.dataset.ev); ev.summary = el.value; save(); },
  'in-text': (el) => { UI.intake.text = el.value; },
  'mf-in': (el) => { if (UI.fill) UI.fill.v = el.value; },
  'mf-in2': (el) => { if (UI.fill) UI.fill.v2 = el.value; },
  'mf-q': (el) => { if (!UI.fill) return; UI.fill.q = el.value; clearTimeout(IN._mt); IN._mt = setTimeout(() => { const p = el.selectionStart; fillSheet(); const n = document.querySelector('[data-in="mf-q"]'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (_) {} } }, 200); },
  'q6': (el) => { const ev = getEv(el.dataset.ev); ev.q6 = ev.q6 || {}; ev.q6[el.dataset.q] = el.value; save(); const card = el.closest('.q6'); if (card) { const n = q6Answered(ev); card.querySelector('.q6-h .tag').textContent = n + '/6'; card.classList.toggle('ok', n === 6); } },
  'cl-paste': (el) => { const h = el.dataset.k === 'in' ? UI.intake : UI.assess; if (h.claude) { h.claude.paste = el.value; } },
  'g15': (el) => { const R = UI.intake.res; R.g15 = R.g15 || []; R.g15[+el.dataset.i] = el.value.trim(); },
  'g15-allv': (el) => { UI.intake.res.g15AllV = el.value.trim(); },
  'in-fac': (el) => { const R = UI.intake.res; R.F.facilitator = el.value; R.flag.facilitator = el.value.trim() ? 'inferred' : 'missing'; R.F._facNew = !!el.value.trim(); delete R.F._facOrig; showFacSugg(el.value); },
  'in-f': (el) => { const R = UI.intake.res; R.F[el.dataset.k] = el.value; R.flag[el.dataset.k] = 'ok'; el.closest('.f').classList.remove('warn'); if (['hours', 'authority', 'settlement'].includes(el.dataset.k) && el.tagName === 'SELECT') rerender(); },
  'as-ev': (el) => { const Aa = UI.assess; Aa.eventId = el.value; const ev = getEv(el.value); Aa.time = ev ? toLocalInput(ev.startedAt) : ''; rerender(); },
  'as-time': (el) => { UI.assess.time = el.value; },
  'as-with': (el) => { UI.assess.mwith = el.value; },
  'doc-q': (el) => { UI.docQ = el.value; const p = el.selectionStart; rerender(); const n = document.querySelector('[data-in="doc-q"]'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (_) {} } },
  'as-text': (el) => { UI.assess.text = el.value; const b = document.querySelector('[data-act="as-run"]'); if (b) b.disabled = !el.value.trim(); },
  'ct-q': (el) => { UI.ct.q = el.value; clearTimeout(IN._t); IN._t = setTimeout(() => { rerender(); const i = document.querySelector('[data-in="ct-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); },
  'fl-q': (el) => { UI.fl.q = el.value; clearTimeout(IN._t); IN._t = setTimeout(() => { rerender(); const i = document.querySelector('[data-in="fl-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); },
  'fl-aud': (el) => { UI.fl.aud = el.value; rerender(); },
  'set-phone': (el) => { S.settings.phone = el.value; save(); },
  'ct-vcf': async (el) => { const f = el.files && el.files[0]; if (!f) return; try { assignImported(parseVcf(await f.text())); } catch (e) { toast('לא ניתן לקרוא את הקובץ'); } el.value = ''; },
};
document.addEventListener('input', (e) => { const el = e.target.closest('[data-in]'); if (el && IN[el.dataset.in] && el.type !== 'file' && el.tagName !== 'SELECT') IN[el.dataset.in](el); });
document.addEventListener('change', (e) => { const q = e.target.closest('[data-in="q6"]'); if (q) { const ev = getEv(q.dataset.ev); const v = q.value.trim(); const qq = Q6.find((x) => x.id === q.dataset.q); if (v && ev) { addLog(ev, `בירור – ${qq.q} ${v}`, 'note'); save(); } return; } const el = e.target.closest('[data-in]'); if (el && IN[el.dataset.in] && (el.type === 'file' || el.tagName === 'SELECT' || el.type === 'datetime-local')) IN[el.dataset.in](el); });
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter) { e.preventDefault(); const fn = A[e.target.dataset.enter]; if (fn) fn(e.target); } });
document.addEventListener('submit', (e) => {
  const f = e.target; const kind = f.dataset.form; if (!kind) return; e.preventDefault();
  const fd = new FormData(f);
  if (kind === 'login') {
    const u = String(fd.get('u') || '').trim().toLowerCase(), p = String(fd.get('p') || '');
    if (!u || !p || UI.loggingIn) return;
    UI.loggingIn = true; UI.loginMsg = ''; const btn = f.querySelector('.go'); if (btn) { btn.disabled = true; btn.textContent = 'מתחבר…'; }
    api.login(u + ':' + p).then((data) => {
      UI.loggingIn = false; UI.loginMsg = '';
      G.session = { user: data.user, config: data.config, username: u }; G.demo = false;
      if (data.config && typeof data.config.dryRun === 'boolean') G.server = { ...(G.server || {}), dryRun: data.config.dryRun, version: data.config.version };
      saveG(); S = null; loadUser(); location.hash = '#/home'; render();
      toast('שלום ' + ME().first);
      refreshServerInfo().then(() => softRender()); pullAll();
    }).catch((e) => {
      UI.loggingIn = false;
      UI.loginMsg = e.code === 'BAD_CODE' ? 'שם משתמש או סיסמה שגויים' : e.code === 'LOCKED' ? e.message : (e.code === 'NETWORK' || e.code === 'TIMEOUT') ? 'אין חיבור לשרת. בדוק את החיבור ונסה שוב.' : 'הכניסה נכשלה: ' + (e.message || e.code || 'שגיאה');
      render(); const pi = $('#lp'); const ui = $('#lu'); if (ui) ui.value = u; if (pi) pi.focus();
    });
  } else if (kind === 'pw') {
    const p0 = String(fd.get('p0') || ''), p1 = String(fd.get('p1') || ''), p2 = String(fd.get('p2') || ''); const err = $('#pwerr');
    if (!G.session || !G.session.username) { err.textContent = 'כדי לשנות סיסמה צריך לצאת ולהיכנס שוב פעם אחת'; return; }
    if (p1.length < 6) { err.textContent = 'הסיסמה צריכה לפחות 6 תווים'; return; }
    if (p1 !== p2) { err.textContent = 'הסיסמאות לא זהות'; return; }
    if (/^(\d)\1+$/.test(p1) || ['123456', '1234567', '12345678', '654321', '000000'].includes(p1)) { err.textContent = 'הסיסמה פשוטה מדי. בחר סיסמה אחרת'; return; }
    if (!navigator.onLine) { err.textContent = 'שינוי סיסמה דורש חיבור לאינטרנט'; return; }
    err.textContent = 'שומר…';
    api.call('auth.changeCode', { username: G.session.username, old: p0, next: p1 }, { queueable: false })
      .then((r) => api.setToken(r.token)).then(() => { closeSheet(); toast('הסיסמה עודכנה'); })
      .catch((e) => { err.textContent = e.code === 'BAD_CODE' ? 'הסיסמה הנוכחית שגויה' : e.code === 'WEAK' ? 'הסיסמה פשוטה מדי' : e.code === 'IN_USE' ? 'בחר סיסמה אחרת' : e.code === 'UNKNOWN_ACTION' ? 'השרת עוד לא מעודכן לשינוי סיסמה' : 'השמירה נכשלה: ' + (e.message || e.code); });
  } else if (kind === 'ct-save') {
    const name = String(fd.get('name')).trim(), phone = String(fd.get('phone')).trim();
    if (!normPhone(phone).valid) { toast('מספר טלפון לא תקין'); return; }
    const data = { name, phone: fmtPhone(phone), role: fd.get('role'), authority: fd.get('authority'), lang: fd.get('lang') === 'ar' ? 'ar' : 'he' };
    let c = f.dataset.id && S.contacts.find((x) => x.id === f.dataset.id);
    if (c) Object.assign(c, data); else { c = { id: uid(), _local: live(), source: 'manual', ...data }; S.contacts.push(c); }
    save(); closeSheet(); UI.msg = null; pushContacts([c]);
    if (sessionStorageSafeBack()) return; rerender(); toast('נשמר');
  } else if (kind === 'ct-import') {
    const added = []; UI.imported.forEach((c, i) => { if (fd.get('inc' + i)) { const x = { id: uid(), _local: live(), source: c.source || 'import', name: c.name, phone: fmtPhone(c.phone), role: fd.get('role' + i), authority: fd.get('auth' + i), lang: fd.get('lang' + i) === 'ar' ? 'ar' : 'he' }; S.contacts.push(x); added.push(x); } });
    save(); closeSheet(); rerender(); toast(added.length + ' אנשי קשר נוספו'); pushContacts(added);
  }
});
function sessionStorageSafeBack() { const { q } = parseHash(); if (q.add && history.length > 1) { history.back(); setTimeout(() => toast('איש הקשר נשמר'), 300); return true; } return false; }

// ───────────── boot ─────────────
document.addEventListener('focusin', (e) => { if (e.target.dataset && e.target.dataset.in === 'in-fac') showFacSugg(e.target.value); });
document.addEventListener('click', (e) => { const ul = $('#fac-sugg'); if (ul && !ul.hidden && !e.target.closest('.f-v') && !e.target.closest('#fac-sugg')) ul.hidden = true; }, true);
window.addEventListener('hashchange', render);
setInterval(() => { document.querySelectorAll('[data-elapsed]').forEach((el) => { el.textContent = elapsed(+el.dataset.elapsed); }); checkNotifications(); }, 30000);
{ const fc = LS.get('hosen:fac'); if (fc) setFacilitators(fc); }
const hasToken = await api.init().catch(() => false);
if (G.session && !hasToken) { G.session = null; saveG(); }   // token storage was cleared → sign in again
if (/[?&]guest=1/.test(location.search) && !G.session && !G.demo) { G.demo = true; saveG(); S = null; history.replaceState(null, '', location.pathname + '#/home'); setTimeout(() => toast('ברוכים הבאים! מצב אורח – נתוני דוגמה בלבד', 3500), 600); }
render();
api.emit();
setTimeout(checkNotifications, 1500);
if (live()) { refreshServerInfo().then(() => softRender()); pullAll(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && live() && (!SYNC.lastPull || Date.now() - SYNC.lastPull > 120000)) pullAll(); });
registerSW((apply) => { const b = $('#upd'); if (b) { b.hidden = false; b.onclick = () => { b.textContent = 'מעדכן…'; apply(); }; } }).catch(() => {});
window.__hosen = { parseIntake: (t) => parseIntake(t, ME() || DEMO_USER), analyze, version: APP_VERSION };
})();
