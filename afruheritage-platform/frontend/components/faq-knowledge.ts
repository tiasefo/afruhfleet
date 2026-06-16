export interface FAQEntry {
  keywords: string[]
  answer: string
}

export const FAQ_KNOWLEDGE: FAQEntry[] = [
  // === GENERAL PLATFORM (1-15) ===
  { keywords: ['what is afruheritage','who is afruheritage','about afruheritage','platform','company','infotech'], answer: 'Afruheritage is a production-grade multi-tenant freight forwarding platform powered by Infotech Freight Forwarding. We connect African trade corridors — Ghana, Kenya, Somalia, Djibouti, Nigeria — with global shipping lanes, including China. Our platform handles customs duty estimation, shipment tracking, fleet management, vendor marketplace, and tenant provisioning.' },
  { keywords: ['multi tenant','multi-tenant','what does multi tenant mean'], answer: 'Multi-tenant means each freight forwarder or logistics company gets its own isolated instance of the platform under a single Afruheritage deployment. Each tenant has separate data, branding, users, shipments, and billing — but shares the same infrastructure.' },
  { keywords: ['african union','african heritage','africa','union heritage'], answer: 'Afruheritage is built for the African Union trade corridors. We focus on seamless logistics between African nations (Ghana, Kenya, Somalia, Djibouti, Nigeria) and global manufacturing hubs like China.' },
  { keywords: ['how to sign up','how to register','create account','get started','sign up'], answer: 'You can sign up by visiting the registration page. Superusers bootstrap the platform first via /auth/bootstrap. For tenant customers, sign up through your tenant domain or contact your freight forwarder directly.' },
  { keywords: ['login','sign in','log in','forgot password','reset password'], answer: 'Use the Sign In button on the top navigation. If you forgot your password, contact your tenant administrator or submit a support ticket. Password reset flows are managed at the tenant level.' },
  { keywords: ['dashboard','customer dashboard','admin dashboard'], answer: 'The Dashboard shows your active shipments, tracking status, recent activity, and quick actions. Superusers see the Admin Dashboard with tenant management, runner nodes, and billing controls. Regular users see the Customer Dashboard.' },
  { keywords: ['features','what can afruheritage do','capabilities'], answer: 'Afruheritage offers: shipment tracking, customs duty calculation for Ghana and Kenya, VIN decoding, fleet management via Fleetbase, vendor marketplace, multi-tenant provisioning, billing & wallet, public tracking, group members, CSV import, help chat, support ticketing, and custom domains.' },
  { keywords: ['pricing','plans','cost','subscription','how much'], answer: 'We offer trial, pro, and business subscription plans. Pricing is in Ghanaian Cedi (GHS) by default and tenant-configurable. Each plan includes different shipment volumes, fleet sizes, and feature sets. Visit the Pricing page for details.' },
  { keywords: ['trial','free trial','demo','try before buy'], answer: 'Yes, we offer a trial plan so you can explore the platform before committing. Contact your freight forwarder or submit a support ticket to request a trial tenant.' },
  { keywords: ['is afruheritage secure','security','data protection','privacy'], answer: 'Yes. Afruheritage uses JWT authentication, bcrypt password hashing, tenant isolation, immutable audit trails, and Cloudflare for domain security. GDPR compliance is built-in. Each tenant has separate runtime, database, storage, and secrets.' },
  { keywords: ['supported countries','which countries','locations','regions'], answer: 'We operate in Ghana, Kenya, Somalia, Djibouti, Nigeria, and China. Our platform supports trade routes between these countries and global destinations.' },
  { keywords: ['language','languages','chinese','english','bilingual','i18n'], answer: 'Afruheritage is bilingual from day one: English and Chinese (中文). The platform UI, public tracking, and support materials are available in both languages.' },
  { keywords: ['mobile app','app','ios','android','phone'], answer: 'Currently, Afruheritage is a responsive web application optimized for desktop and mobile browsers. A dedicated mobile app is on the roadmap.' },
  { keywords: ['api','integration','developer','webhook'], answer: 'Afruheritage exposes a REST API for integrations. All tenant-level features are API-accessible. Contact support for API documentation and webhook setup.' },
  { keywords: ['uptime','status','system status','is the system down'], answer: 'Our platform runs on Docker with health checks and auto-restart policies. For real-time status updates, submit a support ticket or contact your tenant administrator.' },

  // === SHIPMENTS & TRACKING (16-30) ===
  { keywords: ['track shipment','tracking','where is my shipment','track my cargo','track package'], answer: 'Use the Tracking page at /track. Enter your tracking number to see real-time shipment status. Public tracking works without login and supports Chinese language.' },
  { keywords: ['tracking number','where is my tracking number','how to track'], answer: 'Your tracking number is provided when a shipment is created. If you lost it, contact your freight forwarder or submit a support ticket with your shipment details.' },
  { keywords: ['shipment status','in transit','delivered','pending','delayed'], answer: 'Shipment statuses include: Pending, In Transit, At Port, Customs Clearance, Out for Delivery, Delivered, and Delayed. Check the Tracking page for your specific shipment status.' },
  { keywords: ['create shipment','new shipment','book shipment','how to ship'], answer: 'Shipments are created through the tenant dashboard. Log in to your tenant instance, navigate to Shipments, and click New Shipment. You can also import shipments via CSV bulk upload.' },
  { keywords: ['csv import','bulk upload','import shipments','excel'], answer: 'Yes, CSV import is supported for bulk shipment creation and updates. The system auto-resolves group member names from the CSV. Each tenant can import up to 1000+ shipments at once.' },
  { keywords: ['group members','what are group members','members'], answer: 'Group Members are contacts or recipients associated with your tenant — like customers, warehouses, or delivery points. Each tenant supports 1000+ group members with CSV import auto-resolution.' },
  { keywords: ['public tracking','no login tracking','guest tracking'], answer: 'Public tracking at /track requires no login. Anyone with a tracking number can check shipment status. The page works in Chinese for your Chinese customers.' },
  { keywords: ['route visualization','map','shipment route','gps'], answer: 'Shipment route visualization is powered by Fleetbase map engine. You can see your cargo route on an interactive map in the Fleet Console.' },
  { keywords: ['delay','shipment delayed','why is my shipment late'], answer: 'Delays can be caused by customs clearance, port congestion, weather, or documentation issues. Check the Tracking page for the latest status. For detailed help, submit a support ticket.' },
  { keywords: ['missing shipment','lost cargo','shipment not found'], answer: 'If your tracking number returns no results, double-check the number. If still missing, contact your freight forwarder immediately or submit a support ticket with all details.' },
  { keywords: ['weight limit','size limit','cargo limits','restrictions'], answer: 'Cargo limits depend on your tenant plan and the carrier. Standard limits apply per shipment. Contact your freight forwarder for oversized or hazardous cargo.' },
  { keywords: ['hazardous cargo','dangerous goods','dg','chemicals'], answer: 'Hazardous cargo requires special handling and documentation. Contact your freight forwarder before booking. Not all carriers accept DG.' },
  { keywords: ['insurance','cargo insurance','shipment insurance'], answer: 'Cargo insurance can be arranged through your freight forwarder. Ask about coverage options when creating a shipment or submit a support ticket.' },
  { keywords: ['pickup','collection','door to door','door-to-door'], answer: 'Pickup options vary by location and carrier. Most shipments can be arranged door-to-door through the tenant dashboard or by contacting your freight forwarder.' },
  { keywords: ['delivery time','how long','transit time','shipping time'], answer: 'Transit times vary by route, carrier, and customs. Typical West Africa routes take 2-4 weeks, East Africa 1-3 weeks. Check with your freight forwarder for exact estimates.' },

  // === CUSTOMS DUTY (31-45) ===
  { keywords: ['customs duty','duty calculator','calculate duty','import duty'], answer: 'Use the Customs Duty Calculator at /customs/duty-calculator. We support Ghana (ICUMS-style) and Kenya (KRA CRSP-style) vehicle and cargo duty estimation with VIN decoding.' },
  { keywords: ['ghana customs','ghana duty','icums','tema port'], answer: 'Ghana customs duty uses ICUMS-style valuation logic with fallback rules. Enter your vehicle VIN or cargo CIF value to get an estimated duty breakdown including import duty, VAT, NHIL, and levies.' },
  { keywords: ['kenya customs','kenya duty','kra','crsp','mombasa'], answer: 'Kenya customs duty uses KRA CRSP (Current Retail Selling Price) lookups. We match your vehicle against the official CRSP database and calculate import duty, VAT, IDF, and railway levy.' },
  { keywords: ['vin decode','vin decoder','vehicle identification'], answer: 'Enter a VIN in the duty calculator and click Decode VIN. We use public NHTSA vPIC data to identify make, model, year, engine size, and fuel type. Premium VIN providers can be connected for full history.' },
  { keywords: ['vehicle duty','car duty','auto duty','motor vehicle'], answer: 'Vehicle duty depends on make, model, year, engine CC, and country. Use the calculator with your VIN for the most accurate estimate. Manual entry is also supported.' },
  { keywords: ['cargo duty','goods duty','general goods','hs code'], answer: 'Cargo duty requires CIF value, HS code, quantity, and weight. Enter these in the duty calculator to get a breakdown of import duty, VAT, and other charges.' },
  { keywords: ['cif value','what is cif','cost insurance freight'], answer: 'CIF (Cost, Insurance, Freight) is the total value of your goods including shipping and insurance costs. This is the base value used for customs duty calculation.' },
  { keywords: ['hs code','harmonized code','tariff code'], answer: 'HS (Harmonized System) codes classify goods for customs. If you do not know your HS code, contact your freight forwarder or submit a support ticket with your cargo description.' },
  { keywords: ['vat','value added tax','tax','levy'], answer: 'VAT is applied to the CIF value plus import duty. Ghana applies 12.5% VAT plus levies. Kenya applies 16% VAT plus IDF and railway development levy. Exact rates are shown in the calculator.' },
  { keywords: ['import declaration fee','idf','kenya idf'], answer: 'Kenya charges an Import Declaration Fee (IDF) at 3.5% of CIF. This is automatically included in the Kenya duty calculator breakdown.' },
  { keywords: ['railway levy','railway development levy'], answer: 'Kenya applies a 2% Railway Development Levy on CIF value. This is included in the Kenya duty calculator results.' },
  { keywords: ['nhil','health insurance levy','ghana levy'], answer: 'Ghana applies NHIL (National Health Insurance Levy) and other levies as part of the customs tax base. These are factored into the Ghana duty estimate.' },
  { keywords: ['overage penalty','vehicle age','old car penalty','year penalty'], answer: 'Ghana applies overage penalties for vehicles older than 10 years based on engine size. The duty calculator automatically includes this when applicable.' },
  { keywords: ['official vs estimate','estimate accuracy','is the duty accurate'], answer: 'Our calculator provides estimates using official rules and public data. For official payable duty, validation through ICUMS/GRA (Ghana) or KRA iCMS (Kenya) is required. The estimate is typically within 5-10% of actual duty.' },
  { keywords: ['nigeria customs','nigeria duty','lagos customs'], answer: 'Nigeria customs operations are supported through our Lagos and Apapa port network. For Nigeria duty estimates, contact your freight forwarder or submit a support ticket.' },

  // === FLEETBASE & FLEET (46-55) ===
  { keywords: ['fleetbase','fleet management','fleet console','fleet'], answer: 'Fleetbase is the engine under the hood of Afruheritage. The Fleet Console lets you manage vehicles, drivers, fleets, routes, live maps, and extensions. Access it from /fleetbase/console.' },
  { keywords: ['vehicles','manage vehicles','add vehicle','vehicle list'], answer: 'Manage your fleet vehicles in the Fleet Console. You can add, edit, and track vehicles by type, capacity, and status.' },
  { keywords: ['drivers','driver management','add driver','driver list'], answer: 'Manage drivers in the Fleet Console. Assign drivers to vehicles, track assignments, and monitor performance.' },
  { keywords: ['live map','map','fleet map','gps tracking'], answer: 'The Live Map in the Fleet Console shows real-time vehicle positions and route visualization. Requires the maps feature flag to be enabled for your tenant.' },
  { keywords: ['extensions','fleetbase extensions','plugins'], answer: 'Fleetbase Extensions add functionality like route optimization, fuel monitoring, and maintenance scheduling. Enable them from the Extensions page in the Fleet Console.' },
  { keywords: ['console gate','fleetbase console gate'], answer: 'The Console Gate is the entry point to the Fleetbase runtime. Superusers can launch and manage tenant Fleetbase instances from the admin panel.' },
  { keywords: ['fleet owner','become fleet owner','register fleet'], answer: 'Fleet owners can register as delivery vendors through the Vendor Registration page. Once approved, your fleet becomes available in the tenant marketplace.' },
  { keywords: ['maps enabled','map feature','why no map'], answer: 'Maps are enabled per tenant via the Tenant Branding feature flags. If maps are disabled, contact your tenant administrator or submit a support ticket.' },
  { keywords: ['route','route optimization','best route'], answer: 'Route optimization is available through Fleetbase extensions. Contact your tenant administrator to enable the route optimization extension.' },
  { keywords: ['maintenance','vehicle maintenance','service schedule'], answer: 'Vehicle maintenance tracking is available through Fleetbase extensions. Set service schedules and receive alerts for upcoming maintenance.' },

  // === VENDORS & MARKETPLACE (56-65) ===
  { keywords: ['vendor','vendors','marketplace','delivery vendor'], answer: 'The Vendor Marketplace lets tenants find and book approved delivery vendors. Vendors register publicly, undergo admin review, and then appear in the marketplace. Visit /vendors for more.' },
  { keywords: ['become a vendor','register as vendor','vendor registration'], answer: 'Register as a vendor at /vendors or through the Vendor Registration form. You will go through a 4-step process: business details, vehicle info, service areas, and document upload.' },
  { keywords: ['vendor status','approved vendor','pending vendor','rejected'], answer: 'Vendor statuses are: pending, under_review, approved, rejected, or suspended. Only approved vendors appear in the tenant marketplace. Admin review is required.' },
  { keywords: ['vendor vehicle','vehicle types','bike','truck','car'], answer: 'Vendors can register trucks, cars, motorbikes, or bicycles. Vehicle details are reviewed during the admin approval process.' },
  { keywords: ['vendor booking','book a vendor','hire driver','delivery service'], answer: 'Tenants can book approved vendors through the marketplace. Booking statuses: requested, accepted, in_progress, completed, canceled, disputed.' },
  { keywords: ['vendor payment','how do vendors get paid','vendor earnings'], answer: 'Vendors are paid through the tenant wallet system. Earnings are credited as VENDOR_EARNING_CREDIT and jobs are debited as VENDOR_JOB_DEBIT. Billing is managed per tenant.' },
  { keywords: ['vendor marketplace search','find vendor','search vendors'], answer: 'Tenants can search the marketplace for approved vendors by location, vehicle type, and service area. Auth is required to access the marketplace.' },
  { keywords: ['individual vendor','registered business','fleet vendor'], answer: 'Vendor business types are: individual, registered, or fleet. Each type has different documentation requirements during registration.' },
  { keywords: ['cancel vendor booking','dispute','vendor complaint'], answer: 'Bookings can be canceled or disputed through the tenant dashboard. For disputes, submit a support ticket with the booking ID and details.' },
  { keywords: ['vendor admin','review vendor','approve vendor'], answer: 'Vendor admin review is available to superusers only at /vendors/admin. Admin can approve, reject, or suspend vendors.' },

  // === BILLING & PAYMENTS (66-75) ===
  { keywords: ['billing','payment','pay','invoice','wallet'], answer: 'Billing uses Paystack for payments. Funds go to your tenant wallet, then usage is debited automatically. Plans include trial, pro, and business tiers. Currency is GHS by default.' },
  { keywords: ['wallet','credit','tenant wallet','balance'], answer: 'Each tenant has a wallet credited via Paystack payments. Usage (shipments, vendor bookings, etc.) is debited from the wallet. When the wallet is exhausted, the tenant goes into read-only mode.' },
  { keywords: ['paystack','how to pay','payment method'], answer: 'Payments are processed via Paystack. You can pay with mobile money, card, or bank transfer depending on your region. Visit the Billing page to top up your wallet.' },
  { keywords: ['subscription','plan','upgrade','downgrade'], answer: 'Subscriptions are managed in the Billing section. Upgrade to unlock more shipments, fleet sizes, and features. Downgrade is available at the end of your billing cycle.' },
  { keywords: ['read only','wallet empty','account suspended'], answer: 'When your wallet balance reaches zero, your tenant goes into read-only mode. You can still view data but cannot create new shipments or bookings. Top up your wallet to restore full access.' },
  { keywords: ['refund','money back','cancel payment'], answer: 'Refund policies vary by plan and circumstance. Contact your freight forwarder or submit a support ticket for refund requests.' },
  { keywords: ['receipt','payment receipt','invoice download'], answer: 'Payment receipts are available in the Billing section of your tenant dashboard. Download invoices for accounting purposes.' },
  { keywords: ['currency','ghs','usd','exchange rate'], answer: 'Default currency is Ghanaian Cedi (GHS). Currency is tenant-configurable. Exchange rates are updated periodically for international transactions.' },
  { keywords: ['ghana cedi','cedi','ghs currency'], answer: 'The platform uses Ghanaian Cedi (GHS) as the default currency for billing, wallet, and payments. This can be configured per tenant if needed.' },
  { keywords: ['auto debit','automatic billing','recurring payment'], answer: 'Wallet debits happen automatically as you use services. Recurring subscription payments can be set up via Paystack for automatic renewal.' },

  // === TENANT & ONBOARDING (76-85) ===
  { keywords: ['tenant','what is a tenant','my tenant','tenant id'], answer: 'A tenant is your isolated instance of Afruheritage. When you sign up as a freight forwarder, you get your own tenant with separate data, branding, users, and billing.' },
  { keywords: ['onboarding','launch tenant','new tenant','setup'], answer: 'Tenant onboarding: Create → Approve → Launch (Celery job queues) → Provision (SSH to runner) → Active. Superusers approve and launch tenants from the admin panel.' },
  { keywords: ['custom domain','my own domain','white label','branding'], answer: 'Tenants can use custom domains via Cloudflare integration. We verify domains via TXT, CNAME, or HTTP methods and track SSL status. Contact your tenant admin or submit a support ticket.' },
  { keywords: ['tenant branding','logo','colors','customize'], answer: 'Tenant Branding lets you set your logo, colors, and feature flags (maps, tracking, CSV import, group members). Feature flags control which tools are visible to your users.' },
  { keywords: ['runner node','what is a runner','provisioning','server'], answer: 'Runner nodes are dedicated servers where tenant Fleetbase instances are deployed. When a tenant is launched, we SSH to a runner and run flb install-fleetbase to provision the instance.' },
  { keywords: ['ssh','deployment','install fleetbase','provision'], answer: 'Tenant provisioning uses SSH + Paramiko to install Fleetbase on a runner node. This is handled automatically by the Celery background worker when a tenant is approved and launched.' },
  { keywords: ['superuser','admin','administrator','super admin'], answer: 'Superusers have full platform access: tenant approval, runner management, billing oversight, vendor review, and system configuration. Login as a superuser to access the Admin Dashboard.' },
  { keywords: ['approve tenant','tenant approval','how to approve'], answer: 'Superusers approve tenants from the Admin Dashboard. After approval, click Launch to queue the provisioning job. The tenant becomes active once provisioning completes.' },
  { keywords: ['tenant users','add user','invite user','team members'], answer: 'Tenant administrators can add users to their tenant. Each user gets login credentials and role-based access. Manage users from the tenant settings.' },
  { keywords: ['domain verification','txt record','cname','ssl'], answer: 'Custom domain verification uses TXT records, CNAME records, or HTTP file verification. SSL certificates are tracked automatically. Check domain status in the admin panel.' },

  // === SUPPORT & TICKETS (86-95) ===
  { keywords: ['support','help','support ticket','create ticket','contact support'], answer: 'Submit a support ticket at /support. Categories include Shipment Issue, Tracking Problem, Billing & Payment, Customs Clearance, and Technical Support. You will receive a tracking token to check status.' },
  { keywords: ['ticket status','track ticket','check ticket','where is my ticket'], answer: 'Use the Track Ticket section on the Support page with your public token. You can also check ticket status via email updates when our team responds.' },
  { keywords: ['glpi','help desk','ticketing system'], answer: 'Support tickets sync with GLPI for advanced help desk management. GLPI handles ticket assignment, escalation, and resolution tracking.' },
  { keywords: ['technical support','bug','error','issue'], answer: 'For technical issues, submit a ticket with the Technical Support category. Include error messages, screenshots, and steps to reproduce the problem.' },
  { keywords: ['billing support','payment issue','charge','wrong charge'], answer: 'For billing issues, submit a ticket with the Billing & Payment category. Include transaction details, amounts, and dates.' },
  { keywords: ['customs support','customs issue','clearance problem'], answer: 'For customs clearance issues, submit a ticket with the Customs Clearance category. Include shipment reference, HS code, and port details.' },
  { keywords: ['tracking support','tracking not working','track issue'], answer: 'For tracking problems, submit a ticket with the Tracking Problem category. Include your tracking number and expected delivery date.' },
  { keywords: ['shipment support','cargo damage','missing item'], answer: 'For shipment issues, submit a ticket with the Shipment Issue category. Include tracking number, description, and photos if applicable.' },
  { keywords: ['response time','how long support','when will you reply'], answer: 'Response times depend on priority: Urgent (4 hours), High (24 hours), Medium (48 hours), Low (72 hours). You will receive email updates.' },
  { keywords: ['phone support','call','whatsapp','email'], answer: 'Primary support is through the ticket system at /support. For urgent matters, submit a high-priority ticket and our team will reach out via your preferred contact method.' },

  // === CRM & DOCUMENTS (96-100) ===
  { keywords: ['crm','contacts','accounts','opportunities','quotes'], answer: 'The CRM module manages accounts, contacts, opportunities, and quotes. Access it from /crm. CRM data syncs with the support ticketing system for seamless customer management.' },
  { keywords: ['documents','document management','bills of lading','bl','invoice'], answer: 'Document management is available through the tenant dashboard. Upload, store, and share bills of lading, invoices, packing lists, and customs documents.' },
  { keywords: ['quote','freight quote','shipping quote','request quote'], answer: 'Request a freight quote through the tenant dashboard or by contacting your freight forwarder. Quotes are stored in the CRM for follow-up and conversion.' },
  { keywords: ['audit trail','audit log','activity log'], answer: 'Afruheritage maintains an immutable audit trail for all significant events: tenant changes, billing transactions, shipment updates, and user actions. Superusers can review audit logs in the admin panel.' },
  { keywords: ['chatbot','assistant','this chat','help assistant'], answer: 'This is the Afruheritage Help Assistant — a standalone FAQ-based chatbot powered by our platform knowledge base. It does not use external AI services. If it cannot answer your question, it will redirect you to create a support ticket.' },
]

export const SUPPORT_REDIRECT_MESSAGE =
  "I'm not sure I have the answer to that. Would you like to create a support ticket so our team can assist you directly?"

export const WELCOME_MESSAGE =
  "Hello! I'm the Afruheritage Help Assistant. I can answer questions about our platform, logistics services, customs duty, tracking, billing, and more. How can I help you today?"

export function findBestFAQ(query: string): { entry: FAQEntry; score: number } | null {
  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 2)
  let best: { entry: FAQEntry; score: number } | null = null

  for (const entry of FAQ_KNOWLEDGE) {
    let score = 0
    for (const keyword of entry.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      if (normalizedQuery.includes(normalizedKeyword)) {
        score += 10
      } else {
        const keywordWords = normalizedKeyword.split(/\s+/).filter((w) => w.length > 2)
        for (const qw of queryWords) {
          for (const kw of keywordWords) {
            if (qw === kw || kw.includes(qw) || qw.includes(kw)) {
              score += 2
            }
          }
        }
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }

  return best
}
