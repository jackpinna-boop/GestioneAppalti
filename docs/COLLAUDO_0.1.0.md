# Gestione Appalti — Collaudo funzionale 0.1.0

Data: 31/10/2026 · Baseline: commit `d7499da` (0.1.0-alpha.2 + matrice permessi restrittiva)
Ambiente: build di produzione (`npm run build`) servita in locale, Chromium headless, Supabase
**simulato** (mock in `e2e/mocks/`). Controllo dati: database del progetto demo, sola lettura.

Riferimento: piano di test `docs/ALPHA_TEST_0.1.0-alpha.1.md` (sezioni A-G).

## 1. Esito sintetico

| Voce | Esito |
|---|---|
| Build TypeScript/Vite | ✅ OK (avviso: bundle JS unico da 1,2 MB) |
| Suite E2E (`node e2e/run.mjs`) | **20 superati, 5 falliti su 25** |
| Errori JS non gestiti durante la navigazione | ✅ nessuno su tutte le pagine, per tutti i ruoli |
| Bug frontend rilevati | 9 (2 alta, 3 media, 4 bassa) |
| Anomalie nei dati demo | 9 (vedi § 5) |

I 5 test falliti sono tutti **test di regressione su bug reali** (B-01…B-05): passeranno quando il
bug sarà corretto. Nessun fallimento è dovuto a instabilità della suite.

**Valutazione per la presentazione:** l'applicazione è navigabile senza errori con tutti i ruoli.
Prima della demo vanno risolti almeno **B-01** (dashboard con tre sezioni vuote, visibile appena
entrati) e la **preparazione dei dati** (§ 5: mancano utenze per i ruoli diversi da superadmin e
nessun utente è collegato a una scuola, quindi il Portale Scuola non è dimostrabile).

## 2. Esito per area

Legenda: ✅ verificato · ❌ difetto · 🔶 verificato solo con mock, da ripetere su Supabase reale · ⬜ non testabile qui

### A. Accesso e autorizzazioni

| Verifica | Esito | Test |
|---|---|---|
| Login con credenziali errate: messaggio e permanenza sul login | ✅ | A1 |
| Utente autenticato senza ruoli: non accede al gestionale, sessione chiusa | ✅ | A2 |
| Utente senza ruoli / disattivato: messaggio esplicativo | ❌ B-03 | A3 |
| Informativa privacy da login, MFA e barra superiore; ritorno | ✅ | A4 |
| MFA: registrazione TOTP (QR, chiave manuale, codice errato, codice valido) | 🔶 | A5 |
| MFA: verifica con fattore già registrato, gestionale nascosto prima del 2° fattore | 🔶 | A6 |
| MFA: "Esci" dalla schermata di verifica | ✅ | A7 |
| Menu per ruolo conforme alla matrice `permessi_ruoli` (superadmin, tecnico, consultatore, manutentore) | ✅ | B1, C1, C4, C5 |
| URL diretti verso pagine non autorizzate reindirizzati alla dashboard | ✅ | C2 |
| Consultatore senza comandi di scrittura nelle pagine di elenco | ✅ | C1 |
| Consultatore senza comandi di scrittura nella scheda intervento | ❌ B-02 | C3 |
| Blocco delle scritture non autorizzate lato database (RLS) | ⬜ | — |
| Logout | ✅ | G3 |

### B. Edifici e impianti

| Verifica | Esito | Test |
|---|---|---|
| Elenco edifici, ricerca, pulsante "Nuovo edificio" secondo permesso | ✅ | B3, C4 |
| Fascicolo edificio: apertura e tutte le schede senza errori | ✅ | B3 |
| Cronologia del fascicolo edificio | ❌ B-08 (date interventi assenti) | — |
| Impianti per edificio, scheda impianto | 🔶 (rendering) | B3 |
| Modifica impianto, campi per tipologia, inserimento manutenzione | ⬜ (scritture) | — |

### C. Manutenzioni

| Verifica | Esito | Test |
|---|---|---|
| Elenco manutenzioni, "Scadenze e alert", sottomenu | ✅ | B1 |
| Riepilogo manutenzioni in dashboard | ✅ con chiavi attese dal codice · ❌ con la configurazione reale (B-01) | B2, B7 |
| Inserimento/modifica, date e periodicità, storico | ⬜ (scritture) | — |

### D. Interventi e richieste

| Verifica | Esito | Test |
|---|---|---|
| Elenco lavori e servizi, scheda intervento, tutte le schede | ✅ | B4 |
| Richieste di intervento: elenco, notifiche (campanella), apertura dalla notifica | ✅ | B5 |
| "Nuovo lavoro" visibile al tecnico (can_create) | ✅ | C5 |
| Risoluzione richiesta con data e note, annullamento | ⬜ (scritture) | — |

