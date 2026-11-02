# Gestione Appalti — Kit per la presentazione agli enti

Versione 0.1.0 · applicazione: https://jackpinna-boop.github.io/GestioneAppalti/
Stato: **sperimentazione e dimostrazione**, non ancora servizio in produzione (vedi § 6).

## 1. Obiettivo del prodotto

1. Un unico gestionale per il **patrimonio edilizio** dell'ente (in particolare scolastico): edifici, dati catastali, impianti, documenti.
2. Segue **lavori e servizi** dalla programmazione al collaudo: fasi, importi, finanziamenti (anche PNRR), contratti, atti e fascicolo digitale.
3. Pianifica le **manutenzioni** degli impianti con scadenze e alert e conserva lo storico degli interventi eseguiti.
4. Raccoglie le **richieste di intervento delle scuole** tramite un portale dedicato, con tracciamento fino alla risoluzione.
5. Software **open source (EUPL-1.2)**, riusabile da altri enti, con sicurezza sul database e permessi configurabili per ruolo.

## 2. Prima della demo (checklist)

- [ ] Correzioni bloccanti per la demo integrate e pubblicate: **B-01** (dashboard con sezioni vuote) e, se possibile, B-02 e B-05 (`docs/COLLAUDO_0.1.0.md`).
- [ ] Dati demo ripuliti: testi "demo" sostituiti, una richiesta risolta completata, 2-3 documenti su un intervento, alcune scadenze aggiornate (§ 5 del collaudo).
- [ ] Utenze demo create e **MFA già registrata** su un telefono del presentatore per ciascuna (§ 4).
- [ ] Almeno un dirigente scolastico collegato a una scuola e a un edificio (`scuola_utenti`).
- [ ] Una richiesta della scuola già inserita e una "da inserire dal vivo" pronta (testo e foto ≤ 5 MB).
- [ ] Browser con quattro profili o finestre in incognito separate, una per utenza, già sulla schermata MFA.
- [ ] Prova completa del percorso il giorno prima; piano B: video registrato del percorso.
- [ ] Progetto Supabase attivo (il piano gratuito va in pausa per inattività): aprire l'app la mattina stessa.

## 3. Percorso demo di 15 minuti

### Superadmin — 4 minuti: "sicurezza e configurazione"

