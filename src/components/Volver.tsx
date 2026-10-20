import Link from "next/link";
import styles from "./Volver.module.css";

export function Volver({ href = "/panel", children = "Volver" }: { href?: string; children?: string }) {
  return (
    <Link href={href} className={styles.volver}>
      ← {children}
    </Link>
  );
}
