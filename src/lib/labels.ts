// Etichette leggibili per i ruoli applicativi (mai mostrare i codici tecnici).
const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Amministratore di sistema',
  admin_ente: 'Admin ente',
  rup: 'RUP',
  tecnico: 'Tecnico',
  amministrativo: 'Amministrativo',
  direttore_lavori: 'Direttore lavori',
  auditor: 'Auditor',
  consultatore: 'Consultatore',
  manutentore: 'Manutentore',
  siservizi: 'Società in house',
  dirigente_scolastico: 'Dirigente scolastico',
  delegato_scolastico: 'Delegato scolastico',
  'non assegnato': 'Nessun ruolo assegnato',
}

export function roleLabel(role: string | null | undefined): string {
  const key = String(role || '').trim()
  if (!key) return 'Nessun ruolo assegnato'
  return ROLE_LABELS[key] || key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
