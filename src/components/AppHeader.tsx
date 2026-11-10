import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  titulo: string;
  subtitulo?: string;
  // Iconos de acción arriba a la derecha del título (p. ej. editar/eliminar
  // un partido, solo para quien tenga permiso) — opcional, no lo usan la
  // mayoría de pantallas.
  acciones?: React.ReactNode;
};

export function AppHeader({ titulo, subtitulo, acciones }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.textos}>
        <h1 className={styles.titulo}>{titulo}</h1>
        {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
      </div>
      {acciones && <div className={styles.acciones}>{acciones}</div>}
    </header>
  );
}
