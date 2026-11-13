// ---- Configuración de Supabase ----
// Pega aquí los datos de TU proyecto (Supabase > Project Settings > API):
//   SUPA_URL: la "Project URL"
//   SUPA_KEY: la clave pública (publishable / anon). NUNCA uses la service_role.
const SUPA_URL = 'https://kkatnxsudgfukproekfs.supabase.co';
const SUPA_KEY = 'sb_publishable_67pVfP4ZF7VzWMyoEmJsww_EgBML8nD';

// Prefijo para guardar datos locales del navegador (sesión).
const LS_PREFIX = 'inventario:';

function lcGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function lcSet(key, val){ try{ localStorage.setItem(key, val); }catch(e){} }
function lcDel(key){ try{ localStorage.removeItem(key); }catch(e){} }
