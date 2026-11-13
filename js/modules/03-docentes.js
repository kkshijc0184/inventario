// ---- Docentes (quienes reciben préstamos) ----
// admin: agrega, edita, activa/desactiva y elimina. directivo: solo consulta.

let pagDoc = 1;
function dEl(id){ return document.getElementById(id); }

// Convierte texto pegado (uno por línea, o separado por ; ) en una lista de nombres limpios y sin repetir.
function nombresDesdeTexto(texto){
  const vistos = new Set();
  return String(texto || '')
    .split(/[\n;]+/)
    .map(n => n.replace(/\s+/g, ' ').trim())
    .filter(n => {
      if(!n) return false;
      const k = n.toLowerCase();
      if(vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
}

function renderDocentes(){
  const wrap = dEl('docTableWrap');
  if(!wrap) return;
  const editar = esAdmin();

  const activos = docentesRows.filter(d => d.activo !== false).length;
  dEl('docStats').innerHTML =
    statCard('Docentes activos', activos, '👩‍🏫', 'green', 'Disponibles para préstamos') +
    statCard('Inactivos', docentesRows.length - activos, '🗂️', 'amber', 'No aparecen al prestar');

  const palabras = (dEl('docBuscar').value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const lista = docentesRows.filter(d => palabras.every(w => d.nombre.toLowerCase().includes(w)));

  if(!lista.length){
    wrap.innerHTML = '<div class="empty">No hay docentes para mostrar.</div>';
    dEl('pagNavDoc').innerHTML = ''; dEl('pagInfoDoc').textContent = '';
    return;
  }

  const ps = parseInt(dEl('pagSizeDoc').value, 10) || 10;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / ps));
  pagDoc = Math.min(Math.max(pagDoc, 1), totalPaginas);
  const inicio = (pagDoc - 1) * ps;
  const vis = ps >= 9999 ? lista : lista.slice(inicio, inicio + ps);
  dEl('pagInfoDoc').textContent = ps >= 9999 ? `${lista.length} docentes` : `${inicio + 1}–${inicio + vis.length} de ${lista.length}`;

  wrap.innerHTML = `<div class="inv-scroll"><table>
    <thead><tr><th>Nombre</th><th>Estado</th><th></th></tr></thead>
    <tbody>${vis.map(d => {
      const activo = d.activo !== false;
      const acc = !editar ? '' : `
        <button class="btn small secondary" onclick="${jsCall('editarDocente', d.id)}">Editar</button>
        <button class="btn small secondary" onclick="${jsCallWithThis('alternarDocente', d.id)}">${activo ? 'Desactivar' : 'Activar'}</button>
        <button class="btn small danger" onclick="${jsCall('eliminarDocente', d.id)}">Eliminar</button>`;
      return `<tr class="${activo ? '' : 'inv-baja'}">
        <td>${escapeHtml(d.nombre)}</td>
        <td><span class="request-status ${activo ? 'lista' : 'cancelada'}">${activo ? 'Activo' : 'Inactivo'}</span></td>
        <td class="inv-acciones">${acc}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  buildPagNav('pagNavDoc', totalPaginas, pagDoc, (p)=>{ pagDoc = p; renderDocentes(); });
}

async function refrescarDocentes(){
  await loadDocentes();
  renderDocentes();
  if(typeof poblarDocentesPrestamo === 'function') poblarDocentesPrestamo();
}

async function agregarDocentesUI(){
  if(!esAdmin()) return;
  const nombres = nombresDesdeTexto(dEl('docNuevos').value);
  if(!nombres.length){ showToast('Escribe al menos un nombre.', 'error'); return; }

  const existentes = new Set(docentesRows.map(d => d.nombre.toLowerCase()));
  const nuevos = nombres.filter(n => !existentes.has(n.toLowerCase()));
  const repetidos = nombres.length - nuevos.length;
  if(!nuevos.length){ showToast('Esos docentes ya existen.', 'error'); return; }

  const btn = dEl('docAddBtn');
  btn.disabled = true;
  const ok = await insertDocentesDB(nuevos);
  btn.disabled = false;
  if(!ok) return;
  dEl('docNuevos').value = '';
  await refrescarDocentes();
  showToast(`${nuevos.length} docente(s) agregado(s)` + (repetidos ? ` · ${repetidos} ya existía(n)` : ''), 'ok');
}

async function editarDocente(id){
  if(!esAdmin()) return;
  const d = docentesRows.find(x => x.id === id);
  if(!d) return;
  const { value } = await Swal.fire({
    title: 'Editar docente', input: 'text', inputValue: d.nombre,
    showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
    inputValidator: v => (!v || !v.trim()) ? 'Escribe el nombre' : undefined
  });
  if(value === undefined) return;
  const nombre = value.replace(/\s+/g, ' ').trim();
  if(nombre === d.nombre) return;
  if(await updateDocenteDB(id, { nombre })){
    await refrescarDocentes();
    showToast('Nombre actualizado', 'ok');
  }
}

async function alternarDocente(btn, id){
  if(!esAdmin()) return;
  const d = docentesRows.find(x => x.id === id);
  if(!d) return;
  btn.disabled = true;
  const ok = await updateDocenteDB(id, { activo: d.activo === false });
  if(ok) await refrescarDocentes(); else btn.disabled = false;
}

async function eliminarDocente(id){
  if(!esAdmin()) return;
  const d = docentesRows.find(x => x.id === id);
  if(!d) return;
  const r = await Swal.fire({
    title: '¿Eliminar a ' + d.nombre + '?',
    text: 'Los préstamos ya registrados no se pierden. Si solo dejó de trabajar aquí, es mejor desactivarlo.',
    icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
  });
  if(!r.isConfirmed) return;
  if(await deleteDocenteDB(id)){
    await refrescarDocentes();
    showToast('Docente eliminado', 'ok');
  }
}

// Atajo desde "Nuevo préstamo": agrega un docente sin salir de la pestaña.
async function agregarDocenteRapido(){
  if(!esAdmin()) return;
  const { value } = await Swal.fire({
    title: 'Nuevo docente', input: 'text', inputPlaceholder: 'Apellidos y nombres',
    showCancelButton: true, confirmButtonText: 'Agregar', cancelButtonText: 'Cancelar',
    inputValidator: v => (!v || !v.trim()) ? 'Escribe el nombre' : undefined
  });
  if(value === undefined) return;
  const nombre = value.replace(/\s+/g, ' ').trim();
  if(docentesRows.some(d => d.nombre.toLowerCase() === nombre.toLowerCase())){
    showToast('Ese docente ya existe.', 'error');
    return;
  }
  if(await insertDocentesDB([nombre])){
    await refrescarDocentes();
    dEl('prDocente').value = nombre;
    showToast('Docente agregado', 'ok');
  }
}

// ---------- Importar / plantilla Excel ----------
function descargarPlantillaDocentes(){
  if(typeof XLSX === 'undefined' || !XLSX.utils){ showToast('No se pudo cargar el módulo de Excel. Recarga la página.', 'error'); return; }
  const ws = XLSX.utils.aoa_to_sheet([['nombre','activo'],['PEREZ LOPEZ, ANA','SI'],['GARCIA RUIZ, JUAN','SI']]);
  ws['!cols'] = [{wch:36},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Docentes');
  XLSX.writeFile(wb, 'plantilla_docentes.xlsx');
}

function valorActivoExcel(v){
  const s = String(v ?? '').trim().toLowerCase();
  if(!s) return true;
  if(['no','n','false','0','inactivo','inactiva'].includes(s)) return false;
  return true;
}

// Lee la primera hoja. Usa la columna "nombre" (o "docente"); si no hay
// encabezado reconocible, toma la primera columna.
function leerDocentesDeExcel(buffer){
  const wb = XLSX.read(buffer, { type: 'array' });
  const filas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', blankrows: false });
  if(!filas.length) return [];
  const cab = filas[0].map(c => String(c).trim().toLowerCase());
  let iNom = cab.findIndex(c => ['nombre','nombres','docente','docentes','apellidos y nombres'].includes(c));
  const iAct = cab.findIndex(c => c === 'activo');
  const hayCabecera = iNom !== -1;
  if(!hayCabecera) iNom = 0;
  const vistos = new Set();
  const out = [];
  filas.slice(hayCabecera ? 1 : 0).forEach(f => {
    const nombre = String(f[iNom] ?? '').replace(/\s+/g, ' ').trim();
    if(!nombre || vistos.has(nombre.toLowerCase())) return;
    vistos.add(nombre.toLowerCase());
    out.push({ nombre, activo: iAct === -1 ? true : valorActivoExcel(f[iAct]) });
  });
  return out;
}

async function importarDocentesExcel(file){
  if(!esAdmin() || !file) return;
  if(typeof XLSX === 'undefined' || !XLSX.read){ showToast('No se pudo cargar el módulo de Excel. Recarga la página.', 'error'); return; }
  let lista;
  try{
    lista = leerDocentesDeExcel(await file.arrayBuffer());
  }catch(e){
    console.error(e);
    showToast('No se pudo leer el archivo. Verifica que sea un Excel válido.', 'error');
    return;
  }
  const existentes = new Set(docentesRows.map(d => d.nombre.toLowerCase()));
  const nuevos = lista.filter(d => !existentes.has(d.nombre.toLowerCase()));
  const omitidos = lista.length - nuevos.length;
  if(!lista.length){ showToast('El archivo no tiene docentes. Revisa la columna "nombre".', 'error'); return; }
  if(!nuevos.length){ showToast('Todos los docentes del archivo ya existen.', 'error'); return; }

  const r = await Swal.fire({
    title: `Importar ${nuevos.length} docente(s)`,
    html: `<p style="margin:0">${omitidos ? omitidos + ' ya existen y se omitirán. ' : ''}Primeros nombres:</p>
      <p style="margin:8px 0 0;text-align:left">${nuevos.slice(0, 5).map(d => escapeHtml(d.nombre)).join('<br>')}${nuevos.length > 5 ? '<br>…' : ''}</p>`,
    showCancelButton: true, confirmButtonText: 'Importar', cancelButtonText: 'Cancelar'
  });
  if(!r.isConfirmed) return;

  try{
    await sbFetch('docentes', { method:'POST', prefer:'return=minimal', body: nuevos });
  }catch(e){
    console.error(e);
    showToast('No se pudo importar. Verifica tu conexión o los permisos.', 'error');
    return;
  }
  await refrescarDocentes();
  showToast(`${nuevos.length} docente(s) importado(s)` + (omitidos ? ` · ${omitidos} omitido(s)` : ''), 'ok');
}

// ---------- Eventos ----------
dEl('docAddBtn')?.addEventListener('click', agregarDocentesUI);
dEl('docBuscar')?.addEventListener('input', () => { pagDoc = 1; renderDocentes(); });
dEl('pagSizeDoc')?.addEventListener('change', () => { pagDoc = 1; renderDocentes(); });
dEl('docReloadBtn')?.addEventListener('click', async () => { await refrescarDocentes(); showToast('Docentes actualizados ✓', 'ok'); });
dEl('prNuevoDocenteBtn')?.addEventListener('click', agregarDocenteRapido);
dEl('docPlantillaBtn')?.addEventListener('click', descargarPlantillaDocentes);
dEl('docImportBtn')?.addEventListener('click', () => dEl('docImportInput').click());
dEl('docImportInput')?.addEventListener('change', async (e) => {
  const input = e.target;
  const file = input.files[0];
  input.disabled = true;
  try{ await importarDocentesExcel(file); }
  finally{ input.value = ''; input.disabled = false; }
});
