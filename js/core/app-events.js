// ---- Eventos generales y arranque ----

// Pestañas principales
document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('section.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab === 'inventario') renderInventario();
    if(btn.dataset.tab === 'prestamos') renderPrestamos();
    if(btn.dataset.tab === 'docentes') renderDocentes();
  });
});

// Sub-pestañas dentro de un panel
document.querySelectorAll('nav.subtabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const nav = btn.closest('nav.subtabs');
    const panel = btn.closest('section.panel');
    nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    panel.querySelectorAll(':scope > .subpanel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.subtab).classList.add('active');
  });
});

document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
  await signOut();
  bienes = []; prestamos = []; historial = []; docentes = []; docentesRows = []; perfil = null;
  window.location.replace('login.html');
});

async function init(){
  const restored = await restoreSession();
  if(!restored){
    window.location.replace('login.html');
    return;
  }
  const appRoot = document.getElementById('appRoot');
  if(appRoot) appRoot.hidden = false;
  await loadData();
}
