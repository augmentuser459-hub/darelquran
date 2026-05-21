# دار القرآن - نظام إدارة المحفظين والطلبة
## Frontend Documentation

### 📋 نظرة عامة

نظام إدارة شامل لدار القرآن مع واجهة مستخدم احترافية بتصميم إسلامي.
يعمل كموقع Static مع Supabase كـ Backend.

### 🎨 التصميم

- **الألوان الإسلامية:**
  - الأخضر الداكن (#1a5f3f) - اللون الأساسي
  - الذهبي (#d4af37) - اللون الثانوي
  - البني (#8b4513) - لون مساعد

- **الخط:** Cairo - خط عربي احترافي
- **الأيقونات:** Font Awesome 6.4.0
- **المكتبات:**
  - Chart.js - للرسوم البيانية
  - DataTables - للجداول التفاعلية
  - SweetAlert2 - للرسائل التفاعلية
  - Supabase JS v2 - للاتصال بقاعدة البيانات

### 📁 هيكل الملفات

```
frontend/
├── index.html                  # لوحة التحكم الرئيسية
├── css/
│   └── style.css              # الأنماط الرئيسية
├── js/
│   ├── supabase-config.js     # إعدادات Supabase
│   ├── supabase-client.js     # عميل Supabase
│   ├── dashboard.js           # منطق لوحة التحكم
│   ├── students.js            # منطق صفحة الطلبة
│   ├── teachers.js            # منطق صفحة المحفظين
│   ├── sessions.js            # منطق صفحة الحصص
│   ├── invoices.js            # منطق صفحة الفواتير
│   ├── payments.js            # منطق صفحة المدفوعات
│   └── ...                    # ملفات أخرى
└── pages/
    ├── students.html          # إدارة الطلبة
    ├── teachers.html          # إدارة المحفظين
    ├── sessions.html          # إدارة الحصص
    ├── scheduled-sessions.html # الجدول الأسبوعي
    ├── attendance.html        # الحضور والغياب
    ├── invoices.html          # إدارة الفواتير
    ├── payments.html          # إدارة المدفوعات
    └── ...                    # صفحات أخرى
```

### 🔌 الاتصال بـ Supabase

جميع الصفحات متصلة بـ Supabase عبر:
- **Supabase JS SDK v2** (Browser Version)
- **CDN:** `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`

### 🚀 كيفية التشغيل

1. **تشغيل محلياً:**
```bash
# استخدم أي خادم محلي مثل Live Server في VS Code
# أو Python HTTP Server:
cd frontend
python -m http.server 8080
```

2. **فتح في المتصفح:**
```
http://localhost:8080
```

### 📊 جداول Supabase المستخدمة

- `students` - الطلبة
- `teachers` - المحفظين
- `sessions` - الحصص
- `scheduled_sessions` - الجدول الأسبوعي
- `invoices` - الفواتير
- `payments` - المدفوعات
- `countries` - الدول
- `pricing_plans` - أنظمة التسعير
- `expenses` - المصروفات
- `teacher_salaries` - رواتب المحفظين

### 🎯 المميزات

- ✅ تصميم متجاوب (Responsive)
- ✅ دعم كامل للغة العربية (RTL)
- ✅ تصميم إسلامي احترافي
- ✅ رسوم بيانية تفاعلية
- ✅ جداول قابلة للبحث والفلترة
- ✅ رسائل تفاعلية جميلة
- ✅ سهولة الاستخدام
- ✅ يعمل بدون Backend (Static Site)
- ✅ Supabase للبيانات والمصادقة

### 📝 ملاحظات تقنية

- جميع الصفحات تستخدم Supabase JS v2 (Browser SDK)
- لا يوجد اعتماد على Node.js أو أي Framework
- الكود يعمل مباشرة في المتصفح
- يمكن نشره على أي خدمة استضافة Static (Netlify, Vercel, GitHub Pages)

---

**آخر تحديث:** يناير 2026
