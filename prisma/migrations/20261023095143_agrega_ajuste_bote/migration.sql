-- CreateTable
CREATE TABLE "AjusteBote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importe" REAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AjusteBote_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
