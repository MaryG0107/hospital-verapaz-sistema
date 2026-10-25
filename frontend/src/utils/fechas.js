// Formato de fechas para pantalla e impresion, siempre dia/mes/año.
//
// Hay dos tipos de fecha en el sistema y se muestran distinto:
//
//  - "De solo dia" (fecha de nacimiento, fecha escrita en el papel): se
//    guardan como medianoche UTC del dia elegido ("2000-03-01T00:00:00Z").
//    Hay que mostrarlas en UTC; en hora local de Guatemala (UTC-6) esa
//    medianoche cae en la tarde del dia ANTERIOR y se veria 29/02/2000.
//
//  - "Instante" (fecha en que se registro en el sistema, ingreso con hora):
//    es un momento real y se muestra en la hora local del navegador.

const FORMATO_DIA = { day: "2-digit", month: "2-digit", year: "numeric" };
const FORMATO_HORA = { hour: "2-digit", minute: "2-digit", hour12: false };

function valida(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Fecha de solo dia -> "01/03/2000" (o null si no hay valor)
export function fechaDia(valor) {
  const d = valida(valor);
  return d ? d.toLocaleDateString("es-GT", { ...FORMATO_DIA, timeZone: "UTC" }) : null;
}

// Momento real -> "15/09/2026" (hora local)
export function fechaLocal(valor) {
  const d = valida(valor);
  return d ? d.toLocaleDateString("es-GT", FORMATO_DIA) : null;
}

// Momento real -> "15/09/2026 14:30" (hora local)
export function fechaHoraLocal(valor) {
  const d = valida(valor);
  return d ? `${d.toLocaleDateString("es-GT", FORMATO_DIA)} ${d.toLocaleTimeString("es-GT", FORMATO_HORA)}` : null;
}

// Fecha de hoy en hora local, como "AAAA-MM-DD" (para precargar un
// <input type="date">). No usa toISOString() porque esa es la fecha en
// UTC: en la tarde/noche de Guatemala (UTC-6) ya seria el dia siguiente.
export function hoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

// Edad en años cumplidos a partir de una fecha de nacimiento "AAAA-MM-DD"
// (fecha de solo dia). Compara los numeros de dia/mes/año directamente, sin
// pasar por Date/UTC, para no arrastrar el mismo corrimiento de un dia que
// documenta fechaDia() arriba.
export function calcularEdad(fechaNacimientoStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaNacimientoStr || "");
  if (!m) return null;
  const anio = Number(m[1]), mes = Number(m[2]), dia = Number(m[3]);
  const hoy = new Date();
  const anioHoy = hoy.getFullYear(), mesHoy = hoy.getMonth() + 1, diaHoy = hoy.getDate();
  let edad = anioHoy - anio;
  if (mesHoy < mes || (mesHoy === mes && diaHoy < dia)) edad--;
  return edad >= 0 && edad <= 130 ? edad : null;
}
