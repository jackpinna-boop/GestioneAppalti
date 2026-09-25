import React,{useEffect,useMemo,useState} from 'react'
import {Building2,Plus,Save,Trash2,Users} from 'lucide-react'
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
 const [sourceBuildingId,setSourceBuildingId]=useState('')
 const [schoolName,setSchoolName]=useState(''),[code,setCode]=useState('')
 const [schoolBuildingId,setSchoolBuildingId]=useState(''),[assignmentBuildingId,setAssignmentBuildingId]=useState(''),[userId,setUserId]=useState('')
 const [role,setRole]=useState('dirigente_scolastico'),[message,setMessage]=useState('')

 const load=async()=>{
   if(!enteId)return
   const [s,b,p]=await Promise.all([
     supabase.from('scuole').select('*').eq('ente_id',enteId).order('denominazione'),
     supabase.from('edifici').select('id,denominazione,codice_edificio,tipologia_scolastica').eq('ente_id',enteId).order('denominazione'),
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
 useEffect(()=>{if(selected)void loadSelected(selected.id);else{setSchoolBuildings([]);setSchoolUsers([]);setAssignments([])}},[selected?.id])

 const instituteBuildings=useMemo(()=>buildings.filter(b=>b.tipologia_scolastica==='SCU'),[buildings])
 const availableBuildings=useMemo(()=>{
   const linked=new Set(schoolBuildings.filter(x=>x.attivo).map(x=>x.edificio_id))
   return buildings.filter(b=>linked.has(b.id))
 },[buildings,schoolBuildings])

 const profileName=(id:string)=>{
   const p=profiles.find(x=>x.id===id)
   return p?[p.cognome,p.nome].filter(Boolean).join(' ')||p.email||id:id
 }
 const buildingName=(id:string)=>buildings.find(x=>x.id===id)?.denominazione||id

 const selectInstitute=async(buildingId:string)=>{
   setSourceBuildingId(buildingId)
   if(!buildingId){
     if(!selected){setSchoolName('');setCode('')}
     return
   }
   const linked=await supabase.from('scuole_edifici').select('scuola_id').eq('edificio_id',buildingId).eq('attivo',true).maybeSingle()
   const schoolId=linked.data?.scuola_id
   const school=schoolId?schools.find(s=>s.id===schoolId):null
   const building=instituteBuildings.find(b=>b.id===buildingId)
   if(school){
     setSelected(school);setSchoolName(school.denominazione||'');setCode(school.codice_meccanografico||'')
     setMessage('Istituto già configurato: puoi modificarne i dati.')
   }else{
     setSelected(null);setSchoolName(building?.denominazione||'');setCode(building?.codice_edificio||'')
     setMessage('Istituto disponibile negli edifici selezionato. Salva per configurarlo nel Portale Scuola.')
   }
 }

 const selectSchool=(school:any)=>{
   setSelected(school);setSchoolName(school.denominazione||'');setCode(school.codice_meccanografico||'')
   const link=schoolBuildings.find(x=>x.attivo)
   setSourceBuildingId(link?.edificio_id||'')
   if(!link)void (async()=>{
     const {data}=await supabase.from('scuole_edifici').select('edificio_id').eq('scuola_id',school.id).eq('attivo',true).limit(1).maybeSingle()
     setSourceBuildingId(data?.edificio_id||'')
   })()
 }

 const resetForm=()=>{
   setSelected(null);setSourceBuildingId('');setSchoolName('');setCode('');setSchoolBuildings([]);setSchoolUsers([]);setAssignments([]);setSchoolBuildingId('')
 }

 const saveSchool=async()=>{
   if(!sourceBuildingId){setMessage('Seleziona prima un istituto disponibile nella sezione Edifici.');return}
   const source=instituteBuildings.find(b=>b.id===sourceBuildingId)
   if(!source){setMessage('L’istituto selezionato non è più disponibile nella sezione Edifici.');return}
   if(!schoolName.trim()){setMessage('Inserisci la denominazione dell’istituto.');return}

   const linked=await supabase.from('scuole_edifici').select('scuola_id').eq('edificio_id',sourceBuildingId).eq('attivo',true).maybeSingle()
   if(linked.error){setMessage(linked.error.message);return}
   if(linked.data?.scuola_id && linked.data.scuola_id!==selected?.id){
     setMessage('L’edificio selezionato è già associato a un altro istituto del Portale Scuola.');return
   }

   const payload={ente_id:enteId,denominazione:schoolName.trim(),codice_meccanografico:code.trim()||null}
   let schoolId=selected?.id
   const q=selected?await supabase.from('scuole').update(payload).eq('id',selected.id):await supabase.from('scuole').insert(payload).select('id').single()
   if(q.error){setMessage(q.error.message);return}
   if(!selected)schoolId=q.data?.id
   if(!schoolId){setMessage('Impossibile determinare l’istituto salvato.');return}

   const link=await supabase.from('scuole_edifici').upsert({scuola_id:schoolId,edificio_id:sourceBuildingId,attivo:true},{onConflict:'scuola_id,edificio_id'})
   if(link.error){setMessage(link.error.message);return}
   setMessage(selected?'Istituto modificato correttamente.':'Istituto aggiunto dal catalogo Edifici.')
   const {data:nextSchools}=await supabase.from('scuole').select('*').eq('ente_id',enteId).order('denominazione')
   setSchools(nextSchools||[])
   const next=(nextSchools||[]).find((x:any)=>x.id===schoolId)
   if(next){setSelected(next);setSchoolName(next.denominazione);setCode(next.codice_meccanografico||'');await loadSelected(next.id)}
 }

 const deleteSchool=async()=>{
   if(!selected)return
   if(!confirm(`Cancellare l'istituto "${selected.denominazione}" e tutte le sue associazioni al Portale Scuola?`))return
   const {data:users,error:usersError}=await supabase.from('scuola_utenti').select('id').eq('scuola_id',selected.id)
   if(usersError){setMessage(usersError.message);return}
   const userIds=(users||[]).map((x:any)=>x.id)
   if(userIds.length){
     const r=await supabase.from('scuola_utenti_edifici').delete().in('scuola_utente_id',userIds)
     if(r.error){setMessage(r.error.message);return}
   }
   let r=await supabase.from('scuola_utenti').delete().eq('scuola_id',selected.id)
   if(r.error){setMessage(r.error.message);return}
   r=await supabase.from('scuole_edifici').delete().eq('scuola_id',selected.id)
   if(r.error){setMessage(r.error.message);return}
   r=await supabase.from('scuole').delete().eq('id',selected.id)
   if(r.error){setMessage(r.error.message);return}
   setMessage('Istituto cancellato.')
   resetForm()
   await load()
 }

 const linkBuilding=async()=>{
   if(!selected||!schoolBuildingId)return
   const {error}=await supabase.from('scuole_edifici').upsert({scuola_id:selected.id,edificio_id:schoolBuildingId,attivo:true},{onConflict:'scuola_id,edificio_id'})
   if(error)setMessage(error.message);else{setMessage('Edificio associato all’istituto.');setSchoolBuildingId('');await loadSelected(selected.id)}
 }

 const assign=async()=>{
   if(!selected||!userId||!assignmentBuildingId){setMessage('Seleziona utente ed edificio autorizzato.');return}
   if(!availableBuildings.some(b=>b.id===assignmentBuildingId)){setMessage('L’edificio deve essere prima associato all’istituto.');return}
   const {data,error}=await supabase.from('scuola_utenti').upsert({scuola_id:selected.id,user_id:userId,ruolo:role,attivo:true},{onConflict:'scuola_id,user_id'}).select('id').single()
   if(error||!data){setMessage(error?.message||'Impossibile assegnare l’utente.');return}
   const {error:e2}=await supabase.from('scuola_utenti_edifici').upsert({scuola_utente_id:data.id,edificio_id:assignmentBuildingId,attivo:true},{onConflict:'scuola_utente_id,edificio_id'})
   if(e2)setMessage(e2.message);else{setMessage('Utente autorizzato per l’edificio.');setUserId('');setAssignmentBuildingId('');await loadSelected(selected.id)}
 }

 const deactivate=async(id:string)=>{
   const {error}=await supabase.from('scuola_utenti_edifici').update({attivo:false}).eq('id',id)
   if(error)setMessage(error.message);else{setMessage('Autorizzazione edificio disattivata.');if(selected)await loadSelected(selected.id)}
 }

 return <section className="card school-admin-panel">
  <div className="card-head"><div><h2>Scuole e delegati</h2><p>Seleziona gli istituti dal catalogo Edifici e gestisci le relative configurazioni.</p></div><Users size={20}/></div>
  {message&&<div className="notice info">{message}</div>}
  <div className="school-admin-grid">
   <div>
    <div className="form-grid school-admin-form">
      <label className="span-2">Istituto disponibile nella sezione Edifici
       <select value={sourceBuildingId} onChange={e=>void selectInstitute(e.target.value)}>
        <option value="">Seleziona un istituto…</option>
        {instituteBuildings.map(b=><option key={b.id} value={b.id}>{b.codice_edificio} — {b.denominazione}</option>)}
       </select>
      </label>
      <label>Denominazione istituto<input value={schoolName} onChange={e=>setSchoolName(e.target.value)} disabled={!sourceBuildingId}/></label>
      <label>Codice meccanografico<input value={code} onChange={e=>setCode(e.target.value)} disabled={!sourceBuildingId}/></label>
      <div className="form-actions span-2">
       <button className="btn primary" onClick={()=>void saveSchool()} disabled={!sourceBuildingId}><Save size={15}/> {selected?'Modifica istituto':'Aggiungi istituto'}</button>
       {selected&&<button className="btn danger" onClick={()=>void deleteSchool()}><Trash2 size={15}/> Cancella istituto</button>}
       {(selected||sourceBuildingId||schoolName||code)&&<button className="btn secondary" onClick={resetForm}>Nuovo / Annulla</button>}
      </div>
    </div>
    <div className="school-admin-list">
      {schools.map(s=><button key={s.id} className={'school-admin-item '+(selected?.id===s.id?'active':'')} onClick={()=>void selectSchool(s)}><Building2 size={16}/><span><b>{s.denominazione}</b><small>{s.codice_meccanografico||'Codice non indicato'}</small></span></button>)}
      {!schools.length&&<div className="empty"><Building2 size={25}/><strong>Nessun istituto configurato</strong><span>Seleziona un istituto dal catalogo Edifici per aggiungerlo.</span></div>}
    </div>
   </div>
   <div>
    <h3>Associazioni per istituto</h3>
    {selected?<><div className="form-grid">
       <label>Edificio dell’istituto<select value={schoolBuildingId} onChange={e=>setSchoolBuildingId(e.target.value)}><option value="">Seleziona edificio…</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.denominazione}</option>)}</select></label>
       <div className="form-actions"><button className="btn secondary" onClick={()=>void linkBuilding()}><Plus size={15}/> Associa edificio</button></div>
      </div>
      <div className="form-grid">
       <label>Utente<select value={userId} onChange={e=>setUserId(e.target.value)}><option value="">Seleziona utente…</option>{profiles.map(p=><option key={p.id} value={p.id}>{[p.cognome,p.nome].filter(Boolean).join(' ')} · {p.email||p.id}</option>)}</select></label>
       <label>Ruolo<select value={role} onChange={e=>setRole(e.target.value)}><option value="dirigente_scolastico">Dirigente scolastico</option><option value="delegato_scolastico">Delegato scolastico</option></select></label>
       <label>Edificio autorizzato<select value={assignmentBuildingId} onChange={e=>setAssignmentBuildingId(e.target.value)}><option value="">Seleziona edificio…</option>{availableBuildings.map(b=><option key={b.id} value={b.id}>{b.denominazione}</option>)}</select></label>
       <div className="form-actions"><button className="btn primary" onClick={()=>void assign()}><Users size={15}/> Assegna</button></div>
      </div>
      <div className="school-admin-assignments"><h3>Autorizzazioni attive</h3>
       {schoolUsers.length?schoolUsers.map(u=><div className="school-admin-item" key={u.id}><Users size={16}/><span><b>{profileName(u.user_id)}</b><small>{u.ruolo==='dirigente_scolastico'?'Dirigente scolastico':'Delegato scolastico'}</small>{assignments.filter(a=>a.scuola_utente_id===u.id&&a.attivo).map(a=><small key={a.id}>• {buildingName(a.edificio_id)}</small>)}</span></div>):<div className="empty"><Users size={25}/><strong>Nessuna assegnazione</strong><span>La fase successiva consentirà di assegnare dirigenti e delegati per istituto ed edificio.</span></div>}
      </div></>:<div className="empty"><Building2 size={25}/><strong>Seleziona un istituto</strong><span>Gli istituti provengono dal catalogo della sezione Edifici.</span></div>}
   </div>
  </div>
 </section>
}
