import { prisma } from "@/lib/db";

const ESTRELLAS_POR_DEFECTO = 3;

export async function promediosEstrellas(
  usuarioIds: string[],
): Promise<Record<string, number>> {
  if (usuarioIds.length === 0) return {};

  const valoraciones = await prisma.valoracion.findMany({
    where: { valoradoId: { in: usuarioIds } },
    select: { valoradoId: true, estrellas: true },
  });

  const sumas = new Map<string, { total: number; cuenta: number }>();
  for (const v of valoraciones) {
    const actual = sumas.get(v.valoradoId) ?? { total: 0, cuenta: 0 };
    actual.total += v.estrellas;
    actual.cuenta += 1;
    sumas.set(v.valoradoId, actual);
  }

  const resultado: Record<string, number> = {};
  for (const id of usuarioIds) {
    const s = sumas.get(id);
    resultado[id] = s ? s.total / s.cuenta : ESTRELLAS_POR_DEFECTO;
  }
  return resultado;
}
