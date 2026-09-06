// Live, read-only checks apart from creating and closing optional demo login sessions.
// Supply credentials through the environment. Never print tokens or account details.
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

async function request(url, options = {}) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) })
  } catch {
    throw new Error(`Cannot reach ${new URL(url).hostname}. Check project availability, DNS, and deployment configuration.`)
  }
}

async function main() {
  if (!projectUrl || !publicKey || !siteUrl) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and NEXT_PUBLIC_SITE_URL.')
  const headers = { apikey: publicKey, 'Content-Type': 'application/json' }
  const settingsResponse = await request(`${projectUrl}/auth/v1/settings`, { headers })
  if (!settingsResponse.ok) throw new Error(`Supabase auth settings returned HTTP ${settingsResponse.status}; check the project URL and publishable key.`)
  const settings = await settingsResponse.json()
  if (!settings.external?.email) throw new Error('Email login is disabled in Supabase.')
  console.log(`PASS: Supabase authentication reachable; email enabled; Google ${settings.external?.google ? 'enabled' : 'disabled'}.`)

  for (const path of ['/api/admin/dashboard', '/api/appointments-v2', '/api/leads']) {
    const response = await request(new URL(path, siteUrl))
    if (response.status !== 401) throw new Error(`${path} returned ${response.status} for an anonymous request, expected 401.`)
    console.log(`PASS: ${path} rejects anonymous access.`)
  }

  // Optional: {"CLIENT":"...", "OWNER":"...", "AGENT":"...", "ADMIN":"..."}
  let accounts
  try {
    accounts = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
  } catch {
    throw new Error('AUTH_SMOKE_ACCOUNTS must be a JSON object mapping roles to test emails.')
  }
  if (!accounts || typeof accounts !== 'object' || Array.isArray(accounts)) throw new Error('AUTH_SMOKE_ACCOUNTS must be a JSON object.')
  for (const [role, email] of Object.entries(accounts)) {
    if (!['CLIENT', 'OWNER', 'AGENT', 'ADMIN'].includes(role)) throw new Error('Unrecognized smoke-test role.')
    if (!process.env.AUTH_SMOKE_PASSWORD) throw new Error('Set AUTH_SMOKE_PASSWORD for demo-account checks.')
    const login = await request(`${projectUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers, body: JSON.stringify({ email, password: process.env.AUTH_SMOKE_PASSWORD }),
    })
    if (!login.ok) throw new Error(`${role}: password login failed (HTTP ${login.status}).`)
    let session = await login.json()
    try {
      const refresh = await request(`${projectUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers, body: JSON.stringify({ refresh_token: session.refresh_token }),
      })
      if (!refresh.ok) throw new Error(`${role}: session refresh failed (HTTP ${refresh.status}).`)
      session = await refresh.json()
      const authorized = { ...headers, Authorization: `Bearer ${session.access_token}` }
      const profileResponse = await request(`${projectUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=role,is_active`, { headers: authorized })
      if (!profileResponse.ok) throw new Error(`${role}: profile lookup failed (HTTP ${profileResponse.status}).`)
      const profiles = await profileResponse.json()
      if (profiles.length !== 1 || profiles[0].role !== role || profiles[0].is_active === false) throw new Error(`${role}: profile role or active status does not match.`)
      const adminResponse = await request(new URL('/api/admin/dashboard', siteUrl), { headers: authorized })
      const expected = role === 'ADMIN' ? 200 : 403
      if (adminResponse.status !== expected) throw new Error(`${role}: admin API returned ${adminResponse.status}, expected ${expected}.`)
      console.log(`PASS: ${role} login, refresh, profile, and admin access boundary.`)
    } finally {
      const logout = await request(`${projectUrl}/auth/v1/logout?scope=local`, {
        method: 'POST', headers: { ...headers, Authorization: `Bearer ${session.access_token}` },
      })
      if (!logout.ok) throw new Error(`${role}: logout failed (HTTP ${logout.status}).`)
      console.log(`PASS: ${role} test session closed.`)
    }
  }
  if (!Object.keys(accounts).length) console.log('Demo-account login checks not run: no AUTH_SMOKE_ACCOUNTS supplied.')
}

main().catch(error => {
  console.error(`Authentication check failed: ${error.message}`)
  process.exitCode = 1
})
