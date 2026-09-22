import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Building2, ChevronRight, CircleAlert, ClipboardList, FileText, FolderOpen, Home, LogOut, Menu, Plus, Search, Settings, ShieldCheck, WalletCards, X, Upload, Download, RefreshCw, Pencil, Trash2, Printer, Paperclip, Wrench, UserCog, History, Save, RotateCcw, CheckCircle2, Eye, SlidersHorizontal, CalendarDays, ChevronDown } from 'lucide-react'
import { supabase } from './lib/supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import AuthScreen from './AuthScreen'

type Page='dashboard'|'edifici'|'richieste'|'interventi'|'intervento'|'fascicolo'|'report'|'amministrazione'|'manutenzioni'
type Access={user_id:string;ente_id:string;ruolo:string;ente:string}
type Building={id:string;codice_edificio:string;denominazione:string;indirizzo:string|null;comune:string|null;provincia:string|null;cap?:string|null;superficie:number|null;volume:number|null;anno_costruzione:number|null;tipologia_scolastica:string|null;centro_di_costo?:string|null}
type Intervention={id:string;ente_id:string;edificio_id:string;codice_intervento:string;titolo:string;descrizione:string|null;cup:string|null;importo_programmato:number;importo_finanziato:number;importo_contrattuale:number;stato:string;annualita_programmazione:number|null;priorita:number|null;edifici?:{denominazione:string}[]|null}
type Phase={id:string;fase:string;stato:string|null;percentuale_avanzamento:number;data_prevista_inizio:string|null;data_prevista_fine:string|null;data_effettiva_inizio:string|null;data_effettiva_fine:string|null;note:string|null}
type MaintenanceSystem={id:string;ente_id:string;edificio_id:string;tipo:'elettrico'|'idraulico'|'antincendio'|'elevatore';codice:string|null;denominazione:string;ubicazione:string|null;marca_modello:string|null;matricola:string|null;anno_installazione:number|null;stato:string;data_ultima_manutenzione:string|null;data_prossima_manutenzione:string|null;periodicita_mesi:number|null;ditta_manutentrice:string|null;referente:string|null;numero_rapporto:string|null;conformita:boolean;note:string|null}
type MaintenanceEvent={id:string;edificio_id:string;impianto_id:string|null;tipo:string;stato:string;data_richiesta:string;data_programmata:string|null;data_esecuzione:string|null;descrizione:string;esito:string|null;costo_previsto:number;costo_consuntivo:number;operatore:string|null;numero_rapporto:string|null;note:string|null}
const money=(n:number|null|undefined)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n||0))
const date=(s:string|null|undefined)=>s?new Intl.DateTimeFormat('it-IT').format(new Date(s+'T00:00:00')):'—'
const statusLabel=(s:string)=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())
const statusClass=(s:string)=>({programmato:'gray',progettazione:'blue',approvato:'blue',affidamento:'amber',contratto:'amber',esecuzione:'green',fine_lavori:'green',collaudo:'purple',chiuso:'green',sospeso:'red',annullato:'red'}[s]||'gray')
const isManutentore=(a:Access[])=>a.some(x=>x.ruolo==='manutentore')
const canWrite=(a:Access[])=>a.length>0
const canManage=(a:Access[])=>a.some(x=>['superadmin','admin_ente','rup'].includes(x.ruolo))
const managedRoles=['admin_ente','rup','tecnico','amministrativo','direttore_lavori','auditor','consultatore','manutentore']

export default function App(){
 const [session,setSession]=useState<any>(null);const [ready,setReady]=useState(false)
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[])
 if(!ready)return <div className="loading-screen">Caricamento…</div>
 if(!session)return <AuthScreen/>
 return <AppShell session={session}/>
}


function AppShell({session}:{session:any}){
 const [page,setPage]=useState<Page>((location.hash.replace('#/','').split('/')[0] as Page)||'dashboard');const [access,setAccess]=useState<Access[]>([]);const [mobile,setMobile]=useState(false);const [selectedId,setSelectedId]=useState<string|null>(location.hash.split('/')[2]||null);const [refresh,setRefresh]=useState(0)
 const navigate=(p:Page,id?:string)=>{setSelectedId(id||null);setPage(p);setMobile(false);location.hash='/'+p+(id?'/'+id:'')}
 useEffect(()=>{const f=()=>{const p=location.hash.replace('#/','').split('/');setPage((p[0] as Page)||'dashboard');setSelectedId(p[1]||null)};window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[])
 useEffect(()=>{(async()=>{const {data:roles,error}=await supabase.from('user_roles').select('user_id,ente_id,ruolo').eq('user_id',session.user.id);if(error){console.error('Errore caricamento ruoli:',error);setAccess([]);return}const ids=[...new Set((roles||[]).map((x:any)=>x.ente_id).filter(Boolean))];let enti:any[]=[];if(ids.length){const r=await supabase.from('enti').select('id,denominazione').in('id',ids);if(r.error)console.error('Errore caricamento enti:',r.error);enti=r.data||[]}const map=new Map(enti.map((e:any)=>[e.id,e.denominazione]));setAccess((roles||[]).map((x:any)=>({user_id:x.user_id,ente_id:x.ente_id,ruolo:x.ruolo,ente:map.get(x.ente_id)||''})) as Access[])})()},[refresh,session.user.id])
 const userName=session.user.user_metadata?.full_name||session.user.email?.split('@')[0]||'Utente';const role=access.some(x=>x.ruolo==='superadmin')?'superadmin':(access[0]?.ruolo||'non assegnato');const ente=access.find(x=>x.ruolo==='superadmin')?.ente||access[0]?.ente||'Nessun ente associato';const manutentore=isManutentore(access); useEffect(()=>{if(manutentore&&!['dashboard','edifici','richieste'].includes(page))navigate('dashboard')},[manutentore,page])
 return <div className="app-shell"><header className="topbar"><button className="mobile-menu" onClick={()=>setMobile(!mobile)}><Menu/></button><div className="top-brand"><div className="brand-mark small"><Building2 size={20}/></div><span>Gestione Appalti</span></div><div className="top-user"><div className="avatar">{userName.slice(0,1).toUpperCase()}</div><div><strong>{userName}</strong><small>{role}</small></div><button className="icon-btn" title="Esci" onClick={()=>supabase.auth.signOut()}><LogOut size={18}/></button></div></header>
 <div className="layout"><aside className={'sidebar '+(mobile?'open':'')}><nav><Nav icon={<Home/>} label="Dashboard" active={page==='dashboard'} onClick={()=>navigate('dashboard')}/><Nav icon={<Building2/>} label="Edifici" active={page==='edifici'} onClick={()=>navigate('edifici')}/><Nav icon={<FileText/>} label="Richieste di intervento" active={page==='richieste'} onClick={()=>navigate('richieste')}/>{!manutentore&&<><Nav icon={<ClipboardList/>} label="Interventi" active={page==='interventi'||page==='intervento'} onClick={()=>navigate('interventi')}/><Nav icon={<FolderOpen/>} label="Fascicoli" active={page==='fascicolo'} onClick={()=>navigate('fascicolo')}/><Nav icon={<BarChart3/>} label="Report" active={page==='report'} onClick={()=>navigate('report')}/><Nav icon={<Wrench/>} label="Manutenzioni" active={page==='manutenzioni'} onClick={()=>navigate('manutenzioni')}/><Nav icon={<Settings/>} label="Amministrazione" active={page==='amministrazione'} onClick={()=>navigate('amministrazione')}/></>}</nav><div className="sidebar-footer"><ShieldCheck size={16}/><span>{ente}</span></div></aside>
 <main className="main">{page==='dashboard'&&<DashboardPage access={access} onOpen={navigate} refresh={refresh}/>} {page==='edifici'&&<BuildingsPage access={access} refresh={refresh} setRefresh={setRefresh}/>} {page==='richieste'&&<RequestsPage access={access} refresh={refresh} setRefresh={setRefresh}/>} {!manutentore&&page==='interventi'&&<InterventionsPage access={access} onOpen={navigate} refresh={refresh} setRefresh={setRefresh}/>} {!manutentore&&page==='intervento'&&selectedId&&<InterventionFile id={selectedId} access={access} onBack={()=>navigate('interventi')} refresh={refresh} setRefresh={setRefresh}/>} {!manutentore&&page==='fascicolo'&&selectedId&&<BuildingFile id={selectedId} access={access} onBack={()=>navigate('fascicolo')} refresh={refresh} setRefresh={setRefresh}/>} {!manutentore&&page==='fascicolo'&&!selectedId&&<BuildingFascicoliPage access={access} onOpen={navigate} refresh={refresh}/>} {!manutentore&&page==='report'&&<ReportPage refresh={refresh}/>} {!manutentore&&page==='manutenzioni'&&<MaintenancePage access={access} refresh={refresh} setRefresh={setRefresh}/>} {!manutentore&&page==='amministrazione'&&<AdminPage access={access}/>} </main></div></div>
}

function Nav({icon,label,active,onClick}:{icon:any;label:string;active:boolean;onClick:()=>void}){return <button className={'nav-item '+(active?'active':'')} onClick={onClick}>{icon}<span>{label}</span>{active&&<ChevronRight size={15}/>}</button>}
function DashboardPage({access,onOpen,refresh}:{access:Access[];onOpen:(p:Page,id?:string)=>void;refresh:number}){
 const manutentore=isManutentore(access);
 const [data,setData]=useState<any[]>([]);const [late,setLate]=useState<any[]>([]);
 const [dashboards,setDashboards]=useState<any[]>([]);
 const enteId=access[0]?.ente_id;
 if(manutentore)return <PageHead title="Dashboard" subtitle="Quadro delle richieste di intervento."><RequestsDashboard access={access} refresh={refresh} onOpen={onOpen}/></PageHead>
 useEffect(()=>{Promise.all([
  supabase.from('dashboard_interventi').select('*'),
  supabase.from('dashboard_ritardi').select('*').order('giorni_ritardo',{ascending:false}).limit(8),
  enteId?supabase.from('dashboard_config').select('dashboard_key,titolo,ordine,visibile').eq('ente_id',enteId).eq('visibile',true).order('ordine'):Promise.resolve({data:[],error:null})
 ]).then(([a,b,c])=>{setData(a.data||[]);setLate(b.data||[]);setDashboards(c.data||[])})},[refresh,enteId]);
 const d=data[0];
 const enabled=new Set(dashboards.map(x=>x.dashboard_key));
 const ordered=enabled.size?dashboards:[{dashboard_key:'lavori',ordine:1},{dashboard_key:'richieste',ordine:2},{dashboard_key:'manutenzioni',ordine:3}];
 const lavori=<><div className="page-actions"><button className="btn primary" onClick={()=>onOpen('interventi')}><ClipboardList size={17}/> Vedi interventi</button></div>{!access.length&&<div className="notice warning"><CircleAlert size={18}/> Account autenticato senza ruolo applicativo. Associa l’utente a un ente in Amministrazione.</div>}<div className="stats-grid"><Stat icon={<ClipboardList/>} label="Interventi" value={d?.interventi_totali||0} meta={(d?.interventi_attivi||0)+' attivi'}/><Stat icon={<Building2/>} label="Edifici" value="—" meta="visibili secondo RLS"/><Stat icon={<WalletCards/>} label="Programmato" value={money(d?.importo_programmato)} meta="quadro complessivo"/><Stat icon={<WalletCards/>} label="Finanziato" value={money(d?.importo_finanziato)} meta="risorse disponibili"/></div><div className="content-grid"><section className="card"><div className="card-head"><div><h2>Stato interventi</h2><p>Indicatori dell’ente corrente</p></div><BarChart3 size={20}/></div><Progress label="Attivi" value={d?.interventi_attivi||0} total={d?.interventi_totali||0}/><Progress label="Conclusi" value={d?.interventi_conclusi||0} total={d?.interventi_totali||0}/><Progress label="Sospesi" value={d?.interventi_sospesi||0} total={d?.interventi_totali||0}/></section><section className="card"><div className="card-head"><div><h2>Scadenze in ritardo</h2><p>Fasi oltre la data prevista</p></div><CircleAlert size={20}/></div>{late.length?<div className="mini-list">{late.slice(0,5).map((x,i)=><div className="mini-row" key={i}><div><strong>{x.codice_intervento}</strong><span>{statusLabel(x.fase)}</span></div><b className="danger-text">+{x.giorni_ritardo} gg</b></div>)}</div>:<Empty title="Nessun ritardo" text="Non risultano fasi scadute."/>}</section></div></>;
 const manutenzioni=<MaintenanceDashboard refresh={refresh} onOpen={()=>onOpen('manutenzioni')}/>;
 return <PageHead title="Dashboard" subtitle="Quadro sintetico della gestione degli interventi, delle richieste e delle manutenzioni.">
  {ordered.map((x:any)=><div key={x.dashboard_key} className="dashboard-block"><div className="dashboard-section-title"><span>{x.titolo}</span></div>{x.dashboard_key==='lavori'&&lavori}{x.dashboard_key==='richieste'&&<RequestsDashboard access={access} refresh={refresh} onOpen={onOpen}/>} {x.dashboard_key==='manutenzioni'&&manutenzioni}</div>)}
 </PageHead>
}

function MaintenanceDashboard({refresh,onOpen}:{refresh:number;onOpen:()=>void}){
 const [systems,setSystems]=useState<any[]>([]);const [jobs,setJobs]=useState<any[]>([]);
 useEffect(()=>{Promise.all([
  supabase.from('impianti_manutentivi').select('id,stato,data_prossima_manutenzione,tipo'),
  supabase.from('manutenzioni').select('id,stato,data_programmata,data_esecuzione,costo_consuntivo')
 ]).then(([a,b])=>{setSystems(a.data||[]);setJobs(b.data||[])})},[refresh]);
 const today=new Date().toISOString().slice(0,10);const active=systems.filter(x=>x.stato==='attivo').length;const due=systems.filter(x=>x.data_prossima_manutenzione&&x.data_prossima_manutenzione<today).length;const open=jobs.filter(x=>!['chiusa','annullata'].includes(x.stato)).length;const closed=jobs.filter(x=>x.stato==='chiusa').length;
 return <section className="card maintenance-dashboard"><div className="card-head"><div><h2>Riepilogo manutenzioni</h2><p>Quadro sintetico degli impianti e delle attività manutentive.</p></div><Wrench size={20}/></div><div className="request-kpis"><div><span>Impianti attivi</span><strong>{active}</strong></div><div><span>Manutenzioni in scadenza</span><strong>{due}</strong></div><div><span>Attività aperte</span><strong>{open}</strong></div><div><span>Attività chiuse</span><strong>{closed}</strong></div></div><div className="chart-footer"><span>Ultimo aggiornamento automatico all'apertura della Home</span><button className="btn secondary" onClick={onOpen}><Wrench size={15}/> Apri manutenzioni</button></div></section>
}
type RequestSortKey='codice'|'protocollo'|'richiesta'|'sedi'|'ambiti'|'tipologia'|'priorita'|'data'|'stato'|'allegati'
type RequestRow={
 id:string; ente_id:string; numero_progressivo:number; codice_richiesta:string; titolo_sintetico:string;
 descrizione_estesa:string; numero_protocollo:string|null; data_protocollo:string|null;
 tipo_intervento:'ordinaria'|'straordinaria'|'da_valutare'; risolto:boolean; data_risoluzione:string|null;
 note_immobile:string|null; note_risoluzione:string|null; data_richiesta:string; stato_risoluzione:'aperta'|'risolta'|'da_valutare'; priorita:string|null; allegati_presenti:boolean; edificio_origine:string|null; codice_identificativo_locale:string|null; origine_sistema:string|null;
 richieste_intervento_sedi?:any[]; richieste_intervento_ambiti?:any[]; richiesta_intervento_documenti?:any[];
}

const requestTypeLabel=(s:string)=>({ordinaria:'Ordinaria',straordinaria:'Straordinaria',da_valutare:'Da valutare'} as any)[s]||s
const requestTypeClass=(s:string)=>({ordinaria:'blue',straordinaria:'amber',da_valutare:'gray'} as any)[s]||'gray'

function SortableTh({label,active,direction,onClick}:{label:string;active:boolean;direction:'asc'|'desc';onClick:()=>void}){return <th><button type="button" className={'sort-header '+(active?'active':'')} onClick={onClick} title={active?(direction==='asc'?'Ordine crescente — clicca per decrescente':'Ordine decrescente — clicca per crescente'):'Ordina'}>{label}<span className="sort-indicator">{active?(direction==='asc'?'↑':'↓'):'↕'}</span></button></th>}

function RequestsPage({access,refresh,setRefresh}:{access:Access[];refresh:number;setRefresh:(x:number)=>void}){
 const [rows,setRows]=useState<RequestRow[]>([]); const [buildings,setBuildings]=useState<any[]>([]);
 const [ambiti,setAmbiti]=useState<any[]>([]); const [q,setQ]=useState(''); const [filter,setFilter]=useState('tutte'); const [buildingFilter,setBuildingFilter]=useState('all'); const [ambitoFilter,setAmbitoFilter]=useState('all'); const [priorityFilter,setPriorityFilter]=useState('all');
 const [show,setShow]=useState(false); const [editing,setEditing]=useState<RequestRow|null>(null); const [detail,setDetail]=useState<RequestRow|null>(null);
 const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false); const [advanced,setAdvanced]=useState(false);
 const [sortKey,setSortKey]=useState<RequestSortKey>('data'); const [sortDir,setSortDir]=useState<'asc'|'desc'>('desc');
 const write=canWrite(access); const manutentore=isManutentore(access); const enteId=access[0]?.ente_id;

 const load=async()=>{
  setLoading(true);
  const [r,b,a,d]=await Promise.all([
   supabase.from('richieste_intervento').select('*,richieste_intervento_sedi(id,edificio_id,edifici(id,codice_edificio,denominazione,indirizzo,comune)),richieste_intervento_ambiti(id,ambito_id,ambiti_richiesta_intervento(id,codice,denominazione)),richiesta_intervento_documenti(id,nome,mime_type,size_bytes,url,tipo,data_documento,versione)').order('data_richiesta',{ascending:false}).order('numero_progressivo',{ascending:false}),
   supabase.from('edifici').select('id,codice_edificio,denominazione,indirizzo,comune').order('denominazione'),
   supabase.from('ambiti_richiesta_intervento').select('id,codice,denominazione').eq('attivo',true).order('denominazione'),
   Promise.resolve({data:null,error:null})
  ]);
  if(r.error){console.error(r.error);setMessage('Errore caricamento richieste: '+r.error.message)} else setRows((r.data||[]) as RequestRow[]);
  setBuildings(b.data||[]); setAmbiti(a.data||[]); setLoading(false);
 };
 useEffect(()=>{load()},[refresh,access[0]?.ente_id]);

 const filtered=rows.filter(x=>{
  const text=(x.codice_richiesta+' '+x.titolo_sintetico+' '+(x.numero_protocollo||'')+' '+(x.richieste_intervento_sedi||[])).toLowerCase();
  const matchesQ=text.includes(q.toLowerCase()) || JSON.stringify(x).toLowerCase().includes(q.toLowerCase());
  const matches=filter==='tutte'||(filter==='risolte'&&x.stato_risoluzione==='risolta')||(filter==='aperte'&&x.stato_risoluzione==='aperta')||(filter==='da_valutare'&&x.stato_risoluzione==='da_valutare')||(filter===x.tipo_intervento);
  const matchesBuilding=buildingFilter==='all'||(x.richieste_intervento_sedi||[]).some((s:any)=>s.edificio_id===buildingFilter);
  const matchesAmbito=ambitoFilter==='all'||(x.richieste_intervento_ambiti||[]).some((a:any)=>a.ambito_id===ambitoFilter);
  const matchesPriority=priorityFilter==='all'||x.priorita===priorityFilter; return matchesQ&&matches&&matchesBuilding&&matchesAmbito&&matchesPriority;
 });

 const sorted=[...filtered].sort((a,b)=>{
  const value=(row:RequestRow,key:RequestSortKey):string|number=>{
   if(key==='codice') return row.codice_richiesta||'';
   if(key==='protocollo') return row.numero_protocollo||'';
   if(key==='richiesta') return row.titolo_sintetico||'';
   if(key==='sedi') return (row.richieste_intervento_sedi||[]).map((s:any)=>s.edifici?.denominazione||s.edifici?.codice_edificio||row.edificio_origine||'').join(' ');
   if(key==='ambiti') return (row.richieste_intervento_ambiti||[]).map((x:any)=>x.ambiti_richiesta_intervento?.denominazione||'').join(' ');
   if(key==='tipologia') return requestTypeLabel(row.tipo_intervento);
   if(key==='priorita') return row.priorita||'';
   if(key==='data') return row.data_richiesta||'';
   if(key==='stato') return row.stato_risoluzione||'';
   return (row.richiesta_intervento_documenti||[]).length;
  };
  const av=value(a,sortKey), bv=value(b,sortKey);
  const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'it',{numeric:true,sensitivity:'base'});
  return sortDir==='asc'?cmp:-cmp;
 });
 const changeSort=(key:RequestSortKey)=>{if(sortKey===key)setSortDir(x=>x==='asc'?'desc':'asc');else{setSortKey(key);setSortDir('asc')}};
 const exportRows=(format:'csv'|'xls'|'ods')=>{
  const data=sorted.map(x=>({
   'Codice':x.codice_richiesta,'Protocollo':x.numero_protocollo||'','Data protocollo':x.data_protocollo||'',
   'Richiesta':x.titolo_sintetico,'Descrizione':x.descrizione_estesa,
   'Istituti / sedi':(x.richieste_intervento_sedi||[]).map((s:any)=>s.edifici?.denominazione||s.edifici?.codice_edificio||x.edificio_origine||'').join('; '),
   'Ambiti':(x.richieste_intervento_ambiti||[]).map((a:any)=>a.ambiti_richiesta_intervento?.denominazione||'').join('; '),
   'Tipologia':requestTypeLabel(x.tipo_intervento),'Priorità':x.priorita||'','Data richiesta':x.data_richiesta||'',
   'Stato':x.stato_risoluzione||'','Data risoluzione':x.data_risoluzione||'','Allegati':(x.richiesta_intervento_documenti||[]).length,
   'Note risoluzione':x.note_risoluzione||''
  }));
  const stamp=new Date().toISOString().slice(0,10);
  const ws=XLSX.utils.json_to_sheet(data); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Richieste');
  if(format==='csv') XLSX.writeFile(wb,'richieste_intervento_'+stamp+'.csv',{bookType:'csv'});
  else if(format==='xls') XLSX.writeFile(wb,'richieste_intervento_'+stamp+'.xls',{bookType:'biff8'});
  else XLSX.writeFile(wb,'richieste_intervento_'+stamp+'.ods',{bookType:'ods'});
 };
 const save=async(e:any)=>{
  e.preventDefault(); if(!enteId)return;
  const f=new FormData(e.currentTarget); const selectedBuildings=JSON.parse(String(f.get('edifici_ids')||'[]')); const selectedAmbiti=JSON.parse(String(f.get('ambiti_ids')||'[]')); const attachmentFiles=Array.from(f.getAll('attachments')).filter((x):x is File=>x instanceof File&&x.size>0);
  const risolto=f.get('risolto')==='on';
  const payload={
   ente_id:enteId,titolo_sintetico:String(f.get('titolo')||'').trim(),descrizione_estesa:String(f.get('descrizione')||'').trim(),
   numero_protocollo:String(f.get('protocollo')||'').trim()||null,data_protocollo:String(f.get('data_protocollo')||'')||null,
   tipo_intervento:String(f.get('tipo')||'da_valutare'),stato_risoluzione:String(f.get('stato_risoluzione')||'aperta'),risolto:String(f.get('stato_risoluzione')||'aperta')==='risolta',priorita:String(f.get('priorita')||'programmabile'),data_risoluzione:String(f.get('stato_risoluzione')||'aperta')==='risolta'?(String(f.get('data_risoluzione')||'')||new Date().toISOString().slice(0,10)):null,
   note_immobile:String(f.get('note_immobile')||'').trim()||null,data_richiesta:String(f.get('data_richiesta')||'')||new Date().toISOString().slice(0,10),
   note_risoluzione:String(f.get('note_risoluzione')||'').trim()||null,allegati_presenti:editing?.allegati_presenti||false,edificio_origine:editing?.edificio_origine||null,codice_identificativo_locale:editing?.codice_identificativo_locale||null,origine_sistema:editing?.origine_sistema||'Applicazione'
  };
  setLoading(true);
  const result=editing?await supabase.from('richieste_intervento').update(payload).eq('id',editing.id):await supabase.from('richieste_intervento').insert(payload).select('id').single();
  if(result.error){setLoading(false);setMessage('Salvataggio non riuscito: '+result.error.message);return}
  const rid=editing?.id||result.data?.id;
  let attachmentMessage='';
  if(rid){
   await supabase.from('richieste_intervento_sedi').delete().eq('richiesta_id',rid);
   if(selectedBuildings.length) await supabase.from('richieste_intervento_sedi').insert(selectedBuildings.map((id:string)=>({ente_id:enteId,richiesta_id:rid,edificio_id:id})));
   await supabase.from('richieste_intervento_ambiti').delete().eq('richiesta_id',rid);
   if(selectedAmbiti.length) await supabase.from('richieste_intervento_ambiti').insert(selectedAmbiti.map((id:string)=>({ente_id:enteId,richiesta_id:rid,ambito_id:id})));
   if(attachmentFiles.length){
    const {data:user}=await supabase.auth.getUser();
    let uploaded=0;
    for(const file of attachmentFiles){
     const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
     const path='richieste/'+rid+'/'+crypto.randomUUID()+'-'+safe;
     const up=await supabase.storage.from('documenti').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
     if(up.error){attachmentMessage+=(attachmentMessage?' ':'')+'Allegato "'+file.name+'" non caricato: '+up.error.message;continue}
     const ins=await supabase.from('richiesta_intervento_documenti').insert({ente_id:enteId,richiesta_id:rid,nome:file.name,tipo:docType(file.type||''),data_documento:new Date().toISOString().slice(0,10),versione:1,url:path,mime_type:file.type||null,size_bytes:file.size,created_by:user.user?.id||null});
     if(ins.error){await supabase.storage.from('documenti').remove([path]);attachmentMessage+=(attachmentMessage?' ':'')+'Allegato "'+file.name+'" non registrato: '+ins.error.message;continue}
     uploaded++;
    }
    if(uploaded) await supabase.from('richieste_intervento').update({allegati_presenti:true}).eq('id',rid);
   }
  }
  setShow(false);setEditing(null);setMessage(attachmentMessage||(editing?'Richiesta modificata correttamente.':'Richiesta inserita correttamente.')+(attachmentFiles.length?' Allegati caricati.':''));setRefresh(refresh+1);setLoading(false);
 };
 const remove=async(row:RequestRow)=>{if(!confirm('Eliminare definitivamente la richiesta '+row.codice_richiesta+'?'))return;const {error}=await supabase.from('richieste_intervento').delete().eq('id',row.id);if(error)setMessage('Eliminazione non riuscita: '+error.message);else{setMessage('Richiesta eliminata.');setRefresh(refresh+1)}};
 const markResolved=async(row:RequestRow)=>{const {error}=await supabase.from('richieste_intervento').update({risolto:true,data_risoluzione:new Date().toISOString().slice(0,10)}).eq('id',row.id);if(error)setMessage(error.message);else{setMessage('Richiesta segnata come risolta.');setRefresh(refresh+1)}};
 return <PageHead title="Richieste di intervento" subtitle="Segnalazioni provenienti dagli istituti scolastici e loro gestione.">
  <div className="page-actions">
   <div className="search"><Search size={17}/><input placeholder="Cerca codice, protocollo, titolo, edificio…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <button className="btn secondary" onClick={()=>setAdvanced(!advanced)}><SlidersHorizontal size={16}/> Filtri</button>
   {write&&!manutentore&&<button className="btn primary" onClick={()=>{setEditing(null);setShow(true)}}><Plus size={17}/> Nuova richiesta</button>}
  </div>
  {advanced&&<div className="request-filters card"><label>Stato<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="tutte">Tutte</option><option value="da_valutare">Da valutare</option><option value="ordinaria">Ordinarie</option><option value="straordinaria">Straordinarie</option><option value="aperte">Aperte</option><option value="risolte">Risolte</option></select></label><label>Edificio / sede<select value={buildingFilter} onChange={e=>setBuildingFilter(e.target.value)}><option value="all">Tutti gli edifici</option>{buildings.map((b:any)=><option key={b.id} value={b.id}>{b.codice_edificio} — {b.denominazione}</option>)}</select></label><label>Ambito di intervento<select value={ambitoFilter} onChange={e=>setAmbitoFilter(e.target.value)}><option value="all">Tutti gli ambiti</option>{ambiti.map((a:any)=><option key={a.id} value={a.id}>{a.denominazione}</option>)}</select></label><label>Priorità<select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="all">Tutte le priorità</option><option value="programmabile">Programmabile</option><option value="non_urgente">Non urgente</option><option value="media">Medio</option><option value="urgente">Urgente</option></select></label><button type="button" className="btn secondary filter-reset" onClick={()=>{setFilter('tutte');setBuildingFilter('all');setAmbitoFilter('all');setPriorityFilter('all');setQ('')}}><RotateCcw size={15}/> Azzera filtri</button></div>}
  <div className="request-tabs"><button className={filter==='tutte'?'active':''} onClick={()=>setFilter('tutte')}>Tutte <b>{rows.length}</b></button><button className={filter==='da_valutare'?'active':''} onClick={()=>setFilter('da_valutare')}>Da valutare <b>{rows.filter(x=>x.stato_risoluzione==='da_valutare').length}</b></button><button className={filter==='aperte'?'active':''} onClick={()=>setFilter('aperte')}>Aperte <b>{rows.filter(x=>x.stato_risoluzione==='aperta').length}</b></button><button className={filter==='risolte'?'active':''} onClick={()=>setFilter('risolte')}>Risolte <b>{rows.filter(x=>x.stato_risoluzione==='risolta').length}</b></button></div>
  {message&&<div className="notice success">{message}</div>}
  <section className="card table-card">
   <div className="table-toolbar"><span className="table-result-count">{sorted.length} richieste visualizzate</span><div className="export-actions"><span className="export-label"><Download size={15}/> Esporta</span><button className="btn secondary" onClick={()=>exportRows('csv')} disabled={!sorted.length}>CSV</button><button className="btn secondary" onClick={()=>exportRows('xls')} disabled={!sorted.length}>XLS</button><button className="btn secondary" onClick={()=>exportRows('ods')} disabled={!sorted.length}>ODS</button></div></div>
   {loading?<Loader/>:sorted.length?<table><thead><tr>
    {(['codice','protocollo','richiesta','sedi','ambiti','tipologia','priorita','data','stato','allegati'] as RequestSortKey[]).map((key)=><SortableTh key={key} label={{codice:'Codice',protocollo:'Protocollo',richiesta:'Richiesta',sedi:'Istituti / sedi',ambiti:'Ambiti',tipologia:'Tipologia',priorita:'Priorità',data:'Data',stato:'Stato',allegati:'Allegati'}[key]} active={sortKey===key} direction={sortDir} onClick={()=>changeSort(key)}/>)}<th>Azioni</th></tr></thead><tbody>
   {sorted.map(x=>{const sedi=x.richieste_intervento_sedi||[];const amb=x.richieste_intervento_ambiti||[];const docs=x.richiesta_intervento_documenti||[];return <tr key={x.id} className="clickable" onClick={()=>setDetail(x)}>
    <td><b>{x.codice_richiesta}</b></td><td>{x.numero_protocollo?<><strong>{x.numero_protocollo}</strong><span className="table-sub">{date(x.data_protocollo)}</span></>:'—'}</td>
    <td><strong>{x.titolo_sintetico}</strong><span className="table-sub">{x.descrizione_estesa.slice(0,85)}{x.descrizione_estesa.length>85?'…':''}</span></td>
    <td>{sedi.length?<><strong>{sedi[0]?.edifici?.codice_edificio}</strong><span className="table-sub">{sedi[0]?.edifici?.denominazione}{sedi.length>1?' + '+(sedi.length-1)+' sedi':''}</span></>:<span className="table-sub">{x.edificio_origine||'—'}</span>}</td>
    <td><div className="request-badges">{amb.slice(0,3).map((a:any)=><span className="badge blue" key={a.id}>{a.ambiti_richiesta_intervento?.denominazione||'—'}</span>)}{amb.length>3&&<span className="badge gray">+{amb.length-3}</span>}</div></td>
    <td><span className={'badge '+requestTypeClass(x.tipo_intervento)}>{requestTypeLabel(x.tipo_intervento)}</span></td><td><span className={'badge '+(x.priorita==='urgente'?'red':x.priorita==='media'?'amber':'gray')}>{x.priorita||'—'}</span></td><td>{date(x.data_richiesta)}</td>
    <td><span className={'badge '+(x.risolto?'green':'amber')}>{x.risolto?'Risolta':'Aperta'}</span>{x.risolto&&<span className="table-sub">{date(x.data_risoluzione)}</span>}</td>
    <td><span className="attachment-count"><Paperclip size={14}/>{docs.length}</span></td>
    <td onClick={e=>e.stopPropagation()}><div className="row-actions"><button className="icon-btn dark-icon" title="Apri" onClick={()=>setDetail(x)}><Eye size={16}/></button>{write&&<button className="icon-btn dark-icon" title="Modifica" onClick={()=>{setEditing(x);setShow(true)}}><Pencil size={16}/></button>}{write&&!manutentore&&!x.risolto&&<button className="icon-btn dark-icon" title="Segna risolta" onClick={()=>markResolved(x)}><CheckCircle2 size={16}/></button>}{write&&!manutentore&&<button className="icon-btn dark-icon" title="Elimina" onClick={()=>remove(x)}><Trash2 size={16}/></button>}</div></td>
   </tr>})}</tbody></table>:<Empty title="Nessuna richiesta" text="Non risultano richieste con i filtri selezionati."/>}
  </section>
  {show&&<Modal title={editing?'Modifica richiesta':'Nuova richiesta'} close={()=>{setShow(false);setEditing(null)}}><RequestForm row={editing} buildings={buildings} ambiti={ambiti} manutentore={manutentore} onCancel={()=>{setShow(false);setEditing(null)}} onSubmit={save}/></Modal>}
  {detail&&<RequestDetail row={detail} access={access} onClose={()=>setDetail(null)} onChanged={()=>{setDetail(null);setRefresh(refresh+1)}} onEdit={()=>{setEditing(detail);setDetail(null);setShow(true)}}/>}
 </PageHead>
}

