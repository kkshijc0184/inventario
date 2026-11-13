// ---- Autenticacion (Supabase Auth) ----
// session = { access_token, refresh_token, expires_at, user }
let session = null;

async function authRequest(grantType, body){
  const res = await fetch(SUPA_URL + '/auth/v1/token?grant_type=' + grantType, {
    method: 'POST',
    headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok){
    throw new Error(data.error_description || data.msg || 'No se pudo autenticar');
  }
  return data;
}

function saveSession(data){
  session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in ? data.expires_in*1000 : 3600*1000),
    user: data.user || null
  };
  lcSet(LS_PREFIX + 'refresh_token', session.refresh_token);
}

function clearSession(){
  session = null;
  lcDel(LS_PREFIX + 'refresh_token');
}

async function signIn(email, password){
  const data = await authRequest('password', { email, password });
  saveSession(data);
  return session;
}

async function signOut(){
  if(session && session.access_token){
    try{
      await fetch(SUPA_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + session.access_token }
      });
    }catch(e){ /* ignorar errores al cerrar sesion */ }
  }
  clearSession();
}

// Recupera la sesion guardada al recargar la pagina.
// Devuelve true si quedo una sesion valida, false si hay que mostrar el login.
async function restoreSession(){
  const rt = lcGet(LS_PREFIX + 'refresh_token');
  if(!rt) return false;
  try{
    const data = await authRequest('refresh_token', { refresh_token: rt });
    saveSession(data);
    return true;
  }catch(e){
    clearSession();
    return false;
  }
}

// Asegura que el access_token siga vigente antes de cada peticion.
async function ensureFreshSession(){
  if(!session) return false;
  if(session.expires_at - Date.now() > 30000) return true;
  try{
    const data = await authRequest('refresh_token', { refresh_token: session.refresh_token });
    saveSession(data);
    return true;
  }catch(e){
    clearSession();
    return false;
  }
}
