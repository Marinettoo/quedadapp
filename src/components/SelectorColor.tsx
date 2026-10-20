"use client";

import { useState, useTransition } from "react";

type SelectorColorProps = {
  accion: (formData: FormData) => Promise<void>;
  partidoId: string;
  equipo: number;
  colorInicial: string;
  className?: string;
};

export function SelectorColor({ accion, partidoId, equipo, colorInicial, className }: SelectorColorProps) {
  const [color, setColor] = useState(colorInicial);
  const [, startTransition] = useTransition();

  return (
    <input
      type="color"
      value={color}
      className={className}
      aria-label={`Color del equipo ${equipo}`}
      onChange={(evento) => {
        const nuevoColor = evento.target.value;
        setColor(nuevoColor);
        const formData = new FormData();
        formData.append("partidoId", partidoId);
        formData.append("equipo", String(equipo));
        formData.append("color", nuevoColor);
        startTransition(() => {
          accion(formData);
        });
      }}
    />
  );
}
