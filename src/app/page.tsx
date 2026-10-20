import { BallMark } from "@/components/BallMark";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.screen}>
      <section className={styles.poster}>
        <span className={styles.wordmarkOnPoster}>QuedadApp</span>
        <h1 className={styles.headline}>
          El equipo se decide solo si te apuntas.
        </h1>
        <p className={styles.subhead}>
          Partidos, equipos y pagos de la peña, todo en un sitio.
        </p>
        <BallMark className={styles.ball} />
      </section>

      <section className={styles.panel}>
        <span className={styles.wordmark}>QuedadApp</span>
        <div className={styles.panelInner}>
          <h2 className={styles.formTitle}>Entrar</h2>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
