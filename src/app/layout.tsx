import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { RegistroServiceWorker } from "@/components/RegistroServiceWorker";
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
  title: "Quedadapp",
  description: "Organiza los partidos de la peña: asistencia, equipos, pagos y resultados.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quedadapp",
  },
};

export const viewport: Viewport = {
  themeColor: "#b8ff65",
};

const SCRIPT_TEMA = `
  try {
    var t = localStorage.getItem("tema");
    if (t === "dark" || t === "light") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={dmSans.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <RegistroServiceWorker />
        {children}
      </body>
    </html>
  );
}
