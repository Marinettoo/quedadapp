export type JugadorGen = {
  usuarioId: string;
  nombreUsuario: string;
  estrellas: number;
};

export type ResultadoGeneracion = {
  formato: "TRIANGULAR" | "DOS_EQUIPOS";
  equipos: JugadorGen[][];
  listaEspera: JugadorGen[];
};

const MINIMO_TRIANGULAR = 21;

/**
 * Reparte jugadores en equipos usando un "snake draft" por estrellas:
 * ordena de más a menos valorado y los reparte en zigzag (1,2,3,3,2,1,…)
 * para que la suma de estrellas quede lo más igualada posible, con
 * tamaños que difieren como mucho en un jugador.
 */
function snakeDraft(jugadores: JugadorGen[], numEquipos: number): JugadorGen[][] {
  const ordenados = [...jugadores].sort((a, b) => b.estrellas - a.estrellas);
  const equipos: JugadorGen[][] = Array.from({ length: numEquipos }, () => []);

  let equipoActual = 0;
  let direccion = 1;
  for (const jugador of ordenados) {
    equipos[equipoActual].push(jugador);
    const enUltimo = equipoActual === numEquipos - 1;
    const enPrimero = equipoActual === 0;
    if (direccion === 1 && enUltimo) {
      direccion = -1;
    } else if (direccion === -1 && enPrimero) {
      direccion = 1;
    } else {
      equipoActual += direccion;
    }
  }

  return equipos;
}

/**
 * jugadores debe venir ordenado por orden de apuntado (primero en
 * apuntarse, primero en la lista), para que la lista de espera en
 * "2 equipos" respete quién llegó antes.
 */
export function generarEquipos(jugadores: JugadorGen[]): ResultadoGeneracion {
  const total = jugadores.length;

  if (total >= MINIMO_TRIANGULAR) {
    return {
      formato: "TRIANGULAR",
      equipos: snakeDraft(jugadores, 3),
      listaEspera: [],
    };
  }

  const objetivo = total <= 15 ? 14 : 16;
  const enJuego = jugadores.slice(0, Math.min(total, objetivo));
  const listaEspera = jugadores.slice(objetivo);

  return {
    formato: "DOS_EQUIPOS",
    equipos: snakeDraft(enJuego, 2),
    listaEspera,
  };
}
