import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import styles from "./page.module.css";

export const instant = false;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function Votaciones() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const votaciones = await prisma.votacionFecha.findMany({
    orderBy: [{ cerrada: "asc" }, { creadaEn: "desc" }],
    include: {
      opciones: { orderBy: { fechaHora: "asc" } },
      votos: true,
    },
  });

  return (
    <main className={styles.screen}>
      <div className={styles.cabecera}>
        <AppHeader
          titulo="Votaciones"
          subtitulo="Decide entre toda la peña cuándo será el próximo partido."
        />
        {usuario.rol === "ADMIN" && (
          <Link href="/votaciones/nueva" className={styles.crear}>
            Crear votación
          </Link>
        )}
      </div>

      {votaciones.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay ninguna votación.</p>
      ) : (
        <ul className={styles.lista}>
          {votaciones.map((v) => {
            const cuentas = v.opciones.map((o) => ({
              opcion: o,
              cuenta: v.votos.filter((voto) => voto.opcionId === o.id).length,
            }));
            const maxVotos = Math.max(0, ...cuentas.map((c) => c.cuenta));
            const ganadoras = cuentas.filter((c) => maxVotos > 0 && c.cuenta === maxVotos);

            let estado = "Abierta";
            if (v.cerrada) {
              if (ganadoras.length === 0) {
                estado = "Cerrada";
              } else if (ganadoras.length > 1) {
                estado = `Cerrada · empate entre ${ganadoras.length} opciones`;
              } else {
                estado = `Cerrada · ganó ${formatearFecha(ganadoras[0].opcion.fechaHora)}`;
              }
            }

            return (
              <li key={v.id}>
                <Link href={`/votaciones/${v.id}`} className={styles.votacion}>
                  <span className={styles.votacionTitulo}>{v.titulo}</span>
                  <span className={styles.meta}>
                    {v.opciones.length} opciones · {v.votos.length} votos
                  </span>
                  <span className={styles.estado}>{estado}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
