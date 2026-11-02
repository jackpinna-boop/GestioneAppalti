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

type Actor = { actorId: string; isSuperadmin: boolean; managedEnteIds: string[]; email: string }
type RoleRow = { user_id: string; ente_id: string; ruolo: string; enti?: { denominazione?: string } | null }

const today = () => new Date().toISOString().slice(0, 10)

// ---------------------------------------------------------------------------
// Autorizzazione
// ---------------------------------------------------------------------------

/**
 * Identifica l'utente che invoca la funzione (sessione valida, profilo attivo).
 * NON autorizza nulla: ogni azione deve poi chiamare requireAdmin oppure
 * schoolHeadScope (ramo dedicato al dirigente scolastico).
 */
async function authenticate(req: Request): Promise<Actor> {
  const auth = req.headers.get("Authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) fail(401, "Autenticazione richiesta")

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) fail(401, "Sessione non valida")
  const actorId = data.user!.id
  const email = data.user!.email || ""

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
  return { actorId, isSuperadmin, managedEnteIds, email }
}

/** Azioni amministrative: solo superadmin e admin_ente (comportamento invariato). */
function requireAdmin(actor: Actor): Actor {
  if (!actor.isSuperadmin && !actor.managedEnteIds.length) {
    fail(403, "Utente non autorizzato alla gestione degli utenti")
  }
  return actor
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
    // Fattori MFA restituiti da GoTrue con l'utente (null se l'informazione non è disponibile).
    mfa_attiva: Array.isArray(user.factors)
      ? user.factors.some((f: any) => f?.status === "verified")
      : null,
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

/**
 * Sostituisce il solo ruolo gestionale dell'utente nell'ente.
 * I ruoli scolastici (dirigente_scolastico, delegato_scolastico) sono gestiti
 * dall'azione school_associate e non vengono mai rimossi da qui.
 * Il nuovo ruolo è inserito prima di eliminare i precedenti, così un errore
 * non lascia l'utente senza ruolo.
 */
async function replaceManagementRole(userId: string, enteId: string, ruolo: string) {
  const { data: current, error: ce } = await admin
    .from("user_roles").select("ruolo").eq("user_id", userId).eq("ente_id", enteId)
  if (ce) fail(500, ce.message)
  const currentRoles = (current || []).map((r) => String(r.ruolo))

  // Un ruolo scolastico già posseduto non comporta modifiche (controllo
  // preventivo in updateUserAction per i ruoli scolastici non posseduti).
  if (schoolRoles.includes(ruolo)) return

  const { error: re } = await admin.from("user_roles").upsert(
    { user_id: userId, ente_id: enteId, ruolo },
    { onConflict: "user_id,ente_id,ruolo" },
  )
  if (re) fail(400, "Ruolo non aggiornato: " + re.message)

  const toRemove = currentRoles.filter((r) => r !== ruolo && !schoolRoles.includes(r))
  if (toRemove.length) {
    const { error: de } = await admin.from("user_roles").delete()
      .eq("user_id", userId).eq("ente_id", enteId).in("ruolo", toRemove)
    if (de) fail(400, "Ruolo precedente non rimosso: " + de.message)
  }
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
  if (targetEnteId && schoolRoles.includes(ruoloRichiesto)) {
    const { data: owned, error: oe } = await admin.from("user_roles").select("ruolo")
      .eq("user_id", userId).eq("ente_id", targetEnteId).eq("ruolo", ruoloRichiesto).limit(1)
    if (oe) fail(500, oe.message)
    if (!owned?.length) fail(400, "I ruoli scolastici si assegnano dall'associazione utente/istituto.")
  }

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

  if (targetEnteId && ruoloRichiesto) await replaceManagementRole(userId, targetEnteId, ruoloRichiesto)
  return { user: await findUser(actor, userId) }
}

// ---------------------------------------------------------------------------
// Dirigente scolastico: gestione dei propri delegati
// ---------------------------------------------------------------------------

type HeadSchool = {
  scuola_id: string
  ente_id: string
  denominazione: string
  codice_meccanografico: string | null
  edificio_ids: string[]
}
type DelegateLink = {
  id: string; scuola_id: string; user_id: string; ruolo: string; attivo: boolean
  data_inizio: string | null; data_fine: string | null
}

const DELEGATE = "delegato_scolastico"
const isIsoDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + "T00:00:00Z").getTime())
const validOn = (
  row: { attivo: boolean; data_inizio?: string | null; data_fine?: string | null },
  day: string,
) => row.attivo === true && (!row.data_inizio || row.data_inizio <= day) && (!row.data_fine || row.data_fine >= day)
const uniqueIds = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set<string>(v.map((x: unknown) => String(x).trim()).filter(Boolean))] : []

