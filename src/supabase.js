import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://your_url.supabase.co";
const supabaseKey = "your_supabase_key";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
