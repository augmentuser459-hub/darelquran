-- Create treasury_transfers table for tracking transfers between treasuries
CREATE TABLE IF NOT EXISTS treasury_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    from_amount DECIMAL(10, 2) NOT NULL,
    to_amount DECIMAL(10, 2) NOT NULL,
    exchange_rate DECIMAL(10, 4) NOT NULL,
    transfer_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_date ON treasury_transfers(transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_from_currency ON treasury_transfers(from_currency);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_to_currency ON treasury_transfers(to_currency);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_number ON treasury_transfers(transfer_number);

-- Add comments
COMMENT ON TABLE treasury_transfers IS 'Tracks currency transfers between different treasuries';
COMMENT ON COLUMN treasury_transfers.transfer_number IS 'Unique transfer reference number';
COMMENT ON COLUMN treasury_transfers.from_currency IS 'Source currency code (e.g., SAR)';
COMMENT ON COLUMN treasury_transfers.to_currency IS 'Target currency code (e.g., EGP)';
COMMENT ON COLUMN treasury_transfers.from_amount IS 'Amount in source currency';
COMMENT ON COLUMN treasury_transfers.to_amount IS 'Amount in target currency after conversion';
COMMENT ON COLUMN treasury_transfers.exchange_rate IS 'Exchange rate used for conversion';
COMMENT ON COLUMN treasury_transfers.transfer_date IS 'Date of the transfer';

-- Enable RLS
ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to view transfers" ON treasury_transfers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert transfers" ON treasury_transfers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy for anonymous access (if needed)
CREATE POLICY "Allow anon to view transfers" ON treasury_transfers
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anon to insert transfers" ON treasury_transfers
    FOR INSERT
    TO anon
    WITH CHECK (true);
