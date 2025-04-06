import { createClient } from '@supabase/supabase-js';

// Vite uses VITE_ prefix instead of REACT_APP_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'svkoxledoxdipwjdmaol';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a294bGVkb3hkaXB3amRtYW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzM1NjksImV4cCI6MjA1OTQ0OTU2OX0.eV-p0IgX_UwoVw0aR7MRTpwhEiXwg92Yhze8CxjHMcM';

export const supabase = createClient(
  `https://${supabaseUrl}.supabase.co`, 
  supabaseAnonKey
); 