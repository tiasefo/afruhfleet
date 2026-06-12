CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS guest_customs_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    fingerprint TEXT NOT NULL,
    country TEXT NOT NULL,
    commodity_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'used',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_customs_fingerprint
ON guest_customs_checks(fingerprint);

CREATE TABLE IF NOT EXISTS customs_payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    country TEXT NOT NULL,
    commodity_type TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'paystack',
    reference TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    request_payload JSONB NOT NULL,
    result_payload JSONB,
    authorization_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);
