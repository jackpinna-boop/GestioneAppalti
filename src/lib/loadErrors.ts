import { notify } from '../Notifications'

/**
 * Segnala in pagina gli errori di caricamento di una o più query Supabase,
 * invece di mostrare silenziosamente un elenco vuoto.
 * Restituisce true se almeno una query è fallita.
 */
export function reportLoadErrors(context: string, ...results: Array<{ error?: { message?: string } | null } | null | undefined>): boolean {
  const failed = results.filter((r) => r && r.error)
  if (!failed.length) return false
  failed.forEach((r) => console.error('Errore caricamento ' + context + ':', r!.error))
  notify('Impossibile caricare ' + context + ': ' + (failed[0]!.error!.message || 'errore sconosciuto') + '. Riprova o contatta l’amministratore.', 'error')
  return true
}
