import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  theme: string;
  piece_count: number;
  image_url: string;
  gallery: string[];
  featured: boolean;
  in_stock: boolean;
  rating: number;
  section: string;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  email: string;
  full_name: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  country: string;
  total: number;
  status: string;
  stripe_session_id: string | null;
  created_at: string;
};
