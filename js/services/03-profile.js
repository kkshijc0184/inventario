// ---- Perfil (rol del usuario logueado) ----
// perfil = { rol: 'admin'|'directivo', nombre }
//   admin     -> registra, edita y presta
//   directivo -> solo consulta y exporta
// Si el usuario no tiene fila en "perfiles", perfil queda en null y la app
// no le muestra nada (la base de datos tampoco le devuelve datos).
let perfil = null;

async function loadPerfil(){
  try{
    const data = await sbFetch('perfiles?select=rol,nombre&id=eq.' + session.user.id);
    perfil = data[0] || null;
  }catch(e){
    console.error('Error cargando perfil:', e);
    perfil = null;
  }
}

async function sbFetch(path, opts={}){
  if(session) await ensureFreshSession();
  const token = session ? session.access_token : SUPA_KEY;
  const res = await fetch(SUPA_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=representation',
      ...( opts.headers || {} )
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if(res.status === 401){
    clearSession();
    if(typeof onSessionExpired === 'function') onSessionExpired();
    throw new Error('Sesi\u00f3n expirada. Vuelve a iniciar sesi\u00f3n.');
  }
  if(!res.ok){
    const err = await res.text();
    throw new Error('Supabase error ' + res.status + ': ' + err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}
