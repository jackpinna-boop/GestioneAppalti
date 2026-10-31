import { createClient } from "npm:@supabase/supabase-js@2"

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const allowedOrigins = new Set([
  "https://jackpinna-boop.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
])

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && allowedOrigins.has(origin) ? origin : "https://jackpinna-boop.github.io",
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
})

// ---------------------------------------------------------------------------
// Errori applicativi con codice HTTP esplicito
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const fail = (status: number, message: string): never => {
  throw new HttpError(status, message)
}

// ---------------------------------------------------------------------------
// Client amministrativo (solo lato server)
// ---------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SECRET_KEYS = Deno.env.get("SUPABASE_SECRET_KEYS")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const adminKey = SERVICE_ROLE_KEY || (SECRET_KEYS ? JSON.parse(SECRET_KEYS).default : undefined)
if (!adminKey) throw new Error("Missing Supabase server secret key")

const admin = createClient(SUPABASE_URL, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

const allRoles = [
  "superadmin", "admin_ente", "rup", "tecnico", "amministrativo", "direttore_lavori",
  "auditor", "consultatore", "manutentore", "siservizi",
  "dirigente_scolastico", "delegato_scolastico",
]
const schoolRoles = ["dirigente_scolastico", "delegato_scolastico"]
const BAN_FOREVER = "876000h"

type Actor = { actorId: string; isSuperadmin: boolean; managedEnteIds: string[] }
type RoleRow = { user_id: string; ente_id: string; ruolo: string; enti?: { denominazione?: string } | null }

const today = () => new Date().toISOString().slice(0, 10)

// ---------------------------------------------------------------------------
// Autorizzazione
// ---------------------------------------------------------------------------

async function currentActor(req: Request): Promise<Actor> {
  const auth = req.headers.get("Authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) fail(401, "Autenticazione richiesta")

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) fail(401, "Sessione non valida")
  const actorId = data.user!.id

  const { data: profile, error: profileError } = await admin
    .from("profiles").select("attivo").eq("id", actorId).maybeSingle()
  if (profileError) fail(500, profileError.message)
  if (profile && profile.attivo === false) fail(403, "Utente disattivato")

  const { data: actorRoles, error: roleError } = await admin
    .from("user_roles").select("ente_id,ruolo").eq("user_id", actorId)
  if (roleError) fail(500, roleError.message)

  const isSuperadmin = (actorRoles || []).some((r) => r.ruolo === "superadmin")
  const managedEnteIds = (actorRoles || [])
    .filter((r) => r.ruolo === "superadmin" || r.ruolo === "admin_ente")
    .map((r) => r.ente_id)
  if (!isSuperadmin && !managedEnteIds.length) {
    fail(403, "Utente non autorizzato alla gestione degli utenti")
  }
  return { actorId, isSuperadmin, managedEnteIds }
}

/**
 * Un admin_ente può modificare credenziali o eliminare un utente solo se
 * TUTTI i ruoli dell'utente ricadono negli enti che l'admin gestisce e
 * l'utente non è superadmin. In caso contrario la modifica di email/password
 * o l'eliminazione inciderebbero su accessi ad altri enti (presa di controllo
 * dell'account fuori perimetro).
 */
async function assertCanManageTarget(actor: Actor, targetUserId: string, enteId: string) {
  if (actor.isSuperadmin) return
  if (!enteId || !actor.managedEnteIds.includes(enteId)) {
    fail(403, "Utente non autorizzato o fuori dal perimetro dell'ente.")
  }
  const { data, error } = await admin
    .from("user_roles").select("ente_id,ruolo").eq("user_id", targetUserId)
  if (error) fail(500, error.message)
  const rows = data || []
  if (!rows.some((r) => r.ente_id === enteId)) {
    fail(403, "Utente non autorizzato o fuori dal perimetro dell'ente.")
  }
  if (rows.some((r) => r.ruolo === "superadmin")) {
    fail(403, "Non è consentito modificare un utente superadmin.")
  }
  if (rows.some((r) => !actor.managedEnteIds.includes(r.ente_id))) {
    fail(403, "L'utente ha ruoli in altri enti: la modifica deve essere eseguita da un superadmin.")
  }
}

// ---------------------------------------------------------------------------
// Lettura utenti
// ---------------------------------------------------------------------------

function cleanUser(user: any, profile: any, roles: RoleRow[]) {
  return {
    id: user.id,
    email: user.email || profile?.email || "",
    nome: profile?.nome || user.user_metadata?.nome || "",
    cognome: profile?.cognome || user.user_metadata?.cognome || "",
    telefono: profile?.telefono || "",
    attivo: profile?.attivo !== false && !user.banned_until,
    email_confirmed_at: user.email_confirmed_at,
    last_sign_in_at: user.last_sign_in_at,
    created_at: user.created_at,
    roles: roles.map((r) => ({ ente_id: r.ente_id, ente: r.enti?.denominazione || "", ruolo: r.ruolo })),
  }
}

async function listAllAuthUsers() {
  const users: any[] = []
  const perPage = 1000
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) fail(500, error.message)
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < perPage) break
  }
  return users
}