function RequestForm({row,buildings,ambiti,manutentore=false,onCancel,onSubmit}:{row:RequestRow|null;buildings:any[];ambiti:any[];manutentore?:boolean;onCancel:()=>void;onSubmit:(e:any)=>void}){
 const selectedB=(row?.richieste_intervento_sedi||[]).map((x:any)=>x.edificio_id);const selectedA=(row?.richieste_intervento_ambiti||[]).map((x:any)=>x.ambito_id);
 const [bs,setBs]=useState<string[]>(selectedB);const [as,setAs]=useState<string[]>(selectedA);const [resolved,setResolved]=useState(!!row?.risolto);const [buildingSearch,setBuildingSearch]=useState('');const [ambitoSearch,setAmbitoSearch]=useState('');
 const toggle=(arr:string[],set:(x:string[])=>void,id:string)=>set(arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]);
 const filteredBuildings=buildings.filter(b=>(String(b.codice_edificio)+' '+String(b.denominazione)+' '+String(b.indirizzo||'')+' '+String(b.comune||'')).toLowerCase().includes(buildingSearch.toLowerCase()));
 const filteredAmbiti=ambiti.filter(a=>(String(a.codice)+' '+String(a.denominazione)).toLowerCase().includes(ambitoSearch.toLowerCase()));
 return <form className="form-grid request-form" onSubmit={e=>{e.preventDefault();onSubmit(e)}}><input type="hidden" name="edifici_ids" value={JSON.stringify(bs)}/><input type="hidden" name="ambiti_ids" value={JSON.stringify(as)}/><div className="form-section-title span-2 request-form-heading">Identificazione e protocollo <span>Allegati PDF / immagini</span></div>
  <div className="span-2 request-attachments"><label className="request-attachments-picker"><Paperclip size={17}/><span><strong>Allega documenti</strong><small>PDF, JPG, PNG, WEBP · massimo 20 MB per file</small></span><input name="attachments" type="file" accept="application/pdf,image/*" multiple/></label><small className="request-attachments-note">Puoi selezionare più file contemporaneamente. Gli allegati vengono associati automaticamente alla richiesta.</small></div>
  <label>Data richiesta *<input name="data_richiesta" type="date" defaultValue={row?.data_richiesta||new Date().toISOString().slice(0,10)} required/></label><label>Numero protocollo<input name="protocollo" defaultValue={row?.numero_protocollo||''}/></label><label>Data protocollo<input name="data_protocollo" type="date" defaultValue={row?.data_protocollo||''}/></label><label>Tipologia di manutenzione<select name="tipo" defaultValue={row?.tipo_intervento||'da_valutare'}><option value="da_valutare">Da valutare</option><option value="ordinaria">Ordinaria</option><option value="straordinaria">Straordinaria</option></select></label>
  <label className="span-2">Descrizione del problema *<input name="titolo" defaultValue={row?.titolo_sintetico||''} required/></label>
  <label className="span-2">Descrizione Problema Estesa *<textarea name="descrizione" defaultValue={row?.descrizione_estesa||''} required/></label>
  <div className="span-2 request-multiselect"><div className="form-section-title">Edifici / sedi interessate <span>{bs.length} selezionate</span></div><div className="request-inline-search"><Search size={15}/><input placeholder="Cerca per codice, denominazione, indirizzo o comune…" value={buildingSearch} onChange={e=>setBuildingSearch(e.target.value)}/>{buildingSearch&&<button type="button" onClick={()=>setBuildingSearch('')}><X size={14}/></button>}</div><div className="multiselect-grid">{filteredBuildings.map(b=><label key={b.id} className="select-card"><input type="checkbox" checked={bs.includes(b.id)} onChange={()=>toggle(bs,setBs,b.id)}/><span><b>{b.codice_edificio}</b>{b.denominazione}<small>{[b.indirizzo,b.comune].filter(Boolean).join(', ')}</small></span></label>)}</div></div>
  <div className="span-2 request-multiselect"><div className="form-section-title">Ambiti <span>{as.length} selezionati</span></div><div className="request-inline-search"><Search size={15}/><input placeholder="Cerca ambito…" value={ambitoSearch} onChange={e=>setAmbitoSearch(e.target.value)}/>{ambitoSearch&&<button type="button" onClick={()=>setAmbitoSearch('')}><X size={14}/></button>}</div><div className="ambiti-grid">{filteredAmbiti.map(a=><label key={a.id} className="check-chip"><input type="checkbox" checked={as.includes(a.id)} onChange={()=>toggle(as,setAs,a.id)}/><span>{a.denominazione}</span></label>)}</div></div>
  <label className="span-2">Note specifiche dell'immobile<textarea name="note_immobile" defaultValue={row?.note_immobile||''}/></label>
  <label>Priorità<select name="priorita" defaultValue={row?.priorita||'programmabile'}><option value="programmabile">Programmabile</option><option value="non_urgente">Non urgente</option><option value="media">Medio</option><option value="urgente">Urgente</option></select></label><div className="span-2 request-resolution-box"><label>Stato richiesta<select name="stato_risoluzione" value={resolved?'risolta':(row?.stato_risoluzione||'aperta')} onChange={e=>setResolved(e.target.value==='risolta')}><option value="aperta">Aperta</option><option value="da_valutare">Da valutare</option><option value="risolta">Risolta</option></select></label>{resolved&&<><label>Data risoluzione<input name="data_risoluzione" type="date" defaultValue={row?.data_risoluzione||new Date().toISOString().slice(0,10)}/></label><label>Note di risoluzione<textarea name="note_risoluzione" defaultValue={row?.note_risoluzione||''}/></label></>}</div>
  <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onCancel}>Annulla</button><button className="btn primary">Salva richiesta</button></div>
 </form>
}


