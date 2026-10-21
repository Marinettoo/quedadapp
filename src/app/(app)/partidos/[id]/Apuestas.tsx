"use client";

import { useState, useTransition } from "react";
import { AccionBoton } from "@/components/AccionBoton";
import {
  crearApuesta,
  pronosticar,
  retirarPronostico,
  resolverApuesta,
  indicarAporte,
  confirmarAporte,
} from "../apuestasActions";
import styles from "./page.module.css";

const OPCIONES = [
  { valor: "EQUIPO1", etiqueta: "Victoria Equipo 1" },
  { valor: "EMPATE", etiqueta: "Empate" },
  { valor: "EQUIPO2", etiqueta: "Victoria Equipo 2" },
] as const;

const ETIQUETAS: Record<string, string> = {
  EQUIPO1: "Victoria Equipo 1",
  EMPATE: "Empate",
  EQUIPO2: "Victoria Equipo 2",
};

type Pronostico = {
  id: string;
  usuarioId: string;
  respuesta: string;
  cantidad: number;
  acierto: boolean | null;
  importeDebido: number | null;
  importeGanado: number | null;
  indicadoAporteEn: Date | null;
  confirmadoAporteEn: Date | null;
  usuario: { id: string; nombreUsuario: string };
};

type Apuesta = {
  id: string;
  cuota: number;
  resultado: string | null;
  resueltaEn: Date | null;
  pronosticos: Pronostico[];
};

