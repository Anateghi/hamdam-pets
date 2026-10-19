// Gestation maths. Sources: Merck Veterinary Manual (dog 58–72 d from breeding, 62–64 d from ovulation, 64–66 d from LH surge; cat ~65 d, LH surge→parturition 64–66 d), Vet Clin Small Anim 2012.
import { addDays } from './jalali.js';
export const REF = {
  dog: {
    mating: { label: 'اولین جفت‌گیری', due: 63, lo: 58, hi: 72, typ: [58, 68] },
    lh: { label: 'اوج هورمون LH (آزمایش خون)', due: 65, lo: 64, hi: 66, typ: [64, 66] },
    ovulation: { label: 'تخمک‌گذاری (آزمایش پروژسترون)', due: 63, lo: 62, hi: 64, typ: [62, 64] },
  },
  cat: { mating: { label: 'جفت‌گیری', due: 65, lo: 61, hi: 72, typ: [63, 67] } },
};
// milestones: days from the reference date (shifted for LH/ovulation so they stay in "pregnancy days").
export const MILESTONES = {
  dog: [
    [21, 'جنین‌ها در رحم لانه‌گزینی کرده‌اند؛ هنوز نشانهٔ ظاهری نیست', 'info'],
    [25, 'از حدود روز ۲۵: سونوگرافی و دیدن ضربان قلب جنین‌ها؛ آزمایش خون ریلکسین هم ممکن است', 'vet'],
    [28, 'روز ۲۸ تا ۳۵: لمس شکم توسط دامپزشک (فقط دامپزشک؛ فشار دادن شکم خطرناک است)', 'vet'],
    [35, 'از هفتهٔ ۵ تا ۶: شکم و نوک پستان‌ها بزرگ‌تر می‌شوند؛ به‌تدریج غذای مخصوص رشد/توله را جایگزین کنید', 'care'],
    [45, 'از روز ۴۵: اسکلت جنین‌ها در رادیوگرافی دیده می‌شود؛ برای شمارش دقیق‌تر حدود روز ۵۵', 'vet'],
    [55, 'جعبهٔ زایمان را در جای آرام و گرم آماده کنید و شمارهٔ دامپزشک اورژانسی را دم دست بگذارید', 'care'],
    [57, 'از این روز دمای مقعدی را روزی دو بار بسنجید؛ افت دما به زیر حدود ۳۷٫۸ درجه معمولاً یعنی زایمان طی ۸ تا ۲۴ ساعت', 'care'],
  ],
  cat: [
    [16, 'روز ۱۶ تا ۱۸: ضربان قلب جنین در سونوگرافی دیده می‌شود', 'vet'],
    [18, 'حدود هفتهٔ سوم: نوک پستان‌ها صورتی و برجسته می‌شوند (pinking)', 'info'],
    [21, 'روز ۲۱ تا ۲۵: لمس شکم توسط دامپزشک ممکن است', 'vet'],
    [35, 'از هفتهٔ ۵: اشتها بیشتر می‌شود؛ غذای بچه‌گربه (پرانرژی) را به‌تدریج جایگزین کنید', 'care'],
    [42, 'از حدود روز ۴۰ تا ۴۵: اسکلت جنین‌ها در رادیوگرافی دیده می‌شود و تعدادشان قابل شمارش است', 'vet'],
    [56, 'جعبه یا لانهٔ زایمان را در جای آرام آماده کنید؛ گربه ممکن است دنبال جای پنهان بگردد', 'care'],
  ],
};
export function calc(sp, ref, date) {
  const r = REF[sp][ref]; const shift = ref === 'lh' ? 2 : 0; // LH surge ≈ 2 days before ovulation/fertilisation
  return {
    due: addDays(date, r.due), lo: addDays(date, r.lo), hi: addDays(date, r.hi), typLo: addDays(date, r.typ[0]), typHi: addDays(date, r.typ[1]),
    milestones: MILESTONES[sp].map(([d, t, k]) => ({ date: addDays(date, d + shift), day: d, text: t, kind: k })),
    lateBy: addDays(date, r.hi), r,
  };
}
