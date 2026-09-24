import React, { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { CheckCircle2, CircleAlert, FileUp, Search, Upload, X } from 'lucide-react'
import { supabase } from './lib/supabase'

type Access = { user_id:string; ente_id:string; ruolo:string; ente:string }

type Building = {
  id:string
  codice_edificio:string
  denominazione:string
  indirizzo:string|null
  comune:string|null
}

type SourceMap = {
  index:number
  source:string
  meaning:string
  target:string
  action:string
  confidence:'alta'|'media'|'bassa'
}

type ImportRow = {
  csvRow:number
  sourceId:string
  title:string
  buildingRaw:string
  buildingCodes:string[]
  buildingId:string|null
  buildingIds:string[]
  buildingMatch:'automatico'|'manuale'|'multi-edificio'|'non_trovato'
  buildingConfidence:number
  description:string
  sourceCode:string
  amount:number|null
  estimatedAmount:number|null
  sourceStatus:string
  status:string
  note:string
  cig:string
  cup:string
  operator:string
  financing:string
  programCode:string
  determinationDate:string|null
  type:string
  maintenanceType:string
  referenceYear:number|null
  plannedStart:string|null
  plannedEnd:string|null
  started:string
  legacyCode:string
  programStatus:string
  rawKey:string
  typologyId:string|null
  typologyLabel:string
  selected:boolean
  errors:string[]
  warnings:string[]
}

const clean=(v:any)=>String(v??'').trim()
const norm=(v:any)=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()

const parseEuro=(v:any)=>{
  const s=clean(v).replace(/€|\$|\s/g,'')
  if(!s)return null
  const normalized=s.replace(/\./g,'').replace(',','.')
  const n=Number(normalized)
  return Number.isFinite(n)?n:null
}

const parseDate=(v:any)=>{
  const s=clean(v)
  if(!s)return null
  const d=new Date(s)
  if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10)
  const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/)
  if(!m)return null
  let y=Number(m[3]); if(y<100)y+=2000
  return y+'-'+String(Number(m[2])).padStart(2,'0')+'-'+String(Number(m[1])).padStart(2,'0')
}

const parseYear=(v:any)=>{
  const n=Number(clean(v))
  return Number.isInteger(n)&&n>=2000&&n<=2100?n:null
}

const parseBuildingCodes=(v:string)=>{
  const matches=v.match(/(?:SCU_\d+|ED\d+)/gi)||[]
  return [...new Set(matches.map(x=>x.toUpperCase()))]
}

const canonicalBuildingCode=(code:string)=>{
  const c=code.toUpperCase()
  const m=c.match(/^ED(\d+)$/)
  return m?'EDI_'+m[1].padStart(3,'0'):c
}

const statusMap=(v:string)=>{
  const n=norm(v)
  if(n.includes('conclus'))return 'chiuso'
  if(n.includes('programmazione'))return 'programmato'
  if(n.includes('progettazione'))return 'progettazione'
  if(n.includes('aggiudicazione'))return 'affidamento'
  if(n.includes('contratto'))return 'contratto'
  if(n.includes('collaudo'))return 'collaudo'
  if(n.includes('consegna')||n.includes('esecuzione')||n.includes('corso'))return 'esecuzione'
  return 'programmato'
}

const typologyRules=[
  {needle:['antincendio','antincendi'],code:'ANT',label:'Adeguamento antincendio'},
  {needle:['sismico','sismica','sisma'],code:'SIS',label:'Adeguamento sismico'},
  {needle:['riqualificazione'],code:'RIQ',label:'Riqualificazione'},
  {needle:['messa in sicurezza','sicurezza'],code:'MS',label:'Messa in sicurezza'},
  {needle:['amianto'],code:'AMI',label:'Bonifica amianto'},
  {needle:['barriere architettoniche'],code:'BAR',label:'Abbattimento barriere architettoniche'},
  {needle:['efficientamento energetico','efficienza energetica'],code:'ENE',label:'Efficientamento energetico'},
  {needle:['demolizione e ricostruzione'],code:'DR',label:'Demolizione e ricostruzione'},
  {needle:['nuova costruzione','costruzione di una'],code:'NC',label:'Nuova costruzione'},
  {needle:['manutenzione straordinaria'],code:'MAN',label:'Manutenzione straordinaria'}
]

