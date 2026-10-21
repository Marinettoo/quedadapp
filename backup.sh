#!/bin/sh
# Copia de seguridad de la base de datos (un solo archivo SQLite).
# Guarda copias con fecha en ./backups, fuera de ./data, para poder
# llevártelas a otro sitio (otro disco, la nube...) y que una copia
# local no dependa del mismo disco que los datos en vivo.
set -e

CARPETA_DESTINO="./backups"
FECHA=$(date +%Y%m%d-%H%M%S)

mkdir -p "$CARPETA_DESTINO"
cp ./data/dev.db "$CARPETA_DESTINO/dev-$FECHA.db"
echo "Copia guardada en $CARPETA_DESTINO/dev-$FECHA.db"

# Conserva solo las últimas 14 copias para no llenar el disco.
ls -1t "$CARPETA_DESTINO"/dev-*.db 2>/dev/null | tail -n +15 | xargs -r rm --
