"use client";

import { useState } from "react";
import { reabrirVotacionMvp, eliminarVotacionMvp } from "../actions";
import { AccionBoton } from "@/components/AccionBoton";
import styles from "../../page.module.css";

// Solo para admins: corregir un cierre por error (reabrir, se puede
// seguir votando y se vuelve a decidir el ganador) o borrar la
// votación entera. Borrar pide confirmar, como en "Eliminar partido".
export function AccionesVotacionMvp({ votacionId, cerrada }: { votacionId: string; cerrada: boolean }) {
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  return (
    <div className={styles.accionesVotacion}>
      {cerrada && (
        <AccionBoton
          accion={reabrirVotacionMvp}
          campos={{ votacionId }}
          className={styles.cerrarBoton}
        >
          Reabrir votación
        </AccionBoton>
      )}

      {!confirmarBorrado ? (
        <button type="button" className={styles.cerrarBoton} onClick={() => setConfirmarBorrado(true)}>
          Eliminar votación
        </button>
      ) : (
        <>
          <span className={styles.meta}>¿Seguro? Se borran también todos sus votos.</span>
          <AccionBoton accion={eliminarVotacionMvp} campos={{ votacionId }} className={styles.cerrarBoton}>
            Sí, eliminar
          </AccionBoton>
          <button
            type="button"
            className={styles.cerrarBoton}
            onClick={() => setConfirmarBorrado(false)}
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}
