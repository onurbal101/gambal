import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useApp, startLifecycle } from "./state/store";
import { text, errorText } from "./i18n";
import { Home, Instructions } from "./screens/Home";
import { Play, Completion, StageBreak } from "./screens/Play";
import { Report } from "./screens/Report";
import { Library } from "./screens/Library";
import { PwaControls } from "./components/PwaControls";
export default function App() {
  const s = useApp(),
    inTask = ["play", "break", "complete"].includes(s.screen),
    playing = ["play", "break"].includes(s.screen);
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
    if (!playing) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [playing]);
  return (
    <div id="gb" className={playing ? "app playing" : "app"}>
      <header>
        <button
          className="brand"
          disabled={playing || s.busy}
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
          {!inTask && (
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
          <PwaControls t={t} blocked={inTask || s.busy || !!s.pending} />
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
        {s.screen === "home" ? (
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
            <Report />
          )
        ) : null}
      </main>
    </div>
  );
}
