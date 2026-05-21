-- ============================================================================
-- MIGRATION 01: Extensions & Setup
-- ============================================================================
-- Run this FIRST on a fresh Supabase instance
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ============================================================================
-- MIGRATION 02: Sequences
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS warning_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS payment_seq START 1;
CREATE SEQUENCE IF NOT EXISTS system_keepalive_id_seq START 1;
-- ============================================================================
-- MIGRATION 03: All Tables (in dependency order)
-- ============================================================================

-- 1. countries (no dependencies)
CREATE TABLE public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    name_ar VARCHAR NOT NULL,
    name_en VARCHAR NOT NULL,
    currency_code VARCHAR NOT NULL CHECK (LENGTH(currency_code) = 3),
    currency_symbol VARCHAR NOT NULL,
    currency_name_ar VARCHAR NOT NULL,
    currency_name_en VARCHAR NOT NULL,
    country_code VARCHAR,
    phone_code VARCHAR,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. pricing_plans (depends on countries)
CREATE TABLE public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week >= 1 AND sessions_per_week <= 20),
    monthly_price NUMERIC CHECK (monthly_price >= 0),
    plan_name VARCHAR,
    plan_name_ar VARCHAR,
    plan_name_en VARCHAR,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    discount_percentage NUMERIC DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    session_duration INTEGER DEFAULT 60 CHECK (session_duration > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. teachers (no dependencies)
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    name_ar VARCHAR,
    name_en VARCHAR,
    phone VARCHAR,
    phone_secondary VARCHAR,
    email VARCHAR UNIQUE,
    gender VARCHAR CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    nationality VARCHAR,
    address TEXT,
    hire_date DATE DEFAULT CURRENT_DATE,
    termination_date DATE,
    employment_type VARCHAR CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'volunteer')),
    qualifications TEXT,
    certifications TEXT,
    specialization TEXT,
    experience_years INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on_leave', 'terminated')),
    salary_amount NUMERIC,
    salary_currency VARCHAR,
    payment_method VARCHAR,
    bank_account VARCHAR,
    overall_rating NUMERIC CHECK (overall_rating >= 0 AND overall_rating <= 5),
    total_ratings INTEGER DEFAULT 0,
    notes TEXT,
    profile_image_url TEXT,
    session_rate NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. students (depends on countries, pricing_plans, teachers)
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    name_ar VARCHAR,
    name_en VARCHAR,
    phone VARCHAR,
    phone_secondary VARCHAR,
    email VARCHAR,
    gender VARCHAR CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    age INTEGER,
    parent_name VARCHAR,
    parent_phone VARCHAR,
    parent_phone_secondary VARCHAR,
    parent_email VARCHAR,
    parent_relationship VARCHAR,
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    city VARCHAR,
    address TEXT,
    timezone VARCHAR,
    pricing_plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
    custom_monthly_price NUMERIC,
    discount_percentage NUMERIC DEFAULT 0,
    discount_reason TEXT,
    excuse_balance INTEGER DEFAULT 5 CHECK (excuse_balance >= 0),
    max_excuses_per_month INTEGER DEFAULT 5,
    warnings_count INTEGER DEFAULT 0 CHECK (warnings_count >= 0),
    current_level VARCHAR,
    memorization_progress TEXT,
    current_surah VARCHAR,
    current_page INTEGER,
    total_pages_memorized INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated', 'on_hold', 'transferred')),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    last_session_date DATE,
    next_session_date DATE,
    overall_performance NUMERIC CHECK (overall_performance >= 0 AND overall_performance <= 5),
    attendance_rate NUMERIC DEFAULT 100,
    preferred_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    preferred_session_time TIME,
    special_needs TEXT,
    medical_conditions TEXT,
    emergency_contact VARCHAR,
    emergency_phone VARCHAR,
    notes TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. scheduled_sessions (depends on students, teachers)
CREATE TABLE public.scheduled_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    session_time TIME NOT NULL,
    session_duration INTEGER DEFAULT 60 CHECK (session_duration > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    session_type VARCHAR DEFAULT 'regular' CHECK (session_type IN ('regular', 'intensive', 'review', 'exam')),
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT true,
    room_number VARCHAR,
    meeting_link TEXT,
    is_online BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. sessions (depends on scheduled_sessions, students, teachers, self-ref)
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_session_id UUID REFERENCES public.scheduled_sessions(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    session_duration INTEGER DEFAULT 60,
    actual_duration INTEGER CHECK (actual_duration IS NULL OR actual_duration > 0),
    status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'student_excused', 'teacher_cancelled', 'student_absent', 'teacher_absent', 'rescheduled', 'cancelled')),
    is_makeup BOOLEAN DEFAULT false,
    makeup_for_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    session_type VARCHAR DEFAULT 'regular' CHECK (session_type IN ('regular', 'makeup', 'trial', 'assessment', 'review')),
    student_progress TEXT,
    pages_memorized INTEGER DEFAULT 0,
    pages_reviewed INTEGER DEFAULT 0,
    mistakes_count INTEGER DEFAULT 0,
    surah_name VARCHAR,
    from_page INTEGER,
    to_page INTEGER,
    from_ayah INTEGER,
    to_ayah INTEGER,
    teacher_notes TEXT,
    student_notes TEXT,
    admin_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    performance_level VARCHAR CHECK (performance_level IN ('excellent', 'good', 'average', 'needs_improvement', 'poor')),
    student_attendance VARCHAR CHECK (student_attendance IN ('present', 'late', 'absent', 'excused')),
    teacher_attendance VARCHAR CHECK (teacher_attendance IN ('present', 'late', 'absent')),
    student_late_minutes INTEGER DEFAULT 0,
    teacher_late_minutes INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    meeting_link TEXT,
    recording_link TEXT,
    attachments JSONB,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    rescheduled_to_date DATE,
    rescheduled_to_time TIME,
    completed_by VARCHAR,
    cancelled_by VARCHAR,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. attendance_log (depends on sessions, students, teachers)
CREATE TABLE public.attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    attendance_type VARCHAR NOT NULL CHECK (attendance_type IN ('present', 'excused', 'absent', 'late', 'left_early')),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    logged_by VARCHAR CHECK (logged_by IN ('admin', 'teacher', 'student', 'system', 'auto')),
    logged_by_user_id UUID,
    reason TEXT,
    excuse_document_url TEXT,
    is_excuse_approved BOOLEAN,
    approved_by VARCHAR,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    ip_address VARCHAR,
    device_info TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. invoices (depends on students)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    base_amount NUMERIC NOT NULL CHECK (base_amount >= 0),
    discount_amount NUMERIC DEFAULT 0 CHECK (discount_amount >= 0),
    discount_percentage NUMERIC DEFAULT 0,
    discount_reason TEXT,
    additional_charges NUMERIC DEFAULT 0 CHECK (additional_charges >= 0),
    additional_charges_description TEXT,
    tax_amount NUMERIC DEFAULT 0 CHECK (tax_amount >= 0),
    tax_percentage NUMERIC DEFAULT 0,
    subtotal NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC DEFAULT 0 CHECK (amount_paid >= 0),
    amount_due NUMERIC NOT NULL,
    currency_code VARCHAR NOT NULL,
    currency_symbol VARCHAR NOT NULL,
    expected_sessions INTEGER NOT NULL CHECK (expected_sessions >= 0),
    completed_sessions INTEGER DEFAULT 0 CHECK (completed_sessions >= 0),
    cancelled_by_teacher INTEGER DEFAULT 0 CHECK (cancelled_by_teacher >= 0),
    cancelled_by_student INTEGER DEFAULT 0 CHECK (cancelled_by_student >= 0),
    absent_sessions INTEGER DEFAULT 0 CHECK (absent_sessions >= 0),
    makeup_sessions INTEGER DEFAULT 0 CHECK (makeup_sessions >= 0),
    status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded', 'disputed')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    sent_date DATE,
    paid_date DATE,
    last_payment_date DATE,
    payment_terms TEXT,
    payment_instructions TEXT,
    notes TEXT,
    internal_notes TEXT,
    terms_and_conditions TEXT,
    created_by VARCHAR,
    approved_by VARCHAR,
    approved_at TIMESTAMPTZ,
    pdf_url TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. payments (depends on invoices, students)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency_code VARCHAR NOT NULL,
    currency_symbol VARCHAR NOT NULL,
    payment_method VARCHAR NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'paypal', 'stripe', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'instapay', 'fawry', 'check', 'other')),
    transaction_reference VARCHAR,
    transaction_id VARCHAR,
    payment_gateway VARCHAR,
    gateway_response JSONB,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_time TIME DEFAULT CURRENT_TIME,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed')),
    bank_name VARCHAR,
    account_number VARCHAR,
    account_holder_name VARCHAR,
    check_number VARCHAR,
    check_date DATE,
    check_bank VARCHAR,
    received_by VARCHAR,
    received_by_user_id UUID,
    processed_by VARCHAR,
    verified_by VARCHAR,
    verified_at TIMESTAMPTZ,
    refund_amount NUMERIC DEFAULT 0,
    refund_date DATE,
    refund_reason TEXT,
    refunded_by VARCHAR,
    notes TEXT,
    receipt_url TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. warnings (depends on students)