const interventionNature=(type:string):'SERVIZIO'|'LAVORO'=>{const n=norm(type);return n.includes('serviz')||n.includes('progett')||n.includes('accordo')?'SERVIZIO':'LAVORO'};
const SOURCE_MAP:SourceMap[]=[
  {index:0,source:'ID SharePoint',meaning:'Identificativo della riga sorgente',target:'tracciabilità import',action:'il codice gestionale viene generato automaticamente dal database',confidence:'alta'},
  {index:1,source:'Title',meaning:'Titolo sintetico',target:'interventi.titolo',action:'import diretto',confidence:'alta'},
  {index:2,source:'Edificio',meaning:'Edificio/i SharePoint; può contenere più sedi',target:'interventi.edificio_id',action:'match per codice; multi-edificio = verifica manuale',confidence:'alta'},
  {index:3,source:'nomeintervento',meaning:'Descrizione estesa dell’intervento',target:'interventi.descrizione',action:'import diretto',confidence:'alta'},
  {index:4,source:'codice (field_2)',meaning:'Codice legacy di classificazione',target:'tracciabilità import',action:'conservato nelle note, non usato come codice intervento',confidence:'media'},
  {index:5,source:'ImportoStanziato',meaning:'Importo stanziato',target:'interventi.importo_programmato',action:'conversione € italiana',confidence:'alta'},
  {index:6,source:'StatoProcedura',meaning:'Stato testuale SharePoint',target:'interventi.stato',action:'normalizzazione verso enum applicativo',confidence:'alta'},
  {index:7,source:'Note',meaning:'Note operative',target:'interventi.note',action:'import + tracciabilità sorgente',confidence:'alta'},
  {index:8,source:'CIG',meaning:'CIG',target:'procedure_affidamento.cig',action:'crea/aggiorna procedura di affidamento',confidence:'alta'},
  {index:9,source:'CUP',meaning:'CUP',target:'interventi.cup',action:'import diretto',confidence:'alta'},
  {index:10,source:'operatoreconomico',meaning:'Operatore economico in testo libero',target:'operatori_economici',action:'normalizzazione automatica in anagrafica',confidence:'alta'},
  {index:11,source:'Finanziamento',meaning:'Fonte di finanziamento',target:'fonti_finanziamento + finanziamenti_intervento',action:'associazione automatica alla fonte master',confidence:'alta'},
  {index:12,source:'Programma Triennale',meaning:'Numero/voce di programmazione',target:'programmazioni',action:'associazione automatica a programmazione annuale',confidence:'media'},
  {index:13,source:'DataDetermina',meaning:'Data della determina',target:'atti / procedura',action:'crea atto di tipo determina, senza inventare numero',confidence:'alta'},
  {index:14,source:'Tipologia di intervento',meaning:'Tipologia SharePoint',target:'tipologie_intervento',action:'match per descrizione + tipologia',confidence:'media'},
  {index:15,source:'Manutenzioni',meaning:'Natura manutentiva',target:'tipologie_intervento / classificazione',action:'supporto al mapping tipologico',confidence:'media'},
  {index:16,source:'ImportoStimato',meaning:'Importo stimato, presente solo in pochi record',target:'dato sorgente',action:'conservato nelle note; non sovrascrive importo programmato',confidence:'media'},
  {index:17,source:'AnnoDiRiferimento',meaning:'Annualità',target:'interventi.annualita_programmazione',action:'conversione anno; se assente viene proposta inferenza dalla data determina',confidence:'alta'},
  {index:18,source:'DataPrevistaInizio',meaning:'Data prevista inizio',target:'fasi_intervento',action:'trasferita nelle fasi come date previste',confidence:'media'},
  {index:19,source:'DataPrevistaFine',meaning:'Data prevista fine',target:'fasi_intervento',action:'trasferita nelle fasi come date previste',confidence:'media'},
  {index:20,source:'Avviati?',meaning:'Indicatore legacy avvio',target:'fasi_intervento',action:'non usato per determinare lo stato',confidence:'bassa'},
  {index:21,source:'Titolo visualizzato',meaning:'Valore duplicato/calcolato del titolo',target:'—',action:'non importato',confidence:'alta'},
  {index:22,source:'codice legacy (field_4)',meaning:'Codice numerico o contenuto incoerente',target:'tracciabilità import',action:'conservato solo se valorizzato',confidence:'bassa'},
  {index:23,source:'campo legacy 1.1.x',meaning:'Campo residuale SharePoint',target:'—',action:'non importato',confidence:'bassa'},
  {index:24,source:'stato legacy Inserito/Non previsto',meaning:'Campo residuale SharePoint',target:'—',action:'non importato',confidence:'bassa'},
  {index:25,source:'chiave calcolata',meaning:'Chiave tecnica SharePoint',target:'—',action:'non importata',confidence:'alta'}
]

