export type JugadorGen = {
  tipo: "USUARIO" | "INVITADO";
  id: string;
  nombre: string;
  estrellas: number;
  esPortero: boolean;
};

// Grupo de jugadores (por id de JugadorGen) que se intenta mantener junto
// en el mismo equipo al generar. Si no cabe entero en ningún equipo, se
// deshace y sus miembros se reparten normal (ver gruposRotos).
export type GrupoGen = {
  ids: string[];
};

export type ResultadoGeneracion = {
  formato: "TRIANGULAR" | "DOS_EQUIPOS";
  equipos: JugadorGen[][];
  listaEspera: JugadorGen[];
  // números de equipo (1, 2 o 3) que se han quedado sin portero porque
  // no había suficientes marcados; vacío si todos los equipos tienen uno.
  equiposSinPortero: number[];
  // grupos que no se pudieron mantener juntos porque no cabían enteros
  // en ningún equipo; sus miembros se repartieron como jugadores sueltos.
  gruposRotos: JugadorGen[][];
};

const MINIMO_TRIANGULAR = 21;

/**
 * Agrupa a los jugadores en "unidades": los grupos que caben (2+ miembros
 * presentes en la lista de jugadores, sin solapar con otro grupo ya
 * usado) van como una sola unidad; el resto queda como unidades de 1.
 */
function construirUnidades(jugadores: JugadorGen[], grupos: GrupoGen[]): JugadorGen[][] {
  const porId = new Map(jugadores.map((j) => [j.id, j]));
  const usados = new Set<string>();
  const unidades: JugadorGen[][] = [];

  for (const grupo of grupos) {
    const miembros = grupo.ids
      .map((id) => porId.get(id))
      .filter((j): j is JugadorGen => !!j && !usados.has(j.id));
    if (miembros.length < 2) continue;
    miembros.forEach((j) => usados.add(j.id));
    unidades.push(miembros);
  }

  for (const jugador of jugadores) {
    if (!usados.has(jugador.id)) {
      unidades.push([jugador]);
    }
  }

  return unidades;
}

/**
 * Reparte a los jugadores que van a jugar en `numEquipos` equipos,
 * respetando dos reglas a la vez:
 *
 * - Como máximo un portero por equipo (si hay suficientes porteros
 *   marcados, cada equipo tiene uno; si no, se avisa en equiposSinPortero;
 *   si hay de más, el resto juega de campo).
 * - Los grupos de amigos se colocan enteros en un equipo cuando caben;
 *   si un grupo no cabe entero en ninguno, se deshace (gruposRotos) y
 *   sus miembros se reparten como jugadores sueltos.
 *
 * El resto de huecos se reparte para igualar la suma de estrellas entre
 * equipos lo máximo posible, con tamaños que difieren como mucho en un
 * jugador.
 */
function repartirConPorterosYGrupos(
  jugadores: JugadorGen[],
  numEquipos: number,
  grupos: GrupoGen[],
): { equipos: JugadorGen[][]; equiposSinPortero: number[]; gruposRotos: JugadorGen[][] } {
  const unidades = construirUnidades(jugadores, grupos);
  const grupales = unidades.filter((u) => u.length > 1).sort((a, b) => b.length - a.length);
  const sueltos = unidades.filter((u) => u.length === 1).map((u) => u[0]);

  const base = Math.floor(jugadores.length / numEquipos);
  let resto = jugadores.length % numEquipos;
  const capacidades = Array(numEquipos).fill(base);
  for (let i = 0; i < numEquipos && resto > 0; i++, resto--) {
    capacidades[i] += 1;
  }

  const equipos: JugadorGen[][] = Array.from({ length: numEquipos }, () => []);
  const sumaEstrellas = Array(numEquipos).fill(0);
  const tienePortero = Array(numEquipos).fill(false);
  const hueco = [...capacidades];
  const gruposRotos: JugadorGen[][] = [];
  const indices = Array.from({ length: numEquipos }, (_, i) => i);

  for (const grupo of grupales) {
    const traeKeeper = grupo.some((j) => j.esPortero);
    const candidatos = indices.filter(
      (i) => hueco[i] >= grupo.length && (!traeKeeper || !tienePortero[i]),
    );

    if (candidatos.length === 0) {
      gruposRotos.push(grupo);
      sueltos.push(...grupo);
      continue;
    }

    let mejor = candidatos[0];
    for (const i of candidatos) {
      if (sumaEstrellas[i] < sumaEstrellas[mejor]) mejor = i;
    }

    equipos[mejor].push(...grupo);
    sumaEstrellas[mejor] += grupo.reduce((s, j) => s + j.estrellas, 0);
    hueco[mejor] -= grupo.length;
    if (traeKeeper) tienePortero[mejor] = true;
  }

  const porterosSueltos = sueltos
    .filter((j) => j.esPortero)
    .sort((a, b) => b.estrellas - a.estrellas);
  const campoSueltos = sueltos.filter((j) => !j.esPortero);

  for (const portero of porterosSueltos) {
    const candidatos = indices.filter((i) => hueco[i] > 0 && !tienePortero[i]);
    if (candidatos.length === 0) {
      // no hay equipo libre sin portero: juega de campo
      campoSueltos.push(portero);
      continue;
    }

    let mejor = candidatos[0];
    for (const i of candidatos) {
      if (sumaEstrellas[i] < sumaEstrellas[mejor]) mejor = i;
    }
    equipos[mejor].push(portero);
    sumaEstrellas[mejor] += portero.estrellas;
    hueco[mejor]--;
    tienePortero[mejor] = true;
  }

  const poolCampo = [...campoSueltos].sort((a, b) => b.estrellas - a.estrellas);
  for (const jugador of poolCampo) {
    let mejor = -1;
    for (let i = 0; i < numEquipos; i++) {
      if (hueco[i] <= 0) continue;
      if (mejor === -1 || sumaEstrellas[i] < sumaEstrellas[mejor]) mejor = i;
    }
    equipos[mejor].push(jugador);
    sumaEstrellas[mejor] += jugador.estrellas;
    hueco[mejor]--;
  }

  const equiposSinPortero = indices.filter((i) => !tienePortero[i]).map((i) => i + 1);

  return { equipos, equiposSinPortero, gruposRotos };
}

/**
 * jugadores debe venir ordenado por orden de apuntado (primero en
 * apuntarse, primero en la lista), para que la lista de espera en
 * "2 equipos" respete quién llegó antes. grupos son grupos de amigos que
 * se intentan mantener juntos (ver GrupoGen).
 */
export function generarEquipos(
  jugadores: JugadorGen[],
  grupos: GrupoGen[] = [],
): ResultadoGeneracion {
  const total = jugadores.length;

  if (total >= MINIMO_TRIANGULAR) {
    const { equipos, equiposSinPortero, gruposRotos } = repartirConPorterosYGrupos(
      jugadores,
      3,
      grupos,
    );
    return {
      formato: "TRIANGULAR",
      equipos,
      listaEspera: [],
      equiposSinPortero,
      gruposRotos,
    };
  }

  const objetivo = total <= 15 ? 14 : 16;
  const enJuego = jugadores.slice(0, Math.min(total, objetivo));
  const listaEspera = jugadores.slice(objetivo);

  const { equipos, equiposSinPortero, gruposRotos } = repartirConPorterosYGrupos(
    enJuego,
    2,
    grupos,
  );

  return {
    formato: "DOS_EQUIPOS",
    equipos,
    listaEspera,
    equiposSinPortero,
    gruposRotos,
  };
}
