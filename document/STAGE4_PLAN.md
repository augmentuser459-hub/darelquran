# 🚀 المرحلة 4: Django Backend - خطة العمل التفصيلية

## 📋 نظرة عامة

**الهدف:** إضافة المميزات المتقدمة للـ Backend (Custom Actions, Permissions, Signals, Commands)

**الحالة الحالية:**
- ✅ 18 Models متطابقة مع قاعدة البيانات
- ✅ 18 Serializers تعمل بنجاح 100%
- ✅ 18 ViewSets أساسية تعمل بنجاح 100%
- ✅ 18 API Endpoints تعمل بنجاح 100%

**المهام الرئيسية:**
1. إضافة Custom Actions للـ ViewSets
2. إضافة Permissions و Authentication
3. إضافة Signals للعمليات التلقائية
4. إضافة Management Commands
5. إضافة Filters متقدمة
6. إضافة Validation
7. توثيق API (Swagger)

---

## 📝 المهام التفصيلية

### 4.1 Custom Actions للـ ViewSets ✅

#### StudentViewSet - إجراءات مخصصة:
- [x] `@action` - student_report: تقرير شامل للطالب
- [x] `@action` - students_by_country: الطلبة حسب الدولة
- [x] `@action` - top_students: الطلبة الأكثر التزاماً
- [x] `@action` - students_need_followup: الطلبة يحتاجون متابعة

#### TeacherViewSet - إجراءات مخصصة:
- [x] `@action` - teacher_report: تقرير شامل للمحفظ
- [x] `@action` - teacher_schedule: جدول المحفظ
- [x] `@action` - teacher_students: طلبة المحفظ

#### SessionViewSet - إجراءات مخصصة:
- [x] `@action` - upcoming_sessions: الحصص القادمة
- [x] `@action` - today_sessions: حصص اليوم
- [x] `@action` - sessions_need_makeup: حصص تحتاج تعويض
- [x] `@action` - mark_attendance: تسجيل الحضور
- [x] `@action` - generate_weekly_sessions: إنشاء حصص أسبوعية

#### InvoiceViewSet - إجراءات مخصصة:
- [x] `@action` - generate_monthly_invoices: إنشاء فواتير شهرية
- [x] `@action` - overdue_invoices: الفواتير المتأخرة
- [x] `@action` - invoice_summary: ملخص الفواتير

#### PaymentViewSet - إجراءات مخصصة:
- [x] `@action` - payment_summary: ملخص المدفوعات
- [x] `@action` - recent_payments: المدفوعات الأخيرة

#### DashboardViewSet - إجراءات جديدة:
- [x] `@action` - dashboard_stats: إحصائيات لوحة التحكم
- [x] `@action` - financial_summary: الملخص المالي
- [x] `@action` - attendance_statistics: إحصائيات الحضور

**الملف:** `core/views.py` ✅

**الاختبار:**
```bash
python test_custom_actions.py
# ✅ النتائج:
#    ✅ نجح: 13/13
#    ❌ فشل: 0/13
#    📈 النسبة: 100.0%
# 🎉 جميع Custom Actions تعمل بنجاح!
```

**✅ تم الانتهاء:** جميع Custom Actions تعمل بنجاح 100%

---

### 4.2 Permissions و Authentication ⬜

#### إعداد JWT Authentication:
- [ ] تثبيت djangorestframework-simplejwt
- [ ] إعداد settings.py
- [ ] إنشاء URLs للـ Token
- [ ] اختبار: الحصول على Token

#### Custom Permissions:
- [ ] IsAdmin - صلاحيات المدير
- [ ] IsTeacher - صلاحيات المحفظ
- [ ] IsStudent - صلاحيات الطالب
- [ ] IsOwnerOrAdmin - المالك أو المدير

#### تطبيق Permissions:
- [ ] StudentViewSet - IsAdmin أو IsOwner
- [ ] TeacherViewSet - IsAdmin
- [ ] SessionViewSet - IsAdmin أو IsTeacher
- [ ] InvoiceViewSet - IsAdmin
- [ ] PaymentViewSet - IsAdmin

**الملف:** `core/permissions.py`

**الاختبار:**
```bash
# الحصول على Token
curl -X POST http://localhost:8000/api/token/ \
  -d "username=admin&password=admin123456"

# استخدام Token
curl http://localhost:8000/api/students/ \
  -H "Authorization: Bearer <token>"
```

---

### 4.3 Signals - العمليات التلقائية ⬜

#### Session Signals:
- [ ] Signal: خصم الاعتذارات عند الاعتذار
- [ ] Signal: إصدار تحذير عند نفاذ الاعتذارات
- [ ] Signal: تحديث نسبة الحضور للطالب

#### Invoice Signals:
- [ ] Signal: تحديث عدد الحصص في الفاتورة
- [ ] Signal: تحديث حالة الفاتورة عند الدفع

