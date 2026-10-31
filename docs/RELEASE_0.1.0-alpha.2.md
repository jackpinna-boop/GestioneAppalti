# Gestione Appalti — 0.1.0-alpha.2

Data: 31 ottobre 2026

## Sicurezza

- **Edge Function `admin-users` (pubblicata come versione 10)**
  - Un `admin_ente` può modificare credenziali o eliminare un utente solo se tutti
    i ruoli dell'utente ricadono negli enti che gestisce e l'utente non è
    superadmin. Prima era possibile cambiare email e password di utenti con ruoli
    in altri enti, superadmin compresi, e quindi prenderne il controllo.
  - Corretti i codici di risposta: ogni errore di validazione o autorizzazione
    veniva restituito come 401 con il messaggio
    "Cannot read properties of undefined".
  - Le eccezioni impreviste restituiscono 500 senza esporre dettagli interni.
  - Elenco utenti con paginazione completa; blocco degli utenti disattivati;
    controllo del ruolo e della lunghezza della password anche in modifica.
- **Registro modifiche (`audit_log`) in sola aggiunta**
  - Migrazione `20261031082931_hardening_audit_append_only_revoke_anon`.
  - Rimosse la policy di cancellazione e la funzione "Cancella registro"
    dell'interfaccia.
  - Un trigger blocca DELETE, TRUNCATE e UPDATE per qualsiasi ruolo; resta
    consentito solo l'azzeramento dei riferimenti eseguito dalle foreign key
    `ON DELETE SET NULL`.
  - Verifica eseguita in una transazione poi annullata: cancellazione, modifica
    e svuotamento bloccati, scrittura degli audit funzionante.
- **Funzioni SECURITY DEFINER**: nessuna è più eseguibile dal ruolo `anon`; le
  nuove funzioni in `public` non sono eseguibili da `anon` per default.
- **Autenticazione a due fattori (TOTP) obbligatoria** per tutti gli utenti. Al
  primo accesso l'utente associa un'app di autenticazione tramite QR code, poi a
  ogni accesso inserisce il codice a 6 cifre. Disattivabile solo in sviluppo con
  `VITE_MFA_REQUIRED=false`.
- **Libreria `xlsx`** aggiornata da 0.18.5 (vulnerabilità GHSA-4r6h-8v6p-xvw6 e
  GHSA-5pgg-2g8v-p4x9) a 0.20.3, distribuita ufficialmente da SheetJS sul proprio
  CDN; l'API è invariata.

## Conformità

- Informativa privacy (artt. 13-14 GDPR), raggiungibile dal login, dalla
  schermata MFA e dalla barra superiore (`#/privacy`). I dati dell'ente, del DPO e
  dei responsabili vanno completati in `src/lib/privacy.ts`.
- Licenza EUPL-1.2 (`LICENSE`) e `publiccode.yml` per il riuso (CAD artt. 68-69).
- Workflow per esportare lo schema del database senza dati (`supabase/README.md`).

## Da completare dopo il rilascio

1. **Rilascio del frontend.** Unire il branch su `main`: il deploy su GitHub Pages
   parte solo da `main`.
2. **MFA lato server.** Dopo che tutti gli utenti attivi hanno configurato il
   secondo fattore, applicare l'obbligo anche sul database (sezione seguente).
3. **Password compromesse.** Attivare in Supabase → Authentication → Policies →
   *Leaked password protection* (richiede piano Pro).
4. **Esportazione dello schema.** Configurare il secret `SUPABASE_DB_URL` e
   avviare il workflow *Esporta schema database*.

### MFA obbligatoria lato database (da applicare al punto 2)

```sql
-- Esempio per una tabella; ripetere per ogni tabella applicativa in public.
create policy richiede_mfa on public.interventi
  as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');
```
