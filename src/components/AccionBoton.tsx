"use client";

import { useTransition } from "react";

type AccionBotonProps = {
  accion: (formData: FormData) => Promise<void>;
  campos: Record<string, string>;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

export function AccionBoton({ accion, campos, className, children, ariaLabel }: AccionBotonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        const formData = new FormData();
        for (const [clave, valor] of Object.entries(campos)) {
          formData.append(clave, valor);
        }
        startTransition(() => {
          accion(formData);
        });
      }}
    >
      {children}
    </button>
  );
}
