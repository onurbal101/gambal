import { lazy, Suspense, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useApp, startLifecycle } from "./state/store";
import { text, errorText } from "./i18n";
import { Home, Instructions } from "./screens/Home";
import { Play, Completion, StageBreak } from "./screens/Play";
import { Library } from "./screens/Library";
import { PwaControls } from "./components/PwaControls";
const Report = lazy(() =>
  import("./screens/Report").then((module) => ({ default: module.Report })),
);
export default function App() {
  const s = useApp(),
    inTask = ["play", "break", "complete"].includes(s.screen),
    playing = ["play", "break"].includes(s.screen),
    saving = s.busy || !!s.pending;
  const language = inTask && s.record ? s.record.session.language : s.language,
    theme = inTask && s.record ? s.record.session.theme : s.theme,
    t = text(language);
  useEffect(() => {
    void useApp.getState().init();
    return startLifecycle();
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#fafaf7" : "#191b20");
  }, [language, theme]);
  useEffect(() => {
    if (!playing || !saving) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [playing, saving]);
  return (
    <div id="gb" className={playing ? "app playing" : "app"}>
      <header>
        <button
          className="brand"
          disabled={!s.initialized || playing || s.busy}
          onClick={() => void s.navigate("home")}
          aria-label="gambal"
        >
          <span className="mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          gambal
        </button>
        <nav aria-label="gambal">
          {!inTask && s.initialized && (
            <>
              <button onClick={() => void s.navigate("library")}>
                {t.sessions}
              </button>
              <button
                onClick={() =>
                  s.preference(language === "tr" ? "en" : "tr", theme)
                }
                aria-label={language === "tr" ? "English" : "Türkçe"}
              >
                {language === "tr" ? "EN" : "TR"}
              </button>
              <button
                className="theme-toggle"
                aria-label={`${t.theme}: ${theme === "light" ? t.dark : t.light}`}
                onClick={() =>
                  s.preference(language, theme === "light" ? "dark" : "light")
                }
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </>
          )}
          <PwaControls
            t={t}
            blocked={!s.initialized || inTask || s.busy || !!s.pending}
          />
        </nav>
      </header>
      {s.error && (
        <div className="error-banner" role="alert">
          <p>{errorText(s.error, t)}</p>
          {s.record && playing ? (
            <button
              onClick={() =>
                void (!s.pending &&
                (s.error === "locked" || s.error === "conflict")
                  ? s.open(s.record!.session.id, true)
                  : s.retry())
              }
              disabled={s.busy}
            >
              {t.retry}
            </button>
          ) : (
            <button
              onClick={() => {
                useApp.setState({ error: null });
                void s.init();
              }}
            >
              {t.retry}
            </button>
          )}
        </div>
      )}
      <main id="main">
        {!s.initialized ? (
          <p className="startup" role="status">
            {t.loadingSession}
          </p>
        ) : s.screen === "home" ? (
          <Home />
        ) : s.screen === "instructions" ? (
          <Instructions />
        ) : s.screen === "library" ? (
          <Library />
        ) : s.record ? (
          s.screen === "play" ? (
            <Play />
          ) : s.screen === "complete" ? (
            <Completion />
          ) : s.screen === "break" ? (
            <StageBreak />
          ) : (
            <Suspense fallback={<p role="status">{t.loadingSession}</p>}>
              <Report />
            </Suspense>
          )
        ) : null}
      </main>
    </div>
  );
}
