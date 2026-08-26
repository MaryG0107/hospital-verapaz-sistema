// Controlador: Autenticacion y tokens de acceso temporal (Modulo 8)
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { ROLES } from "../utils/roles.util.js";
import { registrarActividad } from "../services/actividad.service.js";

function firmarSesion(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, roles: usuario.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

// RF-29: inicio de sesion con usuario y contrasena
export async function login(req, res) {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return res.status(401).json({ error: "Credenciales invalidas" });

  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValida) return res.status(401).json({ error: "Credenciales invalidas" });

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimaActividad: new Date() } });
  await registrarActividad(usuario.id, "login", `${usuario.nombre} inició sesión`);

  res.json({
    token: firmarSesion(usuario),
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      roles: usuario.roles,
      puedeAutogenerarToken: usuario.puedeAutogenerarToken,
    },
  });
}

// Registra la hora de salida. El JWT sigue siendo valido hasta que expire
// (no hay lista de revocacion), pero queda constancia de cuando el usuario
// decidio cerrar sesion.
export async function logout(req, res) {
  await registrarActividad(req.user.id, "logout", "Cierre de sesión");
  res.json({ ok: true });
}

async function emitirToken({ usuarioId, pacienteId, emitidoPor }) {
  const minutos = Number(process.env.TEMP_TOKEN_EXPIRES_MIN || 15);
  const token = crypto.randomBytes(24).toString("hex");
  const expiraEn = new Date(Date.now() + minutos * 60 * 1000);

  const registro = await prisma.tokenTemporal.create({
    data: { token, usuarioId, pacienteId: pacienteId ?? null, emitidoPor, expiraEn },
  });

  return { token: registro.token, expiraEn: registro.expiraEn };
}

// RF-33: el Administrador genera un token temporal para otro usuario
export async function solicitarTokenTemporal(req, res) {
  const { usuarioId, pacienteId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: "usuarioId es requerido" });

  const usuarioDestino = await prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });
  if (!usuarioDestino) return res.status(404).json({ error: "Usuario no encontrado" });

  const resultado = await emitirToken({
    usuarioId: Number(usuarioId),
    pacienteId: pacienteId ? Number(pacienteId) : null,
    emitidoPor: req.user.id,
  });
  res.status(201).json({ ok: true, ...resultado });
}

// RF-34: un usuario con permiso se autogenera su propio token
export async function autogenerarTokenTemporal(req, res) {
  const { pacienteId } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
  if (!usuario?.puedeAutogenerarToken && !usuario?.roles?.includes(ROLES.ADMIN)) {
    return res.status(403).json({ error: "No tiene permiso para autogenerar tokens. Solicítelo al Administrador" });
  }

  const resultado = await emitirToken({
    usuarioId: usuario.id,
    pacienteId: pacienteId ? Number(pacienteId) : null,
    emitidoPor: usuario.id,
  });
  res.status(201).json({ ok: true, ...resultado });
}
