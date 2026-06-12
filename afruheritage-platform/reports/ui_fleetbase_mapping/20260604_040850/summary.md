# AfruHeritage UI → Fleetbase Feature Mapping
Generated: Thu Jun  4 04:08:50 AM UTC 2026

## 1. Frontend Route/Page Inventory
```
./admin-console/admin_app/api/routes/analytics.py
./admin-console/admin_app/api/routes/auth.py
./admin-console/admin_app/api/routes/billing.py
./admin-console/admin_app/api/routes/dashboard_local.py
./admin-console/admin_app/api/routes/dashboard.py
./admin-console/admin_app/api/routes/domains.py
./admin-console/admin_app/api/routes/__init__.py
./admin-console/admin_app/api/routes/kyc.py
./admin-console/admin_app/api/routes/oauth.py
./admin-console/admin_app/api/routes/__pycache__/analytics.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/auth.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/billing.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/dashboard.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/dashboard_local.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/domains.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/__init__.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/kyc.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/oauth.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/runners.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/runners_local.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/runtime.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/tenants_advanced.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/tenants.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/tickets.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/tracking.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/users.cpython-310.pyc
./admin-console/admin_app/api/routes/__pycache__/vendors.cpython-310.pyc
./admin-console/admin_app/api/routes/runners_local.py
./admin-console/admin_app/api/routes/runners.py
./admin-console/admin_app/api/routes/runtime.py
./admin-console/admin_app/api/routes/tenants_advanced.py
./admin-console/admin_app/api/routes/tenants.py
./admin-console/admin_app/api/routes/tickets.py
./admin-console/admin_app/api/routes/tracking.py
./admin-console/admin_app/api/routes/users.py
./admin-console/admin_app/api/routes/vendors.py
./admin-console/frontend/app/dashboard/analytics/page.tsx
./admin-console/frontend/app/dashboard/architecture/page.tsx
./admin-console/frontend/app/dashboard/billing/page.tsx
./admin-console/frontend/app/dashboard/blueprint/page.tsx
./admin-console/frontend/app/dashboard/domains/page.tsx
./admin-console/frontend/app/dashboard/knowledge-base/page.tsx
./admin-console/frontend/app/dashboard/kyc/page.tsx
./admin-console/frontend/app/dashboard/page.tsx
./admin-console/frontend/app/dashboard/runners/page.tsx
./admin-console/frontend/app/dashboard/runtimes/page.tsx
./admin-console/frontend/app/dashboard/tenants/page.tsx
./admin-console/frontend/app/dashboard/tickets/page.tsx
./admin-console/frontend/app/dashboard/tracking/page.tsx
./admin-console/frontend/app/dashboard/users/page.tsx
./admin-console/frontend/app/dashboard/vendor-actions/page.tsx
./admin-console/frontend/app/dashboard/vendors/page.tsx
./admin-console/frontend/app/login/page.tsx
./admin-console/frontend/app/page.tsx
./admin-console/frontend/.next/dev/server/app/dashboard/analytics/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/analytics/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/architecture/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/architecture/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/billing/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/billing/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/blueprint/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/blueprint/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/domains/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/domains/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/knowledge-base/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/knowledge-base/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/kyc/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/kyc/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/runners/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/runners/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/runtimes/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/runtimes/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/tenants/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/tenants/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/tickets/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/tickets/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/tracking/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/tracking/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/users/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/users/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/vendor-actions/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/vendor-actions/page.js.map
./admin-console/frontend/.next/dev/server/app/dashboard/vendors/page.js
./admin-console/frontend/.next/dev/server/app/dashboard/vendors/page.js.map
./admin-console/frontend/.next/dev/server/app/login/page.js
./admin-console/frontend/.next/dev/server/app/login/page.js.map
./admin-console/frontend/.next/dev/server/app/_not-found/page.js
./admin-console/frontend/.next/dev/server/app/_not-found/page.js.map
./admin-console/frontend/.next/dev/server/app/page.js
./admin-console/frontend/.next/dev/server/app/page.js.map
./admin-console/frontend/.next/dev/server/pages/_app/build-manifest.json
./admin-console/frontend/.next/dev/server/pages/_app/client-build-manifest.json
./admin-console/frontend/.next/dev/server/pages/_app.js
./admin-console/frontend/.next/dev/server/pages/_app.js.map
./admin-console/frontend/.next/dev/server/pages/_app/next-font-manifest.json
./admin-console/frontend/.next/dev/server/pages/_app/pages-manifest.json
./admin-console/frontend/.next/dev/server/pages/_app/react-loadable-manifest.json
./admin-console/frontend/.next/dev/server/pages/_document.js
./admin-console/frontend/.next/dev/server/pages/_document.js.map
./admin-console/frontend/.next/dev/server/pages/_document/next-font-manifest.json
./admin-console/frontend/.next/dev/server/pages/_document/pages-manifest.json
./admin-console/frontend/.next/dev/server/pages/_document/react-loadable-manifest.json
./admin-console/frontend/.next/dev/server/pages/_error/build-manifest.json
./admin-console/frontend/.next/dev/server/pages/_error/client-build-manifest.json
./admin-console/frontend/.next/dev/server/pages/_error.js
./admin-console/frontend/.next/dev/server/pages/_error.js.map
./admin-console/frontend/.next/dev/server/pages/_error/next-font-manifest.json
./admin-console/frontend/.next/dev/server/pages/_error/pages-manifest.json
./admin-console/frontend/.next/dev/server/pages/_error/react-loadable-manifest.json
./admin-console/frontend/.next/dev/static/chunks/app/dashboard/page.js
./admin-console/frontend/.next/dev/static/chunks/app/login/page.js
./admin-console/frontend/.next/dev/static/chunks/app/page.js
./admin-console/frontend/.next/dev/static/chunks/pages/_app.js
./admin-console/frontend/.next/dev/static/chunks/pages/_error.js
./admin-console/frontend/.next/dev/types/app/dashboard/page.ts
./admin-console/frontend/.next/dev/types/app/login/page.ts
./admin-console/frontend/.next/dev/types/app/page.ts
./admin-console/frontend/.next/server/app/dashboard/analytics/page.js
./admin-console/frontend/.next/server/app/dashboard/analytics/page.js.map
./admin-console/frontend/.next/server/app/dashboard/analytics/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/billing/page.js
./admin-console/frontend/.next/server/app/dashboard/billing/page.js.map
./admin-console/frontend/.next/server/app/dashboard/billing/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/domains/page.js
./admin-console/frontend/.next/server/app/dashboard/domains/page.js.map
./admin-console/frontend/.next/server/app/dashboard/domains/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/knowledge-base/page.js
./admin-console/frontend/.next/server/app/dashboard/knowledge-base/page.js.map
./admin-console/frontend/.next/server/app/dashboard/knowledge-base/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/kyc/page.js
./admin-console/frontend/.next/server/app/dashboard/kyc/page.js.map
./admin-console/frontend/.next/server/app/dashboard/kyc/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/page.js
./admin-console/frontend/.next/server/app/dashboard/page.js.map
./admin-console/frontend/.next/server/app/dashboard/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/runners/page.js
./admin-console/frontend/.next/server/app/dashboard/runners/page.js.map
./admin-console/frontend/.next/server/app/dashboard/runners/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/runtimes/page.js
./admin-console/frontend/.next/server/app/dashboard/runtimes/page.js.map
./admin-console/frontend/.next/server/app/dashboard/runtimes/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/tenants/page.js
./admin-console/frontend/.next/server/app/dashboard/tenants/page.js.map
./admin-console/frontend/.next/server/app/dashboard/tenants/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/tickets/page.js
./admin-console/frontend/.next/server/app/dashboard/tickets/page.js.map
./admin-console/frontend/.next/server/app/dashboard/tickets/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/tracking/page.js
./admin-console/frontend/.next/server/app/dashboard/tracking/page.js.map
./admin-console/frontend/.next/server/app/dashboard/tracking/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/users/page.js
./admin-console/frontend/.next/server/app/dashboard/users/page.js.map
./admin-console/frontend/.next/server/app/dashboard/users/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/vendor-actions/page.js
./admin-console/frontend/.next/server/app/dashboard/vendor-actions/page.js.map
./admin-console/frontend/.next/server/app/dashboard/vendor-actions/page.js.nft.json
./admin-console/frontend/.next/server/app/dashboard/vendors/page.js
./admin-console/frontend/.next/server/app/dashboard/vendors/page.js.map
./admin-console/frontend/.next/server/app/dashboard/vendors/page.js.nft.json
./admin-console/frontend/.next/server/app/_global-error/page.js
./admin-console/frontend/.next/server/app/_global-error/page.js.map
./admin-console/frontend/.next/server/app/_global-error/page.js.nft.json
./admin-console/frontend/.next/server/app/login/page.js
./admin-console/frontend/.next/server/app/login/page.js.map
./admin-console/frontend/.next/server/app/login/page.js.nft.json
./admin-console/frontend/.next/server/app/_not-found/page.js
./admin-console/frontend/.next/server/app/_not-found/page.js.map
./admin-console/frontend/.next/server/app/_not-found/page.js.nft.json
./admin-console/frontend/.next/server/app/page.js
./admin-console/frontend/.next/server/app/page.js.map
./admin-console/frontend/.next/server/app/page.js.nft.json
./admin-console/frontend/.next/server/pages/404.html
./admin-console/frontend/.next/server/pages/500.html
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/analytics/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/analytics/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/analytics/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/billing/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/billing/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/billing/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/domains/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/domains/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/domains/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/knowledge-base/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/knowledge-base/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/knowledge-base/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/kyc/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/kyc/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/kyc/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/runners/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/runners/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/runners/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/runtimes/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/runtimes/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/runtimes/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tenants/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tenants/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tenants/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tickets/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tickets/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tickets/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tracking/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tracking/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/tracking/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/users/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/users/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/users/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/vendor-actions/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/vendor-actions/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/vendor-actions/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/vendors/page.js
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/vendors/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/dashboard/vendors/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/_global-error/page.js
./admin-console/frontend/.next/standalone/.next/server/app/_global-error/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/_global-error/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/login/page.js
./admin-console/frontend/.next/standalone/.next/server/app/login/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/login/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/_not-found/page.js
./admin-console/frontend/.next/standalone/.next/server/app/_not-found/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/_not-found/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/app/page.js
./admin-console/frontend/.next/standalone/.next/server/app/page.js.map
./admin-console/frontend/.next/standalone/.next/server/app/page.js.nft.json
./admin-console/frontend/.next/standalone/.next/server/pages/404.html
./admin-console/frontend/.next/standalone/.next/server/pages/500.html
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/normalizers/built/pages/index.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/builtin/_error.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/module.compiled.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/module.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/module.render.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/pages-handler.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./admin-console/frontend/.next/standalone/node_modules/next/dist/shared/lib/router/routes/app.js
./admin-console/frontend/node_modules/next/dist/build/segment-config/pages/pages-segment-config.d.ts
./admin-console/frontend/node_modules/next/dist/build/segment-config/pages/pages-segment-config.js
./admin-console/frontend/node_modules/next/dist/build/segment-config/pages/pages-segment-config.js.map
./admin-console/frontend/node_modules/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.d.ts
./admin-console/frontend/node_modules/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js
./admin-console/frontend/node_modules/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./admin-console/frontend/node_modules/next/dist/client/dev/hot-reloader/pages/websocket.d.ts
./admin-console/frontend/node_modules/next/dist/client/dev/hot-reloader/pages/websocket.js
./admin-console/frontend/node_modules/next/dist/client/dev/hot-reloader/pages/websocket.js.map
./admin-console/frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/01-installation.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/02-project-structure.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/04-images.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/05-fonts.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/06-css.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/11-deploying.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/01-getting-started/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/analytics.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/authentication.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/babel.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/ci-build-caching.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/content-security-policy.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/css-in-js.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/custom-server.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/debugging.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/draft-mode.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/environment-variables.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/forms.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/incremental-static-regeneration.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/instrumentation.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/internationalization.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/lazy-loading.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/mdx.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/migrating/app-router-migration.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/migrating/from-create-react-app.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/migrating/from-vite.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/migrating/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/multi-zones.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/open-telemetry.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/package-bundling.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/post-css.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/preview-mode.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/production-checklist.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/redirecting.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/sass.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/scripts.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/self-hosting.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/static-exports.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/tailwind-v3-css.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/testing/cypress.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/testing/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/testing/jest.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/testing/playwright.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/testing/vitest.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/third-party-libraries.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/codemods.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-10.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-11.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-12.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-13.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-14.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-9.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/01-pages-and-layouts.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/02-dynamic-routes.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/03-linking-and-navigating.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/05-custom-app.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/06-custom-document.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/07-api-routes.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/08-custom-error.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/01-server-side-rendering.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/02-static-site-generation.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/04-automatic-static-optimization.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/05-client-side-rendering.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/01-get-static-props.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/02-get-static-paths.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-forms-and-mutations.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-get-server-side-props.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/05-client-side.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/06-configuring/12-error-handling.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/06-configuring/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/03-building-your-application/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/font.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/form.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/head.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/image-legacy.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/image.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/link.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/script.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/instrumentation.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/proxy.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/public-folder.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/src-folder.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-initial-props.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-server-side-props.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-static-paths.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-static-props.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/next-request.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/next-response.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-params.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/userAgent.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-report-web-vitals.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-router.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-search-params.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/adapterPath.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/allowedDevOrigins.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/assetPrefix.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/basePath.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/bundlePagesRouterDependencies.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/compress.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/crossOrigin.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/deploymentId.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/devIndicators.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/distDir.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/env.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/exportPathMap.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateBuildId.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateEtags.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/headers.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/httpAgentOptions.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/images.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/logging.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/onDemandEntries.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/optimizePackageImports.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/output.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/pageExtensions.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/poweredByHeader.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/productionBrowserSourceMaps.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/proxyClientMaxBodySize.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/reactStrictMode.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/redirects.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/rewrites.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/serverExternalPackages.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/trailingSlash.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/transpilePackages.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/turbopack.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/typescript.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/urlImports.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/useLightningcss.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webpack.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webVitalsAttribution.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-typescript.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/02-eslint.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/05-cli/create-next-app.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/05-cli/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/05-cli/next.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/06-edge.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/08-turbopack.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/04-api-reference/index.md
./admin-console/frontend/node_modules/next/dist/docs/02-pages/index.md
./admin-console/frontend/node_modules/next/dist/esm/build/segment-config/pages/pages-segment-config.js
./admin-console/frontend/node_modules/next/dist/esm/build/segment-config/pages/pages-segment-config.js.map
./admin-console/frontend/node_modules/next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js
./admin-console/frontend/node_modules/next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./admin-console/frontend/node_modules/next/dist/esm/client/dev/hot-reloader/pages/websocket.js
./admin-console/frontend/node_modules/next/dist/esm/client/dev/hot-reloader/pages/websocket.js.map
./admin-console/frontend/node_modules/next/dist/esm/export/routes/app-page.js
./admin-console/frontend/node_modules/next/dist/esm/export/routes/app-page.js.map
./admin-console/frontend/node_modules/next/dist/esm/export/routes/app-route.js
./admin-console/frontend/node_modules/next/dist/esm/export/routes/app-route.js.map
./admin-console/frontend/node_modules/next/dist/esm/export/routes/pages.js
./admin-console/frontend/node_modules/next/dist/esm/export/routes/pages.js.map
./admin-console/frontend/node_modules/next/dist/esm/export/routes/types.js
./admin-console/frontend/node_modules/next/dist/esm/export/routes/types.js.map
./admin-console/frontend/node_modules/next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js
./admin-console/frontend/node_modules/next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js.map
./admin-console/frontend/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./admin-console/frontend/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./admin-console/frontend/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./admin-console/frontend/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./admin-console/frontend/node_modules/next/dist/esm/pages/_app.js
./admin-console/frontend/node_modules/next/dist/esm/pages/_app.js.map
./admin-console/frontend/node_modules/next/dist/esm/pages/_document.js
./admin-console/frontend/node_modules/next/dist/esm/pages/_document.js.map
./admin-console/frontend/node_modules/next/dist/esm/pages/_error.js
./admin-console/frontend/node_modules/next/dist/esm/pages/_error.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/index.js
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/index.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js
./admin-console/frontend/node_modules/next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/builtin/_error.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/builtin/_error.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.compiled.d.ts
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.compiled.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.compiled.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.render.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/module.render.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/pages-handler.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/pages-handler.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js.map
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./admin-console/frontend/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./admin-console/frontend/node_modules/next/dist/esm/shared/lib/router/routes/app.js
./admin-console/frontend/node_modules/next/dist/esm/shared/lib/router/routes/app.js.map
./admin-console/frontend/node_modules/next/dist/export/routes/app-page.d.ts
./admin-console/frontend/node_modules/next/dist/export/routes/app-page.js
./admin-console/frontend/node_modules/next/dist/export/routes/app-page.js.map
./admin-console/frontend/node_modules/next/dist/export/routes/app-route.d.ts
./admin-console/frontend/node_modules/next/dist/export/routes/app-route.js
./admin-console/frontend/node_modules/next/dist/export/routes/app-route.js.map
./admin-console/frontend/node_modules/next/dist/export/routes/pages.d.ts
./admin-console/frontend/node_modules/next/dist/export/routes/pages.js
./admin-console/frontend/node_modules/next/dist/export/routes/pages.js.map
./admin-console/frontend/node_modules/next/dist/export/routes/types.d.ts
./admin-console/frontend/node_modules/next/dist/export/routes/types.js
./admin-console/frontend/node_modules/next/dist/export/routes/types.js.map
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/hydration-error-state.d.ts
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/hydration-error-state.js
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/hydration-error-state.js.map
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.d.ts
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.d.ts
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./admin-console/frontend/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./admin-console/frontend/node_modules/next/dist/pages/_app.d.ts
./admin-console/frontend/node_modules/next/dist/pages/_app.js
./admin-console/frontend/node_modules/next/dist/pages/_app.js.map
./admin-console/frontend/node_modules/next/dist/pages/_document.d.ts
./admin-console/frontend/node_modules/next/dist/pages/_document.js
./admin-console/frontend/node_modules/next/dist/pages/_document.js.map
./admin-console/frontend/node_modules/next/dist/pages/_error.d.ts
./admin-console/frontend/node_modules/next/dist/pages/_error.js
./admin-console/frontend/node_modules/next/dist/pages/_error.js.map
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/index.d.ts
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/index.js
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/index.js.map
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.d.ts
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.d.ts
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.d.ts
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.js
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.d.ts
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js
./admin-console/frontend/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/builtin/_error.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/builtin/_error.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/builtin/_error.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.compiled.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.compiled.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.compiled.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.render.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.render.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/module.render.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/pages-handler.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/pages-handler.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/pages-handler.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.js.map
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.d.ts
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./admin-console/frontend/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./admin-console/frontend/node_modules/next/dist/shared/lib/router/routes/app.d.ts
./admin-console/frontend/node_modules/next/dist/shared/lib/router/routes/app.js
./admin-console/frontend/node_modules/next/dist/shared/lib/router/routes/app.js.map
./app/api/routes/admin_credits.py
./app/api/routes/admin_dns.py
./app/api/routes/admin_marketplace.py
./app/api/routes/admin_subscriptions.py
./app/api/routes/ai.py
./app/api/routes/ai_widget.py
./app/api/routes/analytics.py
./app/api/routes/auth_pages.py
./app/api/routes/auth.py
./app/api/routes/billing.py
./app/api/routes/branding.py
./app/api/routes/commercial_orchestration.py
./app/api/routes/commercial_orchestration.py.bak.async.1780107455
./app/api/routes/commercial_orchestration.py.bak.reconcile.1780102207
./app/api/routes/commercial_orchestration.py.bak.reconcile.1780102228
./app/api/routes/company_registration.py
./app/api/routes/custom_domains.py
./app/api/routes/customer_portal.py
./app/api/routes/fleetbase_runtime.py
./app/api/routes/geo.py
./app/api/routes/health.py
./app/api/routes/i18n.py
./app/api/routes/kyc.py
./app/api/routes/marketplace.py
./app/api/routes/navigator.py
./app/api/routes/pallet.py
./app/api/routes/payment_hub.py
./app/api/routes/payment_hub.py.bak.1779863307
./app/api/routes/payments.py
./app/api/routes/__pycache__/admin_credits.cpython-310.pyc
./app/api/routes/__pycache__/admin_dns.cpython-310.pyc
./app/api/routes/__pycache__/admin_marketplace.cpython-310.pyc
./app/api/routes/__pycache__/admin_subscriptions.cpython-310.pyc
./app/api/routes/__pycache__/ai.cpython-310.pyc
./app/api/routes/__pycache__/ai_widget.cpython-310.pyc
./app/api/routes/__pycache__/analytics.cpython-310.pyc
./app/api/routes/__pycache__/auth.cpython-310.pyc
./app/api/routes/__pycache__/auth_pages.cpython-310.pyc
./app/api/routes/__pycache__/billing.cpython-310.pyc
./app/api/routes/__pycache__/branding.cpython-310.pyc
./app/api/routes/__pycache__/commercial_orchestration.cpython-310.pyc
./app/api/routes/__pycache__/company_registration.cpython-310.pyc
./app/api/routes/__pycache__/custom_domains.cpython-310.pyc
./app/api/routes/__pycache__/customer_portal.cpython-310.pyc
./app/api/routes/__pycache__/fleetbase_runtime.cpython-310.pyc
./app/api/routes/__pycache__/geo.cpython-310.pyc
./app/api/routes/__pycache__/health.cpython-310.pyc
./app/api/routes/__pycache__/i18n.cpython-310.pyc
./app/api/routes/__pycache__/kyc.cpython-310.pyc
./app/api/routes/__pycache__/marketplace.cpython-310.pyc
./app/api/routes/__pycache__/navigator.cpython-310.pyc
./app/api/routes/__pycache__/pallet.cpython-310.pyc
./app/api/routes/__pycache__/payment_hub.cpython-310.pyc
./app/api/routes/__pycache__/payments.cpython-310.pyc
./app/api/routes/__pycache__/runners.cpython-310.pyc
./app/api/routes/__pycache__/shipments.cpython-310.pyc
./app/api/routes/__pycache__/social_auth.cpython-310.pyc
./app/api/routes/__pycache__/storefront.cpython-310.pyc
./app/api/routes/__pycache__/support_crm.cpython-310.pyc
./app/api/routes/__pycache__/tenant_creation.cpython-310.pyc
./app/api/routes/__pycache__/tenant_requests.cpython-310.pyc
./app/api/routes/__pycache__/tenants.cpython-310.pyc
./app/api/routes/__pycache__/users.cpython-310.pyc
./app/api/routes/__pycache__/vendors.cpython-310.pyc
./app/api/routes/__pycache__/whatsapp_bot.cpython-310.pyc
./app/api/routes/__pycache__/whatsapp.cpython-310.pyc
./app/api/routes/__pycache__/whatsapp_csv.cpython-310.pyc
./app/api/routes/runners.py
./app/api/routes/shipments.py
./app/api/routes/social_auth.py
./app/api/routes/storefront.py
./app/api/routes/support_crm.py
./app/api/routes/tenant_creation.py
./app/api/routes/tenant_requests.py
./app/api/routes/tenants.py
./app/api/routes/users.py
./app/api/routes/vendors.py
./app/api/routes/whatsapp_bot.py
./app/api/routes/whatsapp_csv.py
./app/api/routes/whatsapp.py
./app/onboarding-docs/page.tsx
./frontend/app/admin/page.tsx
./frontend/app/admin/runtime/page.tsx
./frontend/app/billing/callback/page.tsx
./frontend/app/billing/callback/page.tsx.bak.1779859840
./frontend/app/billing/page.tsx
./frontend/app/cookie-policy/page.tsx
./frontend/app/crm/contacts/page.tsx
./frontend/app/crm/page.tsx
./frontend/app/crm/quotes/page.tsx
./frontend/app/dashboard/page.tsx
./frontend/app/docs/page.tsx
./frontend/app/fleetbase/drivers/page.tsx
./frontend/app/fleetbase/extensions/page.tsx
./frontend/app/fleetbase/vehicles/page.tsx
./frontend/app/gdpr/page.tsx
./frontend/app/kyc/page.tsx
./frontend/app/login/page.tsx
./frontend/app/marketplace/page.tsx
./frontend/app/members/[id]/edit/page.tsx
./frontend/app/members/[id]/page.tsx
./frontend/app/members/import/page.tsx
./frontend/app/members/new/page.tsx
./frontend/app/members/page.tsx
./frontend/app/onboarding/page.tsx
./frontend/app/page.tsx
./frontend/app/pricing/page.tsx
./frontend/app/privacy-policy/page.tsx
./frontend/app/register/company/page.tsx
./frontend/app/register/page.tsx
./frontend/app/settings/page.tsx
./frontend/app/shipments/[id]/edit/page.tsx
./frontend/app/shipments/[id]/page.tsx
./frontend/app/shipments/new/page.tsx
./frontend/app/shipments/page.tsx
./frontend/app/support/page.tsx
./frontend/app/support/ticket/[token]/page.tsx
./frontend/app/tenant-request/page.tsx
./frontend/app/terms-of-service/page.tsx
./frontend/app/track/page.tsx
./frontend/app/vendors/page.tsx
./frontend/.next/dev/server/app/page.js
./frontend/.next/dev/server/app/page.js.map
./frontend/.next/dev/server/app/pricing/page.js
./frontend/.next/dev/server/app/register/page.js
./frontend/.next/dev/server/app/settings/page.js
./frontend/.next/dev/static/chunks/app/pricing/page.js
./frontend/.next/dev/static/chunks/app/register/page.js
./frontend/.next/dev/static/chunks/app/settings/page.js
./frontend/.next/dev/types/app/pricing/page.ts
./frontend/.next/dev/types/app/register/page.ts
./frontend/.next/dev/types/app/settings/page.ts
./frontend/.next/server/app/admin/page.js
./frontend/.next/server/app/admin/page.js.map
./frontend/.next/server/app/admin/page.js.nft.json
./frontend/.next/server/app/admin/runtime/page.js
./frontend/.next/server/app/admin/runtime/page.js.map
./frontend/.next/server/app/admin/runtime/page.js.nft.json
./frontend/.next/server/app/billing/callback/page.js
./frontend/.next/server/app/billing/callback/page.js.map
./frontend/.next/server/app/billing/callback/page.js.nft.json
./frontend/.next/server/app/billing/page.js
./frontend/.next/server/app/billing/page.js.map
./frontend/.next/server/app/billing/page.js.nft.json
./frontend/.next/server/app/cookie-policy/page.js
./frontend/.next/server/app/cookie-policy/page.js.map
./frontend/.next/server/app/cookie-policy/page.js.nft.json
./frontend/.next/server/app/crm/contacts/page.js
./frontend/.next/server/app/crm/contacts/page.js.map
./frontend/.next/server/app/crm/contacts/page.js.nft.json
./frontend/.next/server/app/crm/page.js
./frontend/.next/server/app/crm/page.js.map
./frontend/.next/server/app/crm/page.js.nft.json
./frontend/.next/server/app/crm/quotes/page.js
./frontend/.next/server/app/crm/quotes/page.js.map
./frontend/.next/server/app/crm/quotes/page.js.nft.json
./frontend/.next/server/app/dashboard/page.js
./frontend/.next/server/app/dashboard/page.js.map
./frontend/.next/server/app/dashboard/page.js.nft.json
./frontend/.next/server/app/docs/page.js
./frontend/.next/server/app/docs/page.js.map
./frontend/.next/server/app/docs/page.js.nft.json
./frontend/.next/server/app/fleetbase/drivers/page.js
./frontend/.next/server/app/fleetbase/drivers/page.js.map
./frontend/.next/server/app/fleetbase/drivers/page.js.nft.json
./frontend/.next/server/app/fleetbase/extensions/page.js
./frontend/.next/server/app/fleetbase/extensions/page.js.map
./frontend/.next/server/app/fleetbase/extensions/page.js.nft.json
./frontend/.next/server/app/fleetbase/vehicles/page.js
./frontend/.next/server/app/fleetbase/vehicles/page.js.map
./frontend/.next/server/app/fleetbase/vehicles/page.js.nft.json
./frontend/.next/server/app/gdpr/page.js
./frontend/.next/server/app/gdpr/page.js.map
./frontend/.next/server/app/gdpr/page.js.nft.json
./frontend/.next/server/app/_global-error/page.js
./frontend/.next/server/app/_global-error/page.js.map
./frontend/.next/server/app/_global-error/page.js.nft.json
./frontend/.next/server/app/kyc/page.js
./frontend/.next/server/app/kyc/page.js.map
./frontend/.next/server/app/kyc/page.js.nft.json
./frontend/.next/server/app/login/page.js
./frontend/.next/server/app/login/page.js.map
./frontend/.next/server/app/login/page.js.nft.json
./frontend/.next/server/app/marketplace/page.js
./frontend/.next/server/app/marketplace/page.js.map
./frontend/.next/server/app/marketplace/page.js.nft.json
./frontend/.next/server/app/members/[id]/edit/page.js
./frontend/.next/server/app/members/[id]/edit/page.js.map
./frontend/.next/server/app/members/[id]/edit/page.js.nft.json
./frontend/.next/server/app/members/[id]/page.js
./frontend/.next/server/app/members/[id]/page.js.map
./frontend/.next/server/app/members/[id]/page.js.nft.json
./frontend/.next/server/app/members/import/page.js
./frontend/.next/server/app/members/import/page.js.map
./frontend/.next/server/app/members/import/page.js.nft.json
./frontend/.next/server/app/members/new/page.js
./frontend/.next/server/app/members/new/page.js.map
./frontend/.next/server/app/members/new/page.js.nft.json
./frontend/.next/server/app/members/page.js
./frontend/.next/server/app/members/page.js.map
./frontend/.next/server/app/members/page.js.nft.json
./frontend/.next/server/app/_not-found/page.js
./frontend/.next/server/app/_not-found/page.js.map
./frontend/.next/server/app/_not-found/page.js.nft.json
./frontend/.next/server/app/onboarding/page.js
./frontend/.next/server/app/onboarding/page.js.map
./frontend/.next/server/app/onboarding/page.js.nft.json
./frontend/.next/server/app/page.js
./frontend/.next/server/app/page.js.map
./frontend/.next/server/app/page.js.nft.json
./frontend/.next/server/app/pricing/page.js
./frontend/.next/server/app/pricing/page.js.map
./frontend/.next/server/app/pricing/page.js.nft.json
./frontend/.next/server/app/privacy-policy/page.js
./frontend/.next/server/app/privacy-policy/page.js.map
./frontend/.next/server/app/privacy-policy/page.js.nft.json
./frontend/.next/server/app/register/company/page.js
./frontend/.next/server/app/register/company/page.js.map
./frontend/.next/server/app/register/company/page.js.nft.json
./frontend/.next/server/app/register/page.js
./frontend/.next/server/app/register/page.js.map
./frontend/.next/server/app/register/page.js.nft.json
./frontend/.next/server/app/settings/page.js
./frontend/.next/server/app/settings/page.js.map
./frontend/.next/server/app/settings/page.js.nft.json
./frontend/.next/server/app/shipments/[id]/edit/page.js
./frontend/.next/server/app/shipments/[id]/edit/page.js.map
./frontend/.next/server/app/shipments/[id]/edit/page.js.nft.json
./frontend/.next/server/app/shipments/[id]/page.js
./frontend/.next/server/app/shipments/[id]/page.js.map
./frontend/.next/server/app/shipments/[id]/page.js.nft.json
./frontend/.next/server/app/shipments/new/page.js
./frontend/.next/server/app/shipments/new/page.js.map
./frontend/.next/server/app/shipments/new/page.js.nft.json
./frontend/.next/server/app/shipments/page.js
./frontend/.next/server/app/shipments/page.js.map
./frontend/.next/server/app/shipments/page.js.nft.json
./frontend/.next/server/app/support/page.js
./frontend/.next/server/app/support/page.js.map
./frontend/.next/server/app/support/page.js.nft.json
./frontend/.next/server/app/support/ticket/[token]/page.js
./frontend/.next/server/app/support/ticket/[token]/page.js.map
./frontend/.next/server/app/support/ticket/[token]/page.js.nft.json
./frontend/.next/server/app/tenant-request/page.js
./frontend/.next/server/app/tenant-request/page.js.map
./frontend/.next/server/app/tenant-request/page.js.nft.json
./frontend/.next/server/app/terms-of-service/page.js
./frontend/.next/server/app/terms-of-service/page.js.map
./frontend/.next/server/app/terms-of-service/page.js.nft.json
./frontend/.next/server/app/track/page.js
./frontend/.next/server/app/track/page.js.map
./frontend/.next/server/app/track/page.js.nft.json
./frontend/.next/server/app/vendors/page.js
./frontend/.next/server/app/vendors/page.js.map
./frontend/.next/server/app/vendors/page.js.nft.json
./frontend/.next/server/pages/404.html
./frontend/.next/server/pages/500.html
./frontend/.next/standalone/.next/server/app/admin/page.js
./frontend/.next/standalone/.next/server/app/admin/page.js.map
./frontend/.next/standalone/.next/server/app/admin/page.js.nft.json
./frontend/.next/standalone/.next/server/app/admin/runtime/page.js
./frontend/.next/standalone/.next/server/app/admin/runtime/page.js.map
./frontend/.next/standalone/.next/server/app/admin/runtime/page.js.nft.json
./frontend/.next/standalone/.next/server/app/billing/callback/page.js
./frontend/.next/standalone/.next/server/app/billing/callback/page.js.map
./frontend/.next/standalone/.next/server/app/billing/callback/page.js.nft.json
./frontend/.next/standalone/.next/server/app/billing/page.js
./frontend/.next/standalone/.next/server/app/billing/page.js.map
./frontend/.next/standalone/.next/server/app/billing/page.js.nft.json
./frontend/.next/standalone/.next/server/app/cookie-policy/page.js
./frontend/.next/standalone/.next/server/app/cookie-policy/page.js.map
./frontend/.next/standalone/.next/server/app/cookie-policy/page.js.nft.json
./frontend/.next/standalone/.next/server/app/crm/contacts/page.js
./frontend/.next/standalone/.next/server/app/crm/contacts/page.js.map
./frontend/.next/standalone/.next/server/app/crm/contacts/page.js.nft.json
./frontend/.next/standalone/.next/server/app/crm/page.js
./frontend/.next/standalone/.next/server/app/crm/page.js.map
./frontend/.next/standalone/.next/server/app/crm/page.js.nft.json
./frontend/.next/standalone/.next/server/app/crm/quotes/page.js
./frontend/.next/standalone/.next/server/app/crm/quotes/page.js.map
./frontend/.next/standalone/.next/server/app/crm/quotes/page.js.nft.json
./frontend/.next/standalone/.next/server/app/dashboard/page.js
./frontend/.next/standalone/.next/server/app/dashboard/page.js.map
./frontend/.next/standalone/.next/server/app/dashboard/page.js.nft.json
./frontend/.next/standalone/.next/server/app/docs/page.js
./frontend/.next/standalone/.next/server/app/docs/page.js.map
./frontend/.next/standalone/.next/server/app/docs/page.js.nft.json
./frontend/.next/standalone/.next/server/app/fleetbase/drivers/page.js
./frontend/.next/standalone/.next/server/app/fleetbase/drivers/page.js.map
./frontend/.next/standalone/.next/server/app/fleetbase/drivers/page.js.nft.json
./frontend/.next/standalone/.next/server/app/fleetbase/extensions/page.js
./frontend/.next/standalone/.next/server/app/fleetbase/extensions/page.js.map
./frontend/.next/standalone/.next/server/app/fleetbase/extensions/page.js.nft.json
./frontend/.next/standalone/.next/server/app/fleetbase/vehicles/page.js
./frontend/.next/standalone/.next/server/app/fleetbase/vehicles/page.js.map
./frontend/.next/standalone/.next/server/app/fleetbase/vehicles/page.js.nft.json
./frontend/.next/standalone/.next/server/app/gdpr/page.js
./frontend/.next/standalone/.next/server/app/gdpr/page.js.map
./frontend/.next/standalone/.next/server/app/gdpr/page.js.nft.json
./frontend/.next/standalone/.next/server/app/_global-error/page.js
./frontend/.next/standalone/.next/server/app/_global-error/page.js.map
./frontend/.next/standalone/.next/server/app/_global-error/page.js.nft.json
./frontend/.next/standalone/.next/server/app/kyc/page.js
./frontend/.next/standalone/.next/server/app/kyc/page.js.map
./frontend/.next/standalone/.next/server/app/kyc/page.js.nft.json
./frontend/.next/standalone/.next/server/app/login/page.js
./frontend/.next/standalone/.next/server/app/login/page.js.map
./frontend/.next/standalone/.next/server/app/login/page.js.nft.json
./frontend/.next/standalone/.next/server/app/marketplace/page.js
./frontend/.next/standalone/.next/server/app/marketplace/page.js.map
./frontend/.next/standalone/.next/server/app/marketplace/page.js.nft.json
./frontend/.next/standalone/.next/server/app/members/[id]/edit/page.js
./frontend/.next/standalone/.next/server/app/members/[id]/edit/page.js.map
./frontend/.next/standalone/.next/server/app/members/[id]/edit/page.js.nft.json
./frontend/.next/standalone/.next/server/app/members/[id]/page.js
./frontend/.next/standalone/.next/server/app/members/[id]/page.js.map
./frontend/.next/standalone/.next/server/app/members/[id]/page.js.nft.json
./frontend/.next/standalone/.next/server/app/members/import/page.js
./frontend/.next/standalone/.next/server/app/members/import/page.js.map
./frontend/.next/standalone/.next/server/app/members/import/page.js.nft.json
./frontend/.next/standalone/.next/server/app/members/new/page.js
./frontend/.next/standalone/.next/server/app/members/new/page.js.map
./frontend/.next/standalone/.next/server/app/members/new/page.js.nft.json
./frontend/.next/standalone/.next/server/app/members/page.js
./frontend/.next/standalone/.next/server/app/members/page.js.map
./frontend/.next/standalone/.next/server/app/members/page.js.nft.json
./frontend/.next/standalone/.next/server/app/_not-found/page.js
./frontend/.next/standalone/.next/server/app/_not-found/page.js.map
./frontend/.next/standalone/.next/server/app/_not-found/page.js.nft.json
./frontend/.next/standalone/.next/server/app/onboarding/page.js
./frontend/.next/standalone/.next/server/app/onboarding/page.js.map
./frontend/.next/standalone/.next/server/app/onboarding/page.js.nft.json
./frontend/.next/standalone/.next/server/app/page.js
./frontend/.next/standalone/.next/server/app/page.js.map
./frontend/.next/standalone/.next/server/app/page.js.nft.json
./frontend/.next/standalone/.next/server/app/pricing/page.js
./frontend/.next/standalone/.next/server/app/pricing/page.js.map
./frontend/.next/standalone/.next/server/app/pricing/page.js.nft.json
./frontend/.next/standalone/.next/server/app/privacy-policy/page.js
./frontend/.next/standalone/.next/server/app/privacy-policy/page.js.map
./frontend/.next/standalone/.next/server/app/privacy-policy/page.js.nft.json
./frontend/.next/standalone/.next/server/app/register/company/page.js
./frontend/.next/standalone/.next/server/app/register/company/page.js.map
./frontend/.next/standalone/.next/server/app/register/company/page.js.nft.json
./frontend/.next/standalone/.next/server/app/register/page.js
./frontend/.next/standalone/.next/server/app/register/page.js.map
./frontend/.next/standalone/.next/server/app/register/page.js.nft.json
./frontend/.next/standalone/.next/server/app/settings/page.js
./frontend/.next/standalone/.next/server/app/settings/page.js.map
./frontend/.next/standalone/.next/server/app/settings/page.js.nft.json
./frontend/.next/standalone/.next/server/app/shipments/[id]/edit/page.js
./frontend/.next/standalone/.next/server/app/shipments/[id]/edit/page.js.map
./frontend/.next/standalone/.next/server/app/shipments/[id]/edit/page.js.nft.json
./frontend/.next/standalone/.next/server/app/shipments/[id]/page.js
./frontend/.next/standalone/.next/server/app/shipments/[id]/page.js.map
./frontend/.next/standalone/.next/server/app/shipments/[id]/page.js.nft.json
./frontend/.next/standalone/.next/server/app/shipments/new/page.js
./frontend/.next/standalone/.next/server/app/shipments/new/page.js.map
./frontend/.next/standalone/.next/server/app/shipments/new/page.js.nft.json
./frontend/.next/standalone/.next/server/app/shipments/page.js
./frontend/.next/standalone/.next/server/app/shipments/page.js.map
./frontend/.next/standalone/.next/server/app/shipments/page.js.nft.json
./frontend/.next/standalone/.next/server/app/support/page.js
./frontend/.next/standalone/.next/server/app/support/page.js.map
./frontend/.next/standalone/.next/server/app/support/page.js.nft.json
./frontend/.next/standalone/.next/server/app/support/ticket/[token]/page.js
./frontend/.next/standalone/.next/server/app/support/ticket/[token]/page.js.map
./frontend/.next/standalone/.next/server/app/support/ticket/[token]/page.js.nft.json
./frontend/.next/standalone/.next/server/app/tenant-request/page.js
./frontend/.next/standalone/.next/server/app/tenant-request/page.js.map
./frontend/.next/standalone/.next/server/app/tenant-request/page.js.nft.json
./frontend/.next/standalone/.next/server/app/terms-of-service/page.js
./frontend/.next/standalone/.next/server/app/terms-of-service/page.js.map
./frontend/.next/standalone/.next/server/app/terms-of-service/page.js.nft.json
./frontend/.next/standalone/.next/server/app/track/page.js
./frontend/.next/standalone/.next/server/app/track/page.js.map
./frontend/.next/standalone/.next/server/app/track/page.js.nft.json
./frontend/.next/standalone/.next/server/app/vendors/page.js
./frontend/.next/standalone/.next/server/app/vendors/page.js.map
./frontend/.next/standalone/.next/server/app/vendors/page.js.nft.json
./frontend/.next/standalone/.next/server/pages/404.html
./frontend/.next/standalone/.next/server/pages/500.html
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/index.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/builtin/_error.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.compiled.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.render.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/pages-handler.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/.next/standalone/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/shared/lib/router/routes/app.js
./frontend/node_modules/.ignored/next/dist/build/segment-config/pages/pages-segment-config.d.ts
./frontend/node_modules/.ignored_next/dist/build/segment-config/pages/pages-segment-config.d.ts
./frontend/node_modules/.ignored/next/dist/build/segment-config/pages/pages-segment-config.js
./frontend/node_modules/.ignored_next/dist/build/segment-config/pages/pages-segment-config.js
./frontend/node_modules/.ignored/next/dist/build/segment-config/pages/pages-segment-config.js.map
./frontend/node_modules/.ignored_next/dist/build/segment-config/pages/pages-segment-config.js.map
./frontend/node_modules/.ignored/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.d.ts
./frontend/node_modules/.ignored_next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.d.ts
./frontend/node_modules/.ignored/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js
./frontend/node_modules/.ignored_next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js
./frontend/node_modules/.ignored/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./frontend/node_modules/.ignored_next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./frontend/node_modules/.ignored/next/dist/client/dev/hot-reloader/pages/websocket.d.ts
./frontend/node_modules/.ignored_next/dist/client/dev/hot-reloader/pages/websocket.d.ts
./frontend/node_modules/.ignored/next/dist/client/dev/hot-reloader/pages/websocket.js
./frontend/node_modules/.ignored_next/dist/client/dev/hot-reloader/pages/websocket.js
./frontend/node_modules/.ignored/next/dist/client/dev/hot-reloader/pages/websocket.js.map
./frontend/node_modules/.ignored_next/dist/client/dev/hot-reloader/pages/websocket.js.map
./frontend/node_modules/.ignored/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
./frontend/node_modules/.ignored_next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/01-installation.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/01-installation.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/02-project-structure.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/02-project-structure.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/04-images.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/04-images.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/05-fonts.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/05-fonts.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/06-css.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/06-css.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/11-deploying.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/11-deploying.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/01-getting-started/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/01-getting-started/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/analytics.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/analytics.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/authentication.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/authentication.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/babel.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/babel.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/ci-build-caching.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/ci-build-caching.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/content-security-policy.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/content-security-policy.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/css-in-js.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/css-in-js.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/custom-server.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/custom-server.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/debugging.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/debugging.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/draft-mode.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/draft-mode.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/environment-variables.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/environment-variables.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/forms.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/forms.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/incremental-static-regeneration.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/incremental-static-regeneration.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/instrumentation.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/instrumentation.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/internationalization.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/internationalization.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/lazy-loading.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/lazy-loading.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/mdx.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/mdx.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/migrating/app-router-migration.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/migrating/app-router-migration.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/migrating/from-create-react-app.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/migrating/from-create-react-app.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/migrating/from-vite.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/migrating/from-vite.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/migrating/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/migrating/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/multi-zones.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/multi-zones.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/open-telemetry.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/open-telemetry.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/package-bundling.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/package-bundling.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/post-css.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/post-css.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/preview-mode.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/preview-mode.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/production-checklist.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/production-checklist.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/redirecting.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/redirecting.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/sass.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/sass.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/scripts.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/scripts.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/self-hosting.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/self-hosting.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/static-exports.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/static-exports.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/tailwind-v3-css.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/tailwind-v3-css.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/testing/cypress.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/testing/cypress.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/testing/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/testing/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/testing/jest.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/testing/jest.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/testing/playwright.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/testing/playwright.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/testing/vitest.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/testing/vitest.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/third-party-libraries.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/third-party-libraries.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/codemods.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/codemods.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/version-10.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/version-10.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/version-11.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/version-11.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/version-12.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/version-12.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/version-13.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/version-13.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/version-14.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/version-14.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/02-guides/upgrading/version-9.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/02-guides/upgrading/version-9.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/01-pages-and-layouts.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/01-pages-and-layouts.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/02-dynamic-routes.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/02-dynamic-routes.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/03-linking-and-navigating.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/03-linking-and-navigating.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/05-custom-app.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/05-custom-app.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/06-custom-document.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/06-custom-document.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/07-api-routes.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/07-api-routes.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/08-custom-error.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/08-custom-error.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/01-routing/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/01-routing/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/02-rendering/01-server-side-rendering.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/02-rendering/01-server-side-rendering.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/02-rendering/02-static-site-generation.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/02-rendering/02-static-site-generation.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/02-rendering/04-automatic-static-optimization.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/02-rendering/04-automatic-static-optimization.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/02-rendering/05-client-side-rendering.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/02-rendering/05-client-side-rendering.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/02-rendering/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/02-rendering/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/01-get-static-props.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/03-data-fetching/01-get-static-props.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/02-get-static-paths.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/03-data-fetching/02-get-static-paths.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-forms-and-mutations.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-forms-and-mutations.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-get-server-side-props.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-get-server-side-props.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/05-client-side.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/03-data-fetching/05-client-side.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/03-data-fetching/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/06-configuring/12-error-handling.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/06-configuring/12-error-handling.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/06-configuring/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/06-configuring/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/03-building-your-application/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/03-building-your-application/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/font.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/font.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/form.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/form.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/head.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/head.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/image-legacy.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/image-legacy.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/image.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/image.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/link.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/link.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/01-components/script.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/01-components/script.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/02-file-conventions/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/02-file-conventions/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/02-file-conventions/instrumentation.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/02-file-conventions/instrumentation.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/02-file-conventions/proxy.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/02-file-conventions/proxy.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/02-file-conventions/public-folder.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/02-file-conventions/public-folder.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/02-file-conventions/src-folder.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/02-file-conventions/src-folder.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/get-initial-props.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/get-initial-props.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/get-server-side-props.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/get-server-side-props.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/get-static-paths.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/get-static-paths.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/get-static-props.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/get-static-props.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/next-request.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/next-request.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/next-response.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/next-response.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/use-params.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/use-params.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/userAgent.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/userAgent.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/use-report-web-vitals.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/use-report-web-vitals.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/use-router.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/use-router.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/03-functions/use-search-params.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/03-functions/use-search-params.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/adapterPath.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/adapterPath.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/allowedDevOrigins.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/allowedDevOrigins.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/assetPrefix.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/assetPrefix.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/basePath.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/basePath.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/bundlePagesRouterDependencies.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/bundlePagesRouterDependencies.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/compress.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/compress.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/crossOrigin.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/crossOrigin.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/deploymentId.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/deploymentId.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/devIndicators.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/devIndicators.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/distDir.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/distDir.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/env.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/env.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/exportPathMap.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/exportPathMap.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateBuildId.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateBuildId.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateEtags.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateEtags.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/headers.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/headers.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/httpAgentOptions.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/httpAgentOptions.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/images.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/images.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/logging.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/logging.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/onDemandEntries.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/onDemandEntries.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/optimizePackageImports.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/optimizePackageImports.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/output.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/output.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/pageExtensions.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/pageExtensions.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/poweredByHeader.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/poweredByHeader.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/productionBrowserSourceMaps.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/productionBrowserSourceMaps.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/proxyClientMaxBodySize.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/proxyClientMaxBodySize.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/reactStrictMode.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/reactStrictMode.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/redirects.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/redirects.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/rewrites.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/rewrites.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/serverExternalPackages.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/serverExternalPackages.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/trailingSlash.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/trailingSlash.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/transpilePackages.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/transpilePackages.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/turbopack.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/turbopack.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/typescript.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/typescript.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/urlImports.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/urlImports.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/useLightningcss.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/useLightningcss.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webpack.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webpack.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webVitalsAttribution.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webVitalsAttribution.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/01-typescript.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/01-typescript.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/02-eslint.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/02-eslint.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/04-config/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/04-config/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/05-cli/create-next-app.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/05-cli/create-next-app.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/05-cli/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/05-cli/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/05-cli/next.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/05-cli/next.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/06-edge.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/06-edge.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/08-turbopack.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/08-turbopack.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/04-api-reference/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/04-api-reference/index.md
./frontend/node_modules/.ignored/next/dist/docs/02-pages/index.md
./frontend/node_modules/.ignored_next/dist/docs/02-pages/index.md
./frontend/node_modules/.ignored/next/dist/esm/build/segment-config/pages/pages-segment-config.js
./frontend/node_modules/.ignored_next/dist/esm/build/segment-config/pages/pages-segment-config.js
./frontend/node_modules/.ignored/next/dist/esm/build/segment-config/pages/pages-segment-config.js.map
./frontend/node_modules/.ignored_next/dist/esm/build/segment-config/pages/pages-segment-config.js.map
./frontend/node_modules/.ignored/next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js
./frontend/node_modules/.ignored_next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js
./frontend/node_modules/.ignored/next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./frontend/node_modules/.ignored_next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./frontend/node_modules/.ignored/next/dist/esm/client/dev/hot-reloader/pages/websocket.js
./frontend/node_modules/.ignored_next/dist/esm/client/dev/hot-reloader/pages/websocket.js
./frontend/node_modules/.ignored/next/dist/esm/client/dev/hot-reloader/pages/websocket.js.map
./frontend/node_modules/.ignored_next/dist/esm/client/dev/hot-reloader/pages/websocket.js.map
./frontend/node_modules/.ignored/next/dist/esm/export/routes/app-page.js
./frontend/node_modules/.ignored_next/dist/esm/export/routes/app-page.js
./frontend/node_modules/.ignored/next/dist/esm/export/routes/app-page.js.map
./frontend/node_modules/.ignored_next/dist/esm/export/routes/app-page.js.map
./frontend/node_modules/.ignored/next/dist/esm/export/routes/app-route.js
./frontend/node_modules/.ignored_next/dist/esm/export/routes/app-route.js
./frontend/node_modules/.ignored/next/dist/esm/export/routes/app-route.js.map
./frontend/node_modules/.ignored_next/dist/esm/export/routes/app-route.js.map
./frontend/node_modules/.ignored/next/dist/esm/export/routes/pages.js
./frontend/node_modules/.ignored_next/dist/esm/export/routes/pages.js
./frontend/node_modules/.ignored/next/dist/esm/export/routes/pages.js.map
./frontend/node_modules/.ignored_next/dist/esm/export/routes/pages.js.map
./frontend/node_modules/.ignored/next/dist/esm/export/routes/types.js
./frontend/node_modules/.ignored_next/dist/esm/export/routes/types.js
./frontend/node_modules/.ignored/next/dist/esm/export/routes/types.js.map
./frontend/node_modules/.ignored_next/dist/esm/export/routes/types.js.map
./frontend/node_modules/.ignored/next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js
./frontend/node_modules/.ignored_next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js
./frontend/node_modules/.ignored/next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js.map
./frontend/node_modules/.ignored_next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js.map
./frontend/node_modules/.ignored/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./frontend/node_modules/.ignored_next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./frontend/node_modules/.ignored/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./frontend/node_modules/.ignored_next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./frontend/node_modules/.ignored/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./frontend/node_modules/.ignored_next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./frontend/node_modules/.ignored/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./frontend/node_modules/.ignored_next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./frontend/node_modules/.ignored/next/dist/esm/pages/_app.js
./frontend/node_modules/.ignored_next/dist/esm/pages/_app.js
./frontend/node_modules/.ignored/next/dist/esm/pages/_app.js.map
./frontend/node_modules/.ignored_next/dist/esm/pages/_app.js.map
./frontend/node_modules/.ignored/next/dist/esm/pages/_document.js
./frontend/node_modules/.ignored_next/dist/esm/pages/_document.js
./frontend/node_modules/.ignored/next/dist/esm/pages/_document.js.map
./frontend/node_modules/.ignored_next/dist/esm/pages/_document.js.map
./frontend/node_modules/.ignored/next/dist/esm/pages/_error.js
./frontend/node_modules/.ignored_next/dist/esm/pages/_error.js
./frontend/node_modules/.ignored/next/dist/esm/pages/_error.js.map
./frontend/node_modules/.ignored_next/dist/esm/pages/_error.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/index.js
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/index.js
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/index.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/index.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/node_modules/.ignored/next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/builtin/_error.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/builtin/_error.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/builtin/_error.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/builtin/_error.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.compiled.d.ts
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.compiled.d.ts
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.compiled.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.compiled.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.compiled.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.compiled.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.render.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.render.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/module.render.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/module.render.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/pages-handler.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/pages-handler.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/pages-handler.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/pages-handler.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js.map
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/node_modules/.ignored/next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./frontend/node_modules/.ignored_next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./frontend/node_modules/.ignored/next/dist/esm/shared/lib/router/routes/app.js
./frontend/node_modules/.ignored_next/dist/esm/shared/lib/router/routes/app.js
./frontend/node_modules/.ignored/next/dist/esm/shared/lib/router/routes/app.js.map
./frontend/node_modules/.ignored_next/dist/esm/shared/lib/router/routes/app.js.map
./frontend/node_modules/.ignored/next/dist/export/routes/app-page.d.ts
./frontend/node_modules/.ignored_next/dist/export/routes/app-page.d.ts
./frontend/node_modules/.ignored/next/dist/export/routes/app-page.js
./frontend/node_modules/.ignored_next/dist/export/routes/app-page.js
./frontend/node_modules/.ignored/next/dist/export/routes/app-page.js.map
./frontend/node_modules/.ignored_next/dist/export/routes/app-page.js.map
./frontend/node_modules/.ignored/next/dist/export/routes/app-route.d.ts
./frontend/node_modules/.ignored_next/dist/export/routes/app-route.d.ts
./frontend/node_modules/.ignored/next/dist/export/routes/app-route.js
./frontend/node_modules/.ignored_next/dist/export/routes/app-route.js
./frontend/node_modules/.ignored/next/dist/export/routes/app-route.js.map
./frontend/node_modules/.ignored_next/dist/export/routes/app-route.js.map
./frontend/node_modules/.ignored/next/dist/export/routes/pages.d.ts
./frontend/node_modules/.ignored_next/dist/export/routes/pages.d.ts
./frontend/node_modules/.ignored/next/dist/export/routes/pages.js
./frontend/node_modules/.ignored_next/dist/export/routes/pages.js
./frontend/node_modules/.ignored/next/dist/export/routes/pages.js.map
./frontend/node_modules/.ignored_next/dist/export/routes/pages.js.map
./frontend/node_modules/.ignored/next/dist/export/routes/types.d.ts
./frontend/node_modules/.ignored_next/dist/export/routes/types.d.ts
./frontend/node_modules/.ignored/next/dist/export/routes/types.js
./frontend/node_modules/.ignored_next/dist/export/routes/types.js
./frontend/node_modules/.ignored/next/dist/export/routes/types.js.map
./frontend/node_modules/.ignored_next/dist/export/routes/types.js.map
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/hydration-error-state.d.ts
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/hydration-error-state.d.ts
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/hydration-error-state.js
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/hydration-error-state.js
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/hydration-error-state.js.map
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/hydration-error-state.js.map
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.d.ts
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.d.ts
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.d.ts
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.d.ts
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./frontend/node_modules/.ignored/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./frontend/node_modules/.ignored_next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./frontend/node_modules/.ignored/next/dist/pages/_app.d.ts
./frontend/node_modules/.ignored_next/dist/pages/_app.d.ts
./frontend/node_modules/.ignored/next/dist/pages/_app.js
./frontend/node_modules/.ignored_next/dist/pages/_app.js
./frontend/node_modules/.ignored/next/dist/pages/_app.js.map
./frontend/node_modules/.ignored_next/dist/pages/_app.js.map
./frontend/node_modules/.ignored/next/dist/pages/_document.d.ts
./frontend/node_modules/.ignored_next/dist/pages/_document.d.ts
./frontend/node_modules/.ignored/next/dist/pages/_document.js
./frontend/node_modules/.ignored_next/dist/pages/_document.js
./frontend/node_modules/.ignored/next/dist/pages/_document.js.map
./frontend/node_modules/.ignored_next/dist/pages/_document.js.map
./frontend/node_modules/.ignored/next/dist/pages/_error.d.ts
./frontend/node_modules/.ignored_next/dist/pages/_error.d.ts
./frontend/node_modules/.ignored/next/dist/pages/_error.js
./frontend/node_modules/.ignored_next/dist/pages/_error.js
./frontend/node_modules/.ignored/next/dist/pages/_error.js.map
./frontend/node_modules/.ignored_next/dist/pages/_error.js.map
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/index.d.ts
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/index.d.ts
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/index.js
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/index.js
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/index.js.map
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/index.js.map
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.d.ts
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.d.ts
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-filename-normalizer.d.ts
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-filename-normalizer.d.ts
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-filename-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-page-normalizer.d.ts
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-page-normalizer.d.ts
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-page-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-page-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.d.ts
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-pathname-normalizer.d.ts
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/node_modules/.ignored/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./frontend/node_modules/.ignored_next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/builtin/_error.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/builtin/_error.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/builtin/_error.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/builtin/_error.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/builtin/_error.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/builtin/_error.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.compiled.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.compiled.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.compiled.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.compiled.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.compiled.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.compiled.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.render.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.render.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.render.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.render.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/module.render.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/module.render.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/pages-handler.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/pages-handler.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/pages-handler.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/pages-handler.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/pages-handler.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/pages-handler.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/app-router-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/entrypoints.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/html-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/html-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/html-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/html-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/image-config-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/loadable-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/loadable.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/loadable.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/loadable.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/loadable.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/router-context.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/router-context.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/router-context.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/router-context.js.map
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.d.ts
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.d.ts
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/node_modules/.ignored/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./frontend/node_modules/.ignored_next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./frontend/node_modules/.ignored/next/dist/shared/lib/router/routes/app.d.ts
./frontend/node_modules/.ignored_next/dist/shared/lib/router/routes/app.d.ts
./frontend/node_modules/.ignored/next/dist/shared/lib/router/routes/app.js
./frontend/node_modules/.ignored_next/dist/shared/lib/router/routes/app.js
./frontend/node_modules/.ignored/next/dist/shared/lib/router/routes/app.js.map
./frontend/node_modules/.ignored_next/dist/shared/lib/router/routes/app.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/segment-config/pages/pages-segment-config.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/segment-config/pages/pages-segment-config.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/segment-config/pages/pages-segment-config.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/dev/hot-reloader/pages/websocket.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/dev/hot-reloader/pages/websocket.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/dev/hot-reloader/pages/websocket.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/01-installation.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/02-project-structure.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/04-images.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/05-fonts.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/06-css.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/11-deploying.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/01-getting-started/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/analytics.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/authentication.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/babel.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/ci-build-caching.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/content-security-policy.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/css-in-js.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/custom-server.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/debugging.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/draft-mode.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/environment-variables.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/forms.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/incremental-static-regeneration.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/instrumentation.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/internationalization.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/lazy-loading.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/mdx.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/migrating/app-router-migration.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/migrating/from-create-react-app.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/migrating/from-vite.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/migrating/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/multi-zones.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/open-telemetry.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/package-bundling.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/post-css.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/preview-mode.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/production-checklist.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/redirecting.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/sass.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/scripts.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/self-hosting.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/static-exports.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/tailwind-v3-css.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/testing/cypress.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/testing/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/testing/jest.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/testing/playwright.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/testing/vitest.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/third-party-libraries.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/codemods.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-10.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-11.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-12.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-13.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-14.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/02-guides/upgrading/version-9.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/01-pages-and-layouts.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/02-dynamic-routes.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/03-linking-and-navigating.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/05-custom-app.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/06-custom-document.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/07-api-routes.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/08-custom-error.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/01-routing/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/01-server-side-rendering.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/02-static-site-generation.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/04-automatic-static-optimization.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/05-client-side-rendering.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/02-rendering/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/01-get-static-props.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/02-get-static-paths.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-forms-and-mutations.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/03-get-server-side-props.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/05-client-side.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/03-data-fetching/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/06-configuring/12-error-handling.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/06-configuring/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/03-building-your-application/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/font.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/form.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/head.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/image-legacy.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/image.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/link.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/01-components/script.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/instrumentation.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/proxy.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/public-folder.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/02-file-conventions/src-folder.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-initial-props.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-server-side-props.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-static-paths.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/get-static-props.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/next-request.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/next-response.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-params.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/userAgent.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-report-web-vitals.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-router.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-search-params.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/adapterPath.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/allowedDevOrigins.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/assetPrefix.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/basePath.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/bundlePagesRouterDependencies.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/compress.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/crossOrigin.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/deploymentId.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/devIndicators.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/distDir.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/env.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/exportPathMap.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateBuildId.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/generateEtags.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/headers.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/httpAgentOptions.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/images.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/logging.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/onDemandEntries.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/optimizePackageImports.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/output.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/pageExtensions.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/poweredByHeader.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/productionBrowserSourceMaps.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/proxyClientMaxBodySize.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/reactStrictMode.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/redirects.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/rewrites.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/serverExternalPackages.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/trailingSlash.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/transpilePackages.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/turbopack.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/typescript.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/urlImports.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/useLightningcss.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webpack.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-next-config-js/webVitalsAttribution.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/01-typescript.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/02-eslint.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/04-config/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/05-cli/create-next-app.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/05-cli/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/05-cli/next.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/06-edge.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/08-turbopack.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/04-api-reference/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/docs/02-pages/index.md
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/build/segment-config/pages/pages-segment-config.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/build/segment-config/pages/pages-segment-config.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/client/dev/hot-reloader/pages/hot-reloader-pages.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/client/dev/hot-reloader/pages/websocket.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/client/dev/hot-reloader/pages/websocket.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/app-page.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/app-page.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/app-route.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/app-route.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/pages.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/pages.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/types.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/export/routes/types.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/next-devtools/userspace/pages/hydration-error-state.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/pages/_app.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/pages/_app.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/pages/_document.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/pages/_document.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/pages/_error.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/pages/_error.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/index.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/index.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-filename-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-page-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/builtin/_error.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/builtin/_error.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.compiled.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.compiled.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.compiled.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.render.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/module.render.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/pages-handler.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/pages-handler.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/html-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/loadable.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/router-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/shared/lib/router/routes/app.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/esm/shared/lib/router/routes/app.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/app-page.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/app-page.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/app-page.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/app-route.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/app-route.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/app-route.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/pages.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/pages.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/pages.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/types.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/types.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/export/routes/types.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/hydration-error-state.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/hydration-error-state.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/hydration-error-state.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-error-boundary.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_app.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_app.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_app.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_document.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_document.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_document.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_error.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_error.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/pages/_error.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/index.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/index.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/index.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-bundle-path-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-filename-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-page-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/normalizers/built/pages/pages-pathname-normalizer.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/builtin/_error.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/builtin/_error.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/builtin/_error.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.compiled.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.compiled.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.compiled.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.render.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.render.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/module.render.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/pages-handler.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/pages-handler.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/pages-handler.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/app-router-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/entrypoints.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/head-manager-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/hooks-client-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/html-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/image-config-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/loadable.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/router-context.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/server/route-modules/pages/vendored/contexts/server-inserted-html.js.map
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/shared/lib/router/routes/app.d.ts
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/shared/lib/router/routes/app.js
./frontend/node_modules/.pnpm/next@16.2.0_@babel+core@7.29.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/shared/lib/router/routes/app.js.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/build/src/start/server/type-generation/routes.js
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/build/src/start/server/type-generation/routes.js.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.d.ts
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.d.ts.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.js
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.js.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.d.ts
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.d.ts.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.js
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.js.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.d.ts
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.d.ts.map
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.js
./mobile-driver-app/node_modules/.ignored/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.js.map
./mobile-driver-app/node_modules/.pnpm/@expo+cli@56.1.10_@expo+dom-webview@56.0.5_expo-constants@56.0.14_expo@56.0.3_react-nat_9bb52edc162dcd46281aa12694301e3d/node_modules/@expo/cli/build/src/start/server/type-generation/routes.js
./mobile-driver-app/node_modules/.pnpm/@expo+cli@56.1.10_@expo+dom-webview@56.0.5_expo-constants@56.0.14_expo@56.0.3_react-nat_9bb52edc162dcd46281aa12694301e3d/node_modules/@expo/cli/build/src/start/server/type-generation/routes.js.map
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/generate.d.ts
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/generate.d.ts.map
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/generate.js
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/generate.js.map
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/index.d.ts
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/index.d.ts.map
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/index.js
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/index.js.map
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/testSetup.d.ts
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/testSetup.d.ts.map
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/testSetup.js
./mobile-driver-app/node_modules/.pnpm/@expo+router-server@56.0.11_expo-constants@56.0.14_expo@56.0.3_react-native@0.85.3_@bab_f69cf3c9ab5fb88c09b3c49debb4bf56/node_modules/@expo/router-server/build/typed-routes/testSetup.js.map
./mobile/node_modules/expo/node_modules/@expo/cli/build/src/start/server/type-generation/routes.js
./mobile/node_modules/expo/node_modules/@expo/cli/build/src/start/server/type-generation/routes.js.map
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.d.ts
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.d.ts.map
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.js
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/generate.js.map
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.d.ts
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.d.ts.map
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.js
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/index.js.map
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.d.ts
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.d.ts.map
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.js
./mobile/node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/build/typed-routes/testSetup.js.map
./.mypy_cache/3.10/admin_app/api/routes/auth.data.json
./.mypy_cache/3.10/admin_app/api/routes/auth.meta.json
./.mypy_cache/3.10/admin_app/api/routes/billing.data.json
./.mypy_cache/3.10/admin_app/api/routes/billing.meta.json
./.mypy_cache/3.10/admin_app/api/routes/domains.data.json
./.mypy_cache/3.10/admin_app/api/routes/domains.meta.json
./.mypy_cache/3.10/admin_app/api/routes/__init__.data.json
./.mypy_cache/3.10/admin_app/api/routes/__init__.meta.json
./.mypy_cache/3.10/admin_app/api/routes/kyc.data.json
./.mypy_cache/3.10/admin_app/api/routes/kyc.meta.json
./.mypy_cache/3.10/admin_app/api/routes/runners.data.json
./.mypy_cache/3.10/admin_app/api/routes/runners.meta.json
./.mypy_cache/3.10/admin_app/api/routes/runtime.data.json
./.mypy_cache/3.10/admin_app/api/routes/runtime.meta.json
./.mypy_cache/3.10/admin_app/api/routes/tenants.data.json
./.mypy_cache/3.10/admin_app/api/routes/tenants.meta.json
./.mypy_cache/3.10/admin_app/api/routes/vendors.data.json
./.mypy_cache/3.10/admin_app/api/routes/vendors.meta.json
./.mypy_cache/3.10/app/api/routes/ai.data.json
./.mypy_cache/3.10/app/api/routes/ai.meta.json
./.mypy_cache/3.10/app/api/routes/ai_widget.data.json
./.mypy_cache/3.10/app/api/routes/ai_widget.meta.json
./.mypy_cache/3.10/app/api/routes/analytics.data.json
./.mypy_cache/3.10/app/api/routes/analytics.meta.json
./.mypy_cache/3.10/app/api/routes/auth.data.json
./.mypy_cache/3.10/app/api/routes/auth.meta.json
./.mypy_cache/3.10/app/api/routes/auth_pages.data.json
./.mypy_cache/3.10/app/api/routes/auth_pages.meta.json
./.mypy_cache/3.10/app/api/routes/billing.data.json
./.mypy_cache/3.10/app/api/routes/billing.meta.json
./.mypy_cache/3.10/app/api/routes/branding.data.json
./.mypy_cache/3.10/app/api/routes/branding.meta.json
./.mypy_cache/3.10/app/api/routes/custom_domains.data.json
./.mypy_cache/3.10/app/api/routes/custom_domains.meta.json
./.mypy_cache/3.10/app/api/routes/customer_portal.data.json
./.mypy_cache/3.10/app/api/routes/customer_portal.meta.json
./.mypy_cache/3.10/app/api/routes/fleetbase_runtime.data.json
./.mypy_cache/3.10/app/api/routes/fleetbase_runtime.meta.json
./.mypy_cache/3.10/app/api/routes/geo.data.json
./.mypy_cache/3.10/app/api/routes/geo.meta.json
./.mypy_cache/3.10/app/api/routes/health.data.json
./.mypy_cache/3.10/app/api/routes/health.meta.json
./.mypy_cache/3.10/app/api/routes/i18n.data.json
./.mypy_cache/3.10/app/api/routes/i18n.meta.json
./.mypy_cache/3.10/app/api/routes/kyc.data.json
./.mypy_cache/3.10/app/api/routes/kyc.meta.json
./.mypy_cache/3.10/app/api/routes/navigator.data.json
./.mypy_cache/3.10/app/api/routes/navigator.meta.json
./.mypy_cache/3.10/app/api/routes/pallet.data.json
./.mypy_cache/3.10/app/api/routes/pallet.meta.json
./.mypy_cache/3.10/app/api/routes/payments.data.json
./.mypy_cache/3.10/app/api/routes/payments.meta.json
./.mypy_cache/3.10/app/api/routes/runners.data.json
./.mypy_cache/3.10/app/api/routes/runners.meta.json
./.mypy_cache/3.10/app/api/routes/shipments.data.json
./.mypy_cache/3.10/app/api/routes/shipments.meta.json
./.mypy_cache/3.10/app/api/routes/social_auth.data.json
./.mypy_cache/3.10/app/api/routes/social_auth.meta.json
./.mypy_cache/3.10/app/api/routes/storefront.data.json
./.mypy_cache/3.10/app/api/routes/storefront.meta.json
./.mypy_cache/3.10/app/api/routes/support_crm.data.json
./.mypy_cache/3.10/app/api/routes/support_crm.meta.json
./.mypy_cache/3.10/app/api/routes/tenant_creation.data.json
./.mypy_cache/3.10/app/api/routes/tenant_creation.meta.json
./.mypy_cache/3.10/app/api/routes/tenant_requests.data.json
./.mypy_cache/3.10/app/api/routes/tenant_requests.meta.json
./.mypy_cache/3.10/app/api/routes/tenants.data.json
./.mypy_cache/3.10/app/api/routes/tenants.meta.json
./.mypy_cache/3.10/app/api/routes/vendors.data.json
./.mypy_cache/3.10/app/api/routes/vendors.meta.json
./.mypy_cache/3.10/app/api/routes/whatsapp_bot.data.json
./.mypy_cache/3.10/app/api/routes/whatsapp_bot.meta.json
./.mypy_cache/3.10/app/api/routes/whatsapp_csv.data.json
./.mypy_cache/3.10/app/api/routes/whatsapp_csv.meta.json
./.mypy_cache/3.10/app/api/routes/whatsapp.data.json
./.mypy_cache/3.10/app/api/routes/whatsapp.meta.json
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx
./reports/autofix_20260602_172438/backups/frontend/app/dashboard/page.tsx
./.venv/lib/python3.10/site-packages/botocore/data/geo-routes/2020-11-19/endpoint-rule-set-1.json.gz
./venv/lib/python3.10/site-packages/botocore/data/geo-routes/2020-11-19/endpoint-rule-set-1.json.gz
./.venv/lib/python3.10/site-packages/botocore/data/geo-routes/2020-11-19/paginators-1.json
./venv/lib/python3.10/site-packages/botocore/data/geo-routes/2020-11-19/paginators-1.json
./.venv/lib/python3.10/site-packages/botocore/data/geo-routes/2020-11-19/service-2.json.gz
./venv/lib/python3.10/site-packages/botocore/data/geo-routes/2020-11-19/service-2.json.gz
```

