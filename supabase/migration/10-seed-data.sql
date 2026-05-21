-- ============================================================================
-- MIGRATION 10: Seed Data & Table Comments
-- ============================================================================

-- Initial countries data
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, display_order) VALUES
('مصر', 'مصر', 'Egypt', 'EGP', 'ج.م', 'جنيه مصري', 'Egyptian Pound', 'EG', '+20', 1),
('السعودية', 'السعودية', 'Saudi Arabia', 'SAR', 'ر.س', 'ريال سعودي', 'Saudi Riyal', 'SA', '+966', 2),
('الإمارات', 'الإمارات', 'UAE', 'AED', 'د.إ', 'درهم إماراتي', 'UAE Dirham', 'AE', '+971', 3),
('الكويت', 'الكويت', 'Kuwait', 'KWD', 'د.ك', 'دينار كويتي', 'Kuwaiti Dinar', 'KW', '+965', 4),
('قطر', 'قطر', 'Qatar', 'QAR', 'ر.ق', 'ريال قطري', 'Qatari Riyal', 'QA', '+974', 5),
('البحرين', 'البحرين', 'Bahrain', 'BHD', 'د.ب', 'دينار بحريني', 'Bahraini Dinar', 'BH', '+973', 6),
('عمان', 'عمان', 'Oman', 'OMR', 'ر.ع', 'ريال عماني', 'Omani Rial', 'OM', '+968', 7),
('الأردن', 'الأردن', 'Jordan', 'JOD', 'د.أ', 'دينار أردني', 'Jordanian Dinar', 'JO', '+962', 8);

-- System settings
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

-- Table comments
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

SELECT 'Migration complete! All 25 tables, indexes, functions, triggers, views, RLS policies, and seed data created successfully.' as status;
