import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])'

/**
 * Comportamento accessibile per le finestre modali (WCAG 2.1.2, 2.4.3):
 * focus iniziale dentro la finestra, Tab confinato, chiusura con Esc
 * e ritorno del focus all'elemento che l'aveva aperta.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, onClose?: () => void, active = true) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const node = ref.current
    if (!active || !node) return
    const previous = document.activeElement as HTMLElement | null
    const items = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
    // Focus iniziale: primo campo del modulo, altrimenti il primo elemento attivabile.
    const visible = (el: HTMLElement) => el.offsetParent !== null && !el.hidden && el.getAttribute('type') !== 'file'
    const fields = Array.from(node.querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter(visible)
    const first = fields[0] || items()[0] || node
    try { first.focus({ preventScroll: true }) } catch { /* ignora */ }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeRef.current) { e.stopPropagation(); closeRef.current(); return }
      if (e.key !== 'Tab') return
      e.stopPropagation()
      const list = items()
      if (!list.length) { e.preventDefault(); return }
      const a = list[0]; const z = list[list.length - 1]
      if (e.shiftKey && (document.activeElement === a || !node.contains(document.activeElement))) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && (document.activeElement === z || !node.contains(document.activeElement))) { e.preventDefault(); a.focus() }
    }
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      if (previous && document.contains(previous)) { try { previous.focus({ preventScroll: true }) } catch { /* ignora */ } }
    }
  }, [ref, active])
}

type Props = { title: string; close: () => void; children: ReactNode }

export default function Modal({ title, close, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useDialog(ref, close)
  return (
    <div className="modal-backdrop">
      <div className="modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Chiudi finestra" title="Chiudi"><X aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
