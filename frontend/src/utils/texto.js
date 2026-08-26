// Normalizacion de texto compartida (quita acentos, pasa a minusculas) para
// busquedas insensibles a diacriticos en comboboxes/autocompletados.
const MARCAS_DIACRITICAS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

export function normalizarTexto(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(MARCAS_DIACRITICAS, "")
    .toLowerCase();
}
