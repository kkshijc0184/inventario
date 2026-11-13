// ---- Estado y roles de la aplicación ----
// Roles:
//   admin     (encargado) -> agrega/edita bienes, registra préstamos, gestiona docentes
//   directivo             -> solo consulta y exporta
// La protección real está en las políticas RLS de Supabase; esto solo adapta la interfaz.

function esAdmin(){ return !!perfil && perfil.rol === 'admin'; }
function esDirectivo(){ return !!perfil && perfil.rol === 'directivo'; }

function nombreRol(rol){
  if(rol === 'admin') return 'Administrador';
  if(rol === 'directivo') return 'Directivo';
  return rol || '';
}

// Si Supabase devuelve 401, el usuario vuelve a la pantalla de login.
function onSessionExpired(){
  bienes = []; prestamos = []; historial = []; docentes = []; docentesRows = []; perfil = null;
  window.location.replace('login.html');
}

function actualizarBadgeUsuario(){
  const badge = document.getElementById('userBadge');
  if(!badge) return;
  if(!perfil){ badge.hidden = true; badge.textContent = ''; return; }
  const nombre = perfil.nombre || (session && session.user && session.user.email) || '';
  badge.textContent = (nombre ? nombre + ' \u00b7 ' : '') + nombreRol(perfil.rol);
  badge.hidden = false;
}

function applyRoleUI(){
  actualizarBadgeUsuario();
  const card = document.getElementById('docFormCard');
  if(card) card.hidden = !esAdmin();
  const aviso = document.getElementById('docAvisoLectura');
  if(aviso) aviso.hidden = esAdmin();
}

// ---- Carga inicial ----
async function loadData(){
  showToast('Conectando con la base de datos\u2026', 'ok');
  await loadPerfil();

  if(!perfil){
    await Swal.fire({
      title: 'Sin acceso',
      text: 'Tu cuenta no tiene un rol asignado. Pide al administrador que te habilite.',
      icon: 'warning', confirmButtonText: 'Entendido'
    });
    await signOut();
    window.location.replace('login.html');
    return;
  }

  await Promise.all([loadDocentes(), loadInventarioDatos()]);
  showToast('Datos cargados correctamente \u2713', 'ok');
  renderAll();
  applyRoleUI();
}

function renderAll(){
  renderInventario();
  renderPrestamos();
  renderDocentes();
}