/**
 * Perimetro del dirigente scolastico: scuole attive su cui l'attore ha una
 * associazione dirigente_scolastico attiva e non scaduta (e il ruolo
 * corrispondente in user_roles nell'ente della scuola), con i soli edifici
 * che gli sono assegnati in modo attivo e ancora associati alla scuola.
 * Stessi criteri di public.school_user_has_building.
 */
async function schoolHeadScope(actor: Actor): Promise<HeadSchool[]> {
  const day = today()
  const { data: links, error } = await admin.from("scuola_utenti")
    .select("id,scuola_id,attivo,data_inizio,data_fine")
    .eq("user_id", actor.actorId).eq("ruolo", "dirigente_scolastico").eq("attivo", true)
  if (error) fail(500, error.message)
  const active = (links || []).filter((l) => validOn(l, day))
  if (!active.length) return []
  const schoolIds = [...new Set(active.map((l) => String(l.scuola_id)))]

  const [schoolsRes, rolesRes, assignRes, sbRes] = await Promise.all([
    admin.from("scuole").select("id,ente_id,denominazione,codice_meccanografico")
      .in("id", schoolIds).eq("attiva", true),
    admin.from("user_roles").select("ente_id")
      .eq("user_id", actor.actorId).eq("ruolo", "dirigente_scolastico"),
    admin.from("scuola_utenti_edifici").select("scuola_utente_id,edificio_id,attivo,data_inizio,data_fine")
      .in("scuola_utente_id", active.map((l) => l.id)).eq("attivo", true),
    admin.from("scuole_edifici").select("scuola_id,edificio_id").in("scuola_id", schoolIds).eq("attivo", true),
  ])
  for (const r of [schoolsRes, rolesRes, assignRes, sbRes]) if (r.error) fail(500, r.error.message)

  const roleEnti = new Set((rolesRes.data || []).map((r) => String(r.ente_id)))
  const linked = new Set((sbRes.data || []).map((x) => `${x.scuola_id}|${x.edificio_id}`))
  return (schoolsRes.data || [])
    .filter((s) => roleEnti.has(String(s.ente_id)))
    .map((s) => {
      const link = active.find((l) => l.scuola_id === s.id)!
      const edificio_ids = [...new Set((assignRes.data || [])
        .filter((a) => a.scuola_utente_id === link.id && validOn(a, day) && linked.has(`${s.id}|${a.edificio_id}`))
        .map((a) => String(a.edificio_id)))]
      return {
        scuola_id: String(s.id), ente_id: String(s.ente_id), denominazione: String(s.denominazione || ""),
        codice_meccanografico: s.codice_meccanografico ?? null, edificio_ids,
      }
    })
}

async function requireSchoolHead(actor: Actor, schoolId: string) {
  if (!schoolId) fail(400, "Indica l'istituto.")
  const scope = await schoolHeadScope(actor)
  const school = scope.find((s) => s.scuola_id === schoolId)
  if (!school) fail(403, "Operazione riservata al dirigente scolastico attivo dell'istituto.")
  return { school: school!, scope }
}

async function rolesOf(userId: string) {
  const { data, error } = await admin.from("user_roles").select("ente_id,ruolo").eq("user_id", userId)
  if (error) fail(500, error.message)
  return (data || []) as { ente_id: string; ruolo: string }[]
}

