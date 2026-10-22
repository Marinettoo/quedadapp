-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AsignacionEquipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generacionId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "invitadoId" TEXT,
    "equipo" INTEGER NOT NULL,
    "esPortero" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AsignacionEquipo_generacionId_fkey" FOREIGN KEY ("generacionId") REFERENCES "GeneracionEquipos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsignacionEquipo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsignacionEquipo_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AsignacionEquipo" ("equipo", "generacionId", "id", "invitadoId", "usuarioId") SELECT "equipo", "generacionId", "id", "invitadoId", "usuarioId" FROM "AsignacionEquipo";
DROP TABLE "AsignacionEquipo";
ALTER TABLE "new_AsignacionEquipo" RENAME TO "AsignacionEquipo";
CREATE TABLE "new_Asistencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "apuntadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "canceladoEn" DATETIME,
    "esPortero" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Asistencia_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asistencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Asistencia" ("apuntadoEn", "cancelado", "canceladoEn", "id", "partidoId", "usuarioId") SELECT "apuntadoEn", "cancelado", "canceladoEn", "id", "partidoId", "usuarioId" FROM "Asistencia";
DROP TABLE "Asistencia";
ALTER TABLE "new_Asistencia" RENAME TO "Asistencia";
CREATE UNIQUE INDEX "Asistencia_partidoId_usuarioId_key" ON "Asistencia"("partidoId", "usuarioId");
CREATE TABLE "new_Invitado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "esPortero" BOOLEAN NOT NULL DEFAULT false,
    "anadidoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitado_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitado_anadidoPorId_fkey" FOREIGN KEY ("anadidoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invitado" ("anadidoPorId", "creadoEn", "estrellas", "id", "nombre", "partidoId") SELECT "anadidoPorId", "creadoEn", "estrellas", "id", "nombre", "partidoId" FROM "Invitado";
DROP TABLE "Invitado";
ALTER TABLE "new_Invitado" RENAME TO "Invitado";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