CREATE TABLE public.warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warning_number VARCHAR NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    warning_type VARCHAR NOT NULL CHECK (warning_type IN ('excessive_excuses', 'excessive_absences', 'payment_overdue', 'behavior', 'performance', 'late_arrival', 'violation', 'other')),
    severity VARCHAR DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    action_taken TEXT,
    recommended_action TEXT,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'escalated', 'dismissed')),
    issued_by VARCHAR,
    issued_by_user_id UUID,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_by VARCHAR,
    acknowledged_at TIMESTAMPTZ,
    resolved_by VARCHAR,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    parent_notified BOOLEAN DEFAULT false,
    parent_notified_at TIMESTAMPTZ,
    notification_method VARCHAR,
    notes TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. holidays (depends on countries)
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    name_ar VARCHAR,
    name_en VARCHAR,
    description TEXT,
    holiday_date DATE NOT NULL,
    end_date DATE,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    holiday_type VARCHAR CHECK (holiday_type IN ('national', 'religious', 'school', 'custom')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR,
    is_working_day BOOLEAN DEFAULT false,
    affects_billing BOOLEAN DEFAULT true,
    color VARCHAR,
    notes TEXT,
    created_by VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. audit_log (no dependencies)
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB,
    changed_by VARCHAR,
    changed_by_user_id UUID,
    user_role VARCHAR,
    ip_address VARCHAR,
    user_agent TEXT,
    session_id VARCHAR,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    notes TEXT
);

-- 13. system_settings (no dependencies)
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'date', 'time')),
    category VARCHAR,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
    default_value TEXT,
    validation_rules JSONB,
    display_order INTEGER DEFAULT 0,
    updated_by VARCHAR,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. notifications (no dependencies)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR NOT NULL CHECK (recipient_type IN ('student', 'teacher', 'admin', 'parent', 'all')),
    recipient_id UUID,
    recipient_email VARCHAR,
    recipient_phone VARCHAR,
    notification_type VARCHAR NOT NULL CHECK (notification_type IN ('session_reminder', 'session_cancelled', 'session_rescheduled', 'payment_due', 'payment_received', 'payment_overdue', 'warning_issued', 'excuse_limit_reached', 'invoice_generated', 'general_announcement', 'system_alert', 'other')),
    priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    message_ar TEXT,
    message_en TEXT,
    send_email BOOLEAN DEFAULT false,
    send_sms BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT false,
    send_whatsapp BOOLEAN DEFAULT false,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    email_status VARCHAR,
    sms_status VARCHAR,
    push_status VARCHAR,
    whatsapp_status VARCHAR,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    related_entity_type VARCHAR,
    related_entity_id UUID,
    metadata JSONB,
    attachments JSONB,
    created_by VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. student_progress (depends on students, sessions, teachers)
CREATE TABLE public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
    progress_type VARCHAR CHECK (progress_type IN ('memorization', 'review', 'recitation', 'tajweed', 'assessment')),
    surah_number INTEGER CHECK (surah_number >= 1 AND surah_number <= 114),
    surah_name VARCHAR,
    from_ayah INTEGER,
    to_ayah INTEGER,
    from_page INTEGER,
    to_page INTEGER,
    juz_number INTEGER CHECK (juz_number >= 1 AND juz_number <= 30),
    mastery_level VARCHAR CHECK (mastery_level IN ('excellent', 'good', 'average', 'needs_work', 'poor')),
    accuracy_percentage NUMERIC CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
    fluency_rating INTEGER CHECK (fluency_rating >= 1 AND fluency_rating <= 5),
    tajweed_rating INTEGER CHECK (tajweed_rating >= 1 AND tajweed_rating <= 5),
    mistakes_count INTEGER DEFAULT 0,
    mistake_types JSONB,
    teacher_notes TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    homework_assigned TEXT,
    is_completed BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    recording_url TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. teacher_availability (depends on teachers)
CREATE TABLE public.teacher_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    availability_type VARCHAR CHECK (availability_type IN ('regular', 'temporary', 'exception')),
    exception_date DATE,
    exception_start_date DATE,
    exception_end_date DATE,
    max_students_per_slot INTEGER DEFAULT 1,
    slot_duration INTEGER DEFAULT 60,
    break_duration INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. student_documents (depends on students)
CREATE TABLE public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    document_type VARCHAR NOT NULL CHECK (document_type IN ('id_card', 'birth_certificate', 'photo', 'medical_report', 'enrollment_form', 'parent_id', 'contract', 'certificate', 'report_card', 'other')),
    document_name VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR,
    file_size INTEGER,
    description TEXT,
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR,
    verified_at TIMESTAMPTZ,
    uploaded_by VARCHAR,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. teacher_documents (depends on teachers)
CREATE TABLE public.teacher_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    document_type VARCHAR NOT NULL CHECK (document_type IN ('id_card', 'cv', 'certificate', 'degree', 'ijazah', 'contract', 'background_check', 'photo', 'other')),
    document_name VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR,
    file_size INTEGER,
    description TEXT,
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR,
    verified_at TIMESTAMPTZ,
    uploaded_by VARCHAR,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. expense_categories (self-referencing)
CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    name_ar VARCHAR,
    name_en VARCHAR,
    description TEXT,
    parent_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    category_type VARCHAR CHECK (category_type IN ('operational', 'administrative', 'marketing', 'salaries', 'utilities', 'other')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. expenses (depends on expense_categories)
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number VARCHAR NOT NULL UNIQUE,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency_code VARCHAR NOT NULL,
    currency_symbol VARCHAR,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
    vendor_name VARCHAR,
    vendor_contact TEXT,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
    requested_by VARCHAR,
    approved_by VARCHAR,
    approved_at TIMESTAMPTZ,
    paid_by VARCHAR,
    paid_at TIMESTAMPTZ,
    invoice_number VARCHAR,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR,
    notes TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. teacher_salaries (depends on teachers)
CREATE TABLE public.teacher_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_number VARCHAR NOT NULL UNIQUE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    base_salary NUMERIC NOT NULL CHECK (base_salary >= 0),
    bonus_amount NUMERIC DEFAULT 0 CHECK (bonus_amount >= 0),
    bonus_reason TEXT,
    deduction_amount NUMERIC DEFAULT 0 CHECK (deduction_amount >= 0),
    deduction_reason TEXT,
    overtime_amount NUMERIC DEFAULT 0 CHECK (overtime_amount >= 0),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    currency_code VARCHAR NOT NULL,
    currency_symbol VARCHAR,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    working_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'on_hold')),
    payment_date DATE,
    approved_by VARCHAR,
    approved_at TIMESTAMPTZ,
    paid_by VARCHAR,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR,
    transaction_reference VARCHAR,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. communication_log (no dependencies)
CREATE TABLE public.communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_type VARCHAR CHECK (contact_type IN ('student', 'parent', 'teacher', 'other')),
    contact_id UUID,
    contact_name VARCHAR,
    contact_phone VARCHAR,
    contact_email VARCHAR,
    communication_type VARCHAR CHECK (communication_type IN ('phone_call', 'email', 'sms', 'whatsapp', 'meeting', 'video_call', 'other')),
    direction VARCHAR CHECK (direction IN ('inbound', 'outbound')),
    subject VARCHAR,
    message TEXT,
    status VARCHAR DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    initiated_by VARCHAR,
    handled_by VARCHAR,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    related_entity_type VARCHAR,
    related_entity_id UUID,
    notes TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. treasury_transactions (no dependencies)