### E. Portale Scuola

| Verifica | Esito | Test |
|---|---|---|
| Dirigente vede il portale e non il gestionale | ✅ | E1 |
| Solo scuole/edifici associati nei filtri e nella nuova segnalazione | 🔶 (filtro lato client; il perimetro reale dipende da RLS) | E1 |
| Dettaglio richiesta, annullamento con motivazione obbligatoria (RPC `school_cancel_request`) | ✅ | E2 |
| Registrazione dell'apertura del portale nel log accessi | ❌ B-04 | E3 |
| Inserimento richiesta con allegati (RPC + Storage) | ⬜ | — |

### F. Documenti e audit

| Verifica | Esito |
|---|---|
| Caricamento/download documenti, limiti dimensione e tipo | ⬜ (Storage reale) |
| Registro modifiche (audit append-only) | ⬜ — nel database risultano 110 righe di audit; la sola aggiunta è imposta da trigger (migrazione `20261031082931`) |

### F/G. Integrità e regressione

| Verifica | Esito | Test |
|---|---|---|
| Nessun errore JS / console su tutte le pagine e ruoli | ✅ | tutti |
| Refresh, avanti/indietro, URL diretti | ✅ | G1 |
| Viewport smartphone (390 px) | ❌ B-05 | G2 |
| Desktop 1366 px | ✅ | tutti |

## 3. Bug frontend

Nessun bug è stato corretto in questo ramo (competenza Agente B). Righe riferite al commit `d7499da`.

| ID | Priorità | Riproducibilità | Descrizione |
|---|---|---|---|
| B-01 | **Alta** (visibile in demo) | Sempre, con i dati attuali | Dashboard con 3 sezioni vuote |
| B-02 | **Alta** (permessi) | Sempre | Scheda intervento ignora la matrice permessi |
| B-03 | Media | Sempre | Nessun messaggio per utente senza ruoli o disattivato |
| B-04 | Media (tracciabilità) | Sempre | Apertura del Portale Scuola non registrata |
| B-05 | Media | Sempre sotto ~950 px | Scorrimento orizzontale su smartphone |
| B-06 | Bassa | Sempre | Motivazione di annullamento mostrata come avviso |
| B-07 | Bassa | Sempre | "Esci" del Portale Scuola non pulisce la sessione locale |
| B-08 | Bassa | Sempre | Cronologia edificio senza date degli interventi (rischio crash) |
| B-09 | Bassa | Sempre | KPI "Edifici" in dashboard sempre "—" |

**B-01 — Dashboard: sezioni configurate senza contenuto.** `src/App.tsx:255-264`.
La dashboard legge `dashboard_config` e disegna solo le chiavi `lavori`, `richieste`, `manutenzioni`.
Nel database le chiavi sono `interventi`, `finanziamenti`, `scadenze`, `richieste` (4 righe, tutte visibili).
Passi: accedere come qualsiasi ruolo non manutentore. Atteso: KPI lavori, richieste e riepilogo manutenzioni.
Ottenuto: titoli "Interventi", "Finanziamenti", "Scadenze e avanzamento" senza contenuto; si vede solo il blocco Richieste.
Correzione possibile: allineare le chiavi (dati, Agente A) oppure gestire nel frontend le chiavi presenti (Agente B).
Test: B7.

**B-02 — Scheda intervento: comandi di modifica per ruoli in sola lettura.** `src/App.tsx:612` e `:623`.
`InterventionFile` parte da permessi tutti `true` e li sostituisce solo se esiste una riga nella tabella legacy
`permessi_utenti`; non usa `useResourcePermissions(access,'interventi')` come le altre pagine.
Passi: accedere come `consultatore` (o `auditor`, `siservizi`) → Lavori e servizi → aprire un intervento.
Atteso: nessun comando di modifica (matrice: `interventi` solo `can_view`).
Ottenuto: visibili "Modifica scheda", "Aggiungi fonte" e i comandi di caricamento/modifica nelle schede.
La RLS dovrebbe comunque respingere il salvataggio: da verificare su Supabase reale (§ 4). Test: C3.

