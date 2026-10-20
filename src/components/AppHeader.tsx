import Link from "next/link";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  titulo: string;
  subtitulo?: string;
  enPanel?: boolean;
};

export function AppHeader({ titulo, subtitulo, enPanel = false }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      {enPanel ? (
        <span className={styles.wordmark}>Quedadapp</span>
      ) : (
        <Link href="/panel" className={styles.wordmark}>
          Quedadapp
        </Link>
      )}
      <h1 className={styles.titulo}>{titulo}</h1>
      {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
    </header>
  );
}
