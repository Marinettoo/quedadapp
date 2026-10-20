import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  titulo: string;
  subtitulo?: string;
};

export function AppHeader({ titulo, subtitulo }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.titulo}>{titulo}</h1>
      {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
    </header>
  );
}
