-- Paso 2 de la migracion a roles multiples: se elimina la columna "rol"
-- (String, un solo rol) ahora que todo el codigo usa "roles" (String[]).
-- Los valores ya se copiaron a "roles" antes de este paso (ver paso1).
DROP INDEX "Usuario_rol_idx";

ALTER TABLE "Usuario" DROP COLUMN "rol";