/** Il dirigente gestisce solo utenti che nel sistema sono esclusivamente delegati scolastici. */
function assertOnlyDelegateRoles(roles: { ruolo: string }[]) {
  if (roles.some((r) => r.ruolo !== DELEGATE)) {
    fail(403, "L'utente ha altri ruoli nel sistema (personale dell'ente o dirigente): la delega deve essere gestita dall'amministrazione dell'ente.")
  }
}

async function loadDelegateLink(schoolId: string, userId: string): Promise<DelegateLink> {
  const { data, error } = await admin.from("scuola_utenti")
    .select("id,scuola_id,user_id,ruolo,attivo,data_inizio,data_fine")
    .eq("scuola_id", schoolId).eq("user_id", userId).maybeSingle()
  if (error) fail(500, error.message)
  if (!data || data.ruolo !== DELEGATE) fail(404, "Delegato non trovato per questo istituto.")
  return data as DelegateLink
}

async function hasActiveAssignments(schoolUserId: string) {
  const { data, error } = await admin.from("scuola_utenti_edifici").select("id")
    .eq("scuola_utente_id", schoolUserId).eq("attivo", true).limit(1)
  if (error) fail(500, error.message)
  return !!data?.length
}

async function schoolLog(actor: Actor, school: HeadSchool, azione: string, metadata: Record<string, unknown>) {
  const { error } = await admin.from("scuola_access_log").insert({
    user_id: actor.actorId, ente_id: school.ente_id, scuola_id: school.scuola_id, azione,
    metadata: { origine: "PORTALE_SCUOLA", ...metadata },
  })
  if (error) console.error("admin-users: registrazione in scuola_access_log non riuscita", azione, error.message)
}

async function findAuthUserByEmail(email: string) {
  const { data: profile, error } = await admin.from("profiles").select("id").ilike("email", email).limit(1)
  if (error) fail(500, error.message)
  if (profile?.length) {
    const { data } = await admin.auth.admin.getUserById(String(profile[0].id))
    if (data?.user && String(data.user.email || "").toLowerCase() === email) return data.user
  }
  return (await listAllAuthUsers()).find((u) => String(u.email || "").toLowerCase() === email) || null
}

/**
 * Password temporanea generata lato server (16 caratteri senza simboli ambigui),
 * restituita una sola volta al dirigente che la comunica al delegato.
 * Scelta preferita a inviteUserByEmail: l'invito dipende dalla configurazione
 * SMTP del progetto (il servizio predefinito ha limiti di invio molto bassi e
 * recapita solo a indirizzi autorizzati) e da un URL di reindirizzamento; la
 * password temporanea funziona sempre e il primo accesso passa comunque dalla
 * registrazione obbligatoria della verifica in due passaggi (MfaGate).
 */
function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const chars = [...bytes].map((b) => alphabet[b % alphabet.length])
    const pwd = [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-")
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd)) return pwd
  }
}

