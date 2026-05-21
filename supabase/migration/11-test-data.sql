-- ============================================================================
-- MIGRATION 11: TEST DATA
-- ============================================================================
-- Run this to insert sample data for testing the application
-- ============================================================================

-- 1. Insert Pricing Plans
INSERT INTO pricing_plans (id, country_id, sessions_per_week, monthly_price, plan_name, plan_name_ar, plan_name_en, session_duration)
VALUES 
('11111111-1111-1111-1111-111111111111', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), 2, 500, 'Basic Plan - 2 Sessions', 'باقة أساسية - حصتين', 'Basic Plan - 2 Sessions', 60),
('22222222-2222-2222-2222-222222222222', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), 3, 700, 'Standard Plan - 3 Sessions', 'باقة قياسية - 3 حصص', 'Standard Plan - 3 Sessions', 60)
ON CONFLICT DO NOTHING;

-- 2. Insert Teachers
INSERT INTO teachers (id, name, email, phone, gender, employment_type, status, session_rate)
VALUES 
('33333333-3333-3333-3333-333333333333', 'الشيخ أحمد محمود', 'ahmed@darquran.com', '01012345678', 'male', 'full_time', 'active', 50),
('44444444-4444-4444-4444-444444444444', 'الشيخة فاطمة حسن', 'fatima@darquran.com', '01087654321', 'female', 'part_time', 'active', 40)
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Students
INSERT INTO students (id, name, email, phone, gender, parent_name, parent_phone, country_id, pricing_plan_id, status, preferred_teacher_id)
VALUES 
('55555555-5555-5555-5555-555555555555', 'عمر خالد', 'omar@example.com', '01111111111', 'male', 'خالد أحمد', '01222222222', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), '11111111-1111-1111-1111-111111111111', 'active', '33333333-3333-3333-3333-333333333333'),
('66666666-6666-6666-6666-666666666666', 'مريم علي', 'maryam@example.com', '01133333333', 'female', 'علي محمد', '01244444444', (SELECT id FROM countries WHERE name = 'مصر' LIMIT 1), '22222222-2222-2222-2222-222222222222', 'active', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- 4. Insert Scheduled Sessions
INSERT INTO scheduled_sessions (id, student_id, teacher_id, day_of_week, session_time, session_duration, session_type, is_active)
VALUES 
('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 1, '16:00:00', 60, 'regular', true), -- Monday
('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 4, '16:00:00', 60, 'regular', true), -- Thursday
('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 0, '18:00:00', 60, 'regular', true) -- Sunday
ON CONFLICT DO NOTHING;

-- 5. Insert Sessions (Some completed, some scheduled)
INSERT INTO sessions (id, scheduled_session_id, student_id, teacher_id, session_date, session_time, status, surah_name, from_ayah, to_ayah, rating, teacher_notes)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', CURRENT_DATE - 3, '16:00:00', 'completed', 'البقرة', 1, 10, 5, 'ممتاز ومتميز في الحفظ'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', CURRENT_DATE, '16:00:00', 'scheduled', NULL, NULL, NULL, NULL, NULL),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, '18:00:00', 'completed', 'آل عمران', 1, 15, 4, 'تحتاج مراجعة بسيطة')
ON CONFLICT DO NOTHING;

-- 6. Insert Invoices
INSERT INTO invoices (id, invoice_number, student_id, month, year, billing_period_start, billing_period_end, base_amount, subtotal, total_amount, amount_due, currency_code, currency_symbol, expected_sessions, status, issue_date, due_date)
VALUES 
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'INV-TEST-001', '55555555-5555-5555-5555-555555555555', EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE, 500, 500, 500, 500, 'EGP', 'ج.م', 8, 'pending', CURRENT_DATE, CURRENT_DATE + 5),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'INV-TEST-002', '66666666-6666-6666-6666-666666666666', EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE)::DATE, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE, 700, 700, 700, 700, 'EGP', 'ج.م', 12, 'pending', CURRENT_DATE, CURRENT_DATE + 5)
ON CONFLICT DO NOTHING;
