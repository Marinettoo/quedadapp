"use client";

import { ETIQUETAS_PIERNA } from "@/lib/usuarios";
import { ContadorAnimado } from "./ContadorAnimado";
import { TextoEscrito } from "./TextoEscrito";
import styles from "./TarjetaJugador.module.css";

const RETRASO_ENTRE_CHIPS = 110;

// Tarjeta visual del jugador (bloque lima con nombre, foto recortada y
// estadísticas): la usan tanto la ficha pública (/jugadores/[id]) como
// la vista previa de "Mi perfil", para no duplicar el diseño. Las
// estadísticas numéricas cuentan rápido hasta su valor al aparecer, y
// las de texto (pierna buena) se "escriben" de izquierda a derecha.
export function TarjetaJugador({
  jugadorId,
  nombreUsuario,
  fotoActualizadaEn,
  media,
  cuenta,
  partidosJugados,
  golesMarcados,
  edad,
  piernaBuena,
  fotoOffsetX = 0,
  fotoOffsetY = 0,
  fotoEscala = 1,
}: {
  jugadorId: string;
  nombreUsuario: string;
  fotoActualizadaEn: Date | null;
  media: number | null;
  cuenta: number;
  partidosJugados: number;
  golesMarcados: number;
  edad: number | null;
  piernaBuena: string | null;
  // cómo encuadró cada uno su foto desde "Mi perfil" (arrastre + zoom).
  fotoOffsetX?: number;
  fotoOffsetY?: number;
  fotoEscala?: number;
}) {
  let indiceChip = 0;

  return (
    <div className={styles.ficha}>
      <div className={styles.fichaDecoracion} aria-hidden="true">
        <span className={styles.fichaPunto} />
        <span className={styles.fichaEsquina} />
      </div>
      <div className={styles.fichaMarco} aria-hidden="true" />
      <h1 className={styles.nombre}>{nombreUsuario}</h1>

      <div className={styles.estadisticas}>
        <div className={styles.estadistica}>
          <span className={styles.estadisticaValor}>
            {media === null ? (
              "—"
            ) : (
              <ContadorAnimado valor={media} decimales={1} retraso={indiceChip++ * RETRASO_ENTRE_CHIPS} />
            )}
          </span>
          <span className={styles.estadisticaEtiqueta}>
            {cuenta === 0 ? "Sin valoraciones" : `★ (${cuenta} ${cuenta === 1 ? "voto" : "votos"})`}
          </span>
        </div>
        <div className={styles.estadistica}>
          <span className={styles.estadisticaValor}>
            <ContadorAnimado valor={partidosJugados} retraso={indiceChip++ * RETRASO_ENTRE_CHIPS} />
          </span>
          <span className={styles.estadisticaEtiqueta}>Partidos jugados</span>
        </div>
        <div className={styles.estadistica}>
          <span className={styles.estadisticaValor}>
            <ContadorAnimado valor={golesMarcados} retraso={indiceChip++ * RETRASO_ENTRE_CHIPS} />
          </span>
          <span className={styles.estadisticaEtiqueta}>Goles marcados</span>
        </div>
        {edad !== null && (
          <div className={styles.estadistica}>
            <span className={styles.estadisticaValor}>
              <ContadorAnimado valor={edad} retraso={indiceChip++ * RETRASO_ENTRE_CHIPS} />
            </span>
            <span className={styles.estadisticaEtiqueta}>años</span>
          </div>
        )}
        {piernaBuena && (
          <div className={styles.estadistica}>
            <span className={styles.estadisticaValor}>
              <TextoEscrito
                texto={ETIQUETAS_PIERNA[piernaBuena] ?? piernaBuena}
                retraso={indiceChip++ * RETRASO_ENTRE_CHIPS}
              />
            </span>
            <span className={styles.estadisticaEtiqueta}>Pierna buena</span>
          </div>
        )}
      </div>

      {fotoActualizadaEn ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen servida desde disco vía /fotos/[id], no optimizable por next/image
        <img
          src={`/fotos/${jugadorId}?v=${fotoActualizadaEn.getTime()}`}
          alt=""
          className={styles.foto}
          style={{
            // Porcentajes (no px): en CSS, translate(x%, y%) se calcula
            // sobre el propio tamaño del elemento, así que el mismo
            // encuadre se ve igual tanto si la foto es grande (PC) como
            // pequeña (móvil), en vez de desplazarse de más o de menos.
            transform: `translate(${fotoOffsetX}%, ${fotoOffsetY}%) scale(${fotoEscala})`,
          }}
        />
      ) : (
        <span className={styles.fotoPlaceholder} aria-hidden="true">
          {nombreUsuario.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
