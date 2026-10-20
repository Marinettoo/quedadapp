/*
  Warnings:

  - You are about to drop the column `formato` on the `Partido` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Valoracion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valoradoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Valoracion_valoradoId_fkey" FOREIGN KEY ("valoradoId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Valoracion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneracionEquipos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "generadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generadoPorId" TEXT NOT NULL,
    CONSTRAINT "GeneracionEquipos_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneracionEquipos_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AsignacionEquipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generacionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "equipo" INTEGER NOT NULL,
    CONSTRAINT "AsignacionEquipo_generacionId_fkey" FOREIGN KEY ("generacionId") REFERENCES "GeneracionEquipos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsignacionEquipo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fechaHora" DATETIME NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "horasCierre" INTEGER NOT NULL DEFAULT 2,
    "encargadoId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partido_encargadoId_fkey" FOREIGN KEY ("encargadoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Partido_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Partido" ("creadoEn", "creadoPorId", "encargadoId", "fechaHora", "horasCierre", "id", "ubicacion") SELECT "creadoEn", "creadoPorId", "encargadoId", "fechaHora", "horasCierre", "id", "ubicacion" FROM "Partido";
DROP TABLE "Partido";
ALTER TABLE "new_Partido" RENAME TO "Partido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Valoracion_valoradoId_autorId_key" ON "Valoracion"("valoradoId", "autorId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneracionEquipos_partidoId_key" ON "GeneracionEquipos"("partidoId");
