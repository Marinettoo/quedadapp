-- CreateTable
CREATE TABLE "Invitado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "anadidoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitado_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitado_anadidoPorId_fkey" FOREIGN KEY ("anadidoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AsignacionEquipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generacionId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "invitadoId" TEXT,
    "equipo" INTEGER NOT NULL,
    CONSTRAINT "AsignacionEquipo_generacionId_fkey" FOREIGN KEY ("generacionId") REFERENCES "GeneracionEquipos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsignacionEquipo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsignacionEquipo_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AsignacionEquipo" ("equipo", "generacionId", "id", "usuarioId") SELECT "equipo", "generacionId", "id", "usuarioId" FROM "AsignacionEquipo";
DROP TABLE "AsignacionEquipo";
ALTER TABLE "new_AsignacionEquipo" RENAME TO "AsignacionEquipo";
CREATE TABLE "new_Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "invitadoId" TEXT,
    "indicadoEn" DATETIME,
    "confirmadoEn" DATETIME,
    "confirmadoPorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pago_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pago" ("confirmadoEn", "confirmadoPorId", "creadoEn", "id", "indicadoEn", "partidoId", "usuarioId") SELECT "confirmadoEn", "confirmadoPorId", "creadoEn", "id", "indicadoEn", "partidoId", "usuarioId" FROM "Pago";
DROP TABLE "Pago";
ALTER TABLE "new_Pago" RENAME TO "Pago";
CREATE UNIQUE INDEX "Pago_partidoId_usuarioId_key" ON "Pago"("partidoId", "usuarioId");
CREATE UNIQUE INDEX "Pago_partidoId_invitadoId_key" ON "Pago"("partidoId", "invitadoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
