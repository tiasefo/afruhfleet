# Phase 1A Blueprint
API modules:
- POST /public/signup/start
- GET /public/plans
- GET /public/add-ons
- POST /public/checkout/init
- POST /public/free-tier/activate
- GET /subscriptions/{id}
- GET /receipts/{id}

Core models:
- plans
- add_ons
- customer_accounts
- subscription_contracts
- subscription_events
- receipts
- org_profiles
- fraud_guards
