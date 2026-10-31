// Dati dell'informativa privacy (artt. 13-14 GDPR).
// TUTTI i valori segnati [DA COMPLETARE] devono essere compilati e validati
// dall'ente titolare e dal suo DPO prima della messa in produzione.

export const privacyConfig = {
  versione: '1.0',
  dataVersione: '31/10/2026',
  titolare: {
    denominazione: '[DA COMPLETARE: denominazione dell\'ente]',
    indirizzo: '[DA COMPLETARE: indirizzo della sede]',
    pec: '[DA COMPLETARE: PEC istituzionale]',
  },
  dpo: {
    nominativo: '[DA COMPLETARE: nominativo del DPO]',
    email: '[DA COMPLETARE: email del DPO]',
  },
  responsabili: [
    { nome: '[DA COMPLETARE: fornitore/manutentore del software]', ruolo: 'sviluppo, manutenzione e assistenza applicativa' },
    { nome: 'Supabase Inc.', ruolo: 'servizi di database, autenticazione e archiviazione dei file (infrastruttura cloud)' },
    { nome: 'GitHub Inc.', ruolo: 'pubblicazione dell\'interfaccia web (nessun dato applicativo archiviato)' },
  ],
  trasferimenti:
    '[DA COMPLETARE con il DPO] I dati sono ospitati presso data center nella regione indicata nel contratto con il fornitore cloud. ' +
    'Eventuali trasferimenti verso paesi terzi avvengono sulla base di una decisione di adeguatezza della Commissione europea ' +
    '(ad esempio EU-U.S. Data Privacy Framework) o di clausole contrattuali tipo (art. 46 GDPR).',
  conservazione: {
    accountDopoDisattivazione: '[DA COMPLETARE: ad es. 12 mesi]',
    registroModifiche: '[DA COMPLETARE: ad es. 10 anni, in coerenza con la conservazione degli atti dei procedimenti]',
  },
}
