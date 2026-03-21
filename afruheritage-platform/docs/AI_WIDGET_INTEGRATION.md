# AI Widget Integration Guide

## Purpose
This document explains how the Afruheritage floating AI widget is integrated into both the control plane and all tenant runtimes. The widget appears automatically on every page without manual setup per tenant.

## Architecture
| Component | Path | Description |
|-----------|------|-------------|
| Chat endpoint | `/api/v1/ai/chat` | Sends user message, returns AI response |
| Widget config | `/api/v1/ai/widget/config?host={hostname}` | Returns tenant-specific widget config |
| Embed script | `/static/widget/embed.js` | Self-contained JS widget injected into pages |
| Widget frame | `/widget/frame` | Optional iframe-based widget renderer |

## Model Rules
| Purpose | Model | Usage |
|---------|-------|-------|
| Default chat | `afruheritage-copilot:latest` | All tenants by default |
| Fallback | `llama3:latest` | General-purpose fallback |
| Dev/Admin | `deepseek-coder:latest` | Internal admin tools only |
| Embedding | `nomic-embed-text:latest` | RAG vector search only, never for chat |

## Retrieval Scope Rules
| Context | Scope | Search order |
|---------|-------|-------------|
| Mother platform | `shared` | Shared docs only |
| Tenant page | `tenant:<tenant-slug>` | Tenant docs first, then shared docs |

## Control Plane Integration
Insert in the shared base HTML layout before `</body>`:
```html
<script src="/static/widget/embed.js" data-api-base=""></script>
```

If served from another domain:
```html
<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script>
```

## Tenant Integration — Nginx Auto-Injection
The widget is injected into every tenant HTML page via Nginx `sub_filter`. This is configured in `infra/nginx/tenant_console.conf.template`:

```nginx
proxy_set_header Accept-Encoding "";
sub_filter_once off;
sub_filter_types text/html;
sub_filter '</body>' '<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script></body>';
```

Requirements for this to work:
- Response must be `text/html`
- Gzip must be disabled for the proxied HTML (`Accept-Encoding ""`)
- Every new tenant provisioned behind the Nginx template gets the widget automatically

## Auto-Provisioning on Tenant Launch
When a tenant is launched (in `app/api/routes/tenants.py`), the system automatically:
1. Calls `ensure_tenant_ai_settings()` → creates `TenantAISettings` row
2. Calls `ensure_tenant_branding()` → creates `TenantBranding` row

Default AI settings created:
- `widget_enabled` = `true`
- `chat_model` = `afruheritage-copilot:latest`
- `retrieval_scope` = `tenant:<tenant-slug>`
- `welcome_message` = `Welcome to {company_name} Assistant`
- `theme` = `light`
- `primary_color` = `#0ea5e9`
- `allowed_hostnames` = `<tenant-slug>.afruheritage.com`

**No manual setup is required per tenant.**

## Per-Tenant Model Configuration
- The model is stored in `tenant_ai_settings.chat_model` (DB)
- The widget config endpoint returns it
- The widget uses only the server-assigned model
- Tenants do not choose their own model publicly
- Admin Console or superuser can change a tenant's model

## i18n Support
The widget respects the tenant's `default_language` from branding settings:
- Widget title: uses `ai.widget_title` from i18n (`en`: "AI Assistant", `zh`: "AI助手")
- Placeholder: uses `ai.placeholder` from i18n
- The AI chat endpoint itself responds in the language of the user's message

## Security Rules
- Tenant widget must only respond to requests from allowed hostnames
- Chat route must never expose other tenants' knowledge
- Model must come from trusted server-side config, never from client request
- Do not allow arbitrary public model selection in production
- RAG retrieval is scoped: tenant docs first, shared docs second
- `nomic-embed-text` is for embeddings only, never as a chat model

## Immediate Test Checklist

### Control Plane
- [ ] Widget appears on every page
- [ ] Opens as floating chatbot
- [ ] Answers with `afruheritage-copilot:latest`
- [ ] Retrieval scope is `shared`

### Tenant Runtime
- [ ] Widget appears automatically on every tenant page (via Nginx injection)
- [ ] Welcome text uses tenant company name
- [ ] Retrieval scope is `tenant:<slug>`
- [ ] No other tenant data leaks in responses
- [ ] Model comes from DB settings

### New Tenant
- [ ] Provisioning creates `TenantAISettings` row automatically
- [ ] Widget appears without any manual editing
- [ ] Tenant host is in allowed hostnames
- [ ] Chat works on first page load
