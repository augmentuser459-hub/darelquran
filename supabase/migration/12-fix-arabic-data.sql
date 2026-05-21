-- ============================================================================
-- FIX ARABIC ENCODING
-- ============================================================================

-- 1. مسح البيانات القديمة المشوهة
TRUNCATE TABLE countries CASCADE;
TRUNCATE TABLE system_settings CASCADE;
TRUNCATE TABLE teachers CASCADE;

-- 2. إعادة إدخال الدول باللغة العربية الصحيحة
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, display_order) VALUES
('مصر', 'مصر', 'Egypt', 'EGP', 'ج.م', 'جنيه مصري', 'Egyptian Pound', 'EG', '+20', 1),
('السعودية', 'السعودية', 'Saudi Arabia', 'SAR', 'ر.س', 'ريال سعودي', 'Saudi Riyal', 'SA', '+966', 2),
('الإمارات', 'الإمارات', 'UAE', 'AED', 'د.إ', 'درهم إماراتي', 'UAE Dirham', 'AE', '+971', 3),
('الكويت', 'الكويت', 'Kuwait', 'KWD', 'د.ك', 'دينار كويتي', 'Kuwaiti Dinar', 'KW', '+965', 4),
('قطر', 'قطر', 'Qatar', 'QAR', 'ر.ق', 'ريال قطري', 'Qatari Riyal', 'QA', '+974', 5),
('البحرين', 'البحرين', 'Bahrain', 'BHD', 'د.ب', 'دينار بحريني', 'Bahraini Dinar', 'BH', '+973', 6),
('عمان', 'عمان', 'Oman', 'OMR', 'ر.ع', 'ريال عماني', 'Omani Rial', 'OM', '+968', 7),
('الأردن', 'الأردن', 'Jordan', 'JOD', 'د.أ', 'دينار أردني', 'Jordanian Dinar', 'JO', '+962', 8);

-- 3. إعادة إدخال إعدادات النظام باللغة العربية الصحيحة
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('invoice_due_day', '5', 'number', 'billing', 'يوم استحقاق الفاتورة من كل شهر'),
('max_excuses_per_month', '2', 'number', 'sessions', 'عدد الاعتذارات المسموح بها شهرياً'),
('session_duration', '60', 'number', 'sessions', 'مدة الحصة الافتراضية بالدقائق'),
('auto_generate_invoices', 'true', 'boolean', 'billing', 'إنشاء الفواتير تلقائياً في بداية كل شهر'),
('send_payment_reminders', 'true', 'boolean', 'notifications', 'إرسال تذكيرات الدفع'),
('reminder_days_before_due', '3', 'number', 'notifications', 'عدد الأيام قبل الاستحقاق لإرسال التذكير'),
('system_timezone', 'Africa/Cairo', 'string', 'general', 'المنطقة الزمنية للنظام'),
('currency_default', 'EGP', 'string', 'billing', 'العملة الافتراضية'),
('academic_year_start_month', '9', 'number', 'general', 'شهر بداية السنة الدراسية'),
('enable_online_sessions', 'true', 'boolean', 'sessions', 'تفعيل الحصص الأونلاين');

-- 4. إصلاح تعليقات الجداول (Table Comments)
COMMENT ON TABLE countries IS 'جدول الدول والعملات المدعومة في النظام';
COMMENT ON TABLE pricing_plans IS 'أنظمة التسعير المختلفة حسب الدولة وعدد الحصص';
COMMENT ON TABLE teachers IS 'بيانات المحفظين والمعلمين';
COMMENT ON TABLE students IS 'بيانات الطلبة مع نظام الاعتذارات والتحذيرات';
COMMENT ON TABLE scheduled_sessions IS 'الجدول الأسبوعي الثابت للحصص';
COMMENT ON TABLE sessions IS 'الحصص الفعلية مع حالتها وتقييمها';
COMMENT ON TABLE attendance_log IS 'سجل تفصيلي لكل عملية تسجيل حضور';
COMMENT ON TABLE invoices IS 'الفواتير الشهرية للطلبة';
COMMENT ON TABLE payments IS 'سجل جميع المدفوعات';
COMMENT ON TABLE warnings IS 'التحذيرات الصادرة للطلبة';
COMMENT ON TABLE holidays IS 'أيام العطلات الرسمية';
COMMENT ON TABLE audit_log IS 'سجل جميع التعديلات على البيانات الحساسة';
COMMENT ON TABLE system_settings IS 'إعدادات النظام العامة';
COMMENT ON TABLE notifications IS 'الإشعارات المرسلة للمستخدمين';
COMMENT ON TABLE student_progress IS 'تتبع تقدم الطالب في الحفظ';
COMMENT ON TABLE teacher_availability IS 'أوقات توفر المحفظين';
COMMENT ON TABLE expenses IS 'مصروفات الدار';
COMMENT ON TABLE teacher_salaries IS 'رواتب المحفظين الشهرية';
COMMENT ON TABLE treasury_transactions IS 'Tracks all treasury transactions (deposits, withdrawals, salary payments)';
COMMENT ON TABLE treasury_transfers IS 'Tracks currency transfers between different treasuries';
COMMENT ON COLUMN teachers.session_rate IS 'سعر الحصة الواحدة للمحفظ';
COMMENT ON COLUMN pricing_plans.session_duration IS 'مدة الحصة بالدقائق (30، 45، 60، 90)';

