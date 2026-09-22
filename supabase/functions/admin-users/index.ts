import { createClient } from "npm:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors })

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SECRET_KEYS = Deno.env.get("SUPABASE_SECRET_KEYS")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const adminKey = SERVICE_ROLE_KEY || (SECRET_KEYS ? JSON.parse(SECRET_KEYS).default : undefined)

if (!adminKey) throw new Error("Missing Supabase server secret key")

const admin = createClient(SUPABASE_URL, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

const allowedRoles = [
  "admin_ente",
  "rup",
  "tecnico",
  "amministrativo",
  "direttore_lavori",
  "auditor",
  "consultatore",
]

function cleanUser(user: any, profile: any, roles: any[]) {
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
    roles: roles.map((r) => ({
      ente_id: r.ente_id,
      ente: r.ente?.denominazione || "",
      ruolo: r.ruolo,
    })),
  }
}

async function currentActor(req: Request) {
  const auth = req.headers.get("Authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) throw new Error("Autenticazione richiesta")
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error("Sessione non valida")
  const actorId = data.user.id

  const { data: actorRoles, error: roleError } = await admin
    .from("user_roles")
    .select("ente_id,ruolo")
    .eq("user_id", actorId)
  if (roleError) throw new Error(roleError.message)

  const isSuperadmin = actorRoles?.some((r) => r.ruolo === "superadmin") || false
  const managedEnteIds = (actorRoles || [])
    .filter((r) => r.ruolo === "superadmin" || r.ruolo === "admin_ente")
    .map((r) => r.ente_id)

  if (!isSuperadmin && !managedEnteIds.length) {
    throw new Error("Utente non autorizzato alla gestione degli utenti")
  }

  return { actorId, isSuperadmin, managedEnteIds }
}

async function canManageTarget(actor: any, targetUserId: string, enteId?: string) {
  if (actor.isSuperadmin) return true
  if (!enteId || !actor.managedEnteIds.includes(enteId)) return false
  const { data, error } = await admin
    .from("user_roles")
    .select("user_id,ente_id,ruolo")
    .eq("user_id", targetUserId)
    .eq("ente_id", enteId)
  if (error) throw new Error(error.message)
  return (data || []).length > 0 && !(data || []).some((r) => r.ruolo === "superadmin")
}

async function getUsers(actor: any) {
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) throw new Error(usersError.message)

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id,nome,cognome,email,telefono,attivo")
  if (profileError) throw new Error(profileError.message)

  const { data: roles, error: rolesError } = await admin
    .from("user_roles")
    .select("user_id,ente_id,ruolo,enti(id,denominazione)")
  if (rolesError) throw new Error(rolesError.message)

  const managed = actor.isSuperadmin
    ? null
    : new Set(actor.managedEnteIds)

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const rolesByUser = new Map<string, any[]>()
  for (const r of roles || []) {
    if (managed && !managed.has(r.ente_id)) continue
    const arr = rolesByUser.get(r.user_id) || []
    arr.push(r)
    rolesByUser.set(r.user_id, arr)
  }

  const result = (usersData.users || [])
    .filter((u: any) => actor.isSuperadmin || rolesByUser.has(u.id))
    .map((u: any) => cleanUser(u, profileMap.get(u.id), rolesByUser.get(u.id) || []))
    .sort((a: any, b: any) => (a.cognome + a.nome + a.email).localeCompare(b.cognome + b.nome + b.email, "it"))

  return result
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const actor = await currentActor(req)
    const body = await req.json().catch(() => ({}))
    const action = body.action || "list"

    if (action === "list") return json({ users: await getUsers(actor) })

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase()
      const password = String(body.password || "")
      const nome = String(body.nome || "").trim()
      const cognome = String(body.cognome || "").trim()
      const telefono = String(body.telefono || "").trim() || null
      const enteId = String(body.ente_id || "")
      const ruolo = String(body.ruolo || "tecnico")
      const attivo = body.attivo !== false

      if (!email || !password || password.length < 8 || !enteId || !allowedRoles.includes(ruolo)) {
        return json({ error: "Email, password (minimo 8 caratteri), ente e ruolo sono obbligatori." }, 400)
      }
      if (!actor.isSuperadmin && (!actor.managedEnteIds.includes(enteId) || ruolo === "superadmin")) {
        return json({ error: "Non autorizzato per questo ente/ruolo." }, 403)
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, cognome },
      })
      if (createError || !created.user) return json({ error: createError?.message || "Creazione utente fallita." }, 400)

      const uid = created.user.id
      const { error: profileError } = await admin.from("profiles").upsert({
        id: uid, nome, cognome, email, telefono, attivo,
      })
      if (profileError) {
        await admin.auth.admin.deleteUser(uid)
        return json({ error: "Profilo utente non creato: " + profileError.message }, 500)
      }

      const { error: roleError } = await admin.from("user_roles").insert({ user_id: uid, ente_id: enteId, ruolo })
      if (roleError) {
        await admin.from("profiles").delete().eq("id", uid)
        await admin.auth.admin.deleteUser(uid)
        return json({ error: "Ruolo utente non creato: " + roleError.message }, 500)
      }

      if (!attivo) {
        await admin.auth.admin.updateUserById(uid, { ban_duration: "876000h" })
      }

      return json({ user: (await getUsers(actor)).find((u: any) => u.id === uid) })
    }

    if (!["update", "delete"].includes(action)) return json({ error: "Azione non supportata." }, 400)

    const userId = String(body.user_id || "")
    if (!userId || userId === actor.actorId) {
      return json({ error: "Non è possibile modificare o eliminare il proprio utente da questa sezione." }, 400)
    }

    const targetEnteId = String(body.ente_id || "")
    if (!(await canManageTarget(actor, userId, actor.isSuperadmin ? undefined : targetEnteId))) {
      return json({ error: "Utente non autorizzato o fuori dal perimetro dell'ente." }, 403)
    }

    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(userId, false)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    const nome = String(body.nome || "").trim()
    const cognome = String(body.cognome || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const telefono = String(body.telefono || "").trim() || null
    const attivo = body.attivo !== false
    const password = String(body.password || "")

    const attrs: any = {
      user_metadata: { nome, cognome },
      ...(email ? { email, email_confirm: true } : {}),
      ...(password ? { password } : {}),
      ban_duration: attivo ? "none" : "876000h",
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, attrs)
    if (updateError) return json({ error: updateError.message }, 400)

    const { error: profileError } = await admin.from("profiles").update({
      nome, cognome, email: email || null, telefono, attivo,
    }).eq("id", userId)
    if (profileError) return json({ error: "Profilo non aggiornato: " + profileError.message }, 500)

    if (actor.isSuperadmin && targetEnteId && allowedRoles.includes(String(body.ruolo || ""))) {
      const ruolo = String(body.ruolo)
      const { error: roleError } = await admin.from("user_roles").upsert(
        { user_id: userId, ente_id: targetEnteId, ruolo },
        { onConflict: "user_id,ente_id,ruolo" },
      )
      if (roleError) return json({ error: "Ruolo non aggiornato: " + roleError.message }, 400)
    } else if (!actor.isSuperadmin && targetEnteId && allowedRoles.includes(String(body.ruolo || ""))) {
      const ruolo = String(body.ruolo)
      if (ruolo === "superadmin") return json({ error: "Non autorizzato ad assegnare superadmin." }, 403)
      const { error: roleError } = await admin.from("user_roles").upsert(
        { user_id: userId, ente_id: targetEnteId, ruolo },
        { onConflict: "user_id,ente_id,ruolo" },
      )
      if (roleError) return json({ error: "Ruolo non aggiornato: " + roleError.message }, 400)
    }

    return json({ user: (await getUsers(actor)).find((u: any) => u.id === userId) })
  } catch (error) {
    console.error(error)
    return json({ error: error instanceof Error ? error.message : String(error) }, 401)
  }
})
