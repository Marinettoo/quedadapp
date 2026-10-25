import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
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
import { ResultadoForm, type JugadorOpcion } from "./ResultadoForm";
import styles from "./page.module.css";

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
  function golesExistentes(enfrentamiento?: GolesDeEnfrentamiento): Record<string, number> {
    const mapa: Record<string, number> = {};
    enfrentamiento?.goles.forEach((g) => {
      const clave = g.usuarioId ? `u:${g.usuarioId}` : `i:${g.invitadoId}`;
      mapa[clave] = g.goles;
    });
    return mapa;
  }

  // Lista plana de candidatos a gol (con su equipo), para el formulario
  // con botones + / −: filtra sola a los dos equipos que juegan cada
  // mini partido.
  const jugadoresOpciones: JugadorOpcion[] = equipos.flatMap((equipo, i) =>
    equipo.map((a) => ({
      clave: claveAsignacion(a),
      nombre: nombreAsignacion(a),
      campoName: a.usuario ? `golU_${a.usuario.id}` : `golI_${a.invitado!.id}`,
      equipo: i + 1,
    })),
  );
  const nombrePorClave = new Map(jugadoresQueJuegan.map((a) => [claveAsignacion(a), nombreAsignacion(a)]));

  function goleadoresDe(goles: { usuarioId: string | null; invitadoId: string | null; goles: number }[]) {
    return goles
      .map((g) => {
        const clave = g.usuarioId ? `u:${g.usuarioId}` : `i:${g.invitadoId}`;
        return { nombre: nombrePorClave.get(clave) ?? "?", goles: g.goles };
      })
      .sort((a, b) => b.goles - a.goles);
  }

  const goleadoresPartido = goleadoresDe(partido.enfrentamientos.flatMap((e) => e.goles)).reduce<
    { nombre: string; goles: number }[]
  >((acc, g) => {
    const existente = acc.find((x) => x.nombre === g.nombre);
    if (existente) existente.goles += g.goles;
    else acc.push({ ...g });
    return acc;
  }, []).sort((a, b) => b.goles - a.goles);

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
    <>
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
                <div className={styles.miniResultados}>
                  {partido.enfrentamientos.map((e) => {
                    const goleadores = goleadoresDe(e.goles);
                    return (
                      <div key={e.id} className={styles.miniResultado}>
                        <div className={styles.miniMarcador}>
                          <span
                            className={
                              e.golesLocal >= e.golesVisitante
                                ? `${styles.miniMarcadorEquipo} ${styles.miniMarcadorGanador}`
                                : styles.miniMarcadorEquipo
                            }
                          >
                            Equipo {e.equipoLocal}
                            <span className={styles.miniMarcadorCifra}>{e.golesLocal}</span>
                          </span>
                          <span className={styles.miniMarcadorSeparador}>–</span>
                          <span
                            className={
                              e.golesVisitante >= e.golesLocal
                                ? `${styles.miniMarcadorEquipo} ${styles.miniMarcadorGanador}`
                                : styles.miniMarcadorEquipo
                            }
                          >
                            <span className={styles.miniMarcadorCifra}>{e.golesVisitante}</span>
                            Equipo {e.equipoVisitante}
                          </span>
                        </div>
                        {goleadores.length > 0 && (
                          <p className={styles.miniGoleadores}>
                            ⚽ {goleadores.map((g) => `${g.nombre} (${g.goles})`).join(", ")}
                          </p>
                        )}
                        {puedeGenerar && (
                          <div className={styles.miniAcciones}>
                            <AccionBoton
                              accion={eliminarEnfrentamiento}
                              campos={{ partidoId: partido.id, id: e.id }}
                              className={styles.pagoBotonSecundario}
                            >
                              Eliminar
                            </AccionBoton>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {puedeGenerar && (
                <ResultadoForm
                  partidoId={partido.id}
                  accion={agregarEnfrentamiento}
                  numEquipos={numEquipos}
                  jugadores={jugadoresOpciones}
                  equipoLocalInicial={1}
                  equipoVisitanteInicial={2}
                  mostrarSelects
                  textoBoton="Añadir"
                />
              )}
            </>
          ) : !resultadoDosEquipos ? (
            puedeGenerar ? (
              <ResultadoForm
                partidoId={partido.id}
                accion={agregarEnfrentamiento}
                numEquipos={numEquipos}
                jugadores={jugadoresOpciones}
                equipoLocalInicial={1}
                equipoVisitanteInicial={2}
                mostrarSelects={false}
                textoBoton="Guardar resultado"
              />
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
              {goleadoresDe(resultadoDosEquipos.goles).length > 0 && (
                <p className={styles.miniGoleadores}>
                  ⚽{" "}
                  {goleadoresDe(resultadoDosEquipos.goles)
                    .map((g) => `${g.nombre} (${g.goles})`)
                    .join(", ")}
                </p>
              )}
              {puedeGenerar && (
                <ResultadoForm
                  partidoId={partido.id}
                  accion={editarEnfrentamiento}
                  numEquipos={numEquipos}
                  jugadores={jugadoresOpciones}
                  equipoLocalInicial={1}
                  equipoVisitanteInicial={2}
                  mostrarSelects={false}
                  enfrentamientoId={resultadoDosEquipos.id}
                  golesPrevios={golesExistentes(resultadoDosEquipos)}
                  textoBoton="Corregir"
                />
              )}
            </div>
          )}
        </section>
      )}

      {generacion && goleadoresPartido.length > 0 && (
        <section>
          <h2 className={styles.subtitulo}>Estadísticas del partido</h2>
          <div className={styles.goleadores}>
            {goleadoresPartido.map((g) => (
              <div key={g.nombre} className={styles.goleadorFila}>
                <span>{g.nombre}</span>
                <span className={styles.goleadorGoles}>
                  {g.goles} {g.goles === 1 ? "gol" : "goles"}
                </span>
              </div>
            ))}
          </div>
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
    </>
  );
}