export function Apuestas({
  partidoId,
  apuestas,
  usuarioId,
  puedeGenerar,
  abierto,
  permiteApuestas,
}: {
  partidoId: string;
  apuestas: Apuesta[];
  usuarioId: string;
  puedeGenerar: boolean;
  abierto: boolean;
  permiteApuestas: boolean;
}) {
  return (
    <section>
      <h2 className={styles.subtitulo}>Apuestas de la peña</h2>
      <p className={styles.meta}>
        Victoria Equipo 1, empate o victoria Equipo 2, apostando lo que quieras. Hay que añadir
        siempre 0.20 € aparte (no cuenta como premio) que van al bote. Si aciertas, ganas la
        mitad de lo apostado; si fallas, lo pierdes entero. Se puede apostar o retirar hasta 30
        minutos antes del partido.
      </p>

      {!permiteApuestas ? (
        <p className={styles.meta}>
          Las apuestas de resultado solo están disponibles en partidos a 2 equipos.
        </p>
      ) : apuestas.length === 0 ? (
        <>
          <p className={styles.meta}>
            {abierto ? "Todavía no hay apuesta para este partido." : "Ya no se puede crear una apuesta: el plazo cerró 30 minutos antes del partido."}
          </p>
          {puedeGenerar && abierto && (
            <AccionBoton accion={crearApuesta} campos={{ partidoId }} className={styles.generar}>
              Crear apuesta
            </AccionBoton>
          )}
        </>
      ) : (
        <div className={styles.apuestasLista}>
          {apuestas.map((a) => (
            <ApuestaItem
              key={a.id}
              apuesta={a}
              partidoId={partidoId}
              usuarioId={usuarioId}
              puedeGenerar={puedeGenerar}
              abierto={abierto}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ApuestaItem({
  apuesta,
  partidoId,
  usuarioId,
  puedeGenerar,
  abierto,
}: {
  apuesta: Apuesta;
  partidoId: string;
  usuarioId: string;
  puedeGenerar: boolean;
  abierto: boolean;
}) {
  const [resolviendo, setResolviendo] = useState(false);
  const tuPronostico = apuesta.pronosticos.find((p) => p.usuarioId === usuarioId);
  const resuelta = apuesta.resultado !== null;
  const [cantidad, setCantidad] = useState(tuPronostico ? String(tuPronostico.cantidad) : "");
  const [pendiente, startTransition] = useTransition();

  function apostar(respuesta: string) {
    const valor = Number(cantidad);
    if (!Number.isFinite(valor) || valor <= 0) {
      return;
    }
    const formData = new FormData();
    formData.append("apuestaId", apuesta.id);
    formData.append("partidoId", partidoId);
    formData.append("respuesta", respuesta);
    formData.append("cantidad", cantidad);
    startTransition(() => {
      pronosticar(formData);
    });
  }

  return (
    <div className={styles.apuestaCard}>
      <div className={styles.apuestaCabecera}>
        <span className={styles.apuestaPregunta}>¿Quién gana?</span>
        <span className={styles.apuestaCuota}>cuota {apuesta.cuota.toFixed(2)} €</span>
      </div>

      {resuelta ? (
        <p className={styles.apuestaResultado}>Resultado: {ETIQUETAS[apuesta.resultado!]}</p>
      ) : !abierto ? (
        <p className={styles.meta}>El plazo para apostar ya ha cerrado.</p>
      ) : null}

      {!resuelta && abierto && (
        <div className={styles.apuestaForm}>
          <label className={styles.apuestaCantidadLabel}>
            Cuánto apuestas
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="€"
              className={styles.apuestaCantidadInput}
            />
          </label>
          <div className={styles.apuestaOpciones}>
            {OPCIONES.map((o) => (
              <button
                key={o.valor}
                type="button"
                disabled={pendiente}
                onClick={() => apostar(o.valor)}
                className={
                  tuPronostico?.respuesta === o.valor
                    ? styles.apuestaOpcionActiva
                    : styles.apuestaOpcion
                }
              >
                {o.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {!resuelta && abierto && tuPronostico && (
        <AccionBoton
          accion={retirarPronostico}
          campos={{ apuestaId: apuesta.id, partidoId }}
          className={styles.apuestaRetirar}
        >
          Retirar mi apuesta
        </AccionBoton>
      )}

      {apuesta.pronosticos.length > 0 && (
        <ul className={styles.apuestaPronosticos}>
          {apuesta.pronosticos.map((p) => (
            <li key={p.id} className={styles.apuestaPronosticoFila}>
              <div>
                <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
                <span className={styles.meta}>
                  {" "}
                  · {ETIQUETAS[p.respuesta] ?? p.respuesta} · {p.cantidad.toFixed(2)} €
                  {resuelta && (p.acierto ? " ✓ acertó" : " ✗ falló")}
                  {resuelta && p.acierto && p.importeGanado
                    ? ` · gana ${p.importeGanado.toFixed(2)} €`
                    : ""}
                  {resuelta && p.importeDebido ? ` · debe ${p.importeDebido.toFixed(2)} €` : ""}
                </span>
              </div>
              {resuelta && !!p.importeDebido && (
                <div className={styles.pagoAcciones}>
                  {p.usuarioId === usuarioId && !p.confirmadoAporteEn && !p.indicadoAporteEn && (
                    <AccionBoton
                      accion={indicarAporte}
                      campos={{ pronosticoId: p.id, partidoId }}
                      className={styles.pagoBoton}
                    >
                      He aportado
                    </AccionBoton>
                  )}
                  {puedeGenerar && !p.confirmadoAporteEn && (
                    <AccionBoton
                      accion={confirmarAporte}
                      campos={{ pronosticoId: p.id, partidoId }}
                      className={styles.pagoBoton}
                    >
                      Confirmar aporte
                    </AccionBoton>
                  )}
                  {p.confirmadoAporteEn && <span className={styles.meta}>Aportado ✓</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!resuelta && puedeGenerar && (
        <>
          <button
            type="button"
            className={styles.pagoBotonSecundario}
            onClick={() => setResolviendo((v) => !v)}
          >
            {resolviendo ? "Cancelar" : "Resolver"}
          </button>
          {resolviendo && (
            <form action={resolverApuesta} className={styles.resultadoForm}>
              <input type="hidden" name="apuestaId" value={apuesta.id} />
              <input type="hidden" name="partidoId" value={partidoId} />
              <select name="resultado" defaultValue="" required>
                <option value="" disabled>
                  Resultado real
                </option>
                <option value="EQUIPO1">Victoria Equipo 1</option>
                <option value="EMPATE">Empate</option>
                <option value="EQUIPO2">Victoria Equipo 2</option>
              </select>
              <button type="submit" className={styles.generar}>
                Confirmar resultado
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
