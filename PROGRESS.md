# Implementation Progress

This document tracks the step-by-step transformation of the prototype into a production-ready MVP using Supabase as the backend.

---

## Completed Steps

### Step 1 — Supabase Backend Setup
- **Dependency added**: `@supabase/supabase-js` and `react-helmet-async`
- **Client created**: `src/lib/supabase.ts` with typed `Database` interface
- **Environment variables**: `.env.example` created with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Action required**: Create a Supabase project, copy the SQL from `supabase_schema.sql` into the SQL Editor, and add your real URL/key to `.env`.

### Step 2 — Products in Database
- **Schema**: `products` table with `id`, `name`, `price`, `description`, `badge`, `badge_tone`, `image_url`, `stock`, `active`, `created_at`
- **Seed data**: 3 initial products included in the SQL file
- **Frontend hook**: `src/hooks/useProducts.ts` fetches active products via React Query
- **Index.tsx**: Hardcoded `PRODUCTS` array removed; store now loads dynamically from Supabase with loading and error states

### Step 3 — Persist the Cart
- **Hook created**: `src/hooks/useCart.ts`
- **Persistence**: Cart state syncs to `localStorage` (key: `ranya_cart`) on every change
- **Features**: `addToCart`, `removeItem`, `clearCart`, computed `total` and `count`

### Step 4 — Real Orders
- **Tables created**: `orders` and `order_items` with full RLS policies
- **Server-side function**: `place_order` Postgres RPC (`SECURITY DEFINER`) that:
  - Validates user authentication
  - Verifies each product exists, is active, and has sufficient stock
  - Recomputes the total from DB prices (prevents client-side tampering)
  - Inserts the order and order items in a transaction
  - Decrements stock atomically
  - Returns `{ order_id, total }`
- **Checkout integration**: Index.tsx calls `supabase.rpc("place_order", ...)` on "Place Order"
- **UX**: Shows loading state, order ID on success, and error messages from the server (e.g. "Insufficient stock")

### Step 6 — Authentication
- **Auth provider**: Supabase Auth (email/password ready; Google OAuth can be enabled in Supabase dashboard)
- **Pages created**:
  - `/login` — `src/pages/Login.tsx`
  - `/signup` — `src/pages/Signup.tsx`
  - `/account` — `src/pages/Account.tsx` (protected, shows profile + order history)
- **Role system**: `user_roles` table with `customer` and `admin` roles
- **Hook**: `src/hooks/useAuth.ts` listens to auth state changes and fetches the user's role
- **Navigation**: Header shows Sign In / Account / Admin links based on auth state

### Step 7 — Admin Dashboard
- **Route**: `/admin` protected by `AdminRoute` guard (`src/components/ProtectedRoute.tsx`)
- **Features**:
  - **Orders tab**: View all orders, filter by status counts, update order status dropdown, export to CSV
  - **Products tab**: CRUD products inline (create/edit/delete), toggle active, manage stock
- **RLS**: Only admins can write products or update orders

### Step 8 — Inventory & Validation
- **Stock enforcement**: `place_order` RPC blocks checkout if `stock < qty`
- **Client validation**: Zod schemas for shipping form (`shippingSchema`) and contact form (`contactSchema`)
- **Server validation**: Postgres checks (`CHECK (stock >= 0)`) and transactional stock decrement

### Step 10 — Legal Pages
- **Routes added**: `/privacy`, `/terms`, `/refund`, `/shipping`
- **Footer updated**: Legal column added with links to all 4 pages
- **Content**: Real placeholder policy text ready for customization

### Step 11 — SEO & Metadata
- **Helmet**: `react-helmet-async` wraps the app; every page has unique `<title>` and `<meta name="description">`
- **JSON-LD**: `Index.tsx` injects structured Product schema for each book (eligible for Google Shopping)
- **Sitemap**: `public/sitemap.xml` created
- **Robots.txt**: Updated with `Sitemap` reference

---

## Deferred for Future Phases

- **Step 5 — Real Payments**: Stripe / Paymob / Vodafone Cash integration (requires merchant accounts and webhook handling)
- **Step 9 — Transactional Email**: Resend integration for order confirmations and shipping updates
- **Step 12 — Analytics & Error Tracking**: Plausible / GA4 and Sentry setup
- **Step 13 — Performance Pass**: Image optimization (WebP), lazy loading audit, Lighthouse 90+ target
- **Step 14 — Security Hardening**: Rate-limiting on checkout/contact, CAPTCHA on forms
- **Step 15 — Custom Domain**: DNS and SPF/DKIM setup
- **Step 16 — Pre-launch Checklist**: End-to-end live test order, refund flow, mobile testing

---

## Next Immediate Actions for You

1. **Create a Supabase project** at https://supabase.com
2. **Run the SQL** in `supabase_schema.sql` in the Supabase SQL Editor
3. **Add your credentials** to a `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Upload product images** to Supabase Storage (or keep them in `src/assets` and update `image_url` in the DB)
5. **Sign up** via `/signup`, then run this SQL to make yourself admin:
   ```sql
   UPDATE user_roles SET role = 'admin' WHERE user_id = 'your-user-uuid';
   ```
6. **Build and deploy**: `npm run build`
