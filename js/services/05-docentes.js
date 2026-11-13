// ---- Docentes (quienes reciben los préstamos) ----
// docentesRows: todas las filas { id, nombre, activo }
// docentes: solo los nombres de los activos (para el selector de préstamos)
let docentesRows = [];
let docentes = [];

async function loadDocentes(){
  try{
    docentesRows = await sbFetchAll('docentes?select=id,nombre,activo&order=nombre.asc');
    docentes = docentesRows.filter(r => r.activo !== false).map(r => r.nombre);
  }catch(e){
    console.error('Error cargando docentes:', e);
    showToast('No se pudo cargar la lista de docentes.', 'error');
    docentesRows = []; docentes = [];
  }
}

async function insertDocentesDB(nombres){
  try{
    await sbFetch('docentes', {
      method: 'POST', prefer: 'return=minimal',
      body: nombres.map(n => ({ nombre: n.trim(), activo: true }))
    });
    return true;
  }catch(e){
    console.error('Error agregando docentes:', e);
    const m = String(e && e.message || '');
    if(m.includes('duplicate key') || m.includes('docentes_nombre_unico')) showToast('Ese docente ya existe.', 'error');
    else if(m.includes('row-level security') || m.includes('42501')) showToast('No tienes permiso para modificar docentes.', 'error');
    else showToast('No se pudo agregar. Verifica tu conexión.', 'error');
    return false;
  }
}

async function updateDocenteDB(id, cambios){
  try{
    await sbFetch('docentes?id=eq.' + encodeURIComponent(id), { method:'PATCH', prefer:'return=minimal', body: cambios });
    return true;
  }catch(e){
    console.error('Error actualizando docente:', e);
    const m = String(e && e.message || '');
    showToast(m.includes('duplicate key') ? 'Ya existe un docente con ese nombre.' : 'No se pudo guardar el cambio.', 'error');
    return false;
  }
}

async function deleteDocenteDB(id){
  try{
    await sbFetch('docentes?id=eq.' + encodeURIComponent(id), { method:'DELETE', prefer:'return=minimal' });
    return true;
  }catch(e){
    console.error('Error eliminando docente:', e);
    showToast('No se pudo eliminar.', 'error');
    return false;
  }
}
