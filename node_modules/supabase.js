import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// ⚠️ PASTE YOUR KEYS INSIDE THE QUOTES BELOW
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseKey);