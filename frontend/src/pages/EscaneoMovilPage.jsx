import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Camera, ImagePlus, AlertTriangle, RefreshCw, CheckCircle2, Trash2 } from "lucide-react";
import { COLORS } from "../styles/tokens";
import { procesarEscaneoAutomatico, idAleatorio } from "../utils/scanProcessing";
import { generarPdfDePaginas, validarPdf, nombreDescarga, esPdf, leerInfoPdf } from "../utils/pdfDocumentos";
import { api } from "../services/api";
import { leerPaginasGuardadas, guardarPaginas, borrarPaginas } from "../utils/idbPaginas";

const CAMERA_MAX_WIDTH = 1600;
const MAX_PAGINAS = 30;

function dataUrlDesdeArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, CAMERA_MAX_WIDTH / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(16, Math.round(img.width * escala));
        canvas.height = Math.max(16, Math.round(img.height * escala));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

// Una miniatura liviana para mostrar en pantalla: un <img> con la foto
// completa (1600px) obliga al navegador a mantener el bitmap decodificado
// en memoria para CADA pagina visible, aunque se muestre chiquito en el
// grid — con 20-30 fotos eso es memoria de sobra para que Android decida
// matar la pestana. La imagen completa se sigue guardando igual (para el
// PDF final); solo lo que se pinta en pantalla usa esta version chica.
function miniaturaDesdeCanvas(canvas, maxAncho = 200) {
  const escala = Math.min(1, maxAncho / canvas.width);
  const mini = document.createElement("canvas");
  mini.width = Math.max(16, Math.round(canvas.width * escala));
  mini.height = Math.max(16, Math.round(canvas.height * escala));
  mini.getContext("2d").drawImage(canvas, 0, 0, mini.width, mini.height);
  return mini.toDataURL("image/jpeg", 0.6);
}

function Pantalla({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ backgroundColor: "#111" }}>
      <div className="max-w-sm w-full text-white">{children}</div>
    </div>
  );
}

