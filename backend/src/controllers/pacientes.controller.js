// Controlador: Registro y Admision (Modulo 1)
import { prisma } from "../config/prisma.js";
import { registrarActividad } from "../services/actividad.service.js";
import { leerPaginacion } from "../utils/paginacion.util.js";

const CAMPOS_PACIENTE = [
  "nombreCompleto", "dpi", "direccion", "lugarNacimiento", "fechaNacimiento",
  "telefono", "edad", "sexo", "tipoSangre", "estadoCivil", "ocupacion", "religion", "nacionalidad",
  "nombreConyuge", "nombrePadre", "nombreMadre", "contactoEmergencia", "telefonoEmergencia", "parentesco",
  "referidoDe", "medicoReferenteId", "serviciosSolicitados", "impresionClinicaIngreso",
  "fechaIngreso", "fechaEgreso", "diagnosticoEgresoCodigo", "complicacionesCodigo",
  "operacionesCodigo", "condicionEgreso", "autopsia", "causaMuerte",
];

function tomarCampos(body) {
  const data = {};
  for (const campo of CAMPOS_PACIENTE) {
    if (body[campo] === undefined) continue;
    if (["fechaNacimiento", "fechaIngreso", "fechaEgreso"].includes(campo)) {
      data[campo] = body[campo] ? new Date(body[campo]) : null;
    } else {
      data[campo] = body[campo];
    }
  }
  return data;
}

function generarHistoriaClinica(id) {
  const anio = new Date().getFullYear();
  return `HC-${anio}-${String(id).padStart(6, "0")}`;
}

// RF-02: buscar paciente existente por nombre, DPI o historia clinica
export async function listar(req, res) {
  const { buscar } = req.query;
  const where = buscar
    ? {
        OR: [
          { nombreCompleto: { contains: buscar, mode: "insensitive" } },
          { dpi: { contains: buscar } },
          { historiaClinica: { contains: buscar, mode: "insensitive" } },
        ],
      }
    : undefined;

  // Paginado solo si el caller manda "page" (la pantalla de "Pacientes
  // registrados"). Los <select> de otras pantallas siguen pidiendo la
  // lista completa (tope 50) igual que antes.
  if (req.query.page) {
    const { page, pageSize, skip, take } = leerPaginacion(req);
    const [items, total] = await Promise.all([
      prisma.paciente.findMany({ where, orderBy: { creadoEn: "desc" }, skip, take }),
      prisma.paciente.count({ where }),
    ]);
    return res.json({ items, total, page, pageSize });
  }

  const pacientes = await prisma.paciente.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    take: 50,
  });
  res.json(pacientes);
}

export async function obtenerUno(req, res) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: Number(req.params.id) },
    include: { maternidad: true, medicoReferente: true },
  });
  if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });
  res.json(paciente);
}

// RF-01/RF-03/RF-04: registrar paciente nuevo, generar historia clinica
// y evitar duplicados por DPI
export async function crear(req, res) {
  const { dpi, nombreCompleto } = req.body;
  if (!dpi || !nombreCompleto) {
    return res.status(400).json({ error: "nombreCompleto y dpi son requeridos" });
  }

  const existente = await prisma.paciente.findUnique({ where: { dpi } });
  if (existente) {
    return res.status(409).json({ error: "Ya existe un paciente con este DPI", paciente: existente });
  }

  const paciente = await prisma.$transaction(async (tx) => {
    const creado = await tx.paciente.create({
      data: { ...tomarCampos(req.body), historiaClinica: `PENDIENTE-${Date.now()}` },
    });
    return tx.paciente.update({
      where: { id: creado.id },
      data: { historiaClinica: generarHistoriaClinica(creado.id) },
    });
  });

  await registrarActividad(req.user.id, "crear_paciente", `${paciente.nombreCompleto} (${paciente.historiaClinica})`);
  res.status(201).json(paciente);
}

// RF-05 a RF-09: actualizar datos de ingreso, egreso y maternidad
export async function actualizar(req, res) {
  const id = Number(req.params.id);
  try {
    const paciente = await prisma.paciente.update({ where: { id }, data: tomarCampos(req.body) });
    await registrarActividad(req.user.id, "actualizar_paciente", `${paciente.nombreCompleto} (${paciente.historiaClinica})`);

    if (req.body.maternidad) {
      const m = req.body.maternidad;
      await prisma.registroMaternidad.upsert({
        where: { pacienteId: id },
        create: {
          pacienteId: id,
          numeroHijo: m.numeroHijo,
          fecha: m.fecha ? new Date(m.fecha) : undefined,
          hora: m.hora,
          sexo: m.sexo,
          condicionEgresoBebe: m.condicionEgresoBebe,
        },
        update: {
          numeroHijo: m.numeroHijo,
          fecha: m.fecha ? new Date(m.fecha) : undefined,
          hora: m.hora,
          sexo: m.sexo,
          condicionEgresoBebe: m.condicionEgresoBebe,
        },
      });
    }

    res.json(paciente);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Paciente no encontrado" });
    throw err;
  }
}
