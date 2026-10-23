import styles from "./AvatarJugador.module.css";

export function AvatarJugador({
  usuarioId,
  nombre,
  fotoActualizadaEn,
  className,
}: {
  usuarioId: string;
  nombre: string;
  fotoActualizadaEn: Date | null;
  className?: string;
}) {
  if (!fotoActualizadaEn) {
    return (
      <span className={`${styles.avatar} ${styles.inicial} ${className ?? ""}`}>
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
    />
  );
}
