// Chrome (y navegadores basados en Chromium) bloquean la navegacion de nivel
// superior a una URL "data:" — abrir un <a href="data:..." target="_blank">
// deja la pestaña en blanco aunque la URL se vea bien en la barra. La
// solucion es convertir el data URI a un Blob y abrir ESE URL (blob:), que
// si esta permitido. La conversion debe ser sincrona (sin await) para que
// window.open() todavia cuente como parte del gesto del usuario y no lo
// bloquee el popup blocker.
export function abrirArchivoDataUrl(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const match = header.match(/data:(.*?);base64/);
  const mime = match ? match[1] : "application/octet-stream";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}
