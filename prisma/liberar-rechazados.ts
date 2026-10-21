// Script de un solo uso: libera el nombre de usuario y email de las
// cuentas RECHAZADA que quedaron así antes de que esto se hiciera
// automáticamente (ver src/lib/usuarios.ts). Seguro de ejecutar varias
// veces: las cuentas ya liberadas (nombreUsuario que empieza por
// "exjugador_") se dejan tal cual.
import { prisma } from "../src/lib/db";
import { identidadDeBaja } from "../src/lib/usuarios";

async function main() {
  const pendientes = await prisma.usuario.findMany({
    where: { estado: "RECHAZADA", NOT: { nombreUsuario: { startsWith: "exjugador_" } } },
    select: { id: true, nombreUsuario: true },
  });

  if (pendientes.length === 0) {
    console.log("No hay cuentas rechazadas pendientes de liberar.");
    return;
  }

  for (const u of pendientes) {
    await prisma.usuario.update({ where: { id: u.id }, data: identidadDeBaja(u.id) });
    console.log(`Liberado: ${u.nombreUsuario} -> exjugador_${u.id}`);
  }

  console.log(`Listo. ${pendientes.length} cuenta(s) liberada(s).`);
}

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
