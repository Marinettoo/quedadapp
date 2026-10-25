import styles from "./AvatarJugador.module.css";

export function AvatarJugador({
  usuarioId,
  nombre,
  fotoActualizadaEn,
  className,
  tamano,
}: {
  usuarioId: string;
  nombre: string;
  fotoActualizadaEn: Date | null;
  className?: string;
  // En px: por defecto usa el tamaño fijo de .avatar (40px). Como
  // inline style, no depende del orden de las reglas CSS entre
  // distintos módulos (que ya nos dio un problema parecido antes).
  tamano?: number;
}) {
  const estilo = tamano
    ? { width: tamano, height: tamano, fontSize: Math.round(tamano * 0.4) }
    : undefined;

  if (!fotoActualizadaEn) {
    return (
      <span className={`${styles.avatar} ${styles.inicial} ${className ?? ""}`} style={estilo}>
        {nombre.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagen servida desde disco vía /fotos/[id], no optimizable por next/image
    <img
      src={`/fotos/${usuarioId}?v=${fotoActualizadaEn.getTime()}`}
      alt=""
      className={`${styles.avatar} ${className ?? ""}`}
      style={estilo}
    />
  );
}
