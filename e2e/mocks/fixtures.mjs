// Dati finti ma realistici per i test E2E.
// Struttura ricavata dallo schema reale (solo lettura); nessun dato personale:
// nomi, email, codici e indirizzi sono inventati.

export const ENTE_ID = '00000000-0000-4000-8000-0000000000e1'
const ts = '2026-10-01T08:00:00+00:00'

export const USERS = {
  superadmin: { id: '00000000-0000-4000-8000-00000000a001', email: 'superadmin@ente-demo.invalid', nome: 'Sara', cognome: 'Amministratrice' },
  admin_ente: { id: '00000000-0000-4000-8000-00000000a002', email: 'admin@ente-demo.invalid', nome: 'Alberto', cognome: 'Gestore' },
  tecnico: { id: '00000000-0000-4000-8000-00000000a003', email: 'tecnico@ente-demo.invalid', nome: 'Tiziana', cognome: 'Tecnica' },
  consultatore: { id: '00000000-0000-4000-8000-00000000a004', email: 'consultatore@ente-demo.invalid', nome: 'Carlo', cognome: 'Lettore' },
  manutentore: { id: '00000000-0000-4000-8000-00000000a005', email: 'manutentore@ditta-demo.invalid', nome: 'Mario', cognome: 'Manutentore' },
  dirigente_scolastico: { id: '00000000-0000-4000-8000-00000000a006', email: 'dirigente@scuola-demo.invalid', nome: 'Daniela', cognome: 'Dirigente' },
  senza_ruolo: { id: '00000000-0000-4000-8000-00000000a007', email: 'nessuno@ente-demo.invalid', nome: 'Nino', cognome: 'Senzaruolo' },
}

export const enti = [{ id: ENTE_ID, denominazione: 'Provincia Demo di Esempio', codice_ipa: 'p_demo', codice_fiscale: '00000000000', tipo_ente: 'Provincia', pec: 'protocollo@pec.ente-demo.invalid', email: 'info@ente-demo.invalid', telefono: '0000 000000', attivo: true, logo_path: null, ui_palette: 'blue', created_at: ts, updated_at: ts }]

const E = (n) => `00000000-0000-4000-8000-0000000b000${n}`
export const edifici = [
  { id: E(1), ente_id: ENTE_ID, codice_edificio: 'ED-001', denominazione: 'Liceo Scientifico "Galileo" - sede centrale', indirizzo: 'Via delle Scienze', civico: '10', comune: 'Città Demo', provincia: 'DM', cap: '00100', superficie: 5200, volume: 21000, anno_costruzione: 1972, anno_adeguamento: 2015, tipologia_scolastica: 'Liceo', stato_immobile: 'attivo', latitudine: null, longitudine: null, note: null, centro_di_costo: 'CDC-01', created_at: ts, updated_at: ts },
  { id: E(2), ente_id: ENTE_ID, codice_edificio: 'ED-002', denominazione: 'Istituto Tecnico "Volta"', indirizzo: 'Viale dell\'Industria', civico: '4', comune: 'Città Demo', provincia: 'DM', cap: '00100', superficie: 7400, volume: 30100, anno_costruzione: 1985, anno_adeguamento: null, tipologia_scolastica: 'Istituto tecnico', stato_immobile: 'attivo', latitudine: null, longitudine: null, note: null, centro_di_costo: 'CDC-02', created_at: ts, updated_at: ts },
  { id: E(3), ente_id: ENTE_ID, codice_edificio: 'ED-003', denominazione: 'Istituto Professionale "Olivetti" - succursale', indirizzo: 'Via del Lavoro', civico: '22', comune: 'Paese Demo', provincia: 'DM', cap: '00200', superficie: 3100, volume: 12000, anno_costruzione: 1998, anno_adeguamento: null, tipologia_scolastica: 'Istituto professionale', stato_immobile: 'in_concessione', latitudine: null, longitudine: null, note: null, centro_di_costo: null, created_at: ts, updated_at: ts },
]

export const tipologie_impianto = [
  ['TERMICO', 'Impianto termico', 'Climatizzazione', 10], ['FOTOVOLTAICO', 'Impianto fotovoltaico', 'Energia', 20], ['ELETTRICO', 'Impianto elettrico', 'Elettrico', 50],
  ['MESSA_A_TERRA', 'Impianti di messa a terra', 'Elettrico', 55], ['ANTINCENDIO_NASPI_IDRANTI', 'Impianti Antincendio - Naspi e idranti', 'Antincendio', 60], ['GENERICO', 'Impianto generico', 'Altro', 120],
].map(([codice, denominazione, categoria, ordinamento], i) => ({ id: `00000000-0000-4000-8000-0000000c00${10 + i}`, ente_id: ENTE_ID, codice, denominazione, categoria, descrizione: null, icona: null, colore: null, attivo: true, ordinamento, gestione_manutenzione: true, gestione_scadenze: true, gestione_documenti: true, gestione_alert: true, created_at: ts, updated_at: ts }))

