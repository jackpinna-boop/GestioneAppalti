-- Tipologie base impianti e dati temporali di verifica/manutenzione
alter table public.impianti_manutentivi
  add column if not exists data_installazione date,
  add column if not exists data_verifica date,
  add column if not exists data_collaudo date,
  add column if not exists data_ultimo_controllo_periodico date,
  add column if not exists data_prossimo_controllo_periodico date;

create unique index if not exists uq_tipologie_impianto_ente_codice
  on public.tipologie_impianto(ente_id,codice);

create unique index if not exists uq_attributi_tipologia_impianto_codice
  on public.attributi_tipologia_impianto(tipologia_id,codice);

insert into public.tipologie_impianto
  (ente_id,codice,denominazione,categoria,descrizione,attivo,ordinamento,gestione_manutenzione,gestione_scadenze,gestione_documenti,gestione_alert)
values
 ('00000000-0000-4000-8000-000000000001','TERMICO','Impianto termico','Climatizzazione','Impianti di produzione termica con gestione delle matricole INAIL.',true,10,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','FOTOVOLTAICO','Impianto fotovoltaico','Energia','Produzione elettrica da fonte fotovoltaica.',true,20,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','ACCUMULO','Sistemi di accumulo','Energia','Sistemi di accumulo dell energia elettrica.',true,30,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','CONDIZIONAMENTO_CLIMATIZZAZIONE','Condizionamento e Climatizzazione','Climatizzazione','Sistemi di condizionamento e climatizzazione aria-aria o aria-acqua.',true,40,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','ELETTRICO','Impianto elettrico','Elettrico','Impianti elettrici e relative utenze.',true,50,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','ANTINCENDIO_NASPI_IDRANTI','Impianti Antincendio - Naspi e idranti','Antincendio','Reti naspi e idranti antincendio.',true,60,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','ANTINCENDIO_GRUPPI_PRESSURIZZAZIONE','Impianti Antincendio - Gruppi di pressurizzazione','Antincendio','Gruppi di pressurizzazione antincendio.',true,70,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','ANTINCENDIO_SEGNALAZIONE_RILEVAZIONE','Impianti Antincendio - Sistemi di segnalazione e rilevazione','Antincendio','Sistemi di segnalazione e rilevazione incendi.',true,80,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','ANTINTRUSIONE','Impianto antintrusione','Sicurezza','Sistemi antintrusione.',true,90,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','VIDEOSORVEGLIANZA','Impianto videosorveglianza','Sicurezza','Sistemi di videosorveglianza.',true,100,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','CONTROLLO_ACCESSI','Impianto controllo accessi','Sicurezza','Sistemi di controllo accessi.',true,110,true,true,true,true),
 ('00000000-0000-4000-8000-000000000001','GENERICO','Impianto generico','Altro','Tipologia libera per impianti non riconducibili alle categorie standard.',true,120,true,true,true,true)
on conflict (ente_id,codice) do update set
 denominazione=excluded.denominazione,categoria=excluded.categoria,descrizione=excluded.descrizione,
 attivo=true,ordinamento=excluded.ordinamento,gestione_manutenzione=true,gestione_scadenze=true,
 gestione_documenti=true,gestione_alert=true,updated_at=now();

with a(codice,denominazione,tipo,unita,opzioni,ordine,tipologia_codice) as (
 values
 ('POTENZA_INSTALLATA','Potenza installata','number','kW',null,10,'FOTOVOLTAICO'),
 ('POTENZA_PICCO','Potenza di picco','number','kWp',null,20,'FOTOVOLTAICO'),
 ('NUMERO_PANNELLI','Numero di pannelli','number','n.',null,30,'FOTOVOLTAICO'),
 ('SUPERFICIE_INSTALLATA','Superficie installata','number','m²',null,40,'FOTOVOLTAICO'),
 ('POTENZA_STOCCATA','Potenza stoccata / capacità','number','kWh',null,10,'ACCUMULO'),
 ('NUMERO_BATTERIE','Numero di batterie','number','n.',null,20,'ACCUMULO'),
 ('COP','COP','number',null,null,10,'CONDIZIONAMENTO_CLIMATIZZAZIONE'),
 ('EER','EER','number',null,null,20,'CONDIZIONAMENTO_CLIMATIZZAZIONE'),
 ('TIPOLOGIA','Tipologia','select',null,'["aria-aria","aria-acqua"]'::jsonb,30,'CONDIZIONAMENTO_CLIMATIZZAZIONE'),
 ('POTENZA','Potenza','number','kW',null,10,'ELETTRICO'),
 ('TIPOLOGIA','Tipologia','select',null,'["trifase","monofase"]'::jsonb,20,'ELETTRICO'),
 ('POD','POD','text',null,null,30,'ELETTRICO'),
 ('CODICE_UNIVOCO','Codice univoco','text',null,null,40,'ELETTRICO'),
 ('NUMERO_INSTALLAZIONI','Numero di installazioni','number','n.',null,10,'ANTINCENDIO_NASPI_IDRANTI'),
 ('TIPO_IMPIANTO','Tipo di impianto','text',null,null,10,'ANTINCENDIO_SEGNALAZIONE_RILEVAZIONE')
)
insert into public.attributi_tipologia_impianto
 (tipologia_id,codice,denominazione,tipo,unita,obbligatorio,ordine,opzioni,attivo)
select t.id,a.codice,a.denominazione,a.tipo,a.unita,false,a.ordine,a.opzioni,true
from a join public.tipologie_impianto t
  on t.codice=a.tipologia_codice
 and t.ente_id='00000000-0000-4000-8000-000000000001'::uuid
on conflict (tipologia_id,codice) do update set
 denominazione=excluded.denominazione,tipo=excluded.tipo,unita=excluded.unita,
 ordine=excluded.ordine,opzioni=excluded.opzioni,attivo=true,updated_at=now();
