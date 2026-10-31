import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { privacyConfig as c } from './lib/privacy'

// Informativa sul trattamento dei dati personali (artt. 13-14 Reg. UE 2016/679).
// I dati identificativi del titolare, del DPO e dei responsabili sono in
// src/lib/privacy.ts e devono essere completati e validati dall'ente/DPO.

export default function PrivacyNotice() {
  const back = () => { if (history.length > 1) history.back(); else location.hash = '' }
  return (
    <div className="auth-shell">
      <main className="auth-card" style={{ width: 'min(820px, 100%)', textAlign: 'left', lineHeight: 1.55 }}>
        <button className="link-btn" onClick={back}><ArrowLeft size={15} aria-hidden="true" /> Torna indietro</button>
        <div className="auth-title">
          <h1>Informativa sul trattamento dei dati personali</h1>
          <p>Ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018. Versione {c.versione} del {c.dataVersione}.</p>
        </div>

        <section>
          <h2>1. Titolare del trattamento</h2>
          <p>{c.titolare.denominazione}, {c.titolare.indirizzo}. PEC: {c.titolare.pec}.</p>
        </section>

        <section>
          <h2>2. Responsabile della protezione dei dati (DPO)</h2>
          <p>{c.dpo.nominativo}, contattabile all'indirizzo {c.dpo.email}.</p>
        </section>

        <section>
          <h2>3. Finalità e base giuridica</h2>
          <ul>
            <li>Gestione del patrimonio immobiliare, degli impianti, delle manutenzioni e degli interventi di lavori e servizi dell'ente; gestione delle richieste di intervento presentate dagli istituti scolastici. Base giuridica: esecuzione di compiti di interesse pubblico e di obblighi di legge (art. 6, par. 1, lett. c ed e GDPR; art. 2-ter D.Lgs. 196/2003).</li>
            <li>Gestione degli account degli utenti abilitati, autenticazione e controllo degli accessi. Base giuridica: art. 6, par. 1, lett. e GDPR.</li>
            <li>Sicurezza del sistema e tracciabilità delle operazioni (registro modifiche). Base giuridica: art. 6, par. 1, lett. c ed e e art. 32 GDPR.</li>
          </ul>
        </section>

        <section>
          <h2>4. Categorie di dati trattati</h2>
          <ul>
            <li>Dati identificativi e di contatto degli utenti: nome, cognome, email, telefono, ente e ruolo.</li>
            <li>Dati di autenticazione e di utilizzo: credenziali (conservate in forma cifrata), fattore di autenticazione, data dell'ultimo accesso e registro delle modifiche effettuate.</li>
            <li>Dati contenuti nelle richieste, negli atti e nei documenti caricati (ad esempio referenti di imprese e professionisti).</li>
          </ul>
          <p>Il sistema non è destinato al trattamento di categorie particolari di dati (art. 9 GDPR) né di dati giudiziari (art. 10 GDPR): gli utenti non devono inserirli nei campi descrittivi o negli allegati.</p>
        </section>

        <section>
          <h2>5. Natura del conferimento</h2>
          <p>Il conferimento dei dati degli utenti è necessario per l'abilitazione all'uso del sistema; in mancanza non è possibile accedere.</p>
        </section>

        <section>
          <h2>6. Modalità del trattamento e destinatari</h2>
          <p>I dati sono trattati con strumenti informatici dal personale autorizzato dell'ente (art. 29 GDPR e art. 2-quaterdecies D.Lgs. 196/2003), secondo il principio del minimo privilegio. Sono destinatari, in qualità di responsabili del trattamento ai sensi dell'art. 28 GDPR:</p>
          <ul>{c.responsabili.map((r) => <li key={r.nome}>{r.nome}: {r.ruolo}</li>)}</ul>
          <p>I dati non sono diffusi e non sono oggetto di decisioni basate unicamente su trattamenti automatizzati, compresa la profilazione.</p>
        </section>

        <section>
          <h2>7. Trasferimenti verso paesi terzi</h2>
          <p>{c.trasferimenti}</p>
        </section>

        <section>
          <h2>8. Periodo di conservazione</h2>
          <ul>
            <li>Dati degli account: per la durata dell'abilitazione e per {c.conservazione.accountDopoDisattivazione} dopo la disattivazione.</li>
            <li>Registro delle modifiche: {c.conservazione.registroModifiche}.</li>
            <li>Dati e documenti relativi a interventi e procedimenti: secondo il piano di conservazione e il massimario di scarto dell'ente.</li>
          </ul>
        </section>

        <section>
          <h2>9. Strumenti tecnici nel browser</h2>
          <p>L'applicazione utilizza esclusivamente memorizzazione locale tecnica (localStorage) necessaria al mantenimento della sessione autenticata e delle preferenze di visualizzazione. Non sono utilizzati cookie di profilazione né strumenti di analisi statistica di terze parti.</p>
        </section>

        <section>
          <h2>10. Diritti dell'interessato</h2>
          <p>L'interessato può esercitare i diritti di accesso, rettifica, cancellazione, limitazione e opposizione previsti dagli artt. 15-22 GDPR, nei limiti di cui all'art. 17, par. 3 e all'art. 21 GDPR, scrivendo al titolare o al DPO ai recapiti indicati. È inoltre possibile proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).</p>
        </section>

        <div className="security-note"><ShieldCheck size={16} aria-hidden="true" /><span>Ultimo aggiornamento: {c.dataVersione}.</span></div>
      </main>
    </div>
  )
}
