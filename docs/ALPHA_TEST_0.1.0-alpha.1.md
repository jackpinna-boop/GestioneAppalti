# Gestione Appalti — Alpha Test 0.1.0-alpha.1

## Baseline consolidata

Baseline Alpha riferita al commit che introduce gli impianti di messa a terra e alle modifiche funzionali immediatamente precedenti.

### Verifiche automatiche già eseguite

- Build TypeScript/Vite tramite GitHub Actions: **OK**
- Deploy GitHub Pages della baseline corrente: **OK**
- Migrazioni Supabase applicate: **OK**
- Tipologie impianto attive nel demo: **13**
- Impianti demo: **36**
- Impianti di messa a terra demo: **3**
- Codici impianto duplicati: **0**
- Impianti senza edificio: **0**
- Impianti senza tipologia configurata: **0**
- Stati demo: **35 attivi, 1 in dismissione**

## Piano Alpha Test

### A. Accesso e autorizzazioni
- [ ] Login/logout con utenza autorizzata
- [ ] Verifica profilo e ruolo
- [ ] Verifica separazione delle funzionalità per ruolo
- [ ] Verifica accesso negato alle operazioni non autorizzate

### B. Edifici e impianti
- [ ] Apertura elenco edifici
- [ ] Apertura scheda edificio
- [ ] Elenco impianti per edificio
- [ ] Filtri per tipologia
- [ ] Filtri per stato
- [ ] Conteggi per tipologia
- [ ] Visualizzazione di attivi, fuori servizio e in dismissione
- [ ] Apertura scheda impianto
- [ ] Modifica impianto
- [ ] Inserimento diretto intervento di manutenzione
- [ ] Verifica tipologia impianto di messa a terra
- [ ] Verifica campi tecnici specifici per tipologia
- [ ] Verifica date di installazione, verifica, collaudo e controlli periodici

### C. Manutenzioni
- [ ] Inserimento manutenzione
- [ ] Modifica manutenzione
- [ ] Associazione manutenzione all'impianto corretto
- [ ] Verifica date e periodicità
- [ ] Verifica stato e storico

### D. Interventi e richieste
- [ ] Apertura elenco interventi
- [ ] Ricerca e filtri
- [ ] Apertura scheda intervento
- [ ] Verifica protocollo e collegamenti delle richieste
- [ ] Annullamento richiesta senza cancellazione fisica
- [ ] Risoluzione richiesta con data e note

### E. Portale Scuola
- [ ] Visualizzazione delle sole scuole associate
- [ ] Inserimento richiesta
- [ ] Modifica richiesta dove consentito
- [ ] Annullamento richiesta
- [ ] Gestione allegati
- [ ] Verifica perimetro RLS

### F. Documenti e audit
- [ ] Caricamento documento
- [ ] Download documento autorizzato
- [ ] Verifica limite e tipologie file
- [ ] Verifica registrazione delle operazioni nell'audit log

### G. Integrità e regressione
- [ ] Verifica assenza di errori console
- [ ] Verifica assenza di errori nelle chiamate Supabase
- [ ] Verifica refresh delle pagine
- [ ] Verifica navigazione avanti/indietro
- [ ] Verifica comportamento su desktop e viewport ridotto
- [ ] Verifica regressione delle funzioni esistenti

## Criteri di uscita Alpha

La baseline può passare alla fase successiva quando:
1. build e deploy rimangono verdi;
2. non risultano errori bloccanti nelle sezioni A-G;
3. le operazioni CRUD principali rispettano i ruoli;
4. RLS e perimetro dei dati risultano corretti;
5. non emergono regressioni sulle funzionalità già consolidate;
6. ogni anomalia residua è registrata con priorità e riproducibilità.

Le verifiche contrassegnate come automatiche sono state eseguite; le caselle operative richiedono test funzionali con utenze e navigazione dell'applicazione.
