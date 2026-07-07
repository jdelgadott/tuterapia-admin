import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cdzvjueschflpkxlozby.supabase.co'

const SUPABASE_ANON_KEY = 'sb_publishable_aHhZehmUO09UH2rVgNR8Gg_sstXSGnC'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
