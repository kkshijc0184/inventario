// ---- Etiquetas (stickers) de bienes ----
// Genera hojas A4 con stickers circulares iguales al modelo de la I.E.
// (escudo al centro, nombre de la I.E. en arco, código del bien abajo y,
// opcionalmente, la serie del equipo). Se imprimen o se guardan como PDF
// desde la ventana de vista previa. Disponible para admin y directivo.

// Grupos de equipos con prioridad (el primero es el más importante).
// Se detectan por palabras en la denominación del bien.
const ETQ_GRUPOS = [
  { clave: 'laptop',    nombre: 'Laptops',            patron: /laptop|notebook|netbook|port[aá]til|\bxo\b/i },
  { clave: 'proyector', nombre: 'Proyectores',        patron: /proyector|multimedia/i },
  { clave: 'pc',        nombre: 'Computadoras',       patron: /computador|\bcpu\b|\bpc\b|all[\s-]*in[\s-]*one|desktop|torre/i },
  { clave: 'tablet',    nombre: 'Tablets',            patron: /tablet|tableta|ipad/i },
  { clave: 'monitor',   nombre: 'Monitores y TV',     patron: /monitor|televisor|\btv\b|pantalla/i },
  { clave: 'impresora', nombre: 'Impresoras',         patron: /impresora|multifuncional|fotocopiadora|esc[aá]ner|scanner/i },
  { clave: 'audio',     nombre: 'Audio y cámaras',    patron: /parlante|altavoz|amplificador|micr[oó]fono|c[aá]mara|bocina/i }
];

// Tamaños disponibles (diámetro en mm) y separación entre stickers.
const ETQ_TAMANOS = {
  '60': { d: 60, gap: 5, nombre: '60 mm (igual al modelo)' },
  '45': { d: 45, gap: 4, nombre: '45 mm' },
  '35': { d: 35, gap: 4, nombre: '35 mm' }
};

let pagEtq = 1;
const etqSel = new Set();   // ids de bienes marcados
let etqVista = [];          // bienes que cumplen el filtro actual (en orden de prioridad)

function etqGrupoDe(b){
  const texto = String(b.denominacion || '');
  const i = ETQ_GRUPOS.findIndex(g => g.patron.test(texto));
  return i;   // -1 si no es de los equipos prioritarios
}

function etqEl(id){ return document.getElementById(id); }

// Estado permitido según el filtro "Estado": solo buenos (por defecto),
// buenos y regulares, o todos (incluye los malos).
function etqEstadoOk(b){
  const modo = etqEl('etqEstado') ? etqEl('etqEstado').value : 'B';
  const e = String(b.estado || '').trim().toLowerCase();
  if(modo === 'T') return true;
  if(modo === 'BR') return e === 'bueno' || e === 'regular';
  return e === 'bueno';
}

// Bienes que se pueden etiquetar: no están de baja y tienen el estado elegido.
function etqBase(){
  return bienes.filter(b => !b.baja && etqEstadoOk(b));
}

