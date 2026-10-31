# Test E2E di smoke — Gestione Appalti

Suite di test end-to-end eseguita con la libreria **Playwright** (senza `@playwright/test`
e senza dipendenze aggiunte a `package.json`). Supabase è interamente **simulato**: tutte le
chiamate verso `https://x.supabase.co/**` (Auth, PostgREST, Storage, Edge Function
`admin-users`) sono intercettate con `page.route` e ricevono dati finti realistici.

## Esecuzione locale

```bash
# 1. build con l'URL Supabase fittizio usato dai mock
VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=x npm run build

# 2. esecuzione (avvia da sé un server statico su dist/)
node e2e/run.mjs

# oppure contro un'anteprima già avviata
npx vite preview --port 4173 &
E2E_BASE_URL=http://localhost:4173/GestioneAppalti/ node e2e/run.mjs

# solo alcuni test (filtro sul nome), con browser visibile
node e2e/run.mjs --grep consultatore --headed
```

Se `playwright` non è installato: `npm i --no-save playwright@1.56.1 && npx playwright install chromium`
(`--no-save` non modifica `package.json`). La build **deve** usare `VITE_SUPABASE_URL=https://x.supabase.co`,
altrimenti le chiamate non vengono intercettate.

Esito: codice di uscita 0 se tutti i test passano, 1 se almeno uno fallisce. Per ogni test fallito
viene salvato uno screenshot in `e2e/artifacts/` (ignorata da git; in CI è caricata come artifact).

## Regole

- Un test **fallisce** se si verifica un errore JavaScript non gestito (`pageerror`) o un
  `console.error`, salvo i messaggi attesi elencati in `ALLOWED_CONSOLE` (`run.mjs`):
  - `AuthSessionMissingError` sulla schermata di login (nessuna sessione, comportamento previsto);
  - `Failed to load resource ... 4xx` per le risposte di errore simulate (credenziali o codice MFA errati).
- I dialoghi `confirm()` sono annullati automaticamente: i test non eseguono cancellazioni.
- Credenziali dei mock: password `Password-Demo-1`, codice TOTP valido `123456`.

## Struttura

| File | Contenuto |
|---|---|
| `run.mjs` | runner: server statico, browser, raccolta errori, report |
| `tests.mjs` | definizione dei test |
| `mocks/supabase.mjs` | mock di Auth (JWT finto con claim `aal`), MFA (enroll/challenge/verify), PostgREST (filtri `eq/in/is/...`, `select`, `single`, `count`), Storage, Edge Function |
| `mocks/fixtures.mjs` | dati finti (ente, edifici, impianti, interventi, richieste, scuole) e matrice `permessi_ruoli` copiata dalla migrazione `20261031135049` |

Scenari del mock (`installSupabaseMock(page, {...})`): `user`, `roles`, `loggedIn` (sessione
già presente in `localStorage`), `mfa` (`aal2` | `enroll` | `challenge`), `inactive`
(profilo disattivato), `dashboardConfig` (`db` = chiavi presenti nel database reale, `frontend` = chiavi attese dal codice).

## Copertura

| Area | Test |
|---|---|
| A. Accesso | A1 credenziali errate · A2 utente senza ruoli non entra · A3 messaggio per utente senza ruoli · A4 informativa privacy · A5 registrazione MFA · A6 login + verifica MFA · A7 uscita dalla schermata MFA |
| Gestionale superadmin | B1 tutte le voci di menu · B2 dashboard · B3 edifici e fascicolo · B4 scheda intervento e schede · B5 richieste e notifiche · B6 amministrazione · B7 configurazione dashboard reale |
| Ruoli | C1 consultatore: menu e nessun comando di modifica · C2 URL non autorizzati · C3 scheda intervento in sola lettura · C4 manutentore · C5 tecnico |
| E. Portale Scuola | E1 perimetro dirigente · E2 dettaglio e annullamento · E3 registro accessi |
| G. Regressione | G1 refresh/avanti/indietro · G2 smartphone · G3 logout |

I test con "(regressione B-xx)" verificano bug noti descritti in `docs/COLLAUDO_0.1.0.md`:
falliscono finché il bug non è corretto.

## Limiti

I mock non applicano RLS né vincoli del database: la suite verifica l'interfaccia (rendering,
navigazione, visibilità dei comandi per ruolo), non la sicurezza lato server. Le verifiche su
Supabase reale sono elencate in `docs/COLLAUDO_0.1.0.md`.