const I = (n) => `00000000-0000-4000-8000-0000000d00${String(n).padStart(2, '0')}`
const imp = (n, edificio, tipo, denominazione, stato, prossima, extra = {}) => ({
  id: I(n), ente_id: ENTE_ID, edificio_id: edificio, tipo, codice: `IMP-${String(n).padStart(3, '0')}`, denominazione, ubicazione: 'Locale tecnico piano terra', marca_modello: 'Modello generico', matricola: `MAT-${1000 + n}`, anno_installazione: 2012 + (n % 10), stato, data_ultima_manutenzione: '2026-03-15', data_prossima_manutenzione: prossima, periodicita_mesi: 6, ditta_manutentrice: 'Ditta Manutenzioni Esempio S.r.l.', referente: 'Referente tecnico', numero_rapporto: `RAP-${n}`, conformita: true, note: null, created_by: null, created_at: ts, updated_at: ts, data_installazione: '2015-06-01', data_verifica: '2025-06-01', data_collaudo: '2015-07-01', data_ultimo_controllo_periodico: '2026-01-10', data_prossimo_controllo_periodico: '2027-01-10', ...extra,
})
export const impianti_manutentivi = [
  imp(1, E(1), 'termico', 'Centrale termica', 'attivo', '2026-09-30'),
  imp(2, E(1), 'elettrico', 'Quadro generale BT', 'attivo', '2026-12-15'),
  imp(3, E(1), 'messa_a_terra', 'Impianto di terra', 'attivo', '2026-11-20'),
  imp(4, E(2), 'fotovoltaico', 'Impianto FV copertura 20 kWp', 'attivo', '2026-10-10'),
  imp(5, E(2), 'antincendio_naspi_idranti', 'Rete idranti', 'fuori_servizio', '2026-08-01'),
  imp(6, E(3), 'generico', 'Ascensore corpo B', 'in_dismissione', '2027-02-01'),
]

const M = (n) => `00000000-0000-4000-8000-0000000e000${n}`
export const manutenzioni = [
  { id: M(1), ente_id: ENTE_ID, edificio_id: E(1), impianto_id: I(1), tipo: 'ordinaria', stato: 'programmata', data_richiesta: '2026-09-01', data_programmata: '2026-11-05', data_esecuzione: null, descrizione: 'Manutenzione periodica semestrale della centrale termica', esito: null, costo_previsto: 850, costo_consuntivo: 0, operatore: 'Squadra A', numero_rapporto: null, note: null, created_by: null, created_at: ts, updated_at: ts },
  { id: M(2), ente_id: ENTE_ID, edificio_id: E(2), impianto_id: I(4), tipo: 'straordinaria', stato: 'chiusa', data_richiesta: '2026-06-10', data_programmata: '2026-06-20', data_esecuzione: '2026-06-21', descrizione: 'Sostituzione inverter', esito: 'positivo', costo_previsto: 3200, costo_consuntivo: 3050, operatore: 'Squadra B', numero_rapporto: 'RAP-2026-044', note: null, created_by: null, created_at: ts, updated_at: ts },
]

