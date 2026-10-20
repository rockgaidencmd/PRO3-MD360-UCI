import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore,doc,getDoc,updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const firebaseConfig = {
  apiKey:            "AIzaSyApl919VrDKdV1AdHtZsrVYUC0zym-ZrZs",
  authDomain:        "medishort360-f6f20.firebaseapp.com",
  projectId:         "medishort360-f6f20",
  storageBucket:     "medishort360-f6f20.firebasestorage.app",
  messagingSenderId: "127659670697",
  appId:             "1:127659670697:web:b845e760917ba77e253db8"
};
const COLLECTION='codigos_uci', PRICE=1, KEY='ms360_trial_'+COLLECTION;
const app=initializeApp(firebaseConfig,'premium-'+COLLECTION),db=getFirestore(app);
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback}catch{return fallback}};
const write=(key,val)=>{try{localStorage.setItem(key,val)}catch{}};
function deviceId(){const data=[navigator.language||'',navigator.platform||'',screen.width+'x'+screen.height,screen.colorDepth,Intl.DateTimeFormat().resolvedOptions().timeZone||'',navigator.hardwareConcurrency||'',navigator.deviceMemory||''].join('|');let h=0;for(const c of data)h=((h<<5)-h+c.charCodeAt(0))|0;return 'dev_'+Math.abs(h).toString(36)}
let active=read(KEY+'_active','')==='1',uses=Math.min(3,Math.max(0,Number(read(KEY+'_uses','0'))||0));
const css=document.createElement('style');css.textContent='#ms360-premium-mask{position:fixed;inset:0;z-index:2147483000;background:#030a17dc;display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,sans-serif;color:#fff}#ms360-premium-mask .ms360-card{background:#11243c;border:1px solid #3d8ac4;border-radius:18px;padding:25px;max-width:390px;width:100%;box-shadow:0 15px 55px #0009}#ms360-premium-mask input{box-sizing:border-box;width:100%;padding:13px;background:#fff;color:#111;border-radius:8px;border:0;margin:12px 0}#ms360-premium-mask button{padding:12px 14px;background:#1779ca;color:white;border:0;border-radius:9px;cursor:pointer;font-weight:700;margin-right:7px;margin-top:6px}';document.head.append(css);
let modal=null;
function show(){if(modal)return;modal=document.createElement('div');modal.id='ms360-premium-mask';modal.innerHTML='<div class="ms360-card" role="dialog" aria-modal="true"><h2>🔐 MEDISHORTS 360 Premium</h2><p>Has utilizado tus 3 pruebas gratuitas. Desbloquea el acceso permanente por <strong>$'+PRICE+'</strong> (pago único).</p><p>Solicita tu código de activación al canal MEDISHORTS 360 después de realizar el pago.</p><input id="ms360-premium-code" placeholder="Código de activación" autocomplete="off"><p id="ms360-premium-error" aria-live="polite"></p><button id="ms360-premium-activate">Activar</button><button id="ms360-premium-close">Cerrar</button></div>';document.body.append(modal);modal.querySelector('#ms360-premium-close').onclick=()=>{modal.remove();modal=null};modal.querySelector('#ms360-premium-activate').onclick=activate;}
async function activate(){const code=modal?.querySelector('#ms360-premium-code')?.value.trim().toUpperCase();const msg=modal?.querySelector('#ms360-premium-error');if(!code){msg.textContent='Introduce tu código';return}msg.textContent='Verificando...';try{const ref=doc(db,COLLECTION,code),snap=await getDoc(ref);if(!snap.exists()){msg.textContent='Código no encontrado';return}const d=snap.data(),id=deviceId();if(d.estado==='DESACTIVADO'||d.activo===false){msg.textContent='Código desactivado';return}if(d.estado==='USADO'&&d.dispositivo_id===id){active=true}else if(d.estado==='DISPONIBLE'&&!d.dispositivo_id){await updateDoc(ref,{estado:'USADO',dispositivo_id:id,fecha_activacion:new Date().toISOString()});active=true}else{msg.textContent='Código utilizado o no disponible';return}write(KEY+'_active','1');write(KEY+'_code',code);msg.textContent='¡Activado correctamente!';setTimeout(()=>{modal?.remove();modal=null},500)}catch(e){msg.textContent='No se pudo verificar el código. Comprueba la conexión.'}}
window.MS360Premium={allow(){if(active)return true;if(uses>=3){show();return false}uses++;write(KEY+'_uses',String(uses));return true},open:show,remaining(){return active?'Premium':String(3-uses)},isActive(){return active}};
