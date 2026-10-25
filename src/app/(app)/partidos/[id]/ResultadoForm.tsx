"use client";

import { useState } from "react";
import styles from "./page.module.css";

export type JugadorOpcion = {
  clave: string;
  nombre: string;
  campoName: string;
  equipo: number;
};

// Formulario para añadir o corregir el resultado de un enfrentamiento:
// los goles se marcan con botones + / − (nada de escribir números), y
// en un triangular solo se ven los jugadores de los dos equipos que
// juegan ese mini partido, no los del equipo que descansa.
export function ResultadoForm({
  partidoId,
  accion,
  numEquipos,
  jugadores,
  equipoLocalInicial,
  equipoVisitanteInicial,
  mostrarSelects,
  enfrentamientoId,
  golesPrevios,
  textoBoton,
}: {
  partidoId: string;
  accion: (formData: FormData) => Promise<void>;
  numEquipos: number;
  jugadores: JugadorOpcion[];
  equipoLocalInicial: number;
  equipoVisitanteInicial: number;
  mostrarSelects: boolean;
  enfrentamientoId?: string;
  golesPrevios?: Record<string, number>;
  textoBoton: string;
}) {
  const [equipoLocal, setEquipoLocal] = useState(equipoLocalInicial);
  const [equipoVisitante, setEquipoVisitante] = useState(equipoVisitanteInicial);

  const opcionesTodas = Array.from({ length: numEquipos }, (_, i) => i + 1);
  const porEquipo = [equipoLocal, equipoVisitante].map((equipo) => ({
    equipo,
    jugadores: jugadores.filter((j) => j.equipo === equipo),
  }));
  const hayJugadores = porEquipo.some((e) => e.jugadores.length > 0);

  return (
    <form action={accion} className={styles.resultadoForm}>
      <input type="hidden" name="partidoId" value={partidoId} />
      {enfrentamientoId && <input type="hidden" name="id" value={enfrentamientoId} />}

      {mostrarSelects ? (
        <>
          <select
            name="equipoLocal"
            value={equipoLocal}
            onChange={(e) => setEquipoLocal(Number(e.target.value))}
          >
            {opcionesTodas
              .filter((n) => n !== equipoVisitante)
              .map((n) => (
                <option key={n} value={n}>
                  Equipo {n}
                </option>
              ))}
          </select>
          <span>contra</span>
          <select
            name="equipoVisitante"
            value={equipoVisitante}
            onChange={(e) => setEquipoVisitante(Number(e.target.value))}
          >
            {opcionesTodas
              .filter((n) => n !== equipoLocal)
              .map((n) => (
                <option key={n} value={n}>
                  Equipo {n}
                </option>
              ))}
          </select>
        </>
      ) : (
        <>
          <input type="hidden" name="equipoLocal" value={equipoLocal} />
          <input type="hidden" name="equipoVisitante" value={equipoVisitante} />
        </>
      )}

      {hayJugadores && (
        <div className={styles.golesJugadores}>
          <p className={styles.meta}>Pulsa + o − junto a cada jugador que haya marcado.</p>
          {porEquipo.map(({ equipo, jugadores: js }) =>
            js.length === 0 ? null : (
              <div key={equipo} className={styles.golesEquipo}>
                <h4 className={styles.golesEquipoTitulo}>Equipo {equipo}</h4>
                <div className={styles.golesLista}>
                  {js.map((j) => (
                    <ContadorGol
                      key={j.clave}
                      nombre={j.nombre}
                      campoName={j.campoName}
                      valorInicial={golesPrevios?.[j.clave] ?? 0}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <button type="submit" className={styles.generar}>
        {textoBoton}
      </button>
    </form>
  );
}

function ContadorGol({
  nombre,
  campoName,
  valorInicial,
}: {
  nombre: string;
  campoName: string;
  valorInicial: number;
}) {
  const [valor, setValor] = useState(valorInicial);

  return (
    <div className={styles.golJugadorFila}>
      <span>{nombre}</span>
      <div className={styles.golStepper}>
        <button
          type="button"
          className={styles.golStepperBoton}
          onClick={() => setValor((v) => Math.max(0, v - 1))}
          aria-label={`Quitar gol a ${nombre}`}
        >
          −
        </button>
        <input type="number" name={campoName} value={valor} readOnly className={styles.golStepperValor} />
        <button
          type="button"
          className={styles.golStepperBoton}
          onClick={() => setValor((v) => v + 1)}
          aria-label={`Añadir gol a ${nombre}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
