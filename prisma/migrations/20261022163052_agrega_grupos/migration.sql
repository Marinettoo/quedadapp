-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Grupo_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MiembroGrupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grupoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "invitadoId" TEXT,
    CONSTRAINT "MiembroGrupo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MiembroGrupo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MiembroGrupo_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MiembroGrupo_grupoId_usuarioId_key" ON "MiembroGrupo"("grupoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "MiembroGrupo_grupoId_invitadoId_key" ON "MiembroGrupo"("grupoId", "invitadoId");
