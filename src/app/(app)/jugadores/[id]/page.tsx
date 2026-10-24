import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularEdad } from "@/lib/usuarios";
import { AccionBoton } from "@/components/AccionBoton";
import { TarjetaJugador } from "@/components/TarjetaJugador";
import { FormularioFoto } from "@/components/FormularioFoto";
import { EncuadrarFoto } from "@/components/EncuadrarFoto";
import { valorar } from "../actions";
import styles from "./page.module.css";

export const instant = false;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function FichaJugador({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const jugador = await prisma.usuario.findUnique({
    where: { id, estado: "APROBADA" },
    include: {
      valoracionesRecibidas: { select: { estrellas: true, autorId: true } },
    },
  });

  if (!jugador) {
    notFound();
  }

  const esYo = jugador.id === usuario.id;
  const puedeCambiarFoto = esYo || usuario.rol === "ADMIN";

  const cuenta = jugador.valoracionesRecibidas.length;
  const media =
    cuenta === 0 ? null : jugador.valoracionesRecibidas.reduce((s, v) => s + v.estrellas, 0) / cuenta;
  const tuValoracion =
    jugador.valoracionesRecibidas.find((v) => v.autorId === usuario.id)?.estrellas ?? 0;

  const [partidosJugados, golesMarcados] = await Promise.all([
    prisma.asistencia.count({ where: { usuarioId: jugador.id, cancelado: false } }),
    prisma.golJugador.aggregate({
      where: { usuarioId: jugador.id },
      _sum: { goles: true },
    }),
  ]);

  return (
    <main className={styles.screen}>
      <Link href="/jugadores" className={styles.volver}>
        ← Jugadores
      </Link>

      <TarjetaJugador
        jugadorId={jugador.id}
        nombreUsuario={jugador.nombreUsuario}
        fotoActualizadaEn={jugador.fotoActualizadaEn}
        media={media}
        cuenta={cuenta}
        partidosJugados={partidosJugados}
        golesMarcados={golesMarcados._sum.goles ?? 0}
        edad={jugador.fechaNacimiento ? calcularEdad(jugador.fechaNacimiento) : null}
        piernaBuena={jugador.piernaBuena}
        fotoOffsetX={jugador.fotoOffsetX}
        fotoOffsetY={jugador.fotoOffsetY}
        fotoEscala={jugador.fotoEscala}
      />

      <p className={styles.meta}>En la peña desde el {formatearFecha(jugador.creadoEn)}.</p>

      {!esYo && (
        <section className={styles.seccion}>
          <h2 className={styles.subtitulo}>Tu valoración</h2>
          <div className={styles.estrellas}>
            {[1, 2, 3, 4, 5].map((n) => (
              <AccionBoton
                key={n}
                accion={valorar}
                campos={{ valoradoId: jugador.id, estrellas: String(n) }}
                className={n <= tuValoracion ? styles.estrellaLlena : styles.estrellaVacia}
                ariaLabel={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              >
                ★
              </AccionBoton>
            ))}
          </div>
        </section>
      )}

      {puedeCambiarFoto && (
        <section className={styles.seccion}>
          <h2 className={styles.subtitulo}>Foto de perfil</h2>
          <p className={styles.meta}>
            Sube una imagen PNG con el fondo ya transparente (recortada), para que se superponga
            bien al bloque de arriba. Máximo 4 MB.
          </p>
          <FormularioFoto jugadorId={jugador.id} tieneFoto={!!jugador.fotoActualizadaEn} />
        </section>
      )}

      {puedeCambiarFoto && jugador.fotoActualizadaEn && (
        <EncuadrarFoto
          jugadorId={jugador.id}
          fotoActualizadaEn={jugador.fotoActualizadaEn.getTime()}
          offsetXInicial={jugador.fotoOffsetX}
          offsetYInicial={jugador.fotoOffsetY}
          escalaInicial={jugador.fotoEscala}
          esPropia={esYo}
        />
      )}

      {esYo && (
        <p className={styles.meta}>
          ¿Quieres cambiar tu nombre, contraseña, edad o pierna buena?{" "}
          <Link href="/perfil" className={styles.enlace}>
            Ve a Mi perfil
          </Link>
          .
        </p>
      )}
    </main>
  );
}