function RequestDetail({row,access,onClose,onChanged,onEdit}:{row:RequestRow;access:Access[];onClose:()=>void;onChanged:()=>void;onEdit:()=>void}){
 const [tab,setTab]=useState('richiesta');const [uploading,setUploading]=useState(false);const [docError,setDocError]=useState('');const [preview,setPreview]=useState<{doc:any;url:string}|null>(null);
 const sedi=row.richieste_intervento_sedi||[];const amb=row.richieste_intervento_ambiti||[];const docs=row.richiesta_intervento_documenti||[];
 const upload=async(e:any)=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setUploading(true);setDocError('');
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path='richieste/'+row.id+'/'+crypto.randomUUID()+'-'+safe;
  const up=await supabase.storage.from('documenti').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
  if(up.error){setDocError('Caricamento non riuscito: '+up.error.message);setUploading(false);return}
  const ins=await supabase.from('richiesta_intervento_documenti').insert({ente_id:access[0]?.ente_id,richiesta_id:row.id,nome:file.name,tipo:docType(file.type||''),data_documento:new Date().toISOString().slice(0,10),versione:1,url:path,mime_type:file.type||null,size_bytes:file.size,created_by:access[0]?.user_id||null});
  if(ins.error){await supabase.storage.from('documenti').remove([path]);setDocError('Registrazione documento non riuscita: '+ins.error.message);setUploading(false);return}
  setUploading(false);onChanged();
 };
 const openDoc=async(d:any)=>{if(!d.url){setDocError('Il documento non contiene un percorso valido.');return}const x=await supabase.storage.from('documenti').createSignedUrl(d.url,3600);if(x.error){setDocError('Impossibile aprire il documento: '+x.error.message);return}setPreview({doc:d,url:x.data.signedUrl})};
 const deleteDoc=async(d:any)=>{if(!confirm('Eliminare il documento '+d.nome+'?'))return;const st=await supabase.storage.from('documenti').remove([d.url]);if(st.error){setDocError(st.error.message);return}const db=await supabase.from('richiesta_intervento_documenti').delete().eq('id',d.id);if(db.error){setDocError(db.error.message);return}onChanged()};
 return <div className="modal-backdrop"><div className="modal request-detail-modal"><div className="modal-head"><div><span className="eyebrow">{row.codice_richiesta}</span><h2>{row.titolo_sintetico}</h2></div><button className="icon-btn dark-icon" onClick={onClose}><X/></button></div>
  <div className="request-detail-hero"><span className={'badge '+(row.risolto?'green':'amber')}>{row.risolto?'Risolta':'Aperta'}</span><span className={'badge '+requestTypeClass(row.tipo_intervento)}>{requestTypeLabel(row.tipo_intervento)}</span><span className="request-protocol">Prot. {row.numero_protocollo||'—'} {row.data_protocollo?'del '+date(row.data_protocollo):''}</span></div>
  <div className="tabs request-detail-tabs">{['richiesta','sedi','ambiti','documenti','risoluzione'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>
  {docError&&<div className="notice error">{docError}</div>}
  {tab==='richiesta'&&<div className="request-detail-content"><div className="info-row"><span>Data richiesta</span><strong>{date(row.data_richiesta)}</strong></div><h3>Descrizione</h3><p>{row.descrizione_estesa}</p>{row.note_immobile&&<><h3>Note immobile</h3><p>{row.note_immobile}</p></>}</div>}
  {tab==='sedi'&&<div className="detail-list">{sedi.length?sedi.map((s:any)=><div className="detail-list-item" key={s.id}><b>{s.edifici?.codice_edificio}</b><strong>{s.edifici?.denominazione}</strong><span>{[s.edifici?.indirizzo,s.edifici?.comune].filter(Boolean).join(', ')}</span></div>):<Empty title="Nessuna sede associata" text="La richiesta può essere associata a una o più sedi."/>}</div>}
  {tab==='ambiti'&&<div className="request-detail-ambiti">{amb.length?amb.map((a:any)=><span className="badge blue" key={a.id}>{a.ambiti_richiesta_intervento?.denominazione}</span>):<Empty title="Nessun ambito" text="Non sono stati classificati ambiti."/>}</div>}
  {tab==='documenti'&&<div><div className="upload-doc-row"><label className="btn primary"><Upload size={15}/> {uploading?'Caricamento…':'Carica documento'}<input type="file" hidden onChange={upload} disabled={uploading}/></label><span className="muted">PDF, immagini e documentazione di supporto</span></div>{docs.length?<div className="detail-list">{docs.map((d:any)=><div className="detail-list-item doc-row" key={d.id}><div><b>{d.nome}</b><span>{d.mime_type||'file'} · {d.size_bytes?Math.round(d.size_bytes/1024)+' KB':''} · {date(d.data_documento)}</span></div><div className="row-actions"><button className="icon-btn dark-icon" title="Apri" onClick={()=>openDoc(d)}><Eye size={16}/></button><button className="icon-btn dark-icon" title="Elimina" onClick={()=>deleteDoc(d)}><Trash2 size={16}/></button></div></div>)}</div>:<Empty title="Nessun documento" text="Carica la richiesta dell'istituto e la documentazione di supporto."/>}</div>}
  {preview&&<div className="modal-backdrop" style={{zIndex:1000}}><div className="modal" style={{width:'min(1100px,94vw)',height:'min(88vh,900px)',display:'flex',flexDirection:'column'}}><div className="modal-head"><div><h2>{preview.doc.nome}</h2><span className="muted">{preview.doc.mime_type||'Documento'}</span></div><button className="icon-btn dark-icon" onClick={()=>setPreview(null)}><X/></button></div><div style={{flex:1,minHeight:0,background:'#f5f7fa',padding:12}}>{String(preview.doc.mime_type||'').startsWith('image/')?<img src={preview.url} alt={preview.doc.nome} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<iframe src={preview.url} title={preview.doc.nome} style={{width:'100%',height:'100%',border:0,background:'#fff'}}/>}</div><div className="form-actions"><a className="btn secondary" href={preview.url} target="_blank" rel="noreferrer">Apri in nuova scheda</a><button className="btn primary" onClick={()=>setPreview(null)}>Chiudi</button></div></div></div>}\n  {tab==='risoluzione'&&<div className="request-resolution-detail">{row.risolto?<><div className="resolution-ok"><CheckCircle2 size={22}/><div><strong>Richiesta risolta</strong><span>{date(row.data_risoluzione)}</span></div></div><h3>Note di risoluzione</h3><p>{row.note_risoluzione||'Nessuna nota.'}</p></>:<div className="notice warning"><CircleAlert size={17}/> La richiesta non risulta ancora risolta.</div>}</div>}
  <div className="form-actions"><button className="btn secondary" onClick={onClose}>Chiudi</button><button className="btn primary" onClick={onEdit}><Pencil size={15}/> Modifica</button></div>
 </div></div>
}

function RequestsDashboard({access,refresh,onOpen}:{access:Access[];refresh:number;onOpen:(p:Page,id?:string)=>void}){
 const [rows,setRows]=useState<RequestRow[]>([]);const [buildings,setBuildings]=useState<any[]>([]);const [ambiti,setAmbiti]=useState<any[]>([]);
 const [period,setPeriod]=useState<'giorno'|'settimana'|'mese'|'anno'>('mese');const [building,setBuilding]=useState('all');const [view,setView]=useState<'andamento'|'ambiti'|'edifici'>('andamento');const [hover,setHover]=useState<number|null>(null);
 useEffect(()=>{Promise.all([
  supabase.from('richieste_intervento').select('id,data_richiesta,risolto,richieste_intervento_sedi(edificio_id),richieste_intervento_ambiti(ambito_id,ambiti_richiesta_intervento(id,codice,denominazione))'),
  supabase.from('edifici').select('id,codice_edificio,denominazione').order('denominazione'),
  supabase.from('ambiti_richiesta_intervento').select('id,codice,denominazione').eq('attivo',true).order('denominazione')
 ]).then(([a,b,d])=>{setRows((a.data||[]) as RequestRow[]);setBuildings(b.data||[]);setAmbiti(d.data||[])})},[refresh]);
 const scoped=rows.filter(r=>building==='all'||(r.richieste_intervento_sedi||[]).some((s:any)=>s.edificio_id===building));
 const total=scoped.length,resolved=scoped.filter(r=>r.risolto).length,open=total-resolved;
 const now=new Date(); const points=useMemo(()=>{
  const out:{label:string,count:number,date:Date}[]=[];const push=(label:string,d:Date)=>out.push({label,count:scoped.filter(r=>{const x=new Date(r.data_richiesta+'T00:00:00');return period==='giorno'?x.toDateString()===d.toDateString():period==='settimana'?weekKey(x)===weekKey(d):period==='mese'?(x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()):(x.getFullYear()===d.getFullYear())}).length,date:d});
  const n=period==='giorno'?30:period==='settimana'?12:period==='mese'?12:6;for(let i=n-1;i>=0;i--){const d=new Date(now);if(period==='giorno')d.setDate(now.getDate()-i);if(period==='settimana')d.setDate(now.getDate()-i*7);if(period==='mese')d.setMonth(now.getMonth()-i,1);if(period==='anno')d.setFullYear(now.getFullYear()-i,0,1);push(period==='giorno'?fmtDay(d):period==='settimana'?fmtWeek(d):period==='mese'?fmtMonth(d):String(d.getFullYear()),d)}return out;
 },[rows,building,period]);
 const ranking=useMemo(()=>{
  if(view==='ambiti'){const m=new Map<string,{label:string,count:number}>();scoped.forEach(r=>(r.richieste_intervento_ambiti||[]).forEach((a:any)=>{const k=a.ambito_id;const label=a.ambiti_richiesta_intervento?.denominazione||'Altro';const v=m.get(k)||{label,count:0};v.count++;m.set(k,v)}));return [...m.values()].sort((a,b)=>b.count-a.count).slice(0,12)}
  const m=new Map<string,{label:string,count:number}>();scoped.forEach(r=>(r.richieste_intervento_sedi||[]).forEach((s:any)=>{const b=buildings.find(x=>x.id===s.edificio_id);const k=s.edificio_id;const v=m.get(k)||{label:b?b.codice_edificio+' — '+b.denominazione:'Edificio',count:0};v.count++;m.set(k,v)}));return [...m.values()].sort((a,b)=>b.count-a.count).slice(0,12)
 },[rows,building,view,buildings]);
 const maxRank=Math.max(1,...ranking.map(x=>x.count));const W=760,H=320,pad=42;const barH=Math.min(25,(H-pad*1.3)/Math.max(1,ranking.length));const chartLabel=view==='ambiti'?'Richieste per ambito':'Richieste per edificio';
 return <section className="card requests-dashboard">
  <div className="card-head"><div><h2>Dashboard richieste di intervento</h2><p>Concentrazione delle segnalazioni per periodo, ambito ed edificio.</p></div><BarChart3 size={20}/></div>
  <div className="request-kpis"><div><span>Interventi segnalati complessivi</span><strong>{total}</strong></div><div><span>Interventi risolti complessivi</span><strong>{resolved}</strong></div><div><span>Interventi ancora aperti</span><strong>{open}</strong></div></div>
  <div className="chart-toolbar"><div className="chart-periods">{(['giorno','settimana','mese','anno'] as const).map(p=><button key={p} className={period===p?'active':''} onClick={()=>{setPeriod(p);setView('andamento')}}>{p[0].toUpperCase()+p.slice(1)}</button>)}</div><label className="chart-building"><Building2 size={15}/><select value={building} onChange={e=>setBuilding(e.target.value)}><option value="all">Tutti gli edifici</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.codice_edificio} — {b.denominazione}</option>)}</select></label></div>
  <div className="request-view-tabs"><button className={view==='andamento'?'active':''} onClick={()=>setView('andamento')}>Andamento temporale</button><button className={view==='ambiti'?'active':''} onClick={()=>setView('ambiti')}>Per ambito</button><button className={view==='edifici'?'active':''} onClick={()=>setView('edifici')}>Per edificio</button></div>
  {view==='andamento'&&<><div className="request-chart-wrap"><svg viewBox={`0 0 ${W} 260`} className="request-chart" role="img" aria-label="Andamento richieste"><line x1={pad} y1={220} x2={W-pad} y2={220} className="chart-axis"/><polyline points={points.map((p,i)=>{const x=pad+i*(W-pad*2)/Math.max(1,points.length-1);const y=220-(p.count/Math.max(1,...points.map(q=>q.count)))*170;return x+','+y}).join(' ')} className="chart-line"/>{points.map((p,i)=>{const x=pad+i*(W-pad*2)/Math.max(1,points.length-1);const y=220-(p.count/Math.max(1,...points.map(q=>q.count)))*170;return <g key={i} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} className="chart-point"><circle cx={x} cy={y} r="5"/>{hover===i&&<g><rect x={Math.min(W-145,Math.max(5,x-55))} y={Math.max(5,y-52)} width="140" height="43" rx="7" className="chart-tooltip"/><text x={Math.min(W-138,Math.max(12,x-48))} y={Math.max(20,y-32)}>{p.label}</text><text x={Math.min(W-138,Math.max(12,x-48))} y={Math.max(36,y-16)}>{p.count} richieste</text></g>}</g>})}</svg></div><div className="chart-footer"><span>{period==='giorno'?'Ultimi 30 giorni':period==='settimana'?'Ultime 12 settimane':period==='mese'?'Ultimi 12 mesi':'Ultimi 6 anni'}</span><button className="btn secondary" onClick={()=>onOpen('richieste')}><Eye size={15}/> Apri richieste</button></div></>}
  {view!=='andamento'&&<><div className="ranking-chart"><div className="ranking-title">{chartLabel}{building!=='all'?' · edificio selezionato':''}</div>{ranking.length?ranking.map((x,i)=><div className="rank-row" key={i} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}><div className="rank-label" title={x.label}>{x.label}</div><div className="rank-track"><div className="rank-bar" style={{width:(x.count/maxRank*100)+'%'}}></div></div><strong>{x.count}</strong></div>):<Empty title="Nessun dato" text="Non sono presenti richieste per il filtro selezionato."/>}</div><div className="chart-footer"><span>Mostrate le prime {Math.min(12,ranking.length)} categorie in ordine decrescente.</span><button className="btn secondary" onClick={()=>onOpen('richieste')}><Eye size={15}/> Apri richieste</button></div></>}
 </section>
}
function weekKey(d:Date){const x=new Date(d);x.setHours(0,0,0,0);const day=x.getDay()||7;x.setDate(x.getDate()-day+1);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function fmtDay(d:Date){return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')}
function fmtWeek(d:Date){return 'Sett. '+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')}
function fmtMonth(d:Date){return d.toLocaleDateString('it-IT',{month:'short',year:'2-digit'})}


function BuildingsPage({access,refresh,setRefresh}:{access:Access[];refresh:number;setRefresh:(x:number)=>void}){const [rows,setRows]=useState<Building[]>([]);const [q,setQ]=useState('');const [show,setShow]=useState(false);const [editing,setEditing]=useState<Building|null>(null);const [perms,setPerms]=useState<Record<string,{can_update:boolean;can_delete:boolean}>>({});const [message,setMessage]=useState('');const superadmin=access.some(x=>x.ruolo==='superadmin');const write=canWrite(access);const load=async()=>{const {data,error}=await supabase.from('edifici').select('id,codice_edificio,denominazione,indirizzo,comune,provincia,cap,superficie,volume,anno_costruzione,tipologia_scolastica,centro_di_costo').order('denominazione');if(error){console.error('Errore caricamento edifici:',error);alert('Errore caricamento edifici: '+error.message);return}setRows((data||[]) as Building[]);if(!superadmin&&access[0]?.user_id){const p=await supabase.from('edifici_permessi').select('edificio_id,can_update,can_delete').eq('user_id',access[0].user_id);if(p.error)console.error('Errore caricamento permessi edifici:',p.error);else setPerms(Object.fromEntries((p.data||[]).map((x:any)=>[x.edificio_id,{can_update:x.can_update,can_delete:x.can_delete}])))}};useEffect(()=>{load()},[refresh,access[0]?.user_id,superadmin]);const filtered=rows.filter(x=>(x.denominazione+' '+x.codice_edificio+' '+(x.comune||'')+' '+(x.centro_di_costo||'')).toLowerCase().includes(q.toLowerCase()));const canEdit=(id:string)=>superadmin||!!perms[id]?.can_update;const canDelete=(id:string)=>superadmin||!!perms[id]?.can_delete;async function save(e:any){e.preventDefault();const f=new FormData(e.currentTarget);const payload={codice_edificio:String(f.get('codice')||'').trim(),denominazione:String(f.get('denominazione')||'').trim(),indirizzo:String(f.get('indirizzo')||'').trim()||null,comune:String(f.get('comune')||'').trim()||null,provincia:String(f.get('provincia')||'').trim()||null,cap:String(f.get('cap')||'').trim()||null,tipologia_scolastica:String(f.get('tipologia')||'').trim()||null,centro_di_costo:String(f.get('centro_di_costo')||'').trim()||null,superficie:Number(f.get('superficie')||0)||null,anno_costruzione:Number(f.get('anno')||0)||null};const result=editing?await supabase.from('edifici').update(payload).eq('id',editing.id):await supabase.from('edifici').insert({...payload,ente_id:access[0]?.ente_id});if(result.error){console.error('Errore salvataggio edificio:',result.error);setMessage('Salvataggio non riuscito: '+result.error.message);return}setMessage(editing?'Edificio modificato correttamente.':'Edificio inserito correttamente.');setShow(false);setEditing(null);setRefresh(refresh+1)}async function remove(row:Building){if(!confirm('Eliminare definitivamente l\'edificio "'+row.denominazione+'"?'))return;const {error}=await supabase.from('edifici').delete().eq('id',row.id);if(error){console.error('Errore eliminazione edificio:',error);setMessage('Eliminazione non riuscita: '+error.message);return}setMessage('Edificio eliminato correttamente.');setRefresh(refresh+1)}return <PageHead title="Edifici" subtitle="Anagrafe tecnica degli immobili dell’ente."><div className="page-actions"><div className="search"><Search size={17}/><input placeholder="Cerca edificio…" value={q} onChange={e=>setQ(e.target.value)}/></div>{write&&<button className="btn primary" onClick={()=>{setEditing(null);setShow(true)}}><Plus size={17}/> Nuovo edificio</button>}</div>{message&&<div className="notice success">{message}</div>}{show&&<Modal title={editing?'Modifica edificio':'Nuovo edificio'} close={()=>{setShow(false);setEditing(null)}}><BuildingForm row={editing} onCancel={()=>{setShow(false);setEditing(null)}} onSubmit={save}/></Modal>}<section className="card table-card">{filtered.length?<table><thead><tr><th>Codice</th><th>Edificio</th><th>Località</th><th>Centro di costo</th><th>Superficie</th><th>Anno</th><th>Azioni</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><b>{x.codice_edificio}</b></td><td><strong>{x.denominazione}</strong><span className="table-sub">{x.tipologia_scolastica||'—'}</span></td><td>{[x.indirizzo,x.comune].filter(Boolean).join(', ')||'—'}</td><td>{x.centro_di_costo||'—'}</td><td>{x.superficie?Number(x.superficie).toLocaleString('it-IT')+' m²':'—'}</td><td>{x.anno_costruzione||'—'}</td><td>{(canEdit(x.id)||canDelete(x.id))?<div style={{display:'flex',gap:6}}>{canEdit(x.id)&&<button className="icon-btn" title="Modifica edificio" onClick={()=>{setEditing(x);setShow(true)}}><Pencil size={16}/></button>}{canDelete(x.id)&&<button className="icon-btn" title="Elimina edificio" onClick={()=>remove(x)}><Trash2 size={16}/></button>}</div>:'—'}</td></tr>)}</tbody></table>:<Empty title="Nessun edificio visibile" text="Verifica ruolo e autorizzazioni RLS."/>}</section></PageHead>}
function BuildingForm({row,onCancel,onSubmit}:{row:Building|null;onCancel:()=>void;onSubmit:(e:any)=>void}){return <form className="form-grid" onSubmit={onSubmit}><label>Codice edificio<input name="codice" defaultValue={row?.codice_edificio||''} required/></label><label className="span-2">Denominazione<input name="denominazione" defaultValue={row?.denominazione||''} required/></label><label>Indirizzo<input name="indirizzo" defaultValue={row?.indirizzo||''}/></label><label>Comune<input name="comune" defaultValue={row?.comune||''}/></label><label>Provincia<input name="provincia" defaultValue={row?.provincia||''}/></label><label>CAP<input name="cap" defaultValue={row?.cap||''}/></label><label>Tipologia scolastica<input name="tipologia" defaultValue={row?.tipologia_scolastica||''}/></label><label>Centro di costo<input name="centro_di_costo" defaultValue={row?.centro_di_costo||''}/></label><label>Superficie m²<input name="superficie" type="number" min="0" step=".01" defaultValue={row?.superficie??''}/></label><label>Anno costruzione<input name="anno" type="number" min="1800" max="2200" defaultValue={row?.anno_costruzione??''}/></label><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onCancel}>Annulla</button><button className="btn primary">{row?'Salva modifiche':'Salva edificio'}</button></div></form>}


