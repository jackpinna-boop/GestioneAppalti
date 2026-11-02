import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

export type NotifyKind = 'error' | 'success' | 'info'
type Item = { id: number; text: string; kind: NotifyKind }

const EVENT = 'app-notify'
let seq = 0

export function guessKind(text: string): NotifyKind {
  if (/errore|non riuscit|impossibile|non valid|non consentit|obbligatori|seleziona|negat|fallit|denied|violat|invalid|failed|error/i.test(text)) return 'error'
  if (/salvat|aggiornat|creat|completat|registrat|eliminat|inviat|ripristinat|caricat|import/i.test(text)) return 'success'
  return 'info'
}

/** Mostra un messaggio in pagina (sostituisce window.alert). */
export function notify(message: unknown, kind?: NotifyKind) {
  const text = String((message as any)?.message ?? message ?? '').trim() || 'Operazione non riuscita.'
  window.dispatchEvent(new CustomEvent<Item>(EVENT, { detail: { id: ++seq, text, kind: kind || guessKind(text) } }))
}

/** Area notifiche (aria-live) montata una sola volta in main.tsx. */
export default function Notifications() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    const onNotify = (e: Event) => {
      const item = (e as CustomEvent<Item>).detail
      setItems((prev) => [...prev.filter((x) => x.text !== item.text), item].slice(-4))
      const ttl = item.kind === 'error' ? 9000 : 5000
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== item.id)), ttl)
    }
    // Errori asincroni non gestiti: almeno un avviso all'utente invece del silenzio.
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message || e.reason || '')
      if (!msg || /AbortError|aborted/i.test(msg)) return
      console.error('Errore non gestito:', e.reason)
      notify(/fetch|network|Load failed/i.test(msg) ? 'Connessione al server non riuscita. Verifica la rete e riprova.' : 'Operazione non riuscita: ' + msg, 'error')
    }
    window.addEventListener(EVENT, onNotify)
    window.addEventListener('unhandledrejection', onRejection)
    return () => { window.removeEventListener(EVENT, onNotify); window.removeEventListener('unhandledrejection', onRejection) }
  }, [])
  const dismiss = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id))
  return (
    <div className="toast-area" aria-live="polite" aria-atomic="false">
      {items.map((x) => (
        <div key={x.id} className={'toast ' + x.kind} role={x.kind === 'error' ? 'alert' : 'status'}>
          {x.kind === 'error' ? <CircleAlert size={18} aria-hidden="true" /> : x.kind === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
          <span>{x.text}</span>
          <button type="button" className="toast-close" onClick={() => dismiss(x.id)} aria-label="Chiudi notifica"><X size={16} aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  )
}

/** Classe CSS per i messaggi in pagina: rosso per gli errori, verde per gli esiti positivi. */
export function noticeClass(text: string) {
  const kind = guessKind(text)
  return 'notice ' + (kind === 'error' ? 'error' : kind === 'success' ? 'success' : 'info')
}