#### Payment Signals:
- [ ] Signal: تحديث حالة الفاتورة عند الدفع
- [ ] Signal: إنشاء إشعار عند الدفع

#### Notification Signals:
- [ ] Signal: إرسال إشعار عند إنشاء فاتورة
- [ ] Signal: إرسال إشعار عند اقتراب موعد الحصة
- [ ] Signal: إرسال إشعار عند تأخر الدفع

**الملف:** `core/signals.py`

**الاختبار:**
```python
# اختبار Signal
from core.models import Session, Student

# إنشاء حصة اعتذار
session = Session.objects.create(
    student=student,
    status='excused',
    ...
)

# التحقق من خصم الاعتذار
student.refresh_from_db()
print(student.remaining_excuses)  # يجب أن ينقص
```

---

### 4.4 Management Commands ⬜

#### Commands للحصص:
- [ ] `generate_weekly_sessions` - إنشاء حصص أسبوعية
- [ ] `reset_monthly_excuses` - إعادة تعيين الاعتذارات الشهرية
- [ ] `cleanup_old_sessions` - حذف الحصص القديمة

#### Commands للفواتير:
- [ ] `generate_monthly_invoices` - إنشاء فواتير شهرية
- [ ] `check_overdue_invoices` - فحص الفواتير المتأخرة
- [ ] `send_invoice_reminders` - إرسال تذكيرات الفواتير

#### Commands للبيانات:
- [ ] `seed_initial_data` - إضافة بيانات أولية
- [ ] `cleanup_old_data` - حذف البيانات القديمة
- [ ] `backup_database` - نسخ احتياطي

**الملف:** `core/management/commands/`

**الاختبار:**
```bash
python manage.py generate_weekly_sessions
python manage.py reset_monthly_excuses
python manage.py generate_monthly_invoices
```

---

### 4.5 Filters متقدمة ⬜

#### StudentFilter:
- [ ] فلترة حسب الحالة (active, inactive, suspended)
- [ ] فلترة حسب الدولة
- [ ] فلترة حسب نظام التسعير
- [ ] فلترة حسب المستوى
- [ ] فلترة حسب نسبة الحضور

#### SessionFilter:
- [ ] فلترة حسب التاريخ (من - إلى)
- [ ] فلترة حسب المحفظ
- [ ] فلترة حسب الطالب
- [ ] فلترة حسب الحالة
- [ ] فلترة حسب نوع الحصة (makeup, regular)

#### InvoiceFilter:
- [ ] فلترة حسب الشهر والسنة
- [ ] فلترة حسب الحالة (paid, pending, overdue)
- [ ] فلترة حسب الطالب
- [ ] فلترة حسب المبلغ (من - إلى)

**الملف:** `core/filters.py`

**الاختبار:**
```bash
curl "http://localhost:8000/api/students/?status=active&country=1"
curl "http://localhost:8000/api/sessions/?date_from=2024-01-01&date_to=2024-01-31"
curl "http://localhost:8000/api/invoices/?status=overdue&month=1&year=2024"
```

---

### 4.6 Validation ⬜

#### Custom Validators:
- [ ] validate_phone_number - التحقق من رقم الهاتف
- [ ] validate_email - التحقق من البريد الإلكتروني
- [ ] validate_session_time - التحقق من وقت الحصة
- [ ] validate_payment_amount - التحقق من مبلغ الدفع

#### Model Validation:
- [ ] Student.clean() - التحقق من البيانات
- [ ] Session.clean() - التحقق من عدم التعارض
- [ ] Invoice.clean() - التحقق من المبالغ
- [ ] Payment.clean() - التحقق من المبلغ

**الملف:** `core/validators.py`

**الاختبار:**
```python
# اختبار Validator
from core.validators import validate_phone_number

try:
    validate_phone_number("+966501234567")
    print("✅ رقم صحيح")
except ValidationError as e:
    print(f"❌ خطأ: {e}")
```

---

### 4.7 Error Handling ⬜

#### Custom Exception Handler:
- [ ] إنشاء custom_exception_handler
- [ ] رسائل خطأ بالعربية
- [ ] تسجيل الأخطاء في Log
- [ ] إرجاع رسائل واضحة

#### Error Messages:
- [ ] ترجمة رسائل Django للعربية
- [ ] رسائل خطأ مخصصة للـ API
- [ ] رسائل نجاح مخصصة

**الملف:** `core/exceptions.py`

**الاختبار:**
```bash
# محاولة إنشاء طالب بدون بيانات
curl -X POST http://localhost:8000/api/students/ \
  -H "Content-Type: application/json" \
  -d '{}'

# يجب أن يرجع رسالة خطأ واضحة بالعربية
```

---

### 4.8 API Documentation (Swagger) ⬜

