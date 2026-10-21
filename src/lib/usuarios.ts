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
