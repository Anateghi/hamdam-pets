# همدم (Hamdam): سایت اطلاعات حیوانات خانگی
- `npm install && npm run build`: خروجی استاتیک در `dist/`
- `npm start`: سرو کردن `dist` با `server.mjs` (روی پورت `PORT`)
- Railway: از Dockerfile استفاده می‌کند. آدرس سایت در `site.config.mjs` تعریف شده (پیش‌فرض: آدرس Railway)؛ پس از خرید دامنه، متغیر `SITE_URL` را برابر دامنهٔ نهایی بگذارید (canonical، sitemap و robots از آن ساخته می‌شوند).
- مقاله‌ها: `src/content/articles/*.md`، ابزارها: `src/pages/tools/`
