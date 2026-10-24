-- CreateTable
CREATE TABLE "VotacionMvp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "creadaPorId" TEXT NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "cerradaEn" DATETIME,
    "ganadorId" TEXT,
    CONSTRAINT "VotacionMvp_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotacionMvp_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VotoMvp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "votacionId" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "votadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotoMvp_votacionId_fkey" FOREIGN KEY ("votacionId") REFERENCES "VotacionMvp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotoMvp_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotoMvp_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreUsuario" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'USUARIO',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fotoActualizadaEn" DATETIME,
    "fotoOffsetX" REAL NOT NULL DEFAULT 0,
    "fotoOffsetY" REAL NOT NULL DEFAULT 0,
    "fotoEscala" REAL NOT NULL DEFAULT 1,
    "fechaNacimiento" DATETIME,
    "piernaBuena" TEXT,
    "esMvpActual" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Usuario" ("creadoEn", "email", "estado", "fechaNacimiento", "fotoActualizadaEn", "fotoEscala", "fotoOffsetX", "fotoOffsetY", "id", "nombreUsuario", "passwordHash", "piernaBuena", "rol") SELECT "creadoEn", "email", "estado", "fechaNacimiento", "fotoActualizadaEn", "fotoEscala", "fotoOffsetX", "fotoOffsetY", "id", "nombreUsuario", "passwordHash", "piernaBuena", "rol" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_nombreUsuario_key" ON "Usuario"("nombreUsuario");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VotoMvp_votacionId_autorId_key" ON "VotoMvp"("votacionId", "autorId");