CREATE TABLE public.treasury_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR NOT NULL UNIQUE,
    currency_code VARCHAR NOT NULL,
    transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'salary_payment', 'payment_received')),
    amount NUMERIC NOT NULL,
    category VARCHAR,
    description TEXT,
    reference_type VARCHAR,
    reference_id UUID,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. treasury_transfers (no dependencies)
CREATE TABLE public.treasury_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR NOT NULL UNIQUE,
    from_currency VARCHAR NOT NULL,
    to_currency VARCHAR NOT NULL,
    from_amount NUMERIC NOT NULL,
    to_amount NUMERIC NOT NULL,
    exchange_rate NUMERIC NOT NULL,
    transfer_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. system_keepalive (no dependencies)
CREATE TABLE public.system_keepalive (
    id INTEGER NOT NULL DEFAULT nextval('system_keepalive_id_seq'),
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    ping_count INTEGER DEFAULT 0,
    notes TEXT DEFAULT 'Auto keepalive ping',
    CONSTRAINT system_keepalive_pkey PRIMARY KEY (id)
);
-- ============================================================================
-- MIGRATION 04: Indexes
-- ============================================================================

-- Students
CREATE INDEX idx_students_status ON students(status) WHERE status = 'active';
CREATE INDEX idx_students_country ON students(country_id);
CREATE INDEX idx_students_pricing_plan ON students(pricing_plan_id);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);
CREATE INDEX idx_students_warnings ON students(warnings_count) WHERE warnings_count > 0;

-- Teachers
CREATE INDEX idx_teachers_status ON teachers(status) WHERE status = 'active';
CREATE INDEX idx_teachers_name ON teachers(name);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_phone ON teachers(phone);

-- Sessions
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_scheduled ON sessions(scheduled_session_id);
CREATE INDEX idx_sessions_date_status ON sessions(session_date, status);
CREATE INDEX idx_sessions_makeup ON sessions(is_makeup) WHERE is_makeup = true;
CREATE INDEX idx_sessions_completed ON sessions(completed_at) WHERE status = 'completed';

-- Scheduled Sessions
CREATE INDEX idx_scheduled_sessions_student ON scheduled_sessions(student_id);
CREATE INDEX idx_scheduled_sessions_teacher ON scheduled_sessions(teacher_id);
CREATE INDEX idx_scheduled_sessions_active ON scheduled_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_scheduled_sessions_day_time ON scheduled_sessions(day_of_week, session_time);

-- Invoices
CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_student_period ON invoices(student_id, year, month);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_overdue ON invoices(status, due_date) WHERE status = 'overdue';
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Payments
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_number ON payments(payment_number);

-- Attendance Log
CREATE INDEX idx_attendance_session ON attendance_log(session_id);
CREATE INDEX idx_attendance_student ON attendance_log(student_id);
CREATE INDEX idx_attendance_teacher ON attendance_log(teacher_id);
CREATE INDEX idx_attendance_type ON attendance_log(attendance_type);
CREATE INDEX idx_attendance_logged_at ON attendance_log(logged_at);

-- Warnings
CREATE INDEX idx_warnings_student ON warnings(student_id);
CREATE INDEX idx_warnings_status ON warnings(status);
CREATE INDEX idx_warnings_type ON warnings(warning_type);
CREATE INDEX idx_warnings_issued_at ON warnings(issued_at);
CREATE INDEX idx_warnings_active ON warnings(status) WHERE status = 'active';

-- Holidays
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
CREATE INDEX idx_holidays_country ON holidays(country_id);
CREATE INDEX idx_holidays_recurring ON holidays(is_recurring) WHERE is_recurring = true;

-- Audit Log
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_action ON audit_log(action);

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at);
CREATE INDEX idx_notifications_sent ON notifications(sent_at);

-- Student Progress
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_session ON student_progress(session_id);
CREATE INDEX idx_student_progress_date ON student_progress(progress_date);
CREATE INDEX idx_student_progress_surah ON student_progress(surah_number);

-- Teacher Availability
CREATE INDEX idx_teacher_availability_teacher ON teacher_availability(teacher_id);
CREATE INDEX idx_teacher_availability_day ON teacher_availability(day_of_week);
CREATE INDEX idx_teacher_availability_available ON teacher_availability(is_available) WHERE is_available = true;

-- Expenses
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_number ON expenses(expense_number);

-- Teacher Salaries
CREATE INDEX idx_teacher_salaries_teacher ON teacher_salaries(teacher_id);
CREATE INDEX idx_teacher_salaries_period ON teacher_salaries(year, month);
CREATE INDEX idx_teacher_salaries_status ON teacher_salaries(status);

-- Communication Log
CREATE INDEX idx_communication_contact ON communication_log(contact_type, contact_id);
CREATE INDEX idx_communication_type ON communication_log(communication_type);
CREATE INDEX idx_communication_date ON communication_log(created_at);

-- Treasury Transactions
CREATE INDEX idx_treasury_transactions_date ON treasury_transactions(transaction_date DESC);
CREATE INDEX idx_treasury_transactions_currency ON treasury_transactions(currency_code);
CREATE INDEX idx_treasury_transactions_type ON treasury_transactions(transaction_type);
CREATE INDEX idx_treasury_transactions_number ON treasury_transactions(transaction_number);
CREATE INDEX idx_treasury_transactions_reference ON treasury_transactions(reference_type, reference_id);

-- Treasury Transfers
CREATE INDEX idx_treasury_transfers_date ON treasury_transfers(transfer_date DESC);
CREATE INDEX idx_treasury_transfers_from_currency ON treasury_transfers(from_currency);
CREATE INDEX idx_treasury_transfers_to_currency ON treasury_transfers(to_currency);
CREATE INDEX idx_treasury_transfers_number ON treasury_transfers(transfer_number);
-- ============================================================================
-- MIGRATION 05: Functions
-- ============================================================================

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. handle_student_excuse
CREATE OR REPLACE FUNCTION handle_student_excuse()
RETURNS TRIGGER AS $$
DECLARE
    current_excuse_balance INTEGER;
    student_name VARCHAR(200);
BEGIN
    IF NEW.status = 'student_excused' AND (OLD.status IS NULL OR OLD.status != 'student_excused') THEN
        UPDATE students 
        SET excuse_balance = GREATEST(excuse_balance - 1, 0),
            updated_at = NOW()
        WHERE id = NEW.student_id
        RETURNING excuse_balance, name INTO current_excuse_balance, student_name;
        
        IF current_excuse_balance <= 0 THEN
            INSERT INTO warnings (
                warning_number, student_id, warning_type, severity,
                title, reason, issued_by, status
            ) VALUES (
                'WRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('warning_seq')::TEXT, 6, '0'),
                NEW.student_id, 'excessive_excuses', 'high',
                'ØªØ¬Ø§ÙˆØ² Ø¹Ø¯Ø¯ Ø§Ù„Ø§Ø¹ØªØ°Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³Ù…ÙˆØ­',
                'ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø·Ø§Ù„Ø¨ ' || student_name || ' Ø¹Ø¯Ø¯ Ø§Ù„Ø§Ø¹ØªØ°Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡Ø§ (' || 
                (SELECT max_excuses_per_month FROM students WHERE id = NEW.student_id) || ' Ø§Ø¹ØªØ°Ø§Ø± Ø´Ù‡Ø±ÙŠØ§Ù‹)',
                'system', 'active'
            );
            
            UPDATE students 
            SET warnings_count = warnings_count + 1, updated_at = NOW()
            WHERE id = NEW.student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. update_invoice_sessions_count
