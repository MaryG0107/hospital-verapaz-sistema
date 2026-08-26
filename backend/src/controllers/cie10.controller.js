// Controlador: catalogo de codigos CIE-10 (subconjunto curado, ver
// prisma/data/cie10.js). Usado para el autocompletado de Diagnostico e
// Ingreso/Egreso.
import { prisma } from "../config/prisma.js";

export async function listar(req, res) {
  const codigos = await prisma.catalogoCie10.findMany({ orderBy: { codigo: "asc" } });
  res.json(codigos);
}
