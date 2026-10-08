# SMTP Configuration Smoke Report

**Date (UTC):** 2026-09-15T07:06:47.731605+00:00

**Configured SMTP host:** smtp.zoho.com:587 (STARTTLS)

**Supplied credentials:** Used and not included in this report.

## Summary

| Check | Result |
|-------|--------|
| SMTP CONFIGURED | YES |
| WELCOME EMAIL | PASS |
| PASSWORD RESET | PASS |
| TEAM INVITATION | PASS |
| TRANSACTIONAL EMAIL | PASS |
| EXTERNAL MAILBOX RECEIPT | PASS |
| SECRETS IN REPORT | NO |
| SECRETS COMMITTED | NO |

## Details

```json
{
  "mailboxes": {
    "box1_prefix": "afru_smtp_...",
    "box2_prefix": "afru_smtp_..."
  },
  "welcome": {
    "accepted": true,
    "received": true,
    "subjects": [
      "Welcome to Afruheritage \u2014 SavannaRoute Freight is Ready!"
    ]
  },
  "forgot_password": {
    "accepted": true,
    "received": true
  },
  "team_invitation": {
    "accepted": true,
    "received": true
  },
  "transactional": {
    "accepted": true,
    "received": true
  }
}
```

## Notes

- All reset tokens, invitation tokens and account setup links were redacted from this evidence.
- The actual mailbox addresses were temporary disposable inboxes; they are not recorded as production credentials.
- No SMTP credentials were committed to Git.