// Dev-Mari: pagina que abre el TELEFONO al escanear el QR desde la
// computadora (EscaneoQRModal). Sin login — el id de sesion en la URL es lo
// que autoriza la subida, como un enlace de un solo uso.
//
// Un solo boton "Elegir imagen o PDF" (input de archivo nativo, sin el
// atributo capture): el propio selector del telefono ya ofrece "Camara"
// como una de las fuentes, junto con la galeria y el almacenamiento — no
// hace falta un boton aparte con video en vivo (getUserMedia), que ademas
// requiere HTTPS. Reusa el mismo motor de correccion de bordes/perspectiva
// que el escaner integrado de la computadora.
// Android puede matar en segundo plano la pestana del navegador mientras la
// app de Camara esta abierta (para liberar memoria); al volver, la pagina
// se recarga desde cero y se pierde todo el estado en memoria. Para que no
// se pierdan las paginas ya escaneadas, se guardan en IndexedDB (solo
// mientras dura esta sesion de escaneo) y se recuperan si la pagina se
// recarga.
export function EscaneoMovilPage() {
  const { sesionId } = useParams();
  const [valido, setValido] = useState(null); // null=verificando, true/false
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [paginas, setPaginas] = useState([]);
  const [recuperadas, setRecuperadas] = useState(0);
  const [errorRespaldo, setErrorRespaldo] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    api.get(`/escaneo-movil/sesiones/${sesionId}/info`)
      .then((d) => setValido(!!d.valido))
      .catch(() => setValido(false));
  }, [sesionId]);

  // Recupera las paginas guardadas de un intento anterior (si Android mato
  // la pestana mientras se escaneaba) al montar el componente.
  useEffect(() => {
    let cancelado = false;
    leerPaginasGuardadas(sesionId)
      .then((guardadas) => {
        if (cancelado) return;
        if (guardadas.length) {
          setPaginas(guardadas);
          setRecuperadas(guardadas.length);
        }
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorRespaldo("No se pudo leer el respaldo de un intento anterior (" + (err?.message || "almacenamiento no disponible") + ").");
      });
    return () => { cancelado = true; };
  }, [sesionId]);

  // Cada pagina se escribe en IndexedDB de inmediato, dentro de la MISMA
  // operacion que la crea (lee lo guardado, agrega la nueva, escribe, y
  // solo hasta entonces se refleja en pantalla). Antes esto se hacia con un
  // useEffect reactivo que corria un paso despues del cambio de estado —
  // si Android mataba la pestana en ese hueco, esa foto se perdia. Y si la
  // lectura fallaba, se trataba como "no habia nada guardado" y el
  // siguiente guardado reescribia el respaldo completo con solo la pagina
  // nueva, borrando las anteriores (asi se perdieron las primeras 5 en la
  // prueba del telefono). Por eso aqui un fallo de lectura NUNCA se asume
  // vacio: se usa lo que ya hay en pantalla como base.
  async function persistir(calcularNuevas) {
    let actuales = paginas;
    try {
      actuales = await leerPaginasGuardadas(sesionId);
    } catch (err) {
      setErrorRespaldo("No se pudo confirmar el respaldo guardado (" + (err?.message || "almacenamiento no disponible") + "); se sigue con lo que hay en pantalla. Termine y envíe pronto por si la pestaña se recarga.");
    }
    const nuevas = calcularNuevas(actuales);
    try {
      await guardarPaginas(sesionId, nuevas);
      setErrorRespaldo(null);
    } catch (err) {
      setErrorRespaldo("No se pudo respaldar la página en este teléfono (" + (err?.message || "almacenamiento no disponible") + "). Termine y envíe pronto para no perder el avance si la pestaña se recarga.");
    }
    setPaginas(nuevas);
    return nuevas;
  }

  async function escanearAutomaticamente(dataUrl) {
    if (paginas.length >= MAX_PAGINAS) {
      setError(`Ya alcanzó el máximo de ${MAX_PAGINAS} páginas.`);
      return;
    }
    setProcesando(true);
    setError(null);
    try {
      const { canvas } = await Promise.race([
        procesarEscaneoAutomatico(dataUrl, { maxAncho: CAMERA_MAX_WIDTH }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("El procesamiento tardó demasiado; intente de nuevo con mejor luz o más cerca del documento.")), 20000)),
      ]);
      const pagina = { id: idAleatorio(), dataUrl: canvas.toDataURL("image/jpeg", 0.85), miniatura: miniaturaDesdeCanvas(canvas) };
      await persistir((actuales) => [...actuales, pagina]);
    } catch (err) {
      setError(err.message || "Error al procesar la captura.");
    } finally {
      setProcesando(false);
    }
  }

  // Envio final a la sesion: comun para el PDF armado con las paginas
  // capturadas y para un PDF que ya vino listo del almacenamiento.
  async function enviarPdf(blob, totalPaginas) {
    setEnviando(true);
    setError(null);
    try {
      const invalido = validarPdf(blob, totalPaginas);
      if (invalido) {
        setError(invalido);
        return;
      }
      const fd = new FormData();
      const nombre = nombreDescarga();
      fd.append("documento", new File([blob], nombre, { type: "application/pdf" }));
      fd.append("paginas", String(totalPaginas));
      fd.append("nombre", nombre);
      await api.post(`/escaneo-movil/sesiones/${sesionId}/subir`, fd);
      await borrarPaginas(sesionId);
      setEnviado(true);
    } catch (err) {
      // No se limpian las paginas ya capturadas: si el envio falla, el
      // usuario puede reintentar sin tener que volver a escanear todo.
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  // Dev-Mari: un PDF elegido del almacenamiento ya es el documento final
  // (por ejemplo, uno que dejo el escaner de una impresora) — no pasa por
  // deteccion de bordes/perspectiva, que es solo para fotos.
  async function manejarArchivoPdf(file) {
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const { totalPaginas } = await leerInfoPdf(bytes);
      await enviarPdf(new Blob([bytes], { type: "application/pdf" }), totalPaginas);
    } catch (err) {
      setError("No se pudo leer el PDF (¿está dañado o protegido con contraseña?): " + err.message);
    }
  }

  async function manejarArchivo(evento) {
    const file = evento.target.files?.[0];
    evento.target.value = "";
    if (!file) return;
    if (esPdf(file)) {
      await manejarArchivoPdf(file);
      return;
    }
    try {
      const dataUrl = await dataUrlDesdeArchivo(file);
      await escanearAutomaticamente(dataUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  async function quitarPagina(id) {
    await persistir((actuales) => actuales.filter((pg) => pg.id !== id));
  }

  async function enviar() {
    try {
      const { blob, paginas: total } = await generarPdfDePaginas(paginas.map((p) => p.dataUrl));
      await enviarPdf(blob, total);
    } catch (err) {
      setError(err.message);
    }
  }

  if (valido === null) {
    return <Pantalla><RefreshCw size={32} className="animate-spin mx-auto mb-3" /><p>Verificando código…</p></Pantalla>;
  }
  if (!valido) {
    return (
      <Pantalla>
        <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: COLORS.gold }} />
        <p className="font-semibold mb-1">Este código ya no es válido</p>
        <p className="text-sm" style={{ color: "#aaa" }}>Puede haber expirado o ya fue usado. Genere uno nuevo desde la computadora.</p>
      </Pantalla>
    );
  }
  if (enviado) {
    return (
      <Pantalla>
        <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: COLORS.green }} />
        <p className="font-semibold mb-1">Documento enviado</p>
        <p className="text-sm" style={{ color: "#aaa" }}>Ya puede continuar el registro en la computadora. Puede cerrar esta página.</p>
      </Pantalla>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#111" }}>
      <div className="max-w-md mx-auto text-white">
        <div className="font-semibold text-lg mb-1 flex items-center gap-2"><Camera size={20} /> Escanear expediente</div>
        <p className="text-xs mb-4" style={{ color: "#aaa" }}>
          Toque el botón: puede elegir "Cámara" para tomar una foto por página, o "Archivos"/"Galería" para un PDF o
          imagen ya guardada. El sistema corrige bordes y perspectiva automáticamente.
        </p>

        {error && (
          <div className="rounded-lg px-3 py-2 mb-3 text-sm" style={{ backgroundColor: "#4a1f1f", color: "#ffb3b3" }}>
            {error}
          </div>
        )}

        {errorRespaldo && (
          <div className="rounded-lg px-3 py-2 mb-3 text-sm" style={{ backgroundColor: "#4a3a1f", color: "#ffd9a3" }}>
            ⚠ {errorRespaldo}
          </div>
        )}

        {recuperadas > 0 && (
          <div className="rounded-lg px-3 py-2 mb-3 text-sm" style={{ backgroundColor: "#1f3a2a", color: "#a8e6b8" }}>
            Se recuperaron {recuperadas} página{recuperadas === 1 ? "" : "s"} de un intento anterior (el navegador se reinició). Puede seguir agregando o enviarlas.
          </div>
        )}

        {procesando && (
          <div className="py-10 text-center">
            <RefreshCw size={28} className="animate-spin mx-auto" />
            <p className="text-sm mt-3" style={{ color: "#aaa" }}>Escaneando…</p>
          </div>
        )}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={procesando}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-1.5"
          style={{ backgroundColor: COLORS.navy, color: "white", opacity: procesando ? 0.7 : 1 }}
        >
          <ImagePlus size={16} /> Elegir imagen o PDF
        </button>
        <input ref={inputRef} type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={manejarArchivo} aria-label="Elegir imagen o PDF del almacenamiento" />

        {paginas.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold mb-2" style={{ color: "#aaa" }}>
              Páginas ({paginas.length}/{MAX_PAGINAS})
            </div>
            <div className="grid grid-cols-4 gap-2">
              {paginas.map((pg, i) => (
                <div key={pg.id} className="relative rounded-lg overflow-hidden">
                  <img src={pg.miniatura || pg.dataUrl} alt={`Página ${i + 1}`} className="w-full h-20 object-cover" />
                  <span className="absolute left-1 top-1 text-[10px] font-bold px-1.5 rounded" style={{ backgroundColor: COLORS.navy, color: "white" }}>{i + 1}</span>
                  <button onClick={() => quitarPagina(pg.id)} className="absolute right-1 top-1 rounded-full p-0.5" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }} aria-label={`Eliminar página ${i + 1}`}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={enviar}
              disabled={enviando}
              className="w-full mt-3 py-3 rounded-xl font-semibold"
              style={{ backgroundColor: COLORS.green, color: "white", opacity: enviando ? 0.7 : 1 }}
            >
              {enviando ? "Enviando…" : `Terminar y enviar (${paginas.length} página${paginas.length === 1 ? "" : "s"})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
