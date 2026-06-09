// ===== activacion.js · MS360-UCI · Pantalla de activación =====
// INSTRUCCIONES: Reemplaza el objeto firebaseConfig con los datos de tu proyecto Firebase

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, getDoc, collection, query, where, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ─────────────────────────────────────────────
//  🔧 REEMPLAZA ESTO CON TU CONFIGURACIÓN FIREBASE
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};
// ─────────────────────────────────────────────

const COLECCION   = 'medishort360';
const LS_KEY      = 'ms360uci_activado';
const LS_CODE_KEY = 'ms360uci_codigo';

// ——— Inicializar Firebase ———
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ——— Verificar código en Firestore ———
async function verificarCodigo(codigo) {
  const codigoLimpio = codigo.trim().toUpperCase();

  // Estructura 1: ID del documento = código
  try {
    const docRef  = doc(db, COLECCION, codigoLimpio);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.activo === false) return { valido: false, razon: 'inactivo' };
      return { valido: true };
    }
  } catch (e) {}

  // Estructura 2: campo "codigo" en el documento
  try {
    const q = query(collection(db, COLECCION), where('codigo', '==', codigoLimpio));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      if (data.activo === false) return { valido: false, razon: 'inactivo' };
      return { valido: true };
    }
  } catch (e) {}

  return { valido: false, razon: 'no_encontrado' };
}

function yaActivado() {
  return localStorage.getItem(LS_KEY) === '1';
}

function marcarActivado(codigo) {
  localStorage.setItem(LS_KEY, '1');
  localStorage.setItem(LS_CODE_KEY, codigo);
}

function ocultarGate() {
  const gate = document.getElementById('activation-gate');
  if (gate) {
    gate.style.animation = 'gateFadeOut 0.5s ease forwards';
    setTimeout(() => gate.remove(), 500);
  }
}

async function intentarActivar() {
  const input  = document.getElementById('gate-input');
  const btn    = document.getElementById('gate-btn');
  const errMsg = document.getElementById('gate-error');
  const codigo = input.value.trim();

  if (!codigo) { mostrarError('Ingresa un código de activación.'); return; }

  btn.disabled = true;
  btn.textContent = 'Verificando...';
  errMsg.textContent = '';
  errMsg.classList.remove('visible');
  input.classList.remove('shake');

  try {
    const resultado = await verificarCodigo(codigo);
    if (resultado.valido) {
      marcarActivado(codigo.toUpperCase());
      btn.textContent = '✅ ¡Activado!';
      btn.style.background = '#00C8A0';
      btn.style.color = '#0F0F1A';
      setTimeout(ocultarGate, 700);
    } else {
      mostrarError(resultado.razon === 'inactivo'
        ? 'Este código está desactivado.'
        : 'Código inválido. Verifica e intenta de nuevo.');
      btn.disabled = false;
      btn.textContent = 'ACTIVAR';
    }
  } catch (err) {
    mostrarError('Error de conexión. Verifica tu internet.');
    btn.disabled = false;
    btn.textContent = 'ACTIVAR';
  }
}

function mostrarError(msg) {
  const errMsg = document.getElementById('gate-error');
  const input  = document.getElementById('gate-input');
  errMsg.textContent = msg;
  errMsg.classList.add('visible');
  input.classList.remove('shake');
  void input.offsetWidth;
  input.classList.add('shake');
}

document.addEventListener('DOMContentLoaded', () => {
  if (yaActivado()) {
    const gate = document.getElementById('activation-gate');
    if (gate) gate.remove();
    return;
  }

  const gate = document.getElementById('activation-gate');
  if (gate) gate.style.display = 'flex';

  document.getElementById('gate-btn').addEventListener('click', intentarActivar);
  document.getElementById('gate-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') intentarActivar();
  });
  document.getElementById('gate-input').addEventListener('input', (e) => {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(pos, pos);
  });
});
