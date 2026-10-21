import styles from "./AyudaContenido.module.css";

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 14l2.3 2.3L16 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoEquipo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 14.8c2.5.2 4.5 2.2 4.5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconoPago() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14.8 9.3a3 3 0 0 0-2.6-1.3c-1.9 0-3.2 1.7-3.2 4s1.3 4 3.2 4a3 3 0 0 0 2.6-1.3M8.3 11h4.4M8.3 13.3h4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoEstrella() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.8l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.7L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoHistorial() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <circle cx="12" cy="12.5" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconoVotacion() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <path d="M12 3v11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 20h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M4 9.5 7.5 3l3.5 6.5a3.5 3.5 0 0 1-7 0ZM13 9.5 16.5 3 20 9.5a3.5 3.5 0 0 1-7 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoApuesta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 15.5 15.5 8.5M9 9h.01M15 15h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconoCampana() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <path
        d="M18 16v-5a6 6 0 1 0-12 0v5l-1.8 2.4c-.3.4 0 1 .5 1h14.6c.5 0 .8-.6.5-1L18 16Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const PASOS = [
  {
    Icono: IconoCalendario,
    titulo: "Apúntate a los partidos",
    texto: "Mira la fecha y el sitio en el panel, y pulsa \"Apuntarme\" si vas a jugar.",
  },
  {
    Icono: IconoVotacion,
    titulo: "Vota la fecha del próximo partido",
    texto: "Un administrador puede abrir una votación con varias fechas; elige la que mejor te venga.",
  },
  {
    Icono: IconoEquipo,
    titulo: "Los equipos se reparten solos",
    texto: "En la pestaña \"Equipos\" se generan intentando igualar el nivel, según tus estrellas.",
  },
  {
    Icono: IconoPago,
    titulo: "Indica cuándo has pagado",
    texto: "Marca \"He pagado\" tu parte del campo. El encargado de la reserva lo confirma después.",
  },
  {
    Icono: IconoEstrella,
    titulo: "Valora a tus compañeros",
    texto: "Pon de 1 a 5 estrellas a los demás jugadores. Es anónimo y ayuda a igualar los equipos.",
  },
  {
    Icono: IconoApuesta,
    titulo: "Apuesta por diversión",
    texto: "En la pestaña \"Apuestas\", pronostica victoria, empate o derrota. El resultado se calcula con los goles del partido, y 0.20 € de todos va al bote.",
  },
  {
    Icono: IconoCampana,
    titulo: "Activa las notificaciones",
    texto: "Desde la campanita, recibe un aviso cuando haya partido, votación o novedades de la peña.",
  },
  {
    Icono: IconoHistorial,
    titulo: "Consulta historial y estadísticas",
    texto: "Revisa resultados pasados y quién lleva más goles o asistencias.",
  },
];

export function AyudaContenido() {
  return (
    <ol className={styles.lista}>
      {PASOS.map(({ Icono, titulo, texto }) => (
        <li key={titulo} className={styles.paso}>
          <Icono />
          <div>
            <p className={styles.pasoTitulo}>{titulo}</p>
            <p className={styles.pasoTexto}>{texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