function etqFiltrar(){
  const tipo = etqEl('etqTipo').value;               // 'prio' | 'todos' | clave de grupo
  const palabras = (etqEl('etqBuscar').value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const soloSerie = etqEl('etqSoloSerie').checked;

  const lista = etqBase().map(b => ({ b, g: etqGrupoDe(b) })).filter(({ b, g }) => {
    if(tipo === 'prio' && g === -1) return false;
    if(tipo !== 'prio' && tipo !== 'todos' && (g === -1 || ETQ_GRUPOS[g].clave !== tipo)) return false;
    if(soloSerie && !String(b.serie || '').trim()) return false;
    const t = [b.id, b.denominacion, b.marca, b.modelo, b.serie].join(' ').toLowerCase();
    return palabras.every(w => t.includes(w));
  });

  // Prioridad: primero laptops, luego proyectores... y al final lo demás; dentro, por código.
  lista.sort((x, y) => {
    const px = x.g === -1 ? 99 : x.g, py = y.g === -1 ? 99 : y.g;
    return px - py || String(x.b.id).localeCompare(String(y.b.id), 'es', { numeric: true });
  });
  return lista;
}

function etqActualizarOpcionesTipo(){
  const sel = etqEl('etqTipo');
  const actual = sel.value || 'prio';
  const base = etqBase();
  const cuenta = ETQ_GRUPOS.map(() => 0);
  let prio = 0;
  base.forEach(b => { const g = etqGrupoDe(b); if(g !== -1){ cuenta[g]++; prio++; } });
  sel.innerHTML =
    `<option value="prio">Prioritarios: laptops, proyectores… (${prio})</option>` +
    ETQ_GRUPOS.map((g, i) => `<option value="${g.clave}">${escapeHtml(g.nombre)} (${cuenta[i]})</option>`).join('') +
    `<option value="todos">Todos los bienes (${base.length})</option>`;
  sel.value = [...sel.options].some(o => o.value === actual) ? actual : 'prio';
}

// Etiquetas que se imprimirán: una por bien, o una por unidad si es un lote y se marcó la opción.
function etqExpandir(){
  const porUnidad = etqEl('etqLotes').checked;
  const out = [];
  etqBase().filter(b => etqSel.has(b.id))
        .sort((a, b) => String(a.id).localeCompare(String(b.id), 'es', { numeric: true }))
        .forEach(b => {
    const n = porUnidad ? unidadesBien(b) : 1;
    for(let i = 0; i < n; i++) out.push({ codigo: b.id, serie: String(b.serie || '').trim() });
  });
  return out;
}

function etqGeometria(){
  const t = ETQ_TAMANOS[etqEl('etqTam').value] || ETQ_TAMANOS['60'];
  const margen = 8;
  const cols = Math.max(1, Math.floor((210 - 2 * margen + t.gap) / (t.d + t.gap)));
  const filas = Math.max(1, Math.floor((297 - 2 * margen + t.gap) / (t.d + t.gap)));
  return { ...t, cols, filas, porHoja: cols * filas };
}

function etqActualizarResumen(){
  const n = etqSel.size;
  const g = etqGeometria();
  const total = etqExpandir().length;
  const hojas = Math.ceil(total / g.porHoja);
  etqEl('etqResumen').innerHTML = n
    ? `<b>${n}</b> bien(es) seleccionado(s) · <b>${total}</b> etiqueta(s) · <b>${hojas}</b> hoja(s) A4 (${g.porHoja} por hoja)`
    : 'Marca los bienes que quieres etiquetar.';
  etqEl('etqGenerarBtn').disabled = total === 0;
}

function renderEtiquetas(){
  if(!etqEl('etqTableWrap')) return;
  etqActualizarOpcionesTipo();
  // Quita de la selección lo que ya no existe o se dio de baja
  const vivos = new Set(etqBase().map(b => b.id));
  [...etqSel].forEach(id => { if(!vivos.has(id)) etqSel.delete(id); });

  const lista = etqFiltrar();
  etqVista = lista.map(x => x.b);
  const wrap = etqEl('etqTableWrap');

  if(!lista.length){
    wrap.innerHTML = '<div class="empty">No hay bienes para mostrar con este filtro.</div>';
    etqEl('pagNavEtq').innerHTML = ''; etqEl('pagInfoEtq').textContent = '';
    etqActualizarResumen();
    return;
  }

  const ps = parseInt(etqEl('pagSizeEtq').value, 10) || 20;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / ps));
  pagEtq = Math.min(Math.max(pagEtq, 1), totalPaginas);
  const inicio = (pagEtq - 1) * ps;
  const vis = ps >= 9999 ? lista : lista.slice(inicio, inicio + ps);
  etqEl('pagInfoEtq').textContent = ps >= 9999 ? `${lista.length} bienes` : `${inicio + 1}–${inicio + vis.length} de ${lista.length}`;

  wrap.innerHTML = `<div class="inv-scroll"><table>
    <thead><tr><th></th><th>Código</th><th>Tipo</th><th>Denominación</th><th>Marca / modelo</th><th>Serie</th></tr></thead>
    <tbody>${vis.map(({ b, g }) => {
      const mm = ((b.marca || '') + ' ' + (b.modelo || '')).trim() || '—';
      const serie = b.serie ? escapeHtml(b.serie) : (b.cantidad ? `<span class="hint">Lote de ${b.cantidad}</span>` : '<span class="hint">Sin serie</span>');
      const tipo = g === -1 ? '—' : `<span class="request-status lista">${escapeHtml(ETQ_GRUPOS[g].nombre)}</span>`;
      return `<tr>
        <td><input type="checkbox" ${etqSel.has(b.id) ? 'checked' : ''} onchange="${jsCallWithThis('etqToggle', b.id)}" aria-label="Seleccionar ${escapeHtml(b.id)}" /></td>
        <td><b>${escapeHtml(b.id)}</b></td>
        <td>${tipo}</td>
        <td>${escapeHtml(b.denominacion || '')}</td>
        <td>${escapeHtml(mm)}</td>
        <td>${serie}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  buildPagNav('pagNavEtq', totalPaginas, pagEtq, (p) => { pagEtq = p; renderEtiquetas(); });
  etqActualizarResumen();
}