async function getUsers(actor: Actor) {
  const authUsers = await listAllAuthUsers()
  const { data: profiles, error: pe } = await admin
    .from("profiles").select("id,nome,cognome,email,telefono,attivo")
  if (pe) fail(500, pe.message)
  const { data: roles, error: re } = await admin
    .from("user_roles").select("user_id,ente_id,ruolo,enti(id,denominazione)")
  if (re) fail(500, re.message)

  const managed = actor.isSuperadmin ? null : new Set(actor.managedEnteIds)
  const profileById = new Map((profiles || []).map((p) => [p.id, p]))
  const rolesByUser = new Map<string, RoleRow[]>()
  for (const r of (roles || []) as RoleRow[]) {
    if (managed && !managed.has(r.ente_id)) continue
    const list = rolesByUser.get(r.user_id) || []
    list.push(r)
    rolesByUser.set(r.user_id, list)
  }
  return authUsers
    .filter((u) => actor.isSuperadmin || rolesByUser.has(u.id))
    .map((u) => cleanUser(u, profileById.get(u.id), rolesByUser.get(u.id) || []))
    .sort((a, b) => (a.cognome + a.nome + a.email).localeCompare(b.cognome + b.nome + b.email, "it"))
}

const findUser = async (actor: Actor, id: string) => (await getUsers(actor)).find((u) => u.id === id)

// ---------------------------------------------------------------------------
// Azioni
// ---------------------------------------------------------------------------

async function createUserAction(actor: Actor, body: any) {
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const nome = String(body.nome || "").trim()
  const cognome = String(body.cognome || "").trim()
  const telefono = String(body.telefono || "").trim() || null
  const enteId = String(body.ente_id || "")
  const ruolo = String(body.ruolo || "tecnico")
  const attivo = body.attivo !== false

  if (!email || !password || password.length < 8 || !enteId || !allRoles.includes(ruolo)) {
    fail(400, "Email, password (minimo 8 caratteri), ente e ruolo sono obbligatori.")
  }
  if (!actor.isSuperadmin && (!actor.managedEnteIds.includes(enteId) || ruolo === "superadmin")) {
    fail(403, "Non autorizzato per questo ente/ruolo.")
  }

  const { data: created, error: ce } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nome, cognome },
    ...(attivo ? {} : { ban_duration: BAN_FOREVER }),
  })
  if (ce || !created?.user) fail(400, ce?.message || "Creazione utente fallita.")
  const uid = created!.user!.id

  const { error: pe } = await admin.from("profiles").upsert({ id: uid, nome, cognome, email, telefono, attivo })
  if (pe) {
    await admin.auth.admin.deleteUser(uid)
    fail(500, "Profilo utente non creato: " + pe.message)
  }
  const { error: re } = await admin.from("user_roles").insert({ user_id: uid, ente_id: enteId, ruolo })
  if (re) {
    await admin.from("profiles").delete().eq("id", uid)
    await admin.auth.admin.deleteUser(uid)
    fail(500, "Ruolo utente non creato: " + re.message)
  }
  return { user: await findUser(actor, uid) }
}

