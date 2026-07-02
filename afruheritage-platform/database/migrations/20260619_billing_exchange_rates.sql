CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS billing_exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate NUMERIC(18,6) NOT NULL,
    source TEXT NOT NULL DEFAULT 'admin_configured',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(base_currency, target_currency)
);

INSERT INTO billing_exchange_rates (base_currency, target_currency, rate)
VALUES
('USD','GHS',11.00),
('USD','KES',130.00),
('USD','XOF',600.00),
('USD','RMB',7.20)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now(),
  is_active = true;
