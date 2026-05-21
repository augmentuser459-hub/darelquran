# 🛠️ دليل التقنيات المستخدمة - نظام دار القرآن
## Tech Stack & Development Guide

---

## 📋 نظرة عامة على التقنيات

هذا المشروع يستخدم **Supabase** كـ Backend و **HTML/CSS/JavaScript** كـ Frontend بدون أي إطار عمل معقد.

---

## 🎯 التقنيات الأساسية

### 1. **Supabase** (Backend as a Service)

**ما هو Supabase؟**
- منصة Backend جاهزة مبنية على PostgreSQL
- توفر قاعدة بيانات + Authentication + Storage + Real-time
- بديل مفتوح المصدر لـ Firebase

**ما سنستخدمه من Supabase:**
- ✅ **PostgreSQL Database**: قاعدة البيانات الرئيسية
- ✅ **Authentication**: نظام تسجيل الدخول
- ✅ **Row Level Security (RLS)**: حماية البيانات
- ✅ **Real-time Subscriptions**: التحديثات الفورية
- ✅ **Storage**: تخزين الملفات والصور
- ✅ **Edge Functions**: دوال سيرفر (إذا احتجنا)

**لماذا Supabase؟**
- ✅ سهل الاستخدام
- ✅ مجاني للمشاريع الصغيرة
- ✅ قاعدة بيانات PostgreSQL قوية
- ✅ لا يحتاج سيرفر خاص
- ✅ API جاهز تلقائياً

---

### 2. **Frontend Technologies**

#### **HTML5** (الهيكل)
```html
<!-- مثال على الهيكل -->
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دار القرآن - لوحة التحكم</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <!-- المحتوى هنا -->
    </div>
    <script src="js/app.js"></script>
</body>
</html>
```

**ما سنستخدمه:**
- ✅ HTML5 Semantic Elements
- ✅ Forms للإدخال
- ✅ Tables لعرض البيانات
- ✅ Modals للنوافذ المنبثقة

---

#### **CSS3** (التصميم)
```css
/* مثال على التصميم */
:root {
    --primary-color: #2563eb;
    --secondary-color: #10b981;
    --danger-color: #ef4444;
    --text-color: #1f2937;
}

body {
    font-family: 'Cairo', sans-serif;
    direction: rtl;
    text-align: right;
}
```

**ما سنستخدمه:**
- ✅ CSS Grid & Flexbox للتخطيط
- ✅ CSS Variables للألوان
- ✅ Responsive Design (Mobile First)
- ✅ Animations & Transitions
- ✅ RTL Support للعربية

**المكتبات المساعدة:**
- **Tailwind CSS** (اختياري): للتصميم السريع
- أو **Bootstrap** (اختياري): للمكونات الجاهزة
- أو **CSS خام**: للتحكم الكامل

---

#### **JavaScript (Vanilla JS)** (البرمجة)
```javascript
// مثال على الكود
import { createClient } from '@supabase/supabase-js'

// الاتصال بـ Supabase
const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_KEY'
)

// جلب البيانات
async function getStudents() {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
    
    if (error) console.error(error)
    return data
}
```

**ما سنستخدمه:**
- ✅ ES6+ Modern JavaScript
- ✅ Async/Await للعمليات غير المتزامنة
- ✅ Fetch API / Supabase Client
- ✅ DOM Manipulation
- ✅ Event Handling
- ✅ Local Storage للتخزين المؤقت

**لن نستخدم:**
- ❌ React
- ❌ Vue
- ❌ Angular
- ❌ أي Framework معقد

---

## 📦 المكتبات المساعدة

### 1. **Supabase JS Client**
```html
<!-- CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- أو NPM -->
npm install @supabase/supabase-js
```

**الاستخدام:**
- الاتصال بقاعدة البيانات
- تسجيل الدخول والخروج
- CRUD Operations
- Real-time Subscriptions

---

### 2. **Chart.js** (الرسوم البيانية)
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

**الاستخدام:**
```javascript
// مثال: رسم بياني للحضور
const ctx = document.getElementById('attendanceChart')
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['يناير', 'فبراير', 'مارس'],
        datasets: [{
            label: 'نسبة الحضور',
            data: [85, 90, 88],
            borderColor: '#2563eb'
        }]
    }
})
```

---

### 3. **DataTables** (جداول تفاعلية)
```html
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.css">
<script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.js"></script>
```

**الاستخدام:**
```javascript
$('#studentsTable').DataTable({
    language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/ar.json'
    },
    pageLength: 25,
    order: [[0, 'desc']]
})
```

