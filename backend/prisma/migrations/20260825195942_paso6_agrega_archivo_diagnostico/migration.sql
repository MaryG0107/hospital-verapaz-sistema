-- CreateTable
CREATE TABLE "DiagnosticoArchivo" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticoArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiagnosticoArchivo_pacienteId_idx" ON "DiagnosticoArchivo"("pacienteId");
