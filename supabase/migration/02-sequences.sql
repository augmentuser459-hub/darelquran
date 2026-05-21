-- ============================================================================
-- MIGRATION 02: Sequences
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS warning_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS payment_seq START 1;
CREATE SEQUENCE IF NOT EXISTS system_keepalive_id_seq START 1;
