import React,{useEffect,useMemo,useState} from 'react'
import {Building2,Plus,Save,Trash2,Users,Pencil,UserPlus,X,ShieldCheck} from 'lucide-react'
import {FunctionsHttpError} from '@supabase/supabase-js'
import {supabase} from './lib/supabase'

type Props={access:any[]}
type SchoolUser={id:string;scuola_id:string;user_id:string;ruolo:string;attivo:boolean;data_inizio:string;data_fine:string|null}
type Assignment={id:string;scuola_utente_id:string;edificio_id:string;attivo:boolean;data_inizio:string;data_fine:string|null}
type ManagedUser={id:string;email:string;nome:string;cognome:string;telefono:string;attivo:boolean;roles:any[]}

const today=()=>new Date().toISOString().slice(0,10)
const roleLabel=(role:string)=>role==='dirigente_scolastico'?'Dirigente scolastico':'Delegato scolastico'

async function invokeAdminUsers(body:any){
 const {data,error}=await supabase.functions.invoke('admin-users',{body})
 if(error instanceof FunctionsHttpError){
   try{const payload=await error.context.json();throw new Error(payload?.error||payload?.message||error.message)}catch(e:any){throw e instanceof Error?e:new Error(error.message)}
 }
 if(error)throw new Error(error.message)
 if(data?.error)throw new Error(data.error)
 return data
}

