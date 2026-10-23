import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { crearAjusteBote, eliminarAjusteBote } from "./actions";
import styles from "./page.module.css";

export const instant = false;

const ETIQUETAS: Record<string, string> = {
  EQUIPO1: "Victoria Equipo 1",
  EMPATE: "Empate",
  EQUIPO2: "Victoria Equipo 2",
};

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function Bote() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const confirmados = await prisma.pronostico.findMany({
    where: { confirmadoAporteEn: { not: null } },
    include: {
      usuario: { select: { nombreUsuario: true } },
      apuesta: { select: { partidoId: true } },
    },
    orderBy: { confirmadoAporteEn: "desc" },
  });

  const pendientes = await prisma.pronostico.findMany({
    where: { importeDebido: { not: null }, confirmadoAporteEn: null },
    include: {
      usuario: { select: { nombreUsuario: true } },
      apuesta: { select: { partidoId: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  const ajustes = await prisma.ajusteBote.findMany({
    include: { creadoPor: { select: { nombreUsuario: true } } },
    orderBy: { creadoEn: "desc" },
  });

  const totalApuestas = confirmados.reduce((s, p) => s + (p.importeDebido ?? 0), 0);
  const totalAjustes = ajustes.reduce((s, a) => s + a.importe, 0);
  const total = totalApuestas + totalAjustes;
  const esAdmin = usuario.rol === "ADMIN";

  return (
    <main className={styles.screen}>
      <AppHeader titulo="Bote de la peña" subtitulo="Lo que se acumula cuando alguien falla una apuesta." />

      <div className={styles.destacado}>
        <span className={styles.destacadoEtiqueta}>Total acumulado</span>
        <span className={styles.destacadoImporte}>{total.toFixed(2)} €</span>
      </div>

      {pendientes.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.subtitulo}>Pendientes de confirmar</h2>
          <ul className={styles.lista}>
            {pendientes.map((p) => (
              <li key={p.id} className={styles.item}>
                <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
                <span className={styles.meta}>
                  {" "}
                  · {ETIQUETAS[p.respuesta] ?? p.respuesta} · {(p.importeDebido ?? 0).toFixed(2)} €
                  {p.indicadoAporteEn ? " · indicado" : ""}
                </span>
                <Link href={`/partidos/${p.apuesta.partidoId}`} className={styles.ver}>
                  Ver partido
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Historial de aportes</h2>
        {confirmados.length === 0 ? (
          <p className={styles.meta}>Todavía no hay aportes confirmados.</p>
        ) : (
          <ul className={styles.lista}>
            {confirmados.map((p) => (
              <li key={p.id} className={styles.item}>
                <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
                <span className={styles.meta}>
                  {" "}
                  · {ETIQUETAS[p.respuesta] ?? p.respuesta} ·{" "}
                  {(p.importeDebido ?? 0).toFixed(2)} € · {formatearFecha(p.confirmadoAporteEn!)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Ajustes manuales</h2>
        <p className={styles.meta}>
          Dinero que un administrador suma o resta a mano (por ejemplo, un gasto o un ingreso en
          efectivo fuera de las apuestas).
        </p>
        {ajustes.length > 0 && (
          <ul className={styles.lista}>
            {ajustes.map((a) => (
              <li key={a.id} className={styles.item}>
                <span className={styles.nombre}>
                  {a.importe >= 0 ? "+" : ""}
                  {a.importe.toFixed(2)} €
                </span>
                <span className={styles.meta}>
                  {" "}
                  · {a.motivo} · {a.creadoPor.nombreUsuario} · {formatearFecha(a.creadoEn)}
                </span>
                {esAdmin && (
                  <AccionBoton
                    accion={eliminarAjusteBote}
                    campos={{ id: a.id }}
                    className={styles.ver}
                  >
                    Quitar
                  </AccionBoton>
                )}
              </li>
            ))}
          </ul>
        )}
        {esAdmin && (
          <form action={crearAjusteBote} className={styles.ajusteForm}>
            <input
              type="number"
              name="importe"
              min={0.01}
              step={0.01}
              placeholder="Importe €"
              required
              className={styles.ajusteInput}
            />
            <select name="tipo" defaultValue="sumar" required>
              <option value="sumar">Sumar</option>
              <option value="restar">Restar</option>
            </select>
            <input
              type="text"
              name="motivo"
              placeholder="Motivo (p. ej. compra de petos)"
              required
              className={styles.ajusteMotivo}
            />
            <button type="submit" className={styles.ajusteBoton}>
              Guardar ajuste
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