function etqToggle(el, id){
  if(el.checked) etqSel.add(id); else etqSel.delete(id);
  etqActualizarResumen();
}

function etqSeleccionarVisibles(){
  etqVista.forEach(b => etqSel.add(b.id));
  renderEtiquetas();
}
function etqLimpiarSeleccion(){
  etqSel.clear();
  renderEtiquetas();
}

// ---------- Escudo de la I.E. (se incrusta en la hoja para que no dependa de la red) ----------
let etqEscudoUri = null;
function etqCargarEscudo(){
  if(etqEscudoUri) return Promise.resolve(etqEscudoUri);
  return fetch('insignia.png')
    .then(r => { if(!r.ok) throw new Error('escudo'); return r.blob(); })
    .then(b => new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { etqEscudoUri = fr.result; res(etqEscudoUri); };
      fr.onerror = rej;
      fr.readAsDataURL(b);
    }))
    .catch(() => new URL('insignia.png', location.href).href);   // plan B: enlace directo
}

// ---------- Dibujo del sticker (SVG, medidas del modelo en mm) ----------
// Centro (0,0), radio exterior 30 mm. Mismas medidas y colores del PDF modelo.
let _etqCanvas = null;
function etqAnchoEm(texto){
  // Ancho del texto en "em" (Helvetica/Arial negrita) para ajustar el tamaño a lo disponible.
  if(!_etqCanvas) _etqCanvas = document.createElement('canvas').getContext('2d');
  _etqCanvas.font = 'bold 100px Helvetica, Arial, sans-serif';
  return _etqCanvas.measureText(texto).width / 100;
}
function etqFuente(texto, maximo, anchoMax){
  const em = etqAnchoEm(texto) || 1;
  return Math.max(Math.min(maximo, anchoMax / em), 1.2);
}
function etqFmt(n){ return Math.round(n * 1000) / 1000; }

function etqSvg(item, o, idx){
  const mostrarSerie = o.serie && item.serie;
  let abajo;
  if(mostrarSerie){
    // Con serie: código y serie van en arcos en la parte baja del anillo verde
    // (hay mucho más largo disponible que en línea recta, así la serie se lee mejor).
    const fc = etqFuente(item.codigo, 4.2, 24);
    const fs = etqFuente('S/N ' + item.serie, 3.0, 36);
    abajo =
      `<path id="abs${idx}" d="M -23.6 0 A 23.6 23.6 0 0 0 23.6 0" fill="none"/>` +
      `<path id="abc${idx}" d="M -27.5 0 A 27.5 27.5 0 0 0 27.5 0" fill="none"/>` +
      `<text font-size="${etqFmt(fs)}" font-weight="700" fill="#fff" text-anchor="middle"><textPath href="#abs${idx}" startOffset="50%">S/N ${escapeHtml(item.serie)}</textPath></text>` +
      `<text font-size="${etqFmt(fc)}" font-weight="700" fill="#fff" text-anchor="middle"><textPath href="#abc${idx}" startOffset="50%">${escapeHtml(item.codigo)}</textPath></text>`;
  }else{
    const fc = etqFuente(item.codigo, 4.6, 20.4);
    abajo = `<text x="0" y="26.4" font-size="${etqFmt(fc)}" text-anchor="middle" fill="#fff" font-weight="700">${escapeHtml(item.codigo)}</text>`;
  }
  const corte = o.corte ? '<circle r="30" fill="none" stroke="#ff00ff" stroke-width="0.1"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -30 60 60" width="${o.d}mm" height="${o.d}mm" style="overflow:visible" font-family="Helvetica, Arial, sans-serif">` +
    `<circle r="30" fill="#1e7a2e"/>` +
    `<circle r="28.8" fill="none" stroke="#fff" stroke-width="0.4"/>` +
    `<circle r="19.8" fill="#d81e1e"/><circle r="19" fill="#fff"/>` +
    `<use href="#escudo" x="-12.7" y="-13"/>` +
    `<path id="arco${idx}" d="M -22.6 0 A 22.6 22.6 0 0 1 22.6 0" fill="none"/>` +
    `<text font-size="4.6" font-weight="700" fill="#fff" text-anchor="middle"><textPath href="#arco${idx}" startOffset="50%">I.E. N° 0773 BARRANQUITA</textPath></text>` +
    abajo + corte + `</svg>`;
}

