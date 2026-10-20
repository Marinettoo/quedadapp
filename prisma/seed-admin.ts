import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const nombreUsuario = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!nombreUsuario || !email || !password) {
    throw new Error(
      "Define ADMIN_USERNAME, ADMIN_EMAIL y ADMIN_PASSWORD en tu .env antes de ejecutar este script.",
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.usuario.upsert({
    where: { nombreUsuario },
    update: { email, passwordHash, rol: "ADMIN", estado: "APROBADA" },
    create: { nombreUsuario, email, passwordHash, rol: "ADMIN", estado: "APROBADA" },
  });

  console.log(`Administrador listo: ${admin.nombreUsuario} (${admin.email})`);
}

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
