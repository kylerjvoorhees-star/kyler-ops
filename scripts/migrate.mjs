import { readFileSync } from 'fs'
import pg from 'pg'
const { Client } = pg

const envFile = readFileSync('.env.local', 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

// Parse connection string components to avoid URL encoding issues
const rawUrl = env.DATABASE_URL
const match = rawUrl.match(/^postgresql?:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/(.+)$/)
if (!match) throw new Error('Could not parse DATABASE_URL')
const [, user, passwordEncoded, host, port, database] = match
const password = decodeURIComponent(passwordEncoded)

const client = new Client({ user, password, host, port: parseInt(port), database, ssl: { rejectUnauthorized: false } })

await client.connect()
console.log('Connected to Supabase.')

const sql = readFileSync('scripts/migrate.sql', 'utf-8')
await client.query(sql)
console.log('Migration complete!')

await client.end()
