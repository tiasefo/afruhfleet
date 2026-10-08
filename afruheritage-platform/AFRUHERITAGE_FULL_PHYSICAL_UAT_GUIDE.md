# Afruheritage — Full Physical UAT Guide

**Audience:** A normal prospective customer or business tester with no knowledge of the Afruheritage source code, Docker, FastAPI, Fleetbase, APIs, Git, servers, or the development environment.  
**Starting point:** [Afruheritage.com](https://afruheritage.com)  
**Assumptions:** You are using a modern web browser on the public internet. You have access to at least one real external mailbox for email verification.

---

## How to use this guide

1. Work through each numbered test in order.  
2. For each test, follow the click-by-click steps.  
3. Record your actual result in the spaces provided.  
4. Mark **PASS**, **FAIL** or **BLOCKED**.

**PASS** = the expected result happened exactly as described.  
**FAIL** = the expected result did not happen.  
**BLOCKED** = you could not reach the step because a required prerequisite was unavailable.

Record any screenshots in a separate folder and reference them in the "Screenshot reference" field.

---

## Roles covered in this guide

### A. Business Owner / Tenant Administrator
A person who registers a business and becomes the full administrator of that tenant. They can configure branding, invite team members, manage subscriptions, create customers, shipments and quotes, and access all business settings.

### B. Operations User
A team member who runs day-to-day logistics: shipments, drivers, vehicles, tracking, warehouse notices, vendor marketplace and customs calculations.

### C. Restricted Team Member
A user with a limited role. They can view permitted pages and perform permitted actions but cannot change business settings, billing, branding or team membership.

### D. Customer / Public User
An external person who does not have an Afruheritage account. They can use public pages such as tracking and support, and may register as a customer if the business allows it.

### E. Vendor
An independent delivery or haulage provider who applies through the vendor marketplace and is approved by the Business Owner or platform staff.

### F. Platform Super Administrator
This is an internal Afruheritage administrative role. It is **not** a customer self-registration role. It is documented separately in the last chapter only for reference.

---

## 01 — Access Afruheritage

1. Open your web browser.
2. Go to [https://afruheritage.com](https://afruheritage.com).
3. Wait for the homepage to load completely.

**EXPECTED RESULT:** The Afruheritage homepage loads and shows the public freight-forwarding platform.

**PASS IF:** You can see the Afruheritage branding, navigation and a clear Register/Sign In path.

**FAIL IF:** The page does not load, shows an error, or does not look like a public product homepage.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 02 — Create a Business Account

1. On [https://afruheritage.com](https://afruheritage.com), click the Register or Get Started link.
2. Enter your full name.
3. Enter the business email address you want to use.
4. Enter the business name.
5. Enter any other business information requested.
6. Create a password that meets the displayed requirements.
7. Read and accept any required terms if prompted.
8. Click Create Account or Register.
9. Wait for the registration to complete.

**EXPECTED RESULT:** The account is created and you are taken to an onboarding or workspace experience.

**PASS IF:** Registration completes without an error and you proceed past the form.

**FAIL IF:** An error appears, the form does not submit, or you are not taken forward.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 03 — Welcome Email

1. Open the external mailbox you used during registration.
2. Check the inbox.
3. Check the spam or junk folder if no email arrives within a few minutes.
4. Open the Afruheritage welcome email.
5. Verify the sender name shows Afruheritage and the message identifies your business.
6. Return to Afruheritage.

**EXPECTED RESULT:** A welcome email is received and contains your business name and a clear next step.

**PASS IF:** The welcome email is in the inbox and looks correct.

**FAIL IF:** No email is received within 10 minutes or the email has the wrong identity.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 04 — Login / Logout

1. Go to the Sign In link on the public site.
2. Enter the email address and password you just created.
3. Click Sign In.
4. Confirm you are inside your business workspace.
5. Click Sign Out or Logout.
6. Confirm you are returned to the public Sign In page.
7. Sign back in using the same credentials.

**EXPECTED RESULT:** You can log in, reach your business workspace, sign out and sign back in.

**PASS IF:** Login succeeds and data persists across sessions.

**FAIL IF:** Login fails after correct credentials, or you cannot sign out.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 05 — Forgot and Reset Password

1. While signed out, go to the Sign In page.
2. Click Forgot Password.
3. Enter the email address of the business account you created.
4. Submit the request.
5. Open your external mailbox.
6. Look for an Afruheritage password reset email.
7. Open the email. Do not reuse the reset link from the email for any other purpose.
8. Use the link to set a new password.
9. Sign in with the new password.

**EXPECTED RESULT:** A reset email is received and you can change the password and log in again.

**PASS IF:** The reset email arrives and the new password works.

**FAIL IF:** No reset email arrives, the link does not work or the new password is not accepted.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 06 — Business Onboarding

1. Sign in as the Business Owner.
2. Follow any onboarding prompts presented by Afruheritage.
3. Select the logistics business type if asked.
4. Confirm the business profile is created.

**EXPECTED RESULT:** Onboarding completes and the business workspace is ready.

**PASS IF:** You are taken to a dashboard or workspace for your business.

**FAIL IF:** Onboarding stops or asks for information the form cannot accept.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 07 — Trial / Subscription

1. From the Business Owner workspace, open Billing or Subscription.
2. Review the available plans.
3. Select the trial or subscription option appropriate for your business.
4. Confirm the subscription is activated.

**EXPECTED RESULT:** A subscription is created and the business is no longer read-only.

**PASS IF:** The subscription status shows as active or trialing and the workspace is enabled.

**FAIL IF:** The plan does not activate or the business remains in a locked state.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 08 — Tenant Workspace

1. Sign in as the Business Owner.
2. Observe the dashboard.
3. Confirm the URL is on your business subdomain, for example `https://your-business.afruheritage.com`.
4. Open the main navigation.
5. Confirm the core areas are visible: Dashboard, Shipments, Team, Customers, CRM, Warehouse, Customs, Billing, Settings.

**EXPECTED RESULT:** The workspace is clearly tied to your business and the navigation matches your role.

**PASS IF:** You can see the expected business-scoped menus.

**FAIL IF:** The workspace is empty, shows the wrong business or lacks the expected menus.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 09 — Business Profile and Settings

1. Sign in as the Business Owner.
2. Go to Settings or Business Profile.
3. Update the business contact information.
4. Save the changes.
5. Return to the dashboard.
6. Confirm the changes are reflected.

**EXPECTED RESULT:** Business settings can be viewed and updated.

**PASS IF:** Changes are saved and visible on the next load.

**FAIL IF:** Changes are not saved or produce an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 10 — Team Invitation

1. Sign in as the Business Owner.
2. Open Team or User Directory.
3. Click Invite Member or Add User.
4. Enter the email address of the person you want to invite.
5. Enter a name.
6. Select a role, for example Operations or a restricted role.
7. Send the invitation.

**EXPECTED RESULT:** An invitation is created and a confirmation appears.

**PASS IF:** The invitation is listed and a success message is shown.

**FAIL IF:** The invitation cannot be created or returns an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 11 — Invitation Acceptance

1. As the invited user, open your external mailbox.
2. Look for the Afruheritage team invitation email.
3. Open the email.
4. Use the invitation link or button.
5. Create a password if you are a new user.
6. Sign in.
7. Confirm you are inside the correct business.

**EXPECTED RESULT:** The invited user receives the email, accepts and joins the correct business.

**PASS IF:** The user can accept the invitation and reach the business workspace.

**FAIL IF:** The email is not received, the link does not work or the user joins the wrong business.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 12 — Roles and Restricted Access

1. Sign in as the Business Owner.
2. Open Team and confirm the invited user appears.
3. Sign out.
4. Sign in as the invited user with the restricted role.
5. Compare the navigation with the Business Owner's navigation.
6. Try to open Billing or Business Settings.

**EXPECTED RESULT:** The restricted user sees fewer menus and cannot perform administrative actions.

**PASS IF:** The restricted user is blocked from administrative pages.

**FAIL IF:** The restricted user can change billing, branding or team settings.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 13 — Templates

1. Sign in as the Business Owner.
2. Go to Storefront Templates or Templates.
3. Review the available templates.
4. Select a logistics-appropriate template, for example the freight template.
5. Apply the template.
6. Wait for the confirmation.

**EXPECTED RESULT:** A template can be selected and applied to the business storefront.

**PASS IF:** The template is applied and the business storefront reflects it.

**FAIL IF:** The template catalog is empty or application fails.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 14 — Branding

1. Sign in as the Business Owner.
2. Go to Branding or Business Identity.
3. Change the primary colour, secondary colour and business tagline.
4. Upload or enter a logo URL if available.
5. Save the changes.
6. Open the public storefront and confirm the changes are visible.

**EXPECTED RESULT:** Branding colours, name and tagline are reflected on the public storefront.

**PASS IF:** Branding changes are saved and visible publicly.

**FAIL IF:** Changes do not save or the storefront does not show them.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 15 — Plugins

1. Sign in as the Business Owner.
2. Go to Plugins or App Marketplace.
3. Review available plugins such as Tracking, Maps, Warehouse Notices, Vendor Marketplace, Customs Calculator.
4. Enable at least one plugin relevant to your business.
5. Confirm the plugin appears as enabled.

**EXPECTED RESULT:** Plugins can be enabled for the business.

**PASS IF:** The selected plugin is enabled and does not break the workspace.

**FAIL IF:** The plugin cannot be enabled or causes an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 16 — Storefront Configuration

1. Sign in as the Business Owner.
2. Go to Storefront.
3. Add or edit service products, for example Air Freight, Ocean Freight, Road Freight, Warehousing, Last-Mile Delivery, Customs Assistance.
4. Set prices and currencies.
5. Add product categories if available.
6. Save the storefront.

**EXPECTED RESULT:** Products and services are configured in the storefront.

**PASS IF:** Products are saved and listed in the storefront.

**FAIL IF:** Products do not save or pricing cannot be entered.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 17 — Publish Storefront

1. Sign in as the Business Owner.
2. Go to Storefront or Storefront Settings.
3. Click Publish or Make Public if required.
4. Copy the public storefront URL.

**EXPECTED RESULT:** The storefront has a public URL that can be shared.

**PASS IF:** A public URL is available.

**FAIL IF:** No public URL is shown or the publish action fails.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 18 — Anonymous Storefront Visit

1. Sign out of Afruheritage.
2. Open the public storefront URL from the previous test in a private or incognito browser window.
3. Confirm the storefront loads.
4. Confirm products and branding are visible without signing in.

**EXPECTED RESULT:** A customer can view the business storefront without an account.

**PASS IF:** The storefront loads and shows products without login.

**FAIL IF:** The page requires login or shows an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 19 — Customers / CRM

1. Sign in as the Business Owner.
2. Go to Customers or CRM.
3. Click Add Customer or Add Account.
4. Enter a customer company name, email, phone and address.
5. Save the customer.
6. Confirm the customer appears in the list.

**EXPECTED RESULT:** A customer account is created and listed.

**PASS IF:** The customer appears in the list with the correct details.

**FAIL IF:** The customer is not saved or the form returns an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 20 — CRM Contacts

1. Open the customer account created in the previous test.
2. Click Add Contact.
3. Enter the contact's first name, last name, email and phone.
4. Mark the contact as primary if available.
5. Save.
6. Confirm the contact is linked to the customer account.

**EXPECTED RESULT:** A contact is created and linked to the customer.

**PASS IF:** The contact appears under the customer.

**FAIL IF:** The contact is not linked or not saved.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 21 — CRM Opportunities

1. Open a customer account.
2. Click Add Opportunity.
3. Enter an opportunity title, estimated value and stage.
4. Save.
5. Confirm the opportunity appears in the customer's opportunity list.

**EXPECTED RESULT:** An opportunity is created and associated with the customer.

**PASS IF:** The opportunity is saved and visible.

**FAIL IF:** The opportunity is not saved or returns an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 22 — CRM Activities

1. Open a customer account or opportunity.
2. Look for the Activity or Notes section.
3. Add an activity or note, for example a phone call or follow-up.
4. Save.
5. Confirm the activity appears in the timeline.

**EXPECTED RESULT:** Activities can be recorded against a customer or opportunity.

**PASS IF:** The activity is visible in the history.

**FAIL IF:** No activity section exists or the activity is not saved.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 23 — CRM Quotes

1. Open an opportunity.
2. Click Create Quote.
3. Enter a quote number and total amount.
4. Save.
5. Confirm the quote appears under the opportunity or customer.

**EXPECTED RESULT:** A quote is generated for the opportunity.

**PASS IF:** The quote is saved and linked.

**FAIL IF:** The quote cannot be created or produces an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 24 — Create Shipment

1. Sign in as an Operations User or Business Owner.
2. Go to Shipments.
3. Click New Shipment or Create Shipment.
4. Enter the sender name, phone and address.
5. Enter the receiver name, phone and address.
6. Select the origin and destination countries and cities.
7. Enter weight, package count and cargo type.
8. Enter the total cost and currency.
9. Save the shipment.

**EXPECTED RESULT:** A shipment is created and a tracking number is generated.

**PASS IF:** The shipment appears in the list with a tracking number.

**FAIL IF:** The shipment cannot be created or tracking number is missing.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 25 — Shipment List

1. Sign in as an Operations User.
2. Go to Shipments.
3. Confirm the list displays shipments.
4. Use the search or filter fields if available.
5. Confirm the filters work.

**EXPECTED RESULT:** The shipment list loads and can be searched or filtered.

**PASS IF:** Shipments are listed and filters return correct results.

**FAIL IF:** The list is empty, slow or filters do not work.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 26 — Shipment Details

1. From the shipment list, open a shipment.
2. Review the details: sender, receiver, origin, destination, cargo, status, tracking number, cost, currency.
3. Confirm the information matches what was entered.

**EXPECTED RESULT:** Shipment details are complete and accurate.

**PASS IF:** All fields are visible and correct.

**FAIL IF:** Fields are missing or values are incorrect.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 27 — Shipment Status

1. Open a shipment.
2. Look for the status field or status transition buttons.
3. Transition the status from draft to booked, then to in transit.
4. Confirm the status updates in the list and detail pages.

**EXPECTED RESULT:** The shipment status changes through the logistics lifecycle.

**PASS IF:** Status transitions succeed and are persisted.

**FAIL IF:** The status does not change or transitions are not available.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 28 — Public Shipment Tracking

1. Open a shipment and copy its tracking number.
2. Sign out or open a private or incognito browser window.
3. Go to [https://afruheritage.com/track](https://afruheritage.com/track).
4. Enter the tracking number.
5. Submit.

**EXPECTED RESULT:** The public tracking page shows the shipment status, location and estimated delivery without requiring login or exposing private business data.

**PASS IF:** The shipment can be tracked publicly and the data is correct.

**FAIL IF:** The tracking page does not work, requires login or shows the wrong information.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 29 — Drivers

1. Sign in as an Operations User.
2. Go to Fleet or Drivers.
3. Click Add Driver.
4. Enter the driver's name, phone and email.
5. Save.
6. Confirm the driver appears in the list.

**EXPECTED RESULT:** A driver can be added and listed.

**PASS IF:** The driver is saved and visible.

**FAIL IF:** The driver cannot be created or the list is empty.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 30 — Vehicles

1. Sign in as an Operations User.
2. Go to Fleet or Vehicles.
3. Click Add Vehicle.
4. Enter the vehicle make, model, year, plate number and colour.
5. Save.
6. Confirm the vehicle appears in the list.

**EXPECTED RESULT:** A vehicle can be added and listed.

**PASS IF:** The vehicle is saved and visible.

**FAIL IF:** The vehicle cannot be created or the list is empty.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 31 — Driver / Vehicle Relationship

1. Open a vehicle.
2. Assign a driver to the vehicle if the option is available.
3. Save.
4. Confirm the vehicle shows the assigned driver.

**EXPECTED RESULT:** A driver can be linked to a vehicle.

**PASS IF:** The assignment is saved and visible.

**FAIL IF:** The assignment is not saved or not shown.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 32 — Fleet Operations

1. Open the Fleet or Vehicles section.
2. Review the list of vehicles and drivers.
3. Confirm the data persists after a page refresh.

**EXPECTED RESULT:** Fleet data is persistent and accessible to the Operations User.

**PASS IF:** Fleet data is present after refresh.

**FAIL IF:** Data disappears or is not accessible.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 33 — Live Tracking

1. Create or open an in-transit shipment.
2. Add a tracking event or location update if the interface allows.
3. Open the shipment detail.
4. Confirm the event appears in the timeline.
5. Check the map or location field if available.

**EXPECTED RESULT:** Tracking events can be recorded and viewed.

**PASS IF:** Tracking events are visible on the shipment.

**FAIL IF:** Tracking events cannot be added or do not show.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 34 — Vendors

1. Sign in as the Business Owner.
2. Go to Vendor Marketplace or Vendors.
3. Review the list of approved vendors.
4. Open a vendor to see details.

**EXPECTED RESULT:** Approved vendors are listed and viewable.

**PASS IF:** Vendors are visible with name, rating and vehicle types.

**FAIL IF:** The marketplace is empty or vendors cannot be opened.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 35 — Vendor Registration

1. Sign out or open a new browser window.
2. Go to the public Afruheritage site.
3. Find the Vendor Registration or Apply to Drive link.
4. Fill in personal, vehicle, business and agreement information.
5. Submit the application.
6. As the Business Owner, open Vendor Administration.
7. Review and approve the new vendor application.

**EXPECTED RESULT:** A vendor can register and be approved by the Business Owner.

**PASS IF:** The application is submitted and can be approved.

**FAIL IF:** The vendor form fails or the approval cannot be completed.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 36 — Marketplace

1. Sign in as the Business Owner.
2. Go to Vendor Marketplace.
3. Select a vendor.
4. Book a service if the option is available.
5. Confirm the booking is created.

**EXPECTED RESULT:** A vendor service can be booked through the marketplace.

**PASS IF:** The booking is created and visible.

**FAIL IF:** The booking cannot be created or produces an error.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 37 — Warehouse

1. Sign in as an Operations User.
2. Go to Warehouse or Warehouse Notices.
3. Add a warehouse notice, for example a receiving window or capacity notice.
4. Save.
5. Confirm the notice appears.

**EXPECTED RESULT:** Warehouse notices can be created and viewed.

**PASS IF:** The notice is saved and visible.

**FAIL IF:** The notice cannot be created or does not show.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 38 — Ghana Customs

1. Sign in as the Business Owner or Operations User.
2. Go to Customs Calculator.
3. Select Ghana.
4. Select Cargo or Goods.
5. Enter a CIF value, HS code, description and quantity.
6. Calculate.

**EXPECTED RESULT:** The calculator returns a breakdown of duty, VAT and levies with a total duty value.

**PASS IF:** A total duty value is shown for the inputs.

**FAIL IF:** The total is null, blank or the calculation errors.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 39 — Vehicle Duty

1. Go to Customs Calculator.
2. Select Ghana.
3. Select Vehicle.
4. Enter make, model, year, engine size, fuel type and value.
5. Calculate.

**EXPECTED RESULT:** Vehicle duty is calculated for the inputs.

**PASS IF:** A duty total is returned.

**FAIL IF:** The calculation fails or returns no value.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 40 — Cargo Duty

1. Go to Customs Calculator.
2. Select Ghana.
3. Select Cargo.
4. Enter value, currency, HS code and quantity.
5. Calculate.

**EXPECTED RESULT:** Cargo duty is calculated and itemised.

**PASS IF:** An itemised breakdown is shown.

**FAIL IF:** The calculator does not return a breakdown.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 41 — Kenya Customs where supported

1. Go to Customs Calculator.
2. Select Kenya.
3. Select Cargo or Vehicle.
4. Enter the required values.
5. Calculate.

**EXPECTED RESULT:** Kenya customs is calculated if the product supports it.

**PASS IF:** A result is returned.

**FAIL IF:** Kenya is not supported or the calculation fails.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 42 — KYC Document Upload

1. Sign in as the Business Owner.
2. Go to KYC or Verification.
3. Upload a government-issued ID document.
4. Upload a selfie or liveness photo if requested.
5. Submit.

**EXPECTED RESULT:** Documents are uploaded and the status changes to pending or submitted.

**PASS IF:** Files are accepted and a status is shown.

**FAIL IF:** Upload fails or no status is shown.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 43 — KYC Status

1. After uploading, open KYC Status.
2. Confirm the status is displayed.
3. If the status is approved, confirm you can continue.

**EXPECTED RESULT:** KYC status is visible and updates as expected.

**PASS IF:** The status is shown clearly.

**FAIL IF:** The status is missing or stuck at not started.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 44 — Support Ticket

1. Sign out or open a private browser window.
2. Go to the public Afruheritage support or contact page.
3. Fill in the support form with a subject and description.
4. Enter your name and email.
5. Submit the ticket.

**EXPECTED RESULT:** A support ticket is created and a public token or reference is given.

**PASS IF:** A ticket reference is shown.

**FAIL IF:** The form does not submit or no reference is given.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 45 — Customer Support Reply

1. As the Business Owner, open Support or Tickets.
2. Find the ticket created in the previous test.
3. Add an internal or public reply.
4. As the customer, use the public ticket link or reference.
5. Confirm the reply is visible.

**EXPECTED RESULT:** The customer can see the business's reply through the public ticket view.

**PASS IF:** The reply is visible to the customer.

**FAIL IF:** The customer cannot see the reply or the ticket is not accessible.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 46 — Billing

1. Sign in as the Business Owner.
2. Go to Billing.
3. Review the current subscription.
4. Confirm the plan, status and renewal information are visible.

**EXPECTED RESULT:** Billing information is accurate and visible.

**PASS IF:** Subscription, status and currency are shown.

**FAIL IF:** Billing information is missing or incorrect.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 47 — Wallet / Credits

1. Go to Billing or Wallet.
2. Confirm the wallet balance and credit transactions are visible.
3. Review the list of credit transactions.

**EXPECTED RESULT:** Wallet balance and transactions are displayed.

**PASS IF:** Balance and history are shown.

**FAIL IF:** The wallet is missing or transactions are not listed.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 48 — Payment

1. From Billing, select a plan or top-up.
2. Choose the payment provider if presented.
3. Initiate the payment.
4. Complete the payment in the provider's test or sandbox experience. Do not use real money unless explicitly approved by the PO.
5. Return to Afruheritage.

**EXPECTED RESULT:** Afruheritage receives the payment and updates the subscription or wallet.

**PASS IF:** The payment is recorded and the status changes to paid or active.

**FAIL IF:** The payment is not recorded or the user is not returned correctly.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 49 — Payment History

1. Go to Billing or Payments.
2. Open Payment History or Transactions.
3. Confirm the recent payment is listed.

**EXPECTED RESULT:** The payment appears in the transaction history.

**PASS IF:** The payment is listed with reference and status.

**FAIL IF:** The payment is missing from the history.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 50 — Receipt

1. Open the payment from the previous test.
2. Click View Receipt or Download Receipt.
3. Confirm the receipt shows the business, amount, currency, reference and date.

**EXPECTED RESULT:** A receipt can be viewed or downloaded.

**PASS IF:** The receipt contains the expected details.

**FAIL IF:** The receipt is missing or incorrect.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 51 — Analytics

1. Sign in as the Business Owner.
2. Go to Dashboard or Analytics.
3. Review the charts, numbers or summaries shown.
4. Confirm the data relates to the current business.

**EXPECTED RESULT:** Analytics are available and scoped to the business.

**PASS IF:** Analytics load with business-relevant data.

**FAIL IF:** Analytics are missing or show no data.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 52 — AI Assistant

1. Sign in as the Business Owner.
2. Open the AI Assistant or chat widget if available.
3. Type a simple logistics question, for example "How many shipments are in transit?" or "What is the status of my warehouse?"
4. Submit.

**EXPECTED RESULT:** The AI returns a helpful response based on the business data.

**PASS IF:** A relevant response is returned.

**FAIL IF:** The AI does not respond, returns an error or gives an unrelated answer.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 53 — Locations

1. Sign in as the Operations User.
2. Go to Locations or Addresses if available.
3. Add a location, for example a warehouse or depot.
4. Save and confirm it appears.

**EXPECTED RESULT:** Locations can be managed if the product includes this feature.

**PASS IF:** The location is saved and listed.

**FAIL IF:** The feature is missing or does not save.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 54 — Privacy / Terms / Legal

1. Open [https://afruheritage.com](https://afruheritage.com).
2. Look for Privacy, Terms or Legal links in the footer or menu.
3. Click each link.
4. Confirm the pages load.

**EXPECTED RESULT:** Privacy and terms pages are accessible from the public site.

**PASS IF:** Legal pages load and contain readable text.

**FAIL IF:** Links are missing or pages return errors.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 55 — Tenant Isolation

1. Create or use a second business, for example "SavannaRoute Freight", with a separate user account.
2. In Business A, create a shipment, customer and vehicle.
3. Sign out.
4. Sign in to Business B.
5. Open Shipments, Customers and Vehicles.
6. Confirm none of Business A's data is visible.
7. Try to access Business A's workspace by guessing a URL. Confirm it is not allowed.

**EXPECTED RESULT:** Business B cannot see any data belonging to Business A.

**PASS IF:** Business A's shipments, customers, drivers, vehicles, team and billing are not visible to Business B.

**FAIL IF:** Business B can see Business A's data.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 56 — Suspended / Unauthorized Access where applicable

1. If a suspension or read-only scenario is available in the product, confirm the business is informed.
2. Attempt an action that should be blocked, such as creating a shipment while suspended.
3. Confirm the product shows an appropriate message.

**EXPECTED RESULT:** Suspended or unauthorized access is handled with a clear message.

**PASS IF:** The user is informed they cannot perform the action.

**FAIL IF:** The action succeeds when it should be blocked.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## 57 — End-to-End Business Golden Journey

This test should be completed in one continuous browser session from an empty browser.

1. Open [https://afruheritage.com](https://afruheritage.com).
2. Click Register or Get Started.
3. Create a logistics business with a real external email.
4. Confirm the welcome email arrives.
5. Sign in.
6. Activate a trial or subscription.
7. Configure the business profile.
8. Choose a template.
9. Configure the storefront with at least one service product.
10. Publish or confirm the storefront.
11. Invite an employee from the Team page.
12. Confirm the employee receives the invitation email.
13. In a new browser window, accept the invitation and create an account.
14. Sign in as the employee.
15. Confirm the employee sees the business workspace with restricted access.
16. Sign back in as the Business Owner.
17. Create a customer in CRM.
18. Add a contact to the customer.
19. Create an opportunity and a quote.
20. Create a shipment.
21. Add a driver.
22. Add a vehicle.
23. Assign the driver to the vehicle if available.
24. Update the shipment to in transit.
25. Copy the tracking number.
26. Sign out or open a private window.
27. Go to [https://afruheritage.com/track](https://afruheritage.com/track).
28. Track the shipment.
29. Sign back in as the employee.
30. Add a warehouse notice.
31. Run a Ghana cargo customs calculation.
32. Create a public support ticket.
33. As the Business Owner, reply to the ticket.
34. As the public user, view the ticket reply.
35. Review Billing, Wallet and Payment History.
36. View Analytics.
37. Open the AI Assistant if configured.
38. Sign out and sign back in.
39. Confirm all data created during the journey is still present.

**EXPECTED RESULT:** A complete logistics business can be created, configured, staffed and operated from the public Afruheritage website, with data persistence and tenant isolation.

**PASS IF:** The entire journey can be completed without engineering intervention.

**FAIL IF:** Any critical step blocks the journey.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________

---

## Internal note — Platform Super Administrator

This role is for Afruheritage platform staff only. It is not a customer self-registration role. Do not include this in customer UAT unless the PO specifically requests internal administrative testing. The Platform Super Admin can manage tenants, run platform-level analytics and approve vendor or KYC submissions across the platform.

**ACTUAL RESULT:** ____________________________

**PASS / FAIL / BLOCKED:** ____________________________

**COMMENTS:** ____________________________
