// Convierte una fecha y hora "de pared" en Europe/Madrid (tal como las
// escribe el usuario, p. ej. "2026-10-25" + "21:00") al instante UTC
// correcto, sin depender de la zona horaria del servidor. Necesario
// porque `new Date("2026-10-25T21:00")` se interpreta con la hora local
// del proceso de Node, que en el servidor suele ser UTC, no Madrid.
export function fechaHoraMadrid(fecha: string, hora: string): Date {
  // Primera aproximación tratando la hora como si fuera UTC.
  const aproximada = new Date(`${fecha}T${hora}:00Z`);

  // ¿Qué hora marca esa aproximación en Madrid? La diferencia con la hora
  // deseada nos da el desfase horario (+1 o +2 según horario de verano).
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(aproximada);
  const obtener = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "0";
  const comoUtc = Date.UTC(
    Number(obtener("year")),
    Number(obtener("month")) - 1,
    Number(obtener("day")),
    Number(obtener("hour")) === 24 ? 0 : Number(obtener("hour")),
    Number(obtener("minute")),
  );
  const desfaseMs = aproximada.getTime() - comoUtc;

  return new Date(aproximada.getTime() + desfaseMs);
}

export function cierreAsistencia(fechaHora: Date, horasCierre: number): Date {
  return new Date(fechaHora.getTime() - horasCierre * 60 * 60 * 1000);
}

export function asistenciaAbierta(fechaHora: Date, horasCierre: number): boolean {
  return new Date() < cierreAsistencia(fechaHora, horasCierre);
}
