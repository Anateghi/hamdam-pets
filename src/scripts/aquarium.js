// Aquarium volume & stocking rules of thumb. Volumes in litres, sizes in cm.
export const SHAPES = {
  rect: { label: 'مکعب مستطیل (معمولی)', dims: ['طول', 'عرض', 'ارتفاع'] },
  cyl: { label: 'استوانه‌ای', dims: ['قطر', null, 'ارتفاع'] },
  hex: { label: 'شش‌ضلعی منتظم', dims: ['طول هر ضلع', null, 'ارتفاع'] },
  corner: { label: 'گوشه‌ای (ربع دایره)', dims: ['شعاع (طول ضلع صاف)', null, 'ارتفاع'] },
};
export function area(shape, a, b) { // water-surface area, cm²
  if (shape === 'rect') return a * b;
  if (shape === 'cyl') return Math.PI * (a / 2) ** 2;
  if (shape === 'hex') return (3 * Math.sqrt(3) / 2) * a * a;
  if (shape === 'corner') return (Math.PI * a * a) / 4;
  return 0;
}
export function volume({ shape, a, b, h, gap = 3, sub = 5, decor = 10 }) {
  const A = area(shape, a, b), gross = (A * h) / 1000, waterH = Math.max(h - gap - sub, 0), water = (A * waterH) / 1000, net = water * (1 - decor / 100);
  const subKg = (A * sub) / 1000 * 1.6; // gravel/sand ≈ 1.6 kg per litre
  return { A, gross, water, net, waterH, weight: water + subKg, subKg, gal: gross / 3.785 };
}
// [id, name, adult cm, bioload factor, min litres, min group, type, note]
export const FISH = [
  ['guppy', 'گوپی', 5, 1, 40, 3, 'trop', 'برای هر نر دست‌کم ۲ ماده نگه دارید'],
  ['platy', 'پلاتی', 6, 1, 60, 3, 'trop', ''],
  ['molly', 'مولی', 10, 1.2, 80, 3, 'trop', ''],
  ['sword', 'دم‌شمشیری', 12, 1, 100, 3, 'trop', 'نرها با هم رقابت می‌کنند'],
  ['neon', 'نئون تترا', 3.5, 1, 60, 6, 'trop', 'گله‌ای؛ در آب جاافتاده'],
  ['cardinal', 'کاردینال تترا', 4, 1, 60, 6, 'trop', 'گله‌ای'],
  ['rasbora', 'رازبورا هارلکوئین', 5, 1, 60, 6, 'trop', 'گله‌ای'],
  ['danio', 'دانیو گورخری', 5, 1, 60, 6, 'trop', 'بسیار فعال؛ آکواریوم طولی'],
  ['tiger', 'تایگر بارب', 7, 1, 80, 6, 'trop', 'باله‌گاز؛ با بتا و آنجل نگه ندارید'],
  ['cherry', 'چری بارب', 5, 1, 60, 6, 'trop', ''],
  ['cory', 'کوریدوراس', 6, 1, 60, 6, 'trop', 'کف‌زی گله‌ای؛ بستر شنی نرم'],
  ['oto', 'اتوسینکلوس', 4, 1, 60, 6, 'trop', 'فقط در آکواریوم جاافتاده با جلبک'],
  ['betta', 'بتا (فایتر)', 7, 1, 20, 1, 'trop', 'فقط یک نر در هر آکواریوم'],
  ['gourami', 'گورامی کوتوله', 9, 1, 60, 1, 'trop', 'نرها با هم دعوا می‌کنند'],
  ['kribensis', 'کریبنسیس', 10, 1.2, 80, 2, 'trop', 'جفتی؛ هنگام تخم‌ریزی قلمروطلب'],
  ['angel', 'آنجل (اسکالر)', 15, 1.5, 120, 1, 'trop', 'ارتفاع آب دست‌کم ۴۵ سانتی‌متر؛ ماهی‌های ریز مثل نئون را می‌خورد'],
  ['pleco', 'پلکو بریستل‌نوز', 13, 1.5, 100, 1, 'trop', 'به چوب برای جویدن نیاز دارد'],
  ['kuhli', 'کوهلی لوچ', 10, 0.8, 80, 5, 'trop', 'گله‌ای و شب‌فعال'],
  ['discus', 'دیسکس', 15, 2, 250, 5, 'trop', 'دمای ۲۸ تا ۳۰ درجه و آب بسیار تمیز'],
  ['oscar', 'اسکار', 30, 3, 300, 1, 'trop', 'ماهی‌های کوچک را می‌خورد؛ فیلتر بسیار قوی'],
  ['goldfish', 'گلدفیش فانتزی', 15, 2, 75, 1, 'cold', '۷۵ لیتر برای اولی و ۴۰ لیتر برای هر گلدفیش بعدی'],
  ['comet', 'گلدفیش معمولی / کامت (ماهی قرمز)', 25, 2.5, 300, 1, 'cold', 'در بزرگسالی به ۲۵ تا ۳۰ سانت می‌رسد؛ برای حوض مناسب‌تر است'],
  ['whitecloud', 'ابر سفید (وایت کلود)', 4, 1, 40, 6, 'temp', 'آب خنک ۱۸ تا ۲۲ درجه'],
  ['shrimp', 'میگوی رد چری', 2.5, 0.2, 20, 6, 'trop', 'ماهی‌های بزرگ‌تر آن را می‌خورند'],
];
export function stocking(stock, vol, isCold) {
  // capacity in cm of adult fish: the more generous of the classic 'volume' (1 cm per litre of water; 0.5 for coldwater) and 'surface area' (1 cm per 30 cm²; 75 cm² for coldwater) rules
  const capVol = vol.water * (isCold ? 0.5 : 1), capArea = vol.A / (isCold ? 75 : 30), cap = Math.max(capVol, capArea);
  let load = 0; const warn = []; let gold = 0, trop = 0, cold = 0;
  for (const [id, n] of Object.entries(stock)) {
    if (!n) continue; const f = FISH.find((x) => x[0] === id); if (!f) continue;
    load += f[2] * f[3] * n;
    const minL = id === 'goldfish' ? 75 + 40 * (n - 1) : id === 'comet' ? 300 + 100 * (n - 1) : f[4];
    if (vol.gross < minL) warn.push(`${f[1]}: آکواریوم دست‌کم حدود ${minL} لیتری لازم است.`);
    if (f[5] > 1 && n < f[5]) warn.push(`${f[1]}: گله‌ای است؛ دست‌کم ${f[5]} عدد نگه دارید.`);
    if (f[6] === 'trop') trop++; if (f[6] === 'cold') { cold++; gold += n; }
  }
  if ((stock.betta || 0) > 1) warn.push('بیش از یک بتا در یک آکواریوم دعوا می‌کنند (مگر در گروه ماده‌ها با تجربهٔ کافی).');
  if (stock.betta && (stock.tiger || stock.gourami)) warn.push('بتا با تایگر بارب یا گورامی سازگار نیست.');
  if (stock.angel && (stock.neon || stock.cardinal || stock.shrimp)) warn.push('آنجل بزرگ‌شده ماهی‌های ریز و میگو را می‌خورد.');
  if (stock.oscar && Object.keys(stock).some((k) => k !== 'oscar' && k !== 'pleco' && stock[k])) warn.push('اسکار بیشتر ماهی‌های کوچک‌تر را می‌خورد؛ برای آن آکواریوم جداگانه در نظر بگیرید.');
  if (cold && trop) warn.push('گلدفیش ماهی آب سرد است و با ماهی‌های گرمسیری (۲۴ تا ۲۸ درجه) سازگار نیست.');
  if (stock.angel && vol.waterH < 40) warn.push('برای آنجل ارتفاع آب دست‌کم ۴۰ تا ۴۵ سانتی‌متر لازم است.');
  return { load, cap, pct: cap > 0 ? (load / cap) * 100 : 0, warn };
}
