// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and API key
const supabaseUrl = 'https://oeemjkrnevtfxtrxceuw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZW1qa3JuZXZ0Znh0cnhjZXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjE4NDEsImV4cCI6MjA3MTU5Nzg0MX0.O1IDfV_kScBZB1f-FV6lQswKh2Vb_u_ARgty6TQ-kCg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);