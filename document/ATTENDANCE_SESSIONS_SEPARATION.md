# فصل وظائف الحضور عن صفحة الحصص

## التاريخ
11 يناير 2025

## المشكلة
كانت هناك مشكلتان رئيسيتان:

1. **تضارب في تسجيل الحضور**: كانت صفحة `/sessions/` وصفحة `/attendance/` كلاهما يسمحان بتسجيل الحضور والغياب، مما يسبب تشويشاً للمستخدم
2. **اختلاف في عدد الحصص**: صفحة `/attendance/` كانت تعرض 13 حصة للطالب بهاء الهواري بينما صفحة `/sessions/` تعرض 12 حصة

## السبب
- صفحة `/attendance/` كانت تولد الحصص المتوقعة من الجدول الأسبوعي (`scheduledSessions`)
- صفحة `/sessions/` كانت تعرض الحصص الفعلية من قاعدة البيانات
- هذا أدى إلى اختلاف في العدد لأن التوليد التلقائي قد يضيف حصة إضافية

## الحل المطبق

### 1. إزالة تسجيل الحضور من صفحة `/sessions/`

#### التغييرات في `frontend/js/sessions.js`:
- تم تعطيل دالة `markAttendance()` (تحويلها إلى تعليق)
- تم تعطيل دالة `changeAttendance()` (تحويلها إلى تعليق)
- تم تعطيل دالة `shouldShowAttendanceButtons()` (تحويلها إلى تعليق)
- تم تغيير أزرار الإجراءات في الجدول لتعرض فقط زر "عرض" بدلاً من أزرار "حضر" و "غاب"

```javascript
// قبل التعديل
if (session.status === 'scheduled') {
    if (shouldShowAttendanceButtons(session.session_date)) {
        actionButtons = `
            <button class="btn btn-sm btn-success" onclick="markAttendance('${session.id}', 'attended')">
                <i class="fas fa-check"></i> حضر
            </button>
            <button class="btn btn-sm btn-danger" onclick="markAttendance('${session.id}', 'absent')">
                <i class="fas fa-times"></i> غاب
            </button>
        `;
    }
}

// بعد التعديل
let actionButtons = `
    <button class="btn btn-sm btn-info" onclick="viewSession('${session.id}')" title="عرض">
        <i class="fas fa-eye"></i> عرض
    </button>
`;
```

#### التغييرات في `frontend/pages/sessions.html`:
- تم إزالة عمود "الإجراءات" من جدول الحصص
- تم إضافة ملاحظة واضحة في أعلى الجدول توجه المستخدم لاستخدام صفحة الحضور والغياب

```html
<!-- تم تغيير عدد الأعمدة من 7 إلى 6 -->
<thead>
    <tr>
        <th>التاريخ</th>
        <th>الوقت</th>
        <th>الطالب</th>
        <th>المحفظ</th>
        <th>الحالة</th>
        <th>النوع</th>
        <!-- تم إزالة: <th>الإجراءات</th> -->
    </tr>
</thead>
```

```html
<div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-top: 1rem;">
    <i class="fas fa-info-circle" style="color: #856404;"></i>
    <strong>ملاحظة:</strong> هذه الصفحة لعرض الحصص فقط. لتسجيل الحضور والغياب، يرجى الانتقال إلى 
    <a href="/attendance/">صفحة الحضور والغياب</a>
</div>
```

#### التغييرات في `frontend/pages/attendance.html`:
- تم إضافة زر "تحديث" لتحديث البيانات يدوياً

```html
<div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 1rem; align-items: end;">
    <div class="form-group">
        <label class="form-label">اختر الطالب *</label>
        <select id="studentSelect" class="form-control" onchange="loadStudentAttendance()">
            <option value="">-- اختر الطالب --</option>
        </select>
    </div>
    
    <div class="form-group">
        <label class="form-label">الشهر</label>
        <input type="month" id="monthSelect" class="form-control" onchange="loadStudentAttendance()">
    </div>
    
    <!-- زر التحديث الجديد -->
    <div class="form-group">
        <button class="btn btn-primary" onclick="loadStudentAttendance()" title="تحديث البيانات">
            <i class="fas fa-sync-alt"></i> تحديث
        </button>
    </div>
</div>
```

### 2. توحيد مصدر البيانات في صفحة `/attendance/`

#### التغييرات في `frontend/js/attendance.js`:

**أ) تحديث دالة `loadStudentAttendance()`**:
تم إضافة استدعاء `loadSessions()` لتحديث البيانات قبل عرضها:

```javascript
async function loadStudentAttendance() {
    // ... existing code ...
    
    // Reload sessions data to get latest changes
    await loadSessions();
    
    // Show student info
    displayStudentInfo();
    // ... rest of code ...
}
```

**ب) تغيير منطق توليد الجدول**:

