/* Inventario y Préstamos - arranque de la aplicación
   index.html solo carga este archivo. */
(async function(){
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

  try{
    // Primero los servicios de Supabase.
    await loadScript('supabase.js');
    await window.__supabaseReady;

    // Después la configuración, utilidades y módulos de la interfaz.
    const modules = [
      'js/core/app-config.js',
      'js/core/helpers.js',
      'js/core/app-state.js',
      'js/modules/01-inventario.js',
      'js/modules/02-prestamos.js',
      'js/modules/03-docentes.js',
      'js/modules/04-etiquetas.js',
      'js/core/app-events.js'
    ];
    for(const file of modules){
      await loadScript(file);
    }

    await init();
  }catch(error){
    console.error('Error iniciando la aplicación:', error);
    const box = document.getElementById('appLoadError');
    if(box){
      box.hidden = false;
      box.textContent = 'No se pudo cargar la aplicación. Revisa los archivos y vuelve a intentar.';
    }
  }
})();
