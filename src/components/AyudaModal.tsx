"use client";

import { AyudaContenido } from "./AyudaContenido";
import { ModalFlotante } from "./ModalFlotante";

export function AyudaModal({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  return (
    <ModalFlotante
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="¿Cómo funciona?"
      subtitulo="Lo esencial de Quedadapp."
    >
      <AyudaContenido />
    </ModalFlotante>
  );
}
