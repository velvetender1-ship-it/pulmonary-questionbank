# بانک سوالات داخلی ریه (نسخه‌ی سایت)

سایت استاتیک (HTML/CSS/JS ساده، بدون build و بدون سرور).

## اجرا روی کامپیوتر
فایل `index.html` را مستقیم در مرورگر باز کن؛ کار می‌کند (حتی آفلاین).

## بردن روی Vercel

### روش ۱: با CLI (سریع‌ترین)
1. Node.js را نصب کن (nodejs.org).
2. در ترمینال: `npm i -g vercel`
3. وارد همین پوشه شو: `cd pulmonary-site`
4. دستور `vercel` را بزن و وارد حسابت شو. به سوال‌ها این‌طور جواب بده:
   - Set up and deploy? **Y**
   - Link to existing project? **N**
   - Want to modify settings? **N** (فریم‌ورک را خودش «Other» می‌گیرد؛ build command و output directory خالی بماند)
5. برای نسخه‌ی نهایی: `vercel --prod`

### روش ۲: از طریق GitHub (برای آپدیت‌های بعدی بهتر است)
1. یک repository بساز و محتوای همین پوشه را داخلش push کن.
2. در vercel.com برو به Add New → Project → repo را Import کن.
3. Framework Preset: **Other**. Build Command و Output Directory را خالی بگذار → Deploy.
4. از این به بعد با هر push، سایت خودکار آپدیت می‌شود.

## ساختار
- `index.html` صفحه‌ی اصلی
- `css/style.css` ظاهر (تم ممفیس، حالت تیره)
- `js/app.js` منطق سایت (مسیریابی، آزمون، نشان‌ها، جست‌وجو)
- `data/questions.js` همه‌ی سوال‌ها، پاسخ‌ها و درس‌نامه‌ها
- `fonts/` + `fonts.css` فونت Noto Sans Arabic و بقیه
- `sw.js` + `manifest.webmanifest` برای نصب روی موبایل و کار آفلاین
- `vercel.json` تنظیم کش

## نکته‌ها
- بعد از هر تغییر در فایل‌ها، عدد `V` اول فایل `sw.js` را یکی بالا ببر (مثلاً `lungqb-v2`) تا مرورگرها نسخه‌ی جدید را بگیرند.
- پیشرفت و نشان‌ها فقط روی مرورگر هر نفر ذخیره می‌شود. از «تنظیمات» می‌شود فایل پشتیبان گرفت و روی دستگاه دیگر وارد کرد.