function BuildingFascicoliPage({access,onOpen,refresh}:{access:Access[];onOpen:(p:Page,id?:string)=>void;refresh:number}){
 const [rows,setRows]=useState<any[]>([]);const [q,setQ]=useState('');const [stats,setStats]=useState<Record<string,any>>({});const enteId=access[0]?.ente_id;
 useEffect(()=>{(async()=>{if(!enteId)return;const {data,error}=await supabase.from('edifici').select('id,codice_edificio,denominazione,indirizzo,comune,provincia,tipologia_scolastica,superficie').eq('ente_id',enteId).order('denominazione');if(error)console.error(error);setRows(data||[])})()},[enteId,refresh]);
 useEffect(()=>{(async()=>{if(!rows.length)return;const out:Record<string,any>={};await Promise.all(rows.map(async b=>{const [i,r,o,c,m,s]=await Promise.all([supabase.from('interventi').select('id',{count:'exact',head:true}).eq('edificio_id',b.id),supabase.from('richieste_intervento_sedi').select('id',{count:'exact',head:true}).eq('edificio_id',b.id),supabase.from('richieste_intervento_sedi').select('id,richieste_intervento!inner(id)',{count:'exact',head:true}).eq('edificio_id',b.id).eq('richieste_intervento.risolto',false),supabase.from('richieste_intervento_sedi').select('id,richieste_intervento!inner(id)',{count:'exact',head:true}).eq('edificio_id',b.id).eq('richieste_intervento.risolto',true),supabase.from('manutenzioni').select('id',{count:'exact',head:true}).eq('edificio_id',b.id),supabase.from('impianti_manutentivi').select('id',{count:'exact',head:true}).eq('edificio_id',b.id)]);out[b.id]={interventi:i.count||0,richieste:r.count||0,richieste_aperte:o.count||0,richieste_chiuse:c.count||0,manutenzioni:m.count||0,impianti:s.count||0}}));setStats(out)})()},[rows]);
 const filtered=rows.filter(b=>(b.codice_edificio+' '+b.denominazione+' '+(b.indirizzo||'')+' '+(b.comune||'')).toLowerCase().includes(q.toLowerCase()));
 return <PageHead title="Fascicoli degli edifici" subtitle="Dossier complessivo amministrativo, tecnico e manutentivo di ogni edificio."><div className="page-actions"><div className="search"><Search size={17}/><input placeholder="Cerca codice, denominazione, indirizzo o comune…" value={q} onChange={e=>setQ(e.target.value)}/></div></div><section className="building-file-grid">{filtered.map(b=>{const s=stats[b.id]||{};return <article key={b.id} className="building-file-card card clickable" onClick={()=>onOpen('fascicolo',b.id)}><div className="building-file-card-head"><div><span className="eyebrow">{b.codice_edificio}</span><h3>{b.denominazione}</h3><p>{[b.indirizzo,b.comune,b.provincia].filter(Boolean).join(', ')||'Ubicazione non indicata'}</p></div><ChevronRight size={20}/></div><div className="building-file-kpis"><span><b>{s.interventi||0}</b> interventi</span><span className="building-request-kpi"><b className="request-total">{s.richieste||0}</b><small>richieste totali</small><div><em className="request-open"><i></i>{s.richieste_aperte||0} aperte</em><em className="request-closed"><i></i>{s.richieste_chiuse||0} chiuse</em></div></span><span><b>{s.impianti||0}</b> impianti</span><span><b>{s.manutenzioni||0}</b> manutenzioni</span></div><div className="building-file-meta"><span>{b.tipologia_scolastica||'Tipologia non indicata'}</span><span>{b.superficie?Number(b.superficie).toLocaleString('it-IT')+' m²':''}</span></div></article>})}</section>{!filtered.length&&<Empty title="Nessun edificio" text="Nessun fascicolo corrisponde alla ricerca."/>}</PageHead>
}

