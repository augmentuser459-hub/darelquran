-- Create treasury_transactions table for tracking deposits and withdrawals
CREATE TABLE IF NOT EXISTS treasury_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'salary_payment', 'payment_received')),
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_date ON treasury_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_currency ON treasury_transactions(currency_code);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_type ON treasury_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_number ON treasury_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_reference ON treasury_transactions(reference_type, reference_id);

-- Add comments
COMMENT ON TABLE treasury_transactions IS 'Tracks all treasury transactions (deposits, withdrawals, salary payments)';
COMMENT ON COLUMN treasury_transactions.transaction_number IS 'Unique transaction reference number';
COMMENT ON COLUMN treasury_transactions.currency_code IS 'Currency code (e.g., EGP)';
COMMENT ON COLUMN treasury_transactions.transaction_type IS 'Type: deposit, withdrawal, salary_payment, payment_received';
COMMENT ON COLUMN treasury_transactions.amount IS 'Transaction amount (positive for deposits, negative for withdrawals)';
COMMENT ON COLUMN treasury_transactions.category IS 'Category/reason (e.g., electricity, rent, salary, deposit)';
COMMENT ON COLUMN treasury_transactions.description IS 'Additional description';
COMMENT ON COLUMN treasury_transactions.reference_type IS 'Reference type (e.g., teacher_salary, payment)';
COMMENT ON COLUMN treasury_transactions.reference_id IS 'Reference ID to related record';
COMMENT ON COLUMN treasury_transactions.transaction_date IS 'Date of the transaction';

-- Enable RLS
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view transactions" ON treasury_transactions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert transactions" ON treasury_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transactions" ON treasury_transactions
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create policies for anonymous access
CREATE POLICY "Allow anon to view transactions" ON treasury_transactions
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anon to insert transactions" ON treasury_transactions
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon to update transactions" ON treasury_transactions
    FOR UPDATE
    TO anon
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_treasury_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS treasury_transactions_updated_at ON treasury_transactions;
CREATE TRIGGER treasury_transactions_updated_at
    BEFORE UPDATE ON treasury_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_treasury_transactions_updated_at();
