"use client";

import { useEffect, useState } from "react";
import { guardarSuscripcion, quitarSuscripcion } from "./actions";
import styles from "./page.module.css";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Seguro = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64Seguro);
  return Uint8Array.from([...binario].map((c) => c.charCodeAt(0)));
}

type Estado = "comprobando" | "no-soportado" | "sin-activar" | "activado" | "denegado";

export function ActivarPush({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [estado, setEstado] = useState<Estado>("comprobando");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function comprobar() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
        setEstado("no-soportado");
        return;
      }
      if (Notification.permission === "denied") {
        setEstado("denegado");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      setEstado(suscripcion ? "activado" : "sin-activar");
    }
    comprobar().catch(() => setEstado("no-soportado"));
  }, [vapidPublicKey]);

  async function activar() {
    if (!vapidPublicKey) return;
    setProcesando(true);
    setError(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado("denegado");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = suscripcion.toJSON();
      const formData = new FormData();
      formData.append("endpoint", json.endpoint ?? "");
      formData.append("p256dh", json.keys?.p256dh ?? "");
      formData.append("auth", json.keys?.auth ?? "");
      await guardarSuscripcion(formData);
      setEstado("activado");
    } catch {
      setError("No se pudo activar. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  async function desactivar() {
    setProcesando(true);
    setError(null);
    try {
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) {
        const formData = new FormData();
        formData.append("endpoint", suscripcion.endpoint);
        await quitarSuscripcion(formData);
        await suscripcion.unsubscribe();
      }
      setEstado("sin-activar");
    } catch {
      setError("No se pudo desactivar. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  if (estado === "comprobando") return null;

  if (estado === "no-soportado") {
    return <p className={styles.avisoPush}>Este dispositivo no admite notificaciones push.</p>;
  }

  if (estado === "denegado") {
    return (
      <p className={styles.avisoPush}>
        Has bloqueado las notificaciones para esta app. Actívalas desde los ajustes del
        navegador si cambias de idea.
      </p>
    );
  }

  return (
    <div className={styles.avisoPush}>
      {estado === "activado" ? (
        <>
          <span>Avisos activados en este dispositivo.</span>
          <button type="button" onClick={desactivar} disabled={procesando} className={styles.pushBoton}>
            {procesando ? "Desactivando…" : "Desactivar"}
          </button>
        </>
      ) : (
        <>
          <span>Recibe un aviso en el móvil cuando pase algo nuevo.</span>
          <button type="button" onClick={activar} disabled={procesando} className={styles.pushBoton}>
            {procesando ? "Activando…" : "Activar notificaciones"}
          </button>
        </>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
