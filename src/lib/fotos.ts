import path from "node:path";

// Las fotos de perfil se guardan como archivos en disco (no en la base
// de datos) junto a la base de datos SQLite, en la misma carpeta
// persistente (./data en producción, vía el volumen Docker ya existente
// para dev.db/prod.db) para no tener que tocar docker-compose.yml.
function carpetaDatos(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const rutaDb = url.replace(/^file:/, "");
  return path.dirname(rutaDb);
}

export function directorioFotos(): string {
  return path.join(carpetaDatos(), "fotos");
}

export function rutaFoto(usuarioId: string): string {
  return path.join(directorioFotos(), `${usuarioId}.png`);
}
