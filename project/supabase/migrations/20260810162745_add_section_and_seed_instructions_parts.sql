/*
# Add section column and seed Instructions + Custom Parts

## Overview
Adds a `section` column to the products table to categorize items as
"kits" (default, existing products), "instructions" (digital build guides),
or "custom_parts" (individual custom Lego pieces for builders).

## Changes
1. Adds `section` text column to products (default 'kits').
2. Adds index on the section column for faster filtering.
3. Seeds 6 instruction products (build guides for existing kits).
4. Seeds 6 custom parts products (wheels, windscreens, engine blocks, etc.).

## Security
No security changes — existing public read policy covers all sections.

## Important Notes
1. Existing products automatically get section = 'kits'.
2. Instructions are digital products (piece_count = 0).
3. Custom parts have piece_count representing pieces in the pack.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'kits';

CREATE INDEX IF NOT EXISTS idx_products_section ON products(section);

-- Seed Instructions (digital build guides for existing kits)
INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Challenger GT Build Guide',
  'challenger-gt-build-guide',
  'Complete step-by-step digital build guide for the Midnight Challenger GT kit. 120 pages of detailed instructions with exploded views, parts list, and expert tips for a flawless build.',
  1499,
  'muscle',
  'muscle',
  0,
  'https://images.pexels.com/photos/20706251/pexels-photo-20706251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.9,
  'instructions'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Phantom Charger R/T Build Guide',
  'phantom-charger-rt-build-guide',
  'Full digital instruction set for the Phantom Charger R/T. Includes detailed engine assembly steps, interior detailing guide, and alternative build options.',
  1499,
  'muscle',
  'muscle',
  0,
  'https://images.pexels.com/photos/34071036/pexels-photo-34071036.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.8,
  'instructions'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Apex GT Prototype Build Guide',
  'apex-gt-prototype-build-guide',
  'Advanced build guide for the Apex GT Prototype hypercar kit. Covers the complex aerodynamic elements, active wing mechanism, and minimalist interior assembly.',
  1799,
  'sports',
  'car',
  0,
  'https://images.pexels.com/photos/12900641/pexels-photo-12900641.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.7,
  'instructions'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Circuit Racer Type-S Build Guide',
  'circuit-racer-type-s-build-guide',
  'Track-focused build guide for the Circuit Racer Type-S. Includes roll cage installation, rear wing calibration, and racing slick assembly instructions.',
  1599,
  'race',
  'car',
  0,
  'https://images.pexels.com/photos/29320661/pexels-photo-29320661.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.6,
  'instructions'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Heritage Coupe 1967 Build Guide',
  'heritage-coupe-1967-build-guide',
  'Classic build guide for the Heritage Coupe 1967. Features wire-wheel assembly, vintage interior detailing, and period-accurate decal placement guide.',
  1499,
  'classic',
  'car',
  0,
  'https://images.pexels.com/photos/37871412/pexels-photo-37871412.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.8,
  'instructions'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Drift King S15 Build Guide',
  'drift-king-s15-build-guide',
  'Complete build manual for the Drift King S15. Covers widebody fender installation, turbocharged engine assembly, and custom rear wing mounting.',
  1399,
  'sports',
  'car',
  0,
  'https://images.pexels.com/photos/14504324/pexels-photo-14504324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  false,
  4.7,
  'instructions'
) ON CONFLICT (slug) DO NOTHING;

-- Seed Custom Parts
INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Racing Slick Wheel Set (4)',
  'racing-slick-wheel-set',
  'Set of 4 premium racing slick wheels with chrome rims. Compatible with all KITS car models. Smooth-rolling design for display and light play.',
  1299,
  'race',
  'car',
  4,
  'https://images.pexels.com/photos/29320661/pexels-photo-29320661.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.5,
  'custom_parts'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'V8 Engine Block Assembly',
  'v8-engine-block-assembly',
  'Detailed V8 engine block kit with 47 pieces. Includes pistons, crankshaft, and exhaust headers. Perfect for upgrading any muscle car build.',
  2499,
  'muscle',
  'muscle',
  47,
  'https://images.pexels.com/photos/16041067/pexels-photo-16041067.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.8,
  'custom_parts'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Carbon Fiber Rear Wing',
  'carbon-fiber-rear-wing',
  'Adjustable carbon-look rear wing assembly. Fits all sports and race car models. Includes mounting hardware and angle adjustment pieces.',
  1799,
  'sports',
  'car',
  12,
  'https://images.pexels.com/photos/12900641/pexels-photo-12900641.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.6,
  'custom_parts'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Tinted Windscreen Set',
  'tinted-windscreen-set',
  'Set of 3 tinted windscreens in varying sizes. Smoked-glass look for sports, muscle, and race car builds. Scratch-resistant premium material.',
  999,
  'sports',
  'car',
  3,
  'https://images.pexels.com/photos/19240614/pexels-photo-19240614.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.4,
  'custom_parts'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Off-Road Tire Set (4)',
  'off-road-tire-set',
  'Set of 4 rugged off-road tires with deep tread pattern. Perfect for truck and rally builds. Heavy-duty rubber compound for authentic look.',
  1499,
  'truck',
  'car',
  4,
  'https://images.pexels.com/photos/28767720/pexels-photo-28767720.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  true,
  4.5,
  'custom_parts'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, category, theme, piece_count, image_url, gallery, featured, in_stock, rating, section) VALUES
(
  'Chrome Detail Trim Pack',
  'chrome-detail-trim-pack',
  'Assorted chrome trim pieces including grille bars, exhaust tips, and side mirrors. 24 pieces total. Adds premium finishing to any build.',
  1199,
  'classic',
  'car',
  24,
  'https://images.pexels.com/photos/30767229/pexels-photo-30767229.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '[]'::jsonb,
  false,
  false,
  4.7,
  'custom_parts'
) ON CONFLICT (slug) DO NOTHING;