const INT = (n) => `00000000-0000-4000-8000-0000000f000${n}`
export const interventi = [
  { id: INT(1), ente_id: ENTE_ID, edificio_id: E(1), codice_intervento: 'LAV-2026-001', natura: 'LAVORO', titolo: 'Adeguamento antincendio Liceo Galileo', descrizione: 'Adeguamento alla normativa di prevenzione incendi', cup: 'J00X00000000001', importo_programmato: 450000, importo_finanziato: 450000, importo_contrattuale: 398000, stato: 'esecuzione', annualita_programmazione: 2026, priorita: 1, risolto: false, data_risoluzione: null, note_risoluzione: null, note: null, rup_id: null, tipologia_intervento_id: null, data_inserimento: '2026-01-15', created_at: ts, updated_at: ts, edifici: { denominazione: edifici[0].denominazione, indirizzo: edifici[0].indirizzo, comune: edifici[0].comune } },
  { id: INT(2), ente_id: ENTE_ID, edificio_id: E(2), codice_intervento: 'LAV-2026-002', natura: 'LAVORO', titolo: 'Efficientamento energetico Istituto Volta', descrizione: 'Sostituzione infissi e cappotto termico', cup: 'J00X00000000002', importo_programmato: 1200000, importo_finanziato: 900000, importo_contrattuale: 0, stato: 'progettazione', annualita_programmazione: 2027, priorita: 2, risolto: false, data_risoluzione: null, note_risoluzione: null, note: null, rup_id: null, tipologia_intervento_id: null, data_inserimento: '2026-02-10', created_at: ts, updated_at: ts, edifici: { denominazione: edifici[1].denominazione, indirizzo: edifici[1].indirizzo, comune: edifici[1].comune } },
  { id: INT(3), ente_id: ENTE_ID, edificio_id: E(3), codice_intervento: 'SER-2026-001', natura: 'SERVIZIO', titolo: 'Servizio di verifica periodica impianti di terra', descrizione: 'Verifiche biennali DPR 462/01', cup: null, importo_programmato: 18000, importo_finanziato: 18000, importo_contrattuale: 0, stato: 'programmato', annualita_programmazione: 2026, priorita: 3, risolto: false, data_risoluzione: null, note_risoluzione: null, note: null, rup_id: null, tipologia_intervento_id: null, data_inserimento: '2026-03-01', created_at: ts, updated_at: ts, edifici: { denominazione: edifici[2].denominazione, indirizzo: edifici[2].indirizzo, comune: edifici[2].comune } },
]

export const fasi_intervento = [
  { id: '00000000-0000-4000-8000-000000100001', intervento_id: INT(1), fase: 'progettazione', stato: 'completata', percentuale_avanzamento: 100, data_prevista_inizio: '2026-01-15', data_prevista_fine: '2026-04-30', data_effettiva_inizio: '2026-01-20', data_effettiva_fine: '2026-05-05', note: null },
  { id: '00000000-0000-4000-8000-000000100002', intervento_id: INT(1), fase: 'esecuzione', stato: 'in_corso', percentuale_avanzamento: 40, data_prevista_inizio: '2026-07-01', data_prevista_fine: '2026-12-20', data_effettiva_inizio: '2026-07-10', data_effettiva_fine: null, note: null },
]

export const ambiti_richiesta_intervento = [
  ['EDILE', 'Opere edili'], ['ELETTRICO', 'Impianti elettrici'], ['IDRAULICO', 'Impianti idraulici'], ['TERMICO', 'Riscaldamento'],
].map(([codice, denominazione], i) => ({ id: `00000000-0000-4000-8000-00000011000${i + 1}`, codice, denominazione, attivo: true, created_at: ts }))

const R = (n) => `00000000-0000-4000-8000-00000012000${n}`
const req = (n, edificio, titolo, tipo, stato, data, extra = {}) => ({
  id: R(n), ente_id: ENTE_ID, numero_progressivo: n, codice_richiesta: `RIC-2026-${String(n).padStart(4, '0')}`, titolo_sintetico: titolo, descrizione_estesa: `Descrizione dettagliata della segnalazione: ${titolo.toLowerCase()}.`, numero_protocollo: `${12000 + n}`, data_protocollo: data, tipo_intervento: tipo, risolto: stato === 'risolta', data_risoluzione: stato === 'risolta' ? '2026-10-05' : null, note_immobile: null, note_risoluzione: stato === 'risolta' ? 'Intervento eseguito dalla ditta incaricata' : null, data_richiesta: data, created_by: null, created_at: ts, updated_at: ts, stato_risoluzione: stato, priorita: 'ordinaria', allegati_presenti: false, edificio_origine: null, codice_identificativo_locale: null, origine_sistema: 'GESTIONALE',
  richieste_intervento_sedi: [{ id: `00000000-0000-4000-8000-00000013000${n}`, edificio_id: edificio.id, edifici: { id: edificio.id, codice_edificio: edificio.codice_edificio, denominazione: edificio.denominazione, indirizzo: edificio.indirizzo, comune: edificio.comune } }],
  richieste_intervento_ambiti: [{ id: `00000000-0000-4000-8000-00000014000${n}`, ambito_id: ambiti_richiesta_intervento[n % 4].id, ambiti_richiesta_intervento: ambiti_richiesta_intervento[n % 4] }],
  richiesta_intervento_documenti: [],
  ...extra,
})
export const richieste_intervento = [
  req(1, edifici[0], 'Infiltrazione dal solaio aula 12', 'straordinaria', 'aperta', '2026-10-20', { priorita: 'alta' }),
  req(2, edifici[0], 'Lampade guaste corridoio primo piano', 'ordinaria', 'risolta', '2026-09-28'),
  req(3, edifici[1], 'Termosifone non funzionante laboratorio', 'ordinaria', 'aperta', '2026-10-25'),
  req(4, edifici[2], 'Verifica crepa muro perimetrale', 'da_valutare', 'da_valutare', '2026-10-27'),
]

