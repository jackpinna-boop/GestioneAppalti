// Definizione dei test E2E. Ogni test riceve { page, base, expect, notes }.
// Il runner (run.mjs) fa fallire il test in presenza di pageerror o errori di console.

import { installSupabaseMock, USERS } from './mocks/supabase.mjs'
import { ROLE_MATRIX, interventi, edifici } from './mocks/fixtures.mjs'

const PASSWORD = 'Password-Demo-1'

// Voci di menu del gestionale -> risorsa della matrice permessi_ruoli.
const MENU = [
  ['Dashboard', 'dashboard'], ['Edifici', 'edifici'], ['Richieste di intervento', 'richieste'], ['Lavori e servizi', 'interventi'],
  ['Fascicoli', 'fascicoli'], ['Report', 'report'], ['Manutenzioni', 'manutenzioni'], ['Amministrazione', 'amministrazione'],
  ['Importazione impianti', 'import_impianti'], ['Importazione interventi', 'import_impianti'],
]
const expectedMenu = (ruolo) => MENU.filter(([, r]) => ROLE_MATRIX[ruolo]?.[r]?.includes('v')).map(([l]) => l)

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(250)
}

async function open(page, base, hash = '') {
  await page.goto(base + (hash ? '#/' + hash : ''))
  await settle(page)
}

async function menuLabels(page) {
  await page.locator('aside.sidebar nav .nav-item').first().waitFor()
  return (await page.locator('aside.sidebar nav .nav-item span').allInnerTexts()).map((s) => s.trim())
}

async function mainHeading(page) {
  const h = page.locator('main.main h1').first()
  await h.waitFor()
  return (await h.innerText()).trim()
}

async function login(page, email, password = PASSWORD) {
  await page.getByPlaceholder('nome@ente.it').fill(email)
  await page.locator('input[type=password]').fill(password)
  await page.getByRole('button', { name: 'Accedi' }).click()
}

// Pulsanti di scrittura visibili nell'area principale (testo o title).
async function writeControls(page) {
  return page.locator('main.main').evaluate((root) => {
    const re = /^(\s*)(nuov[oa]|modifica|elimina|aggiungi|carica|risolvi|salva|importa)/i
    return [...root.querySelectorAll('button, a.btn')]
      .filter((b) => b.offsetParent !== null)
      .map((b) => (b.innerText || '').trim() || b.getAttribute('title') || b.getAttribute('aria-label') || '')
      .filter((t) => re.test(t) || /^(Modifica|Elimina|Risolvi|Risoluzione rapida)/.test(t))
  })
}

const t = (name, run, extra = {}) => ({ name, run, ...extra })

