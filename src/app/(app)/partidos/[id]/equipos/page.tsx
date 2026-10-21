import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { generarEquiposPartido } from "../../generarActions";
import { agregarInvitado, quitarInvitado } from "../../invitadosActions";
import { establecerColorEquipo } from "../../coloresActions";
import { AccionBoton } from "@/components/AccionBoton";
import { SelectorColor } from "@/components/SelectorColor";
import { SubnavPartido } from "../SubnavPartido";
import styles from "../page.module.css";

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

export default async function EquiposPartido({
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
      asistencias: true,
      invitados: { orderBy: { creadoEn: "asc" } },
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
      coloresEquipo: true,
    },
  });

  if (!partido) {
    notFound();
  }

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

  function nombreAsignacion(a: (typeof equipos)[number][number]) {
    return a.usuario ? a.usuario.nombreUsuario : `${a.invitado!.nombre} (invitado)`;
  }

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo={capitalizar(formatearFecha(partido.fechaHora))}
        subtitulo={`${partido.ubicacion} · encargado: ${partido.encargado.nombreUsuario}`}
      />

      <SubnavPartido id={partido.id} activa="equipos" />

      {generacion ? (
        <section>
          <h2 className={styles.subtitulo}>Equipos</h2>
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
      ) : (
        !puedeGenerar && <p className={styles.meta}>Todavía no se han generado los equipos.</p>
      )}

      {puedeGenerar && (
        <section>
          <h2 className={styles.subtitulo}>Generar equipos</h2>
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
            <input
              type="text"
              name="nombre"
              placeholder="Nombre del invitado"
              required
              className={styles.invitadoInput}
            />
            <input type="hidden" name="partidoId" value={partido.id} />
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
    </main>
  );
}
