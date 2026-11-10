export type EnfrentamientoGen = {
  equipoLocal: number;
  equipoVisitante: number;
  golesLocal: number;
  golesVisitante: number;
};

export type FilaTabla = {
  equipo: number;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  puntos: number;
};

export function calcularTabla(
  enfrentamientos: EnfrentamientoGen[],
  numEquipos: number,
): FilaTabla[] {
  const tabla = new Map<number, FilaTabla>();
  for (let equipo = 1; equipo <= numEquipos; equipo++) {
    tabla.set(equipo, {
      equipo,
      jugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
      puntos: 0,
    });
  }

  for (const e of enfrentamientos) {
    const local = tabla.get(e.equipoLocal);
    const visitante = tabla.get(e.equipoVisitante);
    if (!local || !visitante) continue;

    local.jugados += 1;
    visitante.jugados += 1;
    local.golesFavor += e.golesLocal;
    local.golesContra += e.golesVisitante;
    visitante.golesFavor += e.golesVisitante;
    visitante.golesContra += e.golesLocal;

    if (e.golesLocal > e.golesVisitante) {
      local.ganados += 1;
      local.puntos += 3;
      visitante.perdidos += 1;
    } else if (e.golesLocal < e.golesVisitante) {
      visitante.ganados += 1;
      visitante.puntos += 3;
      local.perdidos += 1;
    } else {
      local.empatados += 1;
      visitante.empatados += 1;
      local.puntos += 1;
      visitante.puntos += 1;
    }
  }

  return [...tabla.values()].sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    const difA = a.golesFavor - a.golesContra;
    const difB = b.golesFavor - b.golesContra;
    return difB - difA;
  });
}

// Una línea con el resultado, para listas e historial (y el resumen
// del último partido en Inicio): no hace falta ver la tabla entera
// para saber cómo quedó.
export function resumenResultado(
  formato: "TRIANGULAR" | "DOS_EQUIPOS",
  enfrentamientos: EnfrentamientoGen[],
): string {
  if (enfrentamientos.length === 0) return "Sin resultado registrado";

  if (formato === "DOS_EQUIPOS") {
    const r = enfrentamientos[0];
    // Dos puntos tras "Equipo 1": sin él, el número de equipo pegado al
    // primer gol ("Equipo 1 3") se leía como "Equipo 13".
    return `Equipo 1: ${r.golesLocal} - ${r.golesVisitante} Equipo 2`;
  }

  const tabla = calcularTabla(enfrentamientos, 3);
  const ganador = tabla[0];
  return `Ganador: Equipo ${ganador.equipo} (${ganador.puntos} pts)`;
}
