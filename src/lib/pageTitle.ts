// Titolo della scheda del browser aggiornato in base alla pagina (WCAG 2.4.2).
const APP = 'Gestione Patrimonio, Interventi e Manutenzioni'
const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  edifici: 'Edifici',
  richieste: 'Richieste di intervento',
  interventi: 'Lavori e servizi',
  intervento: 'Scheda intervento',
  fascicolo: 'Fascicoli degli edifici',
  report: 'Report',
  amministrazione: 'Amministrazione',
  'import-impianti': 'Importazione impianti',
  'import-interventi': 'Importazione interventi',
  manutenzioni: 'Manutenzioni',
  'manutenzioni-scadenze': 'Scadenze manutenzioni',
  privacy: 'Informativa privacy',
}

function update() {
  const parts = location.hash.replace(/^#\/?/, '').split('/')
  let key = parts[0] || ''
  if (key === 'fascicolo' && parts[1]) key = 'fascicolo-edificio'
  const label = key === 'fascicolo-edificio' ? 'Fascicolo edificio' : TITLES[key]
  document.title = label ? `${label} · ${APP}` : APP
}

export function installPageTitle() {
  update()
  window.addEventListener('hashchange', update)
}
