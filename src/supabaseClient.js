import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mpvtjnfdtykxjlnbsuqz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdnRqbmZkdHlreGpsbmJzdXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Nzk3MDYsImV4cCI6MjA2NTI1NTcwNn0.n5mi3FsOHkN69xMcuPqoEM9qcSNK46RNKslvCXNTf5o' // NOT your service role key

export const supabase = createClient(supabaseUrl, supabaseKey)