-- ============================================================================
-- 5. إعادة إدخال بيانات الاختبار المشوهة
-- ============================================================================

INSERT INTO pricing_plans (id, country_id, sessions_per_week, monthly_price, plan_name, plan_name_ar, plan_name_en, session_duration)
VALUES 
('11111111-1111-1111-1111-111111111111', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), 2, 500, 'Basic Plan - 2 Sessions', 'باقة أساسية - حصتين', 'Basic Plan - 2 Sessions', 60),
('22222222-2222-2222-2222-222222222222', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), 3, 700, 'Standard Plan - 3 Sessions', 'باقة قياسية - 3 حصص', 'Standard Plan - 3 Sessions', 60)
ON CONFLICT DO NOTHING;

INSERT INTO teachers (id, name, email, phone, gender, employment_type, status, session_rate)
VALUES 
('33333333-3333-3333-3333-333333333333', 'الشيخ أحمد محمود', 'ahmed@darquran.com', '01012345678', 'male', 'full_time', 'active', 50),
('44444444-4444-4444-4444-444444444444', 'الشيخة فاطمة حسن', 'fatima@darquran.com', '01087654321', 'female', 'part_time', 'active', 40)
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (id, name, email, phone, gender, parent_name, parent_phone, country_id, pricing_plan_id, status, preferred_teacher_id)
VALUES 
('55555555-5555-5555-5555-555555555555', 'عمر خالد', 'omar@example.com', '01111111111', 'male', 'خالد أحمد', '01222222222', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), '11111111-1111-1111-1111-111111111111', 'active', '33333333-3333-3333-3333-333333333333'),
('66666666-6666-6666-6666-666666666666', 'مريم علي', 'maryam@example.com', '01133333333', 'female', 'علي محمد', '01244444444', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), '22222222-2222-2222-2222-222222222222', 'active', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

INSERT INTO scheduled_sessions (id, student_id, teacher_id, day_of_week, session_time, session_duration, session_type, is_active)
VALUES 
('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 1, '16:00:00', 60, 'regular', true), 
('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 4, '16:00:00', 60, 'regular', true), 
('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 0, '18:00:00', 60, 'regular', true) 
ON CONFLICT DO NOTHING;

INSERT INTO sessions (id, scheduled_session_id, student_id, teacher_id, session_date, session_time, status, surah_name, from_ayah, to_ayah, rating, teacher_notes)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', CURRENT_DATE - 3, '16:00:00', 'completed', 'البقرة', 1, 10, 5, 'ممتاز ومتميز في الحفظ'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', CURRENT_DATE, '16:00:00', 'scheduled', NULL, NULL, NULL, NULL, NULL),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, '18:00:00', 'completed', 'آل عمران', 1, 15, 4, 'تحتاج مراجعة بسيطة')
ON CONFLICT DO NOTHING;

INSERT INTO invoices (id, invoice_number, student_id, month, year, billing_period_start, billing_period_end, base_amount, subtotal, total_amount, amount_due, currency_code, currency_symbol, expected_sessions, status, issue_date, due_date)
VALUES 
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'INV-TEST-001', '55555555-5555-5555-5555-555555555555', EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE, 500, 500, 500, 500, 'EGP', 'ج.م', 8, 'pending', CURRENT_DATE, CURRENT_DATE + 5),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'INV-TEST-002', '66666666-6666-6666-6666-666666666666', EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE, 700, 700, 700, 700, 'EGP', 'ج.م', 12, 'pending', CURRENT_DATE, CURRENT_DATE + 5)
ON CONFLICT DO NOTHING;
