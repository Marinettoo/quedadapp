-- CreateTable
CREATE TABLE "VotacionFecha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "creadaPorId" TEXT NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "cerradaEn" DATETIME,
    CONSTRAINT "VotacionFecha_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpcionVotacionFecha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "votacionId" TEXT NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    CONSTRAINT "OpcionVotacionFecha_votacionId_fkey" FOREIGN KEY ("votacionId") REFERENCES "VotacionFecha" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VotoFecha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "votacionId" TEXT NOT NULL,
    "opcionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "votadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotoFecha_votacionId_fkey" FOREIGN KEY ("votacionId") REFERENCES "VotacionFecha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotoFecha_opcionId_fkey" FOREIGN KEY ("opcionId") REFERENCES "OpcionVotacionFecha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VotoFecha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VotoFecha_votacionId_usuarioId_key" ON "VotoFecha"("votacionId", "usuarioId");
