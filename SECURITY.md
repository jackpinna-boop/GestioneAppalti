# Security Policy

## Segnalazione vulnerabilità

Per segnalare una vulnerabilità di sicurezza, non pubblicare dettagli tecnici in una issue o in una pull request.

La segnalazione dovrebbe includere:
- descrizione della vulnerabilità;
- componente interessato;
- condizioni necessarie per riprodurla;
- impatto potenziale;
- eventuale evidenza tecnica;
- eventuale proposta di mitigazione.

## Segreti e credenziali

Non inserire nel repository:
- password;
- chiavi private;
- token di accesso;
- service-role/admin keys;
- credenziali di database;
- file `.env` con valori reali;
- dati personali o dati reali di enti/amministrazioni.

Le variabili di configurazione devono essere fornite tramite ambiente o secret/variable store del sistema di deploy.

La chiave Supabase publishable/anon può essere presente nel frontend e non deve essere trattata come una credenziale amministrativa. Le chiavi server-side e le service-role keys devono invece rimanere esclusivamente lato server.

## Stato del progetto

Il repository è sottoposto a revisione di sicurezza e validazione pre-Alpha. Prima della riattivazione degli ambienti applicativi devono essere completati i controlli su segreti, autorizzazioni/RLS, dipendenze, build, logging, backup e ripristino.
