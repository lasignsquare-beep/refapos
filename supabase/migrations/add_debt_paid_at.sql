-- Run this in your Supabase SQL editor to add debt support to existing tables
-- Adds the debt_paid_at column to track when a debt transaction is cleared

ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS debt_paid_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: index for quickly finding pending debts
CREATE INDEX IF NOT EXISTS idx_pos_transactions_debt
  ON pos_transactions (payment_mode, debt_paid_at)
  WHERE payment_mode = 'Debt';
