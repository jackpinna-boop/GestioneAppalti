import { useState, type FormEvent } from 'react'
import { KeyRound, LockKeyhole } from 'lucide-react'
import { supabase } from './lib/supabase'

// Schermata mostrata dopo il clic sul link di recupero password ricevuto via email.
// Viene visualizzata dopo l'eventuale verifica in due passaggi (Supabase richiede
// una sessione aal2 per cambiare la password di un account con il secondo fattore).
export default function PasswordRecovery({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La password deve avere almeno 8 caratteri.'); return }
    if (password !== confirm) { setError('Le due password non coincidono.'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(/same/i.test(error.message) ? 'La nuova password deve essere diversa dalla precedente.'
        : /weak|pwned|leaked/i.test(error.message) ? 'Password troppo debole o già comparsa in violazioni note: scegline un’altra.'
        : 'Impossibile aggiornare la password: ' + error.message)
      return
    }
    setDone(true)
  }

  return (
    <div className="auth-shell">
      <main className="auth-card">
        <div className="auth-title">
          <h1>Imposta una nuova password</h1>
          <p>Hai aperto il link di recupero. Scegli una nuova password per il tuo account.</p>
        </div>
        {done ? (
          <>
            <div className="notice success" role="status">Password aggiornata correttamente.</div>
            <button className="btn primary full" onClick={onDone}>Continua</button>
          </>
        ) : (
          <form onSubmit={submit} className="form-stack">
            <label>Nuova password
              <div className="input-icon"><LockKeyhole size={17} aria-hidden="true" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" autoFocus />
              </div>
            </label>
            <label>Conferma password
              <div className="input-icon"><KeyRound size={17} aria-hidden="true" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
            </label>
            <button className="btn primary full" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva la nuova password'}</button>
            {error && <div className="notice error" role="alert">{error}</div>}
          </form>
        )}
        {!done && <button className="link-btn" onClick={onCancel}>Annulla ed esci</button>}
      </main>
    </div>
  )
}
