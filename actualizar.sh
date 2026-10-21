#!/bin/sh
# Actualiza la app en el servidor: baja el código nuevo, reconstruye
# la imagen y reinicia. Las migraciones de base de datos se aplican
# solas al arrancar (ver docker-entrypoint.sh). Los datos (dev.db) no
# se tocan: viven en ./data, fuera de la imagen.
set -e

echo "Actualizando QuedadApp..."
git pull
docker compose up -d --build
echo "Hecho. Comprueba que todo va bien con: docker compose logs -f app"
