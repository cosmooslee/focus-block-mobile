import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://naswpbhxleyerevyrabt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3dwYmh4bGV5ZXJldnlyYWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzE2NDYsImV4cCI6MjA4Nzc0NzY0Nn0.3cVXgdkmPBdQscSXrs0SlSNMo28Y9YglcUzEsoyGie4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
