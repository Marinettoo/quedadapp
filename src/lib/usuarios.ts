// Al rechazar una solicitud o expulsar a alguien, no se borra la cuenta:
// muchos registros compartidos (partidos, resultados, valoraciones que
// otros recibieron...) dependen de ella. En vez de eso, se libera su
// nombre de usuario y email para que puedan volver a registrarse con
// el mismo nombre si hace falta.
export function identidadDeBaja(usuarioId: string) {
  return {
    nombreUsuario: `exjugador_${usuarioId}`,
    email: `exjugador_${usuarioId}@baja.quedadapp.local`,
  };
}

export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const aunNoCumple =
    hoy.getMonth() < fechaNacimiento.getMonth() ||
    (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate());
  if (aunNoCumple) edad--;
  return edad;
}

export const ETIQUETAS_PIERNA: Record<string, string> = {
  DIESTRO: "Diestro",
  ZURDO: "Zurdo",
  AMBIDIESTRO: "Ambidiestro",
};
