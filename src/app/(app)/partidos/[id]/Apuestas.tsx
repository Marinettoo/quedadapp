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
  pregunta: string;
  importe: number;
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
}: {
  partidoId: string;
  apuestas: Apuesta[];
  usuarioId: string;
  puedeGenerar: boolean;
  abierto: boolean;
}) {
  const [mostrarNueva, setMostrarNueva] = useState(false);

  return (
    <section>
      <h2 className={styles.subtitulo}>Apuestas de la peña</h2>
      <p className={styles.meta}>Si se pierde una apuesta, el dinero va al bote.</p>

      {apuestas.length === 0 ? (
        <p className={styles.meta}>Todavía no hay apuestas para este partido.</p>
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

      {puedeGenerar && (
        <>
          <button
            type="button"
            className={styles.pagoBotonSecundario}
            onClick={() => setMostrarNueva((v) => !v)}
          >
            {mostrarNueva ? "Cancelar" : "Crear apuesta"}
          </button>
          {mostrarNueva && (
            <form action={crearApuesta} className={styles.resultadoForm}>
              <input type="hidden" name="partidoId" value={partidoId} />
              <input type="text" name="pregunta" placeholder="¿Quién gana? ¿Cuántos goles mete X?" required />
              <label className={styles.meta}>
                Se juega
                <input
                  type="number"
                  name="importe"
                  min={0.5}
                  step="0.5"
                  defaultValue={1}
                  required
                  className={styles.golesInput}
                />
              </label>
              <label className={styles.meta}>
                Cuota por participar
                <input
                  type="number"
                  name="cuota"
                  min={0}
                  step="0.1"
                  defaultValue={0.2}
                  required
                  className={styles.golesInput}
                />
              </label>
              <button type="submit" className={styles.generar}>
                Crear
              </button>
            </form>
          )}
        </>
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
        {apuesta.pregunta}{" "}
        <span className={styles.meta}>
          · se juega {apuesta.importe.toFixed(2)} € · cuota de {apuesta.cuota.toFixed(2)} € por participar
        </span>
      </p>

      {resuelta && (
        <p className={styles.meta}>
          Resultado: <strong>{apuesta.resultado}</strong>
        </p>
      )}

      <ul className={styles.lista}>
        {apuesta.pronosticos.map((p) => (
          <li key={p.id} className={styles.pagoFila}>
            <div>
              <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
              <span className={styles.meta}>
                {" "}
                · {p.respuesta}
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
          <input
            type="text"
            name="respuesta"
            placeholder="Tu pronóstico"
            defaultValue={tuPronostico?.respuesta ?? ""}
            required
          />
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
              <input type="text" name="resultado" placeholder="Resultado real" required />
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
