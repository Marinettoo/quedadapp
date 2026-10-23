import { subirFoto, quitarFoto } from "@/app/(app)/jugadores/actions";
import { AccionBoton } from "@/components/AccionBoton";
import styles from "./FormularioFoto.module.css";

// Subir/quitar la foto de perfil de un jugador. Lo usan tanto la ficha
// pública (cuando la ve el propio jugador o un admin) como "Mi perfil".
export function FormularioFoto({
  jugadorId,
  tieneFoto,
}: {
  jugadorId: string;
  tieneFoto: boolean;
}) {
  return (
    <>
      <form action={subirFoto} className={styles.fotoForm}>
        <input type="hidden" name="usuarioId" value={jugadorId} />
        <input type="file" name="foto" accept="image/png" required className={styles.fotoInput} />
        <button type="submit" className={styles.fotoBoton}>
          Subir foto
        </button>
      </form>
      {tieneFoto && (
        <AccionBoton accion={quitarFoto} campos={{ usuarioId: jugadorId }} className={styles.fotoQuitar}>
          Quitar foto
        </AccionBoton>
      )}
    </>
  );
}
