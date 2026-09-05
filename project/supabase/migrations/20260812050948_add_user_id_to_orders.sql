/*
# Link orders to authenticated users

## Overview
This migration adds a `user_id` column to the `orders` table so that orders
placed by logged-in customers can be linked to their account and retrieved
in an order history page. Guest checkout (no login) still works — the column
is nullable. RLS policies are updated so authenticated users can only see
their own orders, while anon can still insert (guest checkout) and read
nothing (anon has no orders to see since there's no user_id to match).

## Modified Tables

### orders
- Added `user_id` (uuid, nullable) — references `auth.users(id)` with ON DELETE SET NULL.
  Nullable so existing guest orders and future guest checkouts still work.
  When a logged-in user checks out, the frontend sets this to their auth uid.

## Security Changes
- RLS on `orders`:
  - SELECT: authenticated users can read only their own orders (user_id = auth.uid()).
    anon gets no SELECT (no orders to show without login).
  - INSERT: authenticated users can insert with their own user_id; anon can still
    insert (guest checkout) with NULL user_id.
  - UPDATE: authenticated users can update their own orders; anon can update
    with NULL user_id (for status updates from the frontend if needed).
- RLS on `order_items`:
  - SELECT: authenticated users can read items for orders they own.
    anon can still read (for guest checkout confirmation page).
  - INSERT: unchanged — anon + authenticated can insert.

## Important Notes
1. The `user_id` column is nullable to preserve existing guest orders.
2. `DEFAULT auth.uid()` is NOT set because guest orders must allow NULL.
3. The frontend sets user_id explicitly during checkout when the user is logged in.
*/

-- Add user_id column to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster user order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;

-- Update orders RLS policies
-- Drop old public policies
DROP POLICY IF EXISTS "public_read_orders" ON orders;
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
DROP POLICY IF EXISTS "public_update_orders" ON orders;

-- SELECT: authenticated users can only see their own orders
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- INSERT: authenticated users can create orders with their own user_id
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- INSERT: anon can still create guest orders (no user_id)
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon WITH CHECK (user_id IS NULL);

-- UPDATE: authenticated users can update their own orders
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update order_items RLS: authenticated users can read items for their own orders
DROP POLICY IF EXISTS "public_read_order_items" ON order_items;
CREATE POLICY "read_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- anon can still read order_items (for guest checkout confirmation)
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT
  TO anon USING (true);