CREATE OR REPLACE FUNCTION update_invoice_sessions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE invoices
        SET completed_sessions = completed_sessions + 1, updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND month = EXTRACT(MONTH FROM NEW.session_date)
        AND year = EXTRACT(YEAR FROM NEW.session_date);
    END IF;
    
    IF NEW.status = 'teacher_cancelled' AND (OLD.status IS NULL OR OLD.status != 'teacher_cancelled') THEN
        UPDATE invoices
        SET cancelled_by_teacher = cancelled_by_teacher + 1, updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND month = EXTRACT(MONTH FROM NEW.session_date)
        AND year = EXTRACT(YEAR FROM NEW.session_date);
    END IF;
    
    IF NEW.status = 'student_absent' AND (OLD.status IS NULL OR OLD.status != 'student_absent') THEN
        UPDATE invoices
        SET absent_sessions = absent_sessions + 1, updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND month = EXTRACT(MONTH FROM NEW.session_date)
        AND year = EXTRACT(YEAR FROM NEW.session_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. update_invoice_status_on_payment
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10, 2);
    invoice_total DECIMAL(10, 2);
    invoice_status VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments WHERE invoice_id = NEW.invoice_id AND status = 'completed';
    
    SELECT total_amount INTO invoice_total
    FROM invoices WHERE id = NEW.invoice_id;
    
    IF total_paid >= invoice_total THEN
        invoice_status := 'paid';
    ELSIF total_paid > 0 THEN
        invoice_status := 'partial';
    ELSE
        invoice_status := 'pending';
    END IF;
    
    UPDATE invoices 
    SET status = invoice_status,
        amount_paid = total_paid,
        amount_due = invoice_total - total_paid,
        paid_date = CASE WHEN invoice_status = 'paid' THEN CURRENT_DATE ELSE paid_date END,
        last_payment_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. log_audit_trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB := '{}'::JSONB;
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::JSONB, current_user);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        FOR field_name IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
            old_value := (to_jsonb(OLD) ->> field_name);
            new_value := (to_jsonb(NEW) ->> field_name);
            IF old_value IS DISTINCT FROM new_value THEN
                changed_fields := changed_fields || jsonb_build_object(
                    field_name, jsonb_build_object('old', old_value, 'new', new_value)
                );
            END IF;
        END LOOP;
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_fields, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, changed_fields, current_user);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::JSONB, current_user);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. generate_invoice_number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                             LPAD(NEXTVAL('invoice_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. generate_payment_number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                             LPAD(NEXTVAL('payment_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. calculate_student_attendance_rate
CREATE OR REPLACE FUNCTION calculate_student_attendance_rate(student_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    attendance_rate DECIMAL(5, 2);
BEGIN
    SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'student_absent')), 0) * 100, 2
    ) INTO attendance_rate
    FROM sessions WHERE student_id = student_uuid;
    RETURN COALESCE(attendance_rate, 100);
END;
$$ LANGUAGE plpgsql;

-- 9. update_student_attendance_rate
CREATE OR REPLACE FUNCTION update_student_attendance_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'student_absent') THEN
        UPDATE students
        SET attendance_rate = calculate_student_attendance_rate(NEW.student_id),
            last_session_date = NEW.session_date, updated_at = NOW()
        WHERE id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. generate_weekly_sessions
CREATE OR REPLACE FUNCTION generate_weekly_sessions(
    start_date DATE DEFAULT CURRENT_DATE,
    weeks_count INTEGER DEFAULT 4
)
RETURNS TABLE (sessions_created INTEGER, sessions_skipped INTEGER, message TEXT) AS $$
DECLARE
    created_count INTEGER := 0;
    skipped_count INTEGER := 0;
    schedule_record RECORD;
    target_date DATE;
    week_num INTEGER;
    is_holiday BOOLEAN;
BEGIN
    FOR schedule_record IN 
        SELECT * FROM scheduled_sessions 
        WHERE is_active = true AND (end_date IS NULL OR end_date >= start_date)
    LOOP
        FOR week_num IN 0..(weeks_count - 1) LOOP
            target_date := start_date + (week_num * 7) + schedule_record.day_of_week;
            SELECT EXISTS(SELECT 1 FROM holidays WHERE holiday_date = target_date) INTO is_holiday;
            IF NOT is_holiday THEN
                BEGIN
                    INSERT INTO sessions (
                        scheduled_session_id, student_id, teacher_id,
                        session_date, session_time, session_duration, status
                    ) VALUES (
                        schedule_record.id, schedule_record.student_id, schedule_record.teacher_id,
                        target_date, schedule_record.session_time, schedule_record.session_duration, 'scheduled'
                    );
                    created_count := created_count + 1;
                EXCEPTION WHEN unique_violation THEN
                    skipped_count := skipped_count + 1;
                END;
            ELSE
                skipped_count := skipped_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    RETURN QUERY SELECT created_count, skipped_count,
        'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ' || created_count || ' Ø­ØµØ©ØŒ ÙˆØªØ®Ø·ÙŠ ' || skipped_count || ' Ø­ØµØ©';
END;
$$ LANGUAGE plpgsql;

-- 11. reset_monthly_excuse_balance
CREATE OR REPLACE FUNCTION reset_monthly_excuse_balance()
RETURNS TABLE (updated_count INTEGER, message TEXT) AS $$
DECLARE
    count INTEGER;
BEGIN
    UPDATE students SET excuse_balance = max_excuses_per_month, updated_at = NOW()
    WHERE status = 'active';
    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN QUERY SELECT count, 'ØªÙ… Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø±ØµÙŠØ¯ Ø§Ù„Ø§Ø¹ØªØ°Ø§Ø±Ø§Øª Ù„Ù€ ' || count || ' Ø·Ø§Ù„Ø¨';
END;
$$ LANGUAGE plpgsql;

-- 12. check_overdue_invoices
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS TABLE (updated_count INTEGER, warnings_issued INTEGER, message TEXT) AS $$
DECLARE
    invoice_count INTEGER := 0;
    warning_count INTEGER := 0;
    invoice_record RECORD;
BEGIN
    UPDATE invoices SET status = 'overdue', updated_at = NOW()
    WHERE status IN ('pending', 'partial', 'sent') AND due_date < CURRENT_DATE;
    GET DIAGNOSTICS invoice_count = ROW_COUNT;
    
    FOR invoice_record IN
        SELECT i.*, s.name as student_name FROM invoices i
        JOIN students s ON i.student_id = s.id
        WHERE i.status = 'overdue' AND i.due_date < CURRENT_DATE - INTERVAL '7 days'
        AND NOT EXISTS (
            SELECT 1 FROM warnings w WHERE w.student_id = i.student_id
            AND w.warning_type = 'payment_overdue' AND w.status = 'active'
            AND w.issued_at > CURRENT_DATE - INTERVAL '30 days'
        )
    LOOP
        INSERT INTO warnings (
            warning_number, student_id, warning_type, severity, title, reason, issued_by, status
        ) VALUES (
            'WRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('warning_seq')::TEXT, 6, '0'),
            invoice_record.student_id, 'payment_overdue', 'high',
            'ØªØ£Ø®Ø± ÙÙŠ Ø³Ø¯Ø§Ø¯ Ø§Ù„ÙØ§ØªÙˆØ±Ø©',
            'ØªØ£Ø®Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ ' || invoice_record.student_name || ' ÙÙŠ Ø³Ø¯Ø§Ø¯ ÙØ§ØªÙˆØ±Ø© ' || 
            invoice_record.invoice_number || ' Ù„Ø£ÙƒØ«Ø± Ù…Ù† 7 Ø£ÙŠØ§Ù…',
            'system', 'active'
        );
        warning_count := warning_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT invoice_count, warning_count,
        'ØªÙ… ØªØ­Ø¯ÙŠØ« ' || invoice_count || ' ÙØ§ØªÙˆØ±Ø© ÙˆØ¥ØµØ¯Ø§Ø± ' || warning_count || ' ØªØ­Ø°ÙŠØ±';
END;
$$ LANGUAGE plpgsql;

-- 13. cleanup_old_data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 365)
RETURNS TABLE (deleted_audit_logs BIGINT, deleted_notifications BIGINT, message TEXT) AS $$
DECLARE
    audit_count BIGINT;
    notif_count BIGINT;
BEGIN
    DELETE FROM audit_log WHERE changed_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS audit_count = ROW_COUNT;
    DELETE FROM notifications WHERE status = 'read' AND read_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS notif_count = ROW_COUNT;
    RETURN QUERY SELECT audit_count, notif_count,
        'ØªÙ… Ø­Ø°Ù ' || audit_count || ' Ø³Ø¬Ù„ ØªØ¯Ù‚ÙŠÙ‚ Ùˆ ' || notif_count || ' Ø¥Ø´Ø¹Ø§Ø±';
END;
$$ LANGUAGE plpgsql;

