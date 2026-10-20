-- CreateTable
CREATE TABLE "Partido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fechaHora" DATETIME NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "horasCierre" INTEGER NOT NULL DEFAULT 2,
    "encargadoId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partido_encargadoId_fkey" FOREIGN KEY ("encargadoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Partido_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "apuntadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "canceladoEn" DATETIME,
    CONSTRAINT "Asistencia_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asistencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_partidoId_usuarioId_key" ON "Asistencia"("partidoId", "usuarioId");
