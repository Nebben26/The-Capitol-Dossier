import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for user features
export interface DbPrediction {
  id?: string;
  user_id: string;
  question: string;
  probability: number;
  outcome: "YES" | "NO" | null;
  category: string;
  date: string;
  created_at?: string;
}

export interface DbWatchlistItem {
  id?: string;
  user_id: string;
  item_type: "market" | "whale";
  item_id: string;
  item_name: string;
  created_at?: string;
}