function buildNote(r:ImportRow){
  const lines=[
    r.note,
    '--- Importazione SharePoint ---',
    'ID sorgente: '+r.sourceId,
    'Codice origine: '+r.sourceCode,
    r.legacyCode?'Codice legacy: '+r.legacyCode:'',
    r.financing?'Finanziamento origine: '+r.financing:'',
    r.cig?'CIG origine: '+r.cig:'',
    r.operator?'Operatore economico origine: '+r.operator:'',
    r.programCode?'Programma Triennale origine: '+r.programCode:'',
    r.determinationDate?'Data determina origine: '+r.determinationDate:'',
    r.estimatedAmount!==null?'Importo stimato origine: '+r.estimatedAmount.toLocaleString('it-IT',{style:'currency',currency:'EUR'}):'',
    r.type?'Tipologia SharePoint: '+r.type:'',
    r.maintenanceType?'Manutenzioni SharePoint: '+r.maintenanceType:'',
    r.plannedStart?'Data prevista inizio origine: '+r.plannedStart:'',
    r.plannedEnd?'Data prevista fine origine: '+r.plannedEnd:''
  ]
  return lines.filter(Boolean).join('\n')
}

function findTypology(description:string,type:string,maintenance:string,typologies:any[]){
  const hay=norm(description+' '+type+' '+maintenance)
  for(const rule of typologyRules){
    if(rule.needle.some(n=>hay.includes(norm(n)))){
      const match=typologies.find(t=>t.codice===rule.code)
      if(match)return {id:match.id,label:match.denominazione,confidence:'alta' as const}
    }
  }
  const direct=typologies.find(t=>norm(t.denominazione)===norm(type))
  if(direct)return {id:direct.id,label:direct.denominazione,confidence:'media' as const}
  return {id:null,label:'Da verificare',confidence:'bassa' as const}
}