## 2. Sidebar/Menu Signals
```
./test_phase1_features.py:148:def test_api_routes():
./test_phase1_features.py:149:    """Test API routes for new features"""
./test_phase1_features.py:154:        # Test payment routes
./test_phase1_features.py:155:        from app.api.routes.payments import router as payments_router
./test_phase1_features.py:157:        payment_routes = [route.path for route in payments_router.routes]
./test_phase1_features.py:158:        expected_payment_routes = [
./test_phase1_features.py:169:        for route in expected_payment_routes:
./test_phase1_features.py:170:            if route in payment_routes:
./test_phase1_features.py:175:        # Test social auth routes
./test_phase1_features.py:176:        from app.api.routes.social_auth import router as social_router
./test_phase1_features.py:178:        social_routes = [route.path for route in social_router.routes]
./test_phase1_features.py:179:        expected_social_routes = [
./test_phase1_features.py:189:        for route in expected_social_routes:
./test_phase1_features.py:190:            if route in social_routes:
./test_phase1_features.py:198:        print(f"❌ API routes test failed: {e}")
./test_phase1_features.py:363:        ("API Routes", test_api_routes),
./test_phase1_features.py:403:        print("✅ Revenue Analytics - Business intelligence")
./test_phase1_features.py:410:        print("  📊 Analytics: Real-time payment insights")
./test_complete_features.py:4:Tests all implemented features including WhatsApp, KYC, China Payments, and Open Platform
./test_complete_features.py:293:        print("   📊 Analytics: Real-time revenue tracking")
./test_complete_features.py:339:        daily_kyc = 20  # Drivers registering
./test_complete_features.py:383:    print("WhatsApp + KYC + China Payments + Open Platform")
./test_complete_features.py:389:        ("China Payments", test_china_payments),
./test_complete_features.py:427:        print("✅ China Payments - AliPay & WeChat Pay integrated")
./FRONTEND_BACKEND_ALIGNMENT_AGENT.md:49:8. Shipment Tracking Page
./FRONTEND_BACKEND_ALIGNMENT_AGENT.md:50:9. GPS Live Tracking Page
./FRONTEND_BACKEND_ALIGNMENT_AGENT.md:61:7. GPS History / Live Tracking
./repo_scan_report.json:20:        "admin-console/admin_app/api/routes/runners.py",
./repo_scan_report.json:21:        "admin-console/admin_app/api/routes/oauth.py",
./repo_scan_report.json:22:        "admin-console/admin_app/api/routes/tickets.py",
./repo_scan_report.json:23:        "admin-console/admin_app/api/routes/analytics.py",
./repo_scan_report.json:24:        "admin-console/admin_app/api/routes/vendors.py",
./repo_scan_report.json:25:        "admin-console/admin_app/api/routes/billing.py",
./repo_scan_report.json:26:        "admin-console/admin_app/api/routes/runtime.py",
./repo_scan_report.json:27:        "admin-console/admin_app/api/routes/tenants.py",
./repo_scan_report.json:28:        "admin-console/admin_app/api/routes/kyc.py",
./repo_scan_report.json:29:        "admin-console/admin_app/api/routes/domains.py",
./repo_scan_report.json:30:        "admin-console/admin_app/api/routes/tracking.py",
./repo_scan_report.json:31:        "admin-console/admin_app/api/routes/auth.py",
./repo_scan_report.json:32:        "app/api/routes/custom_domains.py",
./repo_scan_report.json:33:        "app/api/routes/users.py",
./repo_scan_report.json:34:        "app/api/routes/runners.py",
./repo_scan_report.json:35:        "app/api/routes/social_auth.py",
./repo_scan_report.json:36:        "app/api/routes/geo.py",
./repo_scan_report.json:37:        "app/api/routes/support_crm.py",
./repo_scan_report.json:38:        "app/api/routes/admin_subscriptions.py",
./repo_scan_report.json:39:        "app/api/routes/admin_credits.py",
./repo_scan_report.json:40:        "app/api/routes/analytics.py",
./repo_scan_report.json:41:        "app/api/routes/vendors.py",
./repo_scan_report.json:42:        "app/api/routes/ai.py",
./repo_scan_report.json:43:        "app/api/routes/admin_marketplace.py",
./repo_scan_report.json:44:        "app/api/routes/billing.py",
./repo_scan_report.json:45:        "app/api/routes/tenants.py",
./repo_scan_report.json:46:        "app/api/routes/payments.py",
./repo_scan_report.json:47:        "app/api/routes/navigator.py",
./repo_scan_report.json:48:        "app/api/routes/tenant_requests.py",
./repo_scan_report.json:49:        "app/api/routes/shipments.py",
./repo_scan_report.json:50:        "app/api/routes/whatsapp_bot.py",
./repo_scan_report.json:51:        "app/api/routes/tenant_creation.py",
./repo_scan_report.json:52:        "app/api/routes/storefront.py",
./repo_scan_report.json:53:        "app/api/routes/kyc.py",
./repo_scan_report.json:54:        "app/api/routes/fleetbase_runtime.py",
./repo_scan_report.json:55:        "app/api/routes/pallet.py",
./repo_scan_report.json:56:        "app/api/routes/branding.py",
./repo_scan_report.json:57:        "app/api/routes/i18n.py",
./repo_scan_report.json:58:        "app/api/routes/auth_pages.py",
./repo_scan_report.json:59:        "app/api/routes/health.py",
./repo_scan_report.json:60:        "app/api/routes/whatsapp.py",
./repo_scan_report.json:61:        "app/api/routes/customer_portal.py",
./repo_scan_report.json:62:        "app/api/routes/ai_widget.py",
./repo_scan_report.json:63:        "app/api/routes/auth.py",
./repo_scan_report.json:64:        "app/api/routes/payment_hub.py",
./repo_scan_report.json:65:        "app/api/routes/whatsapp_csv.py",
./repo_scan_report.json:66:        "app/api/routes/marketplace.py",
./repo_scan_report.json:67:        "app/api/routes/commercial_orchestration.py"
./repo_scan_report.json:515:      "next_app_routes_sample": [
./repo_scan_report.json:562:        "admin-console/admin_app/api/routes/runners.py",
./repo_scan_report.json:563:        "admin-console/admin_app/api/routes/oauth.py",
./repo_scan_report.json:564:        "admin-console/admin_app/api/routes/tickets.py",
./repo_scan_report.json:565:        "admin-console/admin_app/api/routes/analytics.py",
./repo_scan_report.json:566:        "admin-console/admin_app/api/routes/vendors.py",
./repo_scan_report.json:567:        "admin-console/admin_app/api/routes/__init__.py",
./repo_scan_report.json:568:        "admin-console/admin_app/api/routes/billing.py",
./repo_scan_report.json:569:        "admin-console/admin_app/api/routes/runtime.py",
./repo_scan_report.json:570:        "admin-console/admin_app/api/routes/tenants.py",
./repo_scan_report.json:571:        "admin-console/admin_app/api/routes/kyc.py",
./repo_scan_report.json:572:        "admin-console/admin_app/api/routes/domains.py",
./repo_scan_report.json:573:        "admin-console/admin_app/api/routes/tracking.py",
./repo_scan_report.json:574:        "admin-console/admin_app/api/routes/auth.py",
./repo_scan_report.json:575:        "app/api/routes/custom_domains.py",
./repo_scan_report.json:576:        "app/api/routes/users.py",
./repo_scan_report.json:577:        "app/api/routes/runners.py",
./repo_scan_report.json:578:        "app/api/routes/social_auth.py",
./repo_scan_report.json:579:        "app/api/routes/geo.py",
./repo_scan_report.json:580:        "app/api/routes/support_crm.py",
./repo_scan_report.json:581:        "app/api/routes/admin_subscriptions.py",
./repo_scan_report.json:582:        "app/api/routes/admin_credits.py",
./repo_scan_report.json:583:        "app/api/routes/analytics.py",
./repo_scan_report.json:584:        "app/api/routes/vendors.py",
./repo_scan_report.json:585:        "app/api/routes/ai.py",
./repo_scan_report.json:586:        "app/api/routes/admin_marketplace.py",
./repo_scan_report.json:587:        "app/api/routes/billing.py",
./repo_scan_report.json:588:        "app/api/routes/tenants.py",
./repo_scan_report.json:589:        "app/api/routes/payments.py",
./repo_scan_report.json:590:        "app/api/routes/navigator.py",
./repo_scan_report.json:591:        "app/api/routes/tenant_requests.py",
./repo_scan_report.json:592:        "app/api/routes/shipments.py",
./repo_scan_report.json:593:        "app/api/routes/whatsapp_bot.py",
./repo_scan_report.json:594:        "app/api/routes/tenant_creation.py",
./repo_scan_report.json:595:        "app/api/routes/storefront.py",
./repo_scan_report.json:596:        "app/api/routes/kyc.py",
./repo_scan_report.json:597:        "app/api/routes/fleetbase_runtime.py",
./repo_scan_report.json:598:        "app/api/routes/pallet.py",
./repo_scan_report.json:599:        "app/api/routes/branding.py",
./repo_scan_report.json:600:        "app/api/routes/i18n.py",
./repo_scan_report.json:601:        "app/api/routes/auth_pages.py",
./repo_scan_report.json:602:        "app/api/routes/health.py",
./repo_scan_report.json:603:        "app/api/routes/whatsapp.py",
./repo_scan_report.json:604:        "app/api/routes/customer_portal.py",
./repo_scan_report.json:605:        "app/api/routes/ai_widget.py",
./repo_scan_report.json:606:        "app/api/routes/auth.py",
./repo_scan_report.json:607:        "app/api/routes/payment_hub.py",
./repo_scan_report.json:608:        "app/api/routes/whatsapp_csv.py",
./repo_scan_report.json:609:        "app/api/routes/marketplace.py",
./repo_scan_report.json:610:        "app/api/routes/commercial_orchestration.py"
./.env.docker:30:# ── Fleetbase CLI ───────────────────────────────────────────────
./.env.docker:38:# ── Maps (Mapbox) ────────────────────────────────────────────────
./.env.docker:41:# Google Maps
./afruheritage_saas_engine_scaffold/phase_1C_payment_inheritance/scaffold.sh:10:echo "- app/api/routes/payment_hub.py"
./afruheritage_saas_engine_scaffold/phase_1C_payment_inheritance/scaffold.sh:11:echo "- app/api/routes/tenant_payment_settings.py"
./afruheritage_saas_engine_scaffold/phase_1A_commercial_orchestration/scaffold.sh:7:echo "- app/api/routes/public_signup.py"
./afruheritage_saas_engine_scaffold/phase_1A_commercial_orchestration/scaffold.sh:8:echo "- app/api/routes/subscriptions.py"
./afruheritage_saas_engine_scaffold/shared/AGENT.md:4:- Fleetbase is the runtime logistics engine.
./afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/tests.md:5:- Fleetbase installation command executes
./afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/scaffold.sh:10:echo "- app/api/routes/runtime.py"
./afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/blueprint.md:14:5. Install Fleetbase via controlled wrapper
./afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/AGENT.md:7:- Fleetbase install wrapper
./afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/README.md:6:- Fleetbase installed underneath
./feature_status_table.md:23:| **Fleetbase Runtime** | **Fleetbase Runtime Orchestration** | In-house | ✅ | ✅ | 🟢 **NEW** | GREEN |
./feature_status_table.md:24:| **Fleetbase Engine** | **Fleetbase Contacts / Entities** | Fleetbase | ✅ | ✅ | 🟢 **NEW** | GREEN |
./feature_status_table.md:25:| **Fleetbase Engine** | **Fleetbase Drivers** | Fleetbase | ✅ | ✅ | 🟢 **NEW** | GREEN |
./feature_status_table.md:26:| **Fleetbase Engine** | **Fleetbase Vehicles** | Fleetbase | ✅ | ✅ | 🟢 **NEW** | GREEN |
./feature_status_table.md:27:| **Fleetbase Engine** | **Fleetbase Extensions / CLI Install** | Fleetbase | ✅ | ✅ | 🟢 **NEW** | GREEN |
./feature_status_table.md:28:| **Fleetbase Engine** | Fleetbase Orders | Fleetbase | ✅ | ✅ | 🟢 Not Used | GREEN |
./feature_status_table.md:29:| **Fleetbase Engine** | Fleetbase Dispatch Dashboard | Fleetbase | ✅ | ✅ | 🟢 Not Used | GREEN |
./feature_status_table.md:30:| **Fleetbase Engine** | Fleetbase Real-time Tracking | Fleetbase | ✅ | ✅ | 🟢 Not Used | GREEN |
./feature_status_table.md:31:| **Tracking** | Tracking Engine (CSV / Customer Mapping) | In-house | ✅ | ✅ | 🟢 Not Used | GREEN |
./feature_status_table.md:51:4. **Fleetbase Contacts/Entities** - Contact directory management
./feature_status_table.md:52:5. **Fleetbase Drivers** - Driver management and tracking
./feature_status_table.md:53:6. **Fleetbase Vehicles** - Vehicle fleet management
./feature_status_table.md:54:7. **Fleetbase Extensions/CLI Install** - Extension marketplace
./feature_status_table.md:55:8. **Fleetbase Runtime Orchestration** - Admin panel for runner management
./feature_status_table.md:69:- **Billing:** Plans + Subscriptions + Wallet + Payments
./feature_status_table.md:73:- **Fleetbase Runtime:** Orchestration admin panel
./feature_status_table.md:74:- **Fleetbase Engine:** Contacts + Drivers + Vehicles + Extensions
./feature_status_table.md:75:- **Available but Unused:** Orders + Dispatch + Tracking
./current_system_status_report.md:15:#### **1. Fleetbase Backend** ✅
./current_system_status_report.md:45:- **MySQL (Fleetbase)**: Port 3309 - DOWN  
./current_system_status_report.md:47:- **Redis (Fleetbase)**: Port 6379 - DOWN
./current_system_status_report.md:71:### **Fleetbase Backend Issues**
./current_system_status_report.md:102:✅ Fleetbase Backend (Port 8004)
./current_system_status_report.md:115:- **Tenant Runtime**: 🟡 **PARTIAL** (Fleetbase running but no database)
./current_system_status_report.md:141:#### **4. Fleetbase API Authentication Issues**
./current_system_status_report.md:215:- Test FastAPI ↔ Fleetbase integration
./deep_audit.sh:68:ROUTE_FILES=$(find "$ROOT" -path "*/routes/*.py" ! -path "*/__pycache__/*" \
./deep_audit.sh:164:h2 "9a. All frontend page routes (Next.js app dir)"
./deep_audit.sh:238:h2 "14b. Routes that filter by tenant vs routes that don't"
./docker-compose.yml:183:  # Join the Fleetbase network so `fleetbase-httpd` hostname resolves
./backend_frontend_misalignment_report.md:58:❌ GET /analytics - Analytics and reporting
./backend_frontend_misalignment_report.md:163:2. **Analytics & Reporting**
./backend_frontend_misalignment_report.md:191:2. **Analytics Dashboards**
./fleetbase_feature_audit.py:3:Comprehensive Fleetbase Feature Audit
./fleetbase_feature_audit.py:4:Compares Fleetbase's out-of-the-box features vs. our implementation
./fleetbase_feature_audit.py:15:    """Comprehensive audit of Fleetbase features vs our implementation"""
./fleetbase_feature_audit.py:23:        "🏢 FleetOps (TMS)": [
./fleetbase_feature_audit.py:24:            "✅ Fleet Management (vehicle/driver tracking)",
./fleetbase_feature_audit.py:27:            "✅ Real-Time Notifications & Tracking",
./fleetbase_feature_audit.py:31:            "✅ Visual Dashboards & KPIs",
./fleetbase_feature_audit.py:39:            "✅ Live GPS Tracking with coordinate visibility",
./fleetbase_feature_audit.py:51:            "✅ Built-in GPS Navigation"
./fleetbase_feature_audit.py:66:            "✅ Order Tracking Integration"
./fleetbase_feature_audit.py:71:            "✅ Stock Level Tracking",
./fleetbase_feature_audit.py:74:            "✅ Batch & Expiry Tracking",
./fleetbase_feature_audit.py:82:            "✅ Branded Customer Dashboard",
./fleetbase_feature_audit.py:84:            "✅ Real-time Delivery Tracking",
./fleetbase_feature_audit.py:97:            "✅ Real-time Order Tracking",
./fleetbase_feature_audit.py:102:            "✅ Live Map Visualization",
./fleetbase_feature_audit.py:143:            "📊 Revenue Analytics",
./fleetbase_feature_audit.py:147:            "🛠️ Fleetbase Provisioning (CLI integration)",
./fleetbase_feature_audit.py:155:            "🇨🇳 China Payments (framework ready, needs API credentials)",
./fleetbase_feature_audit.py:159:            "🚛 Driver Tracking (redundant - Fleetbase has it)",
./fleetbase_feature_audit.py:160:            "📦 Shipment Management (basic, needs Fleetbase integration)",
./fleetbase_feature_audit.py:161:            "👥 Customer Portal (basic templates, needs Fleetbase integration)"
./fleetbase_feature_audit.py:165:            "📱 Fleetbase Navigator Integration",
./fleetbase_feature_audit.py:166:            "🛒 Fleetbase Storefront Integration", 
./fleetbase_feature_audit.py:167:            "📦 Fleetbase Pallet (WMS) Integration",
./fleetbase_feature_audit.py:168:            "👥 Fleetbase Customer Portal Integration",
./fleetbase_feature_audit.py:169:            "📲 Fleetbase On-Demand App Integration",
./fleetbase_feature_audit.py:170:            "🏢 Fleetbase FleetOps Full Integration",
./fleetbase_feature_audit.py:171:            "🔧 Fleetbase Extension Management",
./fleetbase_feature_audit.py:172:            "📊 Fleetbase Dashboard Integration",
./fleetbase_feature_audit.py:173:            "🚛 Real Driver GPS Tracking (using Fleetbase)",
./fleetbase_feature_audit.py:174:            "🛣️ Route Optimization (using Fleetbase)",
./fleetbase_feature_audit.py:175:            "📋 Order Workflows (using Fleetbase)",
./fleetbase_feature_audit.py:176:            "💰 Dynamic Pricing (using Fleetbase)",
./fleetbase_feature_audit.py:177:            "🔔 Real-time Notifications (using Fleetbase)",
./fleetbase_feature_audit.py:178:            "📱 Mobile Apps (using Fleetbase)",
./fleetbase_feature_audit.py:179:            "📦 Inventory Management (using Fleetbase)",
./fleetbase_feature_audit.py:180:            "🛒 E-Commerce (using Fleetbase)",
./fleetbase_feature_audit.py:181:            "🎯 Extension Development (using Fleetbase)"
./fleetbase_feature_audit.py:196:            "Feature": "📱 Fleetbase Navigator Integration",
./fleetbase_feature_audit.py:197:            "Impact": "HIGH - We built redundant driver tracking instead of using Fleetbase's proven solution",
./fleetbase_feature_audit.py:198:            "Effort": "LOW - Just need to integrate with existing Fleetbase instance",
./fleetbase_feature_audit.py:202:            "Feature": "🛒 Fleetbase Storefront Integration",
./fleetbase_feature_audit.py:208:            "Feature": "👥 Fleetbase Customer Portal Integration",
./fleetbase_feature_audit.py:214:            "Feature": "📦 Fleetbase Pallet (WMS) Integration",
./fleetbase_feature_audit.py:220:            "Feature": "🔧 Fleetbase Extension Management",
./fleetbase_feature_audit.py:221:            "Impact": "HIGH - Cannot install/manage Fleetbase extensions",
./fleetbase_feature_audit.py:237:        "🚛 Custom Driver Tracking Service - Fleetbase Navigator already does this",
./fleetbase_feature_audit.py:238:        "🗺️ Custom Route Optimization - Fleetbase FleetOps already does this", 
./fleetbase_feature_audit.py:239:        "📱 Custom Driver App Framework - Fleetbase Navigator is production-ready",
./fleetbase_feature_audit.py:240:        "📍 Custom GPS Service - Fleetbase has comprehensive location tracking",
./fleetbase_feature_audit.py:241:        "🔔 Custom Notification System - Fleetbase has real-time notifications",
./fleetbase_feature_audit.py:242:        "📋 Custom Order Management - Fleetbase FleetOps handles this",
./fleetbase_feature_audit.py:243:        "💰 Custom Pricing Engine - Fleetbase has dynamic service rates",
./fleetbase_feature_audit.py:244:        "📊 Custom Driver Analytics - Fleetbase has driver performance tracking"
./fleetbase_feature_audit.py:255:            "Opportunity": "📱 Enable Fleetbase Navigator",
./fleetbase_feature_audit.py:256:            "Action": "Remove custom driver tracking, integrate with Fleetbase Navigator",
./fleetbase_feature_audit.py:257:            "Benefit": "Production-ready driver app with GPS, route optimization, POD",
./fleetbase_feature_audit.py:261:            "Opportunity": "🛒 Enable Fleetbase Storefront",
./fleetbase_feature_audit.py:267:            "Opportunity": "👥 Enable Fleetbase Customer Portal",
./fleetbase_feature_audit.py:273:            "Opportunity": "📦 Enable Fleetbase Pallet",
./fleetbase_feature_audit.py:280:            "Action": "Create extension marketplace for Fleetbase modules",
./fleetbase_feature_audit.py:318:    print("\n💡 POTENTIAL MONTHLY REVENUE (With Fleetbase Integration):")
./fleetbase_feature_audit.py:320:    print("   With Fleetbase: ₵1,200,000/month (+122% increase)")
./fleetbase_feature_audit.py:329:        "   2. Enable Fleetbase Navigator for all tenants",
./fleetbase_feature_audit.py:330:        "   3. Update documentation to reference Fleetbase features",
./fleetbase_feature_audit.py:331:        "   4. Test driver app integration with real Fleetbase instance",
./fleetbase_feature_audit.py:334:        "   1. Enable Fleetbase Storefront for e-commerce tenants",
./fleetbase_feature_audit.py:335:        "   2. Enable Fleetbase Customer Portal for all tenants",
./fleetbase_feature_audit.py:336:        "   3. Configure Fleetbase Pallet for inventory management",
./fleetbase_feature_audit.py:346:        "   1. Charge premium for Fleetbase extensions",
./fleetbase_feature_audit.py:366:        "   - Fleetbase already has ALL the logistics features",
./fleetbase_feature_audit.py:367:        "   - We built redundant driver tracking instead of using Fleetbase",
./fleetbase_feature_audit.py:368:        "   - We didn't integrate with Fleetbase's extensions",
./fleetbase_feature_audit.py:373:        "   - Integrate deeply with Fleetbase ecosystem",
./fleetbase_feature_audit.py:374:        "   - Monetize Fleetbase extensions for tenants",
./fleetbase_feature_audit.py:379:        "   - With Fleetbase integration: ₵14.4M/year",
./fleetbase_feature_audit.py:388:    """Run comprehensive Fleetbase feature audit"""
./fleetbase_feature_audit.py:395:    print("❌ BAD: We ignored Fleetbase's powerful ecosystem")
./fleetbase_feature_audit.py:397:    print("🚀 SOLUTION: Integrate with Fleetbase extensions immediately")
./test_auth_pages.py:70:def test_auth_routes():
./test_auth_pages.py:71:    """Test that authentication routes are properly configured"""
./test_auth_pages.py:75:        from app.api.routes.auth_pages import router
./test_auth_pages.py:77:        # Check routes
./test_auth_pages.py:78:        routes = [route.path for route in router.routes]
./test_auth_pages.py:79:        expected_routes = ["/login", "/register", "/dashboard", "/", "/forgot-password", "/reset-password"]
./test_auth_pages.py:81:        for expected_route in expected_routes:
./test_auth_pages.py:82:            if expected_route in routes:
./test_auth_pages.py:88:        print(f"❌ Auth routes error: {e}")
./test_auth_pages.py:122:            ("Dashboard", "Dashboard header"),
./test_auth_pages.py:124:            ("activeShipments", "Stats display"),
./test_auth_pages.py:131:                print(f"✅ Dashboard template: {description}")
./test_auth_pages.py:133:                print(f"❌ Dashboard template: {description} missing")
./test_auth_pages.py:142:        ("app/templates/auth/dashboard.html", "Dashboard"),
./test_auth_pages.py:214:        test_auth_routes()
./reports/autofix_20260602_172349/backups/.env.docker:30:# ── Fleetbase CLI ───────────────────────────────────────────────
./reports/autofix_20260602_172349/backups/.env.docker:38:# ── Maps (Mapbox) ────────────────────────────────────────────────
./reports/autofix_20260602_172349/backups/.env.docker:41:# Google Maps
./reports/autofix_20260602_172349/backups/docker-compose.yml:183:  # Join the Fleetbase network so `fleetbase-httpd` hostname resolves
./reports/autofix_20260602_172349/backups/frontend/.env.docker:11:# Map Configuration
./reports/autofix_20260602_172349/backups/frontend/middleware.ts:73:    // Run on all routes except Next.js internals and static files
./reports/autofix_20260602_172349/backups/frontend/lib/api.ts:481:  listShipments: () => api.get('/marketplace/shipments'),
./reports/autofix_20260602_172349/backups/frontend/lib/api.ts:520:  updateTracking: (jobId: string, status: string) =>
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:4:import { useRouter, useSearchParams } from 'next/navigation'
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:25:  MapPin,
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:43:export default function DashboardPage() {
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:98:      {/* Top nav removed - AppShell sidebar handles navigation */}
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:142:          <h1 className="text-3xl font-bold">Dashboard</h1>
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:160:                      <p className="font-semibold">My Shipments</p>
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:183:                      <MapPin className="h-6 w-6" />
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:276:                      <p className="font-semibold">Shipments</p>
./reports/autofix_20260602_172349/backups/frontend/app/dashboard/page.tsx:332:                    <MapPin className="h-6 w-6" />
./reports/uat_status_20260530_033025/summary.txt:24:[9] Fleetbase running runtime scan
./reports/uat_status_20260530_033025/commercial_catalog.txt:17:{"plans":[{"code":"free","name":"Free","monthly_price":0,"credits":50},{"code":"professional","name":"Professional","monthly_price":1000,"credits":500},{"code":"business","name":"Business","monthly_price":2500,"credits":1500},{"code":"vendor_driver","name":"Vendor / Driver","monthly_price":300,"credits":100}],"addons":[{"code":"marketplace","name":"Marketplace Access","monthly_price":200},{"code":"gps_tracking","name":"GPS Tracking","monthly_price":150},{"code":"ai","name":"AI Assistant","monthly_price":250},{"code":"advanced_crm","name":"Advanced CRM","monthly_price":150},{"code":"premium_support","name":"Premium Support","monthly_price":200}],"payment_methods":["paystack"],"note":"Paystack currently covers MoMo/cards where supported. Other providers can be added through the payment hub later."}
./reports/uat_status_20260530_033025/openapi.json:1:{"openapi":"3.1.0","info":{"title":"Afruheritage Control Plane","version":"0.1.0"},"paths":{"/api/v1/auth/bootstrap":{"post":{"tags":["auth"],"summary":"Bootstrap Admin","operationId":"bootstrap_admin_api_v1_auth_bootstrap_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BootstrapAdminRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TokenResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/register":{"post":{"tags":["auth"],"summary":"Register","operationId":"register_api_v1_auth_register_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/RegisterRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TokenResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/login":{"post":{"tags":["auth"],"summary":"Login","operationId":"login_api_v1_auth_login_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/LoginRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TokenResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/me":{"get":{"tags":["auth"],"summary":"Me","operationId":"me_api_v1_auth_me_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"additionalProperties":{"anyOf":[{"type":"string"},{"type":"boolean"},{"type":"null"}]},"type":"object","title":"Response Me Api V1 Auth Me Get"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/auth/password-reset/confirm":{"post":{"tags":["auth"],"summary":"Confirm Password Reset","operationId":"confirm_password_reset_api_v1_auth_password_reset_confirm_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PasswordResetConfirmRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"additionalProperties":{"type":"string"},"type":"object","title":"Response Confirm Password Reset Api V1 Auth Password Reset Confirm Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/social/providers":{"get":{"tags":["Social Authentication"],"summary":"Get Supported Providers","description":"Get list of supported social authentication providers","operationId":"get_supported_providers_api_v1_auth_social_providers_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/auth/social/{provider}/login":{"get":{"tags":["Social Authentication"],"summary":"Social Login","description":"Initiate social login with specified provider","operationId":"social_login_api_v1_auth_social__provider__login_get","parameters":[{"name":"provider","in":"path","required":true,"schema":{"type":"string","title":"Provider"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/social/{provider}":{"get":{"tags":["Social Authentication"],"summary":"Social Login Url","description":"Return authorization URL for frontend-driven redirects.","operationId":"social_login_url_api_v1_auth_social__provider__get","parameters":[{"name":"provider","in":"path","required":true,"schema":{"type":"string","title":"Provider"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/social/{provider}/callback":{"get":{"tags":["Social Authentication"],"summary":"Social Callback","description":"Handle social authentication callback","operationId":"social_callback_api_v1_auth_social__provider__callback_get","parameters":[{"name":"provider","in":"path","required":true,"schema":{"type":"string","title":"Provider"}},{"name":"code","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Code"}},{"name":"error","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Error"}},{"name":"error_description","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Error Description"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/social/{provider}/token":{"post":{"tags":["Social Authentication"],"summary":"Exchange Code For Token","description":"Exchange authorization code for access token (alternative to callback)","operationId":"exchange_code_for_token_api_v1_auth_social__provider__token_post","parameters":[{"name":"provider","in":"path","required":true,"schema":{"type":"string","title":"Provider"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TokenExchangeRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/social/disconnect/{provider}":{"get":{"tags":["Social Authentication"],"summary":"Disconnect Social Account","description":"Disconnect social account from user","operationId":"disconnect_social_account_api_v1_auth_social_disconnect__provider__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"provider","in":"path","required":true,"schema":{"type":"string","title":"Provider"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/auth/social/connected":{"get":{"tags":["Social Authentication"],"summary":"Get Connected Social Accounts","description":"Get list of connected social accounts","operationId":"get_connected_social_accounts_api_v1_auth_social_connected_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/login":{"get":{"summary":"Login Page","description":"Serve the login page","operationId":"login_page_login_get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"text/html":{"schema":{"type":"string"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/register":{"get":{"summary":"Register Page","description":"Serve the registration/request access page","operationId":"register_page_register_get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"text/html":{"schema":{"type":"string"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/dashboard":{"get":{"summary":"Dashboard Page","description":"Serve the tenant dashboard","operationId":"dashboard_page_dashboard_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"text/html":{"schema":{"type":"string"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/":{"get":{"summary":"Home Page","description":"Serve the home/landing page","operationId":"home_page__get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"text/html":{"schema":{"type":"string"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/forgot-password":{"get":{"summary":"Forgot Password Page","description":"Serve the forgot password page","operationId":"forgot_password_page_forgot_password_get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"text/html":{"schema":{"type":"string"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/reset-password":{"get":{"summary":"Reset Password Page","description":"Serve the password reset page","operationId":"reset_password_page_reset_password_get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"text/html":{"schema":{"type":"string"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/register-request":{"post":{"tags":["Tenant Requests"],"summary":"Create Tenant Registration Request","description":"Create a new tenant registration request","operationId":"create_tenant_registration_request_api_v1_tenants_register_request_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantRegistrationRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/registration-status/{request_id}":{"get":{"tags":["Tenant Requests"],"summary":"Get Registration Status","description":"Get registration request status","operationId":"get_registration_status_api_v1_tenants_registration_status__request_id__get","parameters":[{"name":"request_id","in":"path","required":true,"schema":{"type":"string","title":"Request Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/register-requests":{"get":{"tags":["Tenant Requests"],"summary":"List Registration Requests","operationId":"list_registration_requests_api_v1_tenants_register_requests_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/register-requests/{request_id}":{"patch":{"tags":["Tenant Requests"],"summary":"Review Registration Request","operationId":"review_registration_request_api_v1_tenants_register_requests__request_id__patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"request_id","in":"path","required":true,"schema":{"type":"string","title":"Request Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantRequestReviewPayload"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/create":{"post":{"tags":["Tenant Creation"],"summary":"Create Tenant","description":"Create a new tenant with complete setup","operationId":"create_tenant_api_v1_tenants_create_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantCreationRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantCreationResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/tenants/{tenant_id}/setup-infrastructure":{"post":{"tags":["Tenant Creation"],"summary":"Setup Tenant Infrastructure","description":"Queue infrastructure provisioning for a tenant.","operationId":"setup_tenant_infrastructure_api_v1_tenants__tenant_id__setup_infrastructure_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/{tenant_id}/status":{"get":{"tags":["Tenant Creation"],"summary":"Get Tenant Status","description":"Get comprehensive tenant status","operationId":"get_tenant_status_api_v1_tenants__tenant_id__status_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/{tenant_id}/portal-url":{"get":{"tags":["Tenant Creation"],"summary":"Get Tenant Portal Url","description":"Get the portal URL for a tenant","operationId":"get_tenant_portal_url_api_v1_tenants__tenant_id__portal_url_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/auto-provision":{"post":{"tags":["Tenant Creation"],"summary":"Auto Provision Tenant","description":"Auto-provision tenant from registration request (for admin approval)","operationId":"auto_provision_tenant_api_v1_tenants_auto_provision_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"request_id","in":"query","required":true,"schema":{"type":"string","title":"Request Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants":{"get":{"tags":["tenants"],"summary":"List Tenants","operationId":"list_tenants_api_v1_tenants_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"items":{"$ref":"#/components/schemas/TenantResponse"},"type":"array","title":"Response List Tenants Api V1 Tenants Get"}}}}},"security":[{"OAuth2PasswordBearer":[]}]},"post":{"tags":["tenants"],"summary":"Create Tenant","operationId":"create_tenant_api_v1_tenants_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantCreate"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/tenants/{tenant_id}/approve":{"post":{"tags":["tenants"],"summary":"Approve Tenant","operationId":"approve_tenant_api_v1_tenants__tenant_id__approve_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ApprovalRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/{tenant_id}/launch":{"post":{"tags":["tenants"],"summary":"Launch Tenant","operationId":"launch_tenant_api_v1_tenants__tenant_id__launch_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/LaunchRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/JobResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/{tenant_id}/runtime-auth":{"post":{"tags":["tenants"],"summary":"Update Tenant Runtime Auth","operationId":"update_tenant_runtime_auth_api_v1_tenants__tenant_id__runtime_auth_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantRuntimeAuthUpdate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/jobs/{job_id}":{"get":{"tags":["tenants"],"summary":"Get Job","operationId":"get_job_api_v1_tenants_jobs__job_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/JobResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/tenants/jobs/{job_id}/retry":{"post":{"tags":["tenants"],"summary":"Retry Job","operationId":"retry_job_api_v1_tenants_jobs__job_id__retry_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/JobResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payments/initiate":{"post":{"tags":["Platform Payments"],"summary":"Initiate Payment","description":"Initiate payment through platform gateway","operationId":"initiate_payment_api_v1_payments_initiate_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentInitiateRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentInitiateResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/payments/status/{payment_reference}":{"get":{"tags":["Platform Payments"],"summary":"Get Payment Status","description":"Get payment status","operationId":"get_payment_status_api_v1_payments_status__payment_reference__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"payment_reference","in":"path","required":true,"schema":{"type":"string","title":"Payment Reference"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentStatusResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payments/webhook/paystack":{"post":{"tags":["Platform Payments"],"summary":"Paystack Webhook","description":"Handle Paystack webhook notifications","operationId":"paystack_webhook_api_v1_payments_webhook_paystack_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/payments/webhook/paypal":{"post":{"tags":["Platform Payments"],"summary":"Paypal Webhook","description":"Handle PayPal webhook notifications","operationId":"paypal_webhook_api_v1_payments_webhook_paypal_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/payments/statistics":{"get":{"tags":["Platform Payments"],"summary":"Get Payment Statistics","description":"Get payment statistics for tenant","operationId":"get_payment_statistics_api_v1_payments_statistics_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"start_date","in":"query","required":false,"schema":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Start Date"}},{"name":"end_date","in":"query","required":false,"schema":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"End Date"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentStatistics"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payments/credits/purchase":{"post":{"tags":["Platform Payments"],"summary":"Purchase Credits","description":"Purchase virtual credits","operationId":"purchase_credits_api_v1_payments_credits_purchase_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CreditPurchaseRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/CreditPurchaseResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/payments/methods":{"get":{"tags":["Platform Payments"],"summary":"Get Payment Methods","description":"Get available payment methods","operationId":"get_payment_methods_api_v1_payments_methods_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/payments/balance":{"get":{"tags":["Platform Payments"],"summary":"Get Account Balance","description":"Get tenant account balance","operationId":"get_account_balance_api_v1_payments_balance_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/billing/plans":{"get":{"tags":["Billing"],"summary":"List Plans","operationId":"list_plans_api_v1_billing_plans_get","parameters":[{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/PlanResponse"},"title":"Response List Plans Api V1 Billing Plans Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/subscriptions/trial/{tenant_id}":{"post":{"tags":["Billing"],"summary":"Start Trial","operationId":"start_trial_api_v1_billing_subscriptions_trial__tenant_id__post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SubscriptionResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/subscriptions/{tenant_id}":{"get":{"tags":["Billing"],"summary":"Get Subscription","operationId":"get_subscription_api_v1_billing_subscriptions__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/SubscriptionResponse"},{"type":"null"}],"title":"Response Get Subscription Api V1 Billing Subscriptions  Tenant Id  Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/wallets/{tenant_id}":{"get":{"tags":["Billing"],"summary":"Get Wallet","operationId":"get_wallet_api_v1_billing_wallets__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/WalletResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/wallets/{tenant_id}/transactions":{"get":{"tags":["Billing"],"summary":"List Wallet Transactions","operationId":"list_wallet_transactions_api_v1_billing_wallets__tenant_id__transactions_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Limit"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/WalletTransactionResponse"},"title":"Response List Wallet Transactions Api V1 Billing Wallets  Tenant Id  Transactions Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/usage-costs":{"get":{"tags":["Billing"],"summary":"Get Usage Costs","operationId":"get_usage_costs_api_v1_billing_usage_costs_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"items":{"$ref":"#/components/schemas/UsageCreditCostResponse"},"type":"array","title":"Response Get Usage Costs Api V1 Billing Usage Costs Get"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/billing/payments/init":{"post":{"tags":["Billing"],"summary":"Init Payment","operationId":"init_payment_api_v1_billing_payments_init_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentInitRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentInitResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/payments/verify/{reference}":{"post":{"tags":["Billing"],"summary":"Verify Payment","operationId":"verify_payment_api_v1_billing_payments_verify__reference__post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"reference","in":"path","required":true,"schema":{"type":"string","title":"Reference"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentVerifyResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/payments/reinit/{reference}":{"post":{"tags":["Billing"],"summary":"Reinit Payment","operationId":"reinit_payment_api_v1_billing_payments_reinit__reference__post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"reference","in":"path","required":true,"schema":{"type":"string","title":"Reference"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentReinitRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/PaymentInitResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/credits/consume":{"post":{"tags":["Billing"],"summary":"Consume Credits","operationId":"consume_credits_api_v1_billing_credits_consume_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CreditConsumeRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/WalletResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/admin/read-only":{"post":{"tags":["Billing"],"summary":"Admin Set Read Only","operationId":"admin_set_read_only_api_v1_billing_admin_read_only_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BillingAdminSetReadOnlyRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/SubscriptionResponse"},{"type":"null"}],"title":"Response Admin Set Read Only Api V1 Billing Admin Read Only Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/admin/credits/adjust":{"post":{"tags":["Billing"],"summary":"Admin Credits Adjust","operationId":"admin_credits_adjust_api_v1_billing_admin_credits_adjust_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BillingAdminAdjustCreditsRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/WalletResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/billing/admin/subscriptions/assign":{"post":{"tags":["Billing"],"summary":"Admin Assign Plan","operationId":"admin_assign_plan_api_v1_billing_admin_subscriptions_assign_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BillingAdminAssignPlanRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SubscriptionResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/commercial/catalog":{"get":{"tags":["Commercial Orchestration"],"summary":"Catalog","operationId":"catalog_api_v1_commercial_catalog_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/commercial/signup/start":{"post":{"tags":["Commercial Orchestration"],"summary":"Signup Start","operationId":"signup_start_api_v1_commercial_signup_start_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/SignupStart"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/commercial/signup/select-plan":{"post":{"tags":["Commercial Orchestration"],"summary":"Select Plan","operationId":"select_plan_api_v1_commercial_signup_select_plan_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PlanSelect"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/commercial/signup/{signup_id}":{"get":{"tags":["Commercial Orchestration"],"summary":"Signup Status","operationId":"signup_status_api_v1_commercial_signup__signup_id__get","parameters":[{"name":"signup_id","in":"path","required":true,"schema":{"type":"string","title":"Signup Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/commercial/signup/{signup_id}/provision-runtime":{"post":{"tags":["Commercial Orchestration"],"summary":"Provision Signup Runtime","operationId":"provision_signup_runtime_api_v1_commercial_signup__signup_id__provision_runtime_post","parameters":[{"name":"signup_id","in":"path","required":true,"schema":{"type":"string","title":"Signup Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/commercial/signup/{signup_id}/reconcile-runtime":{"post":{"tags":["Commercial Orchestration"],"summary":"Reconcile Signup Runtime","operationId":"reconcile_signup_runtime_api_v1_commercial_signup__signup_id__reconcile_runtime_post","parameters":[{"name":"signup_id","in":"path","required":true,"schema":{"type":"string","title":"Signup Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/commercial/signup/{signup_id}/provision-runtime-async":{"post":{"tags":["Commercial Orchestration"],"summary":"Provision Signup Runtime Async","operationId":"provision_signup_runtime_async_api_v1_commercial_signup__signup_id__provision_runtime_async_post","parameters":[{"name":"signup_id","in":"path","required":true,"schema":{"type":"string","title":"Signup Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/whatsapp/configure-groups":{"post":{"tags":["WhatsApp Notifications"],"summary":"Configure Whatsapp Groups","description":"Configure WhatsApp groups for tenant notifications","operationId":"configure_whatsapp_groups_api_v1_whatsapp_configure_groups_post","requestBody":{"content":{"application/json":{"schema":{"items":{"type":"object"},"type":"array","title":"Groups"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/whatsapp/test-connection":{"post":{"tags":["WhatsApp Notifications"],"summary":"Test Whatsapp Connection","description":"Test WhatsApp API connection","operationId":"test_whatsapp_connection_api_v1_whatsapp_test_connection_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/whatsapp/send-shipment-update":{"post":{"tags":["WhatsApp Notifications"],"summary":"Send Shipment Update","description":"Send shipment update to WhatsApp groups","operationId":"send_shipment_update_api_v1_whatsapp_send_shipment_update_post","requestBody":{"content":{"application/json":{"schema":{"type":"object","title":"Shipment Data"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/whatsapp/send-customer-notification":{"post":{"tags":["WhatsApp Notifications"],"summary":"Send Customer Notification","description":"Send WhatsApp notification directly to customer","operationId":"send_customer_notification_api_v1_whatsapp_send_customer_notification_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"customer_phone","in":"query","required":true,"schema":{"type":"string","title":"Customer Phone"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","title":"Shipment Data"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/whatsapp/status":{"get":{"tags":["WhatsApp Notifications"],"summary":"Get Whatsapp Status","description":"Get WhatsApp service status","operationId":"get_whatsapp_status_api_v1_whatsapp_status_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/whatsapp-csv/upload":{"post":{"tags":["WhatsApp CSV Upload"],"summary":"Upload Csv And Notify","description":"Upload CSV of phone numbers and send WhatsApp notifications","operationId":"upload_csv_and_notify_api_v1_whatsapp_csv_upload_post","requestBody":{"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_upload_csv_and_notify_api_v1_whatsapp_csv_upload_post"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/runners":{"get":{"tags":["runners"],"summary":"List Runners","operationId":"list_runners_api_v1_runners_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"items":{"$ref":"#/components/schemas/app__schemas__runner__RunnerResponse"},"type":"array","title":"Response List Runners Api V1 Runners Get"}}}}},"security":[{"OAuth2PasswordBearer":[]}]},"post":{"tags":["runners"],"summary":"Create Runner","operationId":"create_runner_api_v1_runners_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/RunnerCreate"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/app__schemas__runner__RunnerResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/fleetbase-runtime/runners":{"post":{"tags":["Fleetbase Runtime"],"summary":"Create Runner","operationId":"create_runner_api_v1_fleetbase_runtime_runners_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/RunnerCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/app__schemas__fleetbase_runtime__RunnerResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Fleetbase Runtime"],"summary":"List Runners","operationId":"list_runners_api_v1_fleetbase_runtime_runners_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/app__schemas__fleetbase_runtime__RunnerResponse"},"title":"Response List Runners Api V1 Fleetbase Runtime Runners Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/fleetbase-runtime/deploy":{"post":{"tags":["Fleetbase Runtime"],"summary":"Deploy Runtime","operationId":"deploy_runtime_api_v1_fleetbase_runtime_deploy_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/RuntimeDeployRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/RuntimeResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/fleetbase-runtime/tenant/{tenant_id}":{"get":{"tags":["Fleetbase Runtime"],"summary":"Get Runtime By Tenant","operationId":"get_runtime_by_tenant_api_v1_fleetbase_runtime_tenant__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/RuntimeResponse"},{"type":"null"}],"title":"Response Get Runtime By Tenant Api V1 Fleetbase Runtime Tenant  Tenant Id  Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/fleetbase-runtime/retry":{"post":{"tags":["Fleetbase Runtime"],"summary":"Retry Runtime Route","operationId":"retry_runtime_route_api_v1_fleetbase_runtime_retry_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/RuntimeRetryRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/RuntimeResponse"},{"type":"null"}],"title":"Response Retry Runtime Route Api V1 Fleetbase Runtime Retry Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/fleetbase-runtime/suspend":{"post":{"tags":["Fleetbase Runtime"],"summary":"Suspend Runtime Route","operationId":"suspend_runtime_route_api_v1_fleetbase_runtime_suspend_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/RuntimeSuspendRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/RuntimeResponse"},{"type":"null"}],"title":"Response Suspend Runtime Route Api V1 Fleetbase Runtime Suspend Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/fleetbase-runtime/{runtime_id}/events":{"get":{"tags":["Fleetbase Runtime"],"summary":"Get Runtime Events","operationId":"get_runtime_events_api_v1_fleetbase_runtime__runtime_id__events_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"runtime_id","in":"path","required":true,"schema":{"type":"string","title":"Runtime Id"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/RuntimeEventResponse"},"title":"Response Get Runtime Events Api V1 Fleetbase Runtime  Runtime Id  Events Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/ai/chat":{"post":{"tags":["AI"],"summary":"Ai Chat","operationId":"ai_chat_api_v1_ai_chat_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/AIChatRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/AIChatResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/ai/widget/config":{"get":{"tags":["AI Widget"],"summary":"Get Widget Config","operationId":"get_widget_config_api_v1_ai_widget_config_get","parameters":[{"name":"host","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Host"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/AIWidgetConfigResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/accounts":{"post":{"tags":["Support & CRM"],"summary":"Create Account","operationId":"create_account_api_v1_support_crm_accounts_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CRMAccountCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/CRMAccountResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Support & CRM"],"summary":"List Accounts","operationId":"list_accounts_api_v1_support_crm_accounts_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/CRMAccountResponse"},"title":"Response List Accounts Api V1 Support Crm Accounts Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/contacts":{"get":{"tags":["Support & CRM"],"summary":"List Contacts","operationId":"list_contacts_api_v1_support_crm_contacts_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/CRMContactResponse"},"title":"Response List Contacts Api V1 Support Crm Contacts Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"post":{"tags":["Support & CRM"],"summary":"Create Contact","operationId":"create_contact_api_v1_support_crm_contacts_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CRMContactCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/CRMContactResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/opportunities":{"get":{"tags":["Support & CRM"],"summary":"List Opportunities","operationId":"list_opportunities_api_v1_support_crm_opportunities_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/OpportunityResponse"},"title":"Response List Opportunities Api V1 Support Crm Opportunities Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"post":{"tags":["Support & CRM"],"summary":"Create Opportunity Route","operationId":"create_opportunity_route_api_v1_support_crm_opportunities_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/OpportunityCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/OpportunityResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/quotes":{"get":{"tags":["Support & CRM"],"summary":"List Quotes","operationId":"list_quotes_api_v1_support_crm_quotes_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/QuoteResponse"},"title":"Response List Quotes Api V1 Support Crm Quotes Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"post":{"tags":["Support & CRM"],"summary":"Create Quote Route","operationId":"create_quote_route_api_v1_support_crm_quotes_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/QuoteCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/QuoteResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/public/tickets":{"post":{"tags":["Support & CRM"],"summary":"Create Public Ticket Route","operationId":"create_public_ticket_route_api_v1_support_crm_public_tickets_post","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/PublicTicketCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SupportTicketResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/public/tickets/{public_token}":{"get":{"tags":["Support & CRM"],"summary":"Get Public Ticket","operationId":"get_public_ticket_api_v1_support_crm_public_tickets__public_token__get","parameters":[{"name":"public_token","in":"path","required":true,"schema":{"type":"string","title":"Public Token"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SupportTicketResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/public/tickets/{public_token}/messages":{"get":{"tags":["Support & CRM"],"summary":"Get Public Ticket Messages","operationId":"get_public_ticket_messages_api_v1_support_crm_public_tickets__public_token__messages_get","parameters":[{"name":"public_token","in":"path","required":true,"schema":{"type":"string","title":"Public Token"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/SupportTicketMessageResponse"},"title":"Response Get Public Ticket Messages Api V1 Support Crm Public Tickets  Public Token  Messages Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/public/tickets/{public_token}/reply":{"post":{"tags":["Support & CRM"],"summary":"Reply Public Ticket","operationId":"reply_public_ticket_api_v1_support_crm_public_tickets__public_token__reply_post","parameters":[{"name":"public_token","in":"path","required":true,"schema":{"type":"string","title":"Public Token"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TicketReplyRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/SupportTicketMessageResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/admin/tickets":{"get":{"tags":["Support & CRM"],"summary":"List Admin Tickets","operationId":"list_admin_tickets_api_v1_support_crm_admin_tickets_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}},{"name":"q","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Q"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response List Admin Tickets Api V1 Support Crm Admin Tickets Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/support-crm/admin/tickets/{ticket_id}/status":{"patch":{"tags":["Support & CRM"],"summary":"Update Admin Ticket Status","operationId":"update_admin_ticket_status_api_v1_support_crm_admin_tickets__ticket_id__status_patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"ticket_id","in":"path","required":true,"schema":{"type":"string","title":"Ticket Id"}},{"name":"status","in":"query","required":true,"schema":{"type":"string","title":"Status"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response Update Admin Ticket Status Api V1 Support Crm Admin Tickets  Ticket Id  Status Patch"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/domains/request":{"post":{"tags":["Custom Domains"],"summary":"Request Domain","operationId":"request_domain_api_v1_domains_request_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/DomainRequestCreate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/DomainResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/domains/tenant/{tenant_id}":{"get":{"tags":["Custom Domains"],"summary":"Get Tenant Domains","operationId":"get_tenant_domains_api_v1_domains_tenant__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/DomainResponse"},"title":"Response Get Tenant Domains Api V1 Domains Tenant  Tenant Id  Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/domains/activate":{"post":{"tags":["Custom Domains"],"summary":"Activate Domain Route","operationId":"activate_domain_route_api_v1_domains_activate_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/DomainActivateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/DomainResponse"},{"type":"null"}],"title":"Response Activate Domain Route Api V1 Domains Activate Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/domains/{domain_id}/fail":{"post":{"tags":["Custom Domains"],"summary":"Fail Domain","operationId":"fail_domain_api_v1_domains__domain_id__fail_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"domain_id","in":"path","required":true,"schema":{"type":"string","title":"Domain Id"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/DomainFailRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/DomainResponse"},{"type":"null"}],"title":"Response Fail Domain Api V1 Domains  Domain Id  Fail Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/domains/{domain_id}/events":{"get":{"tags":["Custom Domains"],"summary":"Get Domain Events","operationId":"get_domain_events_api_v1_domains__domain_id__events_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"domain_id","in":"path","required":true,"schema":{"type":"string","title":"Domain Id"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/DomainEventResponse"},"title":"Response Get Domain Events Api V1 Domains  Domain Id  Events Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/domains/settings/{tenant_id}":{"get":{"tags":["Custom Domains"],"summary":"Get Tenant Domain Settings","operationId":"get_tenant_domain_settings_api_v1_domains_settings__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/TenantDomainSettingsResponse"},{"type":"null"}],"title":"Response Get Tenant Domain Settings Api V1 Domains Settings  Tenant Id  Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}/transition":{"post":{"tags":["Shipments & Tracking"],"summary":"Transition Shipment Status Route","operationId":"transition_shipment_status_route_api_v1_shipments__tenant_id___shipment_id__transition_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}},{"name":"status","in":"query","required":true,"schema":{"type":"string","title":"Status"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}":{"post":{"tags":["Shipments & Tracking"],"summary":"Create Shipment Route","operationId":"create_shipment_route_api_v1_shipments__tenant_id__post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentCreate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Shipments & Tracking"],"summary":"Search Shipments Route","operationId":"search_shipments_route_api_v1_shipments__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"q","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"description":"Search by tracking number, name","title":"Q"},"description":"Search by tracking number, name"},{"name":"status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},{"name":"payment_status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Payment Status"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response Search Shipments Route Api V1 Shipments  Tenant Id  Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/summary":{"get":{"tags":["Shipments & Tracking"],"summary":"Shipment Dashboard Summary Route","operationId":"shipment_dashboard_summary_route_api_v1_shipments__tenant_id__summary_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response Shipment Dashboard Summary Route Api V1 Shipments  Tenant Id  Summary Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}":{"get":{"tags":["Shipments & Tracking"],"summary":"Get Shipment Route","operationId":"get_shipment_route_api_v1_shipments__tenant_id___shipment_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"patch":{"tags":["Shipments & Tracking"],"summary":"Update Shipment Route","operationId":"update_shipment_route_api_v1_shipments__tenant_id___shipment_id__patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentUpdate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}/events":{"post":{"tags":["Shipments & Tracking"],"summary":"Add Event Route","operationId":"add_event_route_api_v1_shipments__tenant_id___shipment_id__events_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentEventCreate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentEventResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Shipments & Tracking"],"summary":"Get Events Route","operationId":"get_events_route_api_v1_shipments__tenant_id___shipment_id__events_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/ShipmentEventResponse"},"title":"Response Get Events Route Api V1 Shipments  Tenant Id   Shipment Id  Events Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}/location":{"post":{"tags":["Shipments & Tracking"],"summary":"Update Location Route","operationId":"update_location_route_api_v1_shipments__tenant_id___shipment_id__location_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentLocationUpdate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/point":{"post":{"tags":["Shipments & Tracking"],"summary":"Ingest Tracking Point Route","operationId":"ingest_tracking_point_route_api_v1_shipments__tenant_id___shipment_id__tracking_point_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TrackingPointIngestRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TrackingPointIngestResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/latest":{"get":{"tags":["Shipments & Tracking"],"summary":"Latest Tracking Point Route","operationId":"latest_tracking_point_route_api_v1_shipments__tenant_id___shipment_id__tracking_latest_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"anyOf":[{"$ref":"#/components/schemas/TrackingPointResponse"},{"type":"null"}],"title":"Response Latest Tracking Point Route Api V1 Shipments  Tenant Id   Shipment Id  Tracking Latest Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/history":{"get":{"tags":["Shipments & Tracking"],"summary":"Tracking History Route","operationId":"tracking_history_route_api_v1_shipments__tenant_id___shipment_id__tracking_history_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"shipment_id","in":"path","required":true,"schema":{"type":"string","title":"Shipment Id"}},{"name":"from","in":"query","required":false,"schema":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"From"}},{"name":"to","in":"query","required":false,"schema":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"To"}},{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":2000,"minimum":1,"default":500,"title":"Limit"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/TrackingPointResponse"},"title":"Response Tracking History Route Api V1 Shipments  Tenant Id   Shipment Id  Tracking History Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/public/track/{tenant_id}/{tracking_number}":{"get":{"tags":["Shipments & Tracking"],"summary":"Public Track Route","operationId":"public_track_route_api_v1_shipments_public_track__tenant_id___tracking_number__get","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"tracking_number","in":"path","required":true,"schema":{"type":"string","title":"Tracking Number"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentPublicTrackResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/import/csv":{"post":{"tags":["Shipments & Tracking"],"summary":"Import Csv Route","operationId":"import_csv_route_api_v1_shipments__tenant_id__import_csv_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_import_csv_route_api_v1_shipments__tenant_id__import_csv_post"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/members":{"post":{"tags":["Shipments & Tracking"],"summary":"Create Member Route","operationId":"create_member_route_api_v1_shipments__tenant_id__members_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/GroupMemberCreate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/GroupMemberResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Shipments & Tracking"],"summary":"List Members Route","operationId":"list_members_route_api_v1_shipments__tenant_id__members_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"q","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Q"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":200,"minimum":1,"default":50,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response List Members Route Api V1 Shipments  Tenant Id  Members Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/shipments/{tenant_id}/members/{member_id}":{"get":{"tags":["Shipments & Tracking"],"summary":"Get Member Route","operationId":"get_member_route_api_v1_shipments__tenant_id__members__member_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"member_id","in":"path","required":true,"schema":{"type":"string","title":"Member Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/GroupMemberResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"patch":{"tags":["Shipments & Tracking"],"summary":"Update Member Route","operationId":"update_member_route_api_v1_shipments__tenant_id__members__member_id__patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"member_id","in":"path","required":true,"schema":{"type":"string","title":"Member Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/GroupMemberUpdate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/GroupMemberResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/i18n/translations/{lang}":{"get":{"tags":["Internationalization"],"summary":"Get Translations","operationId":"get_translations_api_v1_i18n_translations__lang__get","parameters":[{"name":"lang","in":"path","required":true,"schema":{"type":"string","title":"Lang"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/i18n/languages":{"get":{"tags":["Internationalization"],"summary":"Get Supported Languages","operationId":"get_supported_languages_api_v1_i18n_languages_get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/i18n/detect":{"get":{"tags":["Internationalization"],"summary":"Detect User Language","operationId":"detect_user_language_api_v1_i18n_detect_get","parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"Accept-Language","in":"header","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Accept-Language"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/navigator/{tenant_id}/drivers":{"get":{"summary":"Get Navigator Drivers","description":"Fetch driver list for Navigator module for a tenant.","operationId":"get_navigator_drivers_api_v1_navigator__tenant_id__drivers_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/navigator/{tenant_id}/tracking":{"get":{"summary":"Get Navigator Tracking","description":"Fetch real-time tracking data for Navigator module for a tenant.","operationId":"get_navigator_tracking_api_v1_navigator__tenant_id__tracking_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/storefront/{tenant_id}/orders":{"get":{"summary":"Get Storefront Orders","description":"Fetch order list for Storefront module for a tenant.","operationId":"get_storefront_orders_api_v1_storefront__tenant_id__orders_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/storefront/{tenant_id}/customers":{"get":{"summary":"Get Storefront Customers","description":"Fetch customer list for Storefront module for a tenant.","operationId":"get_storefront_customers_api_v1_storefront__tenant_id__customers_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/pallet/{tenant_id}/inventory":{"get":{"summary":"Get Pallet Inventory","description":"Fetch inventory list for Pallet module for a tenant.","operationId":"get_pallet_inventory_api_v1_pallet__tenant_id__inventory_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/pallet/{tenant_id}/warehouses":{"get":{"summary":"Get Pallet Warehouses","description":"Fetch warehouse list for Pallet module for a tenant.","operationId":"get_pallet_warehouses_api_v1_pallet__tenant_id__warehouses_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/customer-portal/{tenant_id}/shipments":{"get":{"summary":"Get Customer Portal Shipments","description":"Fetch shipment list for Customer Portal module for a tenant.","operationId":"get_customer_portal_shipments_api_v1_customer_portal__tenant_id__shipments_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/customer-portal/{tenant_id}/tracking":{"get":{"summary":"Get Customer Portal Tracking","description":"Fetch tracking data for Customer Portal module for a tenant.","operationId":"get_customer_portal_tracking_api_v1_customer_portal__tenant_id__tracking_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/branding/{tenant_id}":{"get":{"tags":["Tenant Branding"],"summary":"Get Branding Route","operationId":"get_branding_route_api_v1_branding__tenant_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BrandingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"patch":{"tags":["Tenant Branding"],"summary":"Update Branding Route","operationId":"update_branding_route_api_v1_branding__tenant_id__patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BrandingUpdate"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BrandingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/branding/public/{tenant_id}":{"get":{"tags":["Tenant Branding"],"summary":"Get Public Branding Route","operationId":"get_public_branding_route_api_v1_branding_public__tenant_id__get","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BrandingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/geocode":{"get":{"tags":["Geo & Maps"],"summary":"Geocode Address","description":"Geocode address with optional priority country enhancements","operationId":"geocode_address_api_v1_geo_geocode_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"address","in":"query","required":true,"schema":{"type":"string","minLength":2,"title":"Address"}},{"name":"city","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"City"}},{"name":"region","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Region"}},{"name":"country","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"}},{"name":"use_priority_service","in":"query","required":false,"schema":{"type":"boolean","default":false,"title":"Use Priority Service"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/geocode/priority":{"get":{"tags":["Geo & Maps"],"summary":"Geocode Priority Address","description":"Priority geocoding with Ghana and China optimizations","operationId":"geocode_priority_address_api_v1_geo_geocode_priority_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"address","in":"query","required":true,"schema":{"type":"string","minLength":2,"title":"Address"}},{"name":"city","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"City"}},{"name":"region","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Region"}},{"name":"country","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/geocode/city":{"get":{"tags":["Geo & Maps"],"summary":"Geocode City Region","description":"Geocode city with region context for priority countries","operationId":"geocode_city_region_api_v1_geo_geocode_city_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"city","in":"query","required":true,"schema":{"type":"string","minLength":2,"title":"City"}},{"name":"region","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Region"}},{"name":"country","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/route":{"get":{"tags":["Geo & Maps"],"summary":"Calculate Route","description":"Calculate route with optional priority country optimizations","operationId":"calculate_route_api_v1_geo_route_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"origin_lat","in":"query","required":true,"schema":{"type":"number","title":"Origin Lat"}},{"name":"origin_lng","in":"query","required":true,"schema":{"type":"number","title":"Origin Lng"}},{"name":"dest_lat","in":"query","required":true,"schema":{"type":"number","title":"Dest Lat"}},{"name":"dest_lng","in":"query","required":true,"schema":{"type":"number","title":"Dest Lng"}},{"name":"origin_city","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin City"}},{"name":"dest_city","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Dest City"}},{"name":"country","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"}},{"name":"use_priority_service","in":"query","required":false,"schema":{"type":"boolean","default":false,"title":"Use Priority Service"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/route/priority":{"get":{"tags":["Geo & Maps"],"summary":"Calculate Priority Route","description":"Calculate priority route using city names","operationId":"calculate_priority_route_api_v1_geo_route_priority_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"origin","in":"query","required":true,"schema":{"type":"string","minLength":2,"title":"Origin"}},{"name":"destination","in":"query","required":true,"schema":{"type":"string","minLength":2,"title":"Destination"}},{"name":"country","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/nearby-cities":{"get":{"tags":["Geo & Maps"],"summary":"Get Nearby Priority Cities","description":"Find priority country cities within radius of coordinates","operationId":"get_nearby_priority_cities_api_v1_geo_nearby_cities_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"lat","in":"query","required":true,"schema":{"type":"number","title":"Lat"}},{"name":"lng","in":"query","required":true,"schema":{"type":"number","title":"Lng"}},{"name":"radius_km","in":"query","required":false,"schema":{"type":"number","maximum":200.0,"minimum":1.0,"default":50,"title":"Radius Km"}},{"name":"country","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/validate/address":{"post":{"tags":["Geo & Maps"],"summary":"Validate Priority Address","description":"Validate priority country address and extract components","operationId":"validate_priority_address_api_v1_geo_validate_address_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"address","in":"query","required":true,"schema":{"type":"string","minLength":5,"title":"Address"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/country/{country}":{"get":{"tags":["Geo & Maps"],"summary":"Get Country Info","description":"Get country information for priority countries","operationId":"get_country_info_api_v1_geo_country__country__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"country","in":"path","required":true,"schema":{"type":"string","title":"Country"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/geo/{tenant_id}/shipment-routes":{"get":{"tags":["Geo & Maps"],"summary":"Get Active Shipment Routes","description":"Get active shipment routes with optional priority country geocoding","operationId":"get_active_shipment_routes_api_v1_geo__tenant_id__shipment_routes_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"use_priority_service","in":"query","required":false,"schema":{"type":"boolean","default":false,"title":"Use Priority Service"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/register":{"post":{"tags":["Delivery Vendors"],"summary":"Register Vendor Route","operationId":"register_vendor_route_api_v1_vendors_register_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorRegisterResponse"}}}}}}},"/api/v1/vendors/admin":{"get":{"tags":["Delivery Vendors"],"summary":"List Vendors Admin","operationId":"list_vendors_admin_api_v1_vendors_admin_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},{"name":"q","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Q"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response List Vendors Admin Api V1 Vendors Admin Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/admin/{vendor_id}":{"get":{"tags":["Delivery Vendors"],"summary":"Get Vendor Admin","operationId":"get_vendor_admin_api_v1_vendors_admin__vendor_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"vendor_id","in":"path","required":true,"schema":{"type":"string","title":"Vendor Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/admin/{vendor_id}/review":{"post":{"tags":["Delivery Vendors"],"summary":"Review Vendor Route","operationId":"review_vendor_route_api_v1_vendors_admin__vendor_id__review_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"vendor_id","in":"path","required":true,"schema":{"type":"string","title":"Vendor Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorReviewRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/admin/{vendor_id}/suspend":{"post":{"tags":["Delivery Vendors"],"summary":"Suspend Vendor Route","operationId":"suspend_vendor_route_api_v1_vendors_admin__vendor_id__suspend_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"vendor_id","in":"path","required":true,"schema":{"type":"string","title":"Vendor Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/admin/{vendor_id}/documents":{"post":{"tags":["Delivery Vendors"],"summary":"Upload Vendor Documents Route","operationId":"upload_vendor_documents_route_api_v1_vendors_admin__vendor_id__documents_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"vendor_id","in":"path","required":true,"schema":{"type":"string","title":"Vendor Id"}}],"requestBody":{"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_upload_vendor_documents_route_api_v1_vendors_admin__vendor_id__documents_post"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/me/documents":{"post":{"tags":["Delivery Vendors"],"summary":"Submit My Vendor Documents Route","operationId":"submit_my_vendor_documents_route_api_v1_vendors_me_documents_post","requestBody":{"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_submit_my_vendor_documents_route_api_v1_vendors_me_documents_post"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorDocumentSubmitResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/vendors/me/availability":{"patch":{"tags":["Delivery Vendors"],"summary":"Update My Availability Route","operationId":"update_my_availability_route_api_v1_vendors_me_availability_patch","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorAvailabilityUpdateRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorAvailabilityResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/vendors/marketplace":{"get":{"tags":["Delivery Vendors"],"summary":"Search Vendor Marketplace","operationId":"search_vendor_marketplace_api_v1_vendors_marketplace_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"region","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Region"}},{"name":"vehicle_type","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Vehicle Type"}},{"name":"q","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Q"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response Search Vendor Marketplace Api V1 Vendors Marketplace Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/marketplace/{vendor_id}":{"get":{"tags":["Delivery Vendors"],"summary":"Get Marketplace Vendor","operationId":"get_marketplace_vendor_api_v1_vendors_marketplace__vendor_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"vendor_id","in":"path","required":true,"schema":{"type":"string","title":"Vendor Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/{tenant_id}/marketplace/match":{"post":{"tags":["Delivery Vendors"],"summary":"Suggest Marketplace Matches","operationId":"suggest_marketplace_matches_api_v1_vendors__tenant_id__marketplace_match_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/VendorMatchRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/VendorMatchResult"},"title":"Response Suggest Marketplace Matches Api V1 Vendors  Tenant Id  Marketplace Match Post"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/{tenant_id}/dispatch/auto":{"post":{"tags":["Delivery Vendors"],"summary":"Auto Dispatch Route","operationId":"auto_dispatch_route_api_v1_vendors__tenant_id__dispatch_auto_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/AutoDispatchRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/AutoDispatchResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/{tenant_id}/bookings":{"post":{"tags":["Delivery Vendors"],"summary":"Create Booking Route","operationId":"create_booking_route_api_v1_vendors__tenant_id__bookings_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingCreateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Delivery Vendors"],"summary":"List Tenant Bookings","operationId":"list_tenant_bookings_api_v1_vendors__tenant_id__bookings_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response List Tenant Bookings Api V1 Vendors  Tenant Id  Bookings Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/me/bookings":{"get":{"tags":["Delivery Vendors"],"summary":"List My Bookings","operationId":"list_my_bookings_api_v1_vendors_me_bookings_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"status","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1,"title":"Page"}},{"name":"page_size","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Page Size"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"object","title":"Response List My Bookings Api V1 Vendors Me Bookings Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/{tenant_id}/bookings/{booking_id}":{"get":{"tags":["Delivery Vendors"],"summary":"Get Booking Route","operationId":"get_booking_route_api_v1_vendors__tenant_id__bookings__booking_id__get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"booking_id","in":"path","required":true,"schema":{"type":"string","title":"Booking Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"patch":{"tags":["Delivery Vendors"],"summary":"Update Booking Route","operationId":"update_booking_route_api_v1_vendors__tenant_id__bookings__booking_id__patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"booking_id","in":"path","required":true,"schema":{"type":"string","title":"Booking Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingUpdateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/me/bookings/{booking_id}/accept":{"post":{"tags":["Delivery Vendors"],"summary":"Accept My Booking Route","operationId":"accept_my_booking_route_api_v1_vendors_me_bookings__booking_id__accept_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"booking_id","in":"path","required":true,"schema":{"type":"string","title":"Booking Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingDecisionRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/vendors/me/bookings/{booking_id}/reject":{"post":{"tags":["Delivery Vendors"],"summary":"Reject My Booking Route","operationId":"reject_my_booking_route_api_v1_vendors_me_bookings__booking_id__reject_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"booking_id","in":"path","required":true,"schema":{"type":"string","title":"Booking Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingDecisionRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/BookingResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/users":{"get":{"tags":["User Directory"],"summary":"List Users","operationId":"list_users_api_v1_users_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/TenantUserResponse"},"title":"Response List Users Api V1 Users Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"post":{"tags":["User Directory"],"summary":"Create User","operationId":"create_user_api_v1_users_post","security":[{"OAuth2PasswordBearer":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserCreateRequest"}}}},"responses":{"201":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/users/{user_id}/status":{"patch":{"tags":["User Directory"],"summary":"Update User Status","operationId":"update_user_status_api_v1_users__user_id__status_patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"user_id","in":"path","required":true,"schema":{"type":"string","title":"User Id"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserStatusUpdateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/users/{user_id}/role":{"patch":{"tags":["User Directory"],"summary":"Update User Role","operationId":"update_user_role_api_v1_users__user_id__role_patch","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"user_id","in":"path","required":true,"schema":{"type":"string","title":"User Id"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserRoleUpdateRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/users/{user_id}":{"delete":{"tags":["User Directory"],"summary":"Delete User","operationId":"delete_user_api_v1_users__user_id__delete","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"user_id","in":"path","required":true,"schema":{"type":"string","title":"User Id"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"responses":{"204":{"description":"Successful Response"},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/users/audit":{"get":{"tags":["User Directory"],"summary":"List User Audit Events","operationId":"list_user_audit_events_api_v1_users_audit_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}},{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":200,"minimum":1,"default":50,"title":"Limit"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/TenantUserAuditResponse"},"title":"Response List User Audit Events Api V1 Users Audit Get"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/users/{user_id}/send-reset-link":{"post":{"tags":["User Directory"],"summary":"Send User Reset Link","operationId":"send_user_reset_link_api_v1_users__user_id__send_reset_link_post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"user_id","in":"path","required":true,"schema":{"type":"string","title":"User Id"}},{"name":"tenant_id","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/TenantUserResetResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/analytics/admin/summary":{"get":{"tags":["analytics"],"summary":"Admin Analytics Summary","description":"Return summary analytics for admin dashboard","operationId":"admin_analytics_summary_api_v1_analytics_admin_summary_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/kyc/submit-manual":{"post":{"tags":["KYC Verification"],"summary":"Submit Manual Kyc","operationId":"submit_manual_kyc_api_v1_kyc_submit_manual_post","requestBody":{"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_submit_manual_kyc_api_v1_kyc_submit_manual_post"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/kyc/upload-id":{"post":{"tags":["KYC Verification"],"summary":"Upload Id Document","operationId":"upload_id_document_api_v1_kyc_upload_id_post","requestBody":{"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_upload_id_document_api_v1_kyc_upload_id_post"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/kyc/liveness":{"post":{"tags":["KYC Verification"],"summary":"Upload Liveness Capture","operationId":"upload_liveness_capture_api_v1_kyc_liveness_post","requestBody":{"content":{"multipart/form-data":{"schema":{"$ref":"#/components/schemas/Body_upload_liveness_capture_api_v1_kyc_liveness_post"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/kyc/status":{"get":{"tags":["KYC Verification"],"summary":"Get Kyc Status","operationId":"get_kyc_status_api_v1_kyc_status_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"OAuth2PasswordBearer":[]}]}},"/api/v1/kyc/admin/list":{"get":{"tags":["KYC Verification"],"summary":"List Kyc Submissions","operationId":"list_kyc_submissions_api_v1_kyc_admin_list_get","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/kyc/admin/approve/{kyc_id}":{"post":{"tags":["KYC Verification"],"summary":"Approve Kyc Submission","operationId":"approve_kyc_submission_api_v1_kyc_admin_approve__kyc_id__post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"kyc_id","in":"path","required":true,"schema":{"type":"string","title":"Kyc Id"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/kyc/admin/revoke/{kyc_id}":{"post":{"tags":["KYC Verification"],"summary":"Revoke Kyc Submission","operationId":"revoke_kyc_submission_api_v1_kyc_admin_revoke__kyc_id__post","security":[{"OAuth2PasswordBearer":[]}],"parameters":[{"name":"kyc_id","in":"path","required":true,"schema":{"type":"string","title":"Kyc Id"}},{"name":"tenant_id","in":"query","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/health":{"get":{"summary":"Health","operationId":"health_health_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/marketplace/shipments":{"post":{"tags":["Delivery Marketplace"],"summary":"Post Shipment","operationId":"post_shipment_api_v1_marketplace_shipments_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShipmentPost"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/marketplace/drivers/search":{"post":{"tags":["Delivery Marketplace"],"summary":"Search Jobs","operationId":"search_jobs_api_v1_marketplace_drivers_search_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/DriverSearch"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/marketplace/shipments/{job_id}/accept":{"post":{"tags":["Delivery Marketplace"],"summary":"Accept Job","operationId":"accept_job_api_v1_marketplace_shipments__job_id__accept_post","parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/AcceptJob"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/marketplace/shipments/{job_id}/tracking/{status}":{"post":{"tags":["Delivery Marketplace"],"summary":"Update Tracking","operationId":"update_tracking_api_v1_marketplace_shipments__job_id__tracking__status__post","parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}},{"name":"status","in":"path","required":true,"schema":{"type":"string","title":"Status"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/marketplace/shipments/{job_id}/gps":{"post":{"tags":["Delivery Marketplace"],"summary":"Add Gps Ping","operationId":"add_gps_ping_api_v1_marketplace_shipments__job_id__gps_post","parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/GpsPingRequest"}}}},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"get":{"tags":["Delivery Marketplace"],"summary":"Get Gps History","operationId":"get_gps_history_api_v1_marketplace_shipments__job_id__gps_get","parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/admin/marketplace/jobs":{"get":{"tags":["Admin Marketplace"],"summary":"List Jobs","operationId":"list_jobs_api_v1_admin_marketplace_jobs_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/admin/marketplace/jobs/{job_id}/cancel":{"post":{"tags":["Admin Marketplace"],"summary":"Cancel Job","operationId":"cancel_job_api_v1_admin_marketplace_jobs__job_id__cancel_post","parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/admin/marketplace/jobs/{job_id}/reassign/{driver_id}":{"post":{"tags":["Admin Marketplace"],"summary":"Reassign Job","operationId":"reassign_job_api_v1_admin_marketplace_jobs__job_id__reassign__driver_id__post","parameters":[{"name":"job_id","in":"path","required":true,"schema":{"type":"string","title":"Job Id"}},{"name":"driver_id","in":"path","required":true,"schema":{"type":"string","title":"Driver Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/admin/subscriptions/demo/activate/{tenant_id}/{plan_code}":{"post":{"tags":["Admin Subscriptions"],"summary":"Activate Demo Subscription","operationId":"activate_demo_subscription_api_v1_admin_subscriptions_demo_activate__tenant_id___plan_code__post","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"plan_code","in":"path","required":true,"schema":{"type":"string","title":"Plan Code"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/admin/subscriptions/{tenant_id}/features/{feature_code}":{"get":{"tags":["Admin Subscriptions"],"summary":"Check Feature","operationId":"check_feature_api_v1_admin_subscriptions__tenant_id__features__feature_code__get","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"feature_code","in":"path","required":true,"schema":{"type":"string","title":"Feature Code"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/admin/credits/{tenant_id}":{"get":{"tags":["Admin Credits"],"summary":"Tenant Credits","operationId":"tenant_credits_api_v1_admin_credits__tenant_id__get","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/admin/credits/{tenant_id}/topup/{credits}":{"post":{"tags":["Admin Credits"],"summary":"Topup Credits","operationId":"topup_credits_api_v1_admin_credits__tenant_id__topup__credits__post","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}},{"name":"credits","in":"path","required":true,"schema":{"type":"integer","title":"Credits"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payment-hub/initialize":{"post":{"tags":["Payment Hub"],"summary":"Initialize Payment","operationId":"initialize_payment_api_v1_payment_hub_initialize_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/InitializePaymentRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payment-hub/verify/{reference}":{"get":{"tags":["Payment Hub"],"summary":"Verify Payment","operationId":"verify_payment_api_v1_payment_hub_verify__reference__get","parameters":[{"name":"reference","in":"path","required":true,"schema":{"type":"string","title":"Reference"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payment-hub/transactions/{tenant_id}":{"get":{"tags":["Payment Hub"],"summary":"List Transactions","operationId":"list_transactions_api_v1_payment_hub_transactions__tenant_id__get","parameters":[{"name":"tenant_id","in":"path","required":true,"schema":{"type":"string","title":"Tenant Id"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/api/v1/payment-hub/webhook/paystack":{"post":{"tags":["Payment Hub"],"summary":"Paystack Webhook","operationId":"paystack_webhook_api_v1_payment_hub_webhook_paystack_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}},"/api/v1/payment-hub/receipt/{reference}":{"get":{"tags":["Payment Hub"],"summary":"Payment Receipt","operationId":"payment_receipt_api_v1_payment_hub_receipt__reference__get","parameters":[{"name":"reference","in":"path","required":true,"schema":{"type":"string","title":"Reference"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}}},"components":{"schemas":{"AIChatRequest":{"properties":{"message":{"type":"string","minLength":1,"title":"Message"},"tenant_scope":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Scope"},"tenant_slug":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Slug"},"model":{"type":"string","title":"Model","default":"afruheritage-copilot:latest"},"page_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Page Url"},"context":{"type":"object","title":"Context"}},"type":"object","required":["message"],"title":"AIChatRequest"},"AIChatResponse":{"properties":{"answer":{"type":"string","title":"Answer"},"sources":{"items":{"type":"object"},"type":"array","title":"Sources"}},"type":"object","required":["answer","sources"],"title":"AIChatResponse"},"AIWidgetConfigResponse":{"properties":{"enabled":{"type":"boolean","title":"Enabled"},"tenant_slug":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Slug"},"model":{"type":"string","title":"Model","default":"afruheritage-copilot:latest"},"scope":{"type":"string","title":"Scope","default":"shared"},"welcome_message":{"type":"string","title":"Welcome Message","default":"Welcome to Afruheritage Assistant. How can I help you today?"},"theme":{"type":"string","title":"Theme","default":"light"},"primary_color":{"type":"string","title":"Primary Color","default":"#0ea5e9"},"api_endpoint":{"type":"string","title":"Api Endpoint","default":"/api/v1/ai/chat"}},"type":"object","required":["enabled"],"title":"AIWidgetConfigResponse"},"AcceptJob":{"properties":{"driver_id":{"type":"string","title":"Driver Id"}},"type":"object","required":["driver_id"],"title":"AcceptJob"},"ApprovalRequest":{"properties":{"verification_notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Verification Notes"}},"type":"object","title":"ApprovalRequest"},"AutoDispatchRequest":{"properties":{"shipment_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Shipment Id"},"pickup_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Pickup Address"},"delivery_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Delivery Address"},"pickup_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Pickup Latitude"},"pickup_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Pickup Longitude"},"vehicle_type_requested":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Vehicle Type Requested"},"region":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Region"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"},"candidate_limit":{"type":"integer","maximum":20.0,"minimum":1.0,"title":"Candidate Limit","default":5}},"type":"object","title":"AutoDispatchRequest"},"AutoDispatchResponse":{"properties":{"booking":{"$ref":"#/components/schemas/BookingResponse"},"selected_vendor":{"$ref":"#/components/schemas/VendorMatchResult"},"fallback_candidates":{"items":{"$ref":"#/components/schemas/VendorMatchResult"},"type":"array","title":"Fallback Candidates"}},"type":"object","required":["booking","selected_vendor","fallback_candidates"],"title":"AutoDispatchResponse"},"BillingAdminAdjustCreditsRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"credits_delta":{"type":"integer","title":"Credits Delta"},"memo":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Memo"}},"type":"object","required":["tenant_id","credits_delta"],"title":"BillingAdminAdjustCreditsRequest"},"BillingAdminAssignPlanRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"plan_code":{"type":"string","title":"Plan Code"},"currency":{"type":"string","title":"Currency","default":"GHS"}},"type":"object","required":["tenant_id","plan_code"],"title":"BillingAdminAssignPlanRequest"},"BillingAdminSetReadOnlyRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"reason":{"type":"string","title":"Reason"}},"type":"object","required":["tenant_id","reason"],"title":"BillingAdminSetReadOnlyRequest"},"Body_import_csv_route_api_v1_shipments__tenant_id__import_csv_post":{"properties":{"file":{"type":"string","format":"binary","title":"File"}},"type":"object","required":["file"],"title":"Body_import_csv_route_api_v1_shipments__tenant_id__import_csv_post"},"Body_submit_manual_kyc_api_v1_kyc_submit_manual_post":{"properties":{"id_type":{"type":"string","title":"Id Type"},"id_number":{"type":"string","title":"Id Number"},"full_name":{"type":"string","title":"Full Name"},"id_front":{"type":"string","format":"binary","title":"Id Front"},"id_back":{"type":"string","format":"binary","title":"Id Back"},"liveness_photo":{"type":"string","format":"binary","title":"Liveness Photo"},"liveness_video":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Liveness Video"}},"type":"object","required":["id_type","id_number","full_name","id_front","id_back","liveness_photo"],"title":"Body_submit_manual_kyc_api_v1_kyc_submit_manual_post"},"Body_submit_my_vendor_documents_route_api_v1_vendors_me_documents_post":{"properties":{"id_front":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Id Front"},"id_back":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Id Back"},"selfie_photo":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Selfie Photo"},"insurance_doc":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Insurance Doc"},"roadworthy_doc":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Roadworthy Doc"}},"type":"object","title":"Body_submit_my_vendor_documents_route_api_v1_vendors_me_documents_post"},"Body_upload_csv_and_notify_api_v1_whatsapp_csv_upload_post":{"properties":{"file":{"type":"string","format":"binary","title":"File"}},"type":"object","required":["file"],"title":"Body_upload_csv_and_notify_api_v1_whatsapp_csv_upload_post"},"Body_upload_id_document_api_v1_kyc_upload_id_post":{"properties":{"file":{"type":"string","format":"binary","title":"File"},"side":{"type":"string","title":"Side","default":"front"}},"type":"object","required":["file"],"title":"Body_upload_id_document_api_v1_kyc_upload_id_post"},"Body_upload_liveness_capture_api_v1_kyc_liveness_post":{"properties":{"photo":{"type":"string","format":"binary","title":"Photo"},"video":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Video"}},"type":"object","required":["photo"],"title":"Body_upload_liveness_capture_api_v1_kyc_liveness_post"},"Body_upload_vendor_documents_route_api_v1_vendors_admin__vendor_id__documents_post":{"properties":{"id_front":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Id Front"},"id_back":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Id Back"},"selfie_photo":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Selfie Photo"},"insurance_doc":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Insurance Doc"},"roadworthy_doc":{"anyOf":[{"type":"string","format":"binary"},{"type":"null"}],"title":"Roadworthy Doc"}},"type":"object","title":"Body_upload_vendor_documents_route_api_v1_vendors_admin__vendor_id__documents_post"},"BookingCreateRequest":{"properties":{"vendor_id":{"type":"string","title":"Vendor Id"},"shipment_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Shipment Id"},"pickup_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Pickup Address"},"delivery_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Delivery Address"},"vehicle_type_requested":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Vehicle Type Requested"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","required":["vendor_id"],"title":"BookingCreateRequest"},"BookingDecisionRequest":{"properties":{"note":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Note"}},"type":"object","title":"BookingDecisionRequest"},"BookingResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"vendor_id":{"type":"string","title":"Vendor Id"},"vendor_name":{"type":"string","title":"Vendor Name"},"shipment_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Shipment Id"},"status":{"type":"string","title":"Status"},"pickup_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Pickup Address"},"delivery_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Delivery Address"},"vehicle_type_requested":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Vehicle Type Requested"},"driver_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Driver Name"},"driver_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Driver Phone"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"},"last_location_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Last Location At"},"live_tracking_provider":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Tracking Provider"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"},"credit_cost":{"type":"integer","title":"Credit Cost"},"currency":{"type":"string","title":"Currency"},"tenant_rating":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Tenant Rating"},"tenant_review":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Review"},"booked_by":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Booked By"},"offered_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Offered At"},"offer_expires_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Offer Expires At"},"responded_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Responded At"},"accepted_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Accepted At"},"started_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Started At"},"completed_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Completed At"},"canceled_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Canceled At"},"created_at":{"type":"string","format":"date-time","title":"Created At"},"updated_at":{"type":"string","format":"date-time","title":"Updated At"}},"type":"object","required":["id","tenant_id","vendor_id","vendor_name","status","credit_cost","currency","created_at","updated_at"],"title":"BookingResponse"},"BookingUpdateRequest":{"properties":{"status":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"},"tenant_rating":{"anyOf":[{"type":"integer","maximum":5.0,"minimum":1.0},{"type":"null"}],"title":"Tenant Rating"},"tenant_review":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Review"},"driver_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Driver Name"},"driver_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Driver Phone"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"},"last_location_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Last Location At"},"live_tracking_provider":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Tracking Provider"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","title":"BookingUpdateRequest"},"BootstrapAdminRequest":{"properties":{"email":{"type":"string","format":"email","title":"Email"},"password":{"type":"string","minLength":12,"title":"Password"},"full_name":{"type":"string","maxLength":255,"minLength":2,"title":"Full Name"}},"type":"object","required":["email","password","full_name"],"title":"BootstrapAdminRequest"},"BrandingResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"company_name":{"type":"string","title":"Company Name"},"tagline":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tagline"},"logo_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Logo Url"},"favicon_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Favicon Url"},"primary_color":{"type":"string","title":"Primary Color"},"secondary_color":{"type":"string","title":"Secondary Color"},"accent_color":{"type":"string","title":"Accent Color"},"background_color":{"type":"string","title":"Background Color"},"legal_company_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Legal Company Name"},"legal_footer_text":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Legal Footer Text"},"terms_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Terms Url"},"privacy_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Privacy Url"},"support_email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Support Email"},"support_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Support Phone"},"support_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Support Url"},"notification_from_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notification From Name"},"notification_from_email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notification From Email"},"default_language":{"type":"string","title":"Default Language"},"supported_languages":{"type":"string","title":"Supported Languages"},"maps_enabled":{"type":"boolean","title":"Maps Enabled"},"public_tracking_enabled":{"type":"boolean","title":"Public Tracking Enabled"},"csv_import_enabled":{"type":"boolean","title":"Csv Import Enabled"},"group_members_enabled":{"type":"boolean","title":"Group Members Enabled"},"max_group_members":{"type":"integer","title":"Max Group Members"},"created_at":{"type":"string","format":"date-time","title":"Created At"},"updated_at":{"type":"string","format":"date-time","title":"Updated At"}},"type":"object","required":["id","tenant_id","company_name","primary_color","secondary_color","accent_color","background_color","default_language","supported_languages","maps_enabled","public_tracking_enabled","csv_import_enabled","group_members_enabled","max_group_members","created_at","updated_at"],"title":"BrandingResponse"},"BrandingUpdate":{"properties":{"company_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Company Name"},"tagline":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tagline"},"logo_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Logo Url"},"favicon_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Favicon Url"},"primary_color":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Primary Color"},"secondary_color":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Secondary Color"},"accent_color":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Accent Color"},"background_color":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Background Color"},"legal_company_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Legal Company Name"},"legal_footer_text":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Legal Footer Text"},"terms_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Terms Url"},"privacy_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Privacy Url"},"support_email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Support Email"},"support_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Support Phone"},"support_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Support Url"},"notification_from_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notification From Name"},"notification_from_email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notification From Email"},"email_signature_html":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email Signature Html"},"default_language":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Default Language"},"supported_languages":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Supported Languages"}},"type":"object","title":"BrandingUpdate"},"CRMAccountCreateRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"account_type":{"type":"string","title":"Account Type","default":"customer"},"company_name":{"type":"string","title":"Company Name"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"},"country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Country"},"city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"City"},"billing_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Billing Address"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","required":["tenant_id","company_name"],"title":"CRMAccountCreateRequest"},"CRMAccountResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"account_type":{"type":"string","title":"Account Type"},"company_name":{"type":"string","title":"Company Name"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"}},"type":"object","required":["id","tenant_id","account_type","company_name"],"title":"CRMAccountResponse"},"CRMContactCreateRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"account_id":{"type":"string","title":"Account Id"},"first_name":{"type":"string","title":"First Name"},"last_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Last Name"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"},"role_title":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Role Title"},"is_primary":{"type":"boolean","title":"Is Primary","default":false},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","required":["tenant_id","account_id","first_name"],"title":"CRMContactCreateRequest"},"CRMContactResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"account_id":{"type":"string","title":"Account Id"},"first_name":{"type":"string","title":"First Name"},"last_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Last Name"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"}},"type":"object","required":["id","tenant_id","account_id","first_name"],"title":"CRMContactResponse"},"CreditConsumeRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"usage_type":{"type":"string","pattern":"^(ai_usage|document_processing)$","title":"Usage Type"},"credits":{"type":"integer","exclusiveMinimum":0.0,"title":"Credits"},"memo":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Memo"}},"type":"object","required":["tenant_id","usage_type","credits"],"title":"CreditConsumeRequest"},"CreditPurchaseRequest":{"properties":{"amount":{"type":"number","exclusiveMinimum":0.0,"title":"Amount","description":"Amount to pay in GHS"},"payment_method":{"type":"string","title":"Payment Method","description":"Payment method"},"customer_email":{"type":"string","title":"Customer Email","description":"Customer email"},"customer_phone":{"type":"string","title":"Customer Phone","description":"Customer phone"},"mobile_provider":{"type":"string","title":"Mobile Provider","description":"Mobile money provider","default":"mtn"}},"type":"object","required":["amount","payment_method","customer_email","customer_phone"],"title":"CreditPurchaseRequest","description":"Request model for purchasing virtual credits"},"CreditPurchaseResponse":{"properties":{"purchase_id":{"type":"string","title":"Purchase Id"},"amount_paid":{"type":"number","title":"Amount Paid"},"credits_to_receive":{"type":"number","title":"Credits To Receive"},"payment_url":{"type":"string","title":"Payment Url"},"status":{"type":"string","title":"Status"}},"type":"object","required":["purchase_id","amount_paid","credits_to_receive","payment_url","status"],"title":"CreditPurchaseResponse","description":"Response model for credit purchase"},"DomainActivateRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"hostname":{"type":"string","title":"Hostname"}},"type":"object","required":["tenant_id","hostname"],"title":"DomainActivateRequest"},"DomainEventResponse":{"properties":{"id":{"type":"string","title":"Id"},"domain_id":{"type":"string","title":"Domain Id"},"event_type":{"type":"string","title":"Event Type"},"message":{"type":"string","title":"Message"},"payload_json":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Payload Json"}},"type":"object","required":["id","domain_id","event_type","message"],"title":"DomainEventResponse"},"DomainFailRequest":{"properties":{"reason":{"type":"string","title":"Reason"}},"type":"object","required":["reason"],"title":"DomainFailRequest"},"DomainRequestCreate":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"hostname":{"type":"string","maxLength":255,"minLength":3,"title":"Hostname"},"domain_type":{"type":"string","pattern":"^(customer_subdomain|apex|platform_subdomain)$","title":"Domain Type"},"created_by":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Created By"}},"type":"object","required":["tenant_id","hostname","domain_type"],"title":"DomainRequestCreate"},"DomainResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"hostname":{"type":"string","title":"Hostname"},"domain_type":{"type":"string","title":"Domain Type"},"status":{"type":"string","title":"Status"},"provider":{"type":"string","title":"Provider"},"verification_method":{"type":"string","title":"Verification Method"},"verification_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Verification Name"},"verification_value":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Verification Value"},"ssl_status":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Ssl Status"},"fallback_hostname":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Fallback Hostname"},"fallback_active":{"type":"boolean","title":"Fallback Active"},"last_error":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Last Error"}},"type":"object","required":["id","tenant_id","hostname","domain_type","status","provider","verification_method","fallback_active"],"title":"DomainResponse"},"DriverSearch":{"properties":{"driver_id":{"type":"string","title":"Driver Id"},"current_latitude":{"type":"number","title":"Current Latitude"},"current_longitude":{"type":"number","title":"Current Longitude"},"max_distance_km":{"type":"number","title":"Max Distance Km","default":100}},"type":"object","required":["driver_id","current_latitude","current_longitude"],"title":"DriverSearch"},"GpsPingRequest":{"properties":{"driver_id":{"type":"string","title":"Driver Id"},"latitude":{"type":"number","title":"Latitude"},"longitude":{"type":"number","title":"Longitude"},"speed_kmh":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Speed Kmh"},"heading_degrees":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Heading Degrees"}},"type":"object","required":["driver_id","latitude","longitude"],"title":"GpsPingRequest"},"GroupMemberCreate":{"properties":{"full_name":{"type":"string","maxLength":255,"minLength":1,"title":"Full Name"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"id_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Id Number"},"company":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Company"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"},"preferred_language":{"type":"string","title":"Preferred Language","default":"en"}},"type":"object","required":["full_name"],"title":"GroupMemberCreate"},"GroupMemberResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"full_name":{"type":"string","title":"Full Name"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"id_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Id Number"},"company":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Company"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"},"preferred_language":{"type":"string","title":"Preferred Language"},"is_active":{"type":"boolean","title":"Is Active"},"shipment_count":{"type":"integer","title":"Shipment Count","default":0},"created_at":{"type":"string","format":"date-time","title":"Created At"}},"type":"object","required":["id","tenant_id","full_name","preferred_language","is_active","created_at"],"title":"GroupMemberResponse"},"GroupMemberUpdate":{"properties":{"full_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Full Name"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"},"email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Email"},"id_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Id Number"},"company":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Company"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"},"preferred_language":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Preferred Language"},"is_active":{"anyOf":[{"type":"boolean"},{"type":"null"}],"title":"Is Active"}},"type":"object","title":"GroupMemberUpdate"},"HTTPValidationError":{"properties":{"detail":{"items":{"$ref":"#/components/schemas/ValidationError"},"type":"array","title":"Detail"}},"type":"object","title":"HTTPValidationError"},"InitializePaymentRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"email":{"type":"string","format":"email","title":"Email"},"amount":{"type":"number","title":"Amount"},"currency":{"type":"string","title":"Currency","default":"GHS"},"purpose":{"type":"string","title":"Purpose","default":"credit_topup"},"provider":{"type":"string","title":"Provider","default":"paystack"},"callback_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Callback Url"},"plan_code":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Plan Code"},"addons":{"items":{"type":"string"},"type":"array","title":"Addons","default":[]}},"type":"object","required":["tenant_id","email","amount"],"title":"InitializePaymentRequest"},"JobResponse":{"properties":{"id":{"type":"string","format":"uuid","title":"Id"},"tenant_id":{"type":"string","format":"uuid","title":"Tenant Id"},"status":{"type":"string","title":"Status"},"details":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Details"},"task_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Task Id"},"created_at":{"type":"string","format":"date-time","title":"Created At"},"updated_at":{"type":"string","format":"date-time","title":"Updated At"}},"type":"object","required":["id","tenant_id","status","details","task_id","created_at","updated_at"],"title":"JobResponse"},"LaunchRequest":{"properties":{"runner_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Runner Id"}},"type":"object","title":"LaunchRequest"},"Location":{"properties":{"label":{"type":"string","title":"Label"},"latitude":{"type":"number","title":"Latitude"},"longitude":{"type":"number","title":"Longitude"}},"type":"object","required":["label","latitude","longitude"],"title":"Location"},"LoginRequest":{"properties":{"email":{"anyOf":[{"type":"string","format":"email"},{"type":"null"}],"title":"Email"},"username":{"anyOf":[{"type":"string","format":"email"},{"type":"null"}],"title":"Username"},"password":{"type":"string","title":"Password"}},"type":"object","required":["password"],"title":"LoginRequest"},"OpportunityCreateRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"account_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Account Id"},"title":{"type":"string","title":"Title"},"stage":{"type":"string","title":"Stage","default":"new"},"currency":{"type":"string","title":"Currency","default":"GHS"},"estimated_value":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Estimated Value"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","required":["tenant_id","title"],"title":"OpportunityCreateRequest"},"OpportunityResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"title":{"type":"string","title":"Title"},"stage":{"type":"string","title":"Stage"},"currency":{"type":"string","title":"Currency"},"estimated_value":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Estimated Value"}},"type":"object","required":["id","tenant_id","title","stage","currency"],"title":"OpportunityResponse"},"PasswordResetConfirmRequest":{"properties":{"token":{"type":"string","maxLength":255,"minLength":16,"title":"Token"},"new_password":{"type":"string","minLength":8,"title":"New Password"}},"type":"object","required":["token","new_password"],"title":"PasswordResetConfirmRequest"},"PaymentInitRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"email":{"type":"string","title":"Email"},"currency":{"type":"string","maxLength":10,"minLength":3,"title":"Currency"},"amount_major":{"type":"number","exclusiveMinimum":0.0,"title":"Amount Major"},"purpose":{"type":"string","pattern":"^(subscription|credit_topup)$","title":"Purpose"},"plan_code":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Plan Code"},"credits_to_buy":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Credits To Buy"},"callback_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Callback Url"}},"type":"object","required":["tenant_id","email","currency","amount_major","purpose"],"title":"PaymentInitRequest"},"PaymentInitResponse":{"properties":{"reference":{"type":"string","title":"Reference"},"authorization_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Authorization Url"},"access_code":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Access Code"},"status":{"type":"string","title":"Status"}},"type":"object","required":["reference","status"],"title":"PaymentInitResponse"},"PaymentInitiateRequest":{"properties":{"amount":{"type":"number","exclusiveMinimum":0.0,"title":"Amount","description":"Payment amount in GHS"},"payment_method":{"type":"string","title":"Payment Method","description":"Payment method (mobile_money, etc.)"},"customer_email":{"type":"string","title":"Customer Email","description":"Customer email address"},"customer_phone":{"type":"string","title":"Customer Phone","description":"Customer phone number"},"customer_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Customer Name","description":"Customer name"},"mobile_provider":{"type":"string","title":"Mobile Provider","description":"Mobile money provider (mtn, airteltigo, vodafone)","default":"mtn"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description","description":"Payment description"},"metadata":{"anyOf":[{"type":"object"},{"type":"null"}],"title":"Metadata","description":"Additional metadata"}},"type":"object","required":["amount","payment_method","customer_email","customer_phone"],"title":"PaymentInitiateRequest","description":"Request model for initiating payment"},"PaymentInitiateResponse":{"properties":{"payment_id":{"type":"string","title":"Payment Id"},"payment_reference":{"type":"string","title":"Payment Reference"},"authorization_url":{"type":"string","title":"Authorization Url"},"amount":{"type":"number","title":"Amount"},"platform_fee":{"type":"number","title":"Platform Fee"},"tenant_amount":{"type":"number","title":"Tenant Amount"},"payment_method":{"type":"string","title":"Payment Method"},"status":{"type":"string","title":"Status"},"expires_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Expires At"},"mock":{"anyOf":[{"type":"boolean"},{"type":"null"}],"title":"Mock"}},"type":"object","required":["payment_id","payment_reference","authorization_url","amount","platform_fee","tenant_amount","payment_method","status"],"title":"PaymentInitiateResponse","description":"Response model for payment initiation"},"PaymentReinitRequest":{"properties":{"email":{"type":"string","title":"Email"},"callback_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Callback Url"}},"type":"object","required":["email"],"title":"PaymentReinitRequest"},"PaymentStatistics":{"properties":{"total_payments":{"type":"integer","title":"Total Payments"},"completed_payments":{"type":"integer","title":"Completed Payments"},"total_revenue":{"type":"number","title":"Total Revenue"},"total_platform_fees":{"type":"number","title":"Total Platform Fees"},"total_tenant_earnings":{"type":"number","title":"Total Tenant Earnings"},"success_rate":{"type":"number","title":"Success Rate"}},"type":"object","required":["total_payments","completed_payments","total_revenue","total_platform_fees","total_tenant_earnings","success_rate"],"title":"PaymentStatistics","description":"Payment statistics response"},"PaymentStatusResponse":{"properties":{"payment_id":{"type":"string","title":"Payment Id"},"payment_reference":{"type":"string","title":"Payment Reference"},"status":{"type":"string","title":"Status"},"amount":{"type":"number","title":"Amount"},"platform_fee":{"type":"number","title":"Platform Fee"},"tenant_amount":{"type":"number","title":"Tenant Amount"},"paid_amount":{"type":"number","title":"Paid Amount"},"created_at":{"type":"string","format":"date-time","title":"Created At"},"completed_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Completed At"},"failed_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Failed At"},"failure_reason":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Failure Reason"}},"type":"object","required":["payment_id","payment_reference","status","amount","platform_fee","tenant_amount","paid_amount","created_at"],"title":"PaymentStatusResponse","description":"Response model for payment status"},"PaymentVerifyResponse":{"properties":{"reference":{"type":"string","title":"Reference"},"status":{"type":"string","title":"Status"},"provider_status":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Provider Status"},"message":{"type":"string","title":"Message"}},"type":"object","required":["reference","status","message"],"title":"PaymentVerifyResponse"},"PlanResponse":{"properties":{"code":{"type":"string","title":"Code"},"name":{"type":"string","title":"Name"},"currency":{"type":"string","title":"Currency"},"price_amount":{"type":"number","title":"Price Amount"},"monthly_credit_allowance":{"type":"integer","title":"Monthly Credit Allowance"},"includes_custom_domain":{"type":"boolean","title":"Includes Custom Domain"},"includes_priority_support":{"type":"boolean","title":"Includes Priority Support"},"included_features":{"items":{"type":"string"},"type":"array","title":"Included Features","default":[]}},"type":"object","required":["code","name","currency","price_amount","monthly_credit_allowance","includes_custom_domain","includes_priority_support"],"title":"PlanResponse"},"PlanSelect":{"properties":{"signup_id":{"type":"string","title":"Signup Id"},"plan_code":{"type":"string","title":"Plan Code"},"addons":{"items":{"type":"string"},"type":"array","title":"Addons","default":[]},"payment_method":{"type":"string","title":"Payment Method","default":"paystack"},"callback_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Callback Url"}},"type":"object","required":["signup_id","plan_code"],"title":"PlanSelect"},"PublicTicketCreateRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"public_submitter_name":{"type":"string","title":"Public Submitter Name"},"public_submitter_email":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Public Submitter Email"},"subject":{"type":"string","title":"Subject"},"description":{"type":"string","title":"Description"},"category":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Category"},"priority":{"type":"string","title":"Priority","default":"medium"},"shipment_reference":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Shipment Reference"},"tracking_reference":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tracking Reference"},"account_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Account Id"},"contact_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Contact Id"}},"type":"object","required":["tenant_id","public_submitter_name","subject","description"],"title":"PublicTicketCreateRequest"},"QuoteCreateRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"account_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Account Id"},"opportunity_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Opportunity Id"},"quote_number":{"type":"string","title":"Quote Number"},"currency":{"type":"string","title":"Currency","default":"GHS"},"total_amount":{"type":"number","title":"Total Amount","default":0},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","required":["tenant_id","quote_number"],"title":"QuoteCreateRequest"},"QuoteResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"quote_number":{"type":"string","title":"Quote Number"},"status":{"type":"string","title":"Status"},"currency":{"type":"string","title":"Currency"},"total_amount":{"type":"number","title":"Total Amount"}},"type":"object","required":["id","tenant_id","quote_number","status","currency","total_amount"],"title":"QuoteResponse"},"RegisterRequest":{"properties":{"email":{"type":"string","format":"email","title":"Email"},"password":{"type":"string","minLength":8,"title":"Password"},"full_name":{"type":"string","maxLength":255,"minLength":2,"title":"Full Name"},"company_name":{"type":"string","maxLength":255,"minLength":2,"title":"Company Name"},"plan_code":{"anyOf":[{"type":"string","maxLength":64,"minLength":3},{"type":"null"}],"title":"Plan Code"}},"type":"object","required":["email","password","full_name","company_name"],"title":"RegisterRequest"},"RunnerCreate":{"properties":{"name":{"type":"string","maxLength":150,"minLength":3,"title":"Name"},"host":{"type":"string","maxLength":255,"minLength":3,"title":"Host"},"ssh_port":{"type":"integer","title":"Ssh Port","default":22},"ssh_user":{"type":"string","maxLength":120,"minLength":1,"title":"Ssh User"},"fleetbase_root":{"type":"string","maxLength":255,"minLength":3,"title":"Fleetbase Root"},"reserved_for_single_tenant":{"type":"boolean","title":"Reserved For Single Tenant","default":true}},"type":"object","required":["name","host","ssh_user","fleetbase_root"],"title":"RunnerCreate"},"RunnerCreateRequest":{"properties":{"name":{"type":"string","title":"Name"},"hostname":{"type":"string","title":"Hostname"},"ssh_port":{"type":"integer","title":"Ssh Port","default":22},"ssh_user":{"type":"string","title":"Ssh User","default":"afruheritage"},"root_runtime_path":{"type":"string","title":"Root Runtime Path","default":"/srv/afruheritage/tenants"},"max_tenants":{"type":"integer","title":"Max Tenants","default":50},"supports_reference_install":{"type":"boolean","title":"Supports Reference Install","default":true}},"type":"object","required":["name","hostname"],"title":"RunnerCreateRequest"},"RuntimeDeployRequest":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"tenant_slug":{"type":"string","maxLength":120,"minLength":2,"title":"Tenant Slug"},"runner_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Runner Id"},"is_reference_install":{"type":"boolean","title":"Is Reference Install","default":false}},"type":"object","required":["tenant_id","tenant_slug"],"title":"RuntimeDeployRequest"},"RuntimeEventResponse":{"properties":{"id":{"type":"string","title":"Id"},"runtime_id":{"type":"string","title":"Runtime Id"},"event_type":{"type":"string","title":"Event Type"},"message":{"type":"string","title":"Message"},"payload_json":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Payload Json"}},"type":"object","required":["id","runtime_id","event_type","message"],"title":"RuntimeEventResponse"},"RuntimeResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"tenant_slug":{"type":"string","title":"Tenant Slug"},"runner_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Runner Id"},"status":{"type":"string","title":"Status"},"install_directory":{"type":"string","title":"Install Directory"},"runtime_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Runtime Url"},"console_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Console Url"},"api_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Api Url"},"fleetbase_version":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Fleetbase Version"},"last_error":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Last Error"},"is_reference_install":{"type":"boolean","title":"Is Reference Install"}},"type":"object","required":["id","tenant_id","tenant_slug","status","install_directory","is_reference_install"],"title":"RuntimeResponse"},"RuntimeRetryRequest":{"properties":{"runtime_id":{"type":"string","title":"Runtime Id"}},"type":"object","required":["runtime_id"],"title":"RuntimeRetryRequest"},"RuntimeSuspendRequest":{"properties":{"runtime_id":{"type":"string","title":"Runtime Id"},"reason":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reason"}},"type":"object","required":["runtime_id"],"title":"RuntimeSuspendRequest"},"ShipmentCreate":{"properties":{"tracking_number":{"anyOf":[{"type":"string","maxLength":100,"minLength":1},{"type":"null"}],"title":"Tracking Number"},"reference_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reference Number"},"sender_name":{"type":"string","maxLength":255,"minLength":1,"title":"Sender Name"},"sender_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Sender Phone"},"sender_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Sender Address"},"receiver_name":{"type":"string","maxLength":255,"minLength":1,"title":"Receiver Name"},"receiver_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Receiver Phone"},"receiver_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Receiver Address"},"origin_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin Country"},"origin_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin City"},"destination_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination Country"},"destination_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination City"},"shipped_date":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Shipped Date"},"estimated_arrival":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Estimated Arrival"},"weight_kg":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Weight Kg"},"volume_cbm":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Volume Cbm"},"package_count":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Package Count"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description"},"cargo_type":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Cargo Type"},"total_cost":{"type":"number","title":"Total Cost","default":0},"amount_paid":{"type":"number","title":"Amount Paid","default":0},"currency":{"type":"string","title":"Currency","default":"GHS"},"group_member_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Group Member Id"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","required":["sender_name","receiver_name"],"title":"ShipmentCreate"},"ShipmentEventCreate":{"properties":{"event_type":{"type":"string","title":"Event Type"},"location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Location"},"latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Latitude"},"longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Longitude"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description"},"occurred_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Occurred At"}},"type":"object","required":["event_type"],"title":"ShipmentEventCreate"},"ShipmentEventResponse":{"properties":{"id":{"type":"string","title":"Id"},"event_type":{"type":"string","title":"Event Type"},"location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Location"},"latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Latitude"},"longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Longitude"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description"},"occurred_at":{"type":"string","format":"date-time","title":"Occurred At"},"created_at":{"type":"string","format":"date-time","title":"Created At"}},"type":"object","required":["id","event_type","occurred_at","created_at"],"title":"ShipmentEventResponse"},"ShipmentLocationUpdate":{"properties":{"latitude":{"type":"number","title":"Latitude"},"longitude":{"type":"number","title":"Longitude"},"location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Location"},"occurred_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Occurred At"},"provider":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Provider"},"event_type":{"type":"string","title":"Event Type","default":"location_update"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description"},"status":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"}},"type":"object","required":["latitude","longitude"],"title":"ShipmentLocationUpdate"},"ShipmentPost":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"customer_name":{"type":"string","title":"Customer Name"},"title":{"type":"string","title":"Title"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description"},"pickup":{"$ref":"#/components/schemas/Location"},"dropoff":{"$ref":"#/components/schemas/Location"},"weight_kg":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Weight Kg"},"length_cm":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Length Cm"},"width_cm":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Width Cm"},"height_cm":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Height Cm"},"package_count":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Package Count"},"package_value":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Package Value"},"image_urls":{"items":{"type":"string"},"type":"array","title":"Image Urls","default":[]},"fragile":{"type":"boolean","title":"Fragile","default":false},"refrigerated":{"type":"boolean","title":"Refrigerated","default":false},"special_handling_notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Special Handling Notes"}},"type":"object","required":["tenant_id","customer_name","title","pickup","dropoff"],"title":"ShipmentPost"},"ShipmentPublicTrackResponse":{"properties":{"tracking_number":{"type":"string","title":"Tracking Number"},"status":{"type":"string","title":"Status"},"sender_name":{"type":"string","title":"Sender Name"},"receiver_name":{"type":"string","title":"Receiver Name"},"origin_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin Country"},"origin_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin City"},"destination_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination Country"},"destination_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination City"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"},"last_location_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Last Location At"},"live_tracking_provider":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Tracking Provider"},"shipped_date":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Shipped Date"},"estimated_arrival":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Estimated Arrival"},"payment_status":{"type":"string","title":"Payment Status"},"total_cost":{"type":"number","title":"Total Cost"},"amount_paid":{"type":"number","title":"Amount Paid"},"balance_due":{"type":"number","title":"Balance Due"},"currency":{"type":"string","title":"Currency"},"events":{"items":{"$ref":"#/components/schemas/ShipmentEventResponse"},"type":"array","title":"Events","default":[]}},"type":"object","required":["tracking_number","status","sender_name","receiver_name","payment_status","total_cost","amount_paid","balance_due","currency"],"title":"ShipmentPublicTrackResponse"},"ShipmentResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"tracking_number":{"type":"string","title":"Tracking Number"},"reference_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reference Number"},"sender_name":{"type":"string","title":"Sender Name"},"sender_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Sender Phone"},"receiver_name":{"type":"string","title":"Receiver Name"},"receiver_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Receiver Phone"},"origin_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin Country"},"origin_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin City"},"destination_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination Country"},"destination_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination City"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"},"last_location_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Last Location At"},"live_tracking_provider":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Tracking Provider"},"shipped_date":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Shipped Date"},"estimated_arrival":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Estimated Arrival"},"actual_arrival":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Actual Arrival"},"weight_kg":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Weight Kg"},"package_count":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Package Count"},"cargo_type":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Cargo Type"},"total_cost":{"type":"number","title":"Total Cost"},"amount_paid":{"type":"number","title":"Amount Paid"},"balance_due":{"type":"number","title":"Balance Due"},"currency":{"type":"string","title":"Currency"},"payment_status":{"type":"string","title":"Payment Status"},"status":{"type":"string","title":"Status"},"group_member_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Group Member Id"},"group_member_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Group Member Name"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"},"created_at":{"type":"string","format":"date-time","title":"Created At"},"updated_at":{"type":"string","format":"date-time","title":"Updated At"}},"type":"object","required":["id","tenant_id","tracking_number","sender_name","receiver_name","total_cost","amount_paid","balance_due","currency","payment_status","status","created_at","updated_at"],"title":"ShipmentResponse"},"ShipmentUpdate":{"properties":{"tracking_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tracking Number"},"reference_number":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reference Number"},"sender_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Sender Name"},"sender_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Sender Phone"},"sender_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Sender Address"},"receiver_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Receiver Name"},"receiver_phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Receiver Phone"},"receiver_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Receiver Address"},"origin_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin Country"},"origin_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Origin City"},"destination_country":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination Country"},"destination_city":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Destination City"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"},"last_location_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Last Location At"},"live_tracking_provider":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Tracking Provider"},"shipped_date":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Shipped Date"},"estimated_arrival":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Estimated Arrival"},"actual_arrival":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Actual Arrival"},"weight_kg":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Weight Kg"},"volume_cbm":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Volume Cbm"},"package_count":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Package Count"},"description":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Description"},"cargo_type":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Cargo Type"},"total_cost":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Total Cost"},"amount_paid":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Amount Paid"},"currency":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Currency"},"payment_status":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Payment Status"},"status":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Status"},"group_member_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Group Member Id"},"notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Notes"}},"type":"object","title":"ShipmentUpdate"},"SignupStart":{"properties":{"email":{"type":"string","format":"email","title":"Email"},"phone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Phone"},"account_type":{"type":"string","title":"Account Type","default":"tenant_org"}},"type":"object","required":["email"],"title":"SignupStart"},"SubscriptionResponse":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"plan_code":{"type":"string","title":"Plan Code"},"status":{"type":"string","title":"Status"},"currency":{"type":"string","title":"Currency"},"started_at":{"type":"string","title":"Started At"},"current_period_end":{"type":"string","title":"Current Period End"},"trial_ends_at":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Trial Ends At"},"read_only_reason":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Read Only Reason"}},"type":"object","required":["tenant_id","plan_code","status","currency","started_at","current_period_end"],"title":"SubscriptionResponse"},"SupportTicketMessageResponse":{"properties":{"id":{"type":"string","title":"Id"},"ticket_id":{"type":"string","title":"Ticket Id"},"author_type":{"type":"string","title":"Author Type"},"author_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Author Name"},"body":{"type":"string","title":"Body"},"visible_to_public":{"type":"boolean","title":"Visible To Public"}},"type":"object","required":["id","ticket_id","author_type","body","visible_to_public"],"title":"SupportTicketMessageResponse"},"SupportTicketResponse":{"properties":{"id":{"type":"string","title":"Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"public_token":{"type":"string","title":"Public Token"},"subject":{"type":"string","title":"Subject"},"description":{"type":"string","title":"Description"},"category":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Category"},"priority":{"type":"string","title":"Priority"},"status":{"type":"string","title":"Status"},"shipment_reference":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Shipment Reference"},"tracking_reference":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tracking Reference"},"glpi_ticket_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Glpi Ticket Id"}},"type":"object","required":["id","tenant_id","public_token","subject","description","priority","status"],"title":"SupportTicketResponse"},"TenantCreate":{"properties":{"company_name":{"type":"string","maxLength":255,"minLength":2,"title":"Company Name"},"contact_email":{"type":"string","format":"email","title":"Contact Email"},"plan_code":{"type":"string","maxLength":80,"minLength":2,"title":"Plan Code"},"requested_domain":{"type":"string","maxLength":255,"minLength":3,"title":"Requested Domain"},"domain_type":{"type":"string","title":"Domain Type"},"verification_notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Verification Notes"}},"type":"object","required":["company_name","contact_email","plan_code","requested_domain","domain_type"],"title":"TenantCreate"},"TenantCreationRequest":{"properties":{"company_name":{"type":"string","maxLength":255,"minLength":2,"title":"Company Name","description":"Company name"},"contact_email":{"type":"string","format":"email","title":"Contact Email","description":"Contact email address"},"contact_name":{"type":"string","maxLength":255,"minLength":2,"title":"Contact Name","description":"Contact person name"},"business_type":{"type":"string","title":"Business Type","description":"Type of business (freight_forwarder, logistics_provider, etc.)"},"country":{"type":"string","maxLength":100,"minLength":2,"title":"Country","description":"Country of operation"},"city":{"type":"string","maxLength":100,"minLength":2,"title":"City","description":"City of operation"},"address":{"type":"string","maxLength":500,"minLength":10,"title":"Address","description":"Business address"},"phone":{"type":"string","maxLength":20,"minLength":10,"title":"Phone","description":"Phone number"},"website":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Website","description":"Company website"},"plan":{"type":"string","title":"Plan","description":"Subscription plan","default":"free_trial"}},"type":"object","required":["company_name","contact_email","contact_name","business_type","country","city","address","phone"],"title":"TenantCreationRequest","description":"Request model for creating a new tenant"},"TenantCreationResponse":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"subdomain":{"type":"string","title":"Subdomain"},"company_name":{"type":"string","title":"Company Name"},"portal_url":{"type":"string","title":"Portal Url"},"status":{"type":"string","title":"Status"},"message":{"type":"string","title":"Message"}},"type":"object","required":["tenant_id","subdomain","company_name","portal_url","status","message"],"title":"TenantCreationResponse","description":"Response model for tenant creation"},"TenantDomainSettingsResponse":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"platform_subdomain":{"type":"string","title":"Platform Subdomain"},"active_primary_hostname":{"type":"string","title":"Active Primary Hostname"},"fallback_hostname":{"type":"string","title":"Fallback Hostname"},"fallback_always_active":{"type":"boolean","title":"Fallback Always Active"}},"type":"object","required":["tenant_id","platform_subdomain","active_primary_hostname","fallback_hostname","fallback_always_active"],"title":"TenantDomainSettingsResponse"},"TenantRegistrationRequest":{"properties":{"companyName":{"type":"string","title":"Companyname"},"businessType":{"type":"string","title":"Businesstype"},"country":{"type":"string","title":"Country"},"city":{"type":"string","title":"City"},"address":{"type":"string","title":"Address"},"contactName":{"type":"string","title":"Contactname"},"contactEmail":{"type":"string","format":"email","title":"Contactemail"},"phone":{"type":"string","title":"Phone"},"website":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Website"},"message":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Message"},"volume":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Volume"},"services":{"anyOf":[{"items":{"type":"string"},"type":"array"},{"type":"null"}],"title":"Services"},"timeline":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Timeline"},"terms":{"type":"boolean","title":"Terms","default":false}},"type":"object","required":["companyName","businessType","country","city","address","contactName","contactEmail","phone"],"title":"TenantRegistrationRequest","description":"Tenant registration request model"},"TenantRequestReviewPayload":{"properties":{"status":{"type":"string","title":"Status"},"review_notes":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Review Notes"}},"type":"object","required":["status"],"title":"TenantRequestReviewPayload"},"TenantResponse":{"properties":{"id":{"type":"string","format":"uuid","title":"Id"},"company_name":{"type":"string","title":"Company Name"},"slug":{"type":"string","title":"Slug"},"contact_email":{"type":"string","format":"email","title":"Contact Email"},"plan_code":{"type":"string","title":"Plan Code"},"requested_domain":{"type":"string","title":"Requested Domain"},"domain_type":{"type":"string","title":"Domain Type"},"launch_status":{"type":"string","title":"Launch Status"},"live_console_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Console Url"},"live_api_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Api Url"},"fleetbase_install_path":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Fleetbase Install Path"},"created_at":{"type":"string","format":"date-time","title":"Created At"}},"type":"object","required":["id","company_name","slug","contact_email","plan_code","requested_domain","domain_type","launch_status","live_console_url","live_api_url","fleetbase_install_path","created_at"],"title":"TenantResponse"},"TenantRuntimeAuthUpdate":{"properties":{"live_api_token":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Live Api Token"},"live_api_auth_scheme":{"anyOf":[{"type":"string","maxLength":32,"minLength":3},{"type":"null"}],"title":"Live Api Auth Scheme","default":"bearer"},"clear_live_api_token":{"type":"boolean","title":"Clear Live Api Token","default":false}},"type":"object","title":"TenantRuntimeAuthUpdate"},"TenantUserAuditResponse":{"properties":{"id":{"type":"string","title":"Id"},"actor_email":{"type":"string","title":"Actor Email"},"event_type":{"type":"string","title":"Event Type"},"entity_type":{"type":"string","title":"Entity Type"},"entity_id":{"type":"string","title":"Entity Id"},"details_json":{"type":"string","title":"Details Json"},"created_at":{"type":"string","title":"Created At"}},"type":"object","required":["id","actor_email","event_type","entity_type","entity_id","details_json","created_at"],"title":"TenantUserAuditResponse"},"TenantUserCreateRequest":{"properties":{"email":{"type":"string","format":"email","title":"Email"},"full_name":{"type":"string","maxLength":255,"minLength":2,"title":"Full Name"},"password":{"anyOf":[{"type":"string","minLength":8},{"type":"null"}],"title":"Password"},"send_invite_email":{"type":"boolean","title":"Send Invite Email","default":false},"is_tenant_admin":{"type":"boolean","title":"Is Tenant Admin","default":false},"tenant_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}},"type":"object","required":["email","full_name"],"title":"TenantUserCreateRequest"},"TenantUserResetResponse":{"properties":{"status":{"type":"string","title":"Status"},"message":{"type":"string","title":"Message"}},"type":"object","required":["status","message"],"title":"TenantUserResetResponse"},"TenantUserResponse":{"properties":{"id":{"type":"string","title":"Id"},"email":{"type":"string","title":"Email"},"full_name":{"type":"string","title":"Full Name"},"tenant_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"},"is_tenant_admin":{"type":"boolean","title":"Is Tenant Admin"},"is_superuser":{"type":"boolean","title":"Is Superuser"},"is_active":{"type":"boolean","title":"Is Active"},"created_at":{"type":"string","title":"Created At"}},"type":"object","required":["id","email","full_name","is_tenant_admin","is_superuser","is_active","created_at"],"title":"TenantUserResponse"},"TenantUserRoleUpdateRequest":{"properties":{"is_tenant_admin":{"type":"boolean","title":"Is Tenant Admin"}},"type":"object","required":["is_tenant_admin"],"title":"TenantUserRoleUpdateRequest"},"TenantUserStatusUpdateRequest":{"properties":{"is_active":{"type":"boolean","title":"Is Active"}},"type":"object","required":["is_active"],"title":"TenantUserStatusUpdateRequest"},"TicketReplyRequest":{"properties":{"body":{"type":"string","minLength":1,"title":"Body"},"author_type":{"type":"string","title":"Author Type","default":"public"},"author_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Author Name"},"visible_to_public":{"type":"boolean","title":"Visible To Public","default":true}},"type":"object","required":["body"],"title":"TicketReplyRequest"},"TokenExchangeRequest":{"properties":{"code":{"type":"string","title":"Code"},"redirect_uri":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Redirect Uri"}},"type":"object","required":["code"],"title":"TokenExchangeRequest"},"TokenResponse":{"properties":{"access_token":{"type":"string","title":"Access Token"},"token_type":{"type":"string","title":"Token Type","default":"bearer"},"tenant_id":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Tenant Id"}},"type":"object","required":["access_token"],"title":"TokenResponse"},"TrackingPointIngestRequest":{"properties":{"latitude":{"type":"number","title":"Latitude"},"longitude":{"type":"number","title":"Longitude"},"captured_at":{"type":"string","format":"date-time","title":"Captured At"},"speed_kph":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Speed Kph"},"heading":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Heading"},"accuracy_m":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Accuracy M"},"source":{"type":"string","title":"Source","default":"driver_app"}},"type":"object","required":["latitude","longitude","captured_at"],"title":"TrackingPointIngestRequest"},"TrackingPointIngestResponse":{"properties":{"accepted":{"type":"boolean","title":"Accepted"},"reason":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reason"},"point":{"anyOf":[{"$ref":"#/components/schemas/TrackingPointResponse"},{"type":"null"}]}},"type":"object","required":["accepted"],"title":"TrackingPointIngestResponse"},"TrackingPointResponse":{"properties":{"id":{"type":"string","title":"Id"},"shipment_id":{"type":"string","title":"Shipment Id"},"tenant_id":{"type":"string","title":"Tenant Id"},"latitude":{"type":"number","title":"Latitude"},"longitude":{"type":"number","title":"Longitude"},"speed_kph":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Speed Kph"},"heading":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Heading"},"accuracy_m":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Accuracy M"},"source":{"type":"string","title":"Source"},"captured_at":{"type":"string","format":"date-time","title":"Captured At"},"received_at":{"type":"string","format":"date-time","title":"Received At"}},"type":"object","required":["id","shipment_id","tenant_id","latitude","longitude","source","captured_at","received_at"],"title":"TrackingPointResponse"},"UsageCreditCostResponse":{"properties":{"feature_key":{"type":"string","title":"Feature Key"},"credits":{"type":"integer","title":"Credits"}},"type":"object","required":["feature_key","credits"],"title":"UsageCreditCostResponse"},"ValidationError":{"properties":{"loc":{"items":{"anyOf":[{"type":"string"},{"type":"integer"}]},"type":"array","title":"Location"},"msg":{"type":"string","title":"Message"},"type":{"type":"string","title":"Error Type"}},"type":"object","required":["loc","msg","type"],"title":"ValidationError"},"VendorAvailabilityResponse":{"properties":{"vendor_id":{"type":"string","title":"Vendor Id"},"availability_status":{"type":"string","title":"Availability Status"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"},"availability_updated_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Availability Updated At"}},"type":"object","required":["vendor_id","availability_status"],"title":"VendorAvailabilityResponse"},"VendorAvailabilityUpdateRequest":{"properties":{"availability_status":{"type":"string","title":"Availability Status"},"current_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Current Location"},"current_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Latitude"},"current_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Current Longitude"}},"type":"object","required":["availability_status"],"title":"VendorAvailabilityUpdateRequest"},"VendorDocumentResponse":{"properties":{"id":{"type":"string","title":"Id"},"document_type":{"type":"string","title":"Document Type"},"file_url":{"type":"string","title":"File Url"},"created_at":{"type":"string","format":"date-time","title":"Created At"}},"type":"object","required":["id","document_type","file_url","created_at"],"title":"VendorDocumentResponse"},"VendorDocumentSubmitResponse":{"properties":{"vendor_id":{"type":"string","title":"Vendor Id"},"status":{"type":"string","title":"Status"},"uploaded_documents":{"items":{"$ref":"#/components/schemas/VendorDocumentResponse"},"type":"array","title":"Uploaded Documents"},"message":{"type":"string","title":"Message"}},"type":"object","required":["vendor_id","status","uploaded_documents","message"],"title":"VendorDocumentSubmitResponse"},"VendorMatchRequest":{"properties":{"pickup_address":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Pickup Address"},"pickup_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Pickup Latitude"},"pickup_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Pickup Longitude"},"vehicle_type":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Vehicle Type"},"region":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Region"},"limit":{"type":"integer","maximum":50.0,"minimum":1.0,"title":"Limit","default":10}},"type":"object","title":"VendorMatchRequest"},"VendorMatchResult":{"properties":{"vendor_id":{"type":"string","title":"Vendor Id"},"vendor_name":{"type":"string","title":"Vendor Name"},"business_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Business Name"},"vehicle_types":{"items":{"type":"string"},"type":"array","title":"Vehicle Types"},"average_rating":{"type":"number","title":"Average Rating"},"total_deliveries":{"type":"integer","title":"Total Deliveries"},"distance_km":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Distance Km"},"eta_hours":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Eta Hours"},"match_score":{"type":"number","title":"Match Score"}},"type":"object","required":["vendor_id","vendor_name","vehicle_types","average_rating","total_deliveries","match_score"],"title":"VendorMatchResult"},"VendorRegisterResponse":{"properties":{"id":{"type":"string","title":"Id"},"full_name":{"type":"string","title":"Full Name"},"email":{"type":"string","title":"Email"},"phone":{"type":"string","title":"Phone"},"status":{"type":"string","title":"Status"},"message":{"type":"string","title":"Message"}},"type":"object","required":["id","full_name","email","phone","status","message"],"title":"VendorRegisterResponse"},"VendorResponse":{"properties":{"id":{"type":"string","title":"Id"},"full_name":{"type":"string","title":"Full Name"},"email":{"type":"string","title":"Email"},"phone":{"type":"string","title":"Phone"},"id_type":{"type":"string","title":"Id Type"},"id_number":{"type":"string","title":"Id Number"},"business_name":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Business Name"},"business_type":{"type":"string","title":"Business Type"},"operating_regions":{"items":{"type":"string"},"type":"array","title":"Operating Regions"},"years_experience":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Years Experience"},"status":{"type":"string","title":"Status"},"availability_status":{"type":"string","title":"Availability Status","default":"offline"},"availability_updated_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Availability Updated At"},"last_known_location":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Last Known Location"},"last_known_latitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Last Known Latitude"},"last_known_longitude":{"anyOf":[{"type":"number"},{"type":"null"}],"title":"Last Known Longitude"},"last_seen_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Last Seen At"},"average_rating":{"type":"number","title":"Average Rating"},"total_deliveries":{"type":"integer","title":"Total Deliveries"},"vehicles":{"items":{"$ref":"#/components/schemas/VendorVehicleResponse"},"type":"array","title":"Vehicles"},"documents":{"items":{"$ref":"#/components/schemas/VendorDocumentResponse"},"type":"array","title":"Documents","default":[]},"terms_accepted":{"type":"boolean","title":"Terms Accepted"},"insurance_accepted":{"type":"boolean","title":"Insurance Accepted"},"background_check_accepted":{"type":"boolean","title":"Background Check Accepted"},"reviewed_by":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reviewed By"},"reviewed_at":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}],"title":"Reviewed At"},"rejection_reason":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Rejection Reason"},"created_at":{"type":"string","format":"date-time","title":"Created At"},"updated_at":{"type":"string","format":"date-time","title":"Updated At"}},"type":"object","required":["id","full_name","email","phone","id_type","id_number","business_type","operating_regions","status","average_rating","total_deliveries","vehicles","terms_accepted","insurance_accepted","background_check_accepted","created_at","updated_at"],"title":"VendorResponse"},"VendorReviewRequest":{"properties":{"action":{"type":"string","title":"Action"},"rejection_reason":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Rejection Reason"}},"type":"object","required":["action"],"title":"VendorReviewRequest"},"VendorVehicleResponse":{"properties":{"id":{"type":"string","title":"Id"},"vehicle_type":{"type":"string","title":"Vehicle Type"},"registration_number":{"type":"string","title":"Registration Number"},"make_model":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Make Model"},"year":{"anyOf":[{"type":"integer"},{"type":"null"}],"title":"Year"},"insurance_doc_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Insurance Doc Url"},"roadworthy_doc_url":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Roadworthy Doc Url"},"is_active":{"type":"boolean","title":"Is Active"}},"type":"object","required":["id","vehicle_type","registration_number","is_active"],"title":"VendorVehicleResponse"},"WalletResponse":{"properties":{"tenant_id":{"type":"string","title":"Tenant Id"},"currency":{"type":"string","title":"Currency"},"balance_credits":{"type":"integer","title":"Balance Credits"}},"type":"object","required":["tenant_id","currency","balance_credits"],"title":"WalletResponse"},"WalletTransactionResponse":{"properties":{"id":{"type":"string","title":"Id"},"transaction_type":{"type":"string","title":"Transaction Type"},"credits_delta":{"type":"integer","title":"Credits Delta"},"balance_after":{"type":"integer","title":"Balance After"},"reference":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Reference"},"memo":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Memo"},"created_at":{"type":"string","title":"Created At"}},"type":"object","required":["id","transaction_type","credits_delta","balance_after","created_at"],"title":"WalletTransactionResponse"},"app__schemas__fleetbase_runtime__RunnerResponse":{"properties":{"id":{"type":"string","title":"Id"},"name":{"type":"string","title":"Name"},"hostname":{"type":"string","title":"Hostname"},"ssh_port":{"type":"integer","title":"Ssh Port"},"ssh_user":{"type":"string","title":"Ssh User"},"root_runtime_path":{"type":"string","title":"Root Runtime Path"},"status":{"type":"string","title":"Status"},"max_tenants":{"type":"integer","title":"Max Tenants"},"current_tenants":{"type":"integer","title":"Current Tenants"},"supports_reference_install":{"type":"boolean","title":"Supports Reference Install"}},"type":"object","required":["id","name","hostname","ssh_port","ssh_user","root_runtime_path","status","max_tenants","current_tenants","supports_reference_install"],"title":"RunnerResponse"},"app__schemas__runner__RunnerResponse":{"properties":{"id":{"type":"string","format":"uuid","title":"Id"},"name":{"type":"string","title":"Name"},"host":{"type":"string","title":"Host"},"ssh_port":{"type":"integer","title":"Ssh Port"},"ssh_user":{"type":"string","title":"Ssh User"},"fleetbase_root":{"type":"string","title":"Fleetbase Root"},"is_active":{"type":"boolean","title":"Is Active"},"reserved_for_single_tenant":{"type":"boolean","title":"Reserved For Single Tenant"}},"type":"object","required":["id","name","host","ssh_port","ssh_user","fleetbase_root","is_active","reserved_for_single_tenant"],"title":"RunnerResponse"}},"securitySchemes":{"OAuth2PasswordBearer":{"type":"oauth2","flows":{"password":{"scopes":{},"tokenUrl":"/api/v1/auth/login"}}}}}}
./reports/uat_status_20260530_033025/backend_compile.txt:4:Listing 'app/api/routes'...
./reports/uat_status_20260530_033025/backend_compile.txt:5:Compiling 'app/api/routes/admin_credits.py'...
./reports/uat_status_20260530_033025/backend_compile.txt:6:Compiling 'app/api/routes/admin_marketplace.py'...
./reports/uat_status_20260530_033025/backend_compile.txt:7:Compiling 'app/api/routes/admin_subscriptions.py'...
./reports/uat_status_20260530_033025/backend_compile.txt:8:Compiling 'app/api/routes/commercial_orchestration.py'...
./reports/uat_status_20260530_033025/backend_compile.txt:9:Compiling 'app/api/routes/marketplace.py'...
./reports/uat_status_20260530_033025/backend_compile.txt:10:Compiling 'app/api/routes/payment_hub.py'...
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:1:app/api/routes/payment_hub.py.bak.1779863307:14:from app.models.payment_hub import PaymentTransaction
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:2:app/api/routes/payment_hub.py.bak.1779863307:64:        signup.payment_completed = True
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:3:app/api/routes/payment_hub.py.bak.1779863307:151:        tx = PaymentTransaction(
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:4:app/api/routes/payment_hub.py.bak.1779863307:193:        tx = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:5:app/api/routes/payment_hub.py.bak.1779863307:248:            db.query(PaymentTransaction)
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:6:app/api/routes/payment_hub.py.bak.1779863307:249:            .filter(PaymentTransaction.tenant_id == tenant_id)
./reports/uat_status_20260530_033025/backend_runtime_payment_signal.txt:7:app/api/routes/payment_hub.py.bak.1779863307:250:            .order_by(PaymentTransaction.created_at.desc())
