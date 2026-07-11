import pool from './db'

export interface FjordHubUser {
  id: number
  username: string
  role?: 'admin' | 'user'
  hub_role?: 'admin' | 'user'
  first_name?: string
  last_name?: string
  language?: string
}

const MANAGED_PASSWORD_HASH = 'fjordhub-managed'

export function isFjordHubManaged(): boolean {
  return Boolean(
    process.env.FJORDHUB_URL &&
    process.env.FJORDHUB_APP_ID &&
    process.env.FJORDHUB_API_KEY
  )
}

async function hubRequest(
  path: string,
  payload: Record<string, unknown>,
  method: 'GET' | 'POST' = 'POST'
): Promise<Record<string, unknown>> {
  if (!isFjordHubManaged()) return { ok: false, error: 'FjordHub integration is not active' }

  const appId = process.env.FJORDHUB_APP_ID as string
  const baseUrl = (process.env.FJORDHUB_URL as string).replace(/\/$/, '')
  const data = { ...payload, app_id: appId }
  let url = `${baseUrl}${path}`
  const init: RequestInit = {
    method,
    cache: 'no-store',
    headers: { 'X-Hub-Key': process.env.FJORDHUB_API_KEY as string },
    signal: AbortSignal.timeout(6000),
  }

  if (method === 'GET') {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(data)) params.set(key, String(value))
    url += `?${params.toString()}`
  } else {
    init.headers = { ...init.headers, 'Content-Type': 'application/json' }
    init.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, init)
    const result = await response.json().catch(() => ({}))
    return typeof result === 'object' && result ? result : { ok: false }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not contact FjordHub',
    }
  }
}

export async function authenticateWithFjordHub(
  username: string,
  password: string
): Promise<FjordHubUser | null> {
  const result = await hubRequest('/api/hub/apps/authenticate', { username, password })
  const user = result.user
  return result.ok === true && user && typeof user === 'object' ? user as FjordHubUser : null
}

export async function verifyFjordHubSsoToken(token: string): Promise<FjordHubUser | null> {
  const result = await hubRequest('/api/hub/sso-verify', { token }, 'GET')
  if (result.ok !== true || typeof result.username !== 'string' || !result.username.trim()) return null
  return result as unknown as FjordHubUser
}

export async function ensureManagedLocalUser(hubUser: FjordHubUser) {
  const username = String(hubUser.username || '').trim()
  if (!username) throw new Error('FjordHub user is missing a username')

  const existing = await pool.query(
    'SELECT id, username FROM users WHERE lower(username) = lower($1) LIMIT 1',
    [username]
  )
  if (existing.rows[0]) return existing.rows[0] as { id: string; username: string }

  const created = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
     RETURNING id, username`,
    [username, MANAGED_PASSWORD_HASH]
  )
  return created.rows[0] as { id: string; username: string }
}
