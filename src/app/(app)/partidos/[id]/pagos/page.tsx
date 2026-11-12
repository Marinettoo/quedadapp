import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccionBoton } from "@/components/AccionBoton";
import {
  establecerImporte,
  indicarPago,
  deshacerIndicacion,
  confirmarPago,
  corregirConfirmacion,
} from "../../pagosActions";
import styles from "../page.module.css";

export const instant = false;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function PagosPartido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const partido = await prisma.partido.findUnique({
    where: { id },
    select: {
      id: true,
      encargadoId: true,
      importeTotal: true,
      asistencias: {
        where: { cancelado: false },
        orderBy: { apuntadoEn: "asc" },
        include: { usuario: { select: { id: true, nombreUsuario: true } } },
      },
      pagos: true,
      invitados: {
        orderBy: { creadoEn: "asc" },
        include: { invitado: { select: { id: true, nombre: true } } },
      },
    },
  });

  if (!partido) {
    notFound();
  }

  const puedeGenerar = usuario.rol === "ADMIN" || partido.encargadoId === usuario.id;
  // Confirmar pagos es solo cosa de quien reserva, aunque sea admin.
  const puedeConfirmarPagos = partido.encargadoId === usuario.id;
  const puedeVerPagos =
    usuario.rol === "ADMIN" ||
    partido.encargadoId === usuario.id ||
    partido.asistencias.some((a) => a.usuarioId === usuario.id);
  // Un usuario normal (ni admin ni encargado) solo ve su propia fila de pago.
  const puedeVerListaPagos = puedeGenerar;

  type Jugador = {
    usuario: { id: string; nombreUsuario: string } | null;
    invitado: { id: string; nombre: string } | null;
  };
  function nombreAsignacion(a: Jugador) {
    return a.usuario ? a.usuario.nombreUsuario : `${a.invitado!.nombre} (invitado)`;
  }
  function claveAsignacion(a: Jugador) {
    return a.usuario ? `u:${a.usuario.id}` : `i:${a.invitado!.id}`;
  }

  // Los pagos van ligados a quién está apuntado, no a los equipos: se
  // puede pagar la reserva antes de que se generen los equipos.
  const asistentesParaPago: Jugador[] = [
    ...partido.asistencias.map((a) => ({ usuario: a.usuario, invitado: null })),
    ...partido.invitados.map((i) => ({ usuario: null, invitado: i.invitado })),
  ];

  const pagosPorClave = new Map(
    partido.pagos.map((p) => [p.usuarioId ? `u:${p.usuarioId}` : `i:${p.invitadoId}`, p]),
  );
  const parteImporte =
    partido.importeTotal !== null && asistentesParaPago.length > 0
      ? partido.importeTotal / asistentesParaPago.length
      : null;

  if (!puedeVerPagos) {
    return <p className={styles.meta}>No puedes ver los pagos de este partido.</p>;
  }

  if (asistentesParaPago.length === 0) {
    return <p className={styles.meta}>Todavía no se ha apuntado nadie a este partido.</p>;
  }

  return (
    <section>
      {puedeGenerar ? (
        <form action={establecerImporte} className={styles.importeForm}>
          <input type="hidden" name="partidoId" value={partido.id} />
          <label htmlFor="importeTotal" className={styles.meta}>
            Importe total de la reserva (€)
          </label>
          <div className={styles.importeCampos}>
            <input
              id="importeTotal"
              name="importeTotal"
              type="number"
              min={0}
              step="0.01"
              defaultValue={partido.importeTotal ?? ""}
              required
            />
            <button type="submit" className={styles.generar}>
              Guardar
            </button>
          </div>
        </form>
      ) : (
        partido.importeTotal !== null && (
          <p className={styles.meta}>Importe total: {partido.importeTotal.toFixed(2)} €</p>
        )
      )}

      {parteImporte !== null && (
        <div className={styles.importeDestacado}>
          <span className={styles.importeDestacadoCifra}>{parteImporte.toFixed(2)} €</span>
          <span className={styles.importeDestacadoEtiqueta}>
            por jugador ({asistentesParaPago.length}{" "}
            {asistentesParaPago.length === 1 ? "jugador" : "jugadores"})
          </span>
        </div>
      )}

      <ul className={styles.lista}>
        {(puedeVerListaPagos
          ? asistentesParaPago
          : asistentesParaPago.filter((a) => a.usuario?.id === usuario.id)
        ).map((a) => {
          const clave = claveAsignacion(a);
          const tipo = a.usuario ? "USUARIO" : "INVITADO";
          const jugadorId = a.usuario ? a.usuario.id : a.invitado!.id;
          const pago = pagosPorClave.get(clave);
          const estado = pago?.confirmadoEn
            ? `Confirmado el ${formatearFecha(pago.confirmadoEn)}`
            : pago?.indicadoEn
              ? "Indicado, pendiente de confirmación"
              : "Pendiente de indicar";

          return (
            <li key={clave} className={styles.pagoFila}>
              <div>
                <span className={styles.nombre}>{nombreAsignacion(a)}</span>
                <span className={styles.meta}> · {estado}</span>
              </div>
              <div className={styles.pagoAcciones}>
                {a.usuario?.id === usuario.id &&
                  (!pago?.confirmadoEn ? (
                    !pago?.indicadoEn ? (
                      <AccionBoton
                        accion={indicarPago}
                        campos={{ partidoId: partido.id }}
                        className={styles.pagoBoton}
                      >
                        He pagado
                      </AccionBoton>
                    ) : (
                      <AccionBoton
                        accion={deshacerIndicacion}
                        campos={{ partidoId: partido.id }}
                        className={styles.pagoBotonSecundario}
                      >
                        Deshacer
                      </AccionBoton>
                    )
                  ) : null)}

                {puedeConfirmarPagos &&
                  (!pago?.confirmadoEn ? (
                    <AccionBoton
                      accion={confirmarPago}
                      campos={{ partidoId: partido.id, jugadorId, tipo }}
                      className={styles.pagoBoton}
                    >
                      Confirmar
                    </AccionBoton>
                  ) : (
                    <AccionBoton
                      accion={corregirConfirmacion}
                      campos={{ partidoId: partido.id, jugadorId, tipo }}
                      className={styles.pagoBotonSecundario}
                    >
                      Corregir
                    </AccionBoton>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
