"use client";

import { useState } from "react";
import { AccionBoton } from "@/components/AccionBoton";
import {
  crearApuesta,
  pronosticar,
  resolverApuesta,
  indicarAporte,
  confirmarAporte,
} from "../apuestasActions";
import styles from "./page.module.css";

const ETIQUETAS: Record<string, string> = {
  EQUIPO1: "Victoria Equipo 1",
  EMPATE: "Empate",
  EQUIPO2: "Victoria Equipo 2",
};

type Pronostico = {
  id: string;
  usuarioId: string;
  respuesta: string;
  acierto: boolean | null;
  importeDebido: number | null;
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
        Victoria Equipo 1, empate o victoria Equipo 2. Participar cuesta 0.20 €, aciertes o
        falles, y va al bote.
      </p>

      {!permiteApuestas ? (
        <p className={styles.meta}>
          Las apuestas de resultado solo están disponibles en partidos a 2 equipos.
        </p>
      ) : apuestas.length === 0 ? (
        <>
          <p className={styles.meta}>Todavía no hay apuesta para este partido.</p>
          {puedeGenerar && (
            <AccionBoton
              accion={crearApuesta}
              campos={{ partidoId }}
              className={styles.generar}
            >
              Crear apuesta
            </AccionBoton>
          )}
        </>
      ) : (
        <ul className={styles.lista}>
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
        </ul>
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

  return (
    <li className={styles.equipo}>
      <p className={styles.nombre}>
        ¿Quién gana? <span className={styles.meta}>· cuota de {apuesta.cuota.toFixed(2)} €</span>
      </p>

      {resuelta && (
        <p className={styles.meta}>
          Resultado: <strong>{ETIQUETAS[apuesta.resultado!]}</strong>
        </p>
      )}

      <ul className={styles.lista}>
        {apuesta.pronosticos.map((p) => (
          <li key={p.id} className={styles.pagoFila}>
            <div>
              <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
              <span className={styles.meta}>
                {" "}
                · {ETIQUETAS[p.respuesta] ?? p.respuesta}
                {resuelta && (p.acierto ? " ✓ acertó" : " ✗ falló")}
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

      {!resuelta && abierto && (
        <form action={pronosticar} className={styles.resultadoForm}>
          <input type="hidden" name="apuestaId" value={apuesta.id} />
          <input type="hidden" name="partidoId" value={partidoId} />
          <select name="respuesta" defaultValue={tuPronostico?.respuesta ?? ""} required>
            <option value="" disabled>
              Elige tu pronóstico
            </option>
            <option value="EQUIPO1">Victoria Equipo 1</option>
            <option value="EMPATE">Empate</option>
            <option value="EQUIPO2">Victoria Equipo 2</option>
          </select>
          <button type="submit" className={styles.pagoBotonSecundario}>
            {tuPronostico ? "Cambiar" : "Pronosticar"}
          </button>
        </form>
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
    </li>
  );
}
