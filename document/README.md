# 🕌 نظام إدارة دار القرآن - Quran House Management System

نظام شامل لإدارة دور تحفيظ القرآن الكريم، يشمل إدارة الطلبة والمحفظين والحصص والمالية والتقارير.

## 📊 الحالة الحالية

### ✅ المراحل المكتملة:
- ✅ **المرحلة 1: Database Setup** - مكتمل 100%
- ✅ **المرحلة 2: Serializers** - مكتمل 100%
- 🔄 **المرحلة 3: URLs & ViewSets** - المرحلة القادمة

### 📈 الإحصائيات:
- **Models**: 18 ✅
- **Serializers**: 18 ✅
- **Admin Panel**: جاهز ✅
- **Database**: متصل ✅
- **نسبة النجاح**: 100% ✅

---

## 🚀 التشغيل السريع

### المتطلبات:
- Python 3.13+
- PostgreSQL (Supabase)
- pip

### التثبيت:

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd dar-quran

# 2. إنشاء بيئة افتراضية
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. تثبيت المكتبات
pip install -r requirements.txt

# 4. إعداد متغيرات البيئة
# انسخ .env.example إلى .env وعدل القيم
cp .env.example .env

# 5. تشغيل السيرفر
run.bat  # Windows
# أو
set DB_HOST=aws-1-eu-west-1.pooler.supabase.com
python manage.py runserver
```

### الوصول للنظام:

- **Admin Panel**: http://localhost:8000/admin
  - Username: `admin`
  - Password: `admin123456`

- **API Root**: http://localhost:8000/api/ (قريباً)

---

## 📁 هيكل المشروع

```
dar-quran/
├── quran_house/          # إعدادات المشروع
│   ├── settings.py       # إعدادات Django
│   ├── urls.py          # URLs الرئيسية
│   └── wsgi.py
│
├── core/                 # التطبيق الرئيسي
│   ├── models.py        # 18 Models ✅
│   ├── serializers.py   # 18 Serializers ✅
│   ├── admin.py         # Admin Panel ✅
│   ├── views.py         # ViewSets (قريباً)
│   ├── urls.py          # URLs (قريباً)
│   └── migrations/      # 6 Migrations
│
├── tests/               # الاختبارات
│   ├── test_all_serializers.py
│   ├── test_serializers.py
│   └── quick_test.py
│
├── docs/                # التوثيق
│   ├── flow.md          # خطة العمل
│   ├── CURRENT_STATUS.md
│   ├── REVIEW_SUMMARY.md
│   └── db_structure.txt
│
├── .env                 # متغيرات البيئة
├── requirements.txt     # المكتبات
├── run.bat             # تشغيل السيرفر
└── README.md           # هذا الملف
```

---

## 🗄️ Models (18)

### الجداول الأساسية:
1. **Country** - الدول والعملات
2. **PricingPlan** - أنظمة التسعير
3. **Teacher** - المحفظين
4. **Student** - الطلبة

### الحصص والجدولة:
5. **ScheduledSession** - الجدول الأسبوعي
6. **Session** - الحصص الفعلية

### المالية:
7. **Invoice** - الفواتير
8. **Payment** - المدفوعات
9. **Expense** - المصروفات
10. **ExpenseCategory** - فئات المصروفات
11. **TeacherSalary** - رواتب المحفظين

### التحذيرات والإشعارات:
12. **Warning** - التحذيرات
13. **Notification** - الإشعارات
14. **Holiday** - العطلات

### التقدم والمستندات:
15. **StudentProgress** - تقدم الطالب
16. **StudentDocument** - مستندات الطلبة
17. **TeacherDocument** - مستندات المحفظين

### النظام:
18. **SystemSetting** - إعدادات النظام

---

## 🧪 الاختبار

### اختبار سريع:
```bash
python quick_test.py
```

### اختبار Serializers:
```bash
python test_all_serializers.py
```

### اختبار Django:
```bash
python manage.py check
python manage.py test
```

---

## 📚 التوثيق

### الملفات المهمة:
- **flow.md** - خطة العمل التفصيلية
- **CURRENT_STATUS.md** - الحالة الحالية
- **REVIEW_SUMMARY.md** - ملخص المراجعة
- **MODELS_SYNC_PLAN.md** - خطة مزامنة Models
- **db_structure.txt** - بنية قاعدة البيانات

---

## 🔧 التقنيات المستخدمة

### Backend:
- **Django 6.0.1** - إطار العمل الرئيسي
- **Django REST Framework 3.16.1** - API
- **PostgreSQL** - قاعدة البيانات
- **Supabase** - استضافة قاعدة البيانات

### المكتبات:
- **psycopg2-binary** - اتصال PostgreSQL
- **django-cors-headers** - CORS
- **python-decouple** - متغيرات البيئة
- **pillow** - معالجة الصور
- **django-filter** - فلترة البيانات
- **drf-yasg** - توثيق API
- **djangorestframework-simplejwt** - المصادقة

---

## 🎯 المرحلة القادمة

### المهام القادمة:
1. إنشاء ViewSets لجميع Models
2. إعداد URLs و Router
3. اختبار API Endpoints
4. إضافة Filters و Pagination
5. إضافة Permissions

### الوقت المتوقع: 2-3 ساعات

---

## 📝 ملاحظات

### معلومات الاتصال:
- **Database Host**: aws-1-eu-west-1.pooler.supabase.com
- **Database Port**: 5432
- **Database Name**: postgres

### Models غير الموجودة:
تم حذف Models التالية لأنها غير موجودة في قاعدة البيانات:
- AttendanceLog
- TeacherAvailability
- CommunicationLog
- AuditLog

### التغييرات الرئيسية:
1. **ScheduledSession**: `session_time` بدلاً من `start_time/end_time`
2. **Session**: إضافة 50+ حقل جديد
3. **Invoice**: `amount_paid/amount_due` بدلاً من `paid_amount/remaining_amount`
4. **Payment**: `currency_code/currency_symbol` بدلاً من `currency`
5. **TeacherSalary**: `bonus_amount/deduction_amount` بدلاً من `bonuses/deductions`

---

## 🤝 المساهمة

هذا المشروع قيد التطوير. للمساهمة:
1. Fork المشروع
2. إنشاء branch جديد
3. Commit التغييرات
4. Push للـ branch
5. إنشاء Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 📞 التواصل

للأسئلة والاستفسارات، يرجى فتح Issue في GitHub.

---

**آخر تحديث:** 7 يناير 2026

**الحالة:** 🟢 جاهز للمرحلة 3

**نسبة الإنجاز:** 40% (2/5 مراحل)