async function schoolAssociateAction(actor: Actor, body: any) {
  const userId = String(body.user_id || "").trim()
  const schoolId = String(body.scuola_id || "").trim()
  const ruolo = String(body.ruolo || "").trim()
  const attivo = body.attivo !== false
  const dataFine = body.data_fine ? String(body.data_fine) : null
  const buildingIds: string[] = Array.isArray(body.edificio_ids)
    ? [...new Set<string>(body.edificio_ids.map((x: unknown) => String(x)).filter(Boolean))]
    : []

  if (!userId || !schoolId || !schoolRoles.includes(ruolo) || !buildingIds.length) {
    fail(400, "Utente, istituto, ruolo scolastico e almeno un edificio sono obbligatori.")
  }

  const { data: school, error: se } = await admin
    .from("scuole").select("id,ente_id").eq("id", schoolId).maybeSingle()
  if (se) fail(500, se.message)
  if (!school) fail(404, "Istituto non trovato.")
  if (!actor.isSuperadmin && !actor.managedEnteIds.includes(school!.ente_id)) {
    fail(403, "Non autorizzato a gestire questo istituto.")
  }

  const { data: targetRoles, error: tre } = await admin
    .from("user_roles").select("ente_id,ruolo").eq("user_id", userId)
  if (tre) fail(500, tre.message)
  if (!(targetRoles || []).some((r) => r.ente_id === school!.ente_id)) {
    fail(400, "L'utente non appartiene all'ente selezionato.")
  }
  if (!actor.isSuperadmin && (targetRoles || []).some((r) => r.ruolo === "superadmin")) {
    fail(403, "Non è consentito modificare un utente superadmin.")
  }

  const { data: buildings, error: be } = await admin
    .from("scuole_edifici").select("edificio_id")
    .eq("scuola_id", schoolId).eq("attivo", true).in("edificio_id", buildingIds)
  if (be) fail(500, be.message)
  if ((buildings || []).length !== buildingIds.length) {
    fail(400, "Uno o più edifici selezionati non sono associati all'istituto.")
  }

  const { data: existing, error: ee } = await admin
    .from("scuola_utenti").select("id,ruolo,data_inizio")
    .eq("scuola_id", schoolId).eq("user_id", userId).maybeSingle()
  if (ee) fail(500, ee.message)

  const payload = {
    scuola_id: schoolId, user_id: userId, ruolo, attivo,
    data_inizio: existing?.data_inizio || today(), data_fine: dataFine,
  }
  const { data: su, error: sue } = existing
    ? await admin.from("scuola_utenti").update(payload).eq("id", existing.id).select("id").single()
    : await admin.from("scuola_utenti").insert(payload).select("id").single()
  if (sue || !su) fail(400, sue?.message || "Associazione utente/istituto non riuscita.")
  const schoolUserId = su!.id

  const { error: re } = await admin.from("user_roles").upsert(
    { user_id: userId, ente_id: school!.ente_id, ruolo },
    { onConflict: "user_id,ente_id,ruolo" },
  )
  if (re) fail(400, "Ruolo scolastico non aggiornato: " + re.message)

  const oldRole = existing?.ruolo
  if (oldRole && oldRole !== ruolo) {
    const { data: other, error: oe } = await admin
      .from("scuola_utenti").select("id")
      .eq("user_id", userId).eq("ruolo", oldRole).eq("attivo", true).neq("id", schoolUserId).limit(1)
    if (oe) fail(500, oe.message)
    if (!other?.length) {
      const { error: de } = await admin.from("user_roles").delete()
        .eq("user_id", userId).eq("ente_id", school!.ente_id).eq("ruolo", oldRole)
      if (de) fail(500, "Ruolo scolastico precedente non rimosso: " + de.message)
    }
  }

  const { error: dae } = await admin.from("scuola_utenti_edifici").delete().eq("scuola_utente_id", schoolUserId)
  if (dae) fail(500, "Edifici autorizzati non aggiornati: " + dae.message)
  const assignmentRows = buildingIds.map((edificio_id) => ({
    scuola_utente_id: schoolUserId, edificio_id, attivo: true, data_inizio: today(), data_fine: dataFine,
  }))
  const { error: ae } = await admin.from("scuola_utenti_edifici").insert(assignmentRows)
  if (ae) fail(400, "Edifici autorizzati non aggiornati: " + ae.message)

  return { ok: true, school_user_id: schoolUserId }
}