async function schoolDelegatesListAction(actor: Actor) {
  const scope = await schoolHeadScope(actor)
  if (!scope.length) fail(403, "Operazione riservata ai dirigenti scolastici attivi.")
  const day = today()
  const schoolIds = scope.map((s) => s.scuola_id)
  const allBuildings = [...new Set(scope.flatMap((s) => s.edificio_ids))]

  const { data: buildings, error: be } = allBuildings.length
    ? await admin.from("edifici").select("id,denominazione,codice_edificio,comune").in("id", allBuildings)
    : { data: [], error: null }
  if (be) fail(500, be.message)
  const buildingById = new Map((buildings || []).map((b) => [String(b.id), b]))

  const { data: links, error: le } = await admin.from("scuola_utenti")
    .select("id,scuola_id,user_id,ruolo,attivo,data_inizio,data_fine")
    .in("scuola_id", schoolIds).eq("ruolo", DELEGATE)
  if (le) fail(500, le.message)
  const delegateLinks = ((links || []) as DelegateLink[]).filter((l) => l.user_id !== actor.actorId)
  const userIds = [...new Set(delegateLinks.map((l) => l.user_id))]

  let assignments: any[] = [], profiles: any[] = [], roles: any[] = [], otherLinks: any[] = []
  if (delegateLinks.length) {
    const [a, p, r, o] = await Promise.all([
      admin.from("scuola_utenti_edifici").select("scuola_utente_id,edificio_id,attivo,data_inizio,data_fine")
        .in("scuola_utente_id", delegateLinks.map((l) => l.id)),
      admin.from("profiles").select("id,nome,cognome,email,telefono,attivo").in("id", userIds),
      admin.from("user_roles").select("user_id,ruolo").in("user_id", userIds),
      admin.from("scuola_utenti").select("user_id,scuola_id,attivo").in("user_id", userIds).eq("attivo", true),
    ])
    for (const x of [a, p, r, o]) if (x.error) fail(500, x.error.message)
    assignments = a.data || []; profiles = p.data || []; roles = r.data || []; otherLinks = o.data || []
  }

  // Stato del secondo fattore: una chiamata per delegato (numeri contenuti).
  const authInfo = new Map<string, { email: string; mfa: boolean | null }>()
  await Promise.all(userIds.map(async (id) => {
    const [u, f] = await Promise.all([
      admin.auth.admin.getUserById(id),
      admin.auth.admin.mfa.listFactors({ userId: id }),
    ])
    authInfo.set(id, {
      email: u.data?.user?.email || "",
      mfa: f.error ? null : (f.data?.factors || []).some((x: any) => x.status === "verified"),
    })
  }))

  const profileById = new Map(profiles.map((p) => [String(p.id), p]))
  const delegates = delegateLinks.map((l) => {
    const school = scope.find((s) => s.scuola_id === l.scuola_id)!
    const current = assignments.filter((a) => a.scuola_utente_id === l.id && a.attivo === true)
    const inScope = current.filter((a) => school.edificio_ids.includes(String(a.edificio_id)))
    const userRoles = roles.filter((r) => r.user_id === l.user_id)
    const gestibile = !userRoles.some((r) => r.ruolo !== DELEGATE)
    const stato = !l.attivo && !current.length ? "revocato"
      : !l.attivo ? "sospeso"
      : l.data_fine && l.data_fine < day ? "scaduto"
      : "attivo"
    const p = profileById.get(l.user_id)
    const info = authInfo.get(l.user_id)
    return {
      scuola_utente_id: l.id, scuola_id: l.scuola_id, user_id: l.user_id,
      email: info?.email || p?.email || "", nome: p?.nome || "", cognome: p?.cognome || "", telefono: p?.telefono || "",
      stato, attivo: l.attivo, data_inizio: l.data_inizio, data_fine: l.data_fine,
      edifici: inScope.map((a) => {
        const b = buildingById.get(String(a.edificio_id))
        return { id: String(a.edificio_id), denominazione: b?.denominazione || "Edificio", data_fine: a.data_fine }
      }),
      altri_edifici: current.length - inScope.length,
      gestibile,
      mfa_attiva: info ? info.mfa : null,
      mfa_azzerabile: gestibile && otherLinks
        .filter((o) => o.user_id === l.user_id)
        .every((o) => schoolIds.includes(String(o.scuola_id))),
    }
  }).sort((a, b) => (a.cognome + a.nome + a.email).localeCompare(b.cognome + b.nome + b.email, "it"))

  return {
    schools: scope.map((s) => ({
      id: s.scuola_id, denominazione: s.denominazione, codice_meccanografico: s.codice_meccanografico,
      edifici: s.edificio_ids.map((id) => {
        const b = buildingById.get(id)
        return { id, denominazione: b?.denominazione || "Edificio", comune: b?.comune || "" }
      }).sort((a, b) => a.denominazione.localeCompare(b.denominazione, "it")),
    })),
    delegates,
  }
}

/**
 * Aggiunge (user_id assente: ricerca per e-mail, eventuale creazione dell'utenza)
 * o modifica (user_id presente) la delega di un istituto del dirigente.
 */
