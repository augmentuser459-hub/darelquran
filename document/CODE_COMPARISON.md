# 🔄 مقارنة الأكواد: Django vs Supabase

## نظرة سريعة على الفرق

هذا الملف يوضح الفرق بين الكود القديم (Django) والكود الجديد (Supabase)

---

## 1️⃣ جلب جميع السجلات (Get All)

### ❌ القديم (Django):
```javascript
async function loadStudents() {
    const response = await api.get('/students/');
    const students = response.results || response;
    // استخدام البيانات
}
```

### ✅ الجديد (Supabase):
```javascript
async function loadStudents() {
    const { data: students, error } = await supabase
        .from('students')
        .select('*');
    
    if (error) throw error;
    // استخدام البيانات
}
```

**الفرق:**
- ✅ أبسط وأوضح
- ✅ error handling مدمج
- ✅ لا حاجة لـ api helper

---

## 2️⃣ جلب سجل واحد (Get By ID)

### ❌ القديم (Django):
```javascript
async function getStudent(id) {
    const student = await api.get(`/students/${id}/`);
    return student;
}
```

### ✅ الجديد (Supabase):
```javascript
async function getStudent(id) {
    const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return student;
}
```

**الفرق:**
- ✅ `.eq()` للفلترة
- ✅ `.single()` لسجل واحد فقط

---

## 3️⃣ إنشاء سجل جديد (Create)

### ❌ القديم (Django):
```javascript
async function createStudent(data) {
    const newStudent = await api.post('/students/', data);
    return newStudent;
}
```

### ✅ الجديد (Supabase):
```javascript
async function createStudent(data) {
    const { data: newStudent, error } = await supabase
        .from('students')
        .insert([data])
        .select()
        .single();
    
    if (error) throw error;
    return newStudent;
}
```

**الفرق:**
- ✅ `.insert([data])` - لاحظ المصفوفة
- ✅ `.select()` لإرجاع البيانات المضافة

---

## 4️⃣ تحديث سجل (Update)

### ❌ القديم (Django):
```javascript
async function updateStudent(id, data) {
    const updated = await api.patch(`/students/${id}/`, data);
    return updated;
}
```

### ✅ الجديد (Supabase):
```javascript
async function updateStudent(id, data) {
    const { data: updated, error } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return updated;
}
```

**الفرق:**
- ✅ `.update(data)` ثم `.eq('id', id)`
- ✅ `.select()` لإرجاع البيانات المحدثة

---

## 5️⃣ حذف سجل (Delete)

### ❌ القديم (Django):
```javascript
async function deleteStudent(id) {
    await api.delete(`/students/${id}/`);
}
```

### ✅ الجديد (Supabase):
```javascript
async function deleteStudent(id) {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}
```

**الفرق:**
- ✅ `.delete()` ثم `.eq('id', id)`

---

## 6️⃣ البحث (Search)

### ❌ القديم (Django):
```javascript
async function searchStudents(query) {
    const response = await api.get(`/students/?search=${query}`);
    return response.results;
}
```

### ✅ الجديد (Supabase):
```javascript
async function searchStudents(query) {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
    
    if (error) throw error;
    return data;
}
```

**الفرق:**
- ✅ `.or()` للبحث في عدة أعمدة
- ✅ `.ilike` للبحث case-insensitive

---

## 7️⃣ الفلترة (Filter)

### ❌ القديم (Django):
```javascript
async function getActiveStudents() {
    const response = await api.get('/students/?status=active');
    return response.results;
}
```

### ✅ الجديد (Supabase):
```javascript
async function getActiveStudents() {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active');
    
    if (error) throw error;
    return data;
}
```

**الفرق:**
- ✅ `.eq('column', 'value')` للفلترة

---

## 8️⃣ الترتيب (Sorting)

### ❌ القديم (Django):
```javascript
async function getStudentsSorted() {
    const response = await api.get('/students/?ordering=name');
    return response.results;
}
```

### ✅ الجديد (Supabase):
```javascript
async function getStudentsSorted() {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
}
```

**الفرق:**
- ✅ `.order('column', { ascending: true/false })`

---

## 9️⃣ العد (Count)

### ❌ القديم (Django):
```javascript
async function countStudents() {
    const response = await api.get('/students/');
    return response.count || response.length;
}
```

### ✅ الجديد (Supabase):
```javascript
async function countStudents() {
    const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count;
}
```

**الفرق:**
- ✅ `{ count: 'exact', head: true }` للعد فقط
- ✅ أسرع لأنه لا يجلب البيانات

