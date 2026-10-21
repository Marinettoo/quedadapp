/*
  Warnings:

  - You are about to drop the column `importe` on the `Apuesta` table. All the data in the column will be lost.
  - You are about to drop the column `pregunta` on the `Apuesta` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Apuesta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "cuota" REAL NOT NULL DEFAULT 0.2,
    "creadaPorId" TEXT NOT NULL,
    "resultado" TEXT,
    "resueltaEn" DATETIME,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Apuesta_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Apuesta_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Apuesta" ("creadaEn", "creadaPorId", "cuota", "id", "partidoId", "resueltaEn", "resultado") SELECT "creadaEn", "creadaPorId", "cuota", "id", "partidoId", "resueltaEn", "resultado" FROM "Apuesta";
DROP TABLE "Apuesta";
ALTER TABLE "new_Apuesta" RENAME TO "Apuesta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