function matchBuilding(codes:string[],title:string,raw:string,buildings:Building[]){
  if(codes.length>1){
    const ids=codes.map(code=>{
      const canonical=canonicalBuildingCode(code)
      return buildings.find(b=>b.codice_edificio.toUpperCase()===code)?.id || buildings.find(b=>b.codice_edificio.toUpperCase()===canonical)?.id || null
    })
    const missing=ids.some(x=>!x)
    return {id:null,ids:ids.filter(Boolean) as string[],state:'multi-edificio' as const,confidence:missing?0:100}
  }
  const code=codes[0]
  const canonical=canonicalBuildingCode(code||'')
  const exactRaw=buildings.find(b=>b.codice_edificio.toUpperCase()===code)
  if(exactRaw)return {id:exactRaw.id,ids:[exactRaw.id],state:'automatico' as const,confidence:100}
  const exact=buildings.find(b=>b.codice_edificio.toUpperCase()===canonical)
  if(exact)return {id:exact.id,ids:[exact.id],state:'automatico' as const,confidence:100}
  const titleNorm=norm(title)
  const rawNorm=norm(raw)
  const candidates=buildings.map(b=>{
    const hay=norm(b.denominazione+' '+(b.indirizzo||'')+' '+(b.comune||''))
    const tokens=titleNorm.split(' ').filter(x=>x.length>3)
    const hits=tokens.filter(t=>hay.includes(t)).length
    const rawHits=rawNorm.includes(norm(b.codice_edificio))?50:0
    return {b,score:Math.min(99,rawHits+Math.min(45,hits*8))}
  }).sort((a,b)=>b.score-a.score)
  const best=candidates[0]
  if(best&&best.score>=75)return {id:best.b.id,ids:[best.b.id],state:'automatico' as const,confidence:best.score}
  if(best&&best.score>=45)return {id:best.b.id,ids:[best.b.id],state:'manuale' as const,confidence:best.score}
  return {id:null,ids:[],state:'non_trovato' as const,confidence:0}
}

