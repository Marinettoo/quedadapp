import { ETIQUETAS_PIERNA } from "@/lib/usuarios";
import styles from "./TarjetaJugador.module.css";

// Tarjeta visual del jugador (bloque lima con nombre, foto recortada y
// estadísticas): la usan tanto la ficha pública (/jugadores/[id]) como
// la vista previa de "Mi perfil", para no duplicar el diseño.
export function TarjetaJugador({
  jugadorId,
  nombreUsuario,
  fotoActualizadaEn,
  media,
  cuenta,
  partidosJugados,
  golesMarcados,
  partidosOrganizados,
  edad,
  piernaBuena,
}: {
  jugadorId: string;
  nombreUsuario: string;
  fotoActualizadaEn: Date | null;
  media: number | null;
  cuenta: number;
  partidosJugados: number;
  golesMarcados: number;
  partidosOrganizados: number;
  edad: number | null;
  piernaBuena: string | null;
}) {
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
          <span className={styles.estadisticaValor}>{media === null ? "—" : media.toFixed(1)}</span>
          <span className={styles.estadisticaEtiqueta}>
            {cuenta === 0 ? "Sin valoraciones" : `★ (${cuenta} ${cuenta === 1 ? "voto" : "votos"})`}
          </span>
        </div>
        <div className={styles.estadistica}>
          <span className={styles.estadisticaValor}>{partidosJugados}</span>
          <span className={styles.estadisticaEtiqueta}>Partidos jugados</span>
        </div>
        <div className={styles.estadistica}>
          <span className={styles.estadisticaValor}>{golesMarcados}</span>
          <span className={styles.estadisticaEtiqueta}>Goles marcados</span>
        </div>
        {partidosOrganizados > 0 && (
          <div className={styles.estadistica}>
            <span className={styles.estadisticaValor}>{partidosOrganizados}</span>
            <span className={styles.estadisticaEtiqueta}>
              {partidosOrganizados === 1 ? "Partido organizado" : "Partidos organizados"}
            </span>
          </div>
        )}
        {edad !== null && (
          <div className={styles.estadistica}>
            <span className={styles.estadisticaValor}>{edad}</span>
            <span className={styles.estadisticaEtiqueta}>años</span>
          </div>
        )}
        {piernaBuena && (
          <div className={styles.estadistica}>
            <span className={styles.estadisticaValor}>{ETIQUETAS_PIERNA[piernaBuena] ?? piernaBuena}</span>
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
        />
      ) : (
        <span className={styles.fotoPlaceholder} aria-hidden="true">
          {nombreUsuario.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
