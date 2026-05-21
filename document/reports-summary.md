# 📊 ملخص شامل لجميع التقارير - نظام دار القرآن

## ✅ التقارير المتوفرة (18 تقرير)

---

## 1️⃣ تقارير الطلبة (6 تقارير)

### 1. تقرير شامل لطالب واحد
**Function**: `get_student_report(student_uuid)`

**يعرض**:
- البيانات الأساسية (الاسم، الهاتف، الدولة)
- نظام التسعير والسعر الشهري
- رصيد الاعتذارات والتحذيرات
- إحصائيات الحضور (إجمالي، مكتمل، معتذر، غائب)
- نسبة الحضور
- الفواتير (إجمالي، مدفوع، متبقي)
- آخر دفعة
- الحصة القادمة

**الاستخدام**:
```sql
SELECT * FROM get_student_report('student-uuid-here');
```

---

### 2. تقرير حضور طالب (فترة محددة)
**Query مباشر**

**يعرض**:
- تاريخ ووقت كل حصة
- اسم المحفظ
- حالة الحصة
- ملاحظات المحفظ

**الاستخدام**:
```sql
SELECT 
    ses.session_date,
    ses.session_time,
    t.name as teacher_name,
    ses.status,
    ses.teacher_notes
FROM sessions ses
JOIN teachers t ON ses.teacher_id = t.id
WHERE ses.student_id = 'student-uuid'
AND ses.session_date >= '2024-01-01'
ORDER BY ses.session_date DESC;
```

---

### 3. إحصائيات حضور طالب
**Query مباشر**

**يعرض**:
- عدد الحصص المكتملة
- عدد الاعتذارات
- عدد الغياب
- الحصص الملغاة من المحفظ
- نسبة الحضور

**الاستخدام**:
```sql
SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'student_excused') as excused,
    COUNT(*) FILTER (WHERE status = 'student_absent') as absent,
    COUNT(*) FILTER (WHERE status = 'teacher_cancelled') as teacher_cancelled,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'student_absent')), 0) * 100,
        2
    ) as attendance_rate
FROM sessions
WHERE student_id = 'student-uuid'
AND session_date >= DATE_TRUNC('month', CURRENT_DATE);
```

---

### 4. تقرير الطلبة حسب الحالة
**Function**: `get_students_by_status_report()`

**يعرض**:
- عدد الطلبة لكل حالة (نشط، غير نشط، معلق، متخرج)
- إجمالي الإيرادات لكل فئة
- متوسط نسبة الحضور

**الاستخدام**:
```sql
SELECT * FROM get_students_by_status_report();
```

---

### 5. تقرير الطلبة الأكثر التزاماً
**Function**: `get_top_students_report(limit_count)`

**يعرض**:
- أفضل 10 طلبة (أو أي عدد)
- نسبة الحضور
- عدد الحصص المكتملة
- رصيد الاعتذارات

**الاستخدام**:
```sql
SELECT * FROM get_top_students_report(10);
```

---

### 6. تقرير الطلبة الذين يحتاجون متابعة
**Function**: `get_students_need_followup_report()`

**يعرض**:
- الطلبة بتحذيرات نشطة
- الطلبة بمدفوعات متأخرة
- الطلبة بنسبة حضور منخفضة
- مستوى الأولوية (عالية، متوسطة، منخفضة)

**الاستخدام**:
```sql
SELECT * FROM get_students_need_followup_report();
```

---

## 2️⃣ تقارير المحفظين (2 تقرير)

### 7. تقرير أداء جميع المحفظين
**Query مباشر**

**يعرض**:
- عدد الطلبة لكل محفظ
- الحصص المكتملة والملغاة
- التقييم
- النشاط في آخر 30 يوم

