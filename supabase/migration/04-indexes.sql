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
