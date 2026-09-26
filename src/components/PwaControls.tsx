import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import type { Copy } from "../i18n";
import "./PwaControls.css";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

type SafariNavigator = Navigator & { standalone?: boolean };

function isStandalone() {
  if (typeof window === "undefined") return false;

  const safariNavigator = navigator as SafariNavigator;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    safariNavigator.standalone === true
  );
}

function installInstructions(t: Copy) {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMacSafari =
    (platform === "MacIntel" || /Macintosh/i.test(userAgent)) &&
    /Safari/i.test(userAgent) &&
    !/(Chrome|Chromium|CriOS|Edg)/i.test(userAgent);

  if (isAppleMobile) return t.installIos;
  if (isMacSafari) return t.installSafari;
  return t.installBrowser;
}

export function PwaControls({ t, blocked }: { t: Copy; blocked: boolean }) {
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showHelp, setShowHelp] = useState(false);
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
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const syncInstalledState = () => setInstalled(isStandalone());
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
      setShowHelp(false);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstall(null);
      setShowHelp(false);
    };

    displayMode.addEventListener("change", syncInstalledState);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      displayMode.removeEventListener("change", syncInstalledState);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (blocked) return null;

  const handleInstall = () => {
    if (!install) {
      setShowHelp((open) => !open);
      return;
    }

    setShowHelp(false);
    void (async () => {
      try {
        await install.prompt();
        const choice = await install.userChoice;
        if (choice.outcome !== "accepted") setShowHelp(true);
      } catch {
        setShowHelp(true);
      } finally {
        setInstall(null);
      }
    })();
  };

  return (
    <div className="pwa-controls">
      {!installed && (
        <>
          <button
            type="button"
            aria-expanded={showHelp && !install}
            aria-controls="pwa-install-instructions"
            onClick={handleInstall}
          >
            {t.install}
          </button>
          <div
            id="pwa-install-instructions"
            className="pwa-install-help"
            role="status"
            hidden={!showHelp || !!install}
          >
            {installInstructions(t)}
          </div>
        </>
      )}
      {needRefresh && (
        <button
          type="button"
          aria-label={t.updateReady}
          onClick={() => void updateServiceWorker(true)}
        >
          {t.update}
        </button>
      )}
    </div>
  );
}
