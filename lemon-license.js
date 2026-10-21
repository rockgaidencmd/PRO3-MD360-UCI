/* API pública de licencias de Lemon Squeezy. No utiliza claves de administración. */
const API = 'https://api.lemonsqueezy.com/v1/licenses/';

function assertProduct(data, productId) {
  if (!productId || String(data?.meta?.product_id) !== String(productId)) {
    throw new Error('Este código corresponde a otra app. Abre la app que compraste.');
  }
  if (!['active', 'inactive'].includes(data?.license_key?.status)) {
    throw new Error('La licencia está desactivada o vencida. Contacta con soporte.');
  }
  if (data.license_key.expires_at && Date.parse(data.license_key.expires_at) <= Date.now()) {
    throw new Error('La licencia está vencida. Contacta con soporte.');
  }
}

async function request(action, values, fetcher) {
  let response;
  try {
    response = await fetcher(API + action, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values),
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new Error('No se pudo conectar con la verificación. Comprueba internet e inténtalo de nuevo.');
  }
  let data;
  try { data = await response.json(); } catch { throw new Error('La verificación no respondió correctamente. Inténtalo de nuevo.'); }
  if (!response.ok && !data.license_key) {
    throw new Error(response.status === 429 ? 'Demasiados intentos. Espera un minuto.' : 'Código no encontrado o no válido. Copia el código completo del correo de compra.');
  }
  return data;
}

export async function activateLemon({ key, productId, device, saved, persist }, fetcher = fetch) {
  if (!productId) throw new Error('La compra automática de esta app aún está en preparación. Contacta con soporte.');
  const canReuse = saved?.key === key && saved?.device === device && String(saved?.productId) === String(productId) && saved?.instanceId;
  const validation = await request('validate', { license_key: key, ...(canReuse ? { instance_id: saved.instanceId } : {}) }, fetcher);
  assertProduct(validation, productId);
  if (!validation.valid) throw new Error('La licencia no es válida o está desactivada. Contacta con soporte.');
  if (canReuse) {
    if (validation.instance?.id !== saved.instanceId || validation.instance?.name !== device) throw new Error('No se pudo verificar la activación guardada en este dispositivo.');
    return saved;
  }
  const result = await request('activate', { license_key: key, instance_name: device }, fetcher);
  assertProduct(result, productId);
  if (!result.activated || !result.instance?.id || result.instance.name !== device) {
    throw new Error('El código ya tiene una activación o no está disponible. Si cambiaste de dispositivo o borraste sus datos, contacta con soporte.');
  }
  const record = { key, productId: String(productId), device, instanceId: result.instance.id };
  // Guardar antes de mostrar éxito permite reintentar sin consumir otra activación.
  if (persist) persist(record);
  return record;
}
