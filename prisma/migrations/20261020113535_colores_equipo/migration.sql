-- CreateTable
CREATE TABLE "ColorEquipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidoId" TEXT NOT NULL,
    "equipo" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    CONSTRAINT "ColorEquipo_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ColorEquipo_partidoId_equipo_key" ON "ColorEquipo"("partidoId", "equipo");