const S = (n) => `00000000-0000-4000-8000-00000015000${n}`
export const scuole = [
  { id: S(1), ente_id: ENTE_ID, codice_meccanografico: 'DMPS000001', denominazione: 'Liceo Scientifico Galileo', dirigente_user_id: USERS.dirigente_scolastico.id, attiva: true, created_at: ts, updated_at: ts },
  { id: S(2), ente_id: ENTE_ID, codice_meccanografico: 'DMTF000002', denominazione: 'Istituto Tecnico Volta', dirigente_user_id: null, attiva: true, created_at: ts, updated_at: ts },
]
export const scuole_edifici = [
  { id: '00000000-0000-4000-8000-000000160001', scuola_id: S(1), edificio_id: E(1), attivo: true, created_at: ts },
  { id: '00000000-0000-4000-8000-000000160002', scuola_id: S(2), edificio_id: E(2), attivo: true, created_at: ts },
]
export const scuola_utenti = [
  { id: '00000000-0000-4000-8000-000000170001', scuola_id: S(1), user_id: USERS.dirigente_scolastico.id, ruolo: 'dirigente_scolastico', attivo: true, data_inizio: '2026-09-01', data_fine: null, created_at: ts, updated_at: ts },
]
export const scuola_utenti_edifici = [
  { id: '00000000-0000-4000-8000-000000180001', scuola_utente_id: scuola_utenti[0].id, edificio_id: E(1), attivo: true, data_inizio: '2026-09-01', data_fine: null, created_at: ts },
]
export const scuola_access_log = [
  { id: 1, user_id: USERS.dirigente_scolastico.id, ente_id: ENTE_ID, scuola_id: S(1), edificio_id: E(1), richiesta_id: R(1), azione: 'VISUALIZZAZIONE_RICHIESTA', metadata: { origine: 'PORTALE_SCUOLA' }, timestamp: '2026-10-20T09:30:00+00:00' },
]

export const dashboard_interventi = [{ ente_id: ENTE_ID, interventi_totali: 3, interventi_attivi: 2, interventi_conclusi: 0, interventi_sospesi: 0, importo_programmato: 1668000, importo_finanziato: 1368000, importo_contrattuale: 398000 }]
export const dashboard_ritardi = [{ ente_id: ENTE_ID, intervento_id: INT(1), codice_intervento: 'LAV-2026-001', titolo: interventi[0].titolo, fase: 'progettazione', data_prevista_fine: '2026-04-30', giorni_ritardo: 5 }]
export const dashboard_avanzamento = interventi.map((x, i) => ({ ente_id: ENTE_ID, intervento_id: x.id, codice_intervento: x.codice_intervento, titolo: x.titolo, stato: x.stato, avanzamento: [70, 10, 0][i], prossima_scadenza: ['2026-12-20', '2027-03-31', '2026-12-31'][i] }))

// Chiavi presenti nel database reale (vedi docs/COLLAUDO_0.1.0.md, bug B-01):
// il frontend riconosce solo lavori/richieste/manutenzioni.
export const dashboard_config_db = [
  ['interventi', 'Interventi', 1], ['finanziamenti', 'Finanziamenti', 2], ['scadenze', 'Scadenze e avanzamento', 3], ['richieste', 'Richieste di intervento', 4],
].map(([dashboard_key, titolo, ordine], i) => ({ id: `00000000-0000-4000-8000-00000019000${i + 1}`, ente_id: ENTE_ID, dashboard_key, titolo, ordine, visibile: true }))
export const dashboard_config_frontend = [
  ['lavori', 'Lavori e servizi', 1], ['richieste', 'Richieste di intervento', 2], ['manutenzioni', 'Manutenzioni', 3],
].map(([dashboard_key, titolo, ordine], i) => ({ id: `00000000-0000-4000-8000-0000001a000${i + 1}`, ente_id: ENTE_ID, dashboard_key, titolo, ordine, visibile: true }))

