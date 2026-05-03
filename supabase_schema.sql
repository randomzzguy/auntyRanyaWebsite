-- Run this in your Supabase SQL Editor (idempotent — safe to re-run)

-- 1. Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  badge TEXT DEFAULT '',
  badge_tone TEXT DEFAULT 'primary' CHECK (badge_tone IN ('primary', 'accent', 'mint')),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  shipping_json JSONB NOT NULL DEFAULT '{}',
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'vodafone', 'bank', 'stripe')),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_submissions ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin (SECURITY DEFINER to avoid RLS recursion)
-- Must be created BEFORE policies that reference it
DROP FUNCTION IF EXISTS is_admin(UUID);
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid AND role = 'admin');
END;
$$;

-- Drop existing policies so re-runs are safe
DO $$ BEGIN
  DROP POLICY IF EXISTS "products_select_all" ON products;
  DROP POLICY IF EXISTS "products_insert_admin" ON products;
  DROP POLICY IF EXISTS "products_update_admin" ON products;
  DROP POLICY IF EXISTS "products_delete_admin" ON products;
  DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
  DROP POLICY IF EXISTS "orders_insert_own" ON orders;
  DROP POLICY IF EXISTS "orders_update_admin" ON orders;
  DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON order_items;
  DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
  DROP POLICY IF EXISTS "user_roles_select_self_or_admin" ON user_roles;
  DROP POLICY IF EXISTS "contact_submissions_insert_public" ON contact_submissions;
  DROP POLICY IF EXISTS "contact_submissions_select_admin" ON contact_submissions;
  DROP POLICY IF EXISTS "contact_submissions_update_admin" ON contact_submissions;
END $$;

-- Policies: products (readable by all, writable by admin)
CREATE POLICY "products_select_all"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (is_admin(auth.uid()));

-- Policies: orders (users see own, admin sees all)
CREATE POLICY "orders_select_own_or_admin"
  ON orders FOR SELECT
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (is_admin(auth.uid()));

-- Policies: order_items (mirror orders access)
CREATE POLICY "order_items_select_own_or_admin"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- Policies: user_roles (readable by self, admin sees all)
CREATE POLICY "user_roles_select_self_or_admin"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Policies: contact_submissions (public can insert, admin can read/update)
CREATE POLICY "contact_submissions_insert_public"
  ON contact_submissions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "contact_submissions_select_admin"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "contact_submissions_update_admin"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- 5. Secure order placement RPC
CREATE OR REPLACE FUNCTION place_order(
  p_shipping_json JSONB,
  p_payment_method TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC(12,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate items and compute total from DB prices / stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND active = true;
    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product % not found or inactive', v_item->>'product_id';
    END IF;
    IF v_product.stock < (v_item->>'qty')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
    END IF;
    v_total := v_total + v_product.price * (v_item->>'qty')::INTEGER;
  END LOOP;

  -- Insert order
  INSERT INTO orders (user_id, status, shipping_json, payment_method, total)
  VALUES (v_user_id, 'pending', p_shipping_json, p_payment_method, v_total)
  RETURNING id INTO v_order_id;

  -- Insert order items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
    INSERT INTO order_items (order_id, product_id, name, price, qty)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_product.name,
      v_product.price,
      (v_item->>'qty')::INTEGER
    );
    UPDATE products SET stock = stock - (v_item->>'qty')::INTEGER WHERE id = v_product.id;
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total);
END;
$$;

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION place_order(JSONB, TEXT, JSONB) TO authenticated;

-- Seed sample products
INSERT INTO products (name, price, description, badge, badge_tone, image_url, stock, active)
VALUES
  ('Letter Aa Story', 250, 'An enchanting journey through the letter Aa, designed to help young readers learn with joy and creativity.', 'New', 'primary', '/assets/book-aa.jpg', 50, true),
  ('Mrs. Alphabety Dictionary in 3 Languages', 500, 'A trilingual dictionary adventure that makes learning new words exciting across three different languages.', 'New • 3 Languages', 'mint', '/assets/book-dictionary.jpg', 30, true),
  ('Children''s Book Editing & Proofreading', 500, 'Professional editing and proofreading services to ensure your children''s book is polished and ready for publication.', 'Service', 'accent', '/assets/service-editing.jpg', 100, true)
ON CONFLICT DO NOTHING;