-- 14. rebuild_statistics
CREATE OR REPLACE FUNCTION rebuild_statistics()
RETURNS TEXT AS $$
BEGIN
    UPDATE students s SET attendance_rate = calculate_student_attendance_rate(s.id), updated_at = NOW()
    WHERE status = 'active';
    UPDATE students s SET next_session_date = (
        SELECT MIN(session_date) FROM sessions
        WHERE student_id = s.id AND session_date >= CURRENT_DATE AND status = 'scheduled'
    ), updated_at = NOW() WHERE status = 'active';
    RETURN 'ØªÙ… Ø¥Ø¹Ø§Ø¯Ø© Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø¨Ù†Ø¬Ø§Ø­';
END;
$$ LANGUAGE plpgsql;

-- 15. Treasury updated_at function
CREATE OR REPLACE FUNCTION update_treasury_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- MIGRATION 06: Triggers
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_sessions_updated_at BEFORE UPDATE ON scheduled_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON pricing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warnings_updated_at BEFORE UPDATE ON warnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_salaries_updated_at BEFORE UPDATE ON teacher_salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Treasury updated_at trigger
CREATE TRIGGER treasury_transactions_updated_at BEFORE UPDATE ON treasury_transactions
    FOR EACH ROW EXECUTE FUNCTION update_treasury_transactions_updated_at();

-- Business logic triggers
CREATE TRIGGER trigger_handle_excuse AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION handle_student_excuse();

CREATE TRIGGER trigger_update_invoice_count AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_invoice_sessions_count();

CREATE TRIGGER trigger_update_invoice_status AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_payment();

CREATE TRIGGER trigger_update_attendance_rate AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_student_attendance_rate();

CREATE TRIGGER trigger_generate_invoice_number BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE TRIGGER trigger_generate_payment_number BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION generate_payment_number();

-- Audit trail triggers
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_teachers AFTER INSERT OR UPDATE OR DELETE ON teachers
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_warnings AFTER INSERT OR UPDATE OR DELETE ON warnings
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
-- ============================================================================
-- MIGRATION 07: Views
-- ============================================================================

-- 1. students_overview
CREATE OR REPLACE VIEW students_overview AS
SELECT 
    s.id, s.name, s.phone, s.email, s.parent_phone,
    c.name as country, c.currency_code, c.currency_symbol,
    pp.sessions_per_week, pp.monthly_price,
    COALESCE(s.custom_monthly_price, pp.monthly_price) as actual_monthly_price,
    s.excuse_balance, s.max_excuses_per_month, s.warnings_count,
    s.status, s.enrollment_date, s.attendance_rate,
    s.current_level, s.total_pages_memorized,
    COUNT(DISTINCT ses.id) as total_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'student_absent') as absent_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'student_excused') as excused_sessions,
    (SELECT COUNT(*) FROM invoices WHERE student_id = s.id AND status = 'overdue') as overdue_invoices,
    (SELECT COUNT(*) FROM warnings WHERE student_id = s.id AND status = 'active') as active_warnings,
    s.last_session_date, s.next_session_date
FROM students s
LEFT JOIN countries c ON s.country_id = c.id
LEFT JOIN pricing_plans pp ON s.pricing_plan_id = pp.id
LEFT JOIN sessions ses ON s.id = ses.student_id
GROUP BY s.id, c.name, c.currency_code, c.currency_symbol, pp.sessions_per_week, pp.monthly_price;

-- 2. teachers_overview
CREATE OR REPLACE VIEW teachers_overview AS
SELECT 
    t.id, t.name, t.phone, t.email, t.status, t.employment_type,
    t.hire_date, t.overall_rating, t.total_ratings,
    COUNT(DISTINCT ss.student_id) as total_students,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ss.student_id END) as active_students,
    COUNT(DISTINCT ses.id) as total_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'teacher_cancelled') as cancelled_sessions,
    ROUND(AVG(ses.rating) FILTER (WHERE ses.rating IS NOT NULL), 2) as average_session_rating,
    COUNT(*) FILTER (WHERE ses.session_date >= CURRENT_DATE - INTERVAL '30 days' AND ses.status = 'completed') as sessions_last_30_days,
    MAX(ses.session_date) FILTER (WHERE ses.status = 'completed') as last_session_date
FROM teachers t
LEFT JOIN scheduled_sessions ss ON t.id = ss.teacher_id AND ss.is_active = true
LEFT JOIN students s ON ss.student_id = s.id
LEFT JOIN sessions ses ON t.id = ses.teacher_id
GROUP BY t.id;

-- 3. upcoming_sessions
CREATE OR REPLACE VIEW upcoming_sessions AS
SELECT 
    ses.id, ses.session_date, ses.session_time, ses.session_duration,
    s.id as student_id, s.name as student_name, s.phone as student_phone,
    t.id as teacher_id, t.name as teacher_name, t.phone as teacher_phone,
    ses.status, ses.is_makeup, ses.session_type, ses.is_online, ses.meeting_link,
    CASE 
        WHEN ses.session_date = CURRENT_DATE THEN 'Ø§Ù„ÙŠÙˆÙ…'
        WHEN ses.session_date = CURRENT_DATE + 1 THEN 'ØºØ¯Ø§Ù‹'
        WHEN ses.session_date = CURRENT_DATE + 2 THEN 'Ø¨Ø¹Ø¯ ØºØ¯'
        ELSE TO_CHAR(ses.session_date, 'Day DD/MM/YYYY')
    END as session_label,
    EXTRACT(EPOCH FROM (ses.session_date + ses.session_time - NOW())) / 3600 as hours_until_session
FROM sessions ses
JOIN students s ON ses.student_id = s.id
JOIN teachers t ON ses.teacher_id = t.id
WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'
ORDER BY ses.session_date, ses.session_time;

-- 4. financial_summary
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    i.month, i.year, i.currency_code, i.currency_symbol,
    COUNT(DISTINCT i.student_id) as total_students,
    COUNT(i.id) as total_invoices,
    SUM(i.total_amount) as total_invoiced,
    SUM(i.amount_paid) as total_collected,
    SUM(i.amount_due) as total_outstanding,
    COUNT(*) FILTER (WHERE i.status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE i.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE i.status = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE i.status = 'overdue') as overdue_count,
    ROUND(SUM(i.amount_paid) / NULLIF(SUM(i.total_amount), 0) * 100, 2) as collection_rate,
    SUM(i.expected_sessions) as expected_sessions,
    SUM(i.completed_sessions) as completed_sessions,
    SUM(i.cancelled_by_teacher) as cancelled_by_teacher,
    SUM(i.absent_sessions) as absent_sessions
FROM invoices i
GROUP BY i.month, i.year, i.currency_code, i.currency_symbol
ORDER BY i.year DESC, i.month DESC;

-- 5. overdue_invoices_detail
CREATE OR REPLACE VIEW overdue_invoices_detail AS
SELECT 
    i.id as invoice_id, i.invoice_number, i.student_id,
    s.name as student_name, s.phone as student_phone, s.parent_phone,
    i.month, i.year, i.total_amount, i.amount_paid, i.amount_due,
    i.currency_code, i.currency_symbol, i.due_date,
    CURRENT_DATE - i.due_date as days_overdue,
    i.last_payment_date,
    (SELECT COUNT(*) FROM payments WHERE invoice_id = i.id) as payment_count,
    (SELECT COUNT(*) FROM warnings WHERE student_id = i.student_id AND warning_type = 'payment_overdue' AND status = 'active') as payment_warnings
FROM invoices i
JOIN students s ON i.student_id = s.id
WHERE i.status = 'overdue'
ORDER BY days_overdue DESC, i.amount_due DESC;

-- 6. sessions_need_makeup
CREATE OR REPLACE VIEW sessions_need_makeup AS
SELECT 
    ses.id, ses.session_date, ses.session_time, ses.status,
    s.id as student_id, s.name as student_name, s.phone as student_phone,
    t.id as teacher_id, t.name as teacher_name, t.phone as teacher_phone,
    ses.cancellation_reason,
    CURRENT_DATE - ses.session_date as days_since_cancellation
FROM sessions ses
JOIN students s ON ses.student_id = s.id
JOIN teachers t ON ses.teacher_id = t.id
WHERE ses.status IN ('student_excused', 'teacher_cancelled')
AND ses.is_makeup = false
AND NOT EXISTS (SELECT 1 FROM sessions makeup WHERE makeup.makeup_for_session_id = ses.id)
ORDER BY ses.session_date DESC;
-- ============================================================================
-- MIGRATION 08: Report Functions
-- ============================================================================

