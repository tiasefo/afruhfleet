# Afruheritage — Customs Duty Checker: Detailed Report

**Date:** 2026-10-14 · **Baseline:** `7a86f636` (deployed) · **Scope:** standalone
review of the customs duty surface — both country engines, currencies, the
guest free-check cap, and the payment gateway behind it.

> **Headline:** the duty checker is real computation, not placeholder — Ghana
> runs a levy-by-levy ICUMS-style breakdown, Kenya runs a real KRA CRSP
> vehicle lookup before duty calculation. Both are *estimates* (`official:
> false`) — not GRA/ICUMS or KRA iCMS assessments — and the UI labels them
> "estimate" everywhere. Smoke testing found and fixed **3 real defects**
> (one 502, two 500s). Country coverage is **GH + KE only** — the other five
> country pages are informational landing pages, not calculators.

---

## 1. Surface map

| Surface | Path | Auth | What it is |
|---|---|---|---|
| Hub page | `/customs` | public | Landing page listing capabilities |
| Calculator UI | `/customs/duty-calculator` | public | Interactive form — Ghana & Kenya, vehicle & cargo |
| Country pages | `/customs/ghana` `/kenya` | public | Landing pages + link into calculator |
| Other country pages | `/customs/{nigeria,uganda,rwanda,south-africa,tanzania}` | public | **Informational only** — feature cards + "Talk to Customs Support" CTA. No calculator on these pages. |
| Guest calculate | `POST /api/v1/customs/guest/calculate` | none | Free checks + paywall (see §4) |
| Guest payment verify | `GET /api/v1/customs/guest/payment/verify/{ref}` | none | Paystack verify → unlocks result |
| Auth calculate | `POST /api/v1/customs/calculate` | bearer | Dispatcher → per-country engine |
| Country catalogue | `GET /api/v1/customs/countries` | public | Returns **only GH + KE** |
| Ghana specifics | `/customs/ghana/vehicle-duty`, `/ghana/goods-duty`, `/ghana/sources` | bearer | Direct engine calls |
| Kenya specific | `/customs/kenya/vehicle-duty` | bearer | VIN decode + CRSP lookup + duty |
| Utilities | `/customs/vin-decode`, `/customs/vehicle-value` | bearer | VIN decode; CRSP/HDV lookup |

**Backend supports exactly two countries:** Ghana (GH) and Kenya (KE).
Any other country is rejected — now with a controlled `422` (was a 500
crash before this round, see §6).

---

## 2. Ghana engine — `afruheritage_ghana_engine`

**Currency:** GHS · **Valuation basis:** HDV (Home Delivery Value) benchmark
· **Mode:** `fallback` · `official: false`

### How it computes

1. Takes vehicle/cargo inputs (hdv, freight, insurance, year, engine cc,
   fuel).
2. **Revalues HDV against its own benchmark** — e.g. submitted
   `hdv_usd: 15,000` was repriced to `10,125` for a 2020/2000cc petrol
   vehicle. This mirrors ICUMS behaviour (customs uses benchmark values,
   not invoice) but means *user-entered value is a hint, not the base*.
3. Converts to CIF (USD) → applies exchange rate (currently **15.0
   USD→GHS**, static config) → `customs_value_ghs`.
4. Applies each levy against the customs value:

| Levy | Rate |
|---|---|
| Import Duty | 10% |
| Import VAT | 15% |
| NHIL | 2.5% |
| GETFund Import Levy | 2.5% |
| ECOWAS Levy | 0.5% |
| EXIM Bank Levy | 0.75% |
| Special Import Levy | 2% |
| Overage Penalty | 0% (age-dependent) |

**Sample result (2020 / 2000cc petrol, benchmark HDV $10,125):**
CIF $11,726.25 → customs value GHS 175,893.75 → **total duty GHS
60,243.61** (`evidence/gh-vehicle-guest.json`).

Cargo path (`/ghana/goods-duty`) is the separate `ghana_goods_orchestrator`
— verified returning a real breakdown (`evidence/gh-cargo.json`).

---

## 3. Kenya engine — `kra_crsp` / `kenya_kra_crsp_engine`

**Currency:** KES · **Valuation basis:** KRA CRSP (Current Retail Selling
Price) spreadsheet, July 2025 edition · `official: false`

### How it computes (vehicle path)

1. Optional **VIN decode** fills make/model/year/cc/fuel/body-type.
2. `search_kra_crsp(make, model, year)` matches the vehicle against the
   real CRSP sheet — returned match: `TOYOTA COROLLA FIELDER EX`,
   `crsp_kes: 3,955,373`, `score: 0.91`.
