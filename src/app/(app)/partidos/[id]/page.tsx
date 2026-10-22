import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
import { AppHeader } from "@/components/AppHeader";
import { apuntarse, cancelarAsistencia, cambiarMiPortero, cambiarPorteroDeUsuario } from "../actions";
import {
  establecerImporte,
  indicarPago,
  deshacerIndicacion,
  confirmarPago,
  corregirConfirmacion,
} from "../pagosActions";
import {
  agregarEnfrentamiento,
  editarEnfrentamiento,
  eliminarEnfrentamiento,
} from "../resultadosActions";
import { calcularTabla } from "@/lib/resultados";
import { AccionBoton } from "@/components/AccionBoton";
import { ListaAnimada, ItemAnimado } from "@/components/ListaAnimada";
import { EditarPartido } from "./EditarPartido";
import { SubnavPartido } from "./SubnavPartido";
import styles from "./page.module.css";

export const instant = false;

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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

export default async function DetallePartido({
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
    include: {
      encargado: { select: { nombreUsuario: true } },
      asistencias: {
        orderBy: { apuntadoEn: "asc" },
        include: { usuario: { select: { id: true, nombreUsuario: true } } },
      },
      generacion: {
        include: {
          asignaciones: {
            include: {
              usuario: { select: { id: true, nombreUsuario: true } },
              invitado: { select: { id: true, nombre: true } },
            },
          },
        },
      },
      pagos: true,
      enfrentamientos: {
        orderBy: { registradoEn: "asc" },
        include: { goles: true },
      },
      invitados: { orderBy: { creadoEn: "asc" } },
    },
  });

  if (!partido) {
    notFound();
  }

  const asistenciasActivas = partido.asistencias.filter((a) => !a.cancelado);
  const abierto = asistenciaAbierta(partido.fechaHora, partido.horasCierre);
  const cierre = cierreAsistencia(partido.fechaHora, partido.horasCierre);
  const yaApuntado = asistenciasActivas.some((a) => a.usuarioId === usuario.id);
  const miAsistencia = asistenciasActivas.find((a) => a.usuarioId === usuario.id);
  const puedeGenerar = usuario.rol === "ADMIN" || partido.encargadoId === usuario.id;
  // Confirmar pagos es solo cosa de quien reserva, aunque sea admin.
  const puedeConfirmarPagos = partido.encargadoId === usuario.id;

  const generacion = partido.generacion;
  const numEquipos = generacion?.formato === "TRIANGULAR" ? 3 : 2;
  const equipos = generacion
    ? Array.from({ length: numEquipos }, (_, i) =>
        generacion.asignaciones.filter((a) => a.equipo === i + 1),
      )
    : [];

  const jugadoresQueJuegan = equipos.flat();

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
    ...asistenciasActivas.map((a) => ({ usuario: a.usuario, invitado: null })),
    ...partido.invitados.map((i) => ({ usuario: null, invitado: i })),
  ];

  type GolesDeEnfrentamiento = {
    goles: { usuarioId: string | null; invitadoId: string | null; goles: number }[];
  };
  function golesExistentes(enfrentamiento?: GolesDeEnfrentamiento) {
    const mapa = new Map<string, number>();
    enfrentamiento?.goles.forEach((g) => {
      const clave = g.usuarioId ? `u:${g.usuarioId}` : `i:${g.invitadoId}`;
      mapa.set(clave, g.goles);
    });
    return mapa;
  }

  function renderCamposGoles(golesPrevios?: Map<string, number>) {
    if (jugadoresQueJuegan.length === 0) {
      return null;
    }
    return (
      <div className={styles.golesJugadores}>
        <p className={styles.meta}>
          El resultado se calcula con los goles de cada jugador. Deja a 0 quien no haya marcado.
        </p>
        {equipos.map((equipo, i) => {
          if (equipo.length === 0) return null;
          return (
            <div key={i} className={styles.golesEquipo}>
              <h4 className={styles.golesEquipoTitulo}>Equipo {i + 1}</h4>
              <div className={styles.golesLista}>
                {equipo.map((a) => {
                  const clave = claveAsignacion(a);
                  const nombreCampo = a.usuario ? `golU_${a.usuario.id}` : `golI_${a.invitado!.id}`;
                  const valorPrevio = golesPrevios?.get(clave) ?? 0;
                  return (
                    <label key={clave} className={styles.golJugadorFila}>
                      <span>{nombreAsignacion(a)}</span>
                      <input
                        type="number"
                        name={nombreCampo}
                        min={0}
                        defaultValue={valorPrevio}
                        className={styles.golesInput}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const puedeVerPagos =
    usuario.rol === "ADMIN" ||
    partido.encargadoId === usuario.id ||
    asistenciasActivas.some((a) => a.usuarioId === usuario.id);
  // Un usuario normal (ni admin ni encargado) solo ve su propia fila de
  // pago, no la del resto.
  const puedeVerListaPagos = puedeGenerar;
  const pagosPorClave = new Map(
    partido.pagos.map((p) => [p.usuarioId ? `u:${p.usuarioId}` : `i:${p.invitadoId}`, p]),
  );
  const parteImporte =
    partido.importeTotal !== null && asistentesParaPago.length > 0
      ? partido.importeTotal / asistentesParaPago.length
      : null;

  const esTriangular = generacion?.formato === "TRIANGULAR";
  const resultadoDosEquipos = !esTriangular ? partido.enfrentamientos[0] : undefined;
  const tabla = esTriangular ? calcularTabla(partido.enfrentamientos, numEquipos) : [];

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo={capitalizar(formatearFecha(partido.fechaHora))}
        subtitulo={`${partido.ubicacion} · encargado: ${partido.encargado.nombreUsuario}`}
      />

      <SubnavPartido id={partido.id} activa="resumen" />

      <div className={styles.infoCard}>
        <p className={styles.meta}>
          {abierto
            ? `Puedes apuntarte o cancelar hasta ${formatearFecha(cierre)}.`
            : "El plazo para apuntarse o cancelar ya ha cerrado."}
        </p>
        {abierto && (
          <AccionBoton
            accion={yaApuntado ? cancelarAsistencia : apuntarse}
            campos={{ partidoId: partido.id }}
            className={yaApuntado ? styles.cancelar : styles.apuntarse}
          >
            {yaApuntado ? "Cancelar asistencia" : "Apuntarme"}
          </AccionBoton>
        )}
        {yaApuntado && (
          <AccionBoton
            accion={cambiarMiPortero}
            campos={{ partidoId: partido.id }}
            className={styles.pagoBotonSecundario}
          >
            {miAsistencia?.esPortero ? "Ya no juego de portero" : "Voy a jugar de portero"}
          </AccionBoton>
        )}
      </div>

      {puedeGenerar && <EditarPartido partido={partido} />}

      {generacion && (
        <section>
          <h2 className={styles.subtitulo}>Resultado</h2>

          {esTriangular ? (
            <>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>GF</th>
                    <th>GC</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.map((fila) => (
                    <tr key={fila.equipo}>
                      <td>Equipo {fila.equipo}</td>
                      <td>{fila.jugados}</td>
                      <td>{fila.ganados}</td>
                      <td>{fila.empatados}</td>
                      <td>{fila.perdidos}</td>
                      <td>{fila.golesFavor}</td>
                      <td>{fila.golesContra}</td>
                      <td>{fila.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {partido.enfrentamientos.length > 0 && (
                <ul className={styles.lista}>
                  {partido.enfrentamientos.map((e) => (
                    <li key={e.id} className={styles.pagoFila}>
                      <span>
                        Equipo {e.equipoLocal} {e.golesLocal} - {e.golesVisitante} Equipo{" "}
                        {e.equipoVisitante}
                      </span>
                      {puedeGenerar && (
                        <AccionBoton
                          accion={eliminarEnfrentamiento}
                          campos={{ partidoId: partido.id, id: e.id }}
                          className={styles.pagoBotonSecundario}
                        >
                          Eliminar
                        </AccionBoton>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {puedeGenerar && (
                <form action={agregarEnfrentamiento} className={styles.resultadoForm}>
                  <input type="hidden" name="partidoId" value={partido.id} />
                  <select name="equipoLocal" defaultValue="1" required>
                    {Array.from({ length: numEquipos }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Equipo {n}
                      </option>
                    ))}
                  </select>
                  <span>contra</span>
                  <select name="equipoVisitante" defaultValue="2" required>
                    {Array.from({ length: numEquipos }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Equipo {n}
                      </option>
                    ))}
                  </select>
                  {renderCamposGoles()}
                  <button type="submit" className={styles.generar}>
                    Añadir
                  </button>
                </form>
              )}
            </>
          ) : !resultadoDosEquipos ? (
            puedeGenerar ? (
              <form action={agregarEnfrentamiento} className={styles.resultadoForm}>
                <input type="hidden" name="partidoId" value={partido.id} />
                <input type="hidden" name="equipoLocal" value={1} />
                <input type="hidden" name="equipoVisitante" value={2} />
                {renderCamposGoles()}
                <button type="submit" className={styles.generar}>
                  Guardar resultado
                </button>
              </form>
            ) : (
              <p className={styles.meta}>Todavía no hay resultado.</p>
            )
          ) : (
            <div className={styles.resultadoFinal}>
              <div className={styles.marcador}>
                <div
                  className={
                    resultadoDosEquipos.golesLocal >= resultadoDosEquipos.golesVisitante
                      ? `${styles.marcadorEquipo} ${styles.marcadorGanador}`
                      : styles.marcadorEquipo
                  }
                >
                  <span className={styles.marcadorNombre}>Equipo 1</span>
                  <span className={styles.marcadorCifra}>{resultadoDosEquipos.golesLocal}</span>
                </div>
                <span className={styles.marcadorSeparador}>–</span>
                <div
                  className={
                    resultadoDosEquipos.golesVisitante >= resultadoDosEquipos.golesLocal
                      ? `${styles.marcadorEquipo} ${styles.marcadorGanador}`
                      : styles.marcadorEquipo
                  }
                >
                  <span className={styles.marcadorNombre}>Equipo 2</span>
                  <span className={styles.marcadorCifra}>{resultadoDosEquipos.golesVisitante}</span>
                </div>
              </div>
              {puedeGenerar && (
                <form action={editarEnfrentamiento} className={styles.resultadoForm}>
                  <input type="hidden" name="partidoId" value={partido.id} />
                  <input type="hidden" name="id" value={resultadoDosEquipos.id} />
                  {renderCamposGoles(golesExistentes(resultadoDosEquipos))}
                  <button type="submit" className={styles.pagoBotonSecundario}>
                    Corregir
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className={styles.subtitulo}>
          Apuntados ({asistenciasActivas.length + partido.invitados.length})
        </h2>
        {asistenciasActivas.length === 0 && partido.invitados.length === 0 ? (
          <p className={styles.meta}>Todavía no se ha apuntado nadie.</p>
        ) : (
          <ListaAnimada className={styles.lista}>
            {asistenciasActivas.map((a, indice) => (
              <ItemAnimado
                key={a.id}
                indice={indice}
                className={puedeGenerar ? styles.pagoFila : undefined}
              >
                <span>
                  {a.usuario.nombreUsuario}
                  {a.esPortero && " · 🧤 Portero"}
                </span>
                {puedeGenerar && (
                  <AccionBoton
                    accion={cambiarPorteroDeUsuario}
                    campos={{ partidoId: partido.id, usuarioId: a.usuarioId }}
                    className={styles.pagoBotonSecundario}
                  >
                    {a.esPortero ? "Quitar portero" : "Marcar portero"}
                  </AccionBoton>
                )}
              </ItemAnimado>
            ))}
            {partido.invitados.map((i, indice) => (
              <ItemAnimado key={i.id} indice={asistenciasActivas.length + indice}>
                {i.nombre} (invitado)
                {i.esPortero && " · 🧤 Portero"}
              </ItemAnimado>
            ))}
          </ListaAnimada>
        )}
      </section>

      {!generacion && (
        <p className={styles.meta}>
          Todavía no se han generado los equipos. Ve a la pestaña{" "}
          <Link href={`/partidos/${partido.id}/equipos`} className={styles.enlace}>
            Equipos
          </Link>{" "}
          para generarlos.
        </p>
      )}

      {puedeVerPagos && asistentesParaPago.length > 0 && (
        <section>
          <h2 className={styles.subtitulo}>Pagos</h2>

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
      )}

    </main>
  );
}
