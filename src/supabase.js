import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cdzvjueschflpkxlozby.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkenZqdWVzY2hmbHBreGxvemJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODE1OTEsImV4cCI6MjA5NTI1NzU5MX0.yN2dAg6PV8LlgQP9en5d6QDHE5yp51MC3kK0l-S-OXA'

const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkenZqdWVzY2hmbHBreGxvemJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY4MTU5MSwiZXhwIjoyMDk1MjU3NTkxfQ.ihmK2keWBrLzUxk5eHcRtshgfNwekH6AgZnxJv-AKrQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})