import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
import { Volver } from "@/components/Volver";
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
import { calcularTabla } from "@/lib/resultados";
import styles from "./page.module.css";

export const instant = false;

const FORMATOS: Record<string, string> = {
  TRIANGULAR: "Triangular (3 equipos)",
  DOS_EQUIPOS: "2 equipos",
};

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
            include: { usuario: { select: { id: true, nombreUsuario: true } } },
          },
        },
      },
      pagos: true,
      enfrentamientos: { orderBy: { registradoEn: "asc" } },
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

  const jugadoresQueJuegan = equipos.flat();
  const puedeVerPagos =
    usuario.rol === "ADMIN" ||
    partido.encargadoId === usuario.id ||
    asistenciasActivas.some((a) => a.usuarioId === usuario.id);
  const pagosPorUsuario = new Map(partido.pagos.map((p) => [p.usuarioId, p]));
  const parteImporte =
    partido.importeTotal !== null && jugadoresQueJuegan.length > 0
      ? partido.importeTotal / jugadoresQueJuegan.length
      : null;

  const esTriangular = generacion?.formato === "TRIANGULAR";
  const resultadoDosEquipos = !esTriangular ? partido.enfrentamientos[0] : undefined;
  const tabla = esTriangular ? calcularTabla(partido.enfrentamientos, numEquipos) : [];

  return (
    <main className={styles.screen}>
      <Volver />
      <h1 className={styles.title}>{formatearFecha(partido.fechaHora)}</h1>
      <p className={styles.meta}>{partido.ubicacion}</p>
      <p className={styles.meta}>Encargado de la reserva: {partido.encargado.nombreUsuario}</p>
      <p className={styles.meta}>
        {abierto
          ? `Puedes apuntarte o cancelar hasta ${formatearFecha(cierre)}.`
          : "El plazo para apuntarse o cancelar ya ha cerrado."}
      </p>

      {abierto && (
        <form action={yaApuntado ? cancelarAsistencia : apuntarse}>
          <input type="hidden" name="partidoId" value={partido.id} />
          <button type="submit" className={yaApuntado ? styles.cancelar : styles.apuntarse}>
            {yaApuntado ? "Cancelar asistencia" : "Apuntarme"}
          </button>
        </form>
      )}

      <section>
        <h2 className={styles.subtitulo}>Apuntados ({asistenciasActivas.length})</h2>
        {asistenciasActivas.length === 0 ? (
          <p className={styles.meta}>Todavía no se ha apuntado nadie.</p>
        ) : (
          <ul className={styles.lista}>
            {asistenciasActivas.map((a) => (
              <li key={a.id}>{a.usuario.nombreUsuario}</li>
            ))}
          </ul>
        )}
      </section>

      {puedeGenerar && (
        <section>
          <h2 className={styles.subtitulo}>Equipos</h2>
          {hayCambiosTrasGenerar && (
            <p className={styles.aviso}>
              Los apuntados han cambiado desde que se generaron los equipos. Puedes regenerarlos.
            </p>
          )}
          <form action={generarEquiposPartido}>
            <input type="hidden" name="partidoId" value={partido.id} />
            <button type="submit" className={styles.generar}>
              {generacion ? "Regenerar equipos" : "Generar equipos"}
            </button>
          </form>
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
                <h3 className={styles.equipoTitulo}>Equipo {i + 1}</h3>
                <ul className={styles.lista}>
                  {equipo.map((a) => (
                    <li key={a.id}>{a.usuario.nombreUsuario}</li>
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
                  <li key={a.id}>{a.usuario.nombreUsuario}</li>
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
              const pago = pagosPorUsuario.get(a.usuarioId);
              const estado = pago?.confirmadoEn
                ? `Confirmado el ${formatearFecha(pago.confirmadoEn)}`
                : pago?.indicadoEn
                  ? "Indicado, pendiente de confirmación"
                  : "Pendiente de indicar";

              return (
                <li key={a.usuarioId} className={styles.pagoFila}>
                  <div>
                    <span className={styles.nombre}>{a.usuario.nombreUsuario}</span>
                    <span className={styles.meta}> · {estado}</span>
                  </div>
                  <div className={styles.pagoAcciones}>
                    {a.usuarioId === usuario.id &&
                      (!pago?.confirmadoEn ? (
                        !pago?.indicadoEn ? (
                          <form action={indicarPago}>
                            <input type="hidden" name="partidoId" value={partido.id} />
                            <button type="submit" className={styles.pagoBoton}>
                              He pagado
                            </button>
                          </form>
                        ) : (
                          <form action={deshacerIndicacion}>
                            <input type="hidden" name="partidoId" value={partido.id} />
                            <button type="submit" className={styles.pagoBotonSecundario}>
                              Deshacer
                            </button>
                          </form>
                        )
                      ) : null)}

                    {puedeGenerar &&
                      (!pago?.confirmadoEn ? (
                        <form action={confirmarPago}>
                          <input type="hidden" name="partidoId" value={partido.id} />
                          <input type="hidden" name="usuarioId" value={a.usuarioId} />
                          <button type="submit" className={styles.pagoBoton}>
                            Confirmar
                          </button>
                        </form>
                      ) : (
                        <form action={corregirConfirmacion}>
                          <input type="hidden" name="partidoId" value={partido.id} />
                          <input type="hidden" name="usuarioId" value={a.usuarioId} />
                          <button type="submit" className={styles.pagoBotonSecundario}>
                            Corregir
                          </button>
                        </form>
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
                        <form action={eliminarEnfrentamiento}>
                          <input type="hidden" name="partidoId" value={partido.id} />
                          <input type="hidden" name="id" value={e.id} />
                          <button type="submit" className={styles.pagoBotonSecundario}>
                            Eliminar
                          </button>
                        </form>
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
