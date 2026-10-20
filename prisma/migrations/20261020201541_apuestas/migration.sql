-- CreateTable
CREATE TABLE "Apuesta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "importe" REAL NOT NULL,
    "creadaPorId" TEXT NOT NULL,
    "resultado" TEXT,
    "resueltaEn" DATETIME,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Apuesta_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Apuesta_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pronostico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apuestaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acierto" BOOLEAN,
    "indicadoAporteEn" DATETIME,
    "confirmadoAporteEn" DATETIME,
    "confirmadoAportePorId" TEXT,
    CONSTRAINT "Pronostico_apuestaId_fkey" FOREIGN KEY ("apuestaId") REFERENCES "Apuesta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pronostico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pronostico_confirmadoAportePorId_fkey" FOREIGN KEY ("confirmadoAportePorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pronostico_apuestaId_usuarioId_key" ON "Pronostico"("apuestaId", "usuarioId");
