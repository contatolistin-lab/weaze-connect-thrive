import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (isInIframe || isPreviewHost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('PWA service worker registrado');
    }).catch((error) => {
      console.error('Falha ao registrar service worker', error);
    });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('PWA EVENTO DISPARADO');
  console.log('✅ Evento PWA disparado! Install disponível.');
  console.log('Plataforma:', navigator.platform);
  console.log('User Agent:', navigator.userAgent);
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalado com sucesso!');
});

createRoot(document.getElementById("root")!).render(<App />);
