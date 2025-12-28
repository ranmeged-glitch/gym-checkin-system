import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// בדיקת תקינות - תוכל לראות את זה ב-F12 אם יש בעיה
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("שגיאה: משתני הסביבה של Supabase חסרים! וודא שקובץ ה-.env קיים ותקין.");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);