**B-03 — Login di un utente senza ruoli o disattivato: nessun messaggio.** `src/AuthScreen.tsx:12-24`, `src/App.tsx:204-206`.
`signInWithPassword` emette `SIGNED_IN` prima dei controlli su ruoli e profilo: `App` imposta la sessione e smonta
`AuthScreen`; il successivo `signOut` riporta a un `AuthScreen` nuovo, con stato e messaggio di errore persi.
Passi: login con un utente valido senza righe in `user_roles` (o con `profiles.attivo = false`).
Atteso: "Account autenticato ma non abilitato…" / "Account non abilitato…".
Ottenuto: breve lampeggio (schermata MFA o gestionale vuoto), poi login vuoto senza spiegazioni.
Effetto collaterale: con MFA obbligatoria `MfaGate` può avviare una registrazione TOTP (`mfa.enroll`) per l'utente
che verrà respinto. Test: A3 (fallisce), A2 (sicurezza: l'utente non entra, passa).

**B-04 — Portale Scuola: evento `APERTURA_PORTALE` mai registrato.** `src/SchoolPortalPage.tsx:73`.
`void supabase.from('scuola_access_log').insert(...)` non esegue la richiesta: i query builder di supabase-js
partono solo con `await`/`.then()`. Nel database `scuola_access_log` ha 0 righe.
Passi: accedere come dirigente scolastico. Atteso: INSERT con azione `APERTURA_PORTALE`. Ottenuto: nessuna chiamata.
(L'evento `VISUALIZZAZIONE_RICHIESTA` invece è registrato perché attende la promessa.) Test: E3.

**B-05 — Smartphone: la pagina scorre orizzontalmente di ~560 px.** `src/styles.css:362` (`.top-brand>span{white-space:nowrap}`), barra in `src/App.tsx:229`.
Il titolo "Gestione Patrimonio, Interventi e Manutenzioni" non va a capo: `.top-brand` è largo 626 px su schermo da 390 px.
Passi: viewport 390×844, qualsiasi pagina del gestionale. Atteso: nessuno scorrimento orizzontale. Test: G2.

**B-06 — Annullamento dal Portale Scuola: motivazione e avvisi condividono lo stesso stato.** `src/SchoolPortalPage.tsx:131,159,172`.
La textarea della motivazione è legata a `message`, che è anche il testo del riquadro avvisi in alto: mentre si digita,
la motivazione compare come avviso; un avviso precedente verrebbe usato come motivazione. Basso impatto.

**B-07 — "Esci" del Portale Scuola.** `src/SchoolPortalPage.tsx:156`.
Usa `supabase.auth.signOut()` (ambito locale) invece di `logoutAndClearSession()` usato nel gestionale (ambito globale,
pulizia di `localStorage`, `sessionStorage` e cache). Il pulsante ha solo `title`, manca `aria-label`.

**B-08 — Cronologia del fascicolo edificio.** `src/App.tsx:591` (query a riga 554).
La cronologia usa `interventi.created_at`, che la query non seleziona: gli interventi risultano sempre "Data non indicata".
Se si aggiungesse `created_at` alla select, `date()` (riga 22) riceverebbe un timestamp completo e genererebbe
`RangeError: Invalid time value`, con pagina bianca (riprodotto durante il collaudo con il mock).

**B-09 — Dashboard: KPI "Edifici" fisso a "—".** `src/App.tsx:261`. Il valore è scritto nel codice; in demo appare come dato mancante.

Osservazioni non bloccanti: bundle JS unico da 1,2 MB (tempo di primo caricamento su reti lente);
la campanella notifiche interroga il database ogni 30 secondi anche a pagina inattiva (`src/App.tsx:89`).

## 4. Non testabile qui: verifiche manuali dopo il deploy

Il container non raggiunge Supabase; i mock non applicano RLS, trigger né vincoli. Da verificare sull'ambiente pubblicato,
con le utenze demo (§ 6 di `docs/PRESENTAZIONE.md`):

1. **Login reale e MFA**: registrazione TOTP con app reale (Microsoft/Google Authenticator), verifica a ogni accesso,
   codice scaduto, "Password dimenticata?" (ricezione email e `redirectTo` corretto su GitHub Pages).
2. **RLS per ruolo**: con `consultatore` tentare una modifica dalla scheda intervento (B-02) e verificare il rifiuto
   del database; con `tecnico` verificare che "Elimina" non sia disponibile o sia respinto.
3. **Perimetro Portale Scuola**: il dirigente vede solo richieste/edifici della propria scuola anche interrogando
   direttamente le API (RLS), non solo nei filtri dell'interfaccia.
4. **RPC del portale**: `school_create_request_multi_school`, `school_cancel_request` (richiesta conservata come annullata),
   `school_mark_request_attachments`.
5. **Storage**: caricamento allegati (PDF/immagini ≤ 5 MB, rifiuto di altri tipi), URL firmati, eliminazione.
6. **Edge Function `admin-users`**: elenco, creazione, modifica ruolo, disattivazione; un admin ente non deve gestire utenti di altri enti.
7. **Audit**: ogni modifica genera righe in `audit_log`; UPDATE/DELETE sull'audit respinti.
8. **Scadenza sessione** dopo 4 ore e logout globale su più schede.
9. **Importazioni** Excel (impianti e interventi) con file reali.
10. **Smartphone reale** (Safari iOS, Chrome Android) dopo la correzione di B-05.

## 5. Controllo dati per la demo (sola lettura)

Conteggi al 31/10/2026 sul progetto demo:

| Oggetto | Totale | Dettaglio |
|---|---|---|
| Enti | 1 | senza logo |
| Edifici | 4 | 3 associati a una scuola |
| Impianti | 36 | 35 attivi, 1 in dismissione |
| Impianti per tipologia | | termico 4; elettrico, fotovoltaico, messa a terra, videosorveglianza, generico, condizionamento, naspi/idranti, gruppi pressurizzazione 3 ciascuno; accumulo, antintrusione, controllo accessi, segnalazione/rilevazione incendi 2 ciascuno |
| Tipologie impianto | 13 | tutte attive |
| Interventi | 3 | 1 programmato, 1 progettazione, 1 esecuzione (tutti LAVORO, nessun SERVIZIO) |
| Fasi intervento / contratti / finanziamenti | 5 / 1 / 2 | |
| Richieste di intervento | 4 | 3 aperte, 1 risolta (2 ordinarie, 1 straordinaria, 1 da valutare) |
| Manutenzioni | 2 | 1 programmata, 1 chiusa |
| Scuole | 3 | tutte attive, ciascuna con edificio associato |
| Utenti scuola (`scuola_utenti`) | **0** | nessun dirigente/delegato assegnato |
| Profili utente | 4 | 1 solo con ruolo (superadmin); **3 senza ruolo** |
| Documenti (interventi, immobili, richieste) | 0 | |
| Righe di audit | 110 | |

Anomalie che si vedrebbero in demo:

| # | Anomalia | Quantità | Effetto in demo |
|---|---|---|---|
| D-1 | `dashboard_config` con chiavi non riconosciute dal frontend | 3 su 4 | Dashboard con tre sezioni vuote (B-01) |
| D-2 | Nessun utente collegato a una scuola | 0 righe in `scuola_utenti` | Portale Scuola non dimostrabile |
| D-3 | Utenze per i ruoli della demo assenti | 1 ruolo assegnato su 4 profili | Impossibile mostrare admin ente, tecnico, dirigente; i 3 profili senza ruolo vengono respinti al login |
| D-4 | Testi "demo" nei dati | 32 denominazioni impianto, 36 note impianto, 36 ditte manutentrici, 3 codici edificio | Diciture di prova visibili negli elenchi |
| D-5 | Impianti con manutenzione scaduta | 26 su 36 (7 da oltre 30 giorni) | "Manutenzioni in scadenza: 26" in dashboard: utile per mostrare gli alert, ma dà l'idea di un patrimonio trascurato |
| D-6 | Richiesta risolta senza data e note di risoluzione | 1 | Dettaglio incoerente con la regola "data e nota obbligatorie" |
| D-7 | Edificio senza superficie e anno di costruzione | 1 | Campi "—" nella scheda |
| D-8 | Edificio senza impianti e senza scuola | 1 | Scheda vuota se aperta |
| D-9 | Interventi: 1 senza finanziamenti, 0 servizi, 0 documenti | | Fascicolo intervento povero; schede Documenti vuote |

Nessuna data nel futuro lontano (prossime manutenzioni tra 21/09/2026 e 15/12/2026; richieste tra 20 e 27/09/2026),
nessun importo programmato o finanziato a zero (importo contrattuale a zero solo per i 2 interventi non ancora affidati,
coerente), nessun codice impianto mancante, nessuna incoerenza tra `risolto` e `stato_risoluzione`.

Azioni suggerite prima della demo (a cura di chi gestisce i dati, non eseguite): correggere D-1, creare le utenze e le
assegnazioni scuola (D-2, D-3), sostituire i testi "demo" con denominazioni verosimili (D-4), aggiornare alcune date di
manutenzione (D-5), completare la richiesta risolta (D-6), caricare 2-3 documenti d'esempio su un intervento (D-9).

## 6. Come ripetere il collaudo

```bash
VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=x npm run build
node e2e/run.mjs
```

In CI la stessa suite gira con `.github/workflows/e2e.yml` a ogni push e pull request. Dettagli in `e2e/README.md`.
