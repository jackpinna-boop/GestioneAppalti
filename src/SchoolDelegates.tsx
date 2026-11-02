import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { KeyRound, Pencil, PauseCircle, PlayCircle, UserMinus, UserPlus, Users, Copy } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Modal from './Modal'
import { notify } from './Notifications'

// Sezione "Delegati" del Portale Scuola, riservata al dirigente scolastico.
// Tutte le regole di autorizzazione sono applicate dall'Edge Function admin-users
// (azioni school_delegates_list, school_delegate_save, school_delegate_status,
// school_delegate_revoke, mfa_reset): qui si propongono solo le scelte ammesse.

type SchoolOption = { id: string; denominazione: string; codice_meccanografico: string | null; edifici: { id: string; denominazione: string; comune: string }[] }
type Delegate = {
  scuola_utente_id: string; scuola_id: string; user_id: string; email: string; nome: string; cognome: string; telefono: string
  stato: 'attivo' | 'sospeso' | 'revocato' | 'scaduto'; attivo: boolean; data_inizio: string | null; data_fine: string | null
  edifici: { id: string; denominazione: string }[]; altri_edifici: number; gestibile: boolean; mfa_attiva: boolean | null; mfa_azzerabile: boolean
}
type Form = { mode: 'new' | 'edit'; user_id?: string; email: string; nome: string; cognome: string; telefono: string; scuola_id: string; edificio_ids: string[]; data_fine: string }
type Confirm = { kind: 'revoke' | 'mfa'; delegate: Delegate }

const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (v: string | null | undefined) => { if (!v) return '—'; const d = new Date(v + 'T00:00:00'); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('it-IT').format(d) }
const statusMeta: Record<Delegate['stato'], { label: string; cls: string }> = {
  attivo: { label: 'Attiva', cls: 'green' }, sospeso: { label: 'Sospesa', cls: 'amber' }, revocato: { label: 'Revocata', cls: 'gray' }, scaduto: { label: 'Scaduta', cls: 'red' },
}
const fullName = (d: { nome: string; cognome: string; email: string }) => [d.cognome, d.nome].filter(Boolean).join(' ') || d.email || 'Delegato'

async function invokeAdminUsers(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error instanceof FunctionsHttpError) {
    let message = error.message
    try { const payload = await error.context.json(); message = payload?.error || payload?.message || message } catch { /* risposta non JSON */ }
    throw new Error(message)
  }
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

