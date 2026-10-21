import Link from "next/link";
import styles from "./page.module.css";

type Pestana = "resumen" | "equipos" | "apuestas";

export function SubnavPartido({ id, activa }: { id: string; activa: Pestana }) {
  const enlaces: { clave: Pestana; etiqueta: string; href: string }[] = [
    { clave: "resumen", etiqueta: "Resumen", href: `/partidos/${id}` },
    { clave: "equipos", etiqueta: "Equipos", href: `/partidos/${id}/equipos` },
    { clave: "apuestas", etiqueta: "Apuestas", href: `/partidos/${id}/apuestas` },
  ];

  return (
    <nav className={styles.subnav}>
      {enlaces.map((e) => (
        <Link
          key={e.clave}
          href={e.href}
          className={e.clave === activa ? styles.subnavActiva : styles.subnavItem}
        >
          {e.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
