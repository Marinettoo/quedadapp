-- CreateTable
CREATE TABLE "GolJugador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enfrentamientoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "invitadoId" TEXT,
    "goles" INTEGER NOT NULL,
    CONSTRAINT "GolJugador_enfrentamientoId_fkey" FOREIGN KEY ("enfrentamientoId") REFERENCES "Enfrentamiento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GolJugador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GolJugador_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GolJugador_enfrentamientoId_usuarioId_key" ON "GolJugador"("enfrentamientoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "GolJugador_enfrentamientoId_invitadoId_key" ON "GolJugador"("enfrentamientoId", "invitadoId");
