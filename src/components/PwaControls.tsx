import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import type { Copy } from "../i18n";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function PwaControls({ t, blocked }: { t: Copy; blocked: boolean }) {
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        const update = () => {
          if (document.visibilityState === "visible")
            void registration.update().catch(() => {});
        };
        window.addEventListener("online", update);
      }
    },
  });
  useEffect(() => {
    const listener = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", listener);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", listener);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  if (blocked) return null;
  return (
    <>
      {install && (
        <button
          onClick={() =>
            void install
              .prompt()
              .then(() => install.userChoice)
              .then((result) => {
                if (result.outcome === "accepted") setInstall(null);
              })
          }
        >
          {t.install}
        </button>
      )}
      {needRefresh && (
        <button
          aria-label={t.updateReady}
          onClick={() => void updateServiceWorker(true)}
        >
          {t.update}
        </button>
      )}
    </>
  );
}
