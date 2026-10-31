// Preparacion de una base de datos de PRODUCCION: a diferencia de seed.js
// (que crea 6 cuentas de prueba con contraseñas fijas y conocidas, mas
// medicamentos de muestra, solo para probar el sistema), este script:
//
//   1. Crea el catalogo de referencia que el sistema SI necesita para
//      funcionar (CIE-10 y categorias fiscales) -- esto no es "dato de
//      prueba", es catalogo real.
//   2. Crea UNA sola cuenta real: el Administrador inicial. La contrasena
//      se genera al azar y se imprime UNA vez en esta terminal; no queda
//      guardada en ningun archivo ni variable de entorno.
//
// Las demas cuentas reales (recepcion, medicos, enfermeria, facturacion,
// farmacia) el Administrador las crea desde el sistema mismo, en
// Seguridad y Roles, una vez que inicia sesion -- no se crean aqui, para
// no repetir esa logica en dos lugares distintos.
//
// Uso (una sola vez, al preparar el servidor real):
//   ADMIN_NOMBRE="Nombre Apellido" ADMIN_CORREO="correo@hospitalverapaz.gt" npm run prisma:seed:produccion
//
// Si la cuenta de ese correo ya existe, el script no la toca (no sobre-
// escribe una contrasena ya en uso) y simplemente lo avisa.
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { ROLES } from "../src/utils/roles.util.js";
import { CIE10_CATALOGO } from "./data/cie10.js";

const prisma = new PrismaClient();

function generarPassword() {
  // 16 caracteres, alfanumericos + "-"/"_" (base64url): facil de copiar y
  // pegar, sin caracteres que un formulario o una terminal puedan comerse.
  return crypto.randomBytes(12).toString("base64url");
}

async function main() {
  const nombre = process.env.ADMIN_NOMBRE;
  const correo = process.env.ADMIN_CORREO;

  if (!nombre || !correo) {
    console.error(
      "Faltan ADMIN_NOMBRE y/o ADMIN_CORREO. Ejemplo:\n" +
      '  ADMIN_NOMBRE="Nombre Apellido" ADMIN_CORREO="correo@hospitalverapaz.gt" npm run prisma:seed:produccion'
    );
    process.exit(1);
  }

  // Catalogo de referencia: igual que en seed.js, con skipDuplicates para
  // poder correr este script mas de una vez sin duplicar nada.
  await prisma.catalogoCie10.createMany({ data: CIE10_CATALOGO, skipDuplicates: true });
  await prisma.categoriaFiscal.createMany({
    data: [
      { nombre: "IVA general (12%)", tasa: 12 },
      { nombre: "Pequeño Contribuyente (5%)", tasa: 5 },
      { nombre: "ISR Régimen sobre Utilidades (25%)", tasa: 25 },
      { nombre: "ISR Régimen Opcional Simplificado (5%)", tasa: 5 },
      { nombre: "Sin clasificar", tasa: null },
    ],
    skipDuplicates: true,
  });
  console.log("Catálogo CIE-10 y categorías fiscales listos.");

  const existente = await prisma.usuario.findUnique({ where: { correo } });
  if (existente) {
    console.log(`Ya existe una cuenta con ${correo} — no se modificó su contraseña.`);
    return;
  }

  const password = generarPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.usuario.create({
    data: { nombre, correo, passwordHash, roles: [ROLES.ADMIN] },
  });

  console.log("\nAdministrador creado.");
  console.log(`  Correo:      ${correo}`);
  console.log(`  Contraseña:  ${password}`);
  console.log("\nGuárdela ahora en un lugar seguro (ej. el gestor de contraseñas del hospital) —");
  console.log("no vuelve a mostrarse. Inicie sesión y cámbiela desde el sistema de inmediato.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
