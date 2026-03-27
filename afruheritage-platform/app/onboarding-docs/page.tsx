"use client";
import React from "react";
import Link from "next/link";

const steps = [
  {
    title: "1. Tenant Creation",
    description: `Register a new tenant using the onboarding form. Required fields: company name, contact email, business type, country, city, address, phone, and plan. After submission, the system provisions a dedicated runtime and sends a welcome email.`,
    image: "/docs/onboarding/step1-tenant-creation.png"
  },
  {
    title: "2. Launch Site",
    description: `Once approved, the tenant's site is launched with a unique subdomain (e.g., tenant.afruheritage.com). Infrastructure (Fleetbase, DB, SSL) is provisioned automatically. Status can be checked in the admin dashboard.`,
    image: "/docs/onboarding/step2-launch-site.png"
  },
  {
    title: "3. Branding & Customization",
    description: `Upload your logo, set brand colors, and customize the UI from the branding section. Preview changes instantly. All branding is tenant-specific. You can also configure navigation, landing page, and custom CSS.`,
    image: "/docs/onboarding/step3-branding.png"
  },
  {
    title: "4. User Roles & Permissions",
    description: `Invite users and assign roles (admin, manager, staff, etc.). Set granular permissions for each role to control access to features and data.`,
    image: "/docs/onboarding/step4-user-roles.png"
  },
  {
    title: "5. Custom Domain Setup",
    description: `Request a custom domain in the domain settings. Follow DNS instructions and verify the domain. Once verified, your portal is accessible at your custom domain.`,
    image: "/docs/onboarding/step4-custom-domain.png"
  },
  {
    title: "6. Advanced Integrations",
    description: `Enable Fleetbase for logistics, Paystack for payments, and GLPI for support ticketing. Each tenant inherits GLPI integration for support. See the Integrations tab for setup instructions.`,
    image: "/docs/onboarding/step5-integrations.png"
  },
  {
    title: "7. Analytics & Audit Logs",
    description: `Access real-time analytics dashboards for orders, shipments, and user activity. Review audit logs for all critical actions and changes.`,
    image: "/docs/onboarding/step7-analytics.png"
  },
  {
    title: "8. Notifications & API Keys",
    description: `Configure email/SMS notifications for key events. Generate and manage API keys for external integrations.`,
    image: "/docs/onboarding/step8-notifications.png"
  },
  {
    title: "9. Smoke Testing",
    description: `Run backend and frontend smoke tests to validate all flows. Use the provided scripts or the admin dashboard to trigger tests. Ensure all endpoints and integrations are working.`,
    image: "/docs/onboarding/step6-smoke-test.png"
  },
  {
    title: "10. Support & GLPI",
    description: `Each tenant has a dedicated GLPI support space. Submit tickets from the portal. All support requests are routed to the central helpdesk and tracked per tenant.`,
    image: "/docs/onboarding/step7-support-glpi.png"
  },
  {
    title: "11. Uploading Screenshots",
    description: `To keep this documentation up to date, you can upload new screenshots for each step by dragging and dropping image files into the /public/docs/onboarding/ folder. The images will be displayed automatically in the relevant step.`,
    image: "/docs/onboarding/step-upload.png"
  }
];

export default function OnboardingDocsPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6 text-primary">Afruheritage Tenant Onboarding & Customization Guide</h1>
      <nav className="mb-8 flex flex-wrap gap-2">
        {steps.map((step, idx) => (
          <a
            key={idx}
            href={`#step${idx + 1}`}
            className="bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded px-3 py-1 transition-colors"
          >
            {step.title}
          </a>
        ))}
      </nav>
      <section className="space-y-8">
        {steps.map((step, idx) => (
          <div
            key={idx}
            id={`step${idx + 1}`}
            className="rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6"
          >
            <h2 className="text-2xl font-semibold text-primary mb-2">{step.title}</h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-200 mb-4">{step.description}</p>
            {step.image && (
              <img
                src={step.image}
                alt={step.title + " screenshot"}
                className="w-full max-w-xl mx-auto rounded border border-neutral-200 dark:border-neutral-800 shadow mb-4"
                style={{objectFit: 'cover', minHeight: 180, background: '#f3f4f6'}}
              />
            )}
            <div className="flex gap-2 mt-2">
              <span className="inline-block bg-primary text-white rounded-full px-3 py-1 text-xs font-bold">Step {idx + 1}</span>
            </div>
          </div>
        ))}
      </section>
      <div className="mt-12 text-center">
        <Link href="/support" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-primary/90 transition-colors">Need Help? Visit Support</Link>
      </div>
    </main>
  );
}