function BuildingFile({id,access,onBack,refresh,setRefresh}:{id:string;access:Access[];onBack:()=>void;refresh:number;setRefresh:(x:number)=>void}){
 const [tab,setTab]=useState('sintesi');const [building,setBuilding]=useState<any>(null);const [cad,setCad]=useState<any[]>([]);const [interventions,setInterventions]=useState<any[]>([]);const [requests,setRequests]=useState<any[]>([]);const [systems,setSystems]=useState<any[]>([]);const [maint,setMaint]=useState<any[]>([]);const [maintDocs,setMaintDocs]=useState<any[]>([]);const [interventionDocs,setInterventionDocs]=useState<any[]>([]);const [loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);const b=await supabase.from('edifici').select('*').eq('id',id).single();if(!b.data){setLoading(false);return}setBuilding(b.data);const [c,i,rs,s,m,d]=await Promise.all([supabase.from('dati_catastali').select('*').eq('edificio_id',id),supabase.from('interventi').select('id,codice_intervento,titolo,cup,stato,importo_programmato,importo_finanziato,importo_contrattuale,annualita_programmazione').eq('edificio_id',id).order('created_at',{ascending:false}),supabase.from('richieste_intervento_sedi').select('richiesta_id').eq('edificio_id',id),supabase.from('impianti_manutentivi').select('*').eq('edificio_id',id).order('tipo'),supabase.from('manutenzioni').select('*,impianti_manutentivi(denominazione,tipo)').eq('edificio_id',id).order('data_richiesta',{ascending:false}),supabase.from('manutenzione_documenti').select('*').eq('edificio_id',id).order('data_documento',{ascending:false})]);setCad(c.data||[]);setInterventions(i.data||[]);setSystems(s.data||[]);setMaint(m.data||[]);setMaintDocs(d.data||[]);const ids=(rs.data||[]).map((x:any)=>x.richiesta_id);if(ids.length){const rr=await supabase.from('richieste_intervento').select('id,codice_richiesta,titolo_sintetico,tipo_intervento,risolto,data_richiesta,data_risoluzione').in('id',ids).order('data_richiesta',{ascending:false});setRequests(rr.data||[])}else setRequests([]);const intIds=(i.data||[]).map((x:any)=>x.id);if(intIds.length){const dd=await supabase.from('documenti').select('id,intervento_id,nome,tipo,data_documento,sezione,created_at,mime_type').in('intervento_id',intIds).order('created_at',{ascending:false});setInterventionDocs(dd.data||[])}else setInterventionDocs([]);setLoading(false)};
 useEffect(()=>{void load()},[id,refresh]);
 if(loading)return <PageHead title="Fascicolo edificio" subtitle=""><Loader/></PageHead>;
 if(!building)return <PageHead title="Fascicolo non disponibile" subtitle=""><Empty title="Edificio non trovato" text="Il fascicolo non è accessibile."/><button className="btn secondary" onClick={onBack}>Torna ai fascicoli</button></PageHead>;
 const openIntervention=(x:any)=>{location.hash='/intervento/'+x.id};
 const tabs=[['sintesi','Sintesi'],['anagrafica','Anagrafica'],['catasto','Catasto'],['interventi','Interventi'],['richieste','Richieste'],['manutenzioni','Impianti e manutenzioni'],['documenti','Documenti'],['cronologia','Cronologia']];
 return <PageHead title={building.denominazione} subtitle={building.codice_edificio+' · Fascicolo edificio'}><div className="page-actions no-print"><button className="btn secondary" onClick={onBack}>← Fascicoli</button><button className="btn secondary" onClick={load}><RefreshCw size={16}/> Aggiorna</button><button className="btn secondary" onClick={()=>window.print()}><Printer size={16}/> Stampa fascicolo</button></div><div className="file-hero building-file-hero"><div><span className="eyebrow">EDIFICIO</span><strong>{building.codice_edificio}</strong></div><div><span className="eyebrow">Interventi</span><strong>{interventions.length}</strong></div><div><span className="eyebrow">Richieste</span><strong>{requests.length}</strong></div><div><span className="eyebrow">Impianti</span><strong>{systems.length}</strong></div><div><span className="eyebrow">Manutenzioni</span><strong>{maint.length}</strong></div></div><div className="tabs no-print">{tabs.map(([k,t])=><button className={tab===k?'active':''} onClick={()=>setTab(k)} key={k}>{t}</button>)}</div>
 {tab==='sintesi'&&<div className="building-summary-grid"><section className="card"><div className="card-head"><div><h2>Identificazione</h2><p>Anagrafica essenziale dell'immobile.</p></div><Building2 size={20}/></div><div className="detail-grid"><div><small>Codice</small><b>{building.codice_edificio}</b></div><div><small>Denominazione</small><b>{building.denominazione}</b></div><div><small>Indirizzo</small><b>{[building.indirizzo,building.civico].filter(Boolean).join(' ')||'—'}</b></div><div><small>Comune</small><b>{[building.comune,building.provincia,building.cap].filter(Boolean).join(' · ')||'—'}</b></div><div><small>Tipologia</small><b>{building.tipologia_scolastica||'—'}</b></div><div><small>Superficie</small><b>{building.superficie?Number(building.superficie).toLocaleString('it-IT')+' m²':'—'}</b></div><div><small>Volume</small><b>{building.volume?Number(building.volume).toLocaleString('it-IT')+' m³':'—'}</b></div><div><small>Anno costruzione</small><b>{building.anno_costruzione||'—'}</b></div></div></section><section className="card"><div className="card-head"><div><h2>Stato del fascicolo</h2><p>Indicatori sintetici dell'edificio.</p></div><ClipboardList size={20}/></div><div className="building-alert-list"><div><b>{requests.filter(x=>!x.risolto).length}</b><span>Richieste aperte</span></div><div><b>{systems.filter(x=>x.stato==='attivo').length}</b><span>Impianti attivi</span></div><div><b>{maint.filter(x=>x.stato!=='chiusa'&&x.stato!=='annullata').length}</b><span>Manutenzioni aperte</span></div><div><b>{maint.filter(x=>x.data_programmata&&x.data_programmata<new Date().toISOString().slice(0,10)&&x.stato!=='chiusa').length}</b><span>Attività scadute</span></div></div></section></div>}
 {tab==='anagrafica'&&<section className="card"><div className="card-head"><div><h2>Anagrafica edificio</h2><p>Dati identificativi e dimensionali.</p></div><Building2 size={20}/></div><div className="detail-grid">{Object.entries({Codice:building.codice_edificio,Denominazione:building.denominazione,Indirizzo:[building.indirizzo,building.civico].filter(Boolean).join(' '),Comune:building.comune,Provincia:building.provincia,CAP:building.cap,'Centro di costo':building.centro_di_costo,'Stato immobile':building.stato_immobile,Superficie:building.superficie,Volume:building.volume,'Anno costruzione':building.anno_costruzione,'Anno adeguamento':building.anno_adeguamento}).map(([k,v])=><div key={k}><small>{k}</small><b>{v??'—'}</b></div>)}</div>{building.note&&<div className="note-box">{building.note}</div>}</section>}
 {tab==='catasto'&&<section className="card table-card"><div className="card-head"><div><h2>Dati catastali</h2><p>Unità catastali associate all'edificio.</p></div></div>{cad.length?<table><thead><tr><th>Comune</th><th>Foglio</th><th>Particella</th><th>Subalterno</th><th>Categoria</th><th>Consistenza</th><th>Superficie catastale</th></tr></thead><tbody>{cad.map(x=><tr key={x.id}><td>{x.comune||'—'}</td><td>{x.foglio||'—'}</td><td>{x.particella||'—'}</td><td>{x.subalterno||'—'}</td><td>{x.categoria||'—'}</td><td>{x.consistenza||'—'}</td><td>{x.superficie_catastale?x.superficie_catastale+' m²':'—'}</td></tr>)}</tbody></table>:<Empty title="Nessun dato catastale" text="Non risultano unità catastali associate."/>}</section>}
 {tab==='interventi'&&<section className="card table-card"><div className="card-head"><div><h2>Interventi sull'edificio</h2><p>Storia e stato dei lavori associati all'immobile.</p></div></div>{interventions.length?<table><thead><tr><th>Codice</th><th>Titolo</th><th>CUP</th><th>Stato</th><th>Importo</th><th></th></tr></thead><tbody>{interventions.map(x=><tr className="clickable" key={x.id} onClick={()=>openIntervention(x)}><td><b>{x.codice_intervento}</b></td><td>{x.titolo}</td><td>{x.cup||'—'}</td><td><span className={'badge '+statusClass(x.stato)}>{statusLabel(x.stato)}</span></td><td>{money(x.importo_programmato)}</td><td><ChevronRight size={18}/></td></tr>)}</tbody></table>:<Empty title="Nessun intervento" text="Non risultano interventi associati a questo edificio."/>}</section>}
 {tab==='richieste'&&<section className="card table-card"><div className="card-head"><div><h2>Richieste di intervento</h2><p>Segnalazioni riferite a questo edificio.</p></div></div>{requests.length?<table><thead><tr><th>Codice</th><th>Oggetto</th><th>Data</th><th>Tipo</th><th>Stato</th></tr></thead><tbody>{requests.map(x=><tr key={x.id}><td><b>{x.codice_richiesta}</b></td><td>{x.titolo_sintetico}</td><td>{date(x.data_richiesta)}</td><td>{statusLabel(x.tipo_intervento)}</td><td><span className={'badge '+(x.risolto?'green':'orange')}>{x.risolto?'Risolta':'Aperta'}</span></td></tr>)}</tbody></table>:<Empty title="Nessuna richiesta" text="Non risultano segnalazioni associate a questo edificio."/>}</section>}
 {tab==='manutenzioni'&&<><section className="card table-card"><div className="card-head"><div><h2>Impianti</h2><p>Sistemi manutentivi presenti nell'edificio.</p></div><Wrench size={20}/></div>{systems.length?<table><thead><tr><th>Tipo</th><th>Codice</th><th>Denominazione</th><th>Stato</th><th>Prossima manutenzione</th><th>Conformità</th></tr></thead><tbody>{systems.map(x=><tr key={x.id}><td>{statusLabel(x.tipo)}</td><td>{x.codice||'—'}</td><td>{x.denominazione}</td><td>{statusLabel(x.stato)}</td><td>{date(x.data_prossima_manutenzione)}</td><td>{x.conformita?'Conforme':'Da verificare'}</td></tr>)}</tbody></table>:<Empty title="Nessun impianto" text="Non risultano impianti manutentivi censiti."/>}</section><section className="card table-card"><div className="card-head"><div><h2>Registro manutenzioni</h2><p>Attività manutentive dell'edificio.</p></div></div>{maint.length?<table><thead><tr><th>Data</th><th>Impianto</th><th>Tipo</th><th>Stato</th><th>Esito</th><th>Costo</th></tr></thead><tbody>{maint.map(x=><tr key={x.id}><td>{date(x.data_esecuzione||x.data_richiesta)}</td><td>{x.impianti_manutentivi?.denominazione||'—'}</td><td>{statusLabel(x.tipo)}</td><td>{statusLabel(x.stato)}</td><td>{x.esito||'—'}</td><td>{money(x.costo_consuntivo??x.costo_previsto)}</td></tr>)}</tbody></table>:<Empty title="Nessuna manutenzione" text="Non risultano attività manutentive."/>}</section></>}
 {tab==='documenti'&&<div className="building-doc-grid"><section className="card table-card"><div className="card-head"><div><h2>Documenti degli interventi</h2><p>Documentazione collegata ai lavori dell'edificio.</p></div><Paperclip size={20}/></div>{interventionDocs.length?<table><thead><tr><th>Documento</th><th>Intervento</th><th>Sezione</th><th>Data</th></tr></thead><tbody>{interventionDocs.map(x=><tr key={x.id}><td>{x.nome}</td><td>{interventions.find(i=>i.id===x.intervento_id)?.codice_intervento||'—'}</td><td>{x.sezione||'—'}</td><td>{date(x.data_documento)}</td></tr>)}</tbody></table>:<Empty title="Nessun documento di intervento" text="Nessuna documentazione associata agli interventi."/>}</section><section className="card table-card"><div className="card-head"><div><h2>Documenti di manutenzione</h2><p>Rapporti, certificazioni e documenti manutentivi.</p></div><Paperclip size={20}/></div>{maintDocs.length?<table><thead><tr><th>Documento</th><th>Tipo</th><th>Data</th><th>Versione</th></tr></thead><tbody>{maintDocs.map(x=><tr key={x.id}><td>{x.nome}</td><td>{x.tipo||'—'}</td><td>{date(x.data_documento)}</td><td>{x.versione||'—'}</td></tr>)}</tbody></table>:<Empty title="Nessun documento manutentivo" text="Non risultano documenti associati."/>}</section></div>}
 {tab==='cronologia'&&<section className="card"><div className="card-head"><div><h2>Cronologia edificio</h2><p>Eventi principali ricavati dai dati disponibili.</p></div><CalendarDays size={20}/></div><div className="building-timeline">{[...interventions.map(x=>({d:x.created_at,title:x.codice_intervento+' · '+x.titolo,meta:'Intervento',status:x.stato})),...requests.map(x=>({d:x.data_richiesta,title:x.codice_richiesta+' · '+x.titolo_sintetico,meta:'Richiesta',status:x.risolto?'Risolta':'Aperta'})),...maint.map(x=>({d:x.data_esecuzione||x.data_richiesta,title:x.descrizione||statusLabel(x.tipo),meta:'Manutenzione',status:x.stato}))].sort((a,b)=>String(b.d||'').localeCompare(String(a.d||''))).map((x,i)=><div className="timeline-item" key={i}><span className="timeline-dot"></span><div><b>{x.title}</b><small>{x.meta} · {x.d?date(x.d):'Data non indicata'} · {statusLabel(x.status)}</small></div></div>)}{(!interventions.length&&!requests.length&&!maint.length)&&<Empty title="Cronologia vuota" text="Non sono ancora presenti eventi associati."/>}</div></section>}
 </PageHead>
}
function InterventionsPage({access,onOpen,refresh,setRefresh}:{access:Access[];onOpen:(p:Page,id?:string)=>void;refresh:number;setRefresh:(x:number)=>void}){const [rows,setRows]=useState<Intervention[]>([]);const [buildings,setBuildings]=useState<any[]>([]);const [q,setQ]=useState('');const [show,setShow]=useState(false);const write=canWrite(access);useEffect(()=>{Promise.all([supabase.from('interventi').select('id,ente_id,edificio_id,codice_intervento,titolo,descrizione,cup,importo_programmato,importo_finanziato,importo_contrattuale,stato,annualita_programmazione,priorita,edifici(denominazione)').order('created_at',{ascending:false}),supabase.from('edifici').select('id,codice_edificio,denominazione').order('denominazione')]).then(([a,b])=>{setRows((a.data||[]) as Intervention[]);setBuildings(b.data||[])})},[refresh]);const filtered=rows.filter(x=>(x.codice_intervento+' '+x.titolo+' '+(x.cup||'')).toLowerCase().includes(q.toLowerCase()));async function save(e:any){e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await supabase.from('interventi').insert({ente_id:access[0]?.ente_id,edificio_id:f.get('edificio'),codice_intervento:f.get('codice'),titolo:f.get('titolo'),cup:f.get('cup')||null,importo_programmato:Number(f.get('programmato')||0),importo_finanziato:Number(f.get('finanziato')||0),stato:f.get('stato')||'programmato',annualita_programmazione:Number(f.get('annualita')||0)||null});if(error)alert(error.message);else{setShow(false);setRefresh(refresh+1)}}return <PageHead title="Interventi" subtitle="Programmazione, progettazione, affidamento ed esecuzione."><div className="page-actions"><div className="search"><Search size={17}/><input placeholder="Cerca codice, titolo o CUP…" value={q} onChange={e=>setQ(e.target.value)}/></div>{write&&<button className="btn primary" onClick={()=>setShow(true)}><Plus size={17}/> Nuovo intervento</button>}</div>{show&&<Modal title="Nuovo intervento" close={()=>setShow(false)}><form className="form-grid" onSubmit={save}><label>Edificio<select name="edificio" required><option value="">Seleziona…</option>{buildings.map(b=><option value={b.id} key={b.id}>{b.codice_edificio} — {b.denominazione}</option>)}</select></label><label>Codice intervento<input name="codice" required/></label><label className="span-2">Titolo<input name="titolo" required/></label><label>CUP<input name="cup"/></label><label>Stato<select name="stato" defaultValue="programmato">{['programmato','progettazione','approvato','affidamento','contratto','esecuzione','fine_lavori','collaudo','chiuso','sospeso','annullato'].map(s=><option key={s}>{s}</option>)}</select></label><label>Importo programmato<input name="programmato" type="number" min="0" step=".01"/></label><label>Importo finanziato<input name="finanziato" type="number" min="0" step=".01"/></label><label>Annualità<input name="annualita" type="number" min="2020" max="2100"/></label><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={()=>setShow(false)}>Annulla</button><button className="btn primary">Salva intervento</button></div></form></Modal>}<section className="card table-card">{filtered.length?<table><thead><tr><th>Intervento</th><th>Edificio</th><th>Stato</th><th>Programmato</th><th>Finanziato</th><th></th></tr></thead><tbody>{filtered.map(x=><tr key={x.id} className="clickable" onClick={()=>onOpen('intervento',x.id)}><td><b>{x.codice_intervento}</b><span className="table-sub">{x.titolo}</span>{x.cup&&<span className="table-sub">CUP {x.cup}</span>}</td><td>{x.edifici?.[0]?.denominazione||'—'}</td><td><span className={'badge '+statusClass(x.stato)}>{statusLabel(x.stato)}</span></td><td>{money(x.importo_programmato)}</td><td>{money(x.importo_finanziato)}</td><td><ChevronRight size={18}/></td></tr>)}</tbody></table>:<Empty title="Nessun intervento visibile" text="Verifica ruolo e autorizzazioni RLS."/>}</section></PageHead>}

function InterventionFile({id,access,onBack,refresh,setRefresh}:{id:string;access:Access[];onBack:()=>void;refresh:number;setRefresh:(x:number)=>void}){
 const [row,setRow]=useState<any>(null);const [phases,setPhases]=useState<Phase[]>([]);const [docs,setDocs]=useState<any[]>([]);const [tab,setTab]=useState('anagrafica');const [loading,setLoading]=useState(true);const [perm,setPerm]=useState({can_view:true,can_create:true,can_update:true,can_delete:true,can_documents:true});const write=canWrite(access);const canCreate=write&&perm.can_create;const canDocuments=write&&perm.can_documents;
 const load=async()=>{setLoading(true);const [a,b,c]=await Promise.all([
   supabase.from('interventi').select('*,edifici(denominazione,indirizzo,comune)').eq('id',id).single(),
   supabase.from('fasi_intervento').select('*').eq('intervento_id',id).order('data_prevista_inizio',{ascending:true}),
   supabase.from('documenti').select('id,nome,tipo,data_documento,versione,firmato_digitalmente,url,formato,mime_type,size_bytes,sezione,record_id,created_by,created_at,note').eq('intervento_id',id).order('created_at',{ascending:false})
 ]);setRow(a.data);setPhases((b.data||[]) as Phase[]);setDocs(c.data||[]);setLoading(false)};
 useEffect(()=>{void load()},[id,refresh]);
 useEffect(()=>{(async()=>{const u=access[0]?.user_id,e=access[0]?.ente_id;if(!u||!e)return;const {data}=await supabase.from('permessi_utenti').select('can_view,can_create,can_update,can_delete,can_documents').eq('user_id',u).eq('ente_id',e).maybeSingle();if(data)setPerm(data)})()},[access]);
 const print=()=>window.print();
 if(loading)return <PageHead title="Fascicolo intervento" subtitle=""><Loader/></PageHead>;
 if(!row)return <PageHead title="Fascicolo non disponibile" subtitle=""><Empty title="Intervento non trovato" text="Record non accessibile con le autorizzazioni correnti."/><button className="btn secondary" onClick={onBack}>Torna agli interventi</button></PageHead>;
 const sectionDocs=(section:string)=>docs.filter(d=>d.sezione===section);
 return <PageHead title={row.titolo} subtitle={row.codice_intervento}>
   <div className="page-actions no-print"><button className="btn secondary" onClick={onBack}>← Interventi</button><button className="btn secondary" onClick={load}><RefreshCw size={16}/> Aggiorna</button><button className="btn secondary" onClick={print}><Printer size={16}/> Stampa report</button><span className={'badge '+statusClass(row.stato)}>{statusLabel(row.stato)}</span></div>
   <div className="file-hero"><div><span className="eyebrow">CUP</span><strong>{row.cup||'Non indicato'}</strong></div><div><span className="eyebrow">Programmato</span><strong>{money(row.importo_programmato)}</strong></div><div><span className="eyebrow">Finanziato</span><strong>{money(row.importo_finanziato)}</strong></div><div><span className="eyebrow">Edificio</span><strong>{row.edifici?.[0]?.denominazione||'—'}</strong></div></div>
   <div className="tabs no-print">{['anagrafica','fasi','progetti','quadro','affidamento','contratto','sal','pagamenti','varianti','atti','documenti','collaudo'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{statusLabel(t)}</button>)}</div>
   {tab==='anagrafica'&&<><Anagrafica row={row}/><AttachmentsPanel interventionId={id} section="anagrafica" docs={sectionDocs('anagrafica')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='fasi'&&<><PhasesPanel id={id} phases={phases} write={canCreate} refresh={refresh} setRefresh={setRefresh}/><AttachmentsPanel interventionId={id} section="fasi" docs={sectionDocs('fasi')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='progetti'&&<><ProjectsPanel id={id}/><AttachmentsPanel interventionId={id} section="progetti" docs={sectionDocs('progetti')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='quadro'&&<><QePanel id={id}/><AttachmentsPanel interventionId={id} section="quadro" docs={sectionDocs('quadro')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='affidamento'&&<><ProcedurePanel id={id}/><AttachmentsPanel interventionId={id} section="affidamento" docs={sectionDocs('affidamento')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='contratto'&&<><ContractPanel id={id}/><AttachmentsPanel interventionId={id} section="contratto" docs={sectionDocs('contratto')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='sal'&&<><SalPanel id={id}/><AttachmentsPanel interventionId={id} section="sal" docs={sectionDocs('sal')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='pagamenti'&&<><PaymentsPanel id={id}/><AttachmentsPanel interventionId={id} section="pagamenti" docs={sectionDocs('pagamenti')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='varianti'&&<><VariantsPanel id={id}/><AttachmentsPanel interventionId={id} section="varianti" docs={sectionDocs('varianti')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='atti'&&<><ActsPanel id={id}/><AttachmentsPanel interventionId={id} section="atti" docs={sectionDocs('atti')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   {tab==='documenti'&&<DocumentsPanel id={id} docs={docs} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/>}
   {tab==='collaudo'&&<><CollaudoPanel id={id}/><AttachmentsPanel interventionId={id} section="collaudo" docs={sectionDocs('collaudo')} write={canDocuments} refresh={refresh} setRefresh={setRefresh}/></>}
   <InterventionPrintReport row={row} phases={phases} docs={docs}/>
 </PageHead>
}

function InterventionPrintReport({row,phases,docs}:{row:any;phases:Phase[];docs:any[]}){return <div className="print-report"><h1>Rapporto intervento</h1><div className="print-meta"><div><b>Codice</b><span>{row.codice_intervento}</span></div><div><b>Titolo</b><span>{row.titolo}</span></div><div><b>CUP</b><span>{row.cup||'—'}</span></div><div><b>Stato</b><span>{statusLabel(row.stato)}</span></div><div><b>Edificio</b><span>{row.edifici?.[0]?.denominazione||'—'}</span></div><div><b>Importo programmato</b><span>{money(row.importo_programmato)}</span></div><div><b>Importo finanziato</b><span>{money(row.importo_finanziato)}</span></div><div><b>Importo contrattuale</b><span>{money(row.importo_contrattuale)}</span></div></div><h2>Fasi procedurali</h2>{phases.length?<table><thead><tr><th>Fase</th><th>Stato</th><th>Avanzamento</th><th>Fine prevista</th><th>Fine effettiva</th></tr></thead><tbody>{phases.map(p=><tr key={p.id}><td>{statusLabel(p.fase)}</td><td>{statusLabel(p.stato||'')}</td><td>{Number(p.percentuale_avanzamento||0)}%</td><td>{date(p.data_prevista_fine)}</td><td>{date(p.data_effettiva_fine)}</td></tr>)}</tbody></table>:<p>Nessuna fase registrata.</p>}<h2>Documentazione</h2>{docs.length?<ul>{docs.map(d=><li key={d.id}>{d.nome} — {statusLabel(d.sezione||'intervento')} — {date(d.data_documento)}</li>)}</ul>:<p>Nessun documento.</p>}<p className="print-footer">Generato il {new Date().toLocaleString('it-IT')}</p></div>
}

function Anagrafica({row}:{row:any}){return <section className="content-grid"><section className="card"><div className="card-head"><h2>Dati intervento</h2><ClipboardList size={20}/></div><Info label="Codice" value={row.codice_intervento}/><Info label="CUP" value={row.cup}/><Info label="Stato" value={statusLabel(row.stato)}/><Info label="Annualità" value={row.annualita_programmazione}/><Info label="Priorità" value={row.priorita}/></section><section className="card"><div className="card-head"><h2>Importi</h2><WalletCards size={20}/></div><Info label="Programmato" value={money(row.importo_programmato)}/><Info label="Finanziato" value={money(row.importo_finanziato)}/><Info label="Contrattuale" value={money(row.importo_contrattuale)}/></section></section>}
function PhasesPanel({id,phases,write,refresh,setRefresh}:{id:string;phases:Phase[];write:boolean;refresh:number;setRefresh:(x:number)=>void}){const [show,setShow]=useState(false);async function save(e:any){e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await supabase.from('fasi_intervento').insert({intervento_id:id,fase:f.get('fase'),stato:f.get('stato'),percentuale_avanzamento:Number(f.get('percentuale')||0),data_prevista_inizio:f.get('inizio')||null,data_prevista_fine:f.get('fine')||null,note:f.get('note')||null});if(error)alert(error.message);else{setShow(false);setRefresh(refresh+1)}}return <section className="card table-card"><div className="card-head"><div><h2>Fasi procedurali</h2><p>Avanzamento e scadenze</p></div>{write&&<button className="btn primary" onClick={()=>setShow(true)}><Plus size={16}/> Nuova fase</button>}</div>{show&&<Modal title="Nuova fase" close={()=>setShow(false)}><form className="form-grid" onSubmit={save}><label>Fase<select name="fase" required>{['programmazione','pfte','verifica_pfte','approvazione_pfte','esecutivo','verifica_esecutivo','validazione','approvazione','affidamento','contratto','consegna','esecuzione','sal','fine_lavori','collaudo','cre','chiusura'].map(x=><option key={x}>{x}</option>)}</select></label><label>Stato<input name="stato" defaultValue="pianificata"/></label><label>Avanzamento %<input name="percentuale" type="number" min="0" max="100" defaultValue="0"/></label><label>Data prevista fine<input name="fine" type="date"/></label><label>Data prevista inizio<input name="inizio" type="date"/></label><label className="span-2">Note<textarea name="note"/></label><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={()=>setShow(false)}>Annulla</button><button className="btn primary">Salva</button></div></form></Modal>}{phases.length?<table><thead><tr><th>Fase</th><th>Stato</th><th>Avanzamento</th><th>Scadenza</th></tr></thead><tbody>{phases.map(p=><tr key={p.id}><td><b>{statusLabel(p.fase)}</b></td><td>{statusLabel(p.stato||'')}</td><td><div className="progress-track"><i style={{width:Number(p.percentuale_avanzamento||0)+'%'}}/></div>{Number(p.percentuale_avanzamento||0)}%</td><td>{date(p.data_prevista_fine)}</td></tr>)}</tbody></table>:<Empty title="Nessuna fase" text="Inserisci la prima fase procedurale."/>}</section>}
function AttachmentsPanel({interventionId,section,docs,write,refresh,setRefresh}:{interventionId:string;section:string;docs:any[];write:boolean;refresh:number;setRefresh:(x:number)=>void}){return <DocumentsPanel id={interventionId} docs={docs} write={write} refresh={refresh} setRefresh={setRefresh} section={section} compact/>}
function DocumentsPanel({id,docs,write,refresh,setRefresh,section='documenti',compact=false}:{id:string;docs:any[];write:boolean;refresh:number;setRefresh:(x:number)=>void;section?:string;compact?:boolean}){
 const [busy,setBusy]=useState(false);const [editing,setEditing]=useState<any|null>(null);
 async function upload(e:any){const input=e.currentTarget;const file=input.files?.[0];if(!file)return;setBusy(true);const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=id+'/'+section+'/'+crypto.randomUUID()+'-'+safe;
   const {error:up}=await supabase.storage.from('documenti').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up){alert(up.message);setBusy(false);return}
   const {data:user}=await supabase.auth.getUser();
   const {error}=await supabase.from('documenti').insert({intervento_id:id,sezione:section,record_id:null,nome:file.name,tipo:docType(file.type),formato:file.type,data_documento:new Date().toISOString().slice(0,10),versione:1,url:path,mime_type:file.type||null,size_bytes:file.size,created_by:user.user?.id||null});
   if(error){await supabase.storage.from('documenti').remove([path]);alert(error.message)}else setRefresh(refresh+1);setBusy(false);input.value=''
 }
 async function download(path:string){const {data,error}=await supabase.storage.from('documenti').createSignedUrl(path,600);if(error)alert(error.message);else window.open(data.signedUrl,'_blank')}
 async function updateDoc(e:any){e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await supabase.from('documenti').update({nome:String(f.get('nome')||'').trim(),data_documento:f.get('data')||null,versione:Number(f.get('versione')||1),firmato_digitalmente:f.get('firmato')==='on',note:String(f.get('note')||'').trim()||null}).eq('id',editing.id);if(error){alert(error.message);return}setEditing(null);setRefresh(refresh+1)}
 async function removeDoc(d:any){if(!confirm('Eliminare il documento "'+d.nome+'"? Verrà eliminato anche l\'allegato dal deposito documentale.'))return;const {error:upError}=d.url?await supabase.storage.from('documenti').remove([d.url]):{error:null};if(upError){alert(upError.message);return}const {error}=await supabase.from('documenti').delete().eq('id',d.id);if(error){alert(error.message);return}setRefresh(refresh+1)}
 return <section className={'card table-card attachments-card '+(compact?'compact-card':'')}><div className="card-head"><div><h2>{compact?'Allegati della sezione':'Documenti del fascicolo'}</h2><p>{compact?'Documenti associati a '+statusLabel(section):'Archivio documentale completo dell\'intervento'}</p></div>{write&&<label className="btn primary no-print"><Upload size={16}/>{busy?'Caricamento…':'Carica allegato'}<input hidden type="file" onChange={upload}/></label>}</div>{docs.length?<table><thead><tr><th>Documento</th><th>Data</th><th>Versione</th><th>Firma</th><th>Sezione</th><th className="no-print">Azioni</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td><strong>{d.nome}</strong><span className="table-sub">{d.mime_type||d.formato||'—'}{d.size_bytes?' · '+(Number(d.size_bytes)/1024/1024).toFixed(2)+' MB':''}</span></td><td>{date(d.data_documento)}</td><td>{d.versione||1}</td><td>{d.firmato_digitalmente?'Sì':'No'}</td><td><span className="badge blue">{statusLabel(d.sezione||'intervento')}</span></td><td className="no-print"><div style={{display:'flex',gap:5}}>{d.url&&<button className="icon-btn" onClick={()=>download(d.url)} title="Apri allegato"><Download size={16}/></button>}{write&&<><button className="icon-btn" onClick={()=>setEditing(d)} title="Modifica metadati"><Pencil size={16}/></button><button className="icon-btn" onClick={()=>removeDoc(d)} title="Elimina allegato"><Trash2 size={16}/></button></>}</div></td></tr>)}</tbody></table>:<Empty title="Nessun allegato" text={write?'Carica il primo documento della sezione.':'Non risultano allegati per questa sezione.'}/>} {editing&&<Modal title="Modifica documento" close={()=>setEditing(null)}><form className="form-grid" onSubmit={updateDoc}><label className="span-2">Nome documento<input name="nome" defaultValue={editing.nome} required/></label><label>Data documento<input name="data" type="date" defaultValue={editing.data_documento||''}/></label><label>Versione<input name="versione" type="number" min="1" defaultValue={editing.versione||1}/></label><label className="checkbox-label span-2"><input name="firmato" type="checkbox" defaultChecked={!!editing.firmato_digitalmente}/> Firmato digitalmente</label><label className="span-2">Note<textarea name="note" defaultValue={editing.note||''}/></label><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={()=>setEditing(null)}>Annulla</button><button className="btn primary"><Save size={16}/> Salva modifiche</button></div></form></Modal>}</section>
}

function ProjectsPanel({id}:{id:string}){return <DataPanel title="Progetti" query={()=>supabase.from('progetti').select('*').eq('intervento_id',id).order('versione',{ascending:false})} columns={['livello','versione','data_redazione','data_approvazione','importo_lavori','importo_quadro_economico','stato']}/>}
function QePanel({id}:{id:string}){return <DataPanel title="Quadri economici" query={()=>supabase.from('quadri_economici').select('*').eq('intervento_id',id).order('versione',{ascending:false})} columns={['versione','data_validita','importo_totale','stato']}/>}
function ProcedurePanel({id}:{id:string}){return <DataPanel title="Procedure di affidamento" query={()=>supabase.from('procedure_affidamento').select('*').eq('intervento_id',id).order('data_avvio',{ascending:false})} columns={['tipo_procedura','piattaforma','data_avvio','data_aggiudicazione','importo_base','importo_aggiudicazione','cig','stato']}/>}
function ContractPanel({id}:{id:string}){return <DataPanel title="Contratti" query={()=>supabase.from('contratti').select('*').eq('intervento_id',id).order('data_stipula',{ascending:false})} columns={['cig','numero_contratto','data_stipula','data_consegna','data_fine_prevista','importo','stato']}/>}
function SalPanel({id}:{id:string}){return <ContractLinkedPanel title="SAL" id={id} table="sal" columns={['numero_sal','periodo_da','periodo_a','importo_lavori','importo_sicurezza','importo_certificato','data_emissione','data_approvazione']}/>}
function PaymentsPanel({id}:{id:string}){return <ContractLinkedPanel title="Pagamenti" id={id} table="pagamenti" columns={['numero_mandato','data_mandato','importo','beneficiario','stato']}/>}
function VariantsPanel({id}:{id:string}){return <ContractLinkedPanel title="Varianti" id={id} table="varianti" columns={['numero','motivazione','importo_precedente','importo_nuovo','variazione','data_approvazione']}/>}
function ActsPanel({id}:{id:string}){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{supabase.from('atti_intervento').select('atti(*)').eq('intervento_id',id).then(({data})=>setRows((data||[]).map((x:any)=>x.atti).filter(Boolean)))},[id]);return <section className="card table-card"><div className="card-head"><h2>Atti</h2><FileText size={20}/></div>{rows.length?<table><thead><tr><th>Tipo</th><th>Numero</th><th>Anno</th><th>Data</th><th>Oggetto</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{statusLabel(x.tipo)}</td><td>{x.numero||'—'}</td><td>{x.anno||'—'}</td><td>{date(x.data)}</td><td>{x.oggetto||'—'}</td></tr>)}</tbody></table>:<Empty title="Nessun atto collegato" text="Gli atti potranno essere associati al fascicolo."/>}</section>}
function CollaudoPanel({id}:{id:string}){return <DataPanel title="Collaudo / CRE" query={()=>supabase.from('colluadi').select('*').eq('intervento_id',id).order('data_nomina',{ascending:false})} columns={['tipo','data_nomina','data_inizio','data_fine','esito']}/>}
function ContractLinkedPanel({title,id,table,columns}:{title:string;id:string;table:string;columns:string[]}){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{supabase.from('contratti').select('id').eq('intervento_id',id).then(async({data})=>{const ids=(data||[]).map((x:any)=>x.id);if(!ids.length){setRows([]);return}const {data:items}=await supabase.from(table).select('*').in('contratto_id',ids);setRows(items||[])})},[id,table]);return <DataTable title={title} rows={rows} columns={columns}/>}
function DataPanel({title,query,columns}:{title:string;query:()=>any;columns:string[]}){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{query().then(({data}:any)=>setRows(data||[]))},[]);return <DataTable title={title} rows={rows} columns={columns}/>}
function DataTable({title,rows,columns}:{title:string;rows:any[];columns:string[]}){return <section className="card table-card"><div className="card-head"><h2>{title}</h2><FileText size={20}/></div>{rows.length?<table><thead><tr>{columns.map(c=><th key={c}>{statusLabel(c)}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{columns.map(c=><td key={c}>{c.startsWith('importo')||c==='variazione'?money(r[c]):c.startsWith('data_')||c==='periodo_da'||c==='periodo_a'?date(r[c]):r[c]===null||r[c]===undefined?'—':String(r[c])}</td>)}</tr>)}</tbody></table>:<Empty title="Nessun dato" text="Non risultano registrazioni per questa sezione."/>}</section>}
function ReportPage({refresh}:{refresh:number}){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{supabase.from('dashboard_avanzamento').select('*').order('prossima_scadenza',{ascending:true}).then(({data})=>setRows(data||[]))},[refresh]);return <PageHead title="Report" subtitle="Monitoraggio sintetico di avanzamento e scadenze."><section className="card table-card"><table><thead><tr><th>Intervento</th><th>Titolo</th><th>Stato</th><th>Avanzamento</th><th>Prossima scadenza</th></tr></thead><tbody>{rows.map(x=><tr key={x.intervento_id}><td>{x.codice_intervento}</td><td>{x.titolo}</td><td><span className={'badge '+statusClass(x.stato)}>{statusLabel(x.stato)}</span></td><td>{Number(x.avanzamento||0).toFixed(0)}%</td><td>{date(x.prossima_scadenza)}</td></tr>)}</tbody></table></section></PageHead>}
function DashboardConfig({access}:{access:Access[]}){
 const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(false);const [msg,setMsg]=useState('');
 const enteId=access[0]?.ente_id;const canAdmin=access.some(x=>['superadmin','admin_ente'].includes(x.ruolo));
 const load=async()=>{if(!enteId)return;const {data,error}=await supabase.from('dashboard_config').select('id,dashboard_key,titolo,ordine,visibile').eq('ente_id',enteId).order('ordine');if(error)setMsg(error.message);else setRows(data||[])};
 useEffect(()=>{load()},[enteId]);
 const move=async(i:number,dir:number)=>{const j=i+dir;if(j<0||j>=rows.length)return;const next=[...rows];[next[i],next[j]]=[next[j],next[i]];setRows(next);setLoading(true);for(let k=0;k<next.length;k++)await supabase.from('dashboard_config').update({ordine:k+1}).eq('id',next[k].id);setLoading(false);setMsg('Ordine dashboard aggiornato.')};
 const toggle=async(i:number)=>{const row=rows[i];const {error}=await supabase.from('dashboard_config').update({visibile:!row.visibile}).eq('id',row.id);if(error)setMsg(error.message);else{const next=[...rows];next[i]={...row,visibile:!row.visibile};setRows(next);setMsg('Visibilità aggiornata.')}};
 return <section className="admin-section card"><div className="card-head"><div><h2>Configurazione dashboard</h2><p>Imposta l'ordine e la visibilità delle dashboard nella Home.</p></div><SlidersHorizontal size={20}/></div>{msg&&<div className="notice success">{msg}</div>}{loading&&<div className="notice">Salvataggio in corso…</div>}<div className="dashboard-config-list">{rows.map((r,i)=><div className={'dashboard-config-row '+(!r.visibile?'disabled':'')} key={r.id}><div className="dashboard-order">{i+1}</div><div className="dashboard-config-main"><strong>{r.titolo}</strong><span>{r.visibile?'Visibile nella Home':'Nascosta nella Home'}</span></div><div className="dashboard-config-actions">{canAdmin&&<><button className="icon-btn dark-icon" disabled={i===0||loading} onClick={()=>move(i,-1)} title="Sposta su">↑</button><button className="icon-btn dark-icon" disabled={i===rows.length-1||loading} onClick={()=>move(i,1)} title="Sposta giù">↓</button><button className={'btn '+(r.visibile?'secondary':'primary')} disabled={loading} onClick={()=>toggle(i)}>{r.visibile?'Nascondi':'Mostra'}</button></>}</div></div>)}</div></section>
}

function AdminPage({access}:{access:Access[]}){
 const [users,setUsers]=useState<any[]>([]);
 const [entities,setEntities]=useState<any[]>([]);
 const [buildings,setBuildings]=useState<any[]>([]);
 const [form,setForm]=useState({user_id:'',ente_id:'',ruolo:'tecnico'});
 const [buildingPerm,setBuildingPerm]=useState({user_id:'',edificio_id:'',all_buildings:false,can_update:true,can_delete:true});
 const [entity,setEntity]=useState({id:'',denominazione:'',codice_ipa:'',codice_fiscale:'',tipo_ente:'',pec:'',email:'',telefono:'',attivo:true});
 const [savingEntity,setSavingEntity]=useState(false);
 const [entityMessage,setEntityMessage]=useState('');
 const [entityMessageType,setEntityMessageType]=useState<'success'|'error'>('success');
 const [userModal,setUserModal]=useState(false);
 const [editingUser,setEditingUser]=useState<any|null>(null);
 const [userSaving,setUserSaving]=useState(false);
 const [userMessage,setUserMessage]=useState(''); const [permRows,setPermRows]=useState<any[]>([]);
 const [selectedPermUser,setSelectedPermUser]=useState('');
 const [permForm,setPermForm]=useState({can_view:true,can_create:true,can_update:true,can_delete:true,can_documents:true});
 const [auditRows,setAuditRows]=useState<any[]>([]);
 const [requestDomains,setRequestDomains]=useState<any[]>([]);const [domainForm,setDomainForm]=useState({id:'',codice:'',denominazione:'',attivo:true});const [domainMessage,setDomainMessage]=useState('');

 const manage=access.some(x=>['superadmin','admin_ente'].includes(x.ruolo));
 const superadmin=access.some(x=>x.ruolo==='superadmin');
 const currentEnteId=access.find(x=>x.ruolo==='superadmin')?.ente_id||access[0]?.ente_id||'';
 const load=async()=>{
   const [a,b,c,d,e]=await Promise.all([
     supabase.from('profiles').select('id,nome,cognome,email,telefono,attivo').order('cognome'),
     supabase.from('enti').select('id,denominazione').order('denominazione'),
     supabase.from('enti').select('id,denominazione,codice_ipa,codice_fiscale,tipo_ente,pec,email,telefono,attivo').eq('id',currentEnteId).maybeSingle(),
     supabase.from('edifici').select('id,codice_edificio,denominazione').eq('ente_id',currentEnteId).order('denominazione'),
     supabase.from('ambiti_richiesta_intervento').select('id,codice,denominazione,attivo').order('denominazione')
   ]);
   if(a.error)console.error('Errore caricamento profili:',a.error);
   if(b.error)console.error('Errore caricamento enti:',b.error);
   if(c.error)console.error('Errore caricamento anagrafica ente:',c.error);
   if(d.error)console.error('Errore caricamento edifici:',d.error);
   if(e.error)console.error('Errore caricamento ambiti:',e.error);
   setUsers(a.data||[]);setEntities(b.data||[]);setBuildings(d.data||[]);setRequestDomains(e.data||[]);
   if(c.data)setEntity(c.data);
   if(manage)await loadManagedUsers();
 };
 const saveRequestDomain=async(e:any)=>{
   e.preventDefault();setDomainMessage('');
   const codice=String(domainForm.codice||'').trim().toUpperCase().replace(/[^A-Z0-9_]+/g,'_');const denominazione=String(domainForm.denominazione||'').trim();
   if(!codice||!denominazione){setDomainMessage('Codice e denominazione sono obbligatori.');return}
   const payload={codice,denominazione,attivo:domainForm.attivo};
   const result=domainForm.id?await supabase.from('ambiti_richiesta_intervento').update(payload).eq('id',domainForm.id):await supabase.from('ambiti_richiesta_intervento').insert(payload);
   if(result.error){setDomainMessage('Salvataggio non riuscito: '+result.error.message);return}
   setDomainForm({id:'',codice:'',denominazione:'',attivo:true});setDomainMessage(domainForm.id?'Ambito modificato.':'Ambito aggiunto.');await load();
 };
 const deleteRequestDomain=async(x:any)=>{
   if(!confirm('Disattivare l’ambito "'+x.denominazione+'"? Le richieste già classificate conserveranno il collegamento.'))return;
   const {error}=await supabase.from('ambiti_richiesta_intervento').update({attivo:false}).eq('id',x.id);if(error){setDomainMessage('Operazione non riuscita: '+error.message);return}setDomainMessage('Ambito disattivato.');await load();
 };
 const loadManagedUsers=async()=>{
   const {data,error}=await supabase.functions.invoke('admin-users',{body:{action:'list'}});
   if(error){console.error('Errore elenco utenti:',error);setUserMessage('Elenco utenti non disponibile: '+error.message);return}
   if(data?.error){setUserMessage('Elenco utenti non disponibile: '+data.error);return}
   setUsers(data?.users||[]);
 };
 const loadPermissions=async()=>{if(!manage||!currentEnteId)return;const {data,error}=await supabase.from('permessi_utenti').select('id,user_id,ente_id,can_view,can_create,can_update,can_delete,can_documents,can_admin').eq('ente_id',currentEnteId);if(error){console.error('Errore caricamento privilegi:',error);return}setPermRows(data||[])};
 const loadAudit=async()=>{if(!manage||!currentEnteId)return;const {data,error}=await supabase.from('audit_log').select('id,timestamp,user_id,azione,tabella,record_id,valore_precedente,valore_nuovo').eq('ente_id',currentEnteId).order('timestamp',{ascending:false}).limit(100);if(error){console.error('Errore caricamento log:',error);return}setAuditRows(data||[])};
 useEffect(()=>{void load();void loadPermissions();void loadAudit()},[currentEnteId,manage]);

 async function assign(e:any){
   e.preventDefault();
   if(!form.user_id||!form.ente_id||!form.ruolo){alert('Compila Utente, Ente e Ruolo.');return}
   const {error}=await supabase.from('user_roles').upsert(form,{onConflict:'user_id,ente_id,ruolo'});
   if(error){console.error('Errore assegnazione ruolo:',error);alert('Errore assegnazione ruolo: '+error.message);return}
   alert('Ruolo assegnato correttamente.');setForm({user_id:'',ente_id:'',ruolo:'tecnico'});await loadManagedUsers();
 }
 async function saveEntity(e:any){
   e.preventDefault();setEntityMessage('');
   if(!entity.id||!entity.denominazione.trim()){setEntityMessageType('error');setEntityMessage('Compila la denominazione dell\'ente.');return}
   setSavingEntity(true);
   const payload={denominazione:entity.denominazione.trim(),codice_ipa:entity.codice_ipa.trim()||null,codice_fiscale:entity.codice_fiscale.trim()||null,tipo_ente:entity.tipo_ente.trim()||null,pec:entity.pec.trim()||null,email:entity.email.trim()||null,telefono:entity.telefono.trim()||null,attivo:entity.attivo};
   try{
     const timeout=new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Timeout: Supabase non ha risposto entro 12 secondi.')),12000));
     const updateResult=await Promise.race([supabase.from('enti').update(payload).eq('id',entity.id),timeout]);
     if(updateResult.error)throw new Error(updateResult.error.message);
     const reread=await Promise.race([supabase.from('enti').select('id,denominazione,codice_ipa,codice_fiscale,tipo_ente,pec,email,telefono,attivo').eq('id',entity.id).maybeSingle(),timeout]);
     if(reread.error)throw new Error('Salvataggio riuscito, ma rilettura fallita: '+reread.error.message);
     if(!reread.data)throw new Error('Il database non ha restituito l\'ente aggiornato.');
     setEntity(reread.data);setEntities(prev=>prev.map(x=>x.id===reread.data!.id?{...x,denominazione:reread.data!.denominazione}:x));
     setEntityMessageType('success');setEntityMessage('✓ Anagrafica ente salvata correttamente nel database.');
   }catch(err:any){
     const msg=err?.message||String(err);console.error('Errore salvataggio anagrafica ente:',err);
     setEntityMessageType('error');setEntityMessage('Salvataggio non riuscito: '+msg);
   }finally{setSavingEntity(false)}
 }
 async function saveUser(e:any){
   e.preventDefault();setUserSaving(true);setUserMessage('');
   const f=new FormData(e.currentTarget);
   const payload:any={
     action:editingUser?'update':'create',
     user_id:editingUser?.id,
     nome:String(f.get('nome')||'').trim(),
     cognome:String(f.get('cognome')||'').trim(),
     email:String(f.get('email')||'').trim(),
     telefono:String(f.get('telefono')||'').trim(),
     password:String(f.get('password')||''),
     ente_id:String(f.get('ente_id')||''),
     ruolo:String(f.get('ruolo')||'tecnico'),
     attivo:f.get('attivo')==='on'
   };
   if(!editingUser&&!payload.password){setUserMessage('Per un nuovo utente la password è obbligatoria (minimo 8 caratteri).');setUserSaving(false);return}
   try{
     const {data,error}=await supabase.functions.invoke('admin-users',{body:payload});
     if(error){if(error instanceof FunctionsHttpError){try{const body=await error.context.json();throw new Error(body?.error||body?.message||error.message)}catch(inner:any){throw inner instanceof Error?inner:new Error(error.message)}}throw new Error(error.message)}
     if(data?.error)throw new Error(data.error);
     setUserModal(false);setEditingUser(null);setUserMessage(editingUser?'Utente modificato correttamente.':'Utente creato correttamente.');await loadManagedUsers();
   }catch(err:any){console.error('Errore gestione utente:',err);setUserMessage('Operazione non riuscita: '+(err?.message||String(err)))}finally{setUserSaving(false)}
 }
 async function removeUser(u:any){
   if(!confirm('Eliminare definitivamente l\'utente "'+(u.email||'')+'"? L\'operazione elimina anche le associazioni applicative dell\'utente.'))return;
   const {data,error}=await supabase.functions.invoke('admin-users',{body:{action:'delete',user_id:u.id,ente_id:u.roles?.[0]?.ente_id||currentEnteId}});
   if(error||data?.error){alert('Eliminazione non riuscita: '+(data?.error||error?.message||'errore'));return}
   setUserMessage('Utente eliminato correttamente.');await loadManagedUsers();
 }
 const openNewUser=()=>{setEditingUser(null);setUserMessage('');setUserModal(true)};
 const openEditUser=(u:any)=>{
   const r=u.roles?.[0];
   setEditingUser({...u,ente_id:r?.ente_id||currentEnteId,ruolo:r?.ruolo||'tecnico'});
   setUserMessage('');setUserModal(true);
 };
 async function savePermissions(e:any){e.preventDefault();if(!selectedPermUser)return;const {error}=await supabase.from('permessi_utenti').upsert({ente_id:currentEnteId,user_id:selectedPermUser,...permForm},{onConflict:'ente_id,user_id'});if(error){alert('Errore salvataggio privilegi: '+error.message);return}alert('Privilegi utente salvati.');await loadPermissions()}
 const resetPermissions=async()=>{if(!selectedPermUser)return;if(!confirm('Ripristinare i privilegi predefiniti per questo utente?'))return;const {error}=await supabase.from('permessi_utenti').delete().eq('ente_id',currentEnteId).eq('user_id',selectedPermUser);if(error){alert('Errore ripristino privilegi: '+error.message);return}setPermForm({can_view:true,can_create:true,can_update:true,can_delete:true,can_documents:true});await loadPermissions()};
 const selectPermissionUser=(uid:string)=>{setSelectedPermUser(uid);const p=permRows.find(x=>x.user_id===uid);setPermForm(p?{can_view:p.can_view,can_create:p.can_create,can_update:p.can_update,can_delete:p.can_delete,can_documents:p.can_documents}:{can_view:true,can_create:true,can_update:true,can_delete:true,can_documents:true})};
 async function saveBuildingPermission(e:any){
   e.preventDefault();
   if(!buildingPerm.user_id||(!buildingPerm.all_buildings&&!buildingPerm.edificio_id)){alert('Seleziona un edificio oppure Tutti gli edifici.');return}
   const payload={ente_id:currentEnteId,user_id:buildingPerm.user_id,edificio_id:buildingPerm.all_buildings?null:buildingPerm.edificio_id,all_buildings:buildingPerm.all_buildings,can_update:buildingPerm.can_update,can_delete:buildingPerm.can_delete};
   if(buildingPerm.all_buildings){
     const {error:delError}=await supabase.from('edifici_permessi').delete().eq('ente_id',currentEnteId).eq('user_id',buildingPerm.user_id);
     if(delError){alert('Errore aggiornamento permessi: '+delError.message);return}
     const {error}=await supabase.from('edifici_permessi').insert(payload);
     if(error){alert('Errore assegnazione permessi a tutti gli edifici: '+error.message);return}
   }else{
     const {error}=await supabase.from('edifici_permessi').upsert(payload,{onConflict:'edificio_id,user_id'});
     if(error){alert('Errore assegnazione permessi edificio: '+error.message);return}
   }
   alert(buildingPerm.all_buildings?'Permessi salvati per tutti gli edifici.':'Permessi edificio salvati.');
   setBuildingPerm({user_id:'',edificio_id:'',all_buildings:false,can_update:true,can_delete:true});
 }
 const setField=(name:string,value:any)=>setEntity((p:any)=>({...p,[name]:value}));
 const roleText=(u:any)=>u.roles?.length?u.roles.map((r:any)=>r.ruolo+' — '+(r.ente||'')).join(' | '):'Nessun ruolo';
 return <PageHead title="Amministrazione" subtitle="Configurazione del sistema, classificazione delle richieste, gestione degli accessi e tracciamento delle attività.">
   <div className="admin-section-nav"><button onClick={()=>document.getElementById('admin-dashboard')?.scrollIntoView({behavior:'smooth',block:'start'})}>Configurazione dashboard</button><button onClick={()=>document.getElementById('admin-ambiti')?.scrollIntoView({behavior:'smooth',block:'start'})}>Ambiti richieste</button><button onClick={()=>document.getElementById('admin-accessi')?.scrollIntoView({behavior:'smooth',block:'start'})}>Utenti, ruoli e permessi</button><button onClick={()=>document.getElementById('admin-audit')?.scrollIntoView({behavior:'smooth',block:'start'})}>Registro modifiche</button></div>
   <section id="admin-dashboard" className="admin-section-group"><div className="admin-section-header"><div><span className="eyebrow">1 · Configurazione</span><h2>Configurazione dashboard</h2><p>Ordina e abilita le dashboard visualizzate nella Home dell'ente.</p></div><BarChart3 size={22}/></div><DashboardConfig access={access}/></section>
   <section id="admin-ambiti" className="admin-section-group"><div className="admin-section-header"><div><span className="eyebrow">2 · Classificazione</span><h2>Ambiti delle richieste di intervento</h2><p>Gestisci le categorie utilizzabili per classificare le segnalazioni degli istituti.</p></div><SlidersHorizontal size={22}/></div><div className="card request-domain-admin"><div className="card-head"><div><h2>Ambiti delle richieste di intervento</h2><p>Gestisci le categorie utilizzabili nella classificazione delle richieste.</p></div><SlidersHorizontal size={20}/></div>{superadmin&&<form className="domain-form" onSubmit={saveRequestDomain}><input placeholder="CODICE_INTERNO" value={domainForm.codice} onChange={e=>setDomainForm({...domainForm,codice:e.target.value})}/><input placeholder="Denominazione dell’ambito" value={domainForm.denominazione} onChange={e=>setDomainForm({...domainForm,denominazione:e.target.value})}/><label className="checkbox-label"><input type="checkbox" checked={domainForm.attivo} onChange={e=>setDomainForm({...domainForm,attivo:e.target.checked})}/> Attivo</label><button className="btn primary"><Plus size={15}/>{domainForm.id?'Salva modifica':'Aggiungi ambito'}</button>{domainForm.id&&<button type="button" className="btn secondary" onClick={()=>setDomainForm({id:'',codice:'',denominazione:'',attivo:true})}>Annulla</button>}</form>}{domainMessage&&<div className="notice success">{domainMessage}</div>}<div className="domain-list">{requestDomains.map(x=><div className={'domain-row '+(!x.attivo?'disabled':'')} key={x.id}><div><b>{x.codice}</b><span>{x.denominazione}</span></div><span className={'badge '+(x.attivo?'green':'gray')}>{x.attivo?'Attivo':'Disattivo'}</span>{superadmin&&<div className="row-actions"><button className="icon-btn dark-icon" onClick={()=>setDomainForm({id:x.id,codice:x.codice,denominazione:x.denominazione,attivo:x.attivo})}><Pencil size={15}/></button>{x.attivo&&<button className="icon-btn dark-icon" onClick={()=>deleteRequestDomain(x)}><Trash2 size={15}/></button>}</div>}</div>)}</div></div></section>
   <section id="admin-accessi" className="admin-section-group"><div className="admin-section-header"><div><span className="eyebrow">3 · Gestione accessi</span><h2>Anagrafica ente, utenti, ruoli e permessi</h2><p>Gestisci l'anagrafica dell'ente e le autorizzazioni degli utenti applicativi.</p></div><ShieldCheck size={22}/></div><div className="admin-subnav">
    <button className="admin-subnav-item" onClick={()=>document.getElementById('admin-ente')?.scrollIntoView({behavior:'smooth',block:'start'})}><Building2 size={16}/> Anagrafica ente</button>
    <button className="admin-subnav-item" onClick={()=>document.getElementById('admin-utenti')?.scrollIntoView({behavior:'smooth',block:'start'})}><UserCog size={16}/> Utenti</button><button className="admin-subnav-item" onClick={()=>document.getElementById('admin-ruoli')?.scrollIntoView({behavior:'smooth',block:'start'})}><ShieldCheck size={16}/> Ruoli</button>
    <button className="admin-subnav-item" onClick={()=>document.getElementById('admin-permessi')?.scrollIntoView({behavior:'smooth',block:'start'})}><Settings size={16}/> Permessi</button>
    <button className="admin-subnav-item" onClick={()=>document.getElementById('admin-audit')?.scrollIntoView({behavior:'smooth',block:'start'})}><History size={16}/> Registro modifiche</button>
   </div>
   <div className="content-grid">
    <section className="card"><div className="card-head"><div><h2>Accesso corrente</h2><p>Autorizzazioni applicate dal database tramite RLS.</p></div><ShieldCheck size={20}/></div>{access.length?<table><thead><tr><th>Ente</th><th>Ruolo</th></tr></thead><tbody>{access.map((x,i)=><tr key={i}><td>{x.ente}</td><td><span className="badge blue">{x.ruolo}</span></td></tr>)}</tbody></table>:<div className="notice warning"><CircleAlert size={18}/> Nessun ruolo associato.</div>}</section>
    {manage&&<section id="admin-ente" className="card"><div className="card-head"><div><h2>Anagrafica ente</h2><p>Dati identificativi e recapiti dell'ente associato.</p></div><Building2 size={20}/></div><form className="form-grid" onSubmit={saveEntity}><label className="span-2">Denominazione<input value={entity.denominazione} onChange={e=>setField('denominazione',e.target.value)} required/></label><label>Codice IPA<input value={entity.codice_ipa||''} onChange={e=>setField('codice_ipa',e.target.value)}/></label><label>Codice fiscale<input value={entity.codice_fiscale||''} onChange={e=>setField('codice_fiscale',e.target.value)}/></label><label>Tipo ente<input value={entity.tipo_ente||''} onChange={e=>setField('tipo_ente',e.target.value)}/></label><label>PEC<input type="email" value={entity.pec||''} onChange={e=>setField('pec',e.target.value)}/></label><label>E-mail<input type="email" value={entity.email||''} onChange={e=>setField('email',e.target.value)}/></label><label>Telefono<input value={entity.telefono||''} onChange={e=>setField('telefono',e.target.value)}/></label><label className="checkbox-label"><input type="checkbox" name="ente_attivo" checked={!!entity.attivo} onChange={e=>setField('attivo',e.target.checked)}/> Ente attivo</label><div className="form-actions span-2"><button className="btn primary" disabled={savingEntity}>{savingEntity?'Salvataggio…':'Salva anagrafica ente'}</button></div>{entityMessage&&<div className={'notice '+(entityMessageType==='success'?'success':'warning')}>{entityMessage}</div>}</form></section>}
   </div>
   {manage&&<section id="admin-utenti" className="card">
    <div className="card-head"><div><h2>Utenti registrati</h2><p>Elenco degli utenti autenticati e dei rispettivi ruoli applicativi.</p></div><button className="btn primary" onClick={openNewUser}><Plus size={17}/> Nuovo utente</button></div>
    {userMessage&&<div className={'notice '+(userMessage.startsWith('Operazione non riuscita')||userMessage.startsWith('Elenco utenti non disponibile')?'warning':'success')}>{userMessage}</div>}
    {users.length?<table><thead><tr><th>Utente</th><th>E-mail</th><th>Ruolo / ente</th><th>Stato</th><th>Ultimo accesso</th><th>Azioni</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{[u.cognome,u.nome].filter(Boolean).join(' ')||'—'}</strong></td><td>{u.email||'—'}</td><td>{u.roles?.map((r:any,i:number)=><div key={i}><span className="badge blue">{r.ruolo}</span>{r.ente&&<span className="table-sub">{r.ente}</span>}</div>)||'—'}</td><td><span className={'badge '+(u.attivo?'green':'red')}>{u.attivo?'Attivo':'Disabilitato'}</span></td><td>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString('it-IT'):'Mai'}</td><td><div style={{display:'flex',gap:6}}><button className="icon-btn" title="Modifica utente" onClick={()=>openEditUser(u)}><Pencil size={16}/></button>{u.id!==access[0]?.user_id&&<button className="icon-btn" title="Elimina utente" onClick={()=>removeUser(u)}><Trash2 size={16}/></button>}</div></td></tr>)}</tbody></table>:<Empty title="Nessun utente registrato" text="Crea il primo utente applicativo."/>}
   </section>}
   {userModal&&<Modal title={editingUser?'Modifica utente':'Nuovo utente'} close={()=>{if(!userSaving){setUserModal(false);setEditingUser(null)}}}><form className="form-grid" onSubmit={saveUser}><label>Nome<input name="nome" defaultValue={editingUser?.nome||''}/></label><label>Cognome<input name="cognome" defaultValue={editingUser?.cognome||''}/></label><label className="span-2">E-mail<input name="email" type="email" defaultValue={editingUser?.email||''} required/></label><label>Telefono<input name="telefono" defaultValue={editingUser?.telefono||''}/></label><label>Password<input name="password" type="password" placeholder={editingUser?'Lascia vuoto per non modificarla':'Minimo 8 caratteri'} minLength={8} required={!editingUser}/></label><label>Ente<select name="ente_id" defaultValue={editingUser?.ente_id||currentEnteId} required>{entities.map(e=><option key={e.id} value={e.id}>{e.denominazione}</option>)}</select></label><label>Ruolo<select name="ruolo" defaultValue={editingUser?.ruolo||'tecnico'}>{(superadmin?['superadmin',...managedRoles]:managedRoles).map(r=><option key={r}>{r}</option>)}</select></label><label className="checkbox-label span-2"><input name="attivo" type="checkbox" defaultChecked={editingUser?editingUser.attivo!==false:true}/> Utente attivo</label><div className="form-actions span-2"><button type="button" className="btn secondary" disabled={userSaving} onClick={()=>{setUserModal(false);setEditingUser(null)}}>Annulla</button><button className="btn primary" disabled={userSaving}>{userSaving?'Salvataggio…':editingUser?'Salva modifiche':'Crea utente'}</button></div></form></Modal>}
   {manage&&<section id="admin-ruoli" className="card"><div className="card-head"><div><h2>Assegna ruolo</h2><p>Disponibile a superadmin e amministratori dell’ente.</p></div><Settings size={20}/></div><form className="form-grid" onSubmit={assign}><label className="span-2">Utente<select value={form.user_id} onChange={e=>setForm({...form,user_id:e.target.value})} required><option value="">Seleziona…</option>{users.map(u=><option key={u.id} value={u.id}>{[u.cognome,u.nome].filter(Boolean).join(' ')} — {u.email||u.id}</option>)}</select></label><label>Ente<select value={form.ente_id} onChange={e=>setForm({...form,ente_id:e.target.value})} required><option value="">Seleziona…</option>{entities.map(e=><option key={e.id} value={e.id}>{e.denominazione}</option>)}</select></label><label>Ruolo<select value={form.ruolo} onChange={e=>setForm({...form,ruolo:e.target.value})}>{(superadmin?['superadmin',...managedRoles]:managedRoles).map(r=><option key={r}>{r}</option>)}</select></label><div className="form-actions span-2"><button className="btn primary">Salva ruolo</button></div></form></section>}
   {manage&&<section id="admin-permessi" className="card"><div className="card-head"><div><h2>Permessi edifici</h2><p>Il superadmin o l'amministratore dell'ente può autorizzare un utente a modificare e/o eliminare specifici edifici.</p></div><Building2 size={20}/></div><form className="form-grid" onSubmit={saveBuildingPermission}><label className="span-2">Utente<select value={buildingPerm.user_id} onChange={e=>setBuildingPerm({...buildingPerm,user_id:e.target.value})} required><option value="">Seleziona…</option>{users.map(u=><option key={u.id} value={u.id}>{[u.cognome,u.nome].filter(Boolean).join(' ')} — {u.email||u.id}</option>)}</select></label><label className="span-2">Edificio<select value={buildingPerm.all_buildings?'ALL':buildingPerm.edificio_id} onChange={e=>{const all=e.target.value==='ALL';setBuildingPerm({...buildingPerm,all_buildings:all,edificio_id:all?'':e.target.value})}}><option value="">Seleziona un edificio…</option><option value="ALL">TUTTI GLI EDIFICI</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.codice_edificio} — {b.denominazione}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={buildingPerm.can_update} onChange={e=>setBuildingPerm({...buildingPerm,can_update:e.target.checked})}/> Può modificare</label><label className="checkbox-label"><input type="checkbox" checked={buildingPerm.can_delete} onChange={e=>setBuildingPerm({...buildingPerm,can_delete:e.target.checked})}/> Può eliminare</label><div className="form-actions span-2"><button className="btn primary">Salva permessi edificio</button></div></form></section>}
   <section className="card">
    <div className="card-head"><div><h2>Privilegi utenti</h2><p>Per impostazione predefinita ogni utente registrato dell'ente può operare sui dati. Un record qui presente personalizza i privilegi.</p></div><UserCog size={20}/></div>
    <form className="form-grid" onSubmit={savePermissions}>
      <label className="span-2">Utente<select value={selectedPermUser} onChange={e=>selectPermissionUser(e.target.value)}><option value="">Seleziona utente…</option>{users.map(u=><option key={u.id} value={u.id}>{[u.cognome,u.nome].filter(Boolean).join(' ')||'Utente'} — {u.email}</option>)}</select></label>
      <label className="permission-check"><input type="checkbox" checked={permForm.can_view} onChange={e=>setPermForm({...permForm,can_view:e.target.checked})}/> Visualizzare</label>
      <label className="permission-check"><input type="checkbox" checked={permForm.can_create} onChange={e=>setPermForm({...permForm,can_create:e.target.checked})}/> Inserire</label>
      <label className="permission-check"><input type="checkbox" checked={permForm.can_update} onChange={e=>setPermForm({...permForm,can_update:e.target.checked})}/> Modificare</label>
      <label className="permission-check"><input type="checkbox" checked={permForm.can_delete} onChange={e=>setPermForm({...permForm,can_delete:e.target.checked})}/> Eliminare</label>
      <label className="permission-check"><input type="checkbox" checked={permForm.can_documents} onChange={e=>setPermForm({...permForm,can_documents:e.target.checked})}/> Gestire allegati</label>
      <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={resetPermissions} disabled={!selectedPermUser}><RotateCcw size={16}/> Ripristina default</button><button className="btn primary" disabled={!selectedPermUser}><Save size={16}/> Salva privilegi</button></div>
    </form>
    {permRows.length?<div className="permission-summary">{permRows.map(p=><div key={p.id}><strong>{users.find(u=>u.id===p.user_id)?.email||p.user_id}</strong><span>{p.can_view?'Lettura':'—'} · {p.can_create?'Inserimento':'—'} · {p.can_update?'Modifica':'—'} · {p.can_delete?'Eliminazione':'—'} · {p.can_documents?'Allegati':'—'}</span></div>)}</div>:<div className="muted">Nessuna personalizzazione: tutti gli utenti registrati dell'ente utilizzano i privilegi predefiniti.</div>}
   </section>
   <section className="card admin-oauth"><div className="card-head"><div><h2>Microsoft / Azure</h2><p>Provider OAuth configurabile in Supabase Auth.</p></div><ShieldCheck size={20}/></div><code>https://cuaxulqyrhosqbfaympv.supabase.co/auth/v1/callback</code></section>
   </section>
   <section id="admin-audit" className="admin-section-group"><div className="admin-section-header"><div><span className="eyebrow">4 · Controllo</span><h2>Registro modifiche</h2><p>Tracciamento delle ultime operazioni effettuate sul sistema.</p></div><History size={22}/></div><div className="card">
    <div className="card-head"><div><h2>Ultime 100 operazioni</h2><p>Modifiche registrate sull'intervento e sui relativi dati.</p></div><History size={20}/></div>
    {auditRows.length?<table><thead><tr><th>Data</th><th>Azione</th><th>Tabella</th><th>Record</th><th>Utente</th></tr></thead><tbody>{auditRows.map(x=><tr key={x.id}><td>{new Date(x.timestamp).toLocaleString('it-IT')}</td><td><span className="badge blue">{x.azione}</span></td><td>{x.tabella}</td><td>{x.record_id||'—'}</td><td>{users.find(u=>u.id===x.user_id)?.email||x.user_id||'Sistema'}</td></tr>)}</tbody></table>:<Empty title="Nessuna modifica registrata" text="Le modifiche future verranno tracciate automaticamente."/>}
   </div></section>
 </PageHead>
}
function MaintenancePage({access,refresh,setRefresh}:{access:Access[];refresh:number;setRefresh:(x:number)=>void}){
 const [buildings,setBuildings]=useState<Building[]>([]);
 const [selectedBuilding,setSelectedBuilding]=useState<string>('');
 const [systems,setSystems]=useState<MaintenanceSystem[]>([]);
 const [events,setEvents]=useState<MaintenanceEvent[]>([]);
 const [q,setQ]=useState('');
 const [showSystem,setShowSystem]=useState(false);
 const [editingSystem,setEditingSystem]=useState<MaintenanceSystem|null>(null);
 const [showEvent,setShowEvent]=useState(false);
 const [message,setMessage]=useState('');
 const write=canWrite(access);
 const enteId=access[0]?.ente_id;
 const systemLabels:{key:MaintenanceSystem['tipo'];label:string;description:string}[]=[
  {key:'elettrico',label:'Impianto elettrico',description:'Quadri, distribuzione, illuminazione e verifiche elettriche'},
  {key:'idraulico',label:'Impianto idraulico',description:'Adduzione, scarichi, sanitari e reti idriche'},
  {key:'antincendio',label:'Impianto antincendio',description:'Rivelazione, allarme, estintori, idranti e verifiche'},
  {key:'elevatore',label:'Impianto elevatore',description:'Ascensori, piattaforme e manutenzione periodica'}
 ];
 const load=async()=>{
  if(!enteId)return;
  const b=await supabase.from('edifici').select('id,codice_edificio,denominazione,indirizzo,comune,provincia,cap,superficie,volume,anno_costruzione,tipologia_scolastica,centro_di_costo').order('denominazione');
  if(b.error){setMessage('Errore caricamento edifici: '+b.error.message);return}
  const bs=(b.data||[]) as Building[];setBuildings(bs);
  const current=selectedBuilding||bs[0]?.id||'';if(current&&!selectedBuilding)setSelectedBuilding(current);
  if(!current){setSystems([]);setEvents([]);return}
  const [s,e]=await Promise.all([
   supabase.from('impianti_manutentivi').select('*').eq('edificio_id',current).order('tipo'),
   supabase.from('manutenzioni').select('*').eq('edificio_id',current).order('data_programmata',{ascending:false})
  ]);
  if(s.error)setMessage('Errore caricamento impianti: '+s.error.message);else setSystems((s.data||[]) as MaintenanceSystem[]);
  if(e.error)setMessage('Errore caricamento manutenzioni: '+e.error.message);else setEvents((e.data||[]) as MaintenanceEvent[]);
 };
 useEffect(()=>{void load()},[refresh,enteId,selectedBuilding]);
 const filteredBuildings=buildings.filter(b=>(b.codice_edificio+' '+b.denominazione+' '+(b.comune||'')).toLowerCase().includes(q.toLowerCase()));
 const currentBuilding=buildings.find(b=>b.id===selectedBuilding);
 const getSystem=(tipo:MaintenanceSystem['tipo'])=>systems.find(s=>s.tipo===tipo);
 const dueCount=systems.filter(s=>s.data_prossima_manutenzione&&new Date(s.data_prossima_manutenzione+'T23:59:59')<new Date()).length;
 const saveSystem=async(e:any)=>{
  e.preventDefault();if(!enteId||!selectedBuilding)return;
  const f=new FormData(e.currentTarget);
  const tipo=String(f.get('tipo')) as MaintenanceSystem['tipo'];
  const payload={
   ente_id:enteId,edificio_id:selectedBuilding,tipo,denominazione:String(f.get('denominazione')||'').trim(),
   codice:String(f.get('codice')||'').trim()||null,ubicazione:String(f.get('ubicazione')||'').trim()||null,
   marca_modello:String(f.get('marca_modello')||'').trim()||null,matricola:String(f.get('matricola')||'').trim()||null,
   anno_installazione:Number(f.get('anno_installazione')||0)||null,stato:String(f.get('stato')||'attivo'),
   data_ultima_manutenzione:f.get('data_ultima')||null,data_prossima_manutenzione:f.get('data_prossima')||null,
   periodicita_mesi:Number(f.get('periodicita')||0)||null,ditta_manutentrice:String(f.get('ditta')||'').trim()||null,
   referente:String(f.get('referente')||'').trim()||null,numero_rapporto:String(f.get('rapporto')||'').trim()||null,
   conformita:f.get('conformita')==='on',note:String(f.get('note')||'').trim()||null
  };
  const result=editingSystem?await supabase.from('impianti_manutentivi').update(payload).eq('id',editingSystem.id):await supabase.from('impianti_manutentivi').insert({...payload,created_by:access[0]?.user_id});
  if(result.error){setMessage('Salvataggio impianto non riuscito: '+result.error.message);return}
  setMessage(editingSystem?'Impianto modificato correttamente.':'Impianto inserito correttamente.');setShowSystem(false);setEditingSystem(null);setRefresh(refresh+1);
 };
 const removeSystem=async(s:MaintenanceSystem)=>{
  if(!confirm('Eliminare la scheda dell\'impianto "'+s.denominazione+'"?'))return;
  const {error}=await supabase.from('impianti_manutentivi').delete().eq('id',s.id);
  if(error)setMessage('Eliminazione non riuscita: '+error.message);else{setMessage('Scheda impianto eliminata.');setRefresh(refresh+1)}
 };
 const saveEvent=async(e:any)=>{
  e.preventDefault();if(!enteId||!selectedBuilding)return;
  const f=new FormData(e.currentTarget);
  const {error}=await supabase.from('manutenzioni').insert({
   ente_id:enteId,edificio_id:selectedBuilding,impianto_id:String(f.get('impianto')||'')||null,
   tipo:f.get('tipo'),stato:f.get('stato'),data_richiesta:f.get('data_richiesta')||undefined,
   data_programmata:f.get('data_programmata')||null,data_esecuzione:f.get('data_esecuzione')||null,
   descrizione:String(f.get('descrizione')||'').trim(),esito:String(f.get('esito')||'').trim()||null,
   costo_previsto:Number(f.get('costo_previsto')||0)||0,costo_consuntivo:Number(f.get('costo_consuntivo')||0)||0,
   operatore:String(f.get('operatore')||'').trim()||null,numero_rapporto:String(f.get('numero_rapporto')||'').trim()||null,
   note:String(f.get('note')||'').trim()||null,created_by:access[0]?.user_id
  });
  if(error){setMessage('Inserimento manutenzione non riuscito: '+error.message);return}
  setMessage('Manutenzione registrata correttamente.');setShowEvent(false);setRefresh(refresh+1);
 };
 return <PageHead title="Manutenzioni" subtitle="Gestione tecnica e manutentiva degli impianti di ciascun edificio.">
  <div className="page-actions">
   <div className="search"><Search size={17}/><input placeholder="Cerca edificio…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   {write&&<button className="btn primary" disabled={!selectedBuilding} onClick={()=>setShowEvent(true)}><Plus size={17}/> Nuova manutenzione</button>}
  </div>
  {message&&<div className="notice success">{message}</div>}
  <section className="maintenance-layout">
   <aside className="card maintenance-buildings">
    <div className="card-head"><div><h2>Edifici</h2><p>Seleziona l'immobile da gestire</p></div><Building2 size={20}/></div>
    <div className="maintenance-building-list">
     {filteredBuildings.map(b=><button key={b.id} className={selectedBuilding===b.id?'selected':''} onClick={()=>setSelectedBuilding(b.id)}><b>{b.codice_edificio}</b><span>{b.denominazione}</span><small>{[b.comune,b.indirizzo].filter(Boolean).join(' · ')||'Località non indicata'}</small></button>)}
    </div>
   </aside>
   <div className="maintenance-workspace">
    <section className="card maintenance-summary">
     <div><span className="eyebrow">Edificio selezionato</span><h2>{currentBuilding?.denominazione||'Nessun edificio selezionato'}</h2><p>{currentBuilding?[currentBuilding.codice_edificio,currentBuilding.indirizzo,currentBuilding.comune].filter(Boolean).join(' · '):'Seleziona un edificio dall’elenco.'}</p></div>
     <div className="maintenance-summary-stats"><div><b>{systems.length}/4</b><span>impianti censiti</span></div><div><b>{dueCount}</b><span>scadenze superate</span></div><div><b>{events.length}</b><span>manutenzioni registrate</span></div></div>
    </section>
    <div className="maintenance-systems">
     {systemLabels.map(def=>{const s=getSystem(def.key);return <section className="card maintenance-system-card" key={def.key}>
      <div className="maintenance-system-head"><div><span className="eyebrow">{def.label}</span><h3>{s?.denominazione||'Non censito'}</h3><p>{def.description}</p></div><span className={'badge '+(s?.stato==='attivo'?'green':s?.stato==='fuori_servizio'?'red':'gray')}>{s?.stato?statusLabel(s.stato):'Da censire'}</span></div>
      <div className="maintenance-system-grid"><Info label="Matricola" value={s?.matricola}/><Info label="Ultima manutenzione" value={date(s?.data_ultima_manutenzione)}/><Info label="Prossima manutenzione" value={date(s?.data_prossima_manutenzione)}/><Info label="Ditta manutentrice" value={s?.ditta_manutentrice}/><Info label="Periodicità" value={s?.periodicita_mesi?(s.periodicita_mesi+' mesi'):null}/><Info label="Conformità" value={s?.conformita?'Dichiarata':'Da verificare'}/></div>
      <div className="maintenance-card-actions">{write&&<><button className="btn secondary" onClick={()=>{setEditingSystem(s||null);setShowSystem(true)}}>{s?<><Pencil size={15}/> Modifica</>:<><Plus size={15}/> Censisci impianto</>}</button>{s&&<button className="icon-btn" title="Elimina scheda" onClick={()=>removeSystem(s)}><Trash2 size={16}/></button>}</>}</div>
     </section>})}
    </div>
    <section className="card table-card">
     <div className="card-head"><div><h2>Registro manutenzioni</h2><p>Interventi ordinari, straordinari, verifiche ed emergenze dell'edificio.</p></div><Wrench size={20}/></div>
     {events.length?<table><thead><tr><th>Data</th><th>Impianto</th><th>Tipo</th><th>Stato</th><th>Descrizione</th><th>Operatore</th><th>Consuntivo</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{date(e.data_esecuzione||e.data_programmata||e.data_richiesta)}</td><td>{systems.find(s=>s.id===e.impianto_id)?.denominazione||'—'}</td><td>{statusLabel(e.tipo)}</td><td><span className={'badge '+(e.stato==='chiusa'?'green':e.stato==='annullata'?'red':e.stato==='in_corso'?'amber':'blue')}>{statusLabel(e.stato)}</span></td><td><b>{e.descrizione}</b>{e.esito&&<span className="table-sub">{e.esito}</span>}</td><td>{e.operatore||'—'}</td><td>{money(e.costo_consuntivo)}</td></tr>)}</tbody></table>:<Empty title="Nessuna manutenzione registrata" text="Registra il primo intervento manutentivo per l'edificio selezionato."/>}
    </section>
   </div>
  </section>
  {showSystem&&<Modal title={editingSystem?'Modifica impianto':'Censimento impianto'} close={()=>{setShowSystem(false);setEditingSystem(null)}}><MaintenanceSystemForm row={editingSystem} building={currentBuilding} labels={systemLabels} onCancel={()=>{setShowSystem(false);setEditingSystem(null)}} onSubmit={saveSystem}/></Modal>}
  {showEvent&&<Modal title="Nuova manutenzione" close={()=>setShowEvent(false)}><MaintenanceEventForm systems={systems} onCancel={()=>setShowEvent(false)} onSubmit={saveEvent}/></Modal>}
 </PageHead>
}

