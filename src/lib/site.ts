export const SITE = {
  name: 'همدم',
  latin: 'Hamdam',
  tagline: 'دانشنامهٔ مهربان حیوانات خانگی',
  description: 'همدم؛ راهنمای فارسی، دقیق و مستقل برای نگهداری گربه، سگ، پرنده، ماهی و جوندگان خانگی، همراه با ابزارهای رایگان مثل محاسبه سن گربه و سگ به انسان.',
};
export const CATEGORIES: Record<string, { title: string; blurb: string; icon: string }> = {
  cats: { title: 'گربه', blurb: 'تغذیه، نژادها، سلامت و رفتار گربه‌ها؛ از بچه‌گربه تا گربهٔ سالمند.', icon: 'cat' },
  dogs: { title: 'سگ', blurb: 'واکسن، نژاد، آموزش و مراقبت روزانه از سگ‌ها در آپارتمان و حیاط.', icon: 'dog' },
  birds: { title: 'پرندگان', blurb: 'مرغ عشق، عروس هلندی، طوطی برزیلی و هرآنچه برای یک قفس شاد لازم است.', icon: 'bird' },
  fish: { title: 'ماهی و آکواریوم', blurb: 'راه‌اندازی آکواریوم آب شیرین، چرخهٔ نیتروژن و ماهی‌های مناسب مبتدی‌ها.', icon: 'fish' },
  'small-pets': { title: 'همستر و خرگوش', blurb: 'نگهداری همستر، خرگوش و دیگر حیوانات کوچک: قفس، تغذیه، سلامت و رفتار.', icon: 'rabbit' },
};
const faDigits = '۰۱۲۳۴۵۶۷۸۹';
export const fa = (v: string | number) => String(v).replace(/\d/g, (d) => faDigits[+d]);
export const jalali = (d: Date | string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d));