---

## 🔟 الربط بين الجداول (Joins)

### ❌ القديم (Django):
```javascript
// Django يرجع العلاقات تلقائياً
async function getStudentsWithCountry() {
    const response = await api.get('/students/');
    // response.results[0].country = { id, name, ... }
    return response.results;
}
```

### ✅ الجديد (Supabase):
```javascript
async function getStudentsWithCountry() {
    const { data, error } = await supabase
        .from('students')
        .select(`
            *,
            country:countries(id, name, name_ar),
            teacher:teachers(id, name)
        `);
    
    if (error) throw error;
    return data;
}
```

**الفرق:**
- ✅ تحديد العلاقات يدوياً في `.select()`
- ✅ أكثر مرونة - تختار الأعمدة التي تريدها فقط

---

## 1️⃣1️⃣ Pagination

### ❌ القديم (Django):
```javascript
async function getStudentsPage(page, pageSize) {
    const response = await api.get(`/students/?page=${page}&page_size=${pageSize}`);
    return response.results;
}
```

### ✅ الجديد (Supabase):
```javascript
async function getStudentsPage(page, pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .range(from, to);
    
    if (error) throw error;
    return data;
}
```

**الفرق:**
- ✅ `.range(from, to)` للـ pagination
- ✅ تحسب الـ range بنفسك

---

## 1️⃣2️⃣ Custom Actions / Edge Functions

### ❌ القديم (Django):
```javascript
async function getDashboardStats() {
    const stats = await api.get('/dashboard/dashboard_stats/');
    return stats;
}
```

### ✅ الجديد (Supabase):
```javascript
async function getDashboardStats() {
    const { data: stats, error } = await supabase.functions.invoke('dashboard-stats');
    
    if (error) throw error;
    return stats;
}
```

**الفرق:**
- ✅ `.functions.invoke('function-name')`
- ✅ يحتاج إنشاء Edge Function أولاً

---

## 📊 ملخص الفروقات

### مميزات Supabase:

| الميزة | Django | Supabase |
|--------|--------|----------|
| **البساطة** | متوسط | ✅ بسيط جداً |
| **Error Handling** | يدوي | ✅ مدمج |
| **Joins** | تلقائي | يدوي (أكثر مرونة) |
| **Real-time** | ❌ لا | ✅ نعم |
| **Hosting** | مدفوع | ✅ مجاني |
| **Setup** | معقد | ✅ سهل |

---

## 🎓 نصائح للتحويل

### 1. استبدل `api.get()`:
```javascript
// قديم
const response = await api.get('/students/');

// جديد
const { data, error } = await supabase.from('students').select('*');
```

### 2. استبدل `api.post()`:
```javascript
// قديم
const newStudent = await api.post('/students/', data);

// جديد
const { data: newStudent, error } = await supabase
    .from('students')
    .insert([data])
    .select()
    .single();
```

### 3. استبدل `api.patch()`:
```javascript
// قديم
const updated = await api.patch(`/students/${id}/`, data);

// جديد
const { data: updated, error } = await supabase
    .from('students')
    .update(data)
    .eq('id', id)
    .select()
    .single();
```

### 4. استبدل `api.delete()`:
```javascript
// قديم
await api.delete(`/students/${id}/`);

// جديد
const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
```

---

## 🔍 أمثلة متقدمة

### فلترة متعددة:
```javascript
const { data } = await supabase
    .from('students')
    .select('*')
    .eq('status', 'active')
    .eq('country_id', countryId)
    .order('name');
```

### بحث في عدة أعمدة:
```javascript
const { data } = await supabase
    .from('students')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`);
```

### Joins متعددة:
```javascript
const { data } = await supabase
    .from('sessions')
    .select(`
        *,
        student:students(id, name),
        teacher:teachers(id, name),
        scheduled_session:scheduled_sessions(*)
    `);
```

---

## ✅ Checklist للتحويل

عند تحويل أي ملف JS:

- [ ] استبدل `api.get()` بـ `supabase.from().select()`
- [ ] استبدل `api.post()` بـ `supabase.from().insert()`
- [ ] استبدل `api.patch()` بـ `supabase.from().update()`
- [ ] استبدل `api.delete()` بـ `supabase.from().delete()`
- [ ] أضف error handling: `if (error) throw error`
- [ ] اختبر الكود في Console
- [ ] اختبر الصفحة في المتصفح

---

**Good Luck! 🚀**