1. **Login + MFA** (1'): email e password, poi codice a 6 cifre dall'app di autenticazione. Messaggio: il secondo fattore è obbligatorio per tutti; senza ruolo assegnato non si entra.
2. **Informativa privacy** (icona scudo in alto): conforme agli artt. 13-14 GDPR, raggiungibile anche prima del login.
3. **Amministrazione → Privilegi per tipologia di utente** (1'30"): la matrice ruolo × risorsa (visualizza, crea, modifica, elimina, documenti). Mostrare che il consultatore ha solo "visualizza". **Visibilità del menu per ruolo**: il menu si adatta al ruolo.
4. **Amministrazione → Registro modifiche** (1'): ultime 100 operazioni con prima/dopo. Messaggio: registro in sola aggiunta, nessuno (neppure l'amministratore) può modificarlo o cancellarlo.
5. **Catalogo impianti** (30"): 13 tipologie configurabili (termico, fotovoltaico, antincendio, messa a terra…).

### Admin ente — 4 minuti: "il patrimonio e i lavori"

1. **Dashboard** (45"): KPI di lavori e servizi, importi programmati e finanziati, richieste aperte, manutenzioni in scadenza.
2. **Edifici → fascicolo di un edificio** (1'15"): anagrafica, dati catastali, impianti, cronologia, documenti.
3. **Lavori e servizi → scheda intervento** (1'30"): CUP, importi, fasi con avanzamento e ritardi, finanziamenti, procedura di affidamento, contratto, documenti per sezione. Pulsante **Stampa** per il fascicolo.
4. **Amministrazione → Utenti registrati / Scuole e delegati** (30"): l'ente crea i propri utenti e li collega alle scuole.

### Tecnico — 3 minuti: "il lavoro quotidiano"

1. **Richieste di intervento** (1'15"): la richiesta arrivata dalla scuola compare anche nella **campanella** notifiche; filtri per edificio, ambito, priorità; apertura del dettaglio.
2. **Risoluzione** (45"): segnare la richiesta come risolta con data e nota obbligatorie.
3. **Manutenzioni → Scadenze e alert** (1'): impianti con manutenzione o controllo periodico scaduto, registrazione di una manutenzione eseguita.
   Messaggio: il tecnico può creare e modificare, ma non eliminare (matrice permessi).

### Dirigente scolastico — 4 minuti: "il portale della scuola"

1. **Accesso** (30"): stesso login con MFA, ma il dirigente vede **solo il Portale Scuola**, non il gestionale.
2. **Perimetro** (45"): solo il proprio istituto e i propri edifici; contatori aperte / in carico / risolte / annullate.
3. **Segnala intervento dal vivo** (1'30"): scuola, edificio, titolo, descrizione, priorità, foto allegata.
4. **Annullamento** (45"): una richiesta non si cancella, si **annulla con motivazione** e resta nello storico. Registro attività del proprio account.
5. Chiusura (30"): tornare sulla finestra del tecnico e mostrare la nuova richiesta arrivata.

## 4. Utenze demo necessarie

Da creare a cura dell'amministratore (non create in questa attività). Usare indirizzi email dedicati alla demo,
mai account personali; registrare la MFA prima della presentazione.

| # | Ruolo (`app_role`) | Collegamenti | Cosa mostrare |
|---|---|---|---|
| 1 | `superadmin` | ente demo | matrice permessi, menu per ruolo, registro modifiche, catalogo impianti (esiste già) |
| 2 | `admin_ente` | ente demo | dashboard, edifici, fascicolo intervento, gestione utenti e scuole |
| 3 | `tecnico` | ente demo | richieste, notifiche, risoluzione, manutenzioni; assenza del comando "Elimina" |
| 4 | `dirigente_scolastico` | `scuola_utenti` su una scuola + `scuola_utenti_edifici` su almeno un edificio | Portale Scuola, nuova segnalazione, annullamento |
| 5 (facoltativa) | `consultatore` | ente demo | menu ridotto e sola lettura (dopo la correzione di B-02) |
| 6 (facoltativa) | `manutentore` | ente demo | dashboard richieste, manutenzioni, nessun accesso a lavori e amministrazione |

## 5. Punti di forza

- **Sicurezza sul database (RLS)**: Row Level Security attiva su tutte le tabelle; ogni utente vede solo i dati del proprio ente,
  e il dirigente scolastico solo quelli del proprio istituto ed edificio. Il controllo non dipende dall'interfaccia.
- **Autenticazione a due fattori obbligatoria** (TOTP con qualsiasi app di autenticazione), sessione con scadenza a 4 ore e
  uscita globale; utenti senza ruolo respinti.
- **Registro modifiche inalterabile**: `audit_log` in sola aggiunta, imposto da trigger; ogni modifica conserva valore precedente e nuovo.
- **Portale Scuola**: le scuole segnalano direttamente, con allegati, senza accedere al gestionale; annullamento tracciato,
  nessuna cancellazione; registro degli accessi.
- **Permessi configurabili** dall'ente senza sviluppo: matrice ruolo × risorsa, visibilità del menu, eccezioni per singolo utente.
- **Fascicolo digitale** di edificio e intervento con documenti per sezione e stampa.
- **Riuso e trasparenza**: licenza EUPL-1.2, `publiccode.yml`, codice pubblico; nessun cookie di profilazione né analytics.
- **Qualità**: build verificata e test automatici end-to-end a ogni modifica (`e2e/`).

## 6. Limiti noti e roadmap

Limiti attuali (dettaglio in `docs/CONFORMITA_PA.md` e `docs/COLLAUDO_0.1.0.md`):

- Infrastruttura su Supabase piano gratuito e GitHub Pages: **non qualificati ACN**, senza SLA, backup puntuali (PITR) assenti, regione dati a Londra.
- Accesso con email, password e TOTP: **SPID/CIE non ancora integrati**.
- MFA imposta dall'applicazione; l'obbligo anche lato database è pronto ma da attivare dopo l'adesione di tutti gli utenti.
- Nessuna integrazione con protocollo informatico e conservazione a norma; documenti non protocollati.
- Audit di accessibilità WCAG 2.1 AA da eseguire; layout smartphone da rifinire (B-05).
- Bug aperti del collaudo (B-01…B-09) da chiudere prima della fase pilota.

Roadmap proposta:

| Fase | Contenuto |
|---|---|
| 0.1.x — stabilizzazione (ora) | correzione bug del collaudo, dati demo, test E2E in CI, MFA lato database |
| 0.2 — pilota con un ente | hosting su **infrastruttura qualificata ACN** (Supabase a pagamento in regione UE se qualificato, self-hosted su PSN/cloud qualificato o data center dell'ente), backup e PITR, accordi art. 28 GDPR, informativa completata con titolare e DPO |
| 0.3 — identità digitale | **SPID e CIE** tramite SAML/OIDC (gateway dell'ente o SSO del fornitore), mantenendo i ruoli applicativi |
| 0.4 — interoperabilità | protocollo informatico e conservazione, esportazioni verso BDAP/monitoraggio opere pubbliche, audit accessibilità e dichiarazione AgID |
| 1.0 — produzione | SLA, procedure di gestione incidenti (NIS2 se applicabile), manuale utente e di installazione per il riuso |

## 7. Domande frequenti di un ente

**Dove sono i dati?** Oggi in un database PostgreSQL gestito da Supabase (regione Londra, ambiente di prova). Per la produzione
si passa a un'infrastruttura qualificata ACN in UE o al data center dell'ente: il software è open source e installabile.

**È conforme ad ACN / cloud della PA?** Il codice è portabile, l’hosting attuale no. La qualificazione dipende dall'infrastruttura scelta nella fase pilota.

**Si accede con SPID o CIE?** Non ancora: è la fase 0.3 della roadmap. Oggi email, password e secondo fattore obbligatorio.

**Chi vede cosa?** Lo decide l'ente con la matrice dei permessi per ruolo; il database applica comunque i limiti (RLS), anche se qualcuno aggirasse l'interfaccia.

**Le scuole devono avere un account del gestionale?** No: il dirigente o un delegato accede al solo Portale Scuola, limitato al proprio istituto.

**Si possono cancellare dati o richieste?** Le richieste delle scuole si annullano senza cancellarle; ogni modifica resta nel registro, che non può essere alterato.

**Quanto costa?** Licenza gratuita (EUPL-1.2). I costi sono di hosting qualificato, eventuale assistenza e personalizzazione.

**Possiamo importare i nostri dati?** Sì: importazione da Excel di impianti e interventi; per gli edifici si concorda un tracciato.

**Sostituisce la piattaforma di e-procurement?** No: è un gestionale di monitoraggio. Le gare si svolgono sulle piattaforme certificate; qui si registrano CIG, procedure e contratti.

**Funziona su tablet e smartphone?** Sì nel browser, senza app da installare; il layout per smartphone è in rifinitura.

**Ed è accessibile?** Lingua e etichette sono curate; l'audit WCAG completo e la dichiarazione di accessibilità sono previsti prima della produzione.

**E il GDPR?** Informativa pubblicata, dati minimi, nessun cookie di profilazione. L'ente resta titolare: servono nomina del responsabile (art. 28), registro dei trattamenti e definizione dei tempi di conservazione.
