import Link from "next/link";
import styles from "../page.module.css";

export default function RegistroEnviado() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Cuenta creada</h1>
      <p className={styles.body}>
        Tu solicitud está pendiente de aprobación. Un administrador la
        revisará y, cuando la apruebe, podrás entrar con tu nombre de
        usuario y contraseña.
      </p>
      <Link className={styles.back} href="/">
        Volver al acceso
      </Link>
    </main>
  );
}