async function schoolDelegateSaveAction(actor: Actor, body: any) {
  const { school } = await requireSchoolHead(actor, String(body.scuola_id || "").trim())
  const requestedUserId = String(body.user_id || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const nome = String(body.nome || "").trim()
  const cognome = String(body.cognome || "").trim()
  const telefono = String(body.telefono || "").trim() || null
  const dataFine = body.data_fine ? String(body.data_fine).trim() : null
  const buildingIds = uniqueIds(body.edificio_ids)
  const day = today()

  if (dataFine && (!isIsoDate(dataFine) || dataFine < day)) {
    fail(400, "La data di fine deve essere una data valida non anteriore a oggi.")
  }
  if (!buildingIds.length) fail(400, "Seleziona almeno un edificio.")
  if (buildingIds.some((id) => !school.edificio_ids.includes(id))) {
    fail(403, "Puoi assegnare solo edifici dell'istituto che sono assegnati a te.")
  }

  let userId = requestedUserId
  let created = false
  let tempPassword: string | null = null
  let targetEmail = email
  if (!userId) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Indica un indirizzo e-mail valido.")
    if (!nome || !cognome) fail(400, "Nome e cognome sono obbligatori.")
    const existing = await findAuthUserByEmail(email)
    if (existing) userId = existing.id
  }
  if (userId === actor.actorId) fail(400, "Non puoi nominare te stesso come delegato.")

  if (userId) {
    assertOnlyDelegateRoles(await rolesOf(userId))
    // Utenza esistente: profilo creato solo se mancante (dati anagrafici non sovrascritti).
    const { data: prof, error: pfe } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle()
    if (pfe) fail(500, pfe.message)
    if (!prof) {
      const { error: pie } = await admin.from("profiles").insert({ id: userId, nome, cognome, email: email || null, telefono, attivo: true })
      if (pie) fail(500, "Profilo utente non creato: " + pie.message)
    }
  } else {
    tempPassword = temporaryPassword()
    const { data: c, error: ce } = await admin.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
      user_metadata: { nome, cognome, password_temporanea: true },
    })
    if (ce || !c?.user) fail(400, "Creazione dell'utenza non riuscita: " + (ce?.message || "errore sconosciuto"))
    userId = c!.user!.id
    created = true
    const { error: pe } = await admin.from("profiles").upsert({ id: userId, nome, cognome, email, telefono, attivo: true })
    if (pe) {
      await admin.auth.admin.deleteUser(userId)
      fail(500, "Profilo utente non creato: " + pe.message)
    }
  }

  try {
    const { data: existingLink, error: ee } = await admin.from("scuola_utenti")
      .select("id,scuola_id,user_id,ruolo,attivo,data_inizio,data_fine")
      .eq("scuola_id", school.scuola_id).eq("user_id", userId).maybeSingle()
    if (ee) fail(500, ee.message)
    if (existingLink && existingLink.ruolo !== DELEGATE) fail(403, "L'utente è già dirigente dell'istituto.")
    if (requestedUserId && !existingLink) fail(404, "Delegato non trovato per questo istituto.")

    const wasRevoked = !!existingLink && !existingLink.attivo && !(await hasActiveAssignments(existingLink.id))
    // Nuova delega o delega revocata: attiva. Modifica: lo stato (attivo/sospeso) resta invariato.
    const attivo = !existingLink || wasRevoked ? true : existingLink.attivo
    const payload = {
      scuola_id: school.scuola_id, user_id: userId, ruolo: DELEGATE, attivo,
      data_inizio: existingLink && !wasRevoked ? existingLink.data_inizio || day : day, data_fine: dataFine,
    }
    const { data: su, error: sue } = existingLink
      ? await admin.from("scuola_utenti").update(payload).eq("id", existingLink.id).select("id").single()
      : await admin.from("scuola_utenti").insert(payload).select("id").single()
    if (sue || !su) fail(400, "Delega non salvata: " + (sue?.message || "errore sconosciuto"))
    const schoolUserId = String(su!.id)

    const { error: re } = await admin.from("user_roles").upsert(
      { user_id: userId, ente_id: school.ente_id, ruolo: DELEGATE },
      { onConflict: "user_id,ente_id,ruolo" },
    )
    if (re) fail(400, "Ruolo di delegato non assegnato: " + re.message)

    // Edifici: si modificano solo quelli del perimetro del dirigente; le altre
    // assegnazioni (eventualmente decise dall'ente) restano invariate.
    const { data: current, error: ce } = await admin.from("scuola_utenti_edifici")
      .select("id,edificio_id,attivo").eq("scuola_utente_id", schoolUserId)
    if (ce) fail(500, ce.message)
    const currentIds = new Set((current || []).map((a) => String(a.edificio_id)))
    const toUpdate = buildingIds.filter((id) => currentIds.has(id))
    const toInsert = buildingIds.filter((id) => !currentIds.has(id))
    const toDisable = (current || [])
      .filter((a) => a.attivo && school.edificio_ids.includes(String(a.edificio_id)) && !buildingIds.includes(String(a.edificio_id)))
      .map((a) => String(a.edificio_id))
    if (toUpdate.length) {
      const { error } = await admin.from("scuola_utenti_edifici").update({ attivo: true, data_fine: dataFine })
        .eq("scuola_utente_id", schoolUserId).in("edificio_id", toUpdate)
      if (error) fail(400, "Edifici non aggiornati: " + error.message)
    }
    if (toInsert.length) {
      const { error } = await admin.from("scuola_utenti_edifici").insert(toInsert.map((edificio_id) => ({
        scuola_utente_id: schoolUserId, edificio_id, attivo: true, data_inizio: day, data_fine: dataFine,
      })))
      if (error) fail(400, "Edifici non assegnati: " + error.message)
    }
    if (toDisable.length) {
      const { error } = await admin.from("scuola_utenti_edifici").update({ attivo: false, data_fine: day })
        .eq("scuola_utente_id", schoolUserId).in("edificio_id", toDisable)
      if (error) fail(400, "Edifici non rimossi: " + error.message)
    }

    if (!targetEmail) {
      const { data: u } = await admin.auth.admin.getUserById(userId)
      targetEmail = u?.user?.email || ""
    }
    const added = !existingLink || wasRevoked
    await schoolLog(actor, school, added ? "DELEGATO_AGGIUNTO" : "DELEGATO_MODIFICATO", {
      delegato_user_id: userId, email: targetEmail, edifici: buildingIds, edifici_rimossi: toDisable,
      data_fine: dataFine, utenza_creata: created,
    })
    return { ok: true, user_id: userId, scuola_utente_id: schoolUserId, utenza_creata: created, password_temporanea: tempPassword }
  } catch (err) {
    if (created) {
      // Annulla la creazione dell'utenza per non lasciare account senza delega.
      await admin.from("scuola_utenti").delete().eq("scuola_id", school.scuola_id).eq("user_id", userId)
      await admin.from("user_roles").delete().eq("user_id", userId)
      await admin.from("profiles").delete().eq("id", userId)
      await admin.auth.admin.deleteUser(userId)
    }
    throw err
  }
}

