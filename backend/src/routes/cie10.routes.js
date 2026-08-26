import { Router } from "express";
import * as controller from "../controllers/cie10.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", controller.listar);

export default router;
