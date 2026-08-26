-- CreateTable
CREATE TABLE "CatalogoCie10" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "CatalogoCie10_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoCie10_codigo_key" ON "CatalogoCie10"("codigo");

-- CreateIndex
CREATE INDEX "CatalogoCie10_descripcion_idx" ON "CatalogoCie10"("descripcion");