/** Sospende (attivo=false, assegnazioni conservate) o riattiva una delega. */
async function schoolDelegateStatusAction(actor: Actor, body: any) {
  const { school } = await requireSchoolHead(actor, String(body.scuola_id || "").trim())
  const userId = String(body.user_id || "").trim()
  if (typeof body.attivo !== "boolean") fail(400, "Stato della delega non indicato.")
  const attivo = body.attivo as boolean
  if (!userId || userId === actor.actorId) fail(400, "Delegato non valido.")
  const link = await loadDelegateLink(school.scuola_id, userId)
  if (attivo) {
    if (!(await hasActiveAssignments(link.id))) {
      fail(400, "La delega è stata revocata: per ripristinarla usa «Modifica» e assegna gli edifici.")
    }
    assertOnlyDelegateRoles(await rolesOf(userId))
  }
  const { error } = await admin.from("scuola_utenti").update({ attivo }).eq("id", link.id)
  if (error) fail(400, "Stato della delega non aggiornato: " + error.message)
  if (attivo) {
    const { error: re } = await admin.from("user_roles").upsert(
      { user_id: userId, ente_id: school.ente_id, ruolo: DELEGATE },
      { onConflict: "user_id,ente_id,ruolo" },
    )
    if (re) fail(400, "Ruolo di delegato non ripristinato: " + re.message)
  }
  await schoolLog(actor, school, attivo ? "DELEGATO_RIATTIVATO" : "DELEGATO_SOSPESO", { delegato_user_id: userId })
  return { ok: true }
}

