# إصلاح مشكلة تسجيل الدفعات

## 🐛 المشكلة
عند تسجيل دفعة على فاتورة، كان يظهر خطأ 500 Internal Server Error رغم أن الدفعة تُسجل بنجاح.

### الخطأ:
```
API Error: 500 Internal Server Error
PATCH Error: Error: Internal Server Error
```

---

## 🔍 السبب
المشكلة كانت في `InvoiceCreateSerializer` في ملف `core/serializers.py`:

1. **الحقول الإلزامية**: عند استخدام PATCH، كان الـ serializer يتطلب جميع الحقول الإلزامية
2. **الـ validation**: كان يحاول إعادة حساب `amount_due` و `status` تلقائياً مما يتعارض مع القيم المُرسلة
3. **اسم الحالة**: كان الكود يستخدم `partial` بينما الـ serializer يتوقع `partially_paid`

---

## ✅ الحل

### 1. جعل جميع الحقول اختيارية في PATCH
```python
class InvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'invoice_number': {'required': False},
            'student': {'required': False},
            'month': {'required': False},
            'year': {'required': False},
            'billing_period_start': {'required': False},
            'billing_period_end': {'required': False},
            'base_amount': {'required': False},
            'subtotal': {'required': False},
            'total_amount': {'required': False},
            'amount_due': {'required': False},
            'currency_code': {'required': False},
            'currency_symbol': {'required': False},
            'expected_sessions': {'required': False},
            'issue_date': {'required': False},
            'due_date': {'required': False},
        }
```

### 2. إزالة الـ validation من PATCH
تم إزالة دالة `validate()` التي كانت تحاول إعادة حساب القيم تلقائياً.

### 3. تصحيح اسم الحالة في Frontend
```javascript
// قبل
newStatus = 'partial';

// بعد
newStatus = 'partially_paid';
```

### 4. تحديث getStatusBadge
```javascript
const statusMap = {
    'pending': '<span class="badge badge-warning">معلقة</span>',
    'paid': '<span class="badge badge-success">مدفوعة</span>',
    'partial': '<span class="badge badge-info">مدفوعة جزئياً</span>',
    'partially_paid': '<span class="badge badge-info">مدفوعة جزئياً</span>',
    'overdue': '<span class="badge badge-danger">متأخرة</span>',
    'cancelled': '<span class="badge badge-danger">ملغية</span>'
};
```

---

## 📝 الملفات المُعدلة

### 1. `core/serializers.py`
- إضافة `extra_kwargs` لجعل الحقول اختيارية
- إزالة دالة `validate()` المتعارضة

### 2. `frontend/js/invoices.js`
- تصحيح اسم الحالة من `partial` إلى `partially_paid`
- تحديث `getStatusBadge()` لدعم كلا الاسمين

---

## ✅ النتيجة
الآن تسجيل الدفعات يعمل بشكل صحيح بدون أخطاء:
- ✅ يتم إنشاء سجل الدفعة
- ✅ يتم تحديث الفاتورة
- ✅ يتم تحديث الحالة تلقائياً
- ✅ لا توجد أخطاء في Console

---

## 🧪 الاختبار

### اختبار دفعة جزئية:
1. افتح فاتورة بمبلغ 100$
2. سجل دفعة 50$
3. تأكد من:
   - `amount_paid` = 50
   - `amount_due` = 50
   - `status` = partially_paid
   - لا توجد أخطاء

### اختبار دفعة كاملة:
1. افتح فاتورة بمبلغ متبقي 50$
2. سجل دفعة 50$
3. تأكد من:
   - `amount_paid` = 100
   - `amount_due` = 0
   - `status` = paid
   - `paid_date` = تاريخ اليوم
   - لا توجد أخطاء

---

تاريخ الإصلاح: 11 يناير 2026
