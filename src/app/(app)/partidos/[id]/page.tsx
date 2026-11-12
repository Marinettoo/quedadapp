import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
import {
  apuntarse,
  cancelarAsistencia,
  cambiarMiPortero,
  cambiarPorteroDeUsuario,
  apuntarUsuario,
  quitarAsistenciaUsuario,
} from "../actions";
import {
  agregarEnfrentamiento,
  editarEnfrentamiento,
  eliminarEnfrentamiento,
} from "../resultadosActions";
import { calcularTabla } from "@/lib/resultados";
import { AccionBoton } from "@/components/AccionBoton";
import { ListaAnimada, ItemAnimado } from "@/components/ListaAnimada";
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

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconoPago() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14.8 9.3a3 3 0 0 0-2.6-1.3c-1.9 0-3.2 1.7-3.2 4s1.3 4 3.2 4a3 3 0 0 0 2.6-1.3M8.3 11h4.4M8.3 13.3h4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
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
      invitados: {
        orderBy: { creadoEn: "asc" },
        include: { invitado: { select: { id: true, nombre: true } } },
      },
    },
  });

  if (!partido) {
    notFound();
  }

  const asistenciasActivas = partido.asistencias.filter((a) => !a.cancelado);
  const abierto = asistenciaAbierta(partido.fechaHora, partido.horasCierre);
  const cierre = cierreAsistencia(partido.fechaHora, partido.horasCierre);
  const yaApuntado = asistenciasActivas.some((a) => a.usuarioId === usuario.id);
  const puedeGenerar = usuario.rol === "ADMIN" || partido.encargadoId === usuario.id;
  const esAdmin = usuario.rol === "ADMIN";

  // Para que el admin pueda apuntar a alguien a mano: cualquier cuenta
  // aprobada que todavía no esté ya apuntada a este partido.
  const idsApuntados = new Set(asistenciasActivas.map((a) => a.usuarioId));
  const usuariosParaApuntar = esAdmin
    ? (
        await prisma.usuario.findMany({
          where: { estado: "APROBADA" },
          select: { id: true, nombreUsuario: true },
          orderBy: { nombreUsuario: "asc" },
        })
      ).filter((u) => !idsApuntados.has(u.id))
    : [];

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
    ...partido.invitados.map((i) => ({ usuario: null, invitado: i.invitado })),
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
          <div className={styles.infoAcciones}>
            <AccionBoton
              accion={yaApuntado ? cancelarAsistencia : apuntarse}
              campos={{ partidoId: partido.id }}
              className={yaApuntado ? styles.cancelar : styles.apuntarse}
            >
              {yaApuntado ? "Cancelar asistencia" : "Apuntarme"}
            </AccionBoton>
          </div>
        )}
      </div>

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
            {asistenciasActivas.map((a, indice) => {
              const esMiFila = a.usuarioId === usuario.id;
              const mostrarAcciones = puedeGenerar || esAdmin || esMiFila;
              return (
                <ItemAnimado
                  key={a.id}
                  indice={indice}
                  className={mostrarAcciones ? styles.pagoFila : undefined}
                >
                  <span>
                    {a.usuario.nombreUsuario}
                    {a.esPortero && " · 🧤 Portero"}
                  </span>
                  {mostrarAcciones && (
                    <div className={styles.filaAcciones}>
                      {puedeGenerar ? (
                        <AccionBoton
                          accion={cambiarPorteroDeUsuario}
                          campos={{ partidoId: partido.id, usuarioId: a.usuarioId }}
                          className={
                            a.esPortero
                              ? `${styles.iconoBoton} ${styles.iconoBotonActivo}`
                              : styles.iconoBoton
                          }
                          ariaLabel={
                            a.esPortero
                              ? `Quitar a ${a.usuario.nombreUsuario} de portero`
                              : `Marcar a ${a.usuario.nombreUsuario} de portero`
                          }
                        >
                          🧤
                        </AccionBoton>
                      ) : (
                        esMiFila && (
                          <AccionBoton
                            accion={cambiarMiPortero}
                            campos={{ partidoId: partido.id }}
                            className={
                              a.esPortero
                                ? `${styles.iconoBoton} ${styles.iconoBotonActivo}`
                                : styles.iconoBoton
                            }
                            ariaLabel={a.esPortero ? "Ya no juego de portero" : "Voy a jugar de portero"}
                          >
                            🧤
                          </AccionBoton>
                        )
                      )}
                      {esAdmin && (
                        <AccionBoton
                          accion={quitarAsistenciaUsuario}
                          campos={{ partidoId: partido.id, usuarioId: a.usuarioId }}
                          className={styles.iconoBoton}
                          ariaLabel={`Quitar a ${a.usuario.nombreUsuario} de la asistencia`}
                        >
                          <IconoCerrar />
                        </AccionBoton>
                      )}
                    </div>
                  )}
                </ItemAnimado>
              );
            })}
            {partido.invitados.map((i, indice) => (
              <ItemAnimado key={i.invitadoId} indice={asistenciasActivas.length + indice}>
                {i.invitado.nombre} (invitado)
                {i.esPortero && " · 🧤 Portero"}
              </ItemAnimado>
            ))}
          </ListaAnimada>
        )}

        {esAdmin && usuariosParaApuntar.length > 0 && (
          <form action={apuntarUsuario} className={styles.resultadoForm}>
            <input type="hidden" name="partidoId" value={partido.id} />
            <select name="usuarioId" required defaultValue="">
              <option value="" disabled>
                Apuntar a alguien
              </option>
              {usuariosParaApuntar.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombreUsuario}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.generar}>
              Apuntar
            </button>
          </form>
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
        <Link href={`/partidos/${partido.id}/pagos`} className={styles.pagoResumenEnlace}>
          <span className={styles.pagoResumenTexto}>
            <IconoPago />
            {parteImporte !== null
              ? `${parteImporte.toFixed(2)} € por jugador`
              : partido.importeTotal === null && puedeGenerar
                ? "Todavía no has puesto el importe de la reserva"
                : "Pagos de la reserva"}
          </span>
          <span className={styles.avisoFlecha}>Ver pagos →</span>
        </Link>
      )}
    </>
  );
}