/**
 * Revoca la delega: disattiva l'associazione e le assegnazioni degli edifici;
 * rimuove il ruolo delegato_scolastico dall'ente solo se l'utente non ha altre
 * deleghe attive in istituti dello stesso ente. L'utenza non viene eliminata.
 */
async function schoolDelegateRevokeAction(actor: Actor, body: any) {
  const { school } = await requireSchoolHead(actor, String(body.scuola_id || "").trim())
  const userId = String(body.user_id || "").trim()
  if (!userId || userId === actor.actorId) fail(400, "Delegato non valido.")
  const link = await loadDelegateLink(school.scuola_id, userId)
  const day = today()

  const { error: ue } = await admin.from("scuola_utenti")
    .update({ attivo: false, data_fine: link.data_fine && link.data_fine < day ? link.data_fine : day })
    .eq("id", link.id)
  if (ue) fail(400, "Delega non revocata: " + ue.message)
  const { error: ae } = await admin.from("scuola_utenti_edifici").update({ attivo: false, data_fine: day })
    .eq("scuola_utente_id", link.id).eq("attivo", true)
  if (ae) fail(400, "Assegnazioni degli edifici non revocate: " + ae.message)

  const { data: others, error: oe } = await admin.from("scuola_utenti").select("scuola_id")
    .eq("user_id", userId).eq("ruolo", DELEGATE).eq("attivo", true).neq("id", link.id)
  if (oe) fail(500, oe.message)
  let sameEnte = 0
  if (others?.length) {
    const { data: ss, error: se } = await admin.from("scuole").select("id")
      .in("id", others.map((o) => o.scuola_id)).eq("ente_id", school.ente_id)
    if (se) fail(500, se.message)
    sameEnte = ss?.length || 0
  }
  let roleRemoved = false
  if (!sameEnte) {
    const { error: de } = await admin.from("user_roles").delete()
      .eq("user_id", userId).eq("ente_id", school.ente_id).eq("ruolo", DELEGATE)
    if (de) fail(500, "Ruolo di delegato non rimosso: " + de.message)
    roleRemoved = true
  }
  await schoolLog(actor, school, "DELEGATO_REVOCATO", { delegato_user_id: userId, ruolo_rimosso: roleRemoved })
  return { ok: true, ruolo_rimosso: roleRemoved }
}

// ---------------------------------------------------------------------------
// Azzeramento della verifica in due passaggi (MFA)
// ---------------------------------------------------------------------------

/**
 * Elimina tutti i fattori MFA dell'utente: al successivo accesso l'utente
 * registra di nuovo l'app di autenticazione (flusso di MfaGate).
 * - con scuola_id: dirigente scolastico attivo dell'istituto, solo per propri
 *   delegati (solo ruolo delegato_scolastico, deleghe attive solo in istituti
 *   che dirige);
 * - senza scuola_id: superadmin per chiunque, admin_ente con le regole di
 *   assertCanManageTarget.
 * Nessuno può azzerare il proprio fattore da qui.
 */
