import React,{useEffect,useMemo,useState} from 'react'
import {Building2,Plus,Save,UserMinus,Users} from 'lucide-react'
import {supabase} from './lib/supabase'

type Props={access:any[]}
type SchoolUser={id:string;user_id:string;ruolo:string;attivo:boolean}
type Assignment={id:string;scuola_utente_id:string;edificio_id:string;attivo:boolean}

export default function SchoolAdminPanel({access}:Props){
 const enteId=access[0]?.ente_id
 const [schools,setSchools]=useState<any[]>([])
 const [buildings,setBuildings]=useState<any[]>([])
 const [profiles,setProfiles]=useState<any[]>([])
 const [schoolBuildings,setSchoolBuildings]=useState<any[]>([])
 const [schoolUsers,setSchoolUsers]=useState<SchoolUser[]>([])
 const [assignments,setAssignments]=useState<Assignment[]>([])
 const [selected,setSelected]=useState<any|null>(null)
 const [schoolName,setSchoolName]=useState(''),[code,setCode]=useState('')
 const [buildingId,setBuildingId]=useState(''),[userId,setUserId]=useState('')
 const [role,setRole]=useState('dirigente_scolastico'),[message,setMessage]=useState('')

 const load=async()=>{
   if(!enteId)return
   const [s,b,p]=await Promise.all([
     supabase.from('scuole').select('*').eq('ente_id',enteId).order('denominazione'),
     supabase.from('edifici').select('id,denominazione,codice_edificio').eq('ente_id',enteId).order('denominazione'),
     supabase.from('profiles').select('id,nome,cognome,email').order('cognome')
   ])
   setSchools(s.data||[]);setBuildings(b.data||[]);setProfiles(p.data||[])
 }
 const loadSelected=async(schoolId:string)=>{
   const [sb,su,ass]=await Promise.all([
     supabase.from('scuole_edifici').select('id,scuola_id,edificio_id,attivo').eq('scuola_id',schoolId),
     supabase.from('scuola_utenti').select('id,user_id,ruolo,attivo').eq('scuola_id',schoolId).order('ruolo'),
     supabase.from('scuola_utenti_edifici').select('id,scuola_utente_id,edificio_id,attivo')
   ])
   setSchoolBuildings(sb.data||[]);setSchoolUsers(su.data||[])
   const userIds=new Set((su.data||[]).map((x:any)=>x.id))
   setAssignments((ass.data||[]).filter((x:any)=>userIds.has(x.scuola_utente_id)))
 }
 useEffect(()=>{void load()},[enteId])
 useEffect(()=>{if(selected)void loadSelected(selected.id)},[selected?.id])

 const availableBuildings=useMemo(()=>{
   const linked=new Set(schoolBuildings.filter(x=>x.attivo).map(x=>x.edificio_id))
   return buildings.filter(b=>linked.has(b.id))
 },[buildings,schoolBuildings])

 const profileName=(id:string)=>{
   const p=profiles.find(x=>x.id===id)
   return p?[p.cognome,p.nome].filter(Boolean).join(' ')||p.email||id:id
 }
 const buildingName=(id:string)=>buildings.find(x=>x.id===id)?.denominazione||id

 const saveSchool=async()=>{
   if(!schoolName.trim())return
   const payload={ente_id:enteId,denominazione:schoolName.trim(),codice_meccanografico:code.trim()||null}
   const q=selected?supabase.from('scuole').update(payload).eq('id',selected.id):supabase.from('scuole').insert(payload)
   const {error}=await q
   if(error)setMessage(error.message)
   else{setMessage('Istituto salvato.');setSchoolName('');setCode('');setSelected(null);await load()}
 }
 const linkBuilding=async()=>{
   if(!selected||!buildingId)return
   const {error}=await supabase.from('scuole_edifici').upsert({scuola_id:selected.id,edificio_id:buildingId,attivo:true},{onConflict:'scuola_id,edificio_id'})
   if(error)setMessage(error.message);else{setMessage('Edificio associato all’istituto.');setBuildingId('');await loadSelected(selected.id)}
 }
 const assign=async()=>{
   if(!selected||!userId||!buildingId){setMessage('Seleziona utente ed edificio autorizzato.');return}
   if(!availableBuildings.some(b=>b.id===buildingId)){setMessage('L’edificio deve essere prima associato all’istituto.');return}
   const {data,error}=await supabase.from('scuola_utenti').upsert({scuola_id:selected.id,user_id:userId,ruolo:role,attivo:true},{onConflict:'scuola_id,user_id'}).select('id').single()
   if(error||!data){setMessage(error?.message||'Impossibile assegnare l’utente.');return}
   const {error:e2}=await supabase.from('scuola_utenti_edifici').upsert({scuola_utente_id:data.id,edificio_id:buildingId,attivo:true},{onConflict:'scuola_utente_id,edificio_id'})
   if(e2)setMessage(e2.message);else{setMessage('Utente autorizzato per l’edificio.');setUserId('');setBuildingId('');await loadSelected(selected.id)}
 }
 const deactivate=async(id:string)=>{
   const {error}=await supabase.from('scuola_utenti_edifici').update({attivo:false}).eq('id',id)
   if(error)setMessage(error.message);else{setMessage('Autorizzazione edificio disattivata.');if(selected)await loadSelected(selected.id)}
 }

 return <section className="card school-admin-panel">
  <div className="card-head"><div><h2>Scuole e delegati</h2><p>Gestione del perimetro autorizzativo del Portale Scuola.</p></div><Users size={20}/></div>
  {message&&<div className="notice info">{message}</div>}
  <div className="school-admin-grid">
   <div>
    <div className="school-admin-list">{schools.map(s=><button key={s.id} className={'school-admin-item '+(selected?.id===s.id?'active':'')} onClick={()=>{setSelected(s);setSchoolName(s.denominazione);setCode(s.codice_meccanografico||'')}}><Building2 size={16}/><span><b>{s.denominazione}</b><small>{s.codice_meccanografico||'Codice non indicato'}</small></span></button>)}</div>
    <div className="form-grid school-admin-form"><label>Denominazione istituto<input value={schoolName} onChange={e=>setSchoolName(e.target.value)}/></label><label>Codice meccanografico<input value={code} onChange={e=>setCode(e.target.value)}/></label><div className="form-actions span-2"><button className="btn primary" onClick={()=>void saveSchool()}><Save size={15}/> Salva istituto</button></div></div>
   </div>
   <div>
    <h3>Associazioni per istituto</h3>
    {selected?<>
      <div className="form-grid">
       <label>Edificio dell’istituto<select value={buildingId} onChange={e=>setBuildingId(e.target.value)}><option value="">Seleziona edificio…</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.denominazione}</option>)}</select></label>
       <div className="form-actions"><button className="btn secondary" onClick={()=>void linkBuilding()}><Plus size={15}/> Associa edificio</button></div>
      </div>
      <div className="form-grid">
       <label>Utente<select value={userId} onChange={e=>setUserId(e.target.value)}><option value="">Seleziona utente…</option>{profiles.map(p=><option key={p.id} value={p.id}>{[p.cognome,p.nome].filter(Boolean).join(' ')} · {p.email||p.id}</option>)}</select></label>
       <label>Ruolo<select value={role} onChange={e=>setRole(e.target.value)}><option value="dirigente_scolastico">Dirigente scolastico</option><option value="delegato_scolastico">Delegato scolastico</option></select></label>
       <label>Edificio autorizzato<select value={buildingId} onChange={e=>setBuildingId(e.target.value)}><option value="">Seleziona edificio…</option>{availableBuildings.map(b=><option key={b.id} value={b.id}>{b.denominazione}</option>)}</select></label>
       <div className="form-actions"><button className="btn primary" onClick={()=>void assign()}><Users size={15}/> Assegna</button></div>
      </div>
      <div className="school-admin-assignments">
       <h3>Autorizzazioni attive</h3>
       {schoolUsers.length?schoolUsers.map(u=><div className="school-admin-item" key={u.id}><Users size={16}/><span><b>{profileName(u.user_id)}</b><small>{u.ruolo==='dirigente_scolastico'?'Dirigente scolastico':'Delegato scolastico'}</small>{assignments.filter(a=>a.scuola_utente_id===u.id&&a.attivo).map(a=><small key={a.id}>• {buildingName(a.edificio_id)} <button className="icon-btn" title="Disattiva autorizzazione" onClick={()=>void deactivate(a.id)}><UserMinus size={13}/></button></small>)}</span></div>):<div className="empty"><Users size={25}/><strong>Nessuna assegnazione</strong><span>Assegna dirigente o delegati agli edifici autorizzati.</span></div>}
      </div>
    </>:<div className="empty"><Building2 size={25}/><strong>Seleziona un istituto</strong><span>Potrai associare edifici e utenti.</span></div>}
   </div>
  </div>
 </section>
}
