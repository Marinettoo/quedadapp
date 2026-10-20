import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
import { AppHeader } from "@/components/AppHeader";
import { apuntarse, cancelarAsistencia } from "../actions";
import { generarEquiposPartido } from "../generarActions";
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
import { agregarInvitado, quitarInvitado } from "../invitadosActions";
import { establecerColorEquipo } from "../coloresActions";
import { calcularTabla } from "@/lib/resultados";
import { AccionBoton } from "@/components/AccionBoton";
import { SelectorColor } from "@/components/SelectorColor";
import styles from "./page.module.css";

export const instant = false;

const FORMATOS: Record<string, string> = {
  TRIANGULAR: "Triangular (3 equipos)",
  DOS_EQUIPOS: "2 equipos",
};

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
      enfrentamientos: { orderBy: { registradoEn: "asc" } },
      invitados: { orderBy: { creadoEn: "asc" } },
      coloresEquipo: true,
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

  const generacion = partido.generacion;
  const ultimoCambioAsistencia = partido.asistencias.reduce<Date | null>((max, a) => {
    const cambio = a.canceladoEn ?? a.apuntadoEn;
    return !max || cambio > max ? cambio : max;
  }, null);
  const hayCambiosTrasGenerar =
    generacion && ultimoCambioAsistencia && ultimoCambioAsistencia > generacion.generadoEn;

  const numEquipos = generacion?.formato === "TRIANGULAR" ? 3 : 2;
  const equipos = generacion
    ? Array.from({ length: numEquipos }, (_, i) =>
        generacion.asignaciones.filter((a) => a.equipo === i + 1),
      )
    : [];
  const listaEspera = generacion?.asignaciones.filter((a) => a.equipo === 0) ?? [];

  const COLORES_POR_DEFECTO: Record<number, string> = { 1: "#000000", 2: "#ffffff", 3: "#757575" };
  const coloresPorEquipo = new Map(partido.coloresEquipo.map((c) => [c.equipo, c.color]));
  function colorDe(n: number) {
    return coloresPorEquipo.get(n) ?? COLORES_POR_DEFECTO[n];
  }

  const jugadoresQueJuegan = equipos.flat();

  function nombreAsignacion(a: (typeof jugadoresQueJuegan)[number]) {
    return a.usuario ? a.usuario.nombreUsuario : `${a.invitado!.nombre} (invitado)`;
  }
  function claveAsignacion(a: (typeof jugadoresQueJuegan)[number]) {
    return a.usuario ? `u:${a.usuario.id}` : `i:${a.invitado!.id}`;
  }

  const puedeVerPagos =
    usuario.rol === "ADMIN" ||
    partido.encargadoId === usuario.id ||
    asistenciasActivas.some((a) => a.usuarioId === usuario.id);
  const pagosPorClave = new Map(
    partido.pagos.map((p) => [p.usuarioId ? `u:${p.usuarioId}` : `i:${p.invitadoId}`, p]),
  );
  const parteImporte =
    partido.importeTotal !== null && jugadoresQueJuegan.length > 0
      ? partido.importeTotal / jugadoresQueJuegan.length
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
      </div>

      <section>
        <h2 className={styles.subtitulo}>
          Apuntados ({asistenciasActivas.length + partido.invitados.length})
        </h2>
        {asistenciasActivas.length === 0 && partido.invitados.length === 0 ? (
          <p className={styles.meta}>Todavía no se ha apuntado nadie.</p>
        ) : (
          <ul className={styles.lista}>
            {asistenciasActivas.map((a) => (
              <li key={a.id}>{a.usuario.nombreUsuario}</li>
            ))}
            {partido.invitados.map((i) => (
              <li key={i.id}>{i.nombre} (invitado)</li>
            ))}
          </ul>
        )}
      </section>

      {usuario.rol === "ADMIN" && (
        <section>
          <h2 className={styles.subtitulo}>Invitados</h2>
          <p className={styles.meta}>
            Jugadores sin cuenta en la app, solo para este partido. Su valoración la
            pones tú y solo se usa aquí.
          </p>
          {partido.invitados.length > 0 && (
            <ul className={styles.lista}>
              {partido.invitados.map((i) => (
                <li key={i.id} className={styles.pagoFila}>
                  <span>
                    {i.nombre} · {i.estrellas} ★
                  </span>
                  <AccionBoton
                    accion={quitarInvitado}
                    campos={{ partidoId: partido.id, id: i.id }}
                    className={styles.pagoBotonSecundario}
                  >
                    Quitar
                  </AccionBoton>
                </li>
              ))}
            </ul>
          )}
          <form action={agregarInvitado} className={styles.resultadoForm}>
            <input type="hidden" name="partidoId" value={partido.id} />
            <input type="text" name="nombre" placeholder="Nombre del invitado" required />
            <select name="estrellas" defaultValue="3" required>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
            <button type="submit" className={styles.generar}>
              Añadir invitado
            </button>
          </form>
        </section>
      )}

      {puedeGenerar && (
        <section>
          <h2 className={styles.subtitulo}>Equipos</h2>
          {hayCambiosTrasGenerar && (
            <p className={styles.aviso}>
              Los apuntados han cambiado desde que se generaron los equipos. Puedes regenerarlos.
            </p>
          )}
          <AccionBoton
            accion={generarEquiposPartido}
            campos={{ partidoId: partido.id }}
            className={styles.generar}
          >
            {generacion ? "Regenerar equipos" : "Generar equipos"}
          </AccionBoton>
        </section>
      )}

      {generacion && (
        <section>
          <p className={styles.meta}>
            Formato: {FORMATOS[generacion.formato]} · generado el {formatearFecha(generacion.generadoEn)}
          </p>
          <div className={styles.equipos}>
            {equipos.map((equipo, i) => (
              <div key={i} className={styles.equipo}>
                <div className={styles.equipoCabecera}>
                  <h3 className={styles.equipoTitulo}>Equipo {i + 1}</h3>
                  {puedeGenerar ? (
                    <SelectorColor
                      accion={establecerColorEquipo}
                      partidoId={partido.id}
                      equipo={i + 1}
                      colorInicial={colorDe(i + 1)}
                      className={styles.colorInput}
                    />
                  ) : (
                    <span
                      className={styles.colorSwatch}
                      style={{ backgroundColor: colorDe(i + 1) }}
                      title={`Color del equipo ${i + 1}`}
                    />
                  )}
                </div>
                <ul className={styles.lista}>
                  {equipo.map((a) => (
                    <li key={a.id}>{nombreAsignacion(a)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {listaEspera.length > 0 && (
            <div className={styles.equipo}>
              <h3 className={styles.equipoTitulo}>Lista de espera</h3>
              <ul className={styles.lista}>
                {listaEspera.map((a) => (
                  <li key={a.id}>{nombreAsignacion(a)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {generacion && puedeVerPagos && jugadoresQueJuegan.length > 0 && (
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
            <p className={styles.meta}>
              Parte por jugador: {parteImporte.toFixed(2)} € ({jugadoresQueJuegan.length} jugadores)
            </p>
          )}

          <ul className={styles.lista}>
            {jugadoresQueJuegan.map((a) => {
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

                    {puedeGenerar &&
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
                  <input type="number" name="golesLocal" min={0} defaultValue={0} required className={styles.golesInput} />
                  <span>-</span>
                  <input type="number" name="golesVisitante" min={0} defaultValue={0} required className={styles.golesInput} />
                  <select name="equipoVisitante" defaultValue="2" required>
                    {Array.from({ length: numEquipos }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Equipo {n}
                      </option>
                    ))}
                  </select>
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
                <span>Equipo 1</span>
                <input type="number" name="golesLocal" min={0} defaultValue={0} required className={styles.golesInput} />
                <span>-</span>
                <input type="number" name="golesVisitante" min={0} defaultValue={0} required className={styles.golesInput} />
                <span>Equipo 2</span>
                <button type="submit" className={styles.generar}>
                  Guardar resultado
                </button>
              </form>
            ) : (
              <p className={styles.meta}>Todavía no hay resultado.</p>
            )
          ) : (
            <div className={styles.resultadoFinal}>
              <span>
                Equipo 1 {resultadoDosEquipos.golesLocal} - {resultadoDosEquipos.golesVisitante} Equipo 2
              </span>
              {puedeGenerar && (
                <form action={editarEnfrentamiento} className={styles.resultadoForm}>
                  <input type="hidden" name="partidoId" value={partido.id} />
                  <input type="hidden" name="id" value={resultadoDosEquipos.id} />
                  <input
                    type="number"
                    name="golesLocal"
                    min={0}
                    defaultValue={resultadoDosEquipos.golesLocal}
                    required
                    className={styles.golesInput}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    name="golesVisitante"
                    min={0}
                    defaultValue={resultadoDosEquipos.golesVisitante}
                    required
                    className={styles.golesInput}
                  />
                  <button type="submit" className={styles.pagoBotonSecundario}>
                    Corregir
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
