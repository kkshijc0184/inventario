// ---- Utilidades compartidas ----

// ---- Seguridad: escape de texto antes de insertarlo en el DOM ----
// Cualquier dato que venga de un input del usuario o de Supabase se pasa
// por aqui antes de insertarse con innerHTML, para que no se interprete
// como HTML/JS (por ejemplo si alguien escribe "<img onerror=...>" como
// nombre de docente).
function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Genera de forma segura un atributo onclick="fn(arg1,arg2,...)":
// los argumentos se convierten a literales JS validos (JSON.stringify)
// y el resultado completo se escapa para poder insertarse como valor
// de un atributo HTML sin riesgo de que alguien "rompa" el atributo.
function jsCall(fnName, ...args){
  const argsStr = args.map(a => JSON.stringify(a)).join(',');
  return escapeHtml(`${fnName}(${argsStr})`);
}

// Igual que jsCall, pero le pasa el propio boton (this) como primer argumento
// para poder desactivarlo mientras la accion esta en curso (evita doble clic).
function jsCallWithThis(fnName, ...args){
  const argsStr = ['this', ...args.map(a => JSON.stringify(a))].join(',');
  return escapeHtml(`${fnName}(${argsStr})`);
}

function statCard(label, valor, icono, color, pie){
  return `<div class="request-stat">
    <div class="cap">${escapeHtml(label)}</div>
    <div class="body">
      <span class="n">${valor}</span>
      <span class="ico ${color}">${icono}</span>
    </div>
    <div class="foot">${escapeHtml(pie||'')}</div>
  </div>`;
}

function buildPagNav(id, total, current, onPage){
  const nav = document.getElementById(id);
  if(total <= 1){ nav.innerHTML=''; return; }
  const MAX = 7;
  let pages = [];
  if(total <= MAX){
    for(let i=1;i<=total;i++) pages.push(i);
  } else {
    pages = [1];
    let lo = Math.max(2, current-2), hi = Math.min(total-1, current+2);
    if(lo > 2) pages.push('...');
    for(let i=lo;i<=hi;i++) pages.push(i);
    if(hi < total-1) pages.push('...');
    pages.push(total);
  }
  nav.innerHTML =
    `<button class="pag-btn" ${current===1?'disabled':''} onclick="(${onPage.toString()})(${current-1})">&laquo; Ant</button>` +
    pages.map(p => p==='...'
      ? `<span style="padding:5px 4px;font-size:0.8rem;color:var(--ink-soft)">\u2026</span>`
      : `<button class="pag-btn ${p===current?'active':''}" onclick="(${onPage.toString()})(${p})">${p}</button>`
    ).join('') +
    `<button class="pag-btn" ${current===total?'disabled':''} onclick="(${onPage.toString()})(${current+1})">Sig &raquo;</button>`;
}

function todayStr(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
