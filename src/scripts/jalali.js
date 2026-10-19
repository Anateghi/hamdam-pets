// Jalali (Solar Hijri) <-> Gregorian conversion (algorithm of jalaali-js, MIT) + small helpers.
const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
const div = (a, b) => ~~(a / b), mod = (a, b) => a - ~~(a / b) * b;
function jalCal(jy) {
  let bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump, leap, n, i;
  for (i = 1; i < bl; i += 1) { jm = breaks[i]; jump = jm - jp; if (jy < jm) break; leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm; }
  n = jy - jp; leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150, march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  leap = mod(mod(n + 1, 33) - 1, 4); if (leap === -1) leap = 4;
  return { leap, gy, march };
}
function g2d(gy, gm, gd) { let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408; return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752; }
function d2g(jdn) { let j = 4 * jdn + 139361631; j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908; const i = div(mod(j, 1461), 4) * 5 + 308; const gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6); return { gy, gm, gd }; }
function j2d(jy, jm, jd) { const r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; }
function d2j(jdn) { const gy = d2g(jdn).gy; let jy = gy - 621, r = jalCal(jy), jdn1f = g2d(gy, 3, r.march), jd, jm, k = jdn - jdn1f;
  if (k >= 0) { if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy, jm, jd }; } k -= 186; } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
  jm = 7 + div(k, 30); jd = mod(k, 30) + 1; return { jy, jm, jd }; }
export const isLeapJ = (jy) => jalCal(jy).leap === 0;
export const monthLen = (jy, jm) => (jm <= 6 ? 31 : jm <= 11 ? 30 : isLeapJ(jy) ? 30 : 29);
export function toGregorian(jy, jm, jd) { const g = d2g(j2d(jy, jm, jd)); return new Date(g.gy, g.gm - 1, g.gd, 12); }
export function toJalali(date) { return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate())); }
export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
export const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
export const fa = (v) => String(v).replace(/(\d)\.(\d)/g, '$1٫$2').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
export const toEn = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,]/g, '.');
export const num = (s) => parseFloat(toEn(s));
export function fmtJ(date, withDay = false) { const j = toJalali(date); return (withDay ? WEEKDAYS[date.getDay()] + ' ' : '') + fa(j.jd) + ' ' + MONTHS[j.jm - 1] + ' ' + fa(j.jy); }
export const addDays = (date, n) => { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, 12); return d; };
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12); };
export const daysBetween = (a, b) => Math.round((b - a) / 864e5);
/** Wire up a Jalali date picker: a container with [data-jy] [data-jm] [data-jd] fields. Returns {get(), set(date), onChange(fn)} */
export function jalaliPicker(root, initial) {
  const y = root.querySelector('[data-jy]'), m = root.querySelector('[data-jm]'), d = root.querySelector('[data-jd]');
  m.innerHTML = MONTHS.map((n, i) => `<option value="${i + 1}">${n}</option>`).join('');
  const fillDays = () => { const jy = parseInt(toEn(y.value)) || 1405, jm = +m.value || 1, cur = +d.value || 1, len = monthLen(jy, jm);
    d.innerHTML = Array.from({ length: len }, (_, i) => `<option value="${i + 1}">${fa(i + 1)}</option>`).join(''); d.value = String(Math.min(cur, len)); };
  const api = {
    get() { const jy = parseInt(toEn(y.value)), jm = +m.value, jd = +d.value; if (!(jy > 1300 && jy < 1500) || !jm || !jd) return null; return toGregorian(jy, jm, jd); },
    set(date) { const j = toJalali(date); y.value = String(j.jy); m.value = String(j.jm); d.value = String(j.jd); fillDays(); d.value = String(j.jd); },
    onChange(fn) { [y, m, d].forEach((el) => { el.addEventListener('input', () => { if (el !== d) fillDays(); fn(); }); el.addEventListener('change', () => { if (el !== d) fillDays(); fn(); }); }); },
  };
  fillDays(); if (initial) api.set(initial); return api;
}
