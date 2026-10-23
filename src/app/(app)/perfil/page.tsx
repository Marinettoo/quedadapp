import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularEdad } from "@/lib/usuarios";
import { AppHeader } from "@/components/AppHeader";
import { TarjetaJugador } from "@/components/TarjetaJugador";
import { FormularioFoto } from "@/components/FormularioFoto";
import { EncuadrarFoto } from "./EncuadrarFoto";
import { EditarPerfil } from "./EditarPerfil";
import styles from "./page.module.css";

export const instant = false;

function paraInputFecha(fecha: Date) {
  const offset = fecha.getTimezoneOffset();
  const local = new Date(fecha.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default async function Perfil() {
  const sesion = await obtenerUsuarioSesion();
  if (!sesion) {
    redirect("/");
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: sesion.id },
    include: {
      valoracionesRecibidas: { select: { estrellas: true } },
    },
  });

  const cuenta = usuario.valoracionesRecibidas.length;
  const media =
    cuenta === 0 ? null : usuario.valoracionesRecibidas.reduce((s, v) => s + v.estrellas, 0) / cuenta;

  const [partidosJugados, golesMarcados] = await Promise.all([
    prisma.asistencia.count({ where: { usuarioId: usuario.id, cancelado: false } }),
    prisma.golJugador.aggregate({
      where: { usuarioId: usuario.id },
      _sum: { goles: true },
    }),
  ]);

  return (
    <main className={styles.screen}>
      <AppHeader titulo="Mi perfil" subtitulo="Así se ve tu ficha, y aquí editas tus datos." />

      <TarjetaJugador
        jugadorId={usuario.id}
        nombreUsuario={usuario.nombreUsuario}
        fotoActualizadaEn={usuario.fotoActualizadaEn}
        media={media}
        cuenta={cuenta}
        partidosJugados={partidosJugados}
        golesMarcados={golesMarcados._sum.goles ?? 0}
        edad={usuario.fechaNacimiento ? calcularEdad(usuario.fechaNacimiento) : null}
        piernaBuena={usuario.piernaBuena}
        fotoOffsetX={usuario.fotoOffsetX}
        fotoOffsetY={usuario.fotoOffsetY}
        fotoEscala={usuario.fotoEscala}
      />

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Foto de perfil</h2>
        <p className={styles.meta}>
          Sube una imagen PNG con el fondo ya transparente (recortada), para que se superponga
          bien al bloque de arriba. Máximo 4 MB.
        </p>
        <FormularioFoto jugadorId={usuario.id} tieneFoto={!!usuario.fotoActualizadaEn} />
      </section>

      {usuario.fotoActualizadaEn && (
        <EncuadrarFoto
          jugadorId={usuario.id}
          fotoActualizadaEn={usuario.fotoActualizadaEn.getTime()}
          offsetXInicial={usuario.fotoOffsetX}
          offsetYInicial={usuario.fotoOffsetY}
          escalaInicial={usuario.fotoEscala}
        />
      )}

      <EditarPerfil
        nombreUsuario={usuario.nombreUsuario}
        fechaNacimiento={usuario.fechaNacimiento ? paraInputFecha(usuario.fechaNacimiento) : ""}
        piernaBuena={usuario.piernaBuena}
      />
    </main>
  );
}
