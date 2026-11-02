import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Building2, Trash2 } from 'lucide-react'
import { supabase } from './lib/supabase'
import { notify } from './Notifications'
import { roleLabel } from './lib/labels'

type UserRow = { id: string; nome?: string; cognome?: string; email?: string; roles?: { ente_id: string; ruolo: string }[] }
type BuildingRow = { id: string; codice_edificio?: string | null; denominazione: string }
type PermRow = { id: string; edificio_id: string | null; all_buildings: boolean; can_update: boolean; can_delete: boolean }

// Ruoli esenti: per loro i permessi per edificio non hanno effetto (vedi private.user_can_building).
const EXEMPT = ['superadmin', 'admin_ente']
// Ruoli del Portale Scuola: il loro perimetro si gestisce in "Scuole e delegati".
const SCHOOL = ['dirigente_scolastico', 'delegato_scolastico']

/**
 * Permessi per edificio (tabella edifici_permessi), applicati dal database alle
 * modifiche e alle eliminazioni di edifici, impianti e manutenzioni.
 * - Utente senza righe: valgono solo i permessi del ruolo (matrice).
 * - Utente con righe: può modificare/eliminare solo sugli edifici elencati
 *   (o su tutti, con "Tutti gli edifici"), oltre ai permessi del ruolo.
 * La consultazione non è limitata da queste righe.
 */
