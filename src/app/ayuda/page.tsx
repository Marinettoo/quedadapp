import Link from "next/link";
import { AyudaContenido } from "@/components/AyudaContenido";
import styles from "./page.module.css";

export default function Ayuda() {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>¿Cómo funciona?</h1>
      <p className={styles.intro}>Lo esencial de QuedadApp, en cinco pasos.</p>

      <AyudaContenido />

      <Link className={styles.back} href="/">
        Volver
      </Link>
    </main>
  );
}
