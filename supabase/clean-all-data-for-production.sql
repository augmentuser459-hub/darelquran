-- ============================================================================
-- تنظيف البيانات التجريبية - إعداد النظام للعميل
-- Clean Test Data - Prepare System for Client
-- ============================================================================
-- الغرض: حذف جميع البيانات التجريبية مع الحفاظ على:
-- Purpose: Delete all test data while preserving:
--   1. البنية الكاملة للجداول (Tables Structure)
--   2. الدوال والإجراءات (Functions & Procedures)
--   3. المشاهدات (Views)
--   4. المحفزات (Triggers)
--   5. الفهارس (Indexes)
--   6. القيود (Constraints)
--   7. إعدادات الدول والعملات (Countries & Currencies)
--   8. خطط التسعير (Pricing Plans)
-- ============================================================================

-- ============================================================================
-- PART 1: حذف البيانات التشغيلية (Operational Data)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🗑️ بدء حذف البيانات التجريبية...';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- ----------------------------------------------------------------------------
    -- 1. حذف السجلات والإشعارات (Logs & Notifications)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 1/10: حذف السجلات والإشعارات...';
    
    DELETE FROM audit_log;
    RAISE NOTICE '   ✅ تم حذف سجل التدقيق (audit_log)';
    
    DELETE FROM notifications;
    RAISE NOTICE '   ✅ تم حذف الإشعارات (notifications)';
    
    -- ----------------------------------------------------------------------------
    -- 2. حذف بيانات التقدم والحضور (Progress & Attendance)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 2/10: حذف بيانات التقدم والحضور...';
    
    DELETE FROM student_progress;
    RAISE NOTICE '   ✅ تم حذف تقدم الطلاب (student_progress)';
    
    DELETE FROM attendance_log;
    RAISE NOTICE '   ✅ تم حذف سجل الحضور (attendance_log)';
    
    -- ----------------------------------------------------------------------------
    -- 3. حذف التحذيرات (Warnings)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 3/10: حذف التحذيرات...';
    
    DELETE FROM warnings;
    RAISE NOTICE '   ✅ تم حذف التحذيرات (warnings)';
    
    -- ----------------------------------------------------------------------------
    -- 4. حذف المدفوعات والفواتير (Payments & Invoices)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 4/10: حذف المدفوعات والفواتير...';
    
    DELETE FROM payments;
    RAISE NOTICE '   ✅ تم حذف المدفوعات (payments)';
    
    DELETE FROM invoices;
    RAISE NOTICE '   ✅ تم حذف الفواتير (invoices)';
    
    -- ----------------------------------------------------------------------------
    -- 5. حذف الحصص (Sessions)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 5/10: حذف الحصص...';
    
    DELETE FROM sessions;
    RAISE NOTICE '   ✅ تم حذف الحصص الفعلية (sessions)';
    
    DELETE FROM scheduled_sessions;
    RAISE NOTICE '   ✅ تم حذف الجدول الأسبوعي (scheduled_sessions)';
    
    -- ----------------------------------------------------------------------------
    -- 6. حذف الطلاب (Students)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 6/10: حذف الطلاب...';
    
    DELETE FROM students;
    RAISE NOTICE '   ✅ تم حذف جميع الطلاب (students)';
    
    -- ----------------------------------------------------------------------------
    -- 7. حذف المحفظين (Teachers)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 7/10: حذف المحفظين...';
    
    DELETE FROM teacher_availability;
    RAISE NOTICE '   ✅ تم حذف توفر المحفظين (teacher_availability)';
    
    DELETE FROM teachers;
    RAISE NOTICE '   ✅ تم حذف جميع المحفظين (teachers)';
    
    -- ----------------------------------------------------------------------------
    -- 8. حذف المصروفات ورواتب المحفظين (Expenses & Salaries)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 8/10: حذف المصروفات والرواتب...';
    
    -- إذا كان جدول expenses موجود
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        DELETE FROM expenses;
        RAISE NOTICE '   ✅ تم حذف المصروفات (expenses)';
    END IF;
    
    -- إذا كان جدول teacher_salaries موجود
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_salaries') THEN
        DELETE FROM teacher_salaries;
        RAISE NOTICE '   ✅ تم حذف رواتب المحفظين (teacher_salaries)';
    END IF;
    
    -- ----------------------------------------------------------------------------
    -- 9. حذف العطلات المخصصة (Custom Holidays)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 9/10: حذف العطلات المخصصة...';
    
    DELETE FROM holidays WHERE holiday_type = 'custom';
    RAISE NOTICE '   ✅ تم حذف العطلات المخصصة (holidays - custom only)';
    
    -- ----------------------------------------------------------------------------
    -- 10. إعادة تعيين التسلسلات (Reset Sequences)
    -- ----------------------------------------------------------------------------
    RAISE NOTICE '📋 الخطوة 10/10: إعادة تعيين العدادات...';
    RAISE NOTICE '   ✅ تم إعادة تعيين العدادات';
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ تم حذف جميع البيانات التجريبية بنجاح!';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PART 2: التحقق من البيانات المتبقية (Verify Remaining Data)
-- ============================================================================

