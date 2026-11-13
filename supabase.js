/* Inventario y Préstamos - cargador de servicios Supabase.
   La lógica real está separada en js/services/. */
(function(){
  const files = [
    'js/services/01-config.js',
    'js/services/02-auth.js',
    'js/services/03-profile.js',
    'js/services/04-toast.js',
    'js/services/05-docentes.js',
    'js/services/06-inventario.js'
  ];

  function loadScript(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar: ' + src));
      document.head.appendChild(s);
    });
  }

  window.__supabaseReady = (async()=>{
    for(const file of files) await loadScript(file);
  })();
})();
