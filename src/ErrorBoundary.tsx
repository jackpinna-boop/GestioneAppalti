import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

// Intercetta gli errori di rendering e mostra un messaggio in italiano
// invece di lasciare la pagina bianca.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Errore non gestito nell’interfaccia:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    // Dopo un nuovo rilascio i vecchi file JS possono non esistere più:
    // in quel caso basta ricaricare la pagina.
    const chunkError = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(String(error?.message || ''))
    return (
      <div className="error-screen" role="alert">
        <div className="error-card">
          <h1>Si è verificato un problema</h1>
          <p>
            {chunkError
              ? 'È disponibile una nuova versione dell’applicazione oppure la connessione si è interrotta. Ricarica la pagina per continuare.'
              : 'Non è stato possibile visualizzare questa sezione. Ricarica la pagina; se il problema persiste contatta l’amministratore del sistema.'}
          </p>
          <div className="error-actions">
            <button type="button" className="btn primary" onClick={() => window.location.reload()}>Ricarica</button>
            <button type="button" className="btn secondary" onClick={() => { window.location.hash = '#/dashboard'; window.location.reload() }}>Torna alla dashboard</button>
          </div>
          <details>
            <summary>Dettagli tecnici</summary>
            <pre>{String(error?.message || error)}</pre>
          </details>
        </div>
      </div>
    )
  }
}