-- 1. get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_active_students BIGINT, total_active_teachers BIGINT,
    sessions_today BIGINT, sessions_this_week BIGINT, sessions_this_month BIGINT,
    pending_invoices BIGINT, overdue_invoices BIGINT,
    students_with_warnings BIGINT, makeup_sessions_needed BIGINT,
    total_revenue_this_month DECIMAL, total_collected_this_month DECIMAL,
    collection_rate_this_month DECIMAL,
    new_students_this_month BIGINT, graduated_students_this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        (SELECT COUNT(*) FROM students WHERE status = 'active'),
        (SELECT COUNT(*) FROM teachers WHERE status = 'active'),
        (SELECT COUNT(*) FROM sessions WHERE session_date = CURRENT_DATE AND status = 'scheduled'),
        (SELECT COUNT(*) FROM sessions WHERE session_date >= DATE_TRUNC('week', CURRENT_DATE) AND session_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days' AND status = 'scheduled'),
        (SELECT COUNT(*) FROM sessions WHERE session_date >= DATE_TRUNC('month', CURRENT_DATE) AND status IN ('scheduled', 'completed')),
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending'),
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue'),
        (SELECT COUNT(*) FROM students WHERE warnings_count > 0 AND status = 'active'),
        (SELECT COUNT(*) FROM sessions_need_makeup),
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)),
        (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)),
        (SELECT ROUND(COALESCE(SUM(amount_paid), 0) / NULLIF(SUM(total_amount), 0) * 100, 2) FROM invoices WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)),
        (SELECT COUNT(*) FROM students WHERE enrollment_date >= DATE_TRUNC('month', CURRENT_DATE)),
        (SELECT COUNT(*) FROM students WHERE graduation_date >= DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql;

-- 2. get_student_report
CREATE OR REPLACE FUNCTION get_student_report(student_uuid UUID)
RETURNS TABLE (
    student_id UUID, student_name VARCHAR, phone VARCHAR, parent_phone VARCHAR,
    email VARCHAR, country VARCHAR, pricing_plan VARCHAR, monthly_price DECIMAL,
    excuse_balance INTEGER, max_excuses INTEGER, warnings_count INTEGER,
    status VARCHAR, enrollment_date DATE, total_sessions BIGINT,
    completed_sessions BIGINT, excused_sessions BIGINT, absent_sessions BIGINT,
    attendance_rate DECIMAL, total_invoiced DECIMAL, total_paid DECIMAL,
    balance_due DECIMAL, overdue_invoices BIGINT, last_payment_date DATE,
    next_session_date DATE, next_session_time TIME,
    current_level VARCHAR, total_pages_memorized INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        s.id, s.name, s.phone, s.parent_phone, s.email, c.name,
        pp.sessions_per_week || ' Ø­ØµØµ/Ø£Ø³Ø¨ÙˆØ¹',
        COALESCE(s.custom_monthly_price, pp.monthly_price),
        s.excuse_balance, s.max_excuses_per_month, s.warnings_count, s.status,
        s.enrollment_date, COUNT(ses.id),
        COUNT(*) FILTER (WHERE ses.status = 'completed'),
        COUNT(*) FILTER (WHERE ses.status = 'student_excused'),
        COUNT(*) FILTER (WHERE ses.status = 'student_absent'),
        s.attendance_rate, COALESCE(SUM(i.total_amount), 0),
        COALESCE(SUM(i.amount_paid), 0), COALESCE(SUM(i.amount_due), 0),
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue'),
        MAX(p.payment_date),
        MIN(ses.session_date) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'),
        MIN(ses.session_time) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'),
        s.current_level, s.total_pages_memorized
    FROM students s
    LEFT JOIN countries c ON s.country_id = c.id
    LEFT JOIN pricing_plans pp ON s.pricing_plan_id = pp.id
    LEFT JOIN sessions ses ON s.id = ses.student_id
    LEFT JOIN invoices i ON s.id = i.student_id
    LEFT JOIN payments p ON i.id = p.invoice_id
    WHERE s.id = student_uuid
    GROUP BY s.id, s.name, s.phone, s.parent_phone, s.email, c.name, 
             pp.sessions_per_week, pp.monthly_price, s.custom_monthly_price,
             s.excuse_balance, s.max_excuses_per_month, s.warnings_count, 
             s.status, s.enrollment_date, s.attendance_rate, s.current_level, 
             s.total_pages_memorized;
END;
$$ LANGUAGE plpgsql;

-- 3. get_teacher_report
CREATE OR REPLACE FUNCTION get_teacher_report(teacher_uuid UUID)
RETURNS TABLE (
    teacher_id UUID, teacher_name VARCHAR, phone VARCHAR, email VARCHAR,
    status VARCHAR, hire_date DATE, total_students BIGINT, active_students BIGINT,
    total_sessions BIGINT, completed_sessions BIGINT, cancelled_sessions BIGINT,
    completion_rate DECIMAL, average_rating DECIMAL,
    sessions_this_month BIGINT, sessions_this_week BIGINT,
    next_session_date DATE, next_session_time TIME
) AS $$
BEGIN
    RETURN QUERY SELECT 
        t.id, t.name, t.phone, t.email, t.status, t.hire_date,
        COUNT(DISTINCT ss.student_id),
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ss.student_id END),
        COUNT(ses.id),
        COUNT(*) FILTER (WHERE ses.status = 'completed'),
        COUNT(*) FILTER (WHERE ses.status = 'teacher_cancelled'),
        ROUND(COUNT(*) FILTER (WHERE ses.status = 'completed')::DECIMAL / NULLIF(COUNT(ses.id), 0) * 100, 2),
        ROUND(AVG(ses.rating) FILTER (WHERE ses.rating IS NOT NULL), 2),
        COUNT(*) FILTER (WHERE ses.session_date >= DATE_TRUNC('month', CURRENT_DATE)),
        COUNT(*) FILTER (WHERE ses.session_date >= DATE_TRUNC('week', CURRENT_DATE)),
        MIN(ses.session_date) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'),
        MIN(ses.session_time) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled')
    FROM teachers t
    LEFT JOIN scheduled_sessions ss ON t.id = ss.teacher_id
    LEFT JOIN students s ON ss.student_id = s.id
    LEFT JOIN sessions ses ON t.id = ses.teacher_id
    WHERE t.id = teacher_uuid
    GROUP BY t.id, t.name, t.phone, t.email, t.status, t.hire_date;
END;
$$ LANGUAGE plpgsql;

-- 4. get_attendance_statistics
CREATE OR REPLACE FUNCTION get_attendance_statistics(
    start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_scheduled BIGINT, total_completed BIGINT, total_excused BIGINT,
    total_absent BIGINT, total_cancelled_by_teacher BIGINT,
    completion_rate DECIMAL, excuse_rate DECIMAL,
    absence_rate DECIMAL, cancellation_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'student_excused'),
        COUNT(*) FILTER (WHERE status = 'student_absent'),
        COUNT(*) FILTER (WHERE status = 'teacher_cancelled'),
        ROUND(COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
        ROUND(COUNT(*) FILTER (WHERE status = 'student_excused')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
        ROUND(COUNT(*) FILTER (WHERE status = 'student_absent')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
        ROUND(COUNT(*) FILTER (WHERE status = 'teacher_cancelled')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2)
    FROM sessions WHERE session_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- 5. get_students_by_country_report
CREATE OR REPLACE FUNCTION get_students_by_country_report()
RETURNS TABLE (
    country_name VARCHAR, currency_code VARCHAR, total_students BIGINT,
    active_students BIGINT, total_revenue DECIMAL, total_collected DECIMAL,
    total_outstanding DECIMAL, collection_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        c.name, c.currency_code, COUNT(DISTINCT s.id),
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active'),
        COALESCE(SUM(i.total_amount), 0), COALESCE(SUM(i.amount_paid), 0),
        COALESCE(SUM(i.amount_due), 0),
        ROUND(COALESCE(SUM(i.amount_paid), 0) / NULLIF(SUM(i.total_amount), 0) * 100, 2)
    FROM countries c
    LEFT JOIN students s ON c.id = s.country_id
    LEFT JOIN invoices i ON s.id = i.student_id
    GROUP BY c.id, c.name, c.currency_code
    ORDER BY total_students DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. get_top_students_report
CREATE OR REPLACE FUNCTION get_top_students_report(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID, student_name VARCHAR, attendance_rate DECIMAL,
    completed_sessions BIGINT, excuse_balance INTEGER, warnings_count INTEGER,
    total_pages_memorized INTEGER, overall_performance DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        s.id, s.name, s.attendance_rate,
        COUNT(*) FILTER (WHERE ses.status = 'completed'),
        s.excuse_balance, s.warnings_count, s.total_pages_memorized, s.overall_performance
    FROM students s
    LEFT JOIN sessions ses ON s.id = ses.student_id
    WHERE s.status = 'active'
    GROUP BY s.id, s.name, s.attendance_rate, s.excuse_balance, 
             s.warnings_count, s.total_pages_memorized, s.overall_performance
    ORDER BY s.attendance_rate DESC, completed_sessions DESC, s.warnings_count ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 7. get_daily_summary_report
CREATE OR REPLACE FUNCTION get_daily_summary_report(input_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    report_date DATE, total_sessions BIGINT, completed_sessions BIGINT,
    cancelled_sessions BIGINT, pending_sessions BIGINT,
    active_students BIGINT, active_teachers BIGINT,
    payments_today BIGINT, payments_amount DECIMAL,
    overdue_invoices BIGINT, students_with_warnings BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        input_date,
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date),
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date AND status = 'completed'),
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date AND status IN ('student_excused', 'teacher_cancelled', 'cancelled')),
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date AND status = 'scheduled'),
        (SELECT COUNT(*) FROM students WHERE status = 'active'),
        (SELECT COUNT(*) FROM teachers WHERE status = 'active'),
        (SELECT COUNT(*) FROM payments WHERE payment_date = input_date),
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date = input_date),
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue'),
        (SELECT COUNT(*) FROM students WHERE warnings_count > 0 AND status = 'active');
END;
$$ LANGUAGE plpgsql;

-- 8. get_teacher_schedule
CREATE OR REPLACE FUNCTION get_teacher_schedule(
    teacher_uuid UUID,
    week_start_date DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE
)
RETURNS TABLE (
    day_of_week INTEGER, day_name VARCHAR, session_time TIME,
    student_name VARCHAR, student_phone VARCHAR,
    session_duration INTEGER, is_online BOOLEAN, meeting_link TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        ss.day_of_week, TO_CHAR(week_start_date + ss.day_of_week, 'Day'),
        ss.session_time, s.name, s.phone, ss.session_duration, ss.is_online, ss.meeting_link
    FROM scheduled_sessions ss
    JOIN students s ON ss.student_id = s.id
    WHERE ss.teacher_id = teacher_uuid AND ss.is_active = true
    AND (ss.end_date IS NULL OR ss.end_date >= week_start_date)
    ORDER BY ss.day_of_week, ss.session_time;
END;
$$ LANGUAGE plpgsql;

-- 9. get_student_progress_report
CREATE OR REPLACE FUNCTION get_student_progress_report(student_uuid UUID)
RETURNS TABLE (
    progress_date DATE, surah_name VARCHAR, from_ayah INTEGER, to_ayah INTEGER,
    mastery_level VARCHAR, accuracy_percentage DECIMAL,
    teacher_name VARCHAR, teacher_notes TEXT, mistakes_count INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        sp.progress_date, sp.surah_name, sp.from_ayah, sp.to_ayah,
        sp.mastery_level, sp.accuracy_percentage, t.name, sp.teacher_notes, sp.mistakes_count
    FROM student_progress sp
    LEFT JOIN teachers t ON sp.teacher_id = t.id
    WHERE sp.student_id = student_uuid
    ORDER BY sp.progress_date DESC, sp.created_at DESC;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- MIGRATION 09: Row Level Security (RLS) & Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Anonymous access policies (for development / anon key usage)
-- Full CRUD for all tables via anon role
-- ============================================================================

-- countries
CREATE POLICY "Allow anonymous read access" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.countries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.countries FOR DELETE USING (true);

-- pricing_plans
CREATE POLICY "Allow anonymous read access" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.pricing_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.pricing_plans FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.pricing_plans FOR DELETE USING (true);

-- teachers
CREATE POLICY "Allow anonymous read access" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teachers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teachers FOR DELETE USING (true);

-- students
CREATE POLICY "Allow anonymous read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.students FOR DELETE USING (true);

-- sessions
CREATE POLICY "Allow anonymous read access" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.sessions FOR DELETE USING (true);

-- scheduled_sessions
CREATE POLICY "Allow anonymous read access" ON public.scheduled_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.scheduled_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.scheduled_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.scheduled_sessions FOR DELETE USING (true);

-- attendance_log
CREATE POLICY "Allow anonymous read access" ON public.attendance_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.attendance_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.attendance_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.attendance_log FOR DELETE USING (true);

-- invoices
CREATE POLICY "Allow anonymous read access" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.invoices FOR DELETE USING (true);

-- payments
CREATE POLICY "Allow anonymous read access" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.payments FOR DELETE USING (true);

-- expenses
CREATE POLICY "Allow anonymous read access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expenses FOR DELETE USING (true);

-- expense_categories
CREATE POLICY "Allow anonymous read access" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expense_categories FOR DELETE USING (true);

-- teacher_salaries
CREATE POLICY "Allow anonymous read access" ON public.teacher_salaries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_salaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_salaries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_salaries FOR DELETE USING (true);

-- student_documents
CREATE POLICY "Allow anonymous read access" ON public.student_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.student_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.student_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.student_documents FOR DELETE USING (true);

-- teacher_documents
CREATE POLICY "Allow anonymous read access" ON public.teacher_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_documents FOR DELETE USING (true);

-- student_progress
CREATE POLICY "Allow anonymous read access" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.student_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.student_progress FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.student_progress FOR DELETE USING (true);

-- warnings
CREATE POLICY "Allow anonymous read access" ON public.warnings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.warnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.warnings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.warnings FOR DELETE USING (true);

-- holidays
CREATE POLICY "Allow anonymous read access" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.holidays FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.holidays FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.holidays FOR DELETE USING (true);

-- notifications
CREATE POLICY "Allow anonymous read access" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.notifications FOR DELETE USING (true);

-- system_settings
CREATE POLICY "Allow anonymous read access" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.system_settings FOR DELETE USING (true);

-- audit_log
CREATE POLICY "Allow anonymous read access" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.audit_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.audit_log FOR DELETE USING (true);

-- communication_log
CREATE POLICY "Allow anonymous read access" ON public.communication_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.communication_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.communication_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.communication_log FOR DELETE USING (true);

-- teacher_availability
CREATE POLICY "Allow anonymous read access" ON public.teacher_availability FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_availability FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_availability FOR DELETE USING (true);

-- treasury_transactions
CREATE POLICY "Allow anon to view transactions" ON public.treasury_transactions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert transactions" ON public.treasury_transactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update transactions" ON public.treasury_transactions FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow authenticated to view transactions" ON public.treasury_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to insert transactions" ON public.treasury_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated to update transactions" ON public.treasury_transactions FOR UPDATE TO authenticated USING (true);

-- treasury_transfers
CREATE POLICY "Allow anon to view transfers" ON public.treasury_transfers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert transfers" ON public.treasury_transfers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated to view transfers" ON public.treasury_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to insert transfers" ON public.treasury_transfers FOR INSERT TO authenticated WITH CHECK (true);
-- ============================================================================
-- MIGRATION 10: Seed Data & Table Comments
-- ============================================================================

-- Initial countries data
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, display_order) VALUES
('Ù…ØµØ±', 'Ù…ØµØ±', 'Egypt', 'EGP', 'Ø¬.Ù…', 'Ø¬Ù†ÙŠÙ‡ Ù…ØµØ±ÙŠ', 'Egyptian Pound', 'EG', '+20', 1),
('Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©', 'Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©', 'Saudi Arabia', 'SAR', 'Ø±.Ø³', 'Ø±ÙŠØ§Ù„ Ø³Ø¹ÙˆØ¯ÙŠ', 'Saudi Riyal', 'SA', '+966', 2),
('Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª', 'Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª', 'UAE', 'AED', 'Ø¯.Ø¥', 'Ø¯Ø±Ù‡Ù… Ø¥Ù…Ø§Ø±Ø§ØªÙŠ', 'UAE Dirham', 'AE', '+971', 3),
('Ø§Ù„ÙƒÙˆÙŠØª', 'Ø§Ù„ÙƒÙˆÙŠØª', 'Kuwait', 'KWD', 'Ø¯.Ùƒ', 'Ø¯ÙŠÙ†Ø§Ø± ÙƒÙˆÙŠØªÙŠ', 'Kuwaiti Dinar', 'KW', '+965', 4),
('Ù‚Ø·Ø±', 'Ù‚Ø·Ø±', 'Qatar', 'QAR', 'Ø±.Ù‚', 'Ø±ÙŠØ§Ù„ Ù‚Ø·Ø±ÙŠ', 'Qatari Riyal', 'QA', '+974', 5),
('Ø§Ù„Ø¨Ø­Ø±ÙŠÙ†', 'Ø§Ù„Ø¨Ø­Ø±ÙŠÙ†', 'Bahrain', 'BHD', 'Ø¯.Ø¨', 'Ø¯ÙŠÙ†Ø§Ø± Ø¨Ø­Ø±ÙŠÙ†ÙŠ', 'Bahraini Dinar', 'BH', '+973', 6),
('Ø¹Ù…Ø§Ù†', 'Ø¹Ù…Ø§Ù†', 'Oman', 'OMR', 'Ø±.Ø¹', 'Ø±ÙŠØ§Ù„ Ø¹Ù…Ø§Ù†ÙŠ', 'Omani Rial', 'OM', '+968', 7),
('Ø§Ù„Ø£Ø±Ø¯Ù†', 'Ø§Ù„Ø£Ø±Ø¯Ù†', 'Jordan', 'JOD', 'Ø¯.Ø£', 'Ø¯ÙŠÙ†Ø§Ø± Ø£Ø±Ø¯Ù†ÙŠ', 'Jordanian Dinar', 'JO', '+962', 8);

-- System settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('invoice_due_day', '5', 'number', 'billing', 'ÙŠÙˆÙ… Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ù…Ù† ÙƒÙ„ Ø´Ù‡Ø±'),
('max_excuses_per_month', '2', 'number', 'sessions', 'Ø¹Ø¯Ø¯ Ø§Ù„Ø§Ø¹ØªØ°Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡Ø§ Ø´Ù‡Ø±ÙŠØ§Ù‹'),
('session_duration', '60', 'number', 'sessions', 'Ù…Ø¯Ø© Ø§Ù„Ø­ØµØ© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ø¨Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚'),
('auto_generate_invoices', 'true', 'boolean', 'billing', 'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙÙˆØ§ØªÙŠØ± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ÙÙŠ Ø¨Ø¯Ø§ÙŠØ© ÙƒÙ„ Ø´Ù‡Ø±'),
('send_payment_reminders', 'true', 'boolean', 'notifications', 'Ø¥Ø±Ø³Ø§Ù„ ØªØ°ÙƒÙŠØ±Ø§Øª Ø§Ù„Ø¯ÙØ¹'),
('reminder_days_before_due', '3', 'number', 'notifications', 'Ø¹Ø¯Ø¯ Ø§Ù„Ø£ÙŠØ§Ù… Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªØ°ÙƒÙŠØ±'),
('system_timezone', 'Africa/Cairo', 'string', 'general', 'Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø²Ù…Ù†ÙŠØ© Ù„Ù„Ù†Ø¸Ø§Ù…'),
('currency_default', 'EGP', 'string', 'billing', 'Ø§Ù„Ø¹Ù…Ù„Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ©'),
('academic_year_start_month', '9', 'number', 'general', 'Ø´Ù‡Ø± Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ©'),
('enable_online_sessions', 'true', 'boolean', 'sessions', 'ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­ØµØµ Ø§Ù„Ø£ÙˆÙ†Ù„Ø§ÙŠÙ†');

-- Table comments
COMMENT ON TABLE countries IS 'Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø¯ÙˆÙ„ ÙˆØ§Ù„Ø¹Ù…Ù„Ø§Øª Ø§Ù„Ù…Ø¯Ø¹ÙˆÙ…Ø© ÙÙŠ Ø§Ù„Ù†Ø¸Ø§Ù…';
COMMENT ON TABLE pricing_plans IS 'Ø£Ù†Ø¸Ù…Ø© Ø§Ù„ØªØ³Ø¹ÙŠØ± Ø§Ù„Ù…Ø®ØªÙ„ÙØ© Ø­Ø³Ø¨ Ø§Ù„Ø¯ÙˆÙ„Ø© ÙˆØ¹Ø¯Ø¯ Ø§Ù„Ø­ØµØµ';
COMMENT ON TABLE teachers IS 'Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­ÙØ¸ÙŠÙ† ÙˆØ§Ù„Ù…Ø¹Ù„Ù…ÙŠÙ†';
COMMENT ON TABLE students IS 'Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ù„Ø¨Ø© Ù…Ø¹ Ù†Ø¸Ø§Ù… Ø§Ù„Ø§Ø¹ØªØ°Ø§Ø±Ø§Øª ÙˆØ§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª';
COMMENT ON TABLE scheduled_sessions IS 'Ø§Ù„Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ Ø§Ù„Ø«Ø§Ø¨Øª Ù„Ù„Ø­ØµØµ';
COMMENT ON TABLE sessions IS 'Ø§Ù„Ø­ØµØµ Ø§Ù„ÙØ¹Ù„ÙŠØ© Ù…Ø¹ Ø­Ø§Ù„ØªÙ‡Ø§ ÙˆØªÙ‚ÙŠÙŠÙ…Ù‡Ø§';
COMMENT ON TABLE attendance_log IS 'Ø³Ø¬Ù„ ØªÙØµÙŠÙ„ÙŠ Ù„ÙƒÙ„ Ø¹Ù…Ù„ÙŠØ© ØªØ³Ø¬ÙŠÙ„ Ø­Ø¶ÙˆØ±';
COMMENT ON TABLE invoices IS 'Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠØ© Ù„Ù„Ø·Ù„Ø¨Ø©';
COMMENT ON TABLE payments IS 'Ø³Ø¬Ù„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª';
COMMENT ON TABLE warnings IS 'Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„ØµØ§Ø¯Ø±Ø© Ù„Ù„Ø·Ù„Ø¨Ø©';
COMMENT ON TABLE holidays IS 'Ø£ÙŠØ§Ù… Ø§Ù„Ø¹Ø·Ù„Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ©';
COMMENT ON TABLE audit_log IS 'Ø³Ø¬Ù„ Ø¬Ù…ÙŠØ¹ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©';
COMMENT ON TABLE system_settings IS 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø¹Ø§Ù…Ø©';
COMMENT ON TABLE notifications IS 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø±Ø³Ù„Ø© Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†';
COMMENT ON TABLE student_progress IS 'ØªØªØ¨Ø¹ ØªÙ‚Ø¯Ù… Ø§Ù„Ø·Ø§Ù„Ø¨ ÙÙŠ Ø§Ù„Ø­ÙØ¸';
COMMENT ON TABLE teacher_availability IS 'Ø£ÙˆÙ‚Ø§Øª ØªÙˆÙØ± Ø§Ù„Ù…Ø­ÙØ¸ÙŠÙ†';
COMMENT ON TABLE expenses IS 'Ù…ØµØ±ÙˆÙØ§Øª Ø§Ù„Ø¯Ø§Ø±';
COMMENT ON TABLE teacher_salaries IS 'Ø±ÙˆØ§ØªØ¨ Ø§Ù„Ù…Ø­ÙØ¸ÙŠÙ† Ø§Ù„Ø´Ù‡Ø±ÙŠØ©';
COMMENT ON TABLE treasury_transactions IS 'Tracks all treasury transactions (deposits, withdrawals, salary payments)';
COMMENT ON TABLE treasury_transfers IS 'Tracks currency transfers between different treasuries';
COMMENT ON COLUMN teachers.session_rate IS 'Ø³Ø¹Ø± Ø§Ù„Ø­ØµØ© Ø§Ù„ÙˆØ§Ø­Ø¯Ø© Ù„Ù„Ù…Ø­ÙØ¸';
COMMENT ON COLUMN pricing_plans.session_duration IS 'Ù…Ø¯Ø© Ø§Ù„Ø­ØµØ© Ø¨Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚ (30ØŒ 45ØŒ 60ØŒ 90)';

SELECT 'Migration complete! All 25 tables, indexes, functions, triggers, views, RLS policies, and seed data created successfully.' as status;
