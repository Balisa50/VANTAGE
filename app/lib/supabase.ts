import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client for reads
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only client for writes
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

export interface Article {
  id: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  category: string | null;
  region: string | null;
  what_happened: string | null;
  why_it_matters: string | null;
  who_wins_loses: string | null;
  what_to_watch: string | null;
  full_body: string;
  source_urls: string[] | null;
  source_headlines: string[] | null;
  signal_score: number;
  signal_sources: string[] | null;
  social_context: string | null;
  image_url: string | null;
  published_at: string;
  created_at: string;
}
