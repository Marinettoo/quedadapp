import styles from "./page.module.css";

// Se muestra mientras se cargan los datos de la pestaña (Resumen/Equipos/
// Apuestas) sin tocar la cabecera ni las pestañas, que viven en el layout
// y se quedan fijas. Así el cambio de pestaña no deja un hueco en blanco.
export default function CargandoPartido() {
  return <p className={styles.meta}>Cargando…</p>;
}
