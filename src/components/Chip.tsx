import Link from "next/link";
import styles from "./Chip.module.css";

type ChipProps = {
  href: string;
  children: React.ReactNode;
  badge?: number;
};

export function Chip({ href, children, badge }: ChipProps) {
  return (
    <Link href={href} className={styles.chip}>
      {children}
      {!!badge && <span className={styles.badge}>{badge}</span>}
    </Link>
  );
}