function MaintenanceSystemForm({row,building,labels,onCancel,onSubmit}:{row:MaintenanceSystem|null;building:Building|undefined;labels:{key:MaintenanceSystem['tipo'];label:string;description:string}[];onCancel:()=>void;onSubmit:(e:any)=>void}){
 const tipo=row?.tipo||labels[0].key;
 return <form className="form-grid" onSubmit={onSubmit}>
  <label>Impianto<select name="tipo" defaultValue={tipo}>{labels.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}</select></label>
  <label>Stato<select name="stato" defaultValue={row?.stato||'attivo'}><option value="attivo">Attivo</option><option value="fuori_servizio">Fuori servizio</option><option value="in_dismissione">In dismissione</option></select></label>
  <label className="span-2">Denominazione<input name="denominazione" defaultValue={row?.denominazione||labels.find(x=>x.key===tipo)?.label||''} required/></label>
  <label>Codice<input name="codice" defaultValue={row?.codice||''}/></label>
  <label>Ubicazione<input name="ubicazione" defaultValue={row?.ubicazione||''}/></label>
  <label>Marca / modello<input name="marca_modello" defaultValue={row?.marca_modello||''}/></label>
  <label>Matricola<input name="matricola" defaultValue={row?.matricola||''}/></label>
  <label>Anno installazione<input name="anno_installazione" type="number" min="1800" max="2200" defaultValue={row?.anno_installazione??''}/></label>
  <label>Ultima manutenzione<input name="data_ultima" type="date" defaultValue={row?.data_ultima_manutenzione||''}/></label>
  <label>Prossima manutenzione<input name="data_prossima" type="date" defaultValue={row?.data_prossima_manutenzione||''}/></label>
  <label>Periodicità (mesi)<input name="periodicita" type="number" min="1" max="120" defaultValue={row?.periodicita_mesi??''}/></label>
  <label>Ditta manutentrice<input name="ditta" defaultValue={row?.ditta_manutentrice||''}/></label>
  <label>Referente<input name="referente" defaultValue={row?.referente||''}/></label>
  <label>Numero rapporto<input name="rapporto" defaultValue={row?.numero_rapporto||''}/></label>
  <label className="permission-check"><input name="conformita" type="checkbox" defaultChecked={row?.conformita||false}/><span>Conformità documentale dichiarata</span></label>
  <label className="span-2">Note<textarea name="note" defaultValue={row?.note||''}/></label>
  <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onCancel}>Annulla</button><button className="btn primary">{row?'Salva modifiche':'Censisci impianto'}</button></div>
 </form>
}

