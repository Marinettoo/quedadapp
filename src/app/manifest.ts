import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quedadapp",
    short_name: "Quedadapp",
    description: "Organiza los partidos de la peña: asistencia, equipos, pagos y resultados.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b8ff65",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
