// Controlador: Clientes Referidos (Modulo 4)
import { prisma } from "../config/prisma.js";
import { registrarActividad } from "../services/actividad.service.js";

// RF-16: listar medicos referentes, con total de pacientes referidos
export async function listar(req, res) {
  const medicos = await prisma.medicoReferente.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pacientesReferidos: true } } },
  });
  res.json(medicos.map((m) => ({ ...m, pacientesReferidos: m._count.pacientesReferidos, _count: undefined })));
}

export async function obtenerUno(req, res) {
  const medico = await prisma.medicoReferente.findUnique({
    where: { id: Number(req.params.id) },
    include: { pacientesReferidos: { select: { id: true, nombreCompleto: true, historiaClinica: true } } },
  });
  if (!medico) return res.status(404).json({ error: "Medico referente no encontrado" });
  res.json(medico);
}

// RF-16: registrar medico referente; la comision es opcional (hoy no se usa
// en facturacion/reportes, ver RegistroPage/ReferidosPage).
export async function crear(req, res) {
  const { nombre, especialidad, comisionQ } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: "nombre es requerido" });
  }
  const medico = await prisma.medicoReferente.create({
    data: { nombre, especialidad, comisionQ: comisionQ === undefined || comisionQ === "" ? null : comisionQ },
  });
  await registrarActividad(req.user.id, "crear_referido", nombre);
  res.status(201).json(medico);
}

export async function actualizar(req, res) {
  const { nombre, especialidad, comisionQ } = req.body;
  try {
    const medico = await prisma.medicoReferente.update({
      where: { id: Number(req.params.id) },
      data: { nombre, especialidad, comisionQ: comisionQ === undefined || comisionQ === "" ? null : comisionQ },
    });
    res.json(medico);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Medico referente no encontrado" });
    throw err;
  }
}
