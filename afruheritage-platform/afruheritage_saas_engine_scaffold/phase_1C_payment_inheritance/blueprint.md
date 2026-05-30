# Phase 1C Blueprint
Core models:
- payment_provider_profiles
- tenant_payment_profiles
- tenant_enabled_payment_methods
- transaction_fee_rules
- settlement_records
- wallet_accounts
- wallet_transactions
- virtual_card_accounts
- virtual_card_transactions

Core workflow:
1. Tenant activated
2. Tenant payment profile created automatically
3. Default payment methods enabled
4. Tenant selects which methods appear on their website
5. Checkout request from tenant runtime hits Afruheritage payment hub
6. Provider selected based on method/rule
7. Fee applied
8. Receipt and settlement recorded
