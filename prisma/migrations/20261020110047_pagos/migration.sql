-- AlterTable
ALTER TABLE "Partido" ADD COLUMN "importeTotal" REAL;

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "indicadoEn" DATETIME,
    "confirmadoEn" DATETIME,
    "confirmadoPorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pago_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pago_partidoId_usuarioId_key" ON "Pago"("partidoId", "usuarioId");
