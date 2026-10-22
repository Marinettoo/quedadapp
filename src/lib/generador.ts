export type JugadorGen = {
  tipo: "USUARIO" | "INVITADO";
  id: string;
  nombre: string;
  estrellas: number;
  esPortero: boolean;
};

export type ResultadoGeneracion = {
  formato: "TRIANGULAR" | "DOS_EQUIPOS";
  equipos: JugadorGen[][];
  listaEspera: JugadorGen[];
  // números de equipo (1, 2 o 3) que se han quedado sin portero porque
  // no había suficientes marcados; vacío si todos los equipos tienen uno.
  equiposSinPortero: number[];
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
 * Reparte a los jugadores que van a jugar en `numEquipos` equipos,
 * garantizando como máximo un portero por equipo: asigna un portero fijo
 * a cada equipo (si hay suficientes) y mete al resto (jugadores de campo
 * y porteros sobrantes) en el snake draft normal por estrellas.
 */
function repartirConPorteros(
  jugadores: JugadorGen[],
  numEquipos: number,
): { equipos: JugadorGen[][]; equiposSinPortero: number[] } {
  const porteros = jugadores.filter((j) => j.esPortero).sort((a, b) => b.estrellas - a.estrellas);
  const resto = jugadores.filter((j) => !j.esPortero);

  const asignados = porteros.slice(0, numEquipos);
  const porterosSobrantes = porteros.slice(numEquipos);

  const equipos: JugadorGen[][] = Array.from({ length: numEquipos }, () => []);
  const equiposSinPortero: number[] = [];
  for (let i = 0; i < numEquipos; i++) {
    if (asignados[i]) {
      equipos[i].push(asignados[i]);
    } else {
      equiposSinPortero.push(i + 1);
    }
  }

  const poolCampo = [...resto, ...porterosSobrantes];
  const repartoCampo = snakeDraft(poolCampo, numEquipos);
  repartoCampo.forEach((equipo, i) => equipos[i].push(...equipo));

  return { equipos, equiposSinPortero };
}

/**
 * jugadores debe venir ordenado por orden de apuntado (primero en
 * apuntarse, primero en la lista), para que la lista de espera en
 * "2 equipos" respete quién llegó antes.
 */
export function generarEquipos(jugadores: JugadorGen[]): ResultadoGeneracion {
  const total = jugadores.length;

  if (total >= MINIMO_TRIANGULAR) {
    const { equipos, equiposSinPortero } = repartirConPorteros(jugadores, 3);
    return {
      formato: "TRIANGULAR",
      equipos,
      listaEspera: [],
      equiposSinPortero,
    };
  }

  const objetivo = total <= 15 ? 14 : 16;
  const enJuego = jugadores.slice(0, Math.min(total, objetivo));
  const listaEspera = jugadores.slice(objetivo);

  const { equipos, equiposSinPortero } = repartirConPorteros(enJuego, 2);

  return {
    formato: "DOS_EQUIPOS",
    equipos,
    listaEspera,
    equiposSinPortero,
  };
}
