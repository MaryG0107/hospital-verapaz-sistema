-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY[]::TEXT[];
