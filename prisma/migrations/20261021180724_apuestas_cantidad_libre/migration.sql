/*
  Warnings:

  - Added the required column `cantidad` to the `Pronostico` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pronostico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apuestaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acierto" BOOLEAN,
    "importeDebido" REAL,
    "importeGanado" REAL,
    "indicadoAporteEn" DATETIME,
    "confirmadoAporteEn" DATETIME,
    "confirmadoAportePorId" TEXT,
    CONSTRAINT "Pronostico_apuestaId_fkey" FOREIGN KEY ("apuestaId") REFERENCES "Apuesta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pronostico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pronostico_confirmadoAportePorId_fkey" FOREIGN KEY ("confirmadoAportePorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pronostico" ("acierto", "apuestaId", "confirmadoAporteEn", "confirmadoAportePorId", "creadoEn", "id", "importeDebido", "indicadoAporteEn", "respuesta", "usuarioId") SELECT "acierto", "apuestaId", "confirmadoAporteEn", "confirmadoAportePorId", "creadoEn", "id", "importeDebido", "indicadoAporteEn", "respuesta", "usuarioId" FROM "Pronostico";
DROP TABLE "Pronostico";
ALTER TABLE "new_Pronostico" RENAME TO "Pronostico";
CREATE UNIQUE INDEX "Pronostico_apuestaId_usuarioId_key" ON "Pronostico"("apuestaId", "usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
