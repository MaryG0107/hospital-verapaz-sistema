import { Router } from "express";
import multer from "multer";
import * as controller from "../controllers/escaneoMovil.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { ROLES } from "../utils/roles.util.js";

const router = Router();
const uploadPdf = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }).single("documento");

// Estas dos rutas no requieren login (el telefono se autoriza solo con el id
// de sesion): sin un limite por IP, alguien podria intentar adivinar ids de
// sesion o saturar la subida de PDFs de 20MB sin ningun freno.
const movilLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 30, mensaje: "Demasiadas solicitudes de escaneo. Espere antes de volver a intentar" });

// Computadora (autenticada): crea la sesion y recoge el resultado.
router.post("/sesiones", requireAuth, requireRole(ROLES.RECEPCION, ROLES.ADMIN), controller.crear);
router.get("/sesiones/:id/estado", requireAuth, controller.estado);
router.get("/sesiones/:id/pdf", requireAuth, controller.obtenerPdf);
router.delete("/sesiones/:id", requireAuth, controller.cancelar);

// Telefono (sin login; autorizado solo por conocer el id de sesion, como un
// enlace de un solo uso vigente 10 minutos).
router.get("/sesiones/:id/info", movilLimiter, controller.info);
router.post("/sesiones/:id/subir", movilLimiter, uploadPdf, controller.subirPdf);

export default router;