---

### 4. **FullCalendar** (التقويم)
```html
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.9/index.global.min.js'></script>
```

**الاستخدام:**
```javascript
const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    locale: 'ar',
    events: async function(info, successCallback) {
        const sessions = await getSessions()
        successCallback(sessions)
    }
})
```

---

### 5. **SweetAlert2** (رسائل جميلة)
```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
```

**الاستخدام:**
```javascript
Swal.fire({
    title: 'نجح!',
    text: 'تم إضافة الطالب بنجاح',
    icon: 'success',
    confirmButtonText: 'حسناً'
})
```

---

### 6. **Moment.js** (التعامل مع التواريخ)
```html
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/ar.js"></script>
```

**الاستخدام:**
```javascript
moment.locale('ar')
const today = moment().format('dddd، D MMMM YYYY')
// الأحد، 7 يناير 2024
```

---

### 7. **jsPDF** (تصدير PDF)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

**الاستخدام:**
```javascript
const doc = new jsPDF()
doc.text('تقرير الحضور', 10, 10)
doc.save('report.pdf')
```

---

### 8. **SheetJS (xlsx)** (تصدير Excel)
```html
<script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>
```

**الاستخدام:**
```javascript
const ws = XLSX.utils.json_to_sheet(data)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, "الطلبة")
XLSX.writeFile(wb, "students.xlsx")
```

---

## 🗂️ هيكل المشروع

```
quran-house-system/
│
├── index.html                 # الصفحة الرئيسية
├── login.html                 # صفحة تسجيل الدخول
│
├── css/
│   ├── style.css             # التصميم الرئيسي
│   ├── dashboard.css         # تصميم لوحة التحكم
│   ├── forms.css             # تصميم النماذج
│   └── responsive.css        # التصميم المتجاوب
│
├── js/
│   ├── config.js             # إعدادات Supabase
│   ├── auth.js               # المصادقة
│   ├── app.js                # الكود الرئيسي
│   ├── students.js           # إدارة الطلبة
│   ├── teachers.js           # إدارة المحفظين
│   ├── sessions.js           # إدارة الحصص
│   ├── invoices.js           # إدارة الفواتير
│   ├── payments.js           # إدارة المدفوعات
│   ├── reports.js            # التقارير
│   ├── dashboard.js          # لوحة التحكم
│   └── utils.js              # دوال مساعدة
│
├── pages/
│   ├── dashboard.html        # لوحة التحكم
│   ├── students.html         # إدارة الطلبة
│   ├── teachers.html         # إدارة المحفظين
│   ├── sessions.html         # إدارة الحصص
│   ├── invoices.html         # الفواتير
│   ├── payments.html         # المدفوعات
│   └── reports.html          # التقارير
│
├── assets/
│   ├── images/               # الصور
│   ├── icons/                # الأيقونات
│   └── fonts/                # الخطوط (Cairo)
│
└── docs/
    ├── database-schema.sql   # قاعدة البيانات
    ├── api-docs.md           # توثيق API
    └── user-guide.md         # دليل المستخدم
```

---

## 🔧 إعداد المشروع

### الخطوة 1: إنشاء حساب Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل حساب جديد (مجاني)
3. أنشئ مشروع جديد
4. احفظ:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

---

### الخطوة 2: إنشاء قاعدة البيانات

1. افتح SQL Editor في Supabase
2. انسخ محتوى ملف `complete-database-schema.sql`
3. نفذ الكود
4. تأكد من إنشاء جميع الجداول

---

### الخطوة 3: إعداد المشروع

**ملف `js/config.js`:**
```javascript
// إعدادات Supabase
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

// إنشاء Client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// تصدير للاستخدام في ملفات أخرى
export { supabase }
```

---

### الخطوة 4: تشغيل المشروع

**طريقة 1: Live Server (VS Code)**
```bash
# تثبيت Live Server Extension
# ثم اضغط "Go Live" في VS Code
```

**طريقة 2: Python Server**
```bash
python -m http.server 8000
# افتح http://localhost:8000
```

**طريقة 3: Node.js Server**
```bash
npx http-server
```

---

## 💻 أمثلة على الكود