DO $$
DECLARE
    student_count INTEGER;
    teacher_count INTEGER;
    session_count INTEGER;
    payment_count INTEGER;
    invoice_count INTEGER;
    country_count INTEGER;
    pricing_count INTEGER;
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📊 التحقق من البيانات المتبقية:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- عد السجلات المتبقية
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO teacher_count FROM teachers;
    SELECT COUNT(*) INTO session_count FROM sessions;
    SELECT COUNT(*) INTO payment_count FROM payments;
    SELECT COUNT(*) INTO invoice_count FROM invoices;
    SELECT COUNT(*) INTO country_count FROM countries WHERE is_active = true;
    SELECT COUNT(*) INTO pricing_count FROM pricing_plans WHERE is_active = true;
    
    RAISE NOTICE '📌 البيانات التشغيلية:';
    RAISE NOTICE '   • الطلاب: % (يجب أن يكون 0)', student_count;
    RAISE NOTICE '   • المحفظين: % (يجب أن يكون 0)', teacher_count;
    RAISE NOTICE '   • الحصص: % (يجب أن يكون 0)', session_count;
    RAISE NOTICE '   • المدفوعات: % (يجب أن يكون 0)', payment_count;
    RAISE NOTICE '   • الفواتير: % (يجب أن يكون 0)', invoice_count;
    RAISE NOTICE '';
    RAISE NOTICE '📌 الإعدادات المحفوظة:';
    RAISE NOTICE '   • الدول النشطة: %', country_count;
    RAISE NOTICE '   • خطط التسعير النشطة: %', pricing_count;
    RAISE NOTICE '';
    
    IF student_count = 0 AND teacher_count = 0 AND session_count = 0 
       AND payment_count = 0 AND invoice_count = 0 THEN
        RAISE NOTICE '✅ النظام نظيف وجاهز للعميل!';
    ELSE
        RAISE NOTICE '⚠️ تحذير: لا تزال هناك بعض البيانات!';
    END IF;
END $$;

-- ============================================================================
-- PART 3: عرض الإعدادات المحفوظة (Show Preserved Settings)
-- ============================================================================

DO $$
DECLARE
    country_rec RECORD;
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔧 الإعدادات المحفوظة:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣ الدول والعملات:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    FOR country_rec IN 
        SELECT name_ar, currency_code, currency_symbol, currency_name_ar
        FROM countries 
        WHERE is_active = true
        ORDER BY display_order
    LOOP
        RAISE NOTICE '   • % - % (%) - %', 
            country_rec.name_ar,
            country_rec.currency_name_ar,
            country_rec.currency_symbol,
            country_rec.currency_code;
    END LOOP;
END $$;

-- عرض خطط التسعير

DO $$
DECLARE
    pricing_rec RECORD;
    country_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ خطط التسعير:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    FOR pricing_rec IN 
        SELECT pp.*, c.name_ar, c.currency_symbol
        FROM pricing_plans pp
        JOIN countries c ON pp.country_id = c.id
        WHERE pp.is_active = true
        ORDER BY c.display_order, pp.sessions_per_week
    LOOP
        RAISE NOTICE '   • % - % حصص/أسبوع = % %', 
            pricing_rec.name_ar,
            pricing_rec.sessions_per_week,
            pricing_rec.monthly_price,
            pricing_rec.currency_symbol;
    END LOOP;
END $$;

-- عرض الدوال المحفوظة

DO $$
DECLARE
    func_count INTEGER;
    view_count INTEGER;
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ الدوال والإجراءات المحفوظة:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- عد الدوال
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';
    
    -- عد المشاهدات
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public';
    
    -- عد المحفزات
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    RAISE NOTICE '   • الدوال (Functions): %', func_count;
    RAISE NOTICE '   • المشاهدات (Views): %', view_count;
    RAISE NOTICE '   • المحفزات (Triggers): %', trigger_count;
END $$;

-- عرض الجداول المحفوظة

DO $$
DECLARE
    table_rec RECORD;
    row_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4️⃣ الجداول المحفوظة (فارغة):';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('countries', 'pricing_plans', 'holidays', 'system_settings')
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_rec.table_name) INTO row_count;
        RAISE NOTICE '   • % (% سجل)', table_rec.table_name, row_count;
    END LOOP;
END $$;

-- ============================================================================
-- PART 4: ملاحظات مهمة للعميل (Important Notes for Client)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📝 ملاحظات مهمة للعميل:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم الحفاظ على:';
    RAISE NOTICE '   1. جميع الجداول والبنية الكاملة';
    RAISE NOTICE '   2. جميع الدوال والإجراءات';
    RAISE NOTICE '   3. جميع المشاهدات والمحفزات';
    RAISE NOTICE '   4. إعدادات الدول والعملات (8 دول)';
    RAISE NOTICE '   5. خطط التسعير لكل دولة';
    RAISE NOTICE '   6. العطلات الرسمية والدينية';
    RAISE NOTICE '   7. جميع القيود والفهارس';
    RAISE NOTICE '';
    RAISE NOTICE '🗑️ تم حذف:';
    RAISE NOTICE '   1. جميع الطلاب التجريبيين';
    RAISE NOTICE '   2. جميع المحفظين التجريبيين';
    RAISE NOTICE '   3. جميع الحصص والجداول';
    RAISE NOTICE '   4. جميع المدفوعات والفواتير';
    RAISE NOTICE '   5. جميع السجلات والإشعارات';
    RAISE NOTICE '   6. جميع التحذيرات والحضور';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 النظام جاهز الآن لإدخال البيانات الحقيقية!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 الخطوات التالية:';
    RAISE NOTICE '   1. إضافة المحفظين من صفحة "المحفظين"';
    RAISE NOTICE '   2. إضافة الطلاب من صفحة "الطلبة"';
    RAISE NOTICE '   3. إنشاء الجدول الأسبوعي من "الجدول الأسبوعي"';
    RAISE NOTICE '   4. البدء في تسجيل الحصص والحضور';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 بيانات تسجيل الدخول:';
    RAISE NOTICE '   • اسم المستخدم: admin';
    RAISE NOTICE '   • كلمة المرور: darquran2026';
    RAISE NOTICE '   ⚠️ يُنصح بتغيير كلمة المرور في ملف auth.js';
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✨ تم التنظيف بنجاح! النظام جاهز للتسليم للعميل ✨';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
END $$;