**قبل التعديل**: كانت الصفحة تولد الحصص المتوقعة من الجدول الأسبوعي
```javascript
// Generate expected sessions based on weekly schedule
const expectedSessions = [];
const currentDate = new Date(startDate);

while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    studentScheduled.forEach(schedule => {
        if (schedule.day_of_week === dayOfWeek) {
            expectedSessions.push({
                date: new Date(currentDate),
                time: schedule.session_time || '00:00',
                dayOfWeek: dayOfWeek
            });
        }
    });
    currentDate.setDate(currentDate.getDate() + 1);
}
```

**بعد التعديل**: الآن تستخدم الحصص الفعلية من قاعدة البيانات مباشرة
```javascript
// Get actual sessions for this student in this month from the sessions API
const studentSessions = sessions.filter(s => {
    const sessionDate = new Date(s.session_date || s.date || s.scheduled_date);
    const sStudentId = typeof s.student === 'object' ? s.student?.id : s.student;
    return String(sStudentId) === String(studentId) && sessionDate >= startDate && sessionDate <= endDate;
});

// Sort sessions by date and time
studentSessions.sort((a, b) => {
    const dateA = new Date(a.session_date || a.date || a.scheduled_date);
    const dateB = new Date(b.session_date || b.date || b.scheduled_date);
    return dateA - dateB;
});
```

#### تحديث دالة `displayStudentInfo()`:
- تم تغيير حساب "إجمالي الحصص المتوقعة" لتعرض عدد الحصص الفعلية في الشهر بدلاً من التقدير (عدد الحصص الأسبوعية × 4)

```javascript
// Get actual sessions count for this month
const [year, month] = selectedMonth.split('-');
const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 0);

const actualMonthly = sessions.filter(s => {
    const sessionDate = new Date(s.session_date || s.date || s.scheduled_date);
    const sStudentId = typeof s.student === 'object' ? s.student?.id : s.student;
    return String(sStudentId) === String(studentId) && sessionDate >= startDate && sessionDate <= endDate;
}).length;

document.getElementById('expectedSessions').textContent = actualMonthly;
```

#### تحديث دالة `recalculateStats()`:
- تم تبسيط الدالة لتحسب الإحصائيات من الحصص الفعلية فقط

## النتيجة

### الآن:
1. ✅ صفحة `/sessions/` تعرض الحصص فقط بدون عمود "الإجراءات"
2. ✅ صفحة `/attendance/` هي المكان الوحيد لتسجيل الحضور والغياب
3. ✅ كلا الصفحتين تعرضان نفس عدد الحصص (12 حصة للطالب بهاء الهواري)
4. ✅ البيانات موحدة من مصدر واحد (قاعدة البيانات)
5. ✅ صفحة `/attendance/` تحدث البيانات تلقائياً عند اختيار طالب أو شهر
6. ✅ يوجد زر "تحديث" في صفحة `/attendance/` لتحديث البيانات يدوياً

## الفوائد

1. **وضوح أكبر للمستخدم**: مكان واحد فقط لتسجيل الحضور
2. **تناسق البيانات**: نفس العدد في كل الصفحات
3. **سهولة الصيانة**: منطق واحد لحساب الحصص
4. **تجنب الأخطاء**: لا يوجد تضارب بين التوليد التلقائي والبيانات الفعلية
5. **تحديث فوري**: عند إضافة حصة جديدة في `/sessions/`، تظهر مباشرة في `/attendance/` بعد التحديث

## ملاحظات مهمة

- الدوال المعطلة في `sessions.js` تم تحويلها إلى تعليقات بدلاً من حذفها للحفاظ على الكود في حال الحاجة إليه مستقبلاً
- صفحة `/sessions/` لا تزال تعرض حالة الحضور (حضر/غاب/معتذر) ولكن بدون إمكانية التعديل
- تم إزالة عمود "الإجراءات" بالكامل من صفحة `/sessions/`
- جميع التغييرات متوافقة مع الكود الموجود ولا تؤثر على الوظائف الأخرى
- عند إضافة حصة جديدة، يجب الضغط على زر "تحديث" في صفحة `/attendance/` أو إعادة اختيار الطالب/الشهر

## الاختبار المطلوب

1. ✅ التحقق من أن صفحة `/sessions/` لا تحتوي على عمود "الإجراءات"
2. ✅ التحقق من أن صفحة `/attendance/` تعرض نفس عدد الحصص الموجود في `/sessions/`
3. ✅ التحقق من إمكانية تسجيل الحضور من صفحة `/attendance/` فقط
4. ✅ التحقق من أن الإحصائيات متطابقة في كلا الصفحتين
5. ✅ إضافة حصة جديدة في `/sessions/` والتحقق من ظهورها في `/attendance/` بعد الضغط على "تحديث"
