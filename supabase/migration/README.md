# Dar Quran - Supabase Migration Guide

## دليل نقل قاعدة البيانات إلى Supabase جديد

### الطريقة الأولى: ملف واحد (الأسهل)
1. أنشئ مشروع Supabase جديد
2. افتح **SQL Editor** في لوحة تحكم Supabase
3. انسخ محتوى الملف `00-FULL-MIGRATION.sql` والصقه
4. اضغط **Run**
5. تأكد من ظهور رسالة النجاح

### الطريقة الثانية: ملفات متعددة (بالترتيب)
شغّل الملفات بهذا الترتيب في SQL Editor:

| # | الملف | الوصف |
|---|-------|-------|
| 1 | `01-extensions.sql` | تفعيل uuid-ossp و pgcrypto |
| 2 | `02-sequences.sql` | إنشاء التسلسلات للأرقام التلقائية |
| 3 | `03-tables.sql` | إنشاء 25 جدول بالترتيب الصحيح |
| 4 | `04-indexes.sql` | إنشاء الفهارس لتحسين الأداء |
| 5 | `05-functions.sql` | إنشاء الدوال المساعدة |
| 6 | `06-triggers.sql` | إنشاء المشغلات التلقائية |
| 7 | `07-views.sql` | إنشاء طرق العرض |
| 8 | `08-report-functions.sql` | دوال التقارير والإحصائيات |
| 9 | `09-rls-policies.sql` | سياسات أمان الصفوف |
| 10 | `10-seed-data.sql` | البيانات الأولية (الدول + الإعدادات) |

### بعد التثبيت
1. انسخ **URL** و **anon key** من Settings > API في Supabase
2. حدّث الملفات التالية:
   - `frontend/js/supabase-config.js` - حدّث `url` و `anonKey`
   - `.env` - حدّث `SUPABASE_URL` و `SUPABASE_ANON_KEY` و `DB_HOST`

### ملاحظات
- جميع الجداول مرتبة حسب التبعيات (dependencies)
- يمكن تشغيل الملفات على أي Supabase جديد فارغ
- RLS مفعّل مع صلاحيات anonymous كاملة (للتطوير)
- 25 جدول + 40+ فهرس + 15 دالة + 9 تقارير + 6 عروض