function MaintenanceEventForm({systems,onCancel,onSubmit}:{systems:MaintenanceSystem[];onCancel:()=>void;onSubmit:(e:any)=>void}){
 return <form className="form-grid" onSubmit={onSubmit}>
  <label>Impianto<select name="impianto"><option value="">Generale edificio</option>{systems.map(s=><option value={s.id} key={s.id}>{s.denominazione}</option>)}</select></label>
  <label>Tipo<select name="tipo" defaultValue="ordinaria"><option value="ordinaria">Ordinaria</option><option value="straordinaria">Straordinaria</option><option value="verifica">Verifica</option><option value="emergenza">Emergenza</option></select></label>
  <label>Stato<select name="stato" defaultValue="programmata"><option value="programmata">Programmata</option><option value="aperta">Aperta</option><option value="in_corso">In corso</option><option value="chiusa">Chiusa</option><option value="annullata">Annullata</option></select></label>
  <label>Data richiesta<input name="data_richiesta" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label>
  <label>Data programmata<input name="data_programmata" type="date"/></label>
  <label>Data esecuzione<input name="data_esecuzione" type="date"/></label>
  <label className="span-2">Descrizione<input name="descrizione" required/></label>
  <label className="span-2">Esito<textarea name="esito"/></label>
  <label>Costo previsto<input name="costo_previsto" type="number" min="0" step=".01"/></label>
  <label>Costo consuntivo<input name="costo_consuntivo" type="number" min="0" step=".01"/></label>
  <label>Operatore / ditta<input name="operatore"/></label>
  <label>Numero rapporto<input name="numero_rapporto"/></label>
  <label className="span-2">Note<textarea name="note"/></label>
  <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onCancel}>Annulla</button><button className="btn primary">Registra manutenzione</button></div>
 </form>
}


