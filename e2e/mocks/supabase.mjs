// Mock delle API Supabase (Auth, PostgREST, Storage, Edge Functions) per Playwright.
// Tutte le richieste verso https://x.supabase.co/** sono intercettate con page.route:
// il container di test non raggiunge Supabase e i test non devono dipendere da dati reali.

import { ENTE_ID, USERS, profiles, tables, scuole, edifici, scuola_utenti } from './fixtures.mjs'

export const SUPABASE_URL = 'https://x.supabase.co'
export const STORAGE_KEY = 'sb-x-auth-token'

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')

/** JWT finto (firma non verificata dal client) con il livello di autenticazione richiesto. */
export function fakeJwt(user, aal = 'aal2') {
  const now = Math.floor(Date.now() / 1000)
  return [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', aal, amr: [{ method: 'password', timestamp: now }].concat(aal === 'aal2' ? [{ method: 'totp', timestamp: now }] : []), session_id: 'sess-' + user.id.slice(-4), iat: now, exp: now + 3600 }),
    'firma-finta',
  ].join('.')
}

export function authUser(user, factors = []) {
  return {
    id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, email_confirmed_at: '2026-09-01T08:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'], ...(user.app_metadata || {}) }, user_metadata: { full_name: `${user.nome} ${user.cognome}`, ...(user.user_metadata || {}) },
    factors, created_at: '2026-09-01T08:00:00Z', updated_at: '2026-10-01T08:00:00Z',
  }
}

export function session(user, aal = 'aal2', factors = []) {
  const now = Math.floor(Date.now() / 1000)
  return { access_token: fakeJwt(user, aal), token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'refresh-' + user.id.slice(-4), user: authUser(user, factors) }
}

const VERIFIED_FACTOR = { id: '00000000-0000-4000-8000-0000000fac01', friendly_name: 'Gestione Appalti', factor_type: 'totp', status: 'verified', created_at: '2026-09-01T08:00:00Z', updated_at: '2026-09-01T08:00:00Z' }
const QR = 'data:image/svg+xml;utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#fff"/><rect x="20" y="20" width="60" height="60"/><rect x="120" y="20" width="60" height="60"/><rect x="20" y="120" width="60" height="60"/></svg>')

/**
 * Applica un filtro PostgREST semplice (eq, neq, in, is, not.is, gt/gte/lt/lte) alle righe.
 * I filtri su colonne non presenti nella riga o su risorse incorporate (con il punto) sono ignorati.
 */
function applyFilters(rows, params) {
  let out = rows
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key) || key.includes('.')) continue
    out = out.filter((row) => {
      if (!(key in row)) return true
      const v = row[key]
      let expr = raw, neg = false
      if (expr.startsWith('not.')) { neg = true; expr = expr.slice(4) }
      const dot = expr.indexOf('.')
      const op = expr.slice(0, dot), arg = expr.slice(dot + 1)
      let ok = true
      if (op === 'eq') ok = String(v) === arg
      else if (op === 'neq') ok = String(v) !== arg
      else if (op === 'in') ok = arg.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, '')).includes(String(v))
      else if (op === 'is') ok = arg === 'null' ? v === null || v === undefined : String(v) === arg
      else if (op === 'gt') ok = String(v) > arg
      else if (op === 'gte') ok = String(v) >= arg
      else if (op === 'lt') ok = String(v) < arg
      else if (op === 'lte') ok = String(v) <= arg
      return neg ? !ok : ok
    })
  }
  const limit = params.get('limit')
  return limit ? out.slice(0, Number(limit)) : out
}

/** Colonne di primo livello richieste da `select` (le risorse incorporate contano come colonna). */
function selectedColumns(select) {
  if (!select) return null
  const cols = []
  let depth = 0, cur = ''
  for (const ch of select) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { cols.push(cur); cur = '' } else cur += ch
  }
  cols.push(cur)
  const names = cols.map((c) => c.trim().replace(/\(.*$/s, '').replace(/!.*$/, '')).filter(Boolean)
  if (names.includes('*')) return null
  return names.map((n) => (n.includes(':') ? n.split(':') : [n, n]))
}

