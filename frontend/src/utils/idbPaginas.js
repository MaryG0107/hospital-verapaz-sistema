// Respaldo de las paginas del escaneo movil usando IndexedDB.
//
// Antes se usaba sessionStorage, pero tiene un limite de ~5MB por sitio y
// cada pagina se guarda como imagen completa en base64 (hasta 1600px de
// ancho): con 8-9 fotos ese limite se llenaba. sessionStorage.setItem
// fallaba en silencio (quota exceeded) y la persistencia se quedaba
// congelada en la ultima pagina que si habia cabido — si Android mataba la
// pestana despues, las paginas siguientes (que solo vivian en memoria) se
// perdian sin aviso. IndexedDB no tiene ese limite practico para este caso.
const DB_NAME = "escaneo-movil";
const STORE = "paginas";

// Una sola conexion reutilizada (en vez de abrir/cerrar una por llamada):
// cada foto debe quedar guardada lo mas rapido posible, porque Android
// puede matar la pestana en cualquier momento mientras la camara esta
// abierta — entre mas tarde el guardado, mayor la ventana para perder esa
// foto si la pestana se recarga a media escritura.
let dbPromise = null;

function abrirDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

// OJO: a proposito NO se atrapan errores aqui (a diferencia de la version
// anterior). Si una lectura falla y el que llama la trata como "no habia
// nada guardado", el siguiente guardado reescribe el respaldo completo con
// solo la pagina nueva — borrando todo lo anterior. Es mejor que el error
// llegue a quien llama para que decida (ver EscaneoMovilPage) en vez de
// esconderlo detras de un resultado vacio que parece valido.
export async function leerPaginasGuardadas(sesionId) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(sesionId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarPaginas(sesionId, paginas) {
  const db = await abrirDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    if (paginas.length) tx.objectStore(STORE).put(paginas, sesionId);
    else tx.objectStore(STORE).delete(sesionId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// Limpieza de mejor esfuerzo despues de un envio ya exitoso al servidor: si
// falla, no hay nada que avisarle al usuario (el documento ya se subio
// bien), simplemente queda un respaldo local huerfano que no estorba.
export async function borrarPaginas(sesionId) {
  try {
    await guardarPaginas(sesionId, []);
  } catch {
    // no critico
  }
}