function etqHojasHtml(items, o){
  const g = etqGeometria();
  const anchoGrid = g.cols * g.d + (g.cols - 1) * g.gap;
  const x0 = (210 - anchoGrid) / 2;
  const altoGrid = g.filas * g.d + (g.filas - 1) * g.gap;
  const y0 = (297 - altoGrid) / 2;
  const hojas = [];
  for(let i = 0; i < items.length; i += g.porHoja){
    const chunk = items.slice(i, i + g.porHoja);
    hojas.push(`<div class="hoja">${chunk.map((it, k) => {
      const c = k % g.cols, f = Math.floor(k / g.cols);
      const x = x0 + c * (g.d + g.gap), y = y0 + f * (g.d + g.gap);
      return `<div class="et" style="left:${etqFmt(x)}mm;top:${etqFmt(y)}mm">${etqSvg(it, { ...o, d: g.d }, i + k)}</div>`;
    }).join('')}</div>`);
  }
  return hojas.join('');
}

async function generarEtiquetas(){
  const items = etqExpandir();
  if(!items.length){ showToast('Selecciona al menos un bien.', 'error'); return; }
  // La ventana se abre en el mismo clic para que el navegador no la bloquee.
  const w = window.open('', '_blank');
  if(!w){ showToast('El navegador bloqueó la ventana. Permite las ventanas emergentes para este sitio.', 'error'); return; }
  w.document.write('<p style="font:16px Arial;padding:24px">Preparando etiquetas…</p>');

  const g = etqGeometria();
  const o = {
    serie: etqEl('etqMostrarSerie').checked,
    corte: etqEl('etqCorte').checked
  };
  const escudo = await etqCargarEscudo();
  const hojas = etqHojasHtml(items, o);
  const nHojas = Math.ceil(items.length / g.porHoja);

  w.document.open();
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Etiquetas - ${escapeHtml(APP_NOMBRE)}</title>
<style>
  @page{ size:A4; margin:0 }
  *{ box-sizing:border-box }
  html,body{ margin:0; background:#d9dedb; font-family:Helvetica,Arial,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact }
  .barra{ position:sticky; top:0; z-index:5; display:flex; gap:14px; align-items:center; flex-wrap:wrap; padding:10px 16px; background:#0a3526; color:#fff; font-size:14px }
  .barra button{ background:#f2b632; color:#222; border:0; border-radius:8px; padding:9px 16px; font-weight:700; font-size:14px; cursor:pointer }
  .barra small{ opacity:.85 }
  .hoja{ position:relative; width:210mm; height:297mm; margin:16px auto; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.25); overflow:hidden; page-break-after:always; break-after:page }
  .hoja:last-child{ page-break-after:auto; break-after:auto }
  .et{ position:absolute; line-height:0 }
  @media print{
    .barra{ display:none }
    html,body{ background:#fff }
    .hoja{ margin:0; box-shadow:none }
  }
</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><image id="escudo" href="${escudo}" width="25.4" height="26"/></defs></svg>
<div class="barra">
  <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
  <span><b>${items.length}</b> etiqueta(s) · <b>${nHojas}</b> hoja(s) A4</span>
  <small>En el cuadro de impresión: tamaño A4, márgenes «Ninguno», escala 100 %.</small>
</div>
${hojas}
</body></html>`);
  w.document.close();
}

// ---------- Eventos ----------
etqEl('etqBuscar')?.addEventListener('input', () => { pagEtq = 1; renderEtiquetas(); });
etqEl('etqTipo')?.addEventListener('change', () => { pagEtq = 1; renderEtiquetas(); });
etqEl('etqSoloSerie')?.addEventListener('change', () => { pagEtq = 1; renderEtiquetas(); });
etqEl('etqEstado')?.addEventListener('change', () => { pagEtq = 1; renderEtiquetas(); });
etqEl('pagSizeEtq')?.addEventListener('change', () => { pagEtq = 1; renderEtiquetas(); });
['etqTam', 'etqLotes'].forEach(id => etqEl(id)?.addEventListener('change', etqActualizarResumen));
etqEl('etqSelTodosBtn')?.addEventListener('click', etqSeleccionarVisibles);
etqEl('etqSelNingunoBtn')?.addEventListener('click', etqLimpiarSeleccion);
etqEl('etqGenerarBtn')?.addEventListener('click', generarEtiquetas);
document.querySelector('[data-subtab="inv-etiquetas"]')?.addEventListener('click', () => { etqCargarEscudo(); renderEtiquetas(); });

