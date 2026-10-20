import Link from "next/link";
import styles from "./page.module.css";

export default function Registro() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Únete a la peña</h1>
      <p className={styles.body}>
        El registro todavía no está activo: es el siguiente paso del
        proyecto. Vuelve pronto o pide a un administrador que te dé acceso.
      </p>
      <Link className={styles.back} href="/">
        Volver al acceso
      </Link>
    </main>
  );
}