**الاستخدام**:
```sql
SELECT 
    t.id,
    t.name,
    COUNT(DISTINCT ses.student_id) as total_students,
    COUNT(*) FILTER (WHERE ses.status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'teacher_cancelled') as cancelled_sessions,
    ROUND(AVG(ses.rating) FILTER (WHERE ses.rating IS NOT NULL), 2) as average_rating
FROM teachers t
LEFT JOIN sessions ses ON t.id = ses.teacher_id
WHERE t.status = 'active'
GROUP BY t.id, t.name
ORDER BY completed_sessions DESC;
```

---

### 8. تقرير تفصيلي لمحفظ واحد
**Function**: `get_teacher_report(teacher_uuid)`

**يعرض**:
- البيانات الأساسية
- عدد الطلبة (إجمالي ونشط)
- إحصائيات الحصص
- معدل الإنجاز
- التقييم
- النشاط الشهري والأسبوعي
- الحصة القادمة

**الاستخدام**:
```sql
SELECT * FROM get_teacher_report('teacher-uuid-here');
```

---

## 3️⃣ التقارير المالية (4 تقارير)

### 9. تقرير مالي شهري
**View**: `financial_summary`

**يعرض**:
- إجمالي الفواتير
- إجمالي المحصل
- المتأخرات
- عدد الفواتير (مدفوعة، معلقة، متأخرة)
- مجموعة حسب الشهر والعملة

**الاستخدام**:
```sql
SELECT * FROM financial_summary
WHERE year = 2024 AND month = 1;
```

---

### 10. تقرير مفصل للمدفوعات
**Function**: `get_payments_report(start_date, end_date, currency_filter)`

**يعرض**:
- تاريخ الدفع
- اسم الطالب
- الشهر والسنة
- المبلغ والعملة
- طريقة الدفع
- من استلم الدفع
- رقم المعاملة

**الاستخدام**:
```sql
SELECT * FROM get_payments_report('2024-01-01', '2024-01-31', 'EGP');
```

---

### 11. تقرير المتأخرات المفصل
**Function**: `get_overdue_report()`

**يعرض**:
- بيانات الطالب الكاملة
- تفاصيل الفاتورة
- المبلغ المتبقي
- عدد أيام التأخير
- آخر دفعة

**الاستخدام**:
```sql
SELECT * FROM get_overdue_report();
```

---

### 12. تقرير الطلبة حسب الدولة
**Function**: `get_students_by_country_report()`

**يعرض**:
- عدد الطلبة لكل دولة
- الطلبة النشطين
- إجمالي الإيرادات
- المحصل
- المتبقي
- مجموعة حسب العملة

**الاستخدام**:
```sql
SELECT * FROM get_students_by_country_report();
```

---

## 4️⃣ تقارير الحصص (3 تقارير)

### 13. الحصص القادمة
**View**: `upcoming_sessions`

**يعرض**:
- تاريخ ووقت الحصة
- بيانات الطالب والمحفظ
- الحالة
- هل هي تعويضية
- تسمية (اليوم، غداً، التاريخ)

**الاستخدام**:
```sql
SELECT * FROM upcoming_sessions
WHERE session_date = CURRENT_DATE;
```

---

### 14. تقرير الحصص الملغاة
**Function**: `get_cancelled_sessions_report(start_date, end_date)`

**يعرض**:
- تاريخ ووقت الحصة
- الطالب والمحفظ
- من ألغى (طالب، محفظ، غياب)
- هل هي تعويضية
- الملاحظات

**الاستخدام**:
```sql
SELECT * FROM get_cancelled_sessions_report('2024-01-01', '2024-01-31');
```

---

### 15. الحصص التي تحتاج تعويض
**Query مباشر**

**يعرض**:
- الحصص المعتذر عنها أو الملغاة
- التي لم يتم تعويضها بعد

**الاستخدام**:
```sql
SELECT 
    ses.id,
    ses.session_date,
    st.name as student_name,
    t.name as teacher_name,
    ses.status
FROM sessions ses
JOIN students st ON ses.student_id = st.id
JOIN teachers t ON ses.teacher_id = t.id
WHERE ses.status IN ('student_excused', 'teacher_cancelled')
AND ses.is_makeup = false
AND NOT EXISTS (
    SELECT 1 FROM sessions makeup
    WHERE makeup.makeup_for_session_id = ses.id
)
ORDER BY ses.session_date DESC;
```