function SimpleForm({fields,onCancel,onSubmit}:{fields:string[][];onCancel:()=>void;onSubmit:(e:any)=>void}){return <form className="form-grid" onSubmit={onSubmit}>{fields.map(([n,l])=><label key={n}>{l}<input name={n} type={n.includes('superficie')||n==='anno'?'number':'text'} required={n==='codice'||n==='denominazione'}/></label>)}<div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onCancel}>Annulla</button><button className="btn primary">Salva</button></div></form>}
function Info({label,value}:{label:string;value:any}){return <div className="info-row"><span>{label}</span><strong>{value===null||value===undefined||value===''?'—':String(value)}</strong></div>}
function Stat({icon,label,value,meta}:{icon:any;label:string;value:any;meta:string}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div></div>}
function Progress({label,value,total}:{label:string;value:number;total:number}){const pct=total?Math.round(value/total*100):0;return <div className="progress-item"><div><span>{label}</span><b>{value}</b></div><div className="progress-track"><i style={{width:pct+'%'}}/></div></div>}
function Empty({title,text}:{title:string;text:string}){return <div className="empty"><FolderOpen size={26}/><strong>{title}</strong><span>{text}</span></div>}
function Loader(){return <div className="loader"><span></span><span></span><span></span></div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={close}><X/></button></div>{children}</div></div>}
function PageHead({title,subtitle,children}:{title:string;subtitle:string;children:any}){return <><div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div></div>{children}</>}
function docType(mime:string){if(mime==='application/pdf')return 'altro';if(mime.startsWith('image/'))return 'foto';if(mime.includes('word')||mime.includes('sheet')||mime.includes('presentation'))return 'altro';return 'altro'}
