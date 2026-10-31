import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, LogOut, ShieldCheck, Smartphone } from 'lucide-react'
import { supabase } from './lib/supabase'

// Autenticazione a due fattori (TOTP) obbligatoria per tutti gli utenti.
// Disattivabile solo in sviluppo con VITE_MFA_REQUIRED=false.
const MFA_REQUIRED = String(import.meta.env.VITE_MFA_REQUIRED ?? 'true').toLowerCase() !== 'false'

type Step =
  | { kind: 'checking' }
  | { kind: 'ok' }
  | { kind: 'challenge'; factorId: string }
  | { kind: 'enroll'; factorId: string; qr: string; secret: string }
  | { kind: 'error'; message: string }

type Props = { session: any; onLogout: () => Promise<void>; children: ReactNode }

export default function MfaGate({ session, onLogout, children }: Props) {
  const [step, setStep] = useState<Step>({ kind: MFA_REQUIRED ? 'checking' : 'ok' })
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!MFA_REQUIRED) return
    let cancelled = false
    const evaluate = async () => {
      try {
        const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalError) throw aalError
        if (aal.currentLevel === 'aal2') { if (!cancelled) setStep({ kind: 'ok' }); return }

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
        if (factorsError) throw factorsError
        const verified = factors.totp.find((f) => f.status === 'verified')
        if (verified) { if (!cancelled) setStep({ kind: 'challenge', factorId: verified.id }); return }

        // Nessun fattore verificato: rimuove eventuali registrazioni incomplete e ne avvia una nuova.
        for (const f of factors.all.filter((f) => f.factor_type === 'totp' && f.status !== 'verified')) {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
        const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `Gestione Appalti ${new Date().toISOString().slice(0, 10)}`,
        })
        if (enrollError) throw enrollError
        if (!cancelled) setStep({ kind: 'enroll', factorId: enrolled.id, qr: enrolled.totp.qr_code, secret: enrolled.totp.secret })
      } catch (err: any) {
        if (!cancelled) setStep({ kind: 'error', message: err?.message || 'Verifica del secondo fattore non disponibile.' })
      }
    }
    void evaluate()
    return () => { cancelled = true }
  }, [session?.access_token])

  async function verify(e: FormEvent) {
    e.preventDefault()
    if (step.kind !== 'challenge' && step.kind !== 'enroll') return
    setBusy(true); setError('')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: step.factorId, code: code.trim() })
    setBusy(false)
    if (error) { setError('Codice non valido o scaduto. Riprova con il codice attuale.'); return }
    setCode('')
    setStep({ kind: 'ok' })
  }

  if (step.kind === 'ok') return <>{children}</>
  if (step.kind === 'checking') return <div className="loading-screen">Verifica del secondo fattore…</div>

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-title">
          <h1>{step.kind === 'enroll' ? 'Attiva la verifica in due passaggi' : 'Verifica in due passaggi'}</h1>
          {step.kind === 'enroll' && (
            <p>Per accedere al sistema è obbligatorio un secondo fattore. Inquadra il codice QR con un'app di autenticazione (ad esempio Microsoft Authenticator, Google Authenticator o FreeOTP) e inserisci il codice a 6 cifre generato.</p>
          )}
          {step.kind === 'challenge' && <p>Inserisci il codice a 6 cifre generato dall'app di autenticazione associata al tuo account.</p>}
        </div>

        {step.kind === 'error' && <div className="notice error" role="alert">{step.message}</div>}

        {step.kind === 'enroll' && (
          <div className="form-stack">
            <img src={step.qr} alt="Codice QR per configurare l'app di autenticazione" width={200} height={200} style={{ alignSelf: 'center', background: '#fff', padding: 8, borderRadius: 8 }} />
            <p className="muted" style={{ wordBreak: 'break-all' }}>
              <Smartphone size={15} aria-hidden="true" /> Se non puoi inquadrare il QR, inserisci manualmente la chiave: <code>{step.secret}</code>
            </p>
          </div>
        )}

        {(step.kind === 'enroll' || step.kind === 'challenge') && (
          <form onSubmit={verify} className="form-stack">
            <label>Codice di verifica
              <div className="input-icon">
                <KeyRound size={17} aria-hidden="true" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  required
                  autoFocus
                  aria-describedby={error ? 'mfa-error' : undefined}
                  placeholder="123456"
                />
              </div>
            </label>
            <button className="btn primary full" disabled={busy || code.length !== 6}>{busy ? 'Verifica…' : 'Verifica e accedi'}</button>
          </form>
        )}

        {error && <div id="mfa-error" className="notice error" role="alert">{error}</div>}

        <button className="link-btn" onClick={() => void onLogout()}><LogOut size={15} aria-hidden="true" /> Esci</button>
        <div className="security-note"><ShieldCheck size={16} aria-hidden="true" /><span>Il secondo fattore protegge l'account anche in caso di furto della password.</span></div>
        <a className="link-btn" href="#/privacy">Informativa privacy</a>
      </div>
    </div>
  )
}
