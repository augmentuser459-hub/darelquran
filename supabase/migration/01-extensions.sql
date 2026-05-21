-- ============================================================================
-- MIGRATION 01: Extensions & Setup
-- ============================================================================
-- Run this FIRST on a fresh Supabase instance
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
