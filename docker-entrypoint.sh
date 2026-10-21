#!/bin/sh
set -e

# Crea la carpeta de datos persistentes si no existe (primera vez).
mkdir -p "$(dirname "${DATABASE_URL#file:}")" 2>/dev/null || true

# Aplica las migraciones pendientes antes de arrancar. Así actualizar
# la app (git pull + reconstruir) también pone al día la base de datos.
npx prisma migrate deploy

exec "$@"
