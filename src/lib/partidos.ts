export function cierreAsistencia(fechaHora: Date, horasCierre: number): Date {
  return new Date(fechaHora.getTime() - horasCierre * 60 * 60 * 1000);
}

export function asistenciaAbierta(fechaHora: Date, horasCierre: number): boolean {
  return new Date() < cierreAsistencia(fechaHora, horasCierre);
}
