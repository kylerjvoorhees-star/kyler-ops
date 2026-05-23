/**
 * Runs the DB migration via Supabase's Management REST API.
 * Requires: SUPABASE_ACCESS_TOKEN in .env.local (get from supabase.com/dashboard/account/tokens)
 * OR falls back to trying via the service role key using pg_query.
 */
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

// Extract project ref from supabase URL
const projectRef = env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
console.log('Project ref:', projectRef)

const sql = readFileSync('scripts/migrate.sql', 'utf-8')

// Try Management API (requires personal access token)
const accessToken = env.SUPABASE_ACCESS_TOKEN
if (accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const data = await res.json()
  console.log('Management API response:', res.status, JSON.stringify(data).slice(0, 200))
  if (res.ok) {
    console.log('Migration complete!')
    process.exit(0)
  }
}

console.log('\nManagement API not available. Please run the SQL manually:')
console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
console.log('2. Paste the contents of scripts/migrate.sql')
console.log('3. Click Run\n')