export default function BuildingPermissionsPanel({ enteId, users, buildings }: { enteId: string; users: UserRow[]; buildings: BuildingRow[] }) {
  const [userId, setUserId] = useState('')
  const [rows, setRows] = useState<PermRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ edificio_id: '', all_buildings: false, can_update: true, can_delete: false })

  const eligible = useMemo(() => users.filter((u) => {
    const r = (u.roles || []).filter((x) => x.ente_id === enteId).map((x) => x.ruolo)
    return r.length > 0 && !r.some((x) => EXEMPT.includes(x)) && !r.every((x) => SCHOOL.includes(x))
  }), [users, enteId])
  const buildingName = (id: string | null) => {
    const b = buildings.find((x) => x.id === id)
    return b ? `${b.codice_edificio ? b.codice_edificio + ' — ' : ''}${b.denominazione}` : 'Edificio non disponibile'
  }
  const selectedUser = eligible.find((u) => u.id === userId)
  const hasAll = rows.some((r) => r.all_buildings)
  const freeBuildings = buildings.filter((b) => !rows.some((r) => r.edificio_id === b.id))

  const load = async (uid: string) => {
    if (!uid || !enteId) { setRows([]); return }
    setLoading(true)
    const { data, error } = await supabase.from('edifici_permessi')
      .select('id,edificio_id,all_buildings,can_update,can_delete').eq('ente_id', enteId).eq('user_id', uid)
      .order('all_buildings', { ascending: false })
    setLoading(false)
    if (error) { notify('Permessi per edificio non disponibili: ' + error.message, 'error'); setRows([]); return }
    setRows((data || []) as PermRow[])
  }
  useEffect(() => { void load(userId); setForm({ edificio_id: '', all_buildings: false, can_update: true, can_delete: false }) }, [userId, enteId])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!form.all_buildings && !form.edificio_id) { notify('Seleziona un edificio oppure "Tutti gli edifici".', 'error'); return }
    if (!form.can_update && !form.can_delete) { notify('Seleziona almeno un permesso: modifica o eliminazione.', 'error'); return }
    setSaving(true)
    const base = { ente_id: enteId, user_id: userId, can_update: form.can_update, can_delete: form.can_delete }
    let error
    if (form.all_buildings) {
      const existing = rows.find((r) => r.all_buildings)
      ;({ error } = existing
        ? await supabase.from('edifici_permessi').update(base).eq('id', existing.id)
        : await supabase.from('edifici_permessi').insert({ ...base, edificio_id: null, all_buildings: true }))
    } else {
      ;({ error } = await supabase.from('edifici_permessi')
        .upsert({ ...base, edificio_id: form.edificio_id, all_buildings: false }, { onConflict: 'edificio_id,user_id' }))
    }
    setSaving(false)
    if (error) { notify('Salvataggio non riuscito: ' + error.message, 'error'); return }
    notify(form.all_buildings ? 'Permessi su tutti gli edifici salvati.' : 'Permesso sull’edificio salvato.', 'success')
    setForm({ edificio_id: '', all_buildings: false, can_update: true, can_delete: false })
    await load(userId)
  }

  async function remove(r: PermRow) {
    const label = r.all_buildings ? 'tutti gli edifici' : buildingName(r.edificio_id)
    if (!confirm(`Rimuovere il permesso su ${label}?`)) return
    const { error } = await supabase.from('edifici_permessi').delete().eq('id', r.id)
    if (error) { notify('Rimozione non riuscita: ' + error.message, 'error'); return }
    notify('Permesso rimosso.', 'success')
    await load(userId)
  }

  return (
    <section id="admin-permessi-edifici" className="card">
      <div className="card-head">
        <div>
          <h2>Permessi per edificio</h2>
          <p>Limita a edifici specifici la modifica e l’eliminazione di edifici, impianti e manutenzioni. La consultazione non cambia.</p>
        </div>
        <Building2 size={20} aria-hidden="true" />
      </div>
      <div className="notice info">
        Senza righe in questa sezione l’utente segue solo i permessi del suo ruolo. Appena aggiungi un edificio, l’utente può modificare o eliminare
        soltanto sugli edifici elencati. Superadmin e admin dell’ente non sono soggetti a questa limitazione; gli utenti del Portale Scuola si gestiscono in «Scuole e delegati».
      </div>
      <div className="form-grid">
        <label className="span-2">Utente
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Seleziona un utente…</option>
            {eligible.map((u) => (
              <option key={u.id} value={u.id}>
                {[u.cognome, u.nome].filter(Boolean).join(' ') || u.email} — {(u.roles || []).filter((x) => x.ente_id === enteId).map((x) => roleLabel(x.ruolo)).join(', ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      {userId && (
        <>
          <h3>{selectedUser ? `Edifici abilitati per ${[selectedUser.nome, selectedUser.cognome].filter(Boolean).join(' ') || selectedUser.email}` : 'Edifici abilitati'}</h3>
          {loading ? <div className="notice">Caricamento…</div> : rows.length ? (
            <div className="table-card" tabIndex={0} role="region" aria-label="Edifici abilitati">
              <table>
                <thead><tr><th>Edificio</th><th>Modifica</th><th>Eliminazione</th><th><span className="sr-only">Azioni</span></th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td><b>{r.all_buildings ? 'Tutti gli edifici dell’ente' : buildingName(r.edificio_id)}</b></td>
                      <td>{r.can_update ? 'Sì' : 'No'}</td>
                      <td>{r.can_delete ? 'Sì' : 'No'}</td>
                      <td className="row-actions">
                        <button className="icon-btn dark-icon" title="Rimuovi" aria-label={'Rimuovi permesso su ' + (r.all_buildings ? 'tutti gli edifici' : buildingName(r.edificio_id))} onClick={() => void remove(r)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">Nessuna limitazione: l’utente segue solo i permessi del suo ruolo.</p>}

          <form className="form-grid" onSubmit={save}>
            <label className="checkbox-label span-2">
              <input type="checkbox" checked={form.all_buildings} onChange={(e) => setForm({ ...form, all_buildings: e.target.checked, edificio_id: '' })} />
              Tutti gli edifici dell’ente{hasAll ? ' (aggiorna il permesso esistente)' : ''}
            </label>
            {!form.all_buildings && (
              <label className="span-2">Edificio
                <select value={form.edificio_id} onChange={(e) => setForm({ ...form, edificio_id: e.target.value })} required>
                  <option value="">Seleziona un edificio…</option>
                  {freeBuildings.map((b) => <option key={b.id} value={b.id}>{b.codice_edificio ? b.codice_edificio + ' — ' : ''}{b.denominazione}</option>)}
                </select>
              </label>
            )}
            <label className="checkbox-label">
              <input type="checkbox" checked={form.can_update} onChange={(e) => setForm({ ...form, can_update: e.target.checked })} /> Può modificare
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.can_delete} onChange={(e) => setForm({ ...form, can_delete: e.target.checked })} /> Può eliminare
            </label>
            <div className="form-actions span-2">
              <button className="btn primary" disabled={saving}>{saving ? 'Salvataggio…' : 'Aggiungi permesso'}</button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