export default function SchoolAdminPanel({access}:Props){
 const enteId=access[0]?.ente_id
 const [schools,setSchools]=useState<any[]>([])
 const [buildings,setBuildings]=useState<any[]>([])
 const [managedUsers,setManagedUsers]=useState<ManagedUser[]>([])
 const [schoolBuildings,setSchoolBuildings]=useState<any[]>([])
 const [schoolUsers,setSchoolUsers]=useState<SchoolUser[]>([])
 const [assignments,setAssignments]=useState<Assignment[]>([])
 const [selected,setSelected]=useState<any|null>(null)
 const [sourceBuildingId,setSourceBuildingId]=useState('')
 const [schoolName,setSchoolName]=useState(''),[code,setCode]=useState('')
 const [schoolBuildingId,setSchoolBuildingId]=useState('')
 const [message,setMessage]=useState('')
 const [userModal,setUserModal]=useState(false)
 const [userMode,setUserMode]=useState<'create'|'associate'|'edit'>('create')
 const [editingUser,setEditingUser]=useState<ManagedUser|null>(null)
 const [userId,setUserId]=useState('')
 const [userForm,setUserForm]=useState({nome:'',cognome:'',email:'',telefono:'',password:'',ruolo:'dirigente_scolastico',attivo:true,data_fine:''})
 const [selectedBuildings,setSelectedBuildings]=useState<string[]>([])
 const [userSaving,setUserSaving]=useState(false)

 const load=async()=>{
   if(!enteId)return
   const [s,b]=await Promise.all([
     supabase.from('scuole').select('*').eq('ente_id',enteId).order('denominazione'),
     supabase.from('edifici').select('id,denominazione,codice_edificio,tipologia_scolastica,ente_id').eq('ente_id',enteId).order('denominazione')
   ])
   if(s.error){setMessage(s.error.message);return}
   if(b.error){setMessage(b.error.message);return}
   setSchools(s.data||[]);setBuildings(b.data||[])
   try{
     const data=await invokeAdminUsers({action:'list'})
     setManagedUsers(data?.users||[])
   }catch(e:any){setMessage('Elenco utenti non disponibile: '+(e?.message||String(e)))}
 }

 const loadSelected=async(schoolId:string)=>{
   const [sb,su,ass]=await Promise.all([
     supabase.from('scuole_edifici').select('id,scuola_id,edificio_id,attivo').eq('scuola_id',schoolId).order('created_at'),
     supabase.from('scuola_utenti').select('id,scuola_id,user_id,ruolo,attivo,data_inizio,data_fine').eq('scuola_id',schoolId).order('ruolo').order('created_at'),
     supabase.from('scuola_utenti_edifici').select('id,scuola_utente_id,edificio_id,attivo,data_inizio,data_fine')
   ])
   if(sb.error||su.error||ass.error){setMessage(sb.error?.message||su.error?.message||ass.error?.message||'Errore nel caricamento delle associazioni.');return}
   setSchoolBuildings(sb.data||[])
   setSchoolUsers(su.data||[])
   const ids=new Set((su.data||[]).map((x:any)=>x.id))
   setAssignments((ass.data||[]).filter((x:any)=>ids.has(x.scuola_utente_id)))
 }

 useEffect(()=>{void load()},[enteId])
 useEffect(()=>{if(selected)void loadSelected(selected.id);else{setSchoolBuildings([]);setSchoolUsers([]);setAssignments([])}},[selected?.id])

 const instituteBuildings=useMemo(()=>buildings.filter(b=>b.tipologia_scolastica==='SCU'),[buildings])
 const activeSchoolBuildings=useMemo(()=>schoolBuildings.filter(x=>x.attivo),[schoolBuildings])
 const schoolBuildingIds=useMemo(()=>new Set(activeSchoolBuildings.map(x=>x.edificio_id)),[activeSchoolBuildings])
 const availableBuildings=useMemo(()=>buildings.filter(b=>schoolBuildingIds.has(b.id)),[buildings,schoolBuildingIds])
 const schoolUserIds=useMemo(()=>new Set(schoolUsers.map(u=>u.user_id)),[schoolUsers])
 const selectableExistingUsers=useMemo(()=>managedUsers.filter(u=>!schoolUserIds.has(u.id)&&!u.roles?.some((r:any)=>['superadmin','admin_ente'].includes(r.ruolo))),[managedUsers,schoolUserIds])

 const profileName=(id:string)=>{
   const p=managedUsers.find(x=>x.id===id)
   return p?[p.cognome,p.nome].filter(Boolean).join(' ')||p.email||id:id
 }
 const buildingName=(id:string)=>buildings.find(x=>x.id===id)?.denominazione||id

 const selectInstitute=async(buildingId:string)=>{
   setSourceBuildingId(buildingId)
   if(!buildingId){setSelected(null);setSchoolName('');setCode('');setMessage('');return}
   const linked=await supabase.from('scuole_edifici').select('scuola_id').eq('edificio_id',buildingId).eq('attivo',true).limit(1).maybeSingle()
   if(linked.error){setMessage(linked.error.message);return}
   const linkedSchoolId=linked.data?.scuola_id||''\n   const school=linkedSchoolId?schools.find(s=>s.id===linkedSchoolId):null
   const building=instituteBuildings.find(b=>b.id===buildingId)
   if(school){
     setSelected(school);setSchoolName(school.denominazione||'');setCode(school.codice_meccanografico||'')
     setMessage('Istituto già configurato: puoi modificarne i dati e gestire gli utenti.')
   }else{
     setSelected(null);setSchoolName(building?.denominazione||'');setCode(building?.codice_edificio||'')
     setMessage('Istituto disponibile nel catalogo Edifici. Salva per configurarlo.')
   }
 }

 const selectSchool=async(school:any)=>{
   setSelected(school);setSchoolName(school.denominazione||'');setCode(school.codice_meccanografico||'')
   const {data,error}=await supabase.from('scuole_edifici').select('edificio_id').eq('scuola_id',school.id).eq('attivo',true).limit(1).maybeSingle()
   if(error){setMessage(error.message);return}
   setSourceBuildingId(data?.edificio_id||'')
 }

 const resetForm=()=>{
   setSelected(null);setSourceBuildingId('');setSchoolName('');setCode('')
   setSchoolBuildings([]);setSchoolUsers([]);setAssignments([])
 }

 const saveSchool=async()=>{
   if(!sourceBuildingId){setMessage('Seleziona prima un istituto disponibile nella sezione Edifici.');return}
   const source=instituteBuildings.find(b=>b.id===sourceBuildingId)
   if(!source){setMessage('L’istituto selezionato non è più disponibile nella sezione Edifici.');return}
   if(!schoolName.trim()){setMessage('Inserisci la denominazione dell’istituto.');return}
   const linked=await supabase.from('scuole_edifici').select('scuola_id').eq('edificio_id',sourceBuildingId).eq('attivo',true).limit(1).maybeSingle()
   if(linked.error){setMessage(linked.error.message);return}
   if(linked.data?.scuola_id&&linked.data.scuola_id!==selected?.id){setMessage('L’edificio selezionato è già associato a un altro istituto del Portale Scuola.');return}
   const payload={ente_id:enteId,denominazione:schoolName.trim(),codice_meccanografico:code.trim()||null}
   const q=selected?await supabase.from('scuole').update(payload).eq('id',selected.id):await supabase.from('scuole').insert(payload).select('id').single()
   if(q.error){setMessage(q.error.message);return}
   const schoolId=selected?.id||q.data?.id
   if(!schoolId){setMessage('Impossibile determinare l’istituto salvato.');return}
   const link=await supabase.from('scuole_edifici').upsert({scuola_id:schoolId,edificio_id:sourceBuildingId,attivo:true},{onConflict:'scuola_id,edificio_id'})
   if(link.error){setMessage(link.error.message);return}
   setMessage(selected?'Istituto modificato correttamente.':'Istituto aggiunto dal catalogo Edifici.')
   await load()
   const next=schools.find((x:any)=>x.id===schoolId) || (await supabase.from('scuole').select('*').eq('id',schoolId).maybeSingle()).data
   if(next){setSelected(next);setSchoolName(next.denominazione);setCode(next.codice_meccanografico||'');setSourceBuildingId(sourceBuildingId);await loadSelected(next.id)}
 }

 const deleteSchool=async()=>{
   if(!selected)return
   if(!confirm(`Cancellare l’istituto "${selected.denominazione}" e tutte le associazioni scolastiche? Gli account utente non verranno cancellati.`))return
   const {data:users,error:usersError}=await supabase.from('scuola_utenti').select('id,user_id').eq('scuola_id',selected.id)
   if(usersError){setMessage(usersError.message);return}
   const rows=users||[], ids=rows.map((x:any)=>x.id), userIds=rows.map((x:any)=>x.user_id)
   if(ids.length){const r=await supabase.from('scuola_utenti_edifici').delete().in('scuola_utente_id',ids);if(r.error){setMessage(r.error.message);return}}
   const r1=await supabase.from('scuola_utenti').delete().eq('scuola_id',selected.id);if(r1.error){setMessage(r1.error.message);return}
   const r2=await supabase.from('scuole_edifici').delete().eq('scuola_id',selected.id);if(r2.error){setMessage(r2.error.message);return}
   const r3=await supabase.from('scuole').delete().eq('id',selected.id);if(r3.error){setMessage(r3.error.message);return}
   for(const uid of userIds){
     const remaining=await supabase.from('scuola_utenti').select('id').eq('user_id',uid).eq('attivo',true).limit(1)
     if(!remaining.data?.length)await supabase.from('user_roles').delete().eq('user_id',uid).eq('ente_id',enteId).in('ruolo',['dirigente_scolastico','delegato_scolastico'])
   }
   setMessage('Istituto cancellato. Gli account utente sono stati mantenuti.')
   resetForm();await load()
 }

 const linkBuilding=async()=>{
   if(!selected||!schoolBuildingId)return
   const building=buildings.find(b=>b.id===schoolBuildingId)
   if(!building||building.ente_id!==enteId){setMessage('Edificio non valido per l’ente corrente.');return}
   const existing=await supabase.from('scuole_edifici').select('scuola_id').eq('edificio_id',schoolBuildingId).eq('attivo',true).limit(1).maybeSingle()
   if(existing.error){setMessage(existing.error.message);return}
   if(existing.data&&existing.data.scuola_id!==selected.id){setMessage('L’edificio è già associato a un altro istituto.');return}
   const {error}=await supabase.from('scuole_edifici').upsert({scuola_id:selected.id,edificio_id:schoolBuildingId,attivo:true},{onConflict:'scuola_id,edificio_id'})
   if(error)setMessage(error.message);else{setMessage('Edificio associato all’istituto.');setSchoolBuildingId('');await loadSelected(selected.id)}
 }

 const openCreateUser=()=>{
   if(!selected)return
   setUserMode('create');setEditingUser(null);setUserId('')
   setUserForm({nome:'',cognome:'',email:'',telefono:'',password:'',ruolo:'dirigente_scolastico',attivo:true,data_fine:''})
   setSelectedBuildings(activeSchoolBuildings.map(x=>x.edificio_id));setMessage('');setUserModal(true)
 }
 const openAssociateUser=()=>{
   if(!selected)return
   setUserMode('associate');setEditingUser(null);setUserId('')
   setUserForm({nome:'',cognome:'',email:'',telefono:'',password:'',ruolo:'dirigente_scolastico',attivo:true,data_fine:''})
   setSelectedBuildings(activeSchoolBuildings.map(x=>x.edificio_id));setMessage('');setUserModal(true)
 }
 const openEditUser=(u:ManagedUser)=>{
   if(!selected)return
   const su=schoolUsers.find(x=>x.user_id===u.id)
   if(!su)return
   const auth=managedUsers.find(x=>x.id===u.id)||u
   setUserMode('edit');setEditingUser(auth);setUserId(u.id)
   setUserForm({nome:auth.nome||'',cognome:auth.cognome||'',email:auth.email||'',telefono:auth.telefono||'',password:'',ruolo:su.ruolo,attivo:su.attivo,data_fine:su.data_fine||''})
   setSelectedBuildings(assignments.filter(a=>a.scuola_utente_id===su.id&&a.attivo).map(a=>a.edificio_id))
   setMessage('');setUserModal(true)
 }

 const ensureSchoolRole=async(uid:string,role:string)=>{
   const {error}=await supabase.from('user_roles').upsert({user_id:uid,ente_id:enteId,ruolo:role},{onConflict:'user_id,ente_id,ruolo'})
   if(error)throw new Error(error.message)
 }

 const syncSchoolRoleAfterChange=async(uid:string,oldRole:string,newRole:string)=>{
   if(oldRole===newRole)return
   await ensureSchoolRole(uid,newRole)
   const remaining=await supabase.from('scuola_utenti').select('id').eq('user_id',uid).eq('ruolo',oldRole).eq('attivo',true).neq('scuola_id',selected?.id||'').limit(1)
   if(!remaining.data?.length)await supabase.from('user_roles').delete().eq('user_id',uid).eq('ente_id',enteId).eq('ruolo',oldRole)
 }

 const saveUser=async()=>{
   if(!selected){setMessage('Seleziona prima un istituto.');return}
   if(!selectedBuildings.length){setMessage('Assegna almeno un edificio dell’istituto all’utente.');return}
   if(userMode==='associate'&&!userId){setMessage('Seleziona un utente esistente.');return}
   if(userMode==='create'&&(!userForm.email.trim()||!userForm.password||userForm.password.length<8)){setMessage('Per un nuovo utente sono obbligatori e-mail e password di almeno 8 caratteri.');return}
   setUserSaving(true)
   try{
     let uid=userId
     if(userMode==='create'){
       const data=await invokeAdminUsers({action:'create',nome:userForm.nome,cognome:userForm.cognome,email:userForm.email,telefono:userForm.telefono,password:userForm.password,ente_id:enteId,ruolo:userForm.ruolo,attivo:userForm.attivo})
       uid=data?.user?.id
       if(!uid)throw new Error('Il sistema non ha restituito l’identificativo del nuovo utente.')
     }else if(userMode==='associate'){
       await ensureSchoolRole(uid,userForm.ruolo)
     }else if(editingUser){
       await invokeAdminUsers({action:'update_profile',user_id:uid,ente_id:enteId,nome:userForm.nome,cognome:userForm.cognome,email:userForm.email,telefono:userForm.telefono,password:userForm.password,attivo:userForm.attivo})
       const current=schoolUsers.find(x=>x.user_id===uid)
       if(current)await syncSchoolRoleAfterChange(uid,current.ruolo,userForm.ruolo)
     }

     let schoolUserId=schoolUsers.find(x=>x.user_id===uid)?.id
     const schoolPayload={scuola_id:selected.id,user_id:uid,ruolo:userForm.ruolo,attivo:userForm.attivo,data_inizio:schoolUsers.find(x=>x.user_id===uid)?.data_inizio||today(),data_fine:userForm.data_fine||null}
     const su=await supabase.from('scuola_utenti').upsert(schoolPayload,{onConflict:'scuola_id,user_id'}).select('id').single()
     if(su.error||!su.data)throw new Error(su.error?.message||'Associazione utente/istituto non riuscita.')
     schoolUserId=su.data.id

     const existing=assignments.filter(a=>a.scuola_utente_id===schoolUserId)
     const wanted=new Set(selectedBuildings)
     for(const a of existing){
       if(!wanted.has(a.edificio_id)){const r=await supabase.from('scuola_utenti_edifici').update({attivo:false,data_fine:userForm.data_fine||today()}).eq('id',a.id);if(r.error)throw new Error(r.error.message)}
     }
     for(const bid of selectedBuildings){
       const r=await supabase.from('scuola_utenti_edifici').upsert({scuola_utente_id:schoolUserId,edificio_id:bid,attivo:true,data_inizio:today(),data_fine:userForm.data_fine||null},{onConflict:'scuola_utente_id,edificio_id'})
       if(r.error)throw new Error(r.error.message)
     }
     setUserModal(false);setMessage(userMode==='create'?'Utente creato e associato all’istituto.':userMode==='associate'?'Utente associato all’istituto.':'Utente modificato correttamente.')
     await load();await loadSelected(selected.id)
   }catch(e:any){
     if(userMode==='create'&&userId=== ''&&false){}
     setMessage('Operazione utente non riuscita: '+(e?.message||String(e)))
   }finally{setUserSaving(false)}
 }

 const removeSchoolUser=async(u:SchoolUser)=>{
   const profile=managedUsers.find(x=>x.id===u.user_id)
   if(!confirm(`Rimuovere "${profile?[profile.cognome,profile.nome].filter(Boolean).join(' ')||profile.email:'utente'}" dall’istituto? L’account globale non verrà cancellato.`))return
   const r1=await supabase.from('scuola_utenti_edifici').delete().eq('scuola_utente_id',u.id)
   if(r1.error){setMessage(r1.error.message);return}
   const r2=await supabase.from('scuola_utenti').delete().eq('id',u.id)
   if(r2.error){setMessage(r2.error.message);return}
   const remaining=await supabase.from('scuola_utenti').select('id').eq('user_id',u.user_id).eq('attivo',true).limit(1)
   if(!remaining.data?.length)await supabase.from('user_roles').delete().eq('user_id',u.user_id).eq('ente_id',enteId).in('ruolo',['dirigente_scolastico','delegato_scolastico'])
   setMessage('Utente rimosso dall’istituto. L’account globale è stato mantenuto.')
   await loadSelected(selected.id);await load()
 }

 return <section className="card school-admin-panel">
  <div className="card-head"><div><h2>Scuole e delegati</h2><p>Gestisci gli istituti dal catalogo Edifici e associa per ciascun istituto uno o più dirigenti/delegati.</p></div><Users size={20}/></div>
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
    <div className="card-head" style={{marginBottom:10}}><div><h3>Utenti dell’istituto</h3><p>Ogni utente può essere abilitato su uno o più edifici associati all’istituto.</p></div><Users size={19}/></div>
    {selected?<>
      <div className="form-actions" style={{marginBottom:12}}>
       <button className="btn primary" onClick={openCreateUser}><UserPlus size={15}/> Crea nuovo utente</button>
       <button className="btn secondary" onClick={openAssociateUser} disabled={!selectableExistingUsers.length}><Users size={15}/> Associa utente esistente</button>
      </div>
      <div className="school-admin-assignments">
       {schoolUsers.length?schoolUsers.map(u=><div className="school-admin-item" key={u.id}>
         <Users size={16}/><span><b>{profileName(u.user_id)}</b><small>{roleLabel(u.ruolo)} · {u.attivo?'Attivo':'Disattivato'}</small>{assignments.filter(a=>a.scuola_utente_id===u.id&&a.attivo).map(a=><small key={a.id}>• {buildingName(a.edificio_id)}</small>)}</span>
         <div className="row-actions"><button className="icon-btn dark-icon" title="Modifica utente" onClick={()=>openEditUser(managedUsers.find(x=>x.id===u.user_id) as ManagedUser)}><Pencil size={15}/></button><button className="icon-btn dark-icon" title="Rimuovi dall’istituto" onClick={()=>void removeSchoolUser(u)}><Trash2 size={15}/></button></div>
       </div>):<div className="empty"><Users size={25}/><strong>Nessun utente associato</strong><span>Crea un nuovo account oppure associa un utente già presente nel sistema.</span></div>}
      </div>
    </>:<div className="empty"><Building2 size={25}/><strong>Seleziona un istituto</strong><span>Gli utenti saranno gestiti esclusivamente per l’istituto selezionato.</span></div>}
   </div>
  </div>

  {selected&&<div className="school-admin-building-links">
   <div className="card-head"><div><h3>Edifici associati all’istituto</h3><p>Questi sono gli edifici sui quali i dirigenti e delegati possono operare.</p></div><Building2 size={18}/></div>
   <div className="form-grid">
    <label>Edificio da associare<select value={schoolBuildingId} onChange={e=>setSchoolBuildingId(e.target.value)}><option value="">Seleziona edificio…</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.codice_edificio} — {b.denominazione}</option>)}</select></label>
    <div className="form-actions"><button className="btn secondary" onClick={()=>void linkBuilding()}><Plus size={15}/> Associa edificio</button></div>
   </div>
   <div className="school-admin-item"><Building2 size={16}/><span>{activeSchoolBuildings.length?activeSchoolBuildings.map(x=><small key={x.id}>• {buildingName(x.edificio_id)}</small>):<small>Nessun edificio associato</small>}</span></div>
  </div>}

  {userModal&&selected&&<div className="modal-backdrop">
   <div className="modal" style={{maxWidth:760}}>
    <div className="modal-head"><h2>{userMode==='create'?'Crea nuovo utente':userMode==='associate'?'Associa utente esistente':'Modifica utente'}</h2><button className="icon-btn" onClick={()=>setUserModal(false)}><X size={18}/></button></div>
    <div className="notice info">I dati dell’account vengono gestiti tramite il sistema utenti già in uso. L’associazione scolastica è separata dall’account globale.</div>
    {userMode==='associate'?<div className="form-grid">
      <label className="span-2">Utente esistente<select value={userId} onChange={e=>{
        const id=e.target.value;setUserId(id);const u=managedUsers.find(x=>x.id===id);if(u)setUserForm(f=>({...f,nome:u.nome,cognome:u.cognome,email:u.email,telefono:u.telefono,attivo:u.attivo}))
      }}><option value="">Seleziona utente…</option>{selectableExistingUsers.map(u=><option key={u.id} value={u.id}>{[u.cognome,u.nome].filter(Boolean).join(' ')||u.email} · {u.email}</option>)}</select></label>
    </div>:<div className="form-grid">
      <label>Nome<input value={userForm.nome} onChange={e=>setUserForm({...userForm,nome:e.target.value})} required/></label>
      <label>Cognome<input value={userForm.cognome} onChange={e=>setUserForm({...userForm,cognome:e.target.value})} required/></label>
      <label>E-mail<input type="email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} required/></label>
      <label>Telefono<input value={userForm.telefono} onChange={e=>setUserForm({...userForm,telefono:e.target.value})}/></label>
      <label className="span-2">Password {userMode==='edit'&&<small>(lascia vuoto per non modificarla)</small>}<input type="password" minLength={userMode==='create'?8:0} value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} placeholder={userMode==='edit'?'Password invariata':'Minimo 8 caratteri'}/></label>
    </div>}
    {userMode==='associate'&&userId&&<div className="form-grid">
      <label>Nome<input value={userForm.nome} onChange={e=>setUserForm({...userForm,nome:e.target.value})}/></label>
      <label>Cognome<input value={userForm.cognome} onChange={e=>setUserForm({...userForm,cognome:e.target.value})}/></label>
      <label>E-mail<input type="email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})}/></label>
      <label>Telefono<input value={userForm.telefono} onChange={e=>setUserForm({...userForm,telefono:e.target.value})}/></label>
    </div>}
    <div className="form-grid">
      <label>Ruolo nell’istituto<select value={userForm.ruolo} onChange={e=>setUserForm({...userForm,ruolo:e.target.value})}><option value="dirigente_scolastico">Dirigente scolastico</option><option value="delegato_scolastico">Delegato scolastico</option></select></label>
      <label>Data fine autorizzazione<input type="date" value={userForm.data_fine} onChange={e=>setUserForm({...userForm,data_fine:e.target.value})}/></label>
      <label className="checkbox-label"><input type="checkbox" checked={userForm.attivo} onChange={e=>setUserForm({...userForm,attivo:e.target.checked})}/> Utente attivo per l’istituto</label>
    </div>
    <div className="card" style={{padding:14,marginTop:10}}>
      <div className="card-head"><div><h3>Edifici autorizzati</h3><p>Le richieste di intervento saranno visibili e inseribili solo per gli edifici selezionati.</p></div><ShieldCheck size={18}/></div>
      <div className="form-grid">
       {activeSchoolBuildings.length?activeSchoolBuildings.map(x=><label key={x.id} className="permission-check"><input type="checkbox" checked={selectedBuildings.includes(x.edificio_id)} onChange={e=>setSelectedBuildings(prev=>e.target.checked?[...new Set([...prev,x.edificio_id])]:prev.filter(id=>id!==x.edificio_id))}/><span>{buildingName(x.edificio_id)}</span></label>):<div className="notice warning">Associa prima almeno un edificio all’istituto.</div>}
      </div>
    </div>
    <div className="form-actions" style={{marginTop:14}}><button className="btn secondary" type="button" onClick={()=>setUserModal(false)} disabled={userSaving}>Annulla</button><button className="btn primary" type="button" onClick={()=>void saveUser()} disabled={userSaving}>{userSaving?'Salvataggio…':userMode==='create'?'Crea e associa':userMode==='associate'?'Associa utente':'Salva modifiche'}</button></div>
   </div>
  </div>}
 </section>
}
