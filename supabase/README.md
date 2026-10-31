# Database Supabase

Progetto: `cuaxulqyrhosqbfaympv` (regione `eu-west-2`).

## Stato del versionamento

La cronologia completa delle migrazioni applicate al database remoto (tabella
`supabase_migrations.schema_migrations`) conta oltre 120 voci, molte delle quali
create direttamente da dashboard o strumenti di amministrazione. La cartella
`migrations/` contiene solo una parte di queste, con timestamp diversi da quelli
registrati sul database: **non** va usata con `supabase db push` sul progetto
remoto.

Diverse migrazioni remote contengono import di dati reali (istituti, richieste
SharePoint, impianti termici, utenze): per questo non vengono esportate così come
sono nel repository.

## Riferimento autorevole dello schema

Lo schema di riferimento (solo struttura, senza dati) è prodotto dal workflow
**Esporta schema database** (`.github/workflows/schema-dump.yml`) in:

- `schema/schema.sql`: schemi applicativi (`public`, `private`) con tabelle,
  funzioni, trigger, policy RLS e grant;
- `schema/storage.sql`: bucket e policy dello storage;
- `schema/roles.sql`: ruoli personalizzati.

Prerequisito: secret di repository `SUPABASE_DB_URL` con la stringa di connessione
*Session pooler* (Supabase → Connect). Avvio: GitHub → Actions → *Esporta schema
database* → *Run workflow*, sul branch desiderato.

Per ricreare un ambiente (collaudo, nuovo ente, ripristino):

```bash
psql "$NUOVO_DB_URL" -f supabase/schema/roles.sql
```

```bash
psql "$NUOVO_DB_URL" -f supabase/schema/schema.sql
```

```bash
psql "$NUOVO_DB_URL" -f supabase/schema/storage.sql
```

## Regola per le modifiche future

Ogni modifica allo schema va scritta come file in `migrations/` con il timestamp
restituito dal database dopo l'applicazione e poi riesportata con il workflow,
in modo che repository e database restino allineati.
