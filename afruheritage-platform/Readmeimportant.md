Below is the implementation guide I’d hand to the developer.

It gives:

* the architecture
* the files to add
* the code to insert
* where to insert it
* how to make the chatbot float on all pages
* how to make it appear automatically for every new tenant
* how to support a different model per tenant without cross-tenant leakage

---

# 1. Integration goal

Build **one embeddable AI widget system** that works in two places:

### A. Mother platform / control plane

Uses the default platform assistant:

* `afruheritage-copilot:latest`

### B. Every tenant runtime

Loads automatically on every tenant page and uses:

* a tenant-specific AI configuration
* defaulting to `afruheritage-copilot:latest`
* optionally switching later to a tenant-specific model such as:

  * `tenant-acme-copilot:latest`
  * or staying on `afruheritage-copilot:latest` with tenant-private RAG scope

---

# 2. Recommended architecture

Use this design:

## Backend

FastAPI provides:

* `/api/v1/ai/chat`
* `/api/v1/ai/widget/config`
* `/widget/embed.js`
* `/widget/frame`

## Data model

Each tenant gets AI settings stored in DB:

* widget enabled/disabled
* model name
* tenant scope
* theme
* greeting text
* allowed hostnames

## Frontend

A floating chatbot script is injected:

* on the Afruheritage control plane base layout
* on every tenant page via tenant reverse-proxy injection or tenant frontend template

## Provisioning

When a new tenant is created:

* create tenant AI settings automatically
* enable widget by default
* register the tenant domain/subdomain for widget loading
* use tenant scope isolation for retrieval

---

# 3. Model usage rules

Use these models exactly this way:

## Chat model

Default:

```text
afruheritage-copilot:latest
```

## Optional dev/admin model

```text
deepseek-coder:latest
```

Do not use this for public tenant chat by default.

## Fallback general model

```text
llama3:latest
```

## Embedding model

```text
nomic-embed-text:latest
```

---

---

# 5. Create AI settings automatically for every new tenant

This is what makes the widget automatically appear for every tenant later.

## Where to insert

In the tenant approval/provisioning flow, immediately after the tenant is created or approved.

Likely insert in:


## Insert this call

Wherever the tenant is first finalized:

```python
from app.services.tenant_ai_service import create_default_tenant_ai_settings

# after tenant is created/approved
create_default_tenant_ai_settings(db, tenant)
```

---


# 12. Make the widget float on all control-plane pages

If your control plane has a shared base template or layout, add this before `</body>`.

## Insert into:

* base HTML template
* main layout template
* shared React/Next layout if applicable

```html
<script src="/static/widget/embed.js" data-api-base=""></script>
```

If the control plane frontend is served from another domain, use:

```html
<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script>
```

---

# 13. Make the widget appear on every tenant page automatically

This is the most important tenant requirement.

Because tenants run Fleetbase underneath, the cleanest approach is:

## Option A — inject through tenant page template

If you control the tenant frontend template, add:

```html
<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script>
```

before `</body>`.

## Option B — inject through Nginx reverse proxy for tenant pages

If tenant pages are proxied through Nginx and you do not want to modify Fleetbase frontend code directly, add `sub_filter` injection.

### Insert into tenant Nginx template

Likely file:
`infra/nginx/tenant_console.conf.template`

Add inside the location that serves HTML:

```nginx
sub_filter_once off;
sub_filter_types text/html;
proxy_set_header Accept-Encoding "";
sub_filter '</body>' '<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script></body>';
```

This ensures every tenant page gets the widget automatically.

### Important

This works only if:

* the response is HTML
* gzip is disabled for the proxied HTML response in that location

That is why `proxy_set_header Accept-Encoding "";` is included.

This is the simplest way to auto-port the widget to all new tenant pages as soon as they are provisioned behind that Nginx template.

---

# 14. Per-tenant different model support

Do not let tenants send arbitrary model names directly.

Instead:

* store the tenant’s allowed model in `tenant_ai_settings.chat_model`
* return it from `/api/v1/ai/widget/config`
* let the widget use only that configured model

Examples:

* default tenant: `afruheritage-copilot:latest`
* technical tenant: `llama3:latest`
* coding-heavy ops tenant: `deepseek-coder:latest`
* future tenant-private assistant: `tenant-acme-copilot:latest`

This keeps the widget controlled and secure.

---

# 15. Retrieval scope rules

Use these scopes:

## Mother platform

```text
shared
```

## Tenant page

```text
tenant:<tenant-slug>
```

And retrieve in this order:

* tenant-specific docs first
* then shared docs second

That means tenant widget answers are tailored without losing core platform knowledge.

---

# 16. What the developer must not do

* do not use `nomic-embed-text` as a chat model
* do not let public clients choose any model string
* do not expose other tenants’ knowledge
* do not hardcode tenant hostnames into widget code
* do not require manual widget insertion per tenant after go-live
* do not skip tenant AI settings creation during provisioning
* do not bypass host validation
* do not mark tenant AI active if widget config is missing

---

# 17. Recommended README file to add

Create:

`docs/AI_WIDGET_INTEGRATION.md`

Use this content:

```md
# AI Widget Integration Guide

## Purpose
This document explains how the Afruheritage floating AI widget is integrated into both the control plane and all tenant runtimes.

## Architecture
- chat endpoint: `/api/v1/ai/chat`
- widget config endpoint: `/api/v1/ai/widget/config`
- widget script: `/static/widget/embed.js`

## Model Rules
- default chat model: `afruheritage-copilot:latest`
- optional fallback: `llama3:latest`
- optional dev model: `deepseek-coder:latest`
- embedding model: `nomic-embed-text:latest`

## Control Plane Integration
Insert the widget script into the shared base layout before `</body>`.

## Tenant Integration
Widget must be injected automatically for every tenant page through the tenant frontend template or Nginx HTML injection.

## New Tenant Provisioning Requirement
When a tenant is created or approved, create a matching `tenant_ai_settings` row automatically.
Default values:
- widget enabled = true
- model = `afruheritage-copilot:latest`
- scope = `tenant:<tenant-slug>`
- allowed hostnames = `<tenant-slug>.afruheritage.com`

## Security
- tenant widget must only use allowed hostnames
- chat route must not expose other tenant knowledge
- model must come from trusted server-side config
- do not allow arbitrary public model selection in production
```

---

# 18. Exact insertion map

## Add files

* `app/models/tenant_ai_settings.py`
* `app/services/tenant_ai_service.py`
* `app/api/routes/ai_widget.py`
* `app/static/widget/embed.js`
* `docs/AI_WIDGET_INTEGRATION.md`

## Update files

* `app/schemas/ai.py`
* `app/api/routes/ai.py`
* `app/main.py`
* tenant provisioning service
* `infra/nginx/tenant_console.conf.template`

---

# 19. Immediate test checklist

After developer integrates this:

### Control plane

* widget appears on every page
* opens as floating chatbot
* answers with `afruheritage-copilot:latest`

### Tenant runtime

* widget appears automatically on every tenant page
* welcome text uses tenant name
* retrieval scope is `tenant:<slug>`
* no other tenant data leaks
* model comes from DB settings

### New tenant

* provisioning creates AI settings row automatically
* widget appears without manual editing
* tenant host is allowed
* chat works on first load

---

# 20. Strong recommendation

For production:

* keep the widget model **server-assigned**
* keep retrieval scope **server-assigned**
* let tenants customize greeting/theme later
* only expose model-switching in internal admin tools, not public tenant UI

If you want, I can turn this next into a **ready-to-paste patch set** for your project files, including an updated `main.py`, a sample Alembic migration, and the Nginx template edit exactly as it should appear.