export default function ImportInterventiPage({access}:{access:Access[]}){
  const enteId=access.find(x=>x.ruolo==='superadmin')?.ente_id||access[0]?.ente_id||''
  const canManage=access.some(x=>['superadmin','admin_ente'].includes(x.ruolo))
  const inputRef=useRef<HTMLInputElement>(null)
  const [rows,setRows]=useState<ImportRow[]>([])
  const [buildings,setBuildings]=useState<Building[]>([])
  const [typologies,setTypologies]=useState<any[]>([])
  const [fileName,setFileName]=useState('')
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(false)
  const [search,setSearch]=useState('')
  const [onlyIssues,setOnlyIssues]=useState(false)
  const [showMap,setShowMap]=useState(false)
  const [expanded,setExpanded]=useState<number|null>(null)

  const stats=useMemo(()=>{
    const errors=rows.filter(r=>r.errors.length)
    const warnings=rows.filter(r=>!r.errors.length&&r.warnings.length)
    const ready=rows.filter(r=>r.selected&&r.errors.length===0)
    return {
      total:rows.length,
      ready:ready.length,
      errors:errors.length,
      warnings:warnings.length,
      automatic:rows.filter(r=>r.buildingMatch==='automatico').length,
      manual:rows.filter(r=>r.buildingMatch!=='automatico').length
    }
  },[rows])

  const visible=rows.filter(r=>{
    const q=norm(search)
    const hay=norm([r.sourceId,r.title,r.description,r.buildingRaw,r.cup,r.cig].join(' '))
    const issue=r.errors.length||r.warnings.length||r.buildingMatch!=='automatico'
    return (!q||hay.includes(q))&&(!onlyIssues||issue)
  })

  const loadReferences=async()=>{
    const [b,t]=await Promise.all([
      supabase.from('edifici').select('id,codice_edificio,denominazione,indirizzo,comune').eq('ente_id',enteId).order('denominazione'),
      supabase.from('tipologie_intervento').select('id,codice,denominazione,attivo').eq('attivo',true).order('codice')
    ])
    if(b.error)throw b.error
    if(t.error)throw t.error
    setBuildings((b.data||[]) as Building[])
    setTypologies(t.data||[])
    return {buildings:(b.data||[]) as Building[],typologies:t.data||[]}
  }

  const parseFile=async(file:File)=>{
    setLoading(true);setMessage('')
    try{
      const refs=await loadReferences()
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true})
      const ws=wb.Sheets[wb.SheetNames[0]]
      const matrix=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,defval:''})
      const records=matrix.filter((r:any[])=>{
        const id=clean(r?.[0])
        return /^\d+$/.test(id)&&r.length>=10
      })
      if(records.length===0)throw new Error('Nessun record SharePoint riconosciuto. Il file deve contenere le 26 colonne del CSV esportato.')
      const parsed:ImportRow[]=[]
      records.forEach((a:any[],idx)=>{
        const sourceId=clean(a[0])
        const title=clean(a[1])
        const buildingRaw=clean(a[2])
        const buildingCodes=parseBuildingCodes(buildingRaw)
        const description=clean(a[3])
        const sourceCode=clean(a[4])
        const amount=parseEuro(a[5])
        const sourceStatus=clean(a[6])
        const note=clean(a[7])
        const cig=clean(a[8])
        const cup=clean(a[9])
        const operator=clean(a[10])
        const financing=clean(a[11])
        const programCode=clean(a[12])
        const determinationDate=parseDate(a[13])
        const type=clean(a[14])
        const maintenanceType=clean(a[15])
        const estimatedAmount=parseEuro(a[16])
        const refYear=parseYear(a[17])|| (determinationDate?Number(determinationDate.slice(0,4)):null)
        const plannedStart=parseDate(a[18])
        const plannedEnd=parseDate(a[19])
        const started=clean(a[20])
        const legacyCode=clean(a[22])
        const programStatus=clean(a[24])
        const rawKey=clean(a[25])
        const bm=matchBuilding(buildingCodes,title,buildingRaw,refs.buildings)
        const tm=findTypology(description,type,maintenanceType,refs.typologies)
        const errors:string[]=[]
        const warnings:string[]=[]
        if(!title)errors.push('Titolo mancante.')
        if(!description)warnings.push('Descrizione mancante.')
        if(amount===null)warnings.push('Importo stanziato assente o non riconosciuto.')
        if(!buildingCodes.length)errors.push('Edificio sorgente non riconosciuto.')
        if(bm.state==='multi-edificio' && bm.confidence<100)errors.push('Uno o più edifici della riga multi-edificio non sono presenti nel gestionale.')
        if(bm.state==='non_trovato')errors.push('Edificio non presente nel gestionale: selezione manuale obbligatoria.')
        if(bm.state==='manuale')warnings.push('Abbinamento edificio solo per similarità: verificare.')
        if(!cup)warnings.push('CUP assente.')
        if(!cig&&sourceStatus.toLowerCase().includes('aggiudic'))warnings.push('CIG assente in una riga in fase di aggiudicazione.')
        if(!refYear)warnings.push('Annualità non disponibile.')
        if(tm.id===null)warnings.push('Tipologia applicativa da verificare.')
        if(plannedStart||plannedEnd)warnings.push('Date previste presenti: saranno trasferite nella gestione delle fasi in un passaggio dedicato.')
        if(operator)warnings.push('Operatore economico: verrà normalizzato nell’anagrafica; verificare ragione sociale e identificativo fiscale.')
        if(financing)warnings.push('Finanziamento: verrà associato alla fonte master; per JTF verrà creata la fonte master se assente.')
        if(cig)warnings.push('CIG presente: verrà associato alla procedura di affidamento; la tipologia della procedura resta da verificare se non presente nel CSV.')
        if(determinationDate)warnings.push('Data determina presente: verrà creato un atto di tipo determina; numero/protocollo restano da completare.')
        if(legacyCode&&legacyCode.length>12)warnings.push('Codice legacy incoerente: conservato solo nella tracciabilità.')
        parsed.push({
          csvRow:idx+1,sourceId,title,buildingRaw,buildingCodes,buildingId:bm.id,buildingIds:bm.ids,buildingMatch:bm.state,buildingConfidence:bm.confidence,
          description,sourceCode,amount,estimatedAmount,sourceStatus,status:statusMap(sourceStatus),note,cig,cup,operator,financing,programCode,
          determinationDate,type,maintenanceType,referenceYear:refYear,plannedStart,plannedEnd,started,legacyCode,programStatus,rawKey,
          typologyId:tm.id,typologyLabel:tm.label,selected:errors.length===0,errors,warnings
        })
      })
      setRows(parsed)
      setFileName(file.name)
      setMessage('Anteprima pronta: '+parsed.length+' record letti. Nessun dato di produzione è stato modificato.')
    }catch(e:any){
      setRows([])
      setMessage('Errore: '+(e?.message||String(e)))
    }finally{setLoading(false)}
  }

  const updateRow=(index:number,patch:Partial<ImportRow>)=>{
    setRows(prev=>prev.map((r,i)=>i===index?{...r,...patch}:r))
  }

  const updateBuilding=(index:number,id:string)=>{
    const b=buildings.find(x=>x.id===id)
    if(!b)return
    const r=rows[index]
    const errors=r.errors.filter(x=>!x.toLowerCase().includes('edificio'))
    updateRow(index,{buildingId:b.id,buildingIds:[b.id],buildingMatch:'manuale',buildingConfidence:100,errors,selected:errors.length===0})
  }

  const toggleSelected=(index:number)=>{
    const r=rows[index]
    if(r.errors.length)return
    updateRow(index,{selected:!r.selected})
  }

  const confirmImport=async()=>{
    const selected=rows.filter(r=>r.selected&&r.errors.length===0&&(r.buildingId||r.buildingIds.length))
    if(!selected.length){setMessage('Nessun record valido selezionato.');return}
    if(!window.confirm('Confermare la normalizzazione e importazione di '+selected.length+' interventi? Verranno create/collegate, quando documentate, procedura CIG, operatore economico, contratto, finanziamento, atto, programmazione e fasi.'))return
    setLoading(true);setMessage('')
    try{
      let created=0
      let normalizedProcedures=0
      let normalizedContracts=0
      let normalizedOperators=0
      let normalizedFinancing=0
      let normalizedActs=0
      let normalizedPhases=0
      const failures:string[]=[]

      for(const r of selected){
        try{
          const {data,error}=await supabase.rpc('import_intervento_sharepoint',{
            p_ente_id:enteId,
            p_data:{
              sourceId:r.sourceId,
              natura:interventionNature(r.type),
              buildingId:r.buildingId,
              buildingIds:r.buildingIds,
              title:r.title,
              description:r.description||null,
              typologyId:r.typologyId||null,
              cup:r.cup||null,
              amount:r.amount??0,
              status:r.status,
              sourceStatus:r.sourceStatus,
              note:r.note||'',
              sourceCode:r.sourceCode,
              legacyCode:r.legacyCode,
              cig:r.cig||null,
              operator:r.operator||null,
              financing:r.financing||null,
              programCode:r.programCode||null,
              determinationDate:r.determinationDate||null,
              type:r.type||null,
              referenceYear:r.referenceYear,
              plannedStart:r.plannedStart||null,
              plannedEnd:r.plannedEnd||null
            }
          })
          if(error)throw error
          const result:any=data||{}
          if(result.status==='existing')throw new Error('Record già presente per ID SharePoint '+r.sourceId)
          if(result.contract_id){
            const fix=await supabase.from('contratti').update({data_consegna:null}).eq('id',result.contract_id)
            if(fix.error)throw fix.error
          }
          created++
          if(result.procedura_id)normalizedProcedures++
          if(result.contratto_id)normalizedContracts++
          if(result.operatore_id)normalizedOperators++
          if(r.financing)normalizedFinancing++
          if(result.atto_id)normalizedActs++
          if(r.referenceYear||r.status==='progettazione'||['affidamento','contratto','esecuzione','fine_lavori','collaudo','chiuso'].includes(r.status))normalizedPhases++
        }catch(e:any){
          failures.push('ID SharePoint '+r.sourceId+': '+(e?.message||String(e)))
        }
      }

      if(failures.length){
        setMessage('Importazione parzialmente completata: '+created+' record importati e normalizzati; '+failures.length+' record non importati. '+failures.join(' | '))
        setRows(prev=>prev.map(r=>created>0&&selected.some(s=>s.sourceId===r.sourceId)?{...r,selected:false}:r))
      }else{
        setRows(prev=>prev.map(r=>selected.some(s=>s.sourceId===r.sourceId)?{...r,selected:false}:r))
        setMessage('Importazione e normalizzazione completate: '+created+' interventi; '+normalizedProcedures+' procedure CIG; '+normalizedContracts+' contratti; '+normalizedOperators+' operatori; '+normalizedFinancing+' associazioni finanziarie; '+normalizedActs+' atti; fasi aggiornate per '+normalizedPhases+' record.')
      }
    }catch(e:any){
      setMessage('Importazione annullata: '+(e?.message||String(e)))
    }finally{setLoading(false)}
  }

  if(!canManage)return <div className="notice warning"><CircleAlert size={18}/> Accesso riservato a superadmin e admin_ente.</div>

  return <PageHead title="Importazione interventi" subtitle="Import Manager per il CSV SharePoint: mappatura, anteprima, controllo errori e importazione atomica dei dati principali.">
    <section className="card">
      <div className="card-head">
        <div><h2>CSV SharePoint → Lavori e servizi</h2><p>Il file viene interpretato per posizione, perché l’export contiene una riga ListSchema e non una vera intestazione CSV.</p></div>
        <FileUp size={22}/>
      </div>
      <div className="import-toolbar">
        <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void parseFile(f);e.currentTarget.value=''}}/>
        <button className="btn primary" onClick={()=>inputRef.current?.click()} disabled={loading}><Upload size={16}/> Carica CSV</button>
        {rows.length>0&&<button className="btn secondary" onClick={()=>{setRows([]);setFileName('');setMessage('')}}><X size={16}/> Azzera anteprima</button>}
        {fileName&&<span className="import-file">{fileName}</span>}
      </div>
      {message&&<div className="notice info">{message}</div>}
    </section>

    {rows.length>0&&<>
      <section className="stats-grid">
        <div className="stat-card"><span>Record letti</span><strong>{stats.total}</strong><small>attesi: 52</small></div>
        <div className="stat-card"><span>Pronti</span><strong>{stats.ready}</strong><small>senza errori bloccanti</small></div>
        <div className="stat-card"><span>Errori</span><strong>{stats.errors}</strong><small>bloccanti</small></div>
        <div className="stat-card"><span>Avvisi</span><strong>{stats.warnings}</strong><small>richiedono controllo</small></div>
      </section>

      <section className="card">
        <div className="card-head">
          <div><h2>Mappatura delle 26 colonne</h2><p>Le colonne residuali SharePoint non vengono forzate nella struttura relazionale.</p></div>
          <button className="btn secondary" onClick={()=>setShowMap(!showMap)}>{showMap?'Nascondi mappa':'Mostra mappa'}</button>
        </div>
        {showMap&&<div className="import-map-grid">{SOURCE_MAP.map(m=><div className="import-map-row" key={m.index}><b>{m.index+1}. {m.source}</b><span>{m.meaning}</span><span>{m.target}</span><small className={'map-confidence '+m.confidence}>{m.confidence}</small><em>{m.action}</em></div>)}</div>}
      </section>

      <section className="card">
        <div className="card-head"><div><h2>Anteprima e controllo errori</h2><p>Le righe bloccate non possono essere selezionate fino alla correzione.</p></div><Search size={20}/></div>
        <div className="import-toolbar">
          <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca ID, titolo, edificio, CUP o CIG"/>
          <label className="check-inline"><input type="checkbox" checked={onlyIssues} onChange={e=>setOnlyIssues(e.target.checked)}/> Solo anomalie</label>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Riga</th><th>Intervento</th><th>Edificio</th><th>Importo</th><th>Stato</th><th>Tipologia</th><th>Controlli</th><th>Importa</th></tr></thead><tbody>
          {visible.map(r=>{
            const idx=rows.indexOf(r)
            const b=buildings.find(x=>x.id===r.buildingId)
            return <React.Fragment key={r.sourceId}>
              <tr>
                <td><strong>{r.sourceId}</strong><br/><small>CSV {r.csvRow}</small></td>
                <td><strong>{r.title||'—'}</strong><br/><small>{r.description.slice(0,120)}{r.description.length>120?'…':''}</small></td>
                <td>
                  {r.buildingMatch==='multi-edificio' ? <div className="multi-building-list">
                    {r.buildingCodes.map(code=>{
                      const canonical=canonicalBuildingCode(code)
                      const matched=buildings.find(x=>x.codice_edificio.toUpperCase()===code)||buildings.find(x=>x.codice_edificio.toUpperCase()===canonical)
                      return <label className="check-inline" key={code}><input type="checkbox" checked={!!matched&&r.buildingIds.includes(matched.id)} disabled={!matched}/>{code} · {matched?.denominazione||'non trovato'}</label>
                    })}
                  </div> : <select value={r.buildingId||''} onChange={e=>updateBuilding(idx,e.target.value)}>
                    <option value="">— seleziona —</option>
                    {buildings.map(x=><option key={x.id} value={x.id}>{x.codice_edificio} · {x.denominazione}</option>)}
                  </select>}
                  <small>{r.buildingMatch==='multi-edificio' ? r.buildingIds.length+' edifici associati' : (b?.codice_edificio||'nessun abbinamento')+' · '+r.buildingConfidence+'%'}</small>
                </td>
                <td>{r.amount===null?'—':r.amount.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</td>
                <td><span className="badge">{r.status}</span><br/><small>{r.sourceStatus}</small></td>
                <td>{r.typologyLabel}</td>
                <td>
                  {r.errors.length?<span className="badge red">Bloccato</span>:r.warnings.length?<span className="badge amber">Verifica</span>:<span className="badge green">OK</span>}
                  <button className="text-btn" onClick={()=>setExpanded(expanded===idx?null:idx)}>{expanded===idx?'Nascondi':'Dettagli'}</button>
                </td>
                <td><input type="checkbox" checked={r.selected} disabled={r.errors.length>0} onChange={()=>toggleSelected(idx)}/></td>
              </tr>
              {expanded===idx&&<tr><td colSpan={8}><div className="import-row-detail">
                <div><strong>Controlli</strong>{r.errors.map((x,i)=><p className="danger-text" key={'e'+i}>• {x}</p>)}{r.warnings.map((x,i)=><p className="warning-text" key={'w'+i}>• {x}</p>)}{!r.errors.length&&!r.warnings.length&&<p>Nessuna anomalia.</p>}</div>
                <div><strong>Dati non ancora normalizzati</strong><p>CIG: {r.cig||'—'}</p><p>Operatore: {r.operator||'—'}</p><p>Finanziamento: {r.financing||'—'}</p><p>Data determina: {r.determinationDate||'—'}</p><p>Data prevista: {r.plannedStart||'—'} → {r.plannedEnd||'—'}</p></div>
              </div></td></tr>}
            </React.Fragment>
          })}
        </tbody></table></div>
        <div className="page-actions">
          <span className="import-selection-note">Selezionati: <strong>{stats.ready}</strong> · automatici: {stats.automatic} · da verificare/manuali: {stats.manual}</span>
          <button className="btn primary" onClick={()=>void confirmImport()} disabled={loading||stats.ready===0}><CheckCircle2 size={16}/> Conferma importazione ({stats.ready})</button>
        </div>
      </section>
    </>}
  </PageHead>
}

function PageHead({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){
  return <div className="page-content"><div className="page-head"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></div>{children}</div>
}
