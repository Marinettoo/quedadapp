import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Transicion } from "@/components/Transicion";
import { SubnavPartido } from "./SubnavPartido";
import styles from "./page.module.css";

// Cabecera y pestañas (Resumen/Equipos/Apuestas) comunes a las tres rutas
// de un partido. Al vivir en el layout, Next.js las mantiene montadas al
// cambiar de pestaña (en vez de que cada página las vuelva a crear desde
// cero), así no parpadean y el indicador animado de SubnavPartido se
// desplaza de verdad entre posiciones.
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

export default async function LayoutPartido({
  children,
  params,
}: {
  children: React.ReactNode;
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
      fechaHora: true,
      ubicacion: true,
      encargado: { select: { nombreUsuario: true } },
    },
  });

  if (!partido) {
    notFound();
  }

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo={capitalizar(formatearFecha(partido.fechaHora))}
        subtitulo={`${partido.ubicacion} · encargado: ${partido.encargado.nombreUsuario}`}
      />

      <SubnavPartido id={partido.id} />

      <Transicion claveCompleta>{children}</Transicion>
    </main>
  );
}