### مثال 1: جلب الطلبة
```javascript
async function getStudents() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                country:countries(name, currency_symbol),
                pricing_plan:pricing_plans(sessions_per_week, monthly_price)
            `)
            .eq('status', 'active')
            .order('name')
        
        if (error) throw error
        
        displayStudents(data)
    } catch (error) {
        console.error('خطأ:', error.message)
        showError('فشل في جلب البيانات')
    }
}
```

---

### مثال 2: إضافة طالب جديد
```javascript
async function addStudent(studentData) {
    try {
        const { data, error } = await supabase
            .from('students')
            .insert([studentData])
            .select()
        
        if (error) throw error
        
        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح',
            text: 'تم إضافة الطالب بنجاح'
        })
        
        getStudents() // تحديث القائمة
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message
        })
    }
}
```

---

### مثال 3: Real-time Updates
```javascript
// الاستماع للتحديثات الفورية
const subscription = supabase
    .channel('sessions-changes')
    .on('postgres_changes', 
        { 
            event: '*', 
            schema: 'public', 
            table: 'sessions' 
        }, 
        (payload) => {
            console.log('تحديث جديد:', payload)
            refreshSessions()
        }
    )
    .subscribe()
```

---

### مثال 4: تسجيل الدخول
```javascript
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) throw error
        
        // حفظ الجلسة
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // الانتقال للوحة التحكم
        window.location.href = 'pages/dashboard.html'
    } catch (error) {
        showError('بيانات الدخول غير صحيحة')
    }
}
```

---

## 🎨 التصميم

### الألوان المستخدمة
```css
:root {
    /* الألوان الأساسية */
    --primary: #2563eb;      /* أزرق */
    --secondary: #10b981;    /* أخضر */
    --danger: #ef4444;       /* أحمر */
    --warning: #f59e0b;      /* برتقالي */
    --info: #3b82f6;         /* أزرق فاتح */
    
    /* الخلفيات */
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-dark: #1f2937;
    
    /* النصوص */
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --text-light: #9ca3af;
}
```

### الخطوط
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');

body {
    font-family: 'Cairo', sans-serif;
}
```

---

## 📱 Responsive Design

```css
/* Mobile First Approach */

/* Mobile (default) */
.container {
    padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
    .container {
        padding: 2rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        padding: 3rem;
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

---

## 🔐 الأمان

### 1. Row Level Security (RLS)
```sql
-- تم تطبيقه في قاعدة البيانات
-- يمنع الوصول غير المصرح به
```

### 2. التحقق من الجلسة
```javascript
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
        window.location.href = '/login.html'
        return false
    }
    
    return true
}
```

### 3. تنظيف المدخلات
```javascript
function sanitizeInput(input) {
    return input
        .trim()
        .replace(/[<>]/g, '') // منع XSS
}
```

---

## 📊 التقارير

### تصدير PDF
```javascript
async function exportToPDF() {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
    
    // إضافة خط عربي
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal')
    doc.setFont('Cairo')
    
    doc.text('تقرير الطلبة', 105, 15, { align: 'center' })
    
    // إضافة البيانات
    // ...
    
    doc.save('report.pdf')
}
```

### تصدير Excel
```javascript
function exportToExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "البيانات")
    XLSX.writeFile(wb, "export.xlsx")
}
```

---

## 🚀 النشر (Deployment)

### الخيارات المتاحة:

**1. Netlify (مجاني)**
```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# النشر
netlify deploy --prod
```

**2. Vercel (مجاني)**
```bash
# تثبيت Vercel CLI
npm install -g vercel

# النشر
vercel --prod
```

**3. GitHub Pages (مجاني)**
- ارفع الكود على GitHub
- فعّل GitHub Pages من الإعدادات

**4. Supabase Hosting (قريباً)**

---

## ✅ الخلاصة

**التقنيات المستخدمة:**
- ✅ Supabase (Backend)
- ✅ HTML5 (Structure)
- ✅ CSS3 (Styling)
- ✅ JavaScript (Logic)
- ✅ Chart.js (Charts)
- ✅ DataTables (Tables)
- ✅ FullCalendar (Calendar)
- ✅ SweetAlert2 (Alerts)

**لن نستخدم:**
- ❌ Django
- ❌ React/Vue/Angular
- ❌ Node.js Backend
- ❌ أي Framework معقد

**المميزات:**
- ✅ سهل التعلم والتطوير
- ✅ سريع في الأداء
- ✅ لا يحتاج سيرفر
- ✅ مجاني للبداية
- ✅ قابل للتوسع

---

## 📚 مصادر التعلم

1. **Supabase Docs**: https://supabase.com/docs
2. **MDN Web Docs**: https://developer.mozilla.org
3. **Chart.js Docs**: https://www.chartjs.org/docs
4. **FullCalendar Docs**: https://fullcalendar.io/docs

---

**جاهز للبدء! 🚀**
