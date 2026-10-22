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

type Formato = "TRIANGULAR" | "DOS_EQUIPOS";

const OPCIONES_DOS_EQUIPOS = [
  { valor: "EQUIPO1", etiqueta: "Victoria Equipo 1" },
  { valor: "EMPATE", etiqueta: "Empate" },
  { valor: "EQUIPO2", etiqueta: "Victoria Equipo 2" },
] as const;

const OPCIONES_TRIANGULAR = [
  { valor: "EQUIPO1", etiqueta: "1º Equipo 1" },
  { valor: "EQUIPO2", etiqueta: "1º Equipo 2" },
  { valor: "EQUIPO3", etiqueta: "1º Equipo 3" },
] as const;

function opcionesDe(formato: Formato) {
  return formato === "TRIANGULAR" ? OPCIONES_TRIANGULAR : OPCIONES_DOS_EQUIPOS;
}

function etiquetasDe(formato: Formato): Record<string, string> {
  return Object.fromEntries(opcionesDe(formato).map((o) => [o.valor, o.etiqueta]));
}

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
  formato,
}: {
  partidoId: string;
  apuestas: Apuesta[];
  usuarioId: string;
  puedeGenerar: boolean;
  abierto: boolean;
  permiteApuestas: boolean;
  formato: Formato;
}) {
  return (
    <section>
      <h2 className={styles.subtitulo}>Apuestas de la peña</h2>
      <p className={styles.meta}>
        {formato === "TRIANGULAR"
          ? "Pronostica quién queda primero en la miniliga y apuesta lo que quieras."
          : "Pronostica victoria, empate o derrota y apuesta lo que quieras."}{" "}
        Si aciertas, recuperas lo apostado más la mitad como beneficio. Cada apuesta cobra 0.20 €
        de comisión para el bote, aciertes o falles. Se puede apostar o retirar hasta 30 minutos
        antes del partido.
      </p>

      {!permiteApuestas ? (
        <p className={styles.meta}>
          Primero hay que generar los equipos del partido para poder crear una apuesta.
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
              formato={formato}
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
  formato,
}: {
  apuesta: Apuesta;
  partidoId: string;
  usuarioId: string;
  puedeGenerar: boolean;
  abierto: boolean;
  formato: Formato;
}) {
  const [resolviendo, setResolviendo] = useState(false);
  const tuPronostico = apuesta.pronosticos.find((p) => p.usuarioId === usuarioId);
  const resuelta = apuesta.resultado !== null;
  const [cantidad, setCantidad] = useState(tuPronostico ? String(tuPronostico.cantidad) : "");
  const [pendiente, startTransition] = useTransition();
  const opciones = opcionesDe(formato);
  const etiquetas = etiquetasDe(formato);

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
        <span className={styles.apuestaPregunta}>
          {formato === "TRIANGULAR" ? "¿Quién queda primero?" : "¿Quién gana?"}
        </span>
        <span className={styles.apuestaCuota}>comisión {apuesta.cuota.toFixed(2)} €</span>
      </div>

      {resuelta ? (
        <p className={styles.apuestaResultado}>Resultado: {etiquetas[apuesta.resultado!]}</p>
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
            {opciones.map((o) => (
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
                  · {etiquetas[p.respuesta] ?? p.respuesta} · apostó {p.cantidad.toFixed(2)} €
                  {resuelta && p.acierto && p.importeGanado
                    ? ` · ✓ acertó, recibe ${(p.cantidad + p.importeGanado).toFixed(2)} € (apuesta + ${p.importeGanado.toFixed(2)} € de beneficio) · debe 0.20 € de comisión`
                    : ""}
                  {resuelta && !p.acierto && p.importeDebido
                    ? ` · ✗ falló, debe ${p.importeDebido.toFixed(2)} € (apuesta + comisión)`
                    : ""}
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
                {opciones.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
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