---

## 5️⃣ تقارير إحصائية (4 تقارير)

### 16. إحصائيات Dashboard
**Function**: `get_dashboard_stats()`

**يعرض**:
- عدد الطلبة والمحفظين النشطين
- الحصص اليوم والأسبوع
- الفواتير المعلقة والمتأخرة
- الطلبة بتحذيرات
- الحصص التي تحتاج تعويض
- الإيرادات والمحصل هذا الشهر

**الاستخدام**:
```sql
SELECT * FROM get_dashboard_stats();
```

---

### 17. تقرير مقارنة شهرية
**Function**: `get_monthly_comparison_report(months_count)`

**يعرض**:
- مقارنة آخر 6 أشهر (أو أي عدد)
- عدد الطلبة والطلبة الجدد
- الحصص المكتملة والملغاة
- نسبة الحضور
- الإيرادات والمحصل
- نسبة التحصيل

**الاستخدام**:
```sql
SELECT * FROM get_monthly_comparison_report(6);
```

---

### 18. تقرير نسب الحضور العامة
**Function**: `get_attendance_statistics(start_date, end_date)`

**يعرض**:
- إجمالي الحصص المجدولة
- الحصص المكتملة
- الاعتذارات والغياب
- الإلغاء من المحفظ
- نسب مئوية لكل فئة

**الاستخدام**:
```sql
SELECT * FROM get_attendance_statistics('2024-01-01', '2024-01-31');
```

---

## 6️⃣ تقرير إضافي

### 19. تقرير ملخص يومي للإدارة
**Function**: `get_daily_summary_report(report_date)`

**يعرض**:
- ملخص سريع لليوم
- عدد الحصص والمكتمل والملغي
- الطلبة والمحفظين النشطين
- الفواتير المتأخرة
- الطلبة بتحذيرات
- المدفوعات اليوم

**الاستخدام**:
```sql
SELECT * FROM get_daily_summary_report(CURRENT_DATE);
```

---

## 📋 ملخص التقارير حسب الفئة

| الفئة | عدد التقارير | التقارير |
|------|--------------|----------|
| **الطلبة** | 6 | شامل، حضور، إحصائيات، حسب الحالة، الأكثر التزاماً، يحتاجون متابعة |
| **المحفظين** | 2 | أداء جميع المحفظين، تفصيلي لمحفظ |
| **المالية** | 4 | شهري، مدفوعات، متأخرات، حسب الدولة |
| **الحصص** | 3 | قادمة، ملغاة، تحتاج تعويض |
| **إحصائية** | 4 | Dashboard، مقارنة شهرية، نسب حضور، ملخص يومي |
| **المجموع** | **19** | |

---

## 🎯 التقارير الأكثر أهمية للاستخدام اليومي

1. **Dashboard Stats** - نظرة سريعة على النظام
2. **Upcoming Sessions** - الحصص اليوم
3. **Students Need Followup** - من يحتاج متابعة
4. **Overdue Report** - المتأخرات
5. **Daily Summary** - ملخص اليوم

---

## 📊 التقارير للمراجعة الشهرية

1. **Monthly Comparison** - مقارنة الأشهر
2. **Financial Summary** - الملخص المالي
3. **Attendance Statistics** - نسب الحضور
4. **Students by Country** - التوزيع الجغرافي
5. **Top Students** - الطلبة المتميزين

---

## ✅ الخلاصة

قاعدة البيانات الآن تدعم **19 تقرير شامل** يغطي:
- ✅ جميع جوانب إدارة الطلبة
- ✅ متابعة أداء المحفظين
- ✅ التقارير المالية الكاملة
- ✅ إدارة الحصص
- ✅ الإحصائيات والمقارنات
- ✅ التقارير اليومية والشهرية

**النظام جاهز للتنفيذ!** 🚀
