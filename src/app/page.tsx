import { redirect } from "next/navigation";
import { BallMark } from "@/components/BallMark";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { CreadorModal } from "@/components/CreadorModal";
import styles from "./page.module.css";

// Lee la sesión en cada petición para decidir si redirige a /panel.
export const instant = false;

export default async function Home() {
  const usuario = await obtenerUsuarioSesion();
  if (usuario) {
    redirect("/panel");
  }

  return (
    <main className={styles.screen}>
      <section className={styles.poster}>
        <span className={styles.wordmarkOnPoster}>Quedadapp</span>
        <h1 className={styles.headline}>
          La app de los sábado fúrbo
        </h1>
        <p className={styles.subhead}>
          Partidos, equipos y pagos de la peña, todo en un sitio.
        </p>
        <BallMark className={styles.ball} />
      </section>

      <section className={styles.panel}>
        <span className={styles.wordmark}>Quedadapp</span>
        <div className={styles.panelInner}>
          <h2 className={styles.formTitle}>Entrar</h2>
          <LoginForm />
          <div className={styles.creador}>
            <CreadorModal />
          </div>
        </div>
      </section>
    </main>
  );
}