#### إعداد drf-yasg:
- [ ] تثبيت drf-yasg
- [ ] إعداد settings.py
- [ ] إنشاء URLs للـ Swagger
- [ ] إضافة Descriptions للـ ViewSets
- [ ] إضافة Examples للـ Serializers

**الملف:** `quran_house/urls.py`

**الاختبار:**
```bash
# فتح Swagger UI
http://localhost:8000/swagger/

# فتح ReDoc
http://localhost:8000/redoc/
```

---

### 4.9 Testing - Backend ⬜

#### Unit Tests:
- [ ] Tests للـ Models
- [ ] Tests للـ Serializers
- [ ] Tests للـ Validators
- [ ] Tests للـ Signals

#### Integration Tests:
- [ ] Tests للـ ViewSets
- [ ] Tests للـ Custom Actions
- [ ] Tests للـ Permissions
- [ ] Tests للـ Filters

#### Test Coverage:
- [ ] تثبيت coverage
- [ ] تشغيل Tests
- [ ] قياس Coverage
- [ ] الهدف: > 80%

**الملف:** `core/tests/`

**الاختبار:**
```bash
# تشغيل جميع Tests
python manage.py test

# قياس Coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

---

### 4.10 Performance Optimization ⬜

#### Database Optimization:
- [ ] استخدام select_related للـ Foreign Keys
- [ ] استخدام prefetch_related للـ Many-to-Many
- [ ] إضافة Indexes للحقول المهمة
- [ ] تحسين Queries

#### Caching:
- [ ] إعداد Redis Cache
- [ ] Cache للـ Countries
- [ ] Cache للـ PricingPlans
- [ ] Cache للـ SystemSettings

#### Pagination:
- [ ] تحسين Pagination
- [ ] إضافة Cursor Pagination للقوائم الكبيرة

**الاختبار:**
```bash
# قياس الأداء
python manage.py shell
from django.test.utils import override_settings
from django.db import connection
from django.db import reset_queries

# تشغيل Query
reset_queries()
students = Student.objects.all().select_related('country', 'pricing_plan')
print(len(connection.queries))  # عدد Queries
```

---

## 📊 الإحصائيات

### المهام:
- **إجمالي المهام:** 70+ مهمة
- **مكتمل:** 18 مهمة (Custom Actions)
- **قيد العمل:** 0 مهمة
- **متبقي:** 52+ مهمة

### الوقت المتوقع:
- **Custom Actions:** ✅ 2 ساعة (مكتمل)
- **Permissions:** 2 ساعة
- **Signals:** 3 ساعة
- **Commands:** 3 ساعة
- **Filters:** 2 ساعة
- **Validation:** 2 ساعة
- **Error Handling:** 1 ساعة
- **Documentation:** 2 ساعة
- **Testing:** 4 ساعة
- **Optimization:** 2 ساعة

**الإجمالي:** ~23 ساعة (3-4 أيام عمل)

---

## ✅ معايير النجاح

### Custom Actions:
- ✅ جميع Custom Actions تعمل
- ✅ البيانات تُعرض بشكل صحيح
- ✅ رسائل الأخطاء واضحة

### Permissions:
- [ ] المصادقة تعمل بنجاح
- [ ] الصلاحيات تُطبق بشكل صحيح
- [ ] رسائل الأخطاء واضحة

### Signals:
- [ ] جميع Signals تعمل تلقائياً
- [ ] البيانات تُحدث بشكل صحيح
- [ ] لا توجد أخطاء

### Commands:
- [ ] جميع Commands تعمل
- [ ] البيانات تُنشأ بشكل صحيح
- [ ] رسائل النجاح واضحة

### Testing:
- [ ] جميع Tests تنجح
- [ ] Coverage > 80%
- [ ] لا توجد أخطاء

---

## 🎯 الأولويات

### أولوية عالية (يجب إنجازها):
1. ✅ Custom Actions للـ ViewSets
2. Permissions و Authentication
3. Signals للعمليات التلقائية
4. Management Commands

### أولوية متوسطة (مهمة):
5. Filters متقدمة
6. Validation
7. Error Handling
8. API Documentation

### أولوية منخفضة (اختيارية):
9. Testing
10. Performance Optimization

---

## 📝 ملاحظات

- ✅ = تم الانتهاء واختباره
- ⬜ = لم يبدأ بعد
- 🔄 = قيد العمل
- ❌ = فشل الاختبار

**طريقة العمل:**
1. نبدأ بمهمة واحدة
2. ننفذها
3. نختبرها
4. نضع ✅ بجانبها
5. ننتقل للمهمة التالية

---

**جاهز للبدء! 🚀**

**المهمة الأولى:** ✅ Custom Actions للـ ViewSets (مكتملة)

**المهمة القادمة:** Permissions و Authentication

