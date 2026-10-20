/* Instalación independiente MEDISHORTS 360 — sin activación */
(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
  }
  const btn = document.getElementById('ms360-install-free');
  if (!btn) return;
  let deferred = null;
  const hide = () => { btn.hidden = true; deferred = null; };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferred = event;
    btn.hidden = false;
  });
  window.addEventListener('appinstalled', hide);
  btn.addEventListener('click', async () => {
    if (!deferred) {
      alert('Para instalar, abre el menú del navegador y elige "Instalar aplicación" o "Añadir a pantalla de inicio".');
      return;
    }
    const prompt = deferred;
    deferred = null;
    btn.hidden = true;
    try { await prompt.prompt(); await prompt.userChoice; } catch (e) { console.warn(e); }
  });
})();