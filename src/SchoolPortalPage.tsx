import React, { useEffect, useMemo, useState } from 'react'
import { Building2, CheckCircle2, CircleAlert, FileText, History, LogOut, Plus, X } from 'lucide-react'
import { supabase } from './lib/supabase'

type Access={user_id:string;ente_id:string;ruolo:string;ente:string;logo_path?:string|null;ui_palette?:string}

type SchoolBuilding={id:string;denominazione:string;codice_edificio:string|null;indirizzo:string|null;comune:string|null}
type School={id:string;denominazione:string;codice_meccanografico:string|null}
type SchoolRequest={id:string;codice_richiesta:string|null;titolo_sintetico:string;descrizione_estesa:string;data_richiesta:string;stato_risoluzione:string;priorita:string|null;created_by:string;richieste_intervento_sedi:any[]}

const fmtDate=(v:string|null|undefined)=>v?new Intl.DateTimeFormat('it-IT').format(new Date(v+'T00:00:00')):'—'

export default function SchoolPortalPage({session,access}:{session:any;access:Access[]}){
 const userId=session.user.id
 const [schools,setSchools]=useState<School[]>([])
 const [schoolBuildingMap,setSchoolBuildingMap]=useState<Record<string,string>>({})
 const [buildings,setBuildings]=useState<SchoolBuilding[]>([])
 const [rows,setRows]=useState<SchoolRequest[]>([])
 const [selected,setSelected]=useState<SchoolRequest|null>(null)
 const [logs,setLogs]=useState<any[]>([])
 const [showNew,setShowNew]=useState(false)
 const [cancelRow,setCancelRow]=useState<SchoolRequest|null>(null)
 const [message,setMessage]=useState('')
 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [schoolFilter,setSchoolFilter]=useState('all')
 const [buildingFilter,setBuildingFilter]=useState('all')

 const load=async()=>{
   setLoading(true)
   const [su,se,sue,sed,ed,rq,lg]=await Promise.all([
     supabase.from('scuola_utenti').select('id,scuola_id,ruolo').eq('user_id',userId).eq('attivo',true),
     supabase.from('scuole').select('id,denominazione,codice_meccanografico').eq('attiva',true).order('denominazione'),
     supabase.from('scuola_utenti_edifici').select('scuola_utente_id,edificio_id').eq('attivo',true),
     supabase.from('scuole_edifici').select('scuola_id,edificio_id').eq('attivo',true),
     supabase.from('edifici').select('id,denominazione,codice_edificio,indirizzo,comune').order('denominazione'),
     supabase.from('richieste_intervento').select('id,codice_richiesta,titolo_sintetico,descrizione_estesa,data_richiesta,stato_risoluzione,priorita,created_by,richieste_intervento_sedi(id,edificio_id,edifici(id,denominazione,codice_edificio,indirizzo,comune))').order('data_richiesta',{ascending:false}),
     supabase.from('scuola_access_log').select('id,azione,timestamp,metadata,richiesta_id,edificio_id,scuola_id').eq('user_id',userId).order('timestamp',{ascending:false}).limit(100)
   ])
   if(su.error||se.error||sue.error||sed.error||ed.error||rq.error){setMessage('Errore nel caricamento del Portale Scuola.');console.error(su.error,se.error,sue.error,sed.error,ed.error,rq.error)}
   const links=su.data||[]
   const linkIds=new Set(links.map((x:any)=>x.scuola_utente_id))
   const schoolIds=new Set(links.map((x:any)=>x.scuola_id))
   const buildingIds=new Set((sue.data||[]).filter((x:any)=>linkIds.has(x.scuola_utente_id)).map((x:any)=>x.edificio_id))
   setSchools((se.data||[]).filter((x:any)=>schoolIds.has(x.id)))
   const sbm:any={};(sed.data||[]).forEach((x:any)=>{sbm[x.edificio_id]=x.scuola_id});setSchoolBuildingMap(sbm)
   setBuildings((ed.data||[]).filter((x:any)=>buildingIds.has(x.id)))
   setRows((rq.data||[]) as SchoolRequest[])
   setLogs(lg.data||[])
   setLoading(false)
 }
 useEffect(()=>{void load();void supabase.from('scuola_access_log').insert({user_id:userId,ente_id:access[0]?.ente_id,azione:'APERTURA_PORTALE',metadata:{origine:'PORTALE_SCUOLA'}})},[userId,access[0]?.ente_id])

 const filtered=useMemo(()=>rows.filter(r=>{
   const sede=r.richieste_intervento_sedi?.[0]?.edificio_id
   const byBuilding=buildingFilter==='all'||sede===buildingFilter
   if(schoolFilter==='all') return byBuilding
   return byBuilding&&schoolBuildingMap[sede]===schoolFilter
 }),[rows,buildingFilter,schoolFilter,buildings,schoolBuildingMap])
 const open=rows.filter(x=>['aperta','da_valutare'].includes(x.stato_risoluzione)).length
 const inProgress=rows.filter(x=>x.stato_risoluzione==='in_carico').length
 const resolved=rows.filter(x=>x.stato_risoluzione==='risolta').length
 const cancelled=rows.filter(x=>x.stato_risoluzione==='annullata').length

 const create=async(e:React.FormEvent<HTMLFormElement>)=>{
   e.preventDefault();setSaving(true);setMessage('')
   const f=new FormData(e.currentTarget)
   const buildingId=String(f.get('edificio')||'')
   const {data,error}=await supabase.rpc('school_create_request',{
     p_ente_id:access[0]?.ente_id,
     p_edificio_id:buildingId,
     p_titolo:String(f.get('titolo')||''),
     p_descrizione:String(f.get('descrizione')||''),
     p_tipo_intervento:String(f.get('tipo')||'ordinaria'),
     p_priorita:String(f.get('priorita')||'ordinaria'),
     p_note_immobile:String(f.get('note')||'')||null
   })
   if(error){setMessage(error.message||'Impossibile registrare la richiesta.')}
   else {setShowNew(false);setMessage('Richiesta registrata correttamente.');await load()}
   setSaving(false)
 }

 const cancel=async()=>{
   if(!cancelRow)return
   setSaving(true)
   const {error}=await supabase.rpc('school_cancel_request',{p_request_id:cancelRow.id,p_motivazione:message||'Annullamento richiesto dall’utente scolastico'})
   if(error)setMessage(error.message||'Impossibile annullare la richiesta.')
   else {setCancelRow(null);setMessage('Richiesta annullata e conservata nello storico.');await load()}
   setSaving(false)
 }

 const openRequest=async(r:SchoolRequest)=>{
   setSelected(r)
   await supabase.from('scuola_access_log').insert({user_id:userId,ente_id:access[0]?.ente_id,richiesta_id:r.id,edificio_id:r.richieste_intervento_sedi?.[0]?.edificio_id||null,azione:'VISUALIZZAZIONE_RICHIESTA',metadata:{origine:'PORTALE_SCUOLA'}})
 }

 const role=access.find(x=>x.ruolo==='dirigente_scolastico'||x.ruolo==='delegato_scolastico')?.ruolo
 const roleLabel=role==='dirigente_scolastico'?'Dirigente scolastico':'Delegato scolastico'
 return <div className="school-portal">
   <header className="school-portal-head">
    <div><div className="school-portal-kicker">PORTALE SCUOLA</div><h1>Gestione segnalazioni</h1><p>{access[0]?.ente||'Ente'} · {roleLabel}</p></div>
    <button className="icon-btn" title="Esci" onClick={()=>void supabase.auth.signOut()}><LogOut size={18}/></button>
   </header>
   <section className="school-portal-notice"><CircleAlert size={18}/><span>Le richieste registrate non possono essere eliminate. In caso di errore devono essere <b>annullate</b>, mantenendo traccia dell’operazione.</span></section>
   {message&&<div className="notice info">{message}<button className="icon-btn" onClick={()=>setMessage('')}><X size={15}/></button></div>}
   <div className="school-kpis"><div><span>Richieste aperte</span><strong>{open}</strong></div><div><span>In carico</span><strong>{inProgress}</strong></div><div><span>Risolte</span><strong>{resolved}</strong></div><div><span>Annullate</span><strong>{cancelled}</strong></div></div>
   <div className="school-portal-actions"><button className="btn primary" onClick={()=>setShowNew(true)}><Plus size={16}/> Segnala intervento</button><span>{schools.length} istituto/i · {buildings.length} edificio/i autorizzati</span></div>
   <div className="school-portal-grid">
    <section className="card">
     <div className="card-head"><div><h2>Le mie segnalazioni</h2><p>Visualizzi esclusivamente le richieste del tuo perimetro autorizzato.</p></div><FileText size={20}/></div>
     <div className="school-filters"><label>Istituto<select value={schoolFilter} onChange={e=>setSchoolFilter(e.target.value)}><option value="all">Tutti</option>{schools.map(s=><option key={s.id} value={s.id}>{s.denominazione}</option>)}</select></label><label>Edificio<select value={buildingFilter} onChange={e=>setBuildingFilter(e.target.value)}><option value="all">Tutti</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.denominazione}</option>)}</select></label></div>
     {loading?<div className="loading-screen">Caricamento…</div>:filtered.length?<div className="table-card"><table><thead><tr><th>Codice</th><th>Richiesta</th><th>Edificio</th><th>Data</th><th>Stato</th><th></th></tr></thead><tbody>{filtered.map(r=>{const b=r.richieste_intervento_sedi?.[0]?.edifici;return <tr key={r.id} className="clickable"><td>{r.codice_richiesta||'—'}</td><td><b>{r.titolo_sintetico}</b><span className="table-sub">{r.priorita||'ordinaria'}</span></td><td>{b?.denominazione||'—'}</td><td>{fmtDate(r.data_richiesta)}</td><td><span className={'badge '+(r.stato_risoluzione==='risolta'?'green':r.stato_risoluzione==='annullata'?'gray':'amber')}>{r.stato_risoluzione}</span></td><td><button className="btn secondary small" onClick={()=>void openRequest(r)}>Apri</button></td></tr>})}</tbody></table></div>:<div className="empty"><FileText size={28}/><strong>Nessuna richiesta</strong><span>Utilizza “Segnala intervento” per inserire una nuova segnalazione.</span></div>}
    </section>
    <aside className="card"><div className="card-head"><div><h2>Registro attività</h2><p>Accessi e operazioni effettuate dal tuo account.</p></div><History size={20}/></div>{logs.length?<div className="school-log-list">{logs.slice(0,20).map(x=><div className="school-log-row" key={x.id}><CheckCircle2 size={15}/><div><b>{x.azione}</b><span>{new Date(x.timestamp).toLocaleString('it-IT')}</span></div></div>)}</div>:<EmptyLog/>}</aside>
   </div>
   {selected&&<Modal title={selected.codice_richiesta||'Richiesta'} close={()=>setSelected(null)}><Info label="Titolo" value={selected.titolo_sintetico}/><Info label="Edificio" value={selected.richieste_intervento_sedi?.[0]?.edifici?.denominazione}/><Info label="Data" value={fmtDate(selected.data_richiesta)}/><Info label="Stato" value={selected.stato_risoluzione}/><div className="school-request-description">{selected.descrizione_estesa}</div>{selected.stato_risoluzione!=='annullata'&&selected.stato_risoluzione!=='risolta'&&selected.created_by===userId&&<div className="form-actions"><button className="btn danger" onClick={()=>{setSelected(null);setCancelRow(selected);setMessage('')}}>Annulla richiesta</button></div>}</Modal>}
   {showNew&&<Modal title="Nuova segnalazione" close={()=>setShowNew(false)}><form className="form-grid" onSubmit={create}><label>Edificio<select name="edificio" required><option value="">Seleziona…</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.denominazione} — {b.comune||''}</option>)}</select></label><label>Priorità<select name="priorita" defaultValue="ordinaria"><option value="ordinaria">Ordinaria</option><option value="urgente">Urgente</option><option value="emergenza">Emergenza</option></select></label><label>Tipologia<select name="tipo" defaultValue="ordinaria"><option value="ordinaria">Ordinaria</option><option value="straordinaria">Straordinaria</option><option value="da_valutare">Da valutare</option></select></label><label className="span-2">Titolo<input name="titolo" required maxLength={200}/></label><label className="span-2">Descrizione<textarea name="descrizione" required rows={6}/></label><label className="span-2">Note immobile<textarea name="note" rows={3}/></label><div className="school-portal-confirm span-2">La segnalazione sarà registrata con il tuo utente e non sarà eliminabile. Per correggere un errore dovrai annullarla.</div><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={()=>setShowNew(false)}>Annulla</button><button className="btn primary" disabled={saving}>{saving?'Registrazione…':'Registra segnalazione'}</button></div></form></Modal>}
   {cancelRow&&<Modal title="Annulla richiesta" close={()=>setCancelRow(null)}><p>La richiesta resterà nello storico come annullata. Indica il motivo dell’annullamento.</p><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder="Motivazione…" required/><div className="form-actions"><button className="btn secondary" onClick={()=>setCancelRow(null)}>Chiudi</button><button className="btn danger" disabled={saving||!message.trim()} onClick={()=>void cancel()}>{saving?'Annullamento…':'Conferma annullamento'}</button></div></Modal>}
 </div>
}

function EmptyLog(){return <div className="empty"><History size={25}/><strong>Nessuna attività</strong><span>Le operazioni effettuate compariranno qui.</span></div>}
function Info({label,value}:{label:string;value:any}){return <div className="info-row"><span>{label}</span><strong>{value||'—'}</strong></div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={close}><X/></button></div>{children}</div></div>}
