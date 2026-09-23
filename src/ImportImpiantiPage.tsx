import React, { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { CheckCircle2, CircleAlert, Download, FileUp, RefreshCw, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { supabase } from './lib/supabase'

type Access={user_id:string;ente_id:string;ruolo:string;ente:string}
type Building={id:string;codice_edificio:string;denominazione:string;indirizzo:string|null;comune:string|null}
type ImportRow={
  id?:string; riga_csv:number; codice_scuola:string; denominazione_csv:string; indirizzo_csv:string;
  edificio_id:string|null; edificio_confidenza:number; edificio_match_stato:'automatico'|'da_verificare'|'manuale'|'non_trovato';
  matricola_inail:string; matricola_inail_vigente:string; matricola:string; potenza_kw:number|null;
  controllo_efficienza:string; sopra_116kw:boolean|null; ultima_verifica:string|null; prossima_verifica:string|null;
  link_pratica:string; stato_suggerito:'attivo'|'fuori_servizio'|'in_dismissione'; selezionato:boolean;
  errori:string[]; avvisi:string[]; raw_data:any;
}
const clean=(v:any)=>String(v??'').trim()
const norm=(v:any)=>clean(v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const num=(v:any)=>{const s=clean(v).replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return s&&Number.isFinite(n)?n:null}
const isoDate=(v:any)=>{const s=clean(v);if(!s)return null;const d=new Date(s);if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);const m=s.match(/^(\\d{1,2})[-/](\\d{1,2})[-/](\\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;return \`${y.toString().padStart(4,'0')}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}\`}return null}
const extractCode=(s:string)=>{const m=s.match(/^(SCU_\\d+|EDI_\\d+)/i);return m?m[1].toUpperCase():''}
const splitPower=(v:any)=>num(v)
function statusFromText(s:string):ImportRow['stato_suggerito']{const n=norm(s);if(n.includes('dismesso'))return 'in_dismissione';if(n.includes('chiuso'))return 'fuori_servizio';return 'attivo'}

function scoreBuilding(row:any,b:Building){
 const code=extractCode(row.codice_scuola)
 const bc=clean(b.codice_edificio).toUpperCase()
 let score=0
 if(code&&bc===code)score+=60
 const hay=norm((row.denominazione_csv||'')+' '+(row.indirizzo_csv||''))
 const bhay=norm((b.denominazione||'')+' '+(b.indirizzo||'')+' '+(b.comune||''))
 if(row.indirizzo_csv&&b.indirizzo&&norm(row.indirizzo_csv).includes(norm(b.indirizzo)))score+=20
 if(row.indirizzo_csv&&b.indirizzo&&norm(b.indirizzo).includes(norm(row.indirizzo_csv)))score+=15
 const tokens=norm(row.denominazione_csv).split(' ').filter((x:string)=>x.length>4)
 const hits=tokens.filter((x:string)=>bhay.includes(x)).length
 score+=Math.min(20,hits*5)
 if(row.codice_scuola&&hay.includes(norm(row.codice_scuola)))score+=5
 return Math.min(100,score)
}

export default function ImportImpiantiPage({access}:{access:Access[]}){
 const enteId=access.find(x=>x.ruolo==='superadmin')?.ente_id||access[0]?.ente_id||''
 const canManage=access.some(x=>['superadmin','admin_ente'].includes(x.ruolo))
 const inputRef=useRef<HTMLInputElement>(null)
 const [rows,setRows]=useState<ImportRow[]>([])
 const [buildings,setBuildings]=useState<Building[]>([])
 const [batchId,setBatchId]=useState<string|null>(null)
 const [fileName,setFileName]=useState('')
 const [message,setMessage]=useState('')
 const [loading,setLoading]=useState(false)
 const [search,setSearch]=useState('')
 const [onlyIssues,setOnlyIssues]=useState(false)
 const [saved,setSaved]=useState(false)

 const stats=useMemo(()=>{
   const errors=rows.filter(r=>r.errori.length>0)
   const warnings=rows.filter(r=>r.errori.length===0&&r.avvisi.length>0)
   const selected=rows.filter(r=>r.selezionato&&r.errori.length===0)
   return {total:rows.length,selected:selected.length,errors:errors.length,warnings:warnings.length,ok:selected.filter(r=>r.edificio_id).length}
 },[rows])

 const visible=rows.filter(r=>{
   const q=norm(search); const text=norm([r.codice_scuola,r.denominazione_csv,r.indirizzo_csv,r.matricola].join(' '))
   return (!q||text.includes(q))&&(!onlyIssues||(r.errori.length>0||r.avvisi.length>0||!r.edificio_id))
 })

 const loadBuildings=async()=>{
   const {data,error}=await supabase.from('edifici').select('id,codice_edificio,denominazione,indirizzo,comune').order('denominazione')
   if(error)throw error
   setBuildings((data||[]) as Building[])
   return (data||[]) as Building[]
 }

 const parseFile=async(file:File)=>{
   setLoading(true);setMessage('');setSaved(false)
   try{
     const buf=await file.arrayBuffer()
     const wb=XLSX.read(buf,{type:'array',cellDates:true})
     const ws=wb.Sheets[wb.SheetNames[0]]
     const matrix=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,defval:''})
     const headerIndex=matrix.findIndex((r:any[])=>r.some(x=>clean(x)==='Codice Scuola'))
     if(headerIndex<0)throw new Error('Intestazione "Codice Scuola" non trovata.')
     const headers=(matrix[headerIndex]||[]).map(x=>clean(x))
     const records=matrix.slice(headerIndex+1).filter((r:any[])=>r.some(x=>clean(x)))
     const bs=buildings.length?buildings:await loadBuildings()
     const parsed:ImportRow[]=[]
     records.forEach((arr:any[],idx)=>{
       const raw:any={};headers.forEach((h,i)=>raw[h]=arr[i])
       const get=(h:string)=>raw[h]
       const code=clean(get('Codice Scuola'))
       const desc=clean(get('Denominazione'))
       const address=clean(get('Indirizzo'))
       const matricole=['Matr.1','Matr.2','Matr.3'].map((k,i)=>({m:clean(get(k)),p:splitPower(get('PW Matr.'+(i+1)))})).filter(x=>x.m)
       const candidates=bs.map(b=>({b,s:scoreBuilding({codice_scuola:code,denominazione_csv:desc,indirizzo_csv:address},b)})).sort((a,b)=>b.s-a.s)
       const best=candidates[0]
       const second=candidates[1]
       matricole.forEach((m)=>{
         const errors:string[]=[];const avvisi:string[]=[]
         const conf=best?.s||0
         if(!best||conf<55)errors.push('Edificio non identificato con sufficiente certezza.')
         else if(conf<80||(second&&conf-second.s<10))avvisi.push('Abbinamento edificio da verificare.')
         if(!m.m)errors.push('Matricola mancante.')
         const next=isoDate(get('Prossima Verifica')); if(clean(get('Prossima Verifica'))&&!next)avvisi.push('Data prossima verifica non riconosciuta.')
         const last=isoDate(get('Ultima Verifica')); if(clean(get('Ultima Verifica'))&&!last)avvisi.push('Data ultima verifica non riconosciuta.')
         if(m.p===null)avvisi.push('Potenza non riconosciuta.')
         if(norm(get('controllo efficienza energetica')).includes('dismesso'))avvisi.push('Impianto indicato come dismesso.')
         parsed.push({
           riga_csv:idx+headerIndex+2,codice_scuola:code,denominazione_csv:desc,indirizzo_csv:address,
           edificio_id:best&&conf>=55?best.b.id:null,edificio_confidenza:conf,
           edificio_match_stato:!best||conf<55?'non_trovato':(conf>=80&&(!second||conf-second.s>=10)?'automatico':'da_verificare'),
           matricola_inail:clean(get('Matricola INAL')),matricola_inail_vigente:clean(get('Matr INAIL in VIGORE')),
           matricola:m.m,potenza_kw:m.p,controllo_efficienza:clean(get('controllo efficienza energetica')),
           sopra_116kw:clean(get('Sopra 116kW?'))?norm(get('Sopra 116kW?'))==='si'||norm(get('Sopra 116kW?'))==='yes':null,
           ultima_verifica:last,prossima_verifica:next,link_pratica:clean(get('Link Pratica')),
           stato_suggerito:statusFromText(get('controllo efficienza energetica')),selezionato:errors.length===0,
           errori:errors,avvisi:avvisi,raw_data:raw
         })
       })
     })
     setRows(parsed)
     const {data:batch,error}=await supabase.from('import_batch_impianti').insert({ente_id:enteId,tipo_import:'impianti_termici',nome_file:file.name,righe_csv:records.length,impianti_rilevati:parsed.length,importabili:parsed.filter(x=>x.errori.length===0).length,anomalie:parsed.filter(x=>x.errori.length||x.avvisi.length).length}).select('id').single()
     if(error)throw error
     setBatchId(batch.id)
     const {data:dups}=await supabase.from('impianti_manutentivi').select('matricola').eq('ente_id',enteId).not('matricola','is',null)
     const existing=new Set((dups||[]).map((x:any)=>clean(x.matricola).toLowerCase()))
     setRows(parsed.map(r=>existing.has(r.matricola.toLowerCase())?{...r,errori:[...r.errori,'Matricola già presente nel gestionale.'],selezionato:false}:r))
     setFileName(file.name)
     setMessage('Anteprima generata. Nessun impianto è stato importato.')
   }catch(e:any){setMessage('Errore: '+(e?.message||String(e)));setRows([]);setBatchId(null)}
   finally{setLoading(false)}
 }

 const updateRow=(idx:number,patch:Partial<ImportRow>)=>setRows(prev=>prev.map((r,i)=>i===idx?{...r,...patch}:r))
 const saveStaging=async()=>{
   if(!batchId)return
   setLoading(true);setMessage('')
   try{
     await supabase.from('import_righe_impianti').delete().eq('batch_id',batchId)
     const payload=rows.map(r=>({...r,batch_id:batchId,edificio_id:r.edificio_id||null,errori:r.errori,avvisi:r.avvisi}))
     const {error}=await supabase.from('import_righe_impianti').insert(payload)
     if(error)throw error
     await supabase.from('import_batch_impianti').update({importabili:stats.selected,anomalie:rows.filter(r=>r.errori.length||r.avvisi.length).length}).eq('id',batchId)
     setSaved(true);setMessage('Bozza salvata. I dati di produzione non sono stati modificati.')
   }catch(e:any){setMessage('Errore salvataggio bozza: '+e.message)}finally{setLoading(false)}
 }

 const confirmImport=async()=>{
   const selected=rows.filter(r=>r.selezionato&&r.errori.length===0&&r.edificio_id)
   if(!selected.length){setMessage('Non ci sono righe valide selezionate per l’importazione.');return}
   if(!window.confirm('Confermare l\'importazione di '+selected.length+' impianti termici? Questa operazione scriverà nei dati di produzione.'))return
   setLoading(true);setMessage('')
   try{
     if(!batchId)throw new Error('Batch di importazione non disponibile.')
     await saveStaging()
     const {data,error}=await supabase.rpc('import_impianti_termici_batch',{p_batch_id:batchId})
     if(error)throw error
     const count=Number(data||0)
     setRows(prev=>prev.map(r=>r.selezionato&&r.errori.length===0?{...r,selezionato:false}:r))
     setMessage('Importazione completata: '+count+' impianti termici inseriti in modo atomico.')
   }catch(e:any){setMessage('Importazione interrotta senza completare il batch: '+e.message)}finally{setLoading(false)}
 }

 if(!canManage)return <div className="notice warning"><CircleAlert size={18}/> Accesso riservato a superadmin e admin_ente.</div>
 return <PageHead title="Importazione impianti" subtitle="Import Manager: analisi, abbinamento edifici, validazione e importazione controllata.">
   <section className="card">
    <div className="card-head"><div><h2>Importa impianti termici</h2><p>Il file viene prima analizzato e validato. Nessun dato di produzione viene scritto automaticamente.</p></div><FileUp size={22}/></div>
    <div className="import-toolbar">
      <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void parseFile(f);e.currentTarget.value=''}}/>
      <button className="btn primary" onClick={()=>inputRef.current?.click()} disabled={loading}><Upload size={16}/> Carica CSV</button>
      {rows.length>0&&<><button className="btn secondary" onClick={()=>void saveStaging()} disabled={loading}><Save size={16}/> Salva bozza</button><button className="btn secondary" onClick={()=>setRows([])}><X size={16}/> Azzera anteprima</button></>}
      {fileName&&<span className="import-file">{fileName}</span>}
    </div>
    {message&&<div className="notice info">{message}</div>}
   </section>
   {rows.length>0&&<><section className="stats-grid">
      <div className="stat-card"><span>Impianti rilevati</span><strong>{stats.total}</strong><small>dal file</small></div>
      <div className="stat-card"><span>Selezionati</span><strong>{stats.selected}</strong><small>pronti all’import</small></div>
      <div className="stat-card"><span>Anomalie</span><strong>{stats.errors+stats.warnings}</strong><small>{stats.errors} bloccanti · {stats.warnings} avvisi</small></div>
      <div className="stat-card"><span>Abbinamenti automatici</span><strong>{rows.filter(r=>r.edificio_match_stato==='automatico').length}</strong><small>edificio</small></div>
    </section>
    <section className="card">
      <div className="card-head"><div><h2>Anteprima e validazione</h2><p>Correggi gli abbinamenti prima di confermare.</p></div><Search size={20}/></div>
      <div className="import-toolbar"><input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca scuola, edificio o matricola"/><label className="check-inline"><input type="checkbox" checked={onlyIssues} onChange={e=>setOnlyIssues(e.target.checked)}/> Solo anomalie</label></div>
      <div className="table-wrap"><table><thead><tr><th>CSV</th><th>Matricola</th><th>kW</th><th>Edificio</th><th>Conf.</th><th>Stato</th><th>Seleziona</th></tr></thead><tbody>
       {visible.map((r)=>{const idx=rows.indexOf(r);return <tr key={(r.id||'r')+idx}>
        <td><strong>{r.codice_scuola}</strong><br/><small>{r.indirizzo_csv}</small></td>
        <td>{r.matricola}<br/><small>{r.matricola_inail_vigente}</small></td>
        <td>{r.potenza_kw??'—'}</td>
        <td><select value={r.edificio_id||''} onChange={e=>{const b=buildings.find(x=>x.id===e.target.value);updateRow(idx,{edificio_id:b?.id||null,edificio_confidenza:b?100:0,edificio_match_stato:b?'manuale':'non_trovato',errori:b?r.errori.filter(x=>!x.startsWith('Edificio non identificato')):[...r.errori,'Edificio non identificato.']})}}><option value="">— seleziona —</option>{buildings.map(b=><option key={b.id} value={b.id}>{b.codice_edificio} · {b.denominazione}</option>)}</select></td>
        <td>{r.edificio_confidenza}%</td>
        <td>{r.errori.length?<span className="badge red">Bloccato</span>:r.avvisi.length?<span className="badge amber">Verifica</span>:<span className="badge green">OK</span>}<br/><small>{r.stato_suggerito}</small></td>
        <td><input type="checkbox" checked={r.selezionato} disabled={r.errori.length>0} onChange={e=>updateRow(idx,{selezionato:e.target.checked})}/></td>
       </tr>})}</tbody></table></div>
      <div className="page-actions"><button className="btn primary" onClick={()=>void confirmImport()} disabled={loading||stats.selected===0}><CheckCircle2 size={16}/> Conferma importazione ({stats.selected})</button></div>
    </section></>}
 </PageHead>
}

function PageHead({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){return <div className="page-content"><div className="page-head"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></div>{children}</div>}
