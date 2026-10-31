# Conformità per la Pubblica Amministrazione — stato al 31/10/2026 (0.1.0-alpha.2)

Verifica tecnica del codice e del database. Non sostituisce il parere del DPO e
degli uffici legali dell'ente: i riferimenti normativi vanno confermati.

Legenda: ✅ conforme · 🟡 parziale o da completare · ❌ non conforme / bloccante

## Esito sintetico

Il software è **adatto a sperimentazioni e dimostrazioni**, ma **non ancora a un
servizio in produzione presso un ente**. I blocchi principali riguardano
l'infrastruttura (qualificazione ACN, piano gratuito senza SLA), non il codice
applicativo.

## Sicurezza

| Requisito | Stato | Note |
|---|---|---|
| Controllo accessi lato server (RLS) | ✅ | RLS attiva su tutte le 59 tabelle `public`; policy riservate ad `authenticated`. |
| Separazione per ente, istituto ed edificio | ✅ | Funzioni `private.*` e policy dedicate al Portale Scuola. |
| Gestione utenti amministrativa | ✅ | `admin-users` v10: controllo di perimetro corretto. |
| Autenticazione a due fattori | 🟡 | Obbligatoria nell'app; obbligo lato database da attivare dopo l'adesione degli utenti (vedi note di rilascio). |
| Protezione da password compromesse | ❌ | Disattivata; richiede piano Supabase Pro. |
| Registro modifiche inalterabile | ✅ | `audit_log` in sola aggiunta, imposto da trigger. Da definire la durata di conservazione. |
| Funzioni SECURITY DEFINER esposte ad `anon` | ✅ | Nessuna dopo la migrazione del 31/10/2026. |
| Dipendenze con vulnerabilità note | ✅ | `xlsx` aggiornata a 0.20.3. |
| Segreti nel repository | ✅ | Nessuno; configurazione tramite variabili d'ambiente. |
| Backup e ripristino puntuale (PITR) | ❌ | Non disponibili sul piano gratuito; il progetto viene messo in pausa per inattività. |
| Schema versionato e riproducibile | 🟡 | Workflow di esportazione pronto; serve il secret `SUPABASE_DB_URL`. |
| NIS2 (D.Lgs. 138/2024), se l'ente vi rientra | 🟡 | Mancano procedure di gestione incidenti, monitoraggio e gestione dei fornitori. |

## Cloud e hosting

| Requisito | Stato | Note |
|---|---|---|
| Servizi cloud qualificati ACN | ❌ | Supabase e GitHub Pages: verificare sul Catalogo dei servizi cloud qualificati ACN; per quanto noto non risultano qualificati. |
| Localizzazione dei dati | 🟡 | Regione `eu-west-2` (Londra, Regno Unito, con decisione di adeguatezza UE). Preferibile una regione UE, ad esempio `eu-central-1` o `eu-south-1`. |
| SLA e assistenza | ❌ | Il piano gratuito non offre garanzie di servizio. |

Percorsi possibili:

- (a) Supabase a pagamento in regione UE, previa verifica della qualificazione ACN;
- (b) Supabase self-hosted (open source) su infrastruttura qualificata (PSN,
  cloud qualificato o data center dell'ente);
- (c) Postgres gestito qualificato con autenticazione equivalente.

Il frontend è statico e può essere pubblicato su qualsiasi hosting qualificato.

## Protezione dei dati (GDPR)

| Requisito | Stato | Note |
|---|---|---|
| Informativa (artt. 13-14) | 🟡 | Pubblicata in `#/privacy`; da completare con i dati dell'ente e del DPO in `src/lib/privacy.ts`. |
| Nomina dei responsabili (art. 28) | ❌ | Servono gli accordi sul trattamento (DPA) con il fornitore cloud e con chi manutiene il software. |
| Trasferimenti extra UE | 🟡 | Supabase Inc. è statunitense: verificare l'adesione al Data Privacy Framework o le clausole contrattuali tipo. |
| Registro dei trattamenti (art. 30) | ❌ | A cura dell'ente. |
| Privacy by design: minimizzazione | ✅ | Dati utente limitati a nominativo, contatti, ruolo. |
| Conservazione | 🟡 | Periodi da definire nell'informativa e da applicare (account e audit). |
| Valutazione d'impatto (DPIA) | 🟡 | Probabilmente non obbligatoria; va valutato con il DPO. |

## Accessibilità (Legge 4/2004, WCAG 2.1 AA / EN 301 549)

| Requisito | Stato | Note |
|---|---|---|
| Lingua del documento | ✅ | `lang="it"`. |
| Focus visibile, etichette dei pulsanti con sola icona | 🟡 | Migliorati nella barra superiore e nelle nuove schermate; da estendere a tutta l'app. |
| Audit WCAG completo | ❌ | Da eseguire con strumenti automatici e test manuali (tastiera, screen reader). |
| Dichiarazione di accessibilità su form.agid.gov.it | ❌ | A cura dell'ente, dopo l'audit. |

## Identità digitale e interoperabilità

| Requisito | Stato | Note |
|---|---|---|
| SPID/CIE per gli utenti esterni (art. 64 CAD) | ❌ | Oggi l'accesso avviene con email, password e TOTP. Integrazione possibile via SAML/OIDC: Supabase supporta SAML SSO sul piano Pro, oppure tramite un gateway SPID/CIE dell'ente. |
| Protocollo informatico e conservazione | 🟡 | I documenti non sono protocollati né conservati a norma: l'app va affiancata al sistema di protocollo e conservazione dell'ente. I campi di protocollo sono già presenti. |
| Codice dei contratti (D.Lgs. 36/2023) | ✅ | Gestionale di monitoraggio, non piattaforma di approvvigionamento: non richiede la certificazione delle piattaforme di e-procurement. Non deve essere usato per svolgere le gare. |

## Riuso (CAD artt. 68-69, Linee guida AgID sul software)

| Requisito | Stato | Note |
|---|---|---|
| Licenza aperta | ✅ | EUPL-1.2. |
| `publiccode.yml` | 🟡 | Presente; completare titolare e contatti di manutenzione, poi validarlo. |
| Documentazione di installazione | 🟡 | `supabase/README.md`; manca un README generale con l'installazione completa. |
