TODO: Document your project here
Here's a step-by-step roadmap to take this site from prototype to production-grade.

What's currently mock / not production-ready:
- Cart & checkout — lives in React useState. Refreshing the page wipes everything. No order is ever saved or sent anywhere.
- "Place Order" — just flips a step counter to a success screen. No order record, no email, no payment captured.
- Payment methods (Cash on Delivery, Vodafone Cash, Bank Transfer) — pure UI. No transaction is initiated or verified.
- Contact form (if present) — submits nowhere.
- Products — hardcoded array in Index.tsx. No admin can add/edit/remove.
- No authentication — no customer accounts, no admin panel, no order history.
- No inventory / stock tracking.
- No analytics, no SEO metadata beyond basics, no error tracking.
- No legal pages (Privacy, Terms, Refund policy) — required by payment providers.
- No domain, no email sender setup.

*Step-by-step plan*

Step 1 — Enable Lovable Cloud (backend)
One click. Gives you a Postgres database, auth, file storage, and edge functions. Everything below depends on this.

Step 2 — Move products to the database
Create a products table (id, name, price, description, badge, image_url, stock, active, created_at).
Upload the book images to Cloud storage instead of bundling them.
Replace the PRODUCTS array in Index.tsx with a query.
Benefit: edit prices/stock without redeploying.

Step 3 — Persist the cart
Two options:

Quick: localStorage so refresh keeps items (no login needed).
Proper: a carts table keyed by session or user ID. Required if you want abandoned-cart recovery.

Step 4 — Add real orders
Create orders and order_items tables with RLS (customers see only their own orders; admins see all).
On "Place Order", write the order server-side via an edge function (so price can't be tampered with from the browser — the function recomputes totals from DB prices).
Send a confirmation email to customer + notification to you (Resend integration).

Step 5 — Real payments
Pick one based on your market (Egypt, based on Vodafone Cash / EGP):

Stripe — cards, Apple/Google Pay. Built into Lovable, no account hassle. Recommended default.
Paymob / Fawry / Vodafone Cash gateway — needed if you truly want local Egyptian payment methods. Requires their merchant account + a custom edge function to call their API and handle their webhook.
Cash on Delivery can stay as-is (just mark order pending_cod), but you'll want a way to confirm/cancel from an admin view.
Replace the fake "payment" step with: create payment session → redirect/confirm → webhook updates order status to paid.

Step 6 — Authentication
Email/password + Google sign-in via Lovable Cloud auth.
Customer area: order history, addresses.
Separate user_roles table (never put role on profile) with an admin role.

Step 7 — Admin dashboard
A protected /admin route for you:

View/fulfill orders, change status (paid → shipped → delivered).
CRUD products, upload images, toggle stock.
Export orders to CSV.

Step 8 — Inventory & validation
Decrement stock when an order is paid (in the same edge function, transactionally).
Block checkout if stock = 0.
Validate every form input with Zod both client and server side.

Step 9 — Transactional email
Connect Resend (via Lovable Cloud secrets) for:
Order confirmation
Shipping update
Password reset
Contact form submissions

Step 10 — Legal & compliance pages
Add real routes for: Privacy Policy, Terms of Service, Refund/Return Policy, Shipping Policy. Stripe/Paymob will ask for these URLs during verification.

Step 11 — SEO & metadata
Per-page <title> and meta description (use react-helmet-async or update index.html per route).
Open Graph + Twitter card images.
sitemap.xml and robots.txt (you have a robots.txt already).
JSON-LD Product schema for each book → eligible for Google Shopping rich results.

Step 12 — Analytics & error tracking
Plausible or GA4 for traffic.
Sentry for runtime errors.
A single track() helper so events are consistent.

Step 13 — Performance pass
Convert images to WebP, add loading="lazy" and explicit width/height.
Preload hero image, defer non-critical fonts.
Run Lighthouse, aim for ≥90 on all four scores.

Step 14 — Security hardening
Run the Lovable security scan.
Confirm RLS on every table.
Rate-limit checkout and contact endpoints in the edge function.
Add a CAPTCHA (hCaptcha/Turnstile) on contact + signup if spam appears.

Step 15 — Publish & domain
Click Publish in Lovable.
Connect your custom domain in Project Settings → Domains.
Configure SPF/DKIM for your sending domain (Resend will guide you).
Switch payment provider from test → live mode.

Step 16 — Pre-launch checklist
Place a real test order end-to-end with a live card.
Trigger refund flow.
Verify confirmation emails land in inbox (not spam).
Test on iPhone Safari + Android Chrome.
Backup strategy: enable Cloud database backups.

Suggested order to actually build: Steps 1 → 2 → 4 → 6 → 7 → 5 → 9 → 10 → 11 → 15.
Steps 3, 8, 12, 13, 14, 16 fold in along the way.