3. Depreciation applied (currently **estimated** — the response honestly
   notes "Depreciation is estimated until the official valuation template
   is fully encoded") → `estimated_customs_value_kes`.
4. Duty levies on the customs value:

| Levy | Rate |
|---|---|
| Import Duty | 25% |
| VAT | 16% |
| Import Declaration Fee (IDF) | 3.5% |
| Railway Development Levy | 2% |

**Sample result (Toyota Corolla 2019):** customs value KES 1,132,621.79 →
**total duty KES 526,669.14**, landed KES 1,659,290.93
(`evidence/ke-vehicle-crsp.json`).

### No-match behaviour

If CRSP can't match (no make/model, obscure vehicle) the response is a
controlled **`mode: "needs_manual_review"`** with the match list — not an
error, and not a fabricated number.

### Kenya cargo / explicit CIF

KE cargo (or any explicit `cif_value`) uses the generic `EstimateProvider`
flat rates above — labeled `mode: "estimate"`, `provider: "estimate"`
(`evidence/ke-cargo-estimate.json`).

---

## 4. Guest free-check cap + payment gateway

### The cap

- `FREE_CHECK_LIMIT = 2` (env `CUSTOMS_GUEST_FREE_LIMIT`).
- Identity = **fingerprint**: hash of `guest_id` + IP + user-agent —
  stored in `guest_customs_checks`. Count is per-fingerprint, not
  per-cookie, so clearing browser state doesn't reset it.
- Responses report `free_remaining` and `used_count` (verified: 1 → 0).

### The paywall (Paystack)

After the cap, the flow was: compute result → create Paystack
`transaction/initialize` → persist `customs_payment_intents` row → return
`authorization_url` → guest pays → `GET …/payment/verify/{ref}` verifies
server-side and releases the stored result.

**Price table (`PRICES`):**

| Country | Commodity | Amount |
|---|---|---|
| GH | vehicle | GHS 100.00 |
| GH | cargo | GHS 70.00 |
| KE | vehicle | KES 1,150.00 |
| KE | cargo | KES 800.00 |

### Pilot-mode change (this round)

Under `PILOT_INVITE_ONLY` (currently ON), the paywall no longer
initializes a payment — live charges aren't authorized. Guests past the
cap now get:

```json
{ "payment_required": false, "pilot_closed": true,
  "message": "…During the invitation-only pilot, create an account with
  your invited email for full access." }
```

Post-pilot the payment path reactivates, but now **requires the guest's
real email** (422 if absent) instead of fabricating one.

---

## 5. What is real vs. estimate — honest read

| Claim | Reality |
|---|---|
| "Duty calculator" | Real math with per-levy breakdowns — **not** official rates engines wired to GRA/KRA APIs |
| Ghana "ICUMS-style" | Genuinely ICUMS-*style*: HDV benchmark repricing + full Ghana levy stack. Not connected to ICUMS. |
| Kenya "KRA CRSP" | **Real CRSP July-2025 data matching** (score-based vehicle match); depreciation currently estimated; duty = flat rates on the CRSP-derived value |
| Official duty | Nowhere claimed — every response carries `official: false` and notes "requires validation through ICUMS/GRA or KRA iCMS"; UI says "estimate" throughout |
| Exchange rate | Static `15.0` USD→GHS in engine config — **staleness risk**: not a live FX feed |

---

## 6. Defects found this round (all fixed — commit `7a86f636` + customs fix)

| # | Sev | Defect | Before | After |
|---|---|---|---|---|
| D-001 | S2 | Guest paywall: synthetic `guest-*@afruheritage.local` email rejected by Paystack | **Cloudflare 502** on 3rd check | Pilot → `pilot_closed` prompt (200); post-pilot → 422 real email required |
| D-002 | S2 | `/customs/calculate` KE+vehicle **without** `cif_value` | **500** `TypeError: float(None)` | Routed to KRA CRSP orchestrator → 200 real result |
| D-003 | S2 | Guest calculate for unsupported country (e.g. NG) | **500** KeyError | Controlled **422** "not supported" |
| — | note | Frontend country pages NG/UG/RW/ZA/TZ | render 200 | Informational landing pages only — no broken calculator behind them |

## 7. Known limitations for pilot participants

1. **Estimates, not assessments** — results are indicative; official duty
   requires GRA/ICUMS or KRA iCMS.
2. **Static FX rate** (GHS 15.0/USD) — does not track the market; could
   materially skew totals. Recommend wiring a live FX source before
   paid-tier launch.
3. **Ghana benchmark repricing** — the user's declared value may be
   overridden by the HDV benchmark; this is realistic but should be
   explained in UI copy.
4. **Kenya deprecation estimated** — CRSP match is real, depreciation
   band is estimated pending the official valuation template.
5. **Guest paid tier off during pilot** — by design; payment init resumes
   post-pilot behind the real-email requirement.

## 8. Files & code references

- Dispatcher + catalogue: `app/api/routes/customs.py`
- Guest cap/paywall: `app/api/routes/customs_guest.py`
- Engines: `app/services/customs/{providers,ghana_rules,vehicle_valuation,ghana_public_providers}.py`
- Raw responses: `evidence/*.json` in this archive
