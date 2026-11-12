-- Invitado pasa a ser una persona permanente de la peña (como un
-- Usuario, pero sin cuenta): antes cada partido creaba su propio
-- "invitado" suelto, así que sus goles no se sumaban entre partidos
-- aunque fuera la misma persona. Ahora el invitado es permanente y
-- cada partido guarda aparte, en AsistenciaInvitado, su valoración y
-- si jugó de portero ESE partido.
--
-- Orden importante: primero se copian los datos de cada Invitado (que
-- hoy vive "dentro" de un partido concreto) a la nueva tabla
-- AsistenciaInvitado, ANTES de reconstruir Invitado sin esas columnas
-- — si no, se perdería para siempre a qué partido iba cada uno, su
-- valoración de ese partido y si jugó de portero.

PRAGMA foreign_keys=OFF;

CREATE TABLE "AsistenciaInvitado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "invitadoId" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "esPortero" BOOLEAN NOT NULL DEFAULT false,
    "anadidoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AsistenciaInvitado_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsistenciaInvitado_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsistenciaInvitado_anadidoPorId_fkey" FOREIGN KEY ("anadidoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Cada Invitado existente se convierte en su propia primera (y, hasta
-- ahora, única) asistencia a un partido: se preserva tal cual a qué
-- partido iba, su valoración y si jugaba de portero.
INSERT INTO "AsistenciaInvitado" ("id", "partidoId", "invitadoId", "estrellas", "esPortero", "anadidoPorId", "creadoEn")
SELECT
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
    "partidoId",
    "id",
    "estrellas",
    "esPortero",
    "anadidoPorId",
    "creadoEn"
FROM "Invitado";

CREATE UNIQUE INDEX "AsistenciaInvitado_partidoId_invitadoId_key" ON "AsistenciaInvitado"("partidoId", "invitadoId");

-- Reconstruye Invitado sin partidoId/estrellas/esPortero, y
-- anadidoPorId pasa a llamarse creadoPorId (misma persona, mismo
-- significado: quien lo dio de alta la primera vez).
CREATE TABLE "new_Invitado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitado_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invitado" ("id", "nombre", "creadoPorId", "creadoEn")
SELECT "id", "nombre", "anadidoPorId", "creadoEn" FROM "Invitado";
DROP TABLE "Invitado";
ALTER TABLE "new_Invitado" RENAME TO "Invitado";

PRAGMA foreign_keys=ON;
