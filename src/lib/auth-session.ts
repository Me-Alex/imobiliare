import type { Session, SupabaseClient } from '@supabase/supabase-js'

/** Auth events take precedence over a slower initial session read. Keep callbacks synchronous. */
export function observeAuthSession(
  auth: SupabaseClient['auth'],
  onSession: (session: Session | null) => void,
  onError: () => void,
) {
  let active = true
  let receivedEvent = false
  const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
    if (!active) return
    receivedEvent = true
    onSession(session)
  })
  void auth.getSession().then(({ data, error }) => {
    if (!active || receivedEvent) return
    if (error) onError()
    else onSession(data.session)
  }).catch(() => {
    if (active && !receivedEvent) onError()
  })
  return () => {
    active = false
    subscription.unsubscribe()
  }
}

export function authErrorMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'invalid_credentials': return 'Adresa de e-mail sau parola este incorectă.'
    case 'email_not_confirmed': return 'Confirmă adresa de e-mail folosind linkul primit înainte de autentificare.'
    case 'user_already_exists': return 'Există deja un cont cu această adresă de e-mail. Autentifică-te.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return 'Prea multe încercări. Așteaptă câteva minute și încearcă din nou.'
    case 'weak_password': return 'Alege o parolă mai puternică, cu litere, cifre și simboluri.'
    default: return 'Autentificarea nu a putut fi finalizată. Verifică datele și încearcă din nou.'
  }
}