async function mfaResetAction(actor: Actor, body: any) {
  const userId = String(body.user_id || "").trim()
  if (!userId) fail(400, "Utente non indicato.")
  if (userId === actor.actorId) {
    fail(400, "Non è possibile azzerare la propria verifica in due passaggi da questa sezione.")
  }
  const schoolId = String(body.scuola_id || "").trim()
  let enteId: string | null = null
  let school: HeadSchool | null = null

  if (schoolId) {
    const head = await requireSchoolHead(actor, schoolId)
    school = head.school
    await loadDelegateLink(schoolId, userId)
    assertOnlyDelegateRoles(await rolesOf(userId))
    const { data: links, error } = await admin.from("scuola_utenti").select("scuola_id")
      .eq("user_id", userId).eq("attivo", true)
    if (error) fail(500, error.message)
    const mine = new Set(head.scope.map((s) => s.scuola_id))
    if ((links || []).some((l) => !mine.has(String(l.scuola_id)))) {
      fail(403, "Il delegato opera anche in altri istituti: l'azzeramento deve essere eseguito dall'amministrazione dell'ente.")
    }
    enteId = school.ente_id
  } else {
    requireAdmin(actor)
    enteId = String(body.ente_id || "").trim() || null
    if (actor.isSuperadmin) {
      if (!enteId) enteId = (await rolesOf(userId))[0]?.ente_id || null
    } else {
      await assertCanManageTarget(actor, userId, enteId || "")
    }
  }

  const { data: target, error: te } = await admin.auth.admin.getUserById(userId)
  if (te || !target?.user) fail(404, "Utente non trovato.")
  const { data: fl, error: fe } = await admin.auth.admin.mfa.listFactors({ userId })
  if (fe) fail(500, "Lettura dei fattori MFA non riuscita: " + fe.message)
  const factors = fl?.factors || []
  for (const f of factors) {
    const { error } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId })
    if (error) fail(500, "Eliminazione del fattore MFA non riuscita: " + error.message)
  }

  // Revoca delle sessioni: l'API amministrativa non espone signOut per id utente.
  // Si usa la funzione SQL proposta in supabase/migrations/PROPOSTA_revoca_sessioni_utente.sql;
  // finché non è applicata la revoca non avviene (sessioni_revocate=false).
  const { error: se } = await admin.rpc("admin_revoke_user_sessions", { p_user_id: userId })
  const sessioniRevocate = !se
  if (se) console.warn("admin-users: revoca sessioni non disponibile", se.message)

  const { error: ae } = await admin.from("audit_log").insert({
    user_id: actor.actorId, ente_id: enteId, azione: "MFA_RESET", tabella: "auth.mfa_factors", record_id: userId,
    valore_nuovo: {
      target_user_id: userId, target_email: target!.user!.email || "", fattori_rimossi: factors.length,
      sessioni_revocate: sessioniRevocate, origine: school ? "PORTALE_SCUOLA" : "AMMINISTRAZIONE",
      scuola_id: school?.scuola_id || null,
    },
  })
  if (ae) console.error("admin-users: registrazione MFA_RESET in audit_log non riuscita", ae.message)
  if (school) {
    await schoolLog(actor, school, "DELEGATO_MFA_AZZERATO", { delegato_user_id: userId, fattori_rimossi: factors.length })
  }
  return { ok: true, fattori_rimossi: factors.length, sessioni_revocate: sessioniRevocate, audit_registrato: !ae }
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
    const actor = await authenticate(req)
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "list")

    switch (action) {
      // Amministrazione (superadmin, admin_ente)
      case "list": return reply({ users: await getUsers(requireAdmin(actor)) })
      case "create": return reply(await createUserAction(requireAdmin(actor), body))
      case "school_associate": return reply(await schoolAssociateAction(requireAdmin(actor), body))
      case "update": return reply(await updateUserAction(requireAdmin(actor), body))
      case "delete": return reply(await deleteUserAction(requireAdmin(actor), body))
      // Dirigente scolastico: gestione dei propri delegati (ramo dedicato)
      case "school_delegates_list": return reply(await schoolDelegatesListAction(actor))
      case "school_delegate_save": return reply(await schoolDelegateSaveAction(actor, body))
      case "school_delegate_status": return reply(await schoolDelegateStatusAction(actor, body))
      case "school_delegate_revoke": return reply(await schoolDelegateRevokeAction(actor, body))
      // Azzeramento MFA: amministratori oppure dirigente per i propri delegati (con scuola_id)
      case "mfa_reset": return reply(await mfaResetAction(actor, body))
      default: return reply({ error: "Azione non supportata." }, 400)
    }
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status)
    console.error("admin-users: errore non gestito", error)
    return reply({ error: "Errore interno del servizio." }, 500)
  }
})
