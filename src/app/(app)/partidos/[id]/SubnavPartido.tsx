"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import styles from "./page.module.css";

export function SubnavPartido({ id }: { id: string }) {
  const pathname = usePathname();
  const enlaces = [
    { etiqueta: "Resumen", href: `/partidos/${id}` },
    { etiqueta: "Equipos", href: `/partidos/${id}/equipos` },
    { etiqueta: "Apuestas", href: `/partidos/${id}/apuestas` },
  ];

  return (
    <nav className={styles.subnav}>
      {enlaces.map((e) => {
        const activo = pathname === e.href;
        return (
          <Link
            key={e.href}
            href={e.href}
            className={activo ? styles.subnavActiva : styles.subnavItem}
          >
            {activo && (
              <motion.span
                layoutId="subnav-pill"
                className={styles.subnavPill}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
            <span className={styles.subnavTexto}>{e.etiqueta}</span>
          </Link>
        );
      })}
    </nav>
  );
}
