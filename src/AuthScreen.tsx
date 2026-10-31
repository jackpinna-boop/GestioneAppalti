import { useState, type FormEvent } from 'react'
import { Building2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from './lib/supabase'

// Traduzione dei messaggi di errore più comuni del servizio di autenticazione.
function authMessage(msg: string): string {
  const m = String(msg || '')
  if (/invalid login credentials/i.test(m)) return 'Email o password non corretti.'
  if (/email not confirmed/i.test(m)) return 'Indirizzo email non ancora confermato. Controlla la posta in arrivo.'
  if (/rate limit|too many requests/i.test(m)) return 'Troppi tentativi. Attendi qualche minuto e riprova.'
  if (/failed to fetch|network/i.test(m)) return 'Impossibile contattare il server. Verifica la connessione e riprova.'
  if (/user not found/i.test(m)) return 'Utente non trovato.'
  return m || 'Accesso non riuscito.'
}

export default function AuthScreen() {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [loading,setLoading]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('')
  const redirectTo=window.location.origin+import.meta.env.BASE_URL
  async function submit(e:FormEvent){
  e.preventDefault();setLoading(true);setError('');setMessage('');
  try{
    const {data:current}=await supabase.auth.getSession();
    if(current.session){await supabase.auth.signOut({scope:'global'});}
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
    const user=data.user;
    if(!user)throw new Error('Autenticazione non completata.');
    const [{data:roles,error:rolesError},{data:profile,error:profileError}]=await Promise.all([
      supabase.from('user_roles').select('ente_id,ruolo').eq('user_id',user.id),
      supabase.from('profiles').select('id,attivo').eq('id',user.id).maybeSingle()
    ]);
    if(rolesError)throw new Error('Impossibile verificare i ruoli dell’utente: '+rolesError.message);
    if(profileError)throw new Error('Impossibile verificare lo stato dell’utente: '+profileError.message);
    if(!profile?.attivo)throw new Error('Account non abilitato. Rivolgiti all’amministratore dell’ente.');
    if(!roles?.length)throw new Error('Account autenticato ma non abilitato al sistema: nessun ruolo applicativo assegnato.');
    setMessage('Accesso effettuato.');
  }catch(err:any){
    try{await supabase.auth.signOut({scope:'global'});}catch{}
    setError(authMessage(err?.message));
  }finally{setLoading(false)}
}
  async function reset(){if(!email){setError('Inserisci prima l’indirizzo email.');return}setLoading(true);setError('');const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});if(error)setError(authMessage(error.message));else setMessage('Se l’account esiste, riceverai le istruzioni per reimpostare la password.');setLoading(false)}
  return <div className="auth-shell"><div className="auth-card"><div className="auth-brand"><div className="brand-mark"><Building2 size={25}/></div><div><strong>Gestione Patrimonio, Interventi e Manutenzioni</strong><span>Gestione del patrimonio e delle manutenzioni</span></div></div><div className="auth-title"><h1>Accesso al sistema</h1><p>Gestisci edifici, interventi, finanziamenti e fascicoli in un unico ambiente.</p></div><form onSubmit={submit} className="form-stack"><label>Email<div className="input-icon"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="nome@ente.it"/></div></label><label>Password<div className="input-icon"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="••••••••"/></div></label><button className="btn primary full" disabled={loading}>{loading?'Attendere…':'Accedi'}</button></form><button className="link-btn" onClick={reset} disabled={loading}>Password dimenticata?</button><div className="security-note"><ShieldCheck size={16} aria-hidden="true"/><span>Accesso protetto da autenticazione a due fattori e da controlli di accesso ai dati per ente e ruolo.</span></div><a className="link-btn" href="#/privacy">Informativa privacy</a>{message&&<div className="notice success" role="status">{message}</div>}{error&&<div className="notice error" role="alert">{error}</div>}</div></div>
}
