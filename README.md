# همدم (Hamdam): سایت اطلاعات حیوانات خانگی
- `npm install && npm run build`: خروجی استاتیک در `dist/`
- `npm start`: سرو کردن `dist` با `server.mjs` (روی پورت `PORT`)
- Railway: از Dockerfile استفاده می‌کند. متغیر `SITE_URL` را برابر دامنهٔ نهایی بگذارید (canonical، sitemap و robots از آن ساخته می‌شوند).
- مقاله‌ها: `src/content/articles/*.md`، ابزارها: `src/pages/tools/`
