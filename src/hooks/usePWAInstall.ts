import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let cachedPromptEvent: BeforeInstallPromptEvent | null = null;

const isStandalone = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

const isIOSDevice = () => {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(cachedPromptEvent);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const handler = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      cachedPromptEvent = installEvent;
      setPromptEvent(installEvent);
      console.log("PWA pronto para instalação");
    };

    const onInstalled = () => {
      cachedPromptEvent = null;
      setPromptEvent(null);
      setInstalled(true);
      console.log("PWA instalado com sucesso");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isIOS = useMemo(() => isIOSDevice(), []);
  const canInstall = !installed && !!promptEvent;

  const install = async () => {
    if (isIOS) {
      window.alert("Para instalar: toque em compartilhar e depois ‘Adicionar à tela inicial’");
      return;
    }

    if (!promptEvent) {
      window.alert("Use o menu do navegador para instalar o app");
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice;
    cachedPromptEvent = null;
    setPromptEvent(null);
  };

  return {
    canInstall,
    install,
    isIOS,
    isInstalled: installed,
  };
}
