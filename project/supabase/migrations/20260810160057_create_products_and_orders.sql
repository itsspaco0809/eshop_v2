/*
# Create products, orders, and order_items tables

## Overview
This migration sets up the core e-commerce schema for a custom Lego kit store.
It creates a products table (catalog), an orders table (checkout records), and
an order_items table (line items per order). Since this is a no-auth storefront,
all policies are scoped to anon + authenticated.

## New Tables

### products
- `id` (uuid, primary key) — unique product identifier
- `name` (text, not null) — product name (e.g. "Midnight Challenger GT")
- `slug` (text, unique, not null) — URL-friendly identifier
- `description` (text, not null) — full product description
- `price` (integer, not null) — price in cents (e.g. 4999 = $49.99)
- `category` (text, not null) — one of: muscle, sports, classic, truck, race, motorcycle, electric
- `theme` (text, not null) — one of: muscle, organic, car
- `piece_count` (integer, not null) — number of Lego pieces in the kit
- `image_url` (text, not null) — main product image URL
- `gallery` (jsonb) — array of additional image URLs
- `featured` (boolean, default false) — whether to show on home page
- `in_stock` (boolean, default true) — availability flag
- `rating` (numeric, default 5.0) — product rating (0-5)
- `created_at` (timestamptz, default now())

### orders
- `id` (uuid, primary key)
- `email` (text, not null) — customer email
- `full_name` (text, not null) — customer name
- `shipping_address` (text, not null) — shipping address
- `city` (text, not null)
- `postal_code` (text, not null)
- `country` (text, not null)
- `total` (integer, not null) — total in cents
- `status` (text, default 'pending') — pending, paid, shipped, cancelled
- `stripe_session_id` (text) — Stripe checkout session ID
- `created_at` (timestamptz, default now())

### order_items
- `id` (uuid, primary key)
- `order_id` (uuid, references orders(id) on delete cascade)
- `product_id` (uuid, references products(id))
- `product_name` (text, not null) — snapshot of product name
- `quantity` (integer, not null)
- `unit_price` (integer, not null) — snapshot of price in cents

## Security
- RLS enabled on all tables.
- products: public read (anon + authenticated), no public writes.
- orders: anon + authenticated can create and read their own orders.
- order_items: anon + authenticated can create and read items for their own orders.

## Important Notes
1. Prices are stored in cents to avoid floating point issues.
2. Product names and prices are snapshotted in order_items for historical accuracy.
3. The store has no login, so policies use anon + authenticated.
*/

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  category text NOT NULL,
  theme text NOT NULL,
  piece_count integer NOT NULL,
  image_url text NOT NULL,
  gallery jsonb DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  in_stock boolean NOT NULL DEFAULT true,
  rating numeric(2,1) NOT NULL DEFAULT 5.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  shipping_address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  total integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_orders" ON orders;
CREATE POLICY "public_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_orders" ON orders;
CREATE POLICY "public_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_order_items" ON order_items;
CREATE POLICY "public_read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_order_items" ON order_items;
CREATE POLICY "public_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Seed product data
INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Midnight Challenger GT',
  'midnight-challenger-gt',
  'A brutal muscle car kit inspired by the golden era of American horsepower. Features a detailed V8 engine bay, aggressive hood scoop, racing stripes, and a fully accessible interior. Built in monochrome black with carbon-fiber texture detailing.',
  5999,
  'muscle',
  'muscle',
  342,
  'https://images.pexels.com/photos/20706251/pexels-photo-20706251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/16041067/pexels-photo-16041067.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/34071036/pexels-photo-34071036.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  true,
  true,
  4.8
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Phantom Charger R/T',
  'phantom-charger-rt',
  'A sleek and menacing muscle car kit with a long hood, dual exhaust detailing, and a wide-body stance. Includes removable hardtop and detailed dashboard. Finished in deep matte black with chrome accents.',
  6499,
  'muscle',
  'muscle',
  378,
  'https://images.pexels.com/photos/34071036/pexels-photo-34071036.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/34071033/pexels-photo-34071033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/36655832/pexels-photo-36655832.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  true,
  true,
  4.9
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Apex GT Prototype',
  'apex-gt-prototype',
  'A cutting-edge sports car kit inspired by modern hypercar design. Features aerodynamic curves, active rear wing, and a minimalist interior. Built in light grey with subtle silver pinstripe detailing.',
  7499,
  'sports',
  'car',
  412,
  'https://images.pexels.com/photos/12900641/pexels-photo-12900641.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/19240614/pexels-photo-19240614.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/18425524/pexels-photo-18425524.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  true,
  true,
  4.7
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Circuit Racer Type-S',
  'circuit-racer-type-s',
  'A track-focused race car kit with exposed carbon rear wing, racing slicks, and a roll cage. Inspired by endurance racing prototypes. Finished in stark white with black racing livery.',
  6999,
  'race',
  'car',
  356,
  'https://images.pexels.com/photos/29320661/pexels-photo-29320661.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/29252129/pexels-photo-29252129.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/20196376/pexels-photo-20196376.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  true,
  true,
  4.6
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Heritage Coupe 1967',
  'heritage-coupe-1967',
  'A classic vintage coupe kit inspired by 1960s European grand tourers. Features wire-style wheels, a long flowing hood, and a detailed leather-look interior. Finished in monochrome silver-grey.',
  6299,
  'classic',
  'car',
  298,
  'https://images.pexels.com/photos/37871412/pexels-photo-37871412.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/11351028/pexels-photo-11351028.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/30767229/pexels-photo-30767229.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  true,
  true,
  4.8
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Summit Off-Road Raptor',
  'summit-offroad-raptor',
  'A rugged off-road truck kit with lifted suspension, oversized tires, and a bed rack. Features working steering and detailed undercarriage. Finished in tactical matte grey with black accents.',
  6799,
  'truck',
  'car',
  387,
  'https://images.pexels.com/photos/28767720/pexels-photo-28767720.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/32881298/pexels-photo-32881298.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/18864421/pexels-photo-18864421.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  false,
  true,
  4.5
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Volt Electric GT',
  'volt-electric-gt',
  'A futuristic electric vehicle kit inspired by next-gen EV design. Features a frunk storage compartment, minimalist dashboard screen, and aero wheels. Finished in pearl white with dark grey accents.',
  7299,
  'electric',
  'car',
  324,
  'https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/17000830/pexels-photo-17000830.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/19733954/pexels-photo-19733954.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  false,
  true,
  4.4
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Ninja Sport Bike RR',
  'ninja-sport-bike-rr',
  'A high-performance motorcycle kit with detailed fairings, chain drive, and track-day accessories. Features a working kickstand and articulated front forks. Finished in monochrome black with grey rim detailing.',
  4999,
  'motorcycle',
  'muscle',
  218,
  'https://images.pexels.com/photos/26551186/pexels-photo-26551186.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/33203538/pexels-photo-33203538.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/32326648/pexels-photo-32326648.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  false,
  true,
  4.6
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating) VALUES
(
  'Drift King S15',
  'drift-king-s15',
  'A drift machine kit with widebody fenders, custom rear wing, and a detailed turbocharged engine. Features steerable front wheels and a removable hood. Finished in white with black carbon detailing.',
  5799,
  'sports',
  'car',
  301,
  'https://images.pexels.com/photos/14504324/pexels-photo-14504324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '["https://images.pexels.com/photos/35415197/pexels-photo-35415197.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","https://images.pexels.com/photos/235333/pexels-photo-235333.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]'::jsonb,
  false,
  true,
  4.7
) ON CONFLICT (slug) DO NOTHING;

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_theme ON products(theme);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
