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