export const tests = [
  // ---------------- A. Accesso ----------------
  t('A1 login: credenziali errate mostrano errore', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'], loggedIn: false })
    await open(page, base)
    await page.getByRole('heading', { name: 'Accesso al sistema' }).waitFor()
    await login(page, USERS.superadmin.email, 'password-sbagliata')
    const err = page.locator('.notice.error')
    await err.waitFor()
    expect(/Invalid login credentials/i.test(await err.innerText()), 'Messaggio di errore credenziali non mostrato: ' + await err.innerText())
    expect(await page.getByRole('heading', { name: 'Accesso al sistema' }).isVisible(), 'Dopo errore si deve restare sulla schermata di login')
  }),

  t('A2 login: utente senza ruoli applicativi non accede al gestionale', async ({ page, base, expect }) => {
    const log = await installSupabaseMock(page, { user: USERS.senza_ruolo, roles: [], loggedIn: false })
    await open(page, base)
    await login(page, USERS.senza_ruolo.email)
    await settle(page)
    await page.waitForTimeout(800)
    await page.getByRole('heading', { name: 'Accesso al sistema' }).waitFor()
    expect(!(await page.locator('aside.sidebar').count()), 'Utente senza ruoli non deve vedere il gestionale')
    expect(log.calls.some((c) => c.path.startsWith('/auth/v1/logout')), 'La sessione dell\'utente senza ruoli deve essere chiusa (logout)')
  }),

  t('A3 login: messaggio esplicativo per utente senza ruoli (regressione B-03)', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.senza_ruolo, roles: [], loggedIn: false })
    await open(page, base)
    await login(page, USERS.senza_ruolo.email)
    await settle(page)
    await page.waitForTimeout(800)
    const err = page.locator('.notice.error')
    const msg = (await err.count()) ? await err.innerText() : '(nessun messaggio)'
    expect(/nessun ruolo applicativo/i.test(msg), 'Atteso messaggio "nessun ruolo applicativo", ottenuto: ' + msg)
  }),

  t('A4 informativa privacy raggiungibile senza login', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'], loggedIn: false })
    await open(page, base)
    await page.getByRole('link', { name: 'Informativa privacy' }).click()
    await page.getByRole('heading', { name: /Informativa sul trattamento dei dati personali/ }).waitFor()
    const text = await page.locator('main').innerText()
    for (const s of ['Titolare del trattamento', 'Responsabile della protezione dei dati', 'Diritti dell\'interessato', 'Periodo di conservazione']) expect(text.includes(s), 'Sezione mancante nell\'informativa: ' + s)
    await page.getByRole('button', { name: 'Torna indietro' }).click()
    await page.getByRole('heading', { name: 'Accesso al sistema' }).waitFor()
  }),

  t('A5 MFA: registrazione TOTP obbligatoria al primo accesso', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.admin_ente, roles: ['admin_ente'], mfa: 'enroll' })
    await open(page, base)
    await page.getByRole('heading', { name: 'Attiva la verifica in due passaggi' }).waitFor()
    expect(await page.getByAltText(/Codice QR/).isVisible(), 'QR code non visibile')
    expect((await page.locator('code').innerText()).length >= 16, 'Chiave segreta manuale non visibile')
    const btn = page.getByRole('button', { name: 'Verifica e accedi' })
    expect(await btn.isDisabled(), 'Il pulsante deve essere disabilitato senza 6 cifre')
    await page.getByPlaceholder('123456').fill('000000')
    await btn.click()
    await page.getByText('Codice non valido o scaduto').waitFor()
    await page.getByPlaceholder('123456').fill('123456')
    await btn.click()
    await page.locator('aside.sidebar').waitFor()
    expect((await menuLabels(page)).includes('Amministrazione'), 'Dopo la registrazione MFA l\'admin ente deve vedere il gestionale')
  }, { allowConsoleErrors: false }),

  t('A6 login completo con verifica MFA (fattore già registrato)', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'], loggedIn: false, mfa: 'challenge' })
    await open(page, base)
    await login(page, USERS.superadmin.email)
    await page.getByRole('heading', { name: 'Verifica in due passaggi' }).waitFor()
    expect(!(await page.locator('aside.sidebar').count()), 'Il gestionale non deve essere visibile prima del secondo fattore')
    await page.getByPlaceholder('123456').fill('123456')
    await page.getByRole('button', { name: 'Verifica e accedi' }).click()
    await page.locator('aside.sidebar').waitFor()
    expect(await mainHeading(page) === 'Dashboard', 'Dopo MFA atteso atterraggio sulla Dashboard')
  }),

  t('A7 MFA: "Esci" dalla schermata di verifica torna al login', async ({ page, base }) => {
    await installSupabaseMock(page, { user: USERS.tecnico, roles: ['tecnico'], mfa: 'challenge' })
    await open(page, base)
    await page.getByRole('heading', { name: 'Verifica in due passaggi' }).waitFor()
    await page.getByRole('button', { name: 'Esci' }).click()
    await page.getByRole('heading', { name: 'Accesso al sistema' }).waitFor()
  }),

  // ---------------- Gestionale: superadmin ----------------
  t('B1 superadmin: tutte le voci di menu senza errori', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'], dashboardConfig: 'frontend' })
    await open(page, base)
    const labels = await menuLabels(page)
    expect(JSON.stringify(labels) === JSON.stringify(MENU.map(([l]) => l)), 'Menu superadmin inatteso: ' + labels.join(', '))
    for (const label of labels) {
      await page.locator('aside.sidebar nav .nav-item', { hasText: label }).first().click()
      await settle(page)
      const h = await mainHeading(page)
      expect(h.length > 0, 'Pagina senza titolo: ' + label)
    }
    // sottomenu manutenzioni
    await page.locator('aside.sidebar .nav-item', { hasText: 'Manutenzioni' }).click()
    await page.locator('.nav-subitem', { hasText: 'Elenco manutenzioni' }).click()
    await settle(page)
    await page.locator('.nav-subitem', { hasText: 'Scadenze e alert' }).click()
    await settle(page)
  }),

  t('B2 superadmin: dashboard con KPI lavori, richieste e manutenzioni', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'], dashboardConfig: 'frontend' })
    await open(page, base, 'dashboard')
    await page.getByText('Riepilogo manutenzioni').waitFor()
    const text = await page.locator('main.main').innerText()
    expect(text.includes('Lavori e servizi'), 'KPI lavori assenti')
    expect(/1\.668\.000/.test(text), 'Importo programmato non formattato in euro: atteso 1.668.000')
  }),

  t('B7 dashboard con la configurazione presente nel database (regressione B-01)', async ({ page, base, expect }) => {
    // dashboard_config reale: chiavi interventi/finanziamenti/scadenze/richieste
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'], dashboardConfig: 'db' })
    await open(page, base, 'dashboard')
    await page.locator('.dashboard-block').first().waitFor()
    const empty = await page.locator('.dashboard-block').evaluateAll((els) => els.filter((e) => e.children.length <= 1).map((e) => e.innerText.trim()))
    expect(!empty.length, 'Sezioni della dashboard con titolo ma senza contenuto: ' + empty.join(', '))
  }),

  t('B3 superadmin: elenco e scheda edificio, impianti', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base, 'edifici')
    await page.getByText(edifici[0].denominazione).first().waitFor()
    expect(await page.getByRole('button', { name: /Nuovo edificio/ }).isVisible(), 'Superadmin deve poter creare edifici')
    await page.getByPlaceholder('Cerca edificio…').fill('Volta')
    await page.waitForTimeout(200)
    expect(!(await page.getByText(edifici[0].denominazione).first().isVisible().catch(() => false)), 'Filtro di ricerca edifici non applicato')
    await open(page, base, 'fascicolo/' + edifici[0].id)
    await page.getByText(edifici[0].denominazione).first().waitFor()
    for (const tab of await page.locator('main.main .tabs button, main.main [role=tab]').all()) { await tab.click(); await settle(page) }
  }),

  t('B4 superadmin: elenco e scheda intervento con tutte le schede', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base, 'interventi')
    await page.getByText(interventi[0].codice_intervento).first().waitFor()
    await open(page, base, 'intervento/' + interventi[0].id)
    await page.getByText(interventi[0].titolo).first().waitFor()
    const tabs = await page.locator('main.main .tabs button, main.main [role=tab]').all()
    for (const tab of tabs) { await tab.click(); await settle(page) }
    expect(tabs.length > 0, 'Schede del fascicolo intervento non trovate')
  }),

  t('B5 superadmin: richieste di intervento, dettaglio e notifiche', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base, 'richieste')
    await page.getByText('Infiltrazione dal solaio aula 12').first().waitFor()
    await page.getByRole('button', { name: 'Notifiche' }).click()
    await page.locator('.notification-menu').waitFor()
    expect((await page.locator('.notification-item').count()) === 4, 'Attese 4 notifiche')
    await page.locator('.notification-open').first().click()
    await settle(page)
  }),

  t('B6 superadmin: amministrazione apre tutte le sezioni', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base, 'amministrazione')
    await mainHeading(page)
    const toggles = await page.locator('main.main button[aria-expanded="false"], main.main .admin-section-toggle').all()
    for (const b of toggles) { await b.click().catch(() => {}); await settle(page) }
    const text = await page.locator('main.main').innerText()
    expect(text.length > 200, 'Pagina amministrazione vuota')
  }),

  t('G1 navigazione: refresh, avanti/indietro e URL diretti', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base, 'edifici')
    expect(await mainHeading(page) === 'Edifici', 'URL diretto #/edifici non rispettato')
    await page.locator('aside.sidebar .nav-item', { hasText: 'Report' }).click(); await settle(page)
    await page.goBack(); await settle(page)
    expect(await mainHeading(page) === 'Edifici', 'Indietro non riporta a Edifici')
    await page.goForward(); await settle(page)
    expect(await mainHeading(page) === 'Report', 'Avanti non riporta a Report')
    await page.reload(); await settle(page)
    expect(await mainHeading(page) === 'Report', 'Il refresh deve mantenere la pagina corrente')
  }),

  t('G2 viewport ridotto (smartphone): nessuno scorrimento orizzontale (regressione B-05)', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base)
    await page.locator('button.mobile-menu').click()
    await page.locator('aside.sidebar.open').waitFor()
    await page.locator('aside.sidebar .nav-item', { hasText: 'Richieste di intervento' }).click()
    await settle(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (overflow > 2) throw new Error(`Scorrimento orizzontale della pagina su smartphone: ${overflow}px`)
    expect(await mainHeading(page), 'Titolo pagina assente')
  }, { viewport: { width: 390, height: 844 } }),

  t('G3 logout dal gestionale', async ({ page, base }) => {
    await installSupabaseMock(page, { user: USERS.superadmin, roles: ['superadmin'] })
    await open(page, base)
    await page.getByRole('button', { name: 'Esci' }).click()
    await page.getByRole('heading', { name: 'Accesso al sistema' }).waitFor()
  }),

  // ---------------- Ruoli ridotti ----------------
  t('C1 consultatore: menu secondo matrice e nessun comando di modifica', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.consultatore, roles: ['consultatore'] })
    await open(page, base)
    const labels = await menuLabels(page)
    expect(JSON.stringify(labels) === JSON.stringify(expectedMenu('consultatore')), `Menu consultatore: atteso ${expectedMenu('consultatore').join(', ')}; ottenuto ${labels.join(', ')}`)
    const found = []
    for (const label of labels) {
      await page.locator('aside.sidebar nav .nav-item', { hasText: label }).first().click()
      await settle(page)
      const w = await writeControls(page)
      if (w.length) found.push(`${label}: ${w.join(', ')}`)
    }
    expect(!found.length, 'Comandi di scrittura visibili al consultatore: ' + found.join(' | '))
  }),

  t('C2 consultatore: URL diretto a pagina non autorizzata reindirizza alla dashboard', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.consultatore, roles: ['consultatore'] })
    await open(page, base, 'amministrazione')
    expect(await mainHeading(page) === 'Dashboard', 'Il consultatore non deve aprire Amministrazione via URL')
    await open(page, base, 'import-impianti')
    expect(await mainHeading(page) === 'Dashboard', 'Il consultatore non deve aprire Importazione via URL')
  }),

  t('C3 consultatore: scheda intervento senza comandi di modifica (regressione B-02)', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.consultatore, roles: ['consultatore'] })
    await open(page, base, 'intervento/' + interventi[0].id)
    await page.getByText(interventi[0].titolo).first().waitFor()
    const w = await writeControls(page)
    expect(!w.length, 'Comandi di scrittura visibili al consultatore nella scheda intervento: ' + [...new Set(w)].join(', '))
  }),

  t('C4 manutentore: menu ridotto e dashboard richieste', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.manutentore, roles: ['manutentore'] })
    await open(page, base)
    const labels = await menuLabels(page)
    expect(JSON.stringify(labels) === JSON.stringify(expectedMenu('manutentore')), `Menu manutentore: atteso ${expectedMenu('manutentore').join(', ')}; ottenuto ${labels.join(', ')}`)
    expect((await page.locator('main.main').innerText()).includes('Quadro delle richieste di intervento'), 'Dashboard del manutentore non mostra il quadro richieste')
    for (const label of labels) {
      await page.locator('aside.sidebar nav .nav-item', { hasText: label }).first().click()
      await settle(page)
      await mainHeading(page)
    }
    await page.locator('aside.sidebar .nav-item', { hasText: 'Edifici' }).click(); await settle(page)
    expect(!(await page.getByRole('button', { name: /Nuovo edificio/ }).count()), 'Il manutentore non deve poter creare edifici')
  }),

  t('C5 tecnico: menu secondo matrice', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.tecnico, roles: ['tecnico'] })
    await open(page, base)
    const labels = await menuLabels(page)
    expect(JSON.stringify(labels) === JSON.stringify(expectedMenu('tecnico')), `Menu tecnico: atteso ${expectedMenu('tecnico').join(', ')}; ottenuto ${labels.join(', ')}`)
    await page.locator('aside.sidebar .nav-item', { hasText: 'Lavori e servizi' }).click(); await settle(page)
    expect(await page.getByRole('button', { name: /Nuovo lavoro/ }).isVisible(), 'Il tecnico deve poter creare lavori (can_create)')
  }),

  // ---------------- E. Portale Scuola ----------------
  t('E1 dirigente scolastico: Portale Scuola limitato al proprio perimetro', async ({ page, base, expect }) => {
    await installSupabaseMock(page, { user: USERS.dirigente_scolastico, roles: ['dirigente_scolastico'] })
    await open(page, base)
    await page.getByRole('heading', { name: 'Gestione segnalazioni' }).waitFor()
    expect(!(await page.locator('aside.sidebar').count()), 'Il dirigente non deve vedere il gestionale')
    const info = await page.locator('.school-portal-actions span').innerText()
    expect(/1 istituto\/i · 1 edificio\/i/.test(info), 'Perimetro atteso 1 istituto e 1 edificio, ottenuto: ' + info)
    const opts = await page.locator('.school-filters select').first().locator('option').allInnerTexts()
    expect(opts.length === 2 && opts[1].includes('Galileo'), 'Filtro istituti: atteso solo Liceo Galileo, ottenuto ' + opts.join(', '))
    await page.getByRole('button', { name: 'Segnala intervento' }).click()
    const schoolOpts = await page.locator('select[name=scuola] option').allInnerTexts()
    expect(schoolOpts.length === 2 && !schoolOpts.join().includes('Volta'), 'Nuova segnalazione: scuole proposte ' + schoolOpts.join(', '))
    await page.locator('select[name=scuola]').selectOption({ index: 1 })
    const ed = await page.locator('select[name=edificio] option').allInnerTexts()
    expect(ed.join().includes('Galileo') && !ed.join().includes('Volta'), 'Edifici proposti fuori perimetro: ' + ed.join(', '))
    await page.locator('.modal .modal-head button').click()
  }),

  t('E3 dirigente scolastico: apertura del portale registrata nel log accessi (regressione B-04)', async ({ page, base, expect }) => {
    const log = await installSupabaseMock(page, { user: USERS.dirigente_scolastico, roles: ['dirigente_scolastico'] })
    await open(page, base)
    await page.getByRole('heading', { name: 'Gestione segnalazioni' }).waitFor()
    await settle(page)
    expect(log.writes.some((w) => w.table === 'scuola_access_log' && String(w.body).includes('APERTURA_PORTALE')), 'Nessuna INSERT su scuola_access_log con azione APERTURA_PORTALE')
  }),

  t('E2 dirigente scolastico: dettaglio richiesta e annullamento', async ({ page, base, expect }) => {
    const log = await installSupabaseMock(page, { user: USERS.dirigente_scolastico, roles: ['dirigente_scolastico'] })
    await open(page, base)
    await page.getByRole('heading', { name: 'Gestione segnalazioni' }).waitFor()
    await page.getByRole('button', { name: 'Apri' }).first().click()
    await page.locator('.modal').waitFor()
    await page.locator('.modal .modal-head button').click()
    await page.getByRole('button', { name: 'Annulla' }).first().click()
    const conferma = page.getByRole('button', { name: 'Conferma annullamento' })
    expect(await conferma.isDisabled(), 'Annullamento senza motivazione deve essere disabilitato')
    await page.locator('.modal textarea').fill('Segnalazione inserita per errore')
    await conferma.click()
    await settle(page)
    expect(log.writes.some((w) => String(w.path).includes('school_cancel_request')), 'RPC school_cancel_request non invocata')
  }),
]
