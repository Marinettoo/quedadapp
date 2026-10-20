import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// La mayoría de pantallas de esta app dependen de la sesión (cookies),
// así que no pueden prerenderizarse de forma estática. Se desactiva la
// validación de "instant" a nivel global; se puede reactivar más
// adelante página a página si interesa optimizar la navegación.
export const instant = false;

export const metadata: Metadata = {
  title: "QuedadApp",
  description: "Organiza los partidos de la peña: asistencia, equipos, pagos y resultados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
