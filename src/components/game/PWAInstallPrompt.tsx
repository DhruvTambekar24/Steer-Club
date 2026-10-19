"use client";

import { useEffect, useState } from "react";

type InstallChoice = { outcome: "accepted" | "dismissed" };
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<InstallChoice> };

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => setNotice("Offline notes are not available in this browser yet."));
    }
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setNotice("The note is on your home screen.");
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setNotice(choice.outcome === "accepted" ? "The note is on its way to your home screen." : "No rush. You can add it later from the browser menu.");
    setInstallEvent(null);
  }

  if (installed) return <p className="pwa-install-confirm" role="status">{notice || "The note is on your home screen."}</p>;
  if (installEvent) return <button className="pwa-install-button" type="button" onClick={() => void install()}>Keep this note on your home screen <span aria-hidden="true">↗</span></button>;
  return (
    <details className="pwa-install-details">
      <summary>Keep this note close</summary>
      <p>Use your browser’s “Add to Home Screen” option. The question notes can be read offline after one visit; sharing and server saves need a connection.</p>
      {notice && <span role="status">{notice}</span>}
    </details>
  );
}
