Below is the implementation guide I’d hand to the developer.

It gives:

the architecture

the files to add

the code to insert

where to insert it

how to make the chatbot float on all pages

how to make it appear automatically for every new tenant

how to support a different model per tenant without cross-tenant leakage

1. Integration goal

Build one embeddable AI widget system that works in two places:

A. Mother platform / control plane

Uses the default platform assistant:

afruheritage-copilot:latest

B. Every tenant runtime

Loads automatically on every tenant page and uses:

a tenant-specific AI configuration

defaulting to afruheritage-copilot:latest

optionally switching later to a tenant-specific model such as:

tenant-acme-copilot:latest

or staying on afruheritage-copilot:latest with tenant-private RAG scope

2. Recommended architecture

Use this design:

Backend

FastAPI provides:

/api/v1/ai/chat

/api/v1/ai/widget/config

/widget/embed.js

/widget/frame

Data model

Each tenant gets AI settings stored in DB:

widget enabled/disabled

model name

tenant scope

theme

greeting text

allowed hostnames

Frontend

A floating chatbot script is injected:

on the Afruheritage control plane base layout

on every tenant page via tenant reverse-proxy injection or tenant frontend template

Provisioning

When a new tenant is created:

create tenant AI settings automatically

enable widget by default

register the tenant domain/subdomain for widget loading

use tenant scope isolation for retrieval

3. Model usage rules

Use these models exactly this way:

Chat model

Default:

afruheritage-copilot:latest
