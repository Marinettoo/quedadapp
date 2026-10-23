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
    "piernaBuena" TEXT
);
INSERT INTO "new_Usuario" ("creadoEn", "email", "estado", "fechaNacimiento", "fotoActualizadaEn", "id", "nombreUsuario", "passwordHash", "piernaBuena", "rol") SELECT "creadoEn", "email", "estado", "fechaNacimiento", "fotoActualizadaEn", "id", "nombreUsuario", "passwordHash", "piernaBuena", "rol" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_nombreUsuario_key" ON "Usuario"("nombreUsuario");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
