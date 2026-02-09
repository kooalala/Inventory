import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// ⚠️ PASTE YOUR KEYS INSIDE THE QUOTES BELOW
const supabaseUrl = 'https://fispwtmcqcybzurtykem.supabase.co';
const supabaseKey = 'sb_publishable_p9tJCSeKcysUUsoemIVlmQ_wgEujybo';

export const supabase = createClient(supabaseUrl, supabaseKey);