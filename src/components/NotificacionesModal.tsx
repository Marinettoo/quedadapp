"use client";

import { NotificacionesContenido } from "./NotificacionesContenido";
import { ModalFlotante } from "./ModalFlotante";

type Notificacion = {
  id: string;
  mensaje: string;
  enlace: string | null;
  leidaEn: Date | null;
  creadaEn: Date;
};

export function NotificacionesModal({
  abierto,
  onCerrar,
  notificaciones,
  vapidPublicKey,
}: {
  abierto: boolean;
  onCerrar: () => void;
  notificaciones: Notificacion[];
  vapidPublicKey: string | null;
}) {
  return (
    <ModalFlotante
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Notificaciones"
      subtitulo="Novedades de la peña para ti."
    >
      <NotificacionesContenido
        notificaciones={notificaciones}
        vapidPublicKey={vapidPublicKey}
        onNavegar={onCerrar}
      />
    </ModalFlotante>
  );
}