async function deleteUserAction(actor: Actor, body: any) {
  const userId = String(body.user_id || "")
  if (!userId || userId === actor.actorId) {
    fail(400, "Non è possibile modificare o eliminare il proprio utente da questa sezione.")
  }
  await assertCanManageTarget(actor, userId, String(body.ente_id || ""))
  const { error } = await admin.auth.admin.deleteUser(userId, false)
  if (error) fail(400, error.message)
  return { ok: true }
}

async function updateUserAction(actor: Actor, body: any) {
  const userId = String(body.user_id || "")
  if (!userId || userId === actor.actorId) {
    fail(400, "Non è possibile modificare o eliminare il proprio utente da questa sezione.")
  }
  const targetEnteId = String(body.ente_id || "")
  await assertCanManageTarget(actor, userId, targetEnteId)

  const nome = String(body.nome || "").trim()
  const cognome = String(body.cognome || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const telefono = String(body.telefono || "").trim() || null
  const attivo = body.attivo !== false
  const password = String(body.password || "")
  const ruoloRichiesto = String(body.ruolo || "")

  if (password && password.length < 8) fail(400, "La password deve avere almeno 8 caratteri.")
  if (ruoloRichiesto && !allRoles.includes(ruoloRichiesto)) fail(400, "Ruolo non valido.")
  if (ruoloRichiesto === "superadmin" && !actor.isSuperadmin) fail(403, "Non autorizzato ad assegnare superadmin.")

  const attrs: Record<string, unknown> = {
    user_metadata: { nome, cognome },
    ban_duration: attivo ? "none" : BAN_FOREVER,
    ...(email ? { email, email_confirm: true } : {}),
    ...(password ? { password } : {}),
  }
  const { error: ue } = await admin.auth.admin.updateUserById(userId, attrs)
  if (ue) fail(400, ue.message)

  const { error: pe } = await admin.from("profiles")
    .update({ nome, cognome, email: email || null, telefono, attivo }).eq("id", userId)
  if (pe) fail(500, "Profilo non aggiornato: " + pe.message)

  if (targetEnteId && ruoloRichiesto) {
    const { error: delRoleError } = await admin.from("user_roles").delete()
      .eq("user_id", userId).eq("ente_id", targetEnteId)
    if (delRoleError) fail(400, "Ruolo precedente non rimosso: " + delRoleError.message)
    const { error: re } = await admin.from("user_roles")
      .insert({ user_id: userId, ente_id: targetEnteId, ruolo: ruoloRichiesto })
    if (re) fail(400, "Ruolo non aggiornato: " + re.message)
  }
  return { user: await findUser(actor, userId) }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("Origin"))
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers })

  if (req.method === "OPTIONS") return new Response("ok", { headers })
  if (req.method !== "POST") return reply({ error: "Metodo non consentito." }, 405)

  try {
    const actor = await currentActor(req)
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "list")

    switch (action) {
      case "list": return reply({ users: await getUsers(actor) })
      case "create": return reply(await createUserAction(actor, body))
      case "school_associate": return reply(await schoolAssociateAction(actor, body))
      case "update": return reply(await updateUserAction(actor, body))
      case "delete": return reply(await deleteUserAction(actor, body))
      default: return reply({ error: "Azione non supportata." }, 400)
    }
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status)
    console.error("admin-users: errore non gestito", error)
    return reply({ error: "Errore interno del servizio." }, 500)
  }
})
