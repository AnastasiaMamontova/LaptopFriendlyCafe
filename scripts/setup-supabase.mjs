import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// curl honors the inherited Cloud proxy/CA configuration. Keep credentials on
// stdin rather than in command arguments, source files, or terminal output.
function request(url, token, body) {
  const config = [
    'silent', 'show-error', 'fail-with-body', 'max-time = 60',
    `url = ${JSON.stringify(url)}`,
    `header = ${JSON.stringify(`Authorization: Bearer ${token}`)}`,
    'header = "Content-Type: application/json"',
  ]
  if (body) config.push(`data = ${JSON.stringify(JSON.stringify(body))}`)
  try {
    return JSON.parse(execFileSync('curl', ['--config', '-'], {
      input: config.join('\n'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    }))
  } catch {
    throw new Error('Supabase request failed. Check the project reference, access token, network, and project health. No credentials have been logged.')
  }
}

const project = process.env.SUPABASE_PROJECT_ID
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!project || !token) throw new Error('Set SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN in the environment, not in source code.')
if (!/^[a-z0-9]+$/.test(project)) throw new Error('SUPABASE_PROJECT_ID must contain the project reference only.')
const endpoint = `https://api.supabase.com/v1/projects/${project}`
const tables = request(`${endpoint}/database/query`, token, {
  query: "select tablename from pg_tables where schemaname = 'public' order by tablename",
})
console.log(`Connected to Supabase. Public tables: ${tables.map(table => table.tablename).join(', ') || '(none)'}.`)
const migrations = new URL('../supabase/migrations/', import.meta.url)
for (const name of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
  request(`${endpoint}/database/query`, token, { query: readFileSync(new URL(name, migrations), 'utf8') })
}
const keys = request(`${endpoint}/api-keys`, token)
const anon = keys.find(key => key.name === 'anon')?.api_key
if (!anon) throw new Error('No public anon API key is available for this project.')
const envPath = fileURLToPath(new URL('../.env.local', import.meta.url))
writeFileSync(envPath, `VITE_SUPABASE_URL=https://${project}.supabase.co\nVITE_SUPABASE_ANON_KEY=${anon}\n`, { mode: 0o600 })
console.log('Cafe schema, public access policies, and photo bucket are ready. Public browser settings written to .env.local. No private keys were saved.')