// Matrice permessi_ruoli: copia della matrice iniziale presente nel database
// (migrazione 20261031135049_permessi_default_restrittivo_e_matrice_ruoli.sql).
const P = 'v', MATRIX = {
  admin_ente: { amministrazione: 'v', dashboard: 'v', edifici: 'vcudoa', fascicoli: 'vcudoa', impianti: 'vcudoa', import_impianti: 'v', interventi: 'vcudoa', manutenzioni: 'vcudoa', report: 'v', richieste: 'vcudoa' },
  rup: { dashboard: P, edifici: P, fascicoli: 'vo', impianti: P, interventi: 'vcuo', manutenzioni: P, report: P, richieste: 'vcu' },
  tecnico: { dashboard: P, edifici: 'vu', fascicoli: 'vco', impianti: 'vcu', interventi: 'vcuo', manutenzioni: 'vcuo', report: P, richieste: 'vcu' },
  amministrativo: { dashboard: P, edifici: P, fascicoli: P, impianti: P, interventi: 'vuo', manutenzioni: P, report: P, richieste: P },
  direttore_lavori: { dashboard: P, edifici: P, fascicoli: P, impianti: P, interventi: 'vuo', manutenzioni: P, report: P, richieste: P },
  auditor: { dashboard: P, edifici: P, fascicoli: P, impianti: P, interventi: P, manutenzioni: P, report: P, richieste: P },
  consultatore: { dashboard: P, edifici: P, impianti: P, interventi: P, manutenzioni: P, report: P, richieste: P },
  manutentore: { dashboard: P, edifici: P, impianti: 'vu', manutenzioni: 'vcuo', richieste: 'vu' },
  siservizi: { dashboard: P, edifici: P, fascicoli: P, impianti: P, interventi: P, manutenzioni: 'vcuo', richieste: 'vu' },
}
export const ROLE_MATRIX = MATRIX
let pid = 0
export const permessi_ruoli = Object.entries(MATRIX).flatMap(([ruolo, res]) => Object.entries(res).map(([risorsa, f]) => ({
  id: `00000000-0000-4000-8000-1000000${String(++pid).padStart(5, '0')}`, ente_id: ENTE_ID, ruolo, risorsa,
  can_view: f.includes('v'), can_create: f.includes('c'), can_update: f.includes('u'), can_delete: f.includes('d'), can_documents: f.includes('o'), can_admin: f.includes('a'), created_at: ts, updated_at: ts,
})))

export const profiles = Object.values(USERS).map((u) => ({ id: u.id, nome: u.nome, cognome: u.cognome, email: u.email, telefono: null, attivo: true, created_at: ts, updated_at: ts }))

export const audit_log = [
  { id: 1, azione: 'INSERT', ente_id: ENTE_ID, intervento_id: INT(1), ip: null, record_id: INT(1), tabella: 'interventi', timestamp: '2026-10-01T09:00:00+00:00', user_id: USERS.superadmin.id, valore_nuovo: { stato: 'programmato' }, valore_precedente: null },
  { id: 2, azione: 'UPDATE', ente_id: ENTE_ID, intervento_id: INT(1), ip: null, record_id: INT(1), tabella: 'interventi', timestamp: '2026-10-02T09:00:00+00:00', user_id: USERS.superadmin.id, valore_nuovo: { stato: 'esecuzione' }, valore_precedente: { stato: 'programmato' } },
]

// Tabelle restituite dal mock REST; le tabelle non elencate rispondono [].
export function tables(opts = {}) {
  return {
    enti, edifici, tipologie_impianto, impianti_manutentivi, manutenzioni, interventi, fasi_intervento,
    ambiti_richiesta_intervento, richieste_intervento, scuole, scuole_edifici, scuola_utenti, scuola_utenti_edifici, scuola_access_log,
    dashboard_interventi, dashboard_ritardi, dashboard_avanzamento,
    dashboard_config: opts.dashboardConfig === 'frontend' ? dashboard_config_frontend : dashboard_config_db,
    permessi_ruoli, profiles, audit_log,
    richieste_intervento_sedi: richieste_intervento.flatMap((r) => r.richieste_intervento_sedi.map((s) => ({ ...s, ente_id: ENTE_ID, richiesta_id: r.id }))),
    richieste_intervento_ambiti: richieste_intervento.flatMap((r) => r.richieste_intervento_ambiti.map((s) => ({ ...s, ente_id: ENTE_ID, richiesta_id: r.id }))),
  }
}
