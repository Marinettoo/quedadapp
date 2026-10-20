import { RegistroForm } from "./RegistroForm";
import styles from "./page.module.css";

export default function Registro() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Únete a la peña</h1>
      <p className={styles.body}>
        Crea tu cuenta. Un administrador tendrá que aprobarla antes de que
        puedas usar la app.
      </p>
      <RegistroForm />
    </main>
  );
}