export default function SchoolDelegates() {
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<Form | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [temp, setTemp] = useState<{ email: string; password: string } | null>(null)
  const [showRevoked, setShowRevoked] = useState(false)
  const errorId = useId()

  const load = async () => {
    setLoading(true); setLoadError('')
    try {
      const data = await invokeAdminUsers({ action: 'school_delegates_list' })
      setSchools(data?.schools || []); setDelegates(data?.delegates || [])
    } catch (e: any) {
      setLoadError('Elenco dei delegati non disponibile: ' + (e?.message || 'errore sconosciuto'))
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const schoolById = useMemo(() => new Map(schools.map((s) => [s.id, s])), [schools])
  const visible = delegates.filter((d) => showRevoked || d.stato !== 'revocato')
  const revokedCount = delegates.filter((d) => d.stato === 'revocato').length
  const formSchool = form ? schoolById.get(form.scuola_id) : undefined

  const openNew = () => {
    setFormError('')
    const only = schools.length === 1 ? schools[0] : undefined
    setForm({ mode: 'new', email: '', nome: '', cognome: '', telefono: '', scuola_id: only?.id || '', edificio_ids: only?.edifici.length === 1 ? [only.edifici[0].id] : [], data_fine: '' })
  }
  const openEdit = (d: Delegate) => {
    setFormError('')
    setForm({ mode: 'edit', user_id: d.user_id, email: d.email, nome: d.nome, cognome: d.cognome, telefono: d.telefono, scuola_id: d.scuola_id, edificio_ids: d.edifici.map((e) => e.id), data_fine: d.data_fine && d.data_fine >= today() ? d.data_fine : '' })
  }
  const toggleBuilding = (id: string, on: boolean) => setForm((f) => f && ({ ...f, edificio_ids: on ? [...new Set([...f.edificio_ids, id])] : f.edificio_ids.filter((x) => x !== id) }))

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    if (!form.scuola_id) { setFormError('Seleziona l’istituto.'); return }
    if (!form.edificio_ids.length) { setFormError('Seleziona almeno un edificio.'); return }
    if (form.data_fine && form.data_fine < today()) { setFormError('La data di fine non può essere anteriore a oggi.'); return }
    setSaving(true); setFormError('')
    try {
      const data = await invokeAdminUsers({
        action: 'school_delegate_save', scuola_id: form.scuola_id, user_id: form.user_id || undefined,
        email: form.email.trim(), nome: form.nome.trim(), cognome: form.cognome.trim(), telefono: form.telefono.trim(),
        edificio_ids: form.edificio_ids, data_fine: form.data_fine || null,
      })
      const email = form.email.trim()
      setForm(null)
      if (data?.password_temporanea) setTemp({ email, password: data.password_temporanea })
      notify(form.mode === 'edit' ? 'Delega aggiornata.' : data?.utenza_creata ? 'Delegato creato e associato all’istituto.' : 'Delegato associato all’istituto.', 'success')
      await load()
    } catch (err: any) {
      setFormError(err?.message || 'Salvataggio non riuscito.')
    } finally { setSaving(false) }
  }

  const setStatus = async (d: Delegate, attivo: boolean) => {
    try {
      await invokeAdminUsers({ action: 'school_delegate_status', scuola_id: d.scuola_id, user_id: d.user_id, attivo })
      notify(attivo ? `Delega di ${fullName(d)} riattivata.` : `Delega di ${fullName(d)} sospesa.`, 'success')
      await load()
    } catch (err: any) { notify('Operazione non riuscita: ' + (err?.message || 'errore'), 'error') }
  }

  const runConfirm = async () => {
    if (!confirm) return
    const { kind, delegate: d } = confirm
    setSaving(true)
    try {
      if (kind === 'revoke') {
        await invokeAdminUsers({ action: 'school_delegate_revoke', scuola_id: d.scuola_id, user_id: d.user_id })
        notify(`Delega di ${fullName(d)} revocata.`, 'success')
      } else {
        const r = await invokeAdminUsers({ action: 'mfa_reset', scuola_id: d.scuola_id, user_id: d.user_id })
        notify(`Verifica in due passaggi azzerata per ${fullName(d)}${r?.fattori_rimossi === 0 ? ' (non era configurata)' : ''}.`, 'success')
      }
      setConfirm(null)
      await load()
    } catch (err: any) { notify('Operazione non riuscita: ' + (err?.message || 'errore'), 'error') } finally { setSaving(false) }
  }

  const copyPassword = async () => {
    if (!temp) return
    try { await navigator.clipboard.writeText(temp.password); notify('Password copiata negli appunti.', 'info') } catch { notify('Copia non riuscita: seleziona e copia la password manualmente.', 'info') }
  }

  return <section className="card school-delegates" aria-labelledby="school-delegates-title">
    <div className="card-head">
      <div><h2 id="school-delegates-title">Delegati</h2><p>Persone autorizzate a segnalare interventi per conto dell’istituto, limitatamente agli edifici assegnati.</p></div>
      <button className="btn primary" onClick={openNew} disabled={loading || !schools.length}><UserPlus size={16} aria-hidden="true" /> Aggiungi delegato</button>
    </div>
    {loadError && <div className="notice error" role="alert">{loadError}</div>}
    {loading ? <div className="table-sub">Caricamento delegati…</div> : visible.length ? <div className="table-card"><table>
      <caption className="sr-only">Delegati degli istituti diretti</caption>
      <thead><tr><th scope="col">Delegato</th>{schools.length > 1 && <th scope="col">Istituto</th>}<th scope="col">Edifici</th><th scope="col">Stato</th><th scope="col">Fine delega</th><th scope="col">Verifica in due passaggi</th><th scope="col">Azioni</th></tr></thead>
      <tbody>{visible.map((d) => {
        const st = statusMeta[d.stato]; const name = fullName(d)
        return <tr key={d.scuola_utente_id}>
          <td><b>{name}</b><span className="table-sub">{d.email}{d.telefono ? ' · ' + d.telefono : ''}</span></td>
          {schools.length > 1 && <td>{schoolById.get(d.scuola_id)?.denominazione || '—'}</td>}
          <td>{d.edifici.length ? d.edifici.map((e) => e.denominazione).join(', ') : '—'}{d.altri_edifici > 0 && <span className="table-sub">+ {d.altri_edifici} assegnati dall’ente</span>}</td>
          <td><span className={'badge ' + st.cls}>{st.label}</span></td>
          <td>{fmtDate(d.data_fine)}</td>
          <td>{d.mfa_attiva === null ? '—' : <span className={'badge ' + (d.mfa_attiva ? 'green' : 'gray')}>{d.mfa_attiva ? 'Attiva' : 'Non configurata'}</span>}</td>
          <td><div className="school-row-actions">
            {d.gestibile && <button className="btn secondary small" onClick={() => openEdit(d)} aria-label={`Modifica la delega di ${name}`}><Pencil size={14} aria-hidden="true" /> Modifica</button>}
            {d.stato !== 'revocato' && (d.attivo
              ? <button className="btn secondary small" onClick={() => void setStatus(d, false)} aria-label={`Sospendi la delega di ${name}`}><PauseCircle size={14} aria-hidden="true" /> Sospendi</button>
              : d.gestibile && <button className="btn secondary small" onClick={() => void setStatus(d, true)} aria-label={`Riattiva la delega di ${name}`}><PlayCircle size={14} aria-hidden="true" /> Riattiva</button>)}
            {d.stato !== 'revocato' && <button className="btn danger small" onClick={() => setConfirm({ kind: 'revoke', delegate: d })} aria-label={`Revoca la delega di ${name}`}><UserMinus size={14} aria-hidden="true" /> Revoca</button>}
            {d.mfa_azzerabile && d.stato !== 'revocato' && <button className="btn secondary small" onClick={() => setConfirm({ kind: 'mfa', delegate: d })} aria-label={`Azzera la verifica in due passaggi di ${name}`}><KeyRound size={14} aria-hidden="true" /> Azzera verifica in due passaggi</button>}
          </div>{!d.gestibile && <span className="table-sub">Utente con altri ruoli: modifiche a cura dell’ente.</span>}</td>
        </tr>
      })}</tbody></table></div>
      : !loadError && <div className="empty"><Users size={26} aria-hidden="true" /><strong>Nessun delegato</strong><span>Usa “Aggiungi delegato” per autorizzare una persona a segnalare interventi.</span></div>}
    {revokedCount > 0 && <label className="checkbox-label school-delegates-toggle"><input type="checkbox" checked={showRevoked} onChange={(e) => setShowRevoked(e.target.checked)} /> Mostra le deleghe revocate ({revokedCount})</label>}

    {form && <Modal title={form.mode === 'edit' ? 'Modifica delega' : 'Aggiungi delegato'} close={() => { if (!saving) setForm(null) }}>
      <form className="form-grid" onSubmit={save} noValidate aria-describedby={formError ? errorId : undefined}>
        {form.mode === 'new' ? <>
          <label className="span-2">E-mail <input type="email" name="email" autoComplete="off" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Nome <input name="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
          <label>Cognome <input name="cognome" required value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} /></label>
          <label>Telefono (facoltativo) <input type="tel" name="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></label>
          <label>Istituto <select name="scuola_id" required value={form.scuola_id} onChange={(e) => setForm({ ...form, scuola_id: e.target.value, edificio_ids: [] })}><option value="">Seleziona l’istituto…</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.denominazione}{s.codice_meccanografico ? ` — ${s.codice_meccanografico}` : ''}</option>)}</select></label>
          <p className="table-sub span-2">Se l’indirizzo non corrisponde a un utente registrato, viene creata una nuova utenza con password temporanea, mostrata una sola volta al termine.</p>
        </> : <div className="span-2 school-delegate-summary"><b>{fullName(form)}</b><span className="table-sub">{form.email} · {formSchool?.denominazione || ''}</span></div>}
        <fieldset className="span-2 school-delegate-buildings">
          <legend>Edifici autorizzati</legend>
          {!form.scuola_id ? <span className="table-sub">Seleziona prima l’istituto.</span> : formSchool?.edifici.length ? formSchool.edifici.map((b) => <label key={b.id} className="checkbox-label"><input type="checkbox" name="edificio" value={b.id} checked={form.edificio_ids.includes(b.id)} onChange={(e) => toggleBuilding(b.id, e.target.checked)} /> {b.denominazione}{b.comune ? ` — ${b.comune}` : ''}</label>) : <span className="table-sub">Non hai edifici assegnati per questo istituto.</span>}
          <span className="table-sub">Puoi assegnare solo gli edifici dell’istituto che sono assegnati a te.</span>
        </fieldset>
        <label>Fine delega (facoltativa) <input type="date" name="data_fine" min={today()} value={form.data_fine} onChange={(e) => setForm({ ...form, data_fine: e.target.value })} /></label>
        {formError && <div id={errorId} className="notice error span-2" role="alert">{formError}</div>}
        <div className="form-actions span-2"><button type="button" className="btn secondary" disabled={saving} onClick={() => setForm(null)}>Annulla</button><button className="btn primary" disabled={saving}>{saving ? 'Salvataggio…' : form.mode === 'edit' ? 'Salva modifiche' : 'Aggiungi delegato'}</button></div>
      </form>
    </Modal>}

    {confirm && <Modal title={confirm.kind === 'revoke' ? 'Revoca delega' : 'Azzera verifica in due passaggi'} close={() => { if (!saving) setConfirm(null) }}>
      {confirm.kind === 'revoke'
        ? <p>La delega di <b>{fullName(confirm.delegate)}</b> sarà revocata: la persona non potrà più segnalare interventi per l’istituto. L’utenza non viene eliminata e le segnalazioni già registrate restano nello storico.</p>
        : <><p>Verrà eliminata l’app di autenticazione associata all’account di <b>{fullName(confirm.delegate)}</b> (ad esempio dopo un cambio di telefono).</p><p>Al prossimo accesso, dopo e-mail e password, la persona dovrà registrare di nuovo l’app di autenticazione inquadrando un nuovo codice QR. Procedi solo dopo averne verificato l’identità.</p></>}
      <div className="form-actions"><button className="btn secondary" disabled={saving} onClick={() => setConfirm(null)}>Annulla</button><button className="btn danger" disabled={saving} onClick={() => void runConfirm()}>{saving ? 'Operazione in corso…' : confirm.kind === 'revoke' ? 'Revoca delega' : 'Azzera verifica'}</button></div>
    </Modal>}

    {temp && <Modal title="Password temporanea" close={() => setTemp(null)}>
      <p>È stata creata l’utenza <b>{temp.email}</b>. Comunica alla persona questa password temporanea attraverso un canale sicuro: <strong>non sarà più visualizzata</strong>.</p>
      <code aria-label="Password temporanea">{temp.password}</code>
      <p className="table-sub">Al primo accesso la persona dovrà configurare la verifica in due passaggi. È consigliabile che cambi la password con la funzione “Password dimenticata”.</p>
      <div className="form-actions"><button className="btn secondary" onClick={() => void copyPassword()}><Copy size={15} aria-hidden="true" /> Copia</button><button className="btn primary" onClick={() => setTemp(null)}>Ho preso nota</button></div>
    </Modal>}
  </section>
}
