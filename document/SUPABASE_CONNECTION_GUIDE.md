# 🔧 دليل الحصول على معلومات الاتصال بـ Supabase

## ⚠️ المشكلة الحالية
لا يمكن الاتصال بقاعدة البيانات. الخطأ: `could not translate host name`

هذا يعني أن معلومات الاتصال غير صحيحة أو أن المشروع غير نشط.

---

## 📋 الخطوات للحصول على معلومات الاتصال الصحيحة

### 1. افتح مشروع Supabase
اذهب إلى: https://supabase.com/dashboard

### 2. اختر المشروع
اضغط على مشروعك (dar-quran أو أي اسم آخر)

### 3. اذهب إلى Database Settings
- اضغط على **Settings** (الإعدادات) في القائمة الجانبية
- اضغط على **Database**

### 4. انسخ معلومات الاتصال

ستجد قسم **Connection Info** أو **Connection String**

#### للاتصال المباشر (Direct Connection):
```
Host: db.xxxxxxxxxxxxx.supabase.co
Database name: postgres
Port: 5432
User: postgres.xxxxxxxxxxxxx
Password: [your-password]
```

---

## 🔑 معلومات مهمة

### اسم المستخدم (Username)
يجب أن يكون بالصيغة: `postgres.xxxxxxxxxxxxx`

حيث `xxxxxxxxxxxxx` هو معرف المشروع (Project Reference ID)

### كلمة السر (Password)
- إذا نسيت كلمة السر، يمكنك إعادة تعيينها من نفس الصفحة
- اضغط على **Reset Database Password**

### Host
يجب أن يكون بالصيغة: `db.xxxxxxxxxxxxx.supabase.co`

---

## 📝 تحديث ملف .env

بعد الحصول على المعلومات الصحيحة، حدث ملف `.env`:

```env
# Database Configuration (Supabase)
DB_NAME=postgres
DB_USER=postgres.xxxxxxxxxxxxx
DB_PASSWORD=your_actual_password_here
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
```

---

## ✅ اختبار الاتصال

بعد تحديث `.env`، نفذ:

```bash
# 1. اختبار Django
python manage.py check

# 2. تنفيذ Migrations
python manage.py migrate

# 3. إنشاء Superuser
python manage.py createsuperuser

# 4. تشغيل السيرفر
python manage.py runserver
```

---

## 🔍 التحقق من المشروع

### تأكد أن المشروع نشط:
1. اذهب إلى Dashboard
2. تأكد أن المشروع يظهر حالة **Active** (نشط)
3. إذا كان **Paused** (متوقف)، اضغط على **Resume** (استئناف)

### تأكد من Region:
- المشروع يجب أن يكون في منطقة قريبة منك
- إذا كان في منطقة بعيدة، قد يكون هناك تأخير

---

## 🆘 إذا استمرت المشكلة

### الخيار 1: إنشاء مشروع جديد
إذا كان المشروع القديم لا يعمل، يمكنك:
1. إنشاء مشروع Supabase جديد
2. تنفيذ ملف `complete-database-schema.sql` مرة أخرى
3. تحديث معلومات الاتصال في `.env`

### الخيار 2: استخدام Pooler Connection
بدلاً من Direct Connection، يمكنك استخدام Pooler:

```env
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.xxxxxxxxxxxxx
```

لكن **Direct Connection أفضل** لـ Django Migrations.

---

## 📞 معلومات الاتصال الحالية

حسب السجلات السابقة:
- Project URL: https://xydqfdqvbjmjrebysfzz.supabase.co
- Project ID: xydqfdqvbjmjrebysfzz
- API Key: sb_publishable_jvDBWvi8l-Ec6x3woqkR0g_JR4r7nQ2

**لكن معلومات Database Connection يجب التحقق منها من Dashboard!**

---

## ✨ بعد حل المشكلة

سنكمل:
1. ✅ تنفيذ Migrations
2. ✅ إنشاء Superuser
3. ✅ اختبار Admin Panel
4. ⬜ إكمال باقي Models (18 model)
5. ⬜ إنشاء Serializers
6. ⬜ إنشاء URLs
7. ⬜ إنشاء Views

---

**آخر تحديث:** 2025-01-07