/** Restituisce solo le colonne richieste, come farebbe PostgREST (rileva campi usati ma non selezionati). */
function project(rows, select) {
  const cols = selectedColumns(select)
  if (!cols) return rows
  return rows.map((r) => Object.fromEntries(cols.filter(([, src]) => src in r).map(([alias, src]) => [alias, r[src]])))
}

/**
 * Installa il mock sulla pagina.
 * @param {import('playwright').Page} page
 * @param {object} sc scenario: { user, roles: string[], mfa: 'aal2'|'enroll'|'challenge', loggedIn, loginError, inactive, dashboardConfig }
 * @returns {{calls: Array<{method:string,path:string,status:number}>, writes: Array}} registro delle chiamate
 */
export async function installSupabaseMock(page, sc) {
  const user = sc.user
  const log = { calls: [], writes: [], unknown: [], functions: [] }
  let mfaState = sc.mfa || 'aal2' // 'aal2' | 'enroll' | 'challenge'
  let factors = mfaState === 'challenge' ? [VERIFIED_FACTOR] : []
  const data = tables(sc)
  const userRoles = (sc.roles || []).map((ruolo) => ({ user_id: user.id, ente_id: ENTE_ID, ruolo }))
  const currentAal = () => (mfaState === 'aal2' ? 'aal2' : 'aal1')

  if (sc.loggedIn !== false) {
    const s = session(user, currentAal(), factors)
    await page.addInitScript(([k, v]) => {
      if (!sessionStorage.getItem('__e2e_seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('__e2e_seeded', '1') }
    }, [STORAGE_KEY, JSON.stringify(s)])
  }

  const json = (route, status, body, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range', ...headers }, body: body === undefined ? '' : JSON.stringify(body) })

  // ---------- Edge Function admin-users (stato in memoria per il singolo test) ----------
  // Replica le regole principali della funzione reale: le azioni sui delegati sono
  // riservate al dirigente scolastico e limitate agli edifici a lui assegnati.
  const isHead = (sc.roles || []).includes('dirigente_scolastico')
  const headSchool = scuole[0]
  const headBuildings = [edifici[0]]
  const delegates = scuola_utenti.filter((x) => x.ruolo === 'delegato_scolastico').map((x) => {
    const u = Object.values(USERS).find((v) => v.id === x.user_id)
    return { scuola_utente_id: x.id, scuola_id: x.scuola_id, user_id: x.user_id, email: u.email, nome: u.nome, cognome: u.cognome, telefono: '', stato: 'attivo', attivo: true, data_inizio: x.data_inizio, data_fine: x.data_fine, edifici: [{ id: edifici[0].id, denominazione: edifici[0].denominazione }], altri_edifici: 0, gestibile: true, mfa_attiva: true, mfa_azzerabile: true }
  })
  const forbidden = { status: 403, body: { error: 'Operazione riservata al dirigente scolastico attivo dell\'istituto.' } }
  function adminUsersFunction(body) {
    const a = body.action || 'list'
    if (['list', 'create', 'update', 'delete', 'school_associate'].includes(a)) {
      if (a === 'list') return { status: 200, body: { users: profiles.map((p) => ({ ...p, mfa_attiva: p.id !== USERS.consultatore.id, roles: [{ ente_id: ENTE_ID, ruolo: Object.entries(USERS).find(([, u]) => u.id === p.id)?.[0] || 'consultatore' }] })) } }
      return { status: 200, body: { ok: true } }
    }
    if (a === 'mfa_reset' && !body.scuola_id) {
      if (body.user_id === user.id) return { status: 400, body: { error: 'Non è possibile azzerare la propria verifica in due passaggi da questa sezione.' } }
      return { status: 200, body: { ok: true, fattori_rimossi: 1, sessioni_revocate: false } }
    }
    if (!isHead || (a !== 'school_delegates_list' && body.scuola_id !== headSchool.id)) return forbidden
    const find = () => delegates.find((d) => d.user_id === body.user_id)
    switch (a) {
      case 'school_delegates_list':
        return { status: 200, body: { schools: [{ id: headSchool.id, denominazione: headSchool.denominazione, codice_meccanografico: headSchool.codice_meccanografico, edifici: headBuildings.map((b) => ({ id: b.id, denominazione: b.denominazione, comune: b.comune })) }], delegates } }
      case 'school_delegate_save': {
        const ids = body.edificio_ids || []
        if (!ids.length || ids.some((id) => !headBuildings.some((b) => b.id === id))) return { status: 403, body: { error: 'Puoi assegnare solo edifici dell\'istituto che sono assegnati a te.' } }
        const ed = ids.map((id) => ({ id, denominazione: headBuildings.find((b) => b.id === id).denominazione }))
        const d = body.user_id ? find() : null
        if (d) { Object.assign(d, { edifici: ed, data_fine: body.data_fine || null, stato: d.stato === 'revocato' ? 'attivo' : d.stato, attivo: d.stato === 'revocato' ? true : d.attivo }); return { status: 200, body: { ok: true, user_id: d.user_id, utenza_creata: false, password_temporanea: null } } }
        const id = '00000000-0000-4000-8000-00000000a0' + String(10 + delegates.length)
        delegates.push({ scuola_utente_id: id, scuola_id: headSchool.id, user_id: id, email: body.email, nome: body.nome, cognome: body.cognome, telefono: body.telefono || '', stato: 'attivo', attivo: true, data_inizio: '2026-11-02', data_fine: body.data_fine || null, edifici: ed, altri_edifici: 0, gestibile: true, mfa_attiva: false, mfa_azzerabile: true })
        return { status: 200, body: { ok: true, user_id: id, utenza_creata: true, password_temporanea: 'Tmp4-Demo-Pass-w0rd' } }
      }
      case 'school_delegate_status': { const d = find(); if (!d) return forbidden; d.attivo = !!body.attivo; d.stato = d.attivo ? 'attivo' : 'sospeso'; return { status: 200, body: { ok: true } } }
      case 'school_delegate_revoke': { const d = find(); if (!d) return forbidden; Object.assign(d, { attivo: false, stato: 'revocato', edifici: [] }); return { status: 200, body: { ok: true, ruolo_rimosso: true } } }
      case 'mfa_reset': { const d = find(); if (!d) return forbidden; d.mfa_attiva = false; return { status: 200, body: { ok: true, fattori_rimossi: 1, sessioni_revocate: false } } }
      default: return { status: 400, body: { error: 'Azione non supportata.' } }
    }
  }

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    const path = url.pathname
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    let status = 200
    const done = (s) => { status = s; log.calls.push({ method, path: path + url.search, status }) }

    // ---------- AUTH ----------
    if (path === '/auth/v1/token') {
      const body = JSON.parse(req.postData() || '{}')
      if (url.searchParams.get('grant_type') === 'password') {
        if (sc.loginError || body.password !== 'Password-Demo-1') { done(400); return json(route, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }) }
        done(200); return json(route, 200, session(user, currentAal(), factors))
      }
      done(200); return json(route, 200, session(user, currentAal(), factors))
    }
    if (path === '/auth/v1/user') { done(200); return json(route, 200, authUser(user, factors)) }
    if (path === '/auth/v1/logout') { done(204); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }) }
    if (path === '/auth/v1/recover') { done(200); return json(route, 200, {}) }
    if (path === '/auth/v1/factors' && method === 'POST') {
      done(200)
      factors = [{ ...VERIFIED_FACTOR, id: '00000000-0000-4000-8000-0000000fac02', status: 'unverified' }]
      return json(route, 200, { id: factors[0].id, type: 'totp', friendly_name: 'Gestione Appalti', totp: { qr_code: QR, secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/GestioneAppalti:demo?secret=JBSWY3DPEHPK3PXP' } })
    }
    let m
    if ((m = path.match(/^\/auth\/v1\/factors\/([^/]+)\/challenge$/))) { done(200); return json(route, 200, { id: 'challenge-1', type: 'totp', expires_at: Math.floor(Date.now() / 1000) + 300 }) }
    if ((m = path.match(/^\/auth\/v1\/factors\/([^/]+)\/verify$/))) {
      const body = JSON.parse(req.postData() || '{}')
      if (body.code !== '123456') { done(422); return json(route, 422, { code: 422, error_code: 'mfa_verification_failed', msg: 'Invalid TOTP code entered' }) }
      mfaState = 'aal2'
      factors = [{ ...VERIFIED_FACTOR, id: m[1] }]
      done(200); return json(route, 200, session(user, 'aal2', factors))
    }
    if ((m = path.match(/^\/auth\/v1\/factors\/([^/]+)$/)) && method === 'DELETE') { done(200); factors = []; return json(route, 200, { id: m[1] }) }

    // ---------- REST ----------
    if (path.startsWith('/rest/v1/rpc/')) {
      // Replica i vincoli CHECK del database reale sulle richieste di intervento.
      if (path.endsWith('/school_create_request_multi_school') || path.endsWith('/school_create_request_multi')) {
        let body = {}; try { body = JSON.parse(req.postData() || '{}') } catch {}
        const priorita = ['programmabile', 'non_urgente', 'media', 'urgente']
        const tipo = ['ordinaria', 'straordinaria', 'da_valutare']
        if ((body.p_priorita != null && !priorita.includes(body.p_priorita)) || (body.p_tipo_intervento != null && !tipo.includes(body.p_tipo_intervento))) {
          done(400); log.writes.push({ method, path, body: req.postData(), rejected: true })
          return json(route, 400, { code: '23514', message: 'new row for relation "richieste_intervento" violates check constraint' })
        }
      }
      done(200); log.writes.push({ method, path, body: req.postData() }); return json(route, 200, null)
    }
    if (path.startsWith('/rest/v1/')) {
      const table = path.slice('/rest/v1/'.length)
      if (method !== 'GET' && method !== 'HEAD') {
        log.writes.push({ method, table, body: req.postData() })
        done(method === 'POST' ? 201 : 200)
        const prefer = req.headers()['prefer'] || ''
        if (!prefer.includes('return=representation')) return route.fulfill({ status: method === 'POST' ? 201 : 204, headers: { 'access-control-allow-origin': '*' } })
        const payload = JSON.parse(req.postData() || '{}')
        return json(route, method === 'POST' ? 201 : 200, (Array.isArray(payload) ? payload : [payload]).map((x) => ({ id: '00000000-0000-4000-8000-00000000ffff', ...x })))
      }
      let rows
      if (table === 'user_roles') rows = userRoles
      else if (table === 'profiles') rows = profiles.map((p) => (p.id === user.id && sc.inactive ? { ...p, attivo: false } : p))
      else if (table in data) rows = data[table]
      else { rows = []; if (!log.unknown.includes(table)) log.unknown.push(table) }
      // Risorse incorporate (uno-a-molti) usate dall'interfaccia: tabella figlia -> colonna di collegamento.
      const EMBEDS = { scuole: { scuole_edifici: 'scuola_id' } }
      const sel = url.searchParams.get('select') || ''
      let filtered = applyFilters(rows, url.searchParams)
      for (const [child, fk] of Object.entries(EMBEDS[table] || {})) {
        if (sel.includes(child + '(') && data[child]) filtered = filtered.map((r) => ({ ...r, [child]: data[child].filter((c) => c[fk] === r.id) }))
      }
      const result = project(filtered, sel)
      const range = result.length ? `0-${result.length - 1}/${result.length}` : '*/0'
      const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object')
      if (single) {
        if (result.length !== 1) { done(406); return json(route, 406, { code: 'PGRST116', details: `The result contains ${result.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' }) }
        done(200); return json(route, 200, result[0], { 'content-range': range })
      }
      done(200)
      if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range', 'content-range': range } })
      return json(route, 200, result, { 'content-range': range })
    }

    // ---------- EDGE FUNCTIONS ----------
    if (path === '/functions/v1/admin-users') {
      const body = JSON.parse(req.postData() || '{}')
      log.functions.push(body)
      const res = adminUsersFunction(body)
      done(res.status)
      return json(route, res.status, res.body)
    }

    // ---------- STORAGE ----------
    if (path.startsWith('/storage/v1/')) {
      done(200)
      if (path.includes('/object/sign/')) return json(route, 200, { signedURL: '/object/sign/documenti/finto.pdf?token=x' })
      if (path.includes('/object/list/')) return json(route, 200, [])
      return json(route, 200, {})
    }

    done(404)
    if (!log.unknown.includes(path)) log.unknown.push(path)
    return json(route, 404, { message: 'Endpoint non simulato: ' + path })
  })
  return log
}

export { USERS }
