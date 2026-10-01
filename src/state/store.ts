import { create } from "zustand";
import { createSession, TaskError } from "../domain/engine";
import { getTasks } from "../domain/tasks";
import { repository } from "../storage/repository";
import {
  playOutcome,
  primeOutcomeAudio,
  stopOutcomeAudio,
} from "../audio/outcome";
import type {
  ChoiceCommand,
  DeckId,
  Interruption,
  Language,
  Participant,
  Session,
  SessionRecord,
  TaskDefinition,
  Theme,
} from "../domain/types";
export type Screen =
  | "home"
  | "instructions"
  | "play"
  | "complete"
  | "report"
  | "library"
  | "break";
const CURRENT_SESSION_KEY = "gambal-current-session";
const RECOVERY_RETRY_MS = 16_000;

function currentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

function rememberSession(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_SESSION_KEY, id);
    else localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch {
    /* IndexedDB remains the source of truth for session data. */
  }
}

let recoveryTimer: ReturnType<typeof setTimeout> | undefined;
let recoverySessionId: string | null = null;
function clearRecoveryTimer() {
  clearTimeout(recoveryTimer);
  recoveryTimer = undefined;
  recoverySessionId = null;
}

function requestPersistentStorage() {
  try {
    const request = navigator.storage?.persist?.();
    if (request) void request.catch(() => {});
  } catch {
    /* Storage persistence is a browser hint, not a start requirement. */
  }
}

interface State {
  initialized: boolean;
  screen: Screen;
  tasks: TaskDefinition[];
  sessions: Session[];
  record: SessionRecord | null;
  language: Language;
  theme: Theme;
  soundMuted: boolean;
  taskId: string;
  mode: "self" | "research";
  participant: Participant;
  busy: boolean;
  feedback: boolean;
  paused: boolean;
  error: string | null;
  pending: ChoiceCommand | null;
  interrupted: boolean;
  init: () => Promise<void>;
  preference: (language: Language, theme: Theme) => void;
  toggleSound: () => void;
  navigate: (screen: Screen) => Promise<void>;
  configure: (
    update: Partial<Pick<State, "taskId" | "mode" | "participant">>,
  ) => void;
  start: () => Promise<void>;
  open: (id: string, resume?: boolean) => Promise<void>;
  choose: (deck: DeckId) => Promise<void>;
  retry: () => Promise<void>;
  pause: (type: Interruption["type"]) => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  nextStage: () => Promise<void>;
  refresh: () => Promise<void>;
}
export const owner = crypto.randomUUID();
let readyAt = performance.now(),
  feedbackTimer: ReturnType<typeof setTimeout> | undefined;
const code = () => `G-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const errorCode = (e: unknown) => (e instanceof TaskError ? e.code : "storage");
function prefs(): {
  language: Language;
  theme: Theme;
  soundMuted: boolean;
} {
  try {
    const p = JSON.parse(localStorage.getItem("gambal-preferences") || "{}");
    return {
      language: p.language === "en" ? "en" : "tr",
      theme: p.theme === "dark" ? "dark" : "light",
      soundMuted: p.soundMuted === true,
    };
  } catch {
    return { language: "tr", theme: "light", soundMuted: false };
  }
}
export const useApp = create<State>((set, get) => ({
  initialized: false,
  screen: "home",
  tasks: [],
  sessions: [],
  record: null,
  ...prefs(),
  taskId: "gambal-legacy-v1",
  mode: "self",
  participant: { code: code() },
  busy: false,
  feedback: false,
  paused: false,
  error: null,
  pending: null,
  interrupted: false,
  init: async () => {
    try {
      set({ tasks: await getTasks() });
      await get().refresh();
      const sessions = get().sessions;
      const rememberedId = currentSessionId();
      let session = rememberedId
        ? sessions.find((item) => item.id === rememberedId)
        : undefined;
      if (rememberedId && !session) rememberSession(null);
      session ??= sessions.find(
        (item) => item.status === "active" || item.status === "break",
      );
      if (session) {
        rememberSession(session.id);
        await get().open(
          session.id,
          session.status === "active" || session.status === "break",
        );
      }
    } catch (e) {
      set({ error: errorCode(e) });
    } finally {
      set({ initialized: true });
    }
  },
  preference: (language, theme) => {
    set({ language, theme });
    try {
      localStorage.setItem(
        "gambal-preferences",
        JSON.stringify({ language, theme, soundMuted: get().soundMuted }),
      );
    } catch {
      /* Session persistence does not depend on preferences. */
    }
  },
  toggleSound: () => {
    const soundMuted = !get().soundMuted;
    set({ soundMuted });
    try {
      const { language, theme } = get();
      localStorage.setItem(
        "gambal-preferences",
        JSON.stringify({ language, theme, soundMuted }),
      );
    } catch {
      /* Sound control remains available if preference storage is unavailable. */
    }
    if (soundMuted) stopOutcomeAudio();
    else primeOutcomeAudio();
  },
  configure: (update) => set(update),
  refresh: async () => {
    set({ sessions: await repository.list() });
  },
  navigate: async (screen) => {
    const s = get();
    if (s.busy || s.pending) return;
    if (s.record && (s.screen === "play" || s.screen === "break")) return;
    if (s.record)
      await repository.release(s.record.session.id, owner).catch(() => {});
    clearRecoveryTimer();
    rememberSession(
      screen === "report" && s.record ? s.record.session.id : null,
    );
    set({
      screen,
      error: null,
      record: screen === "report" ? s.record : null,
      participant: screen === "home" ? { code: code() } : s.participant,
    });
    await get()
      .refresh()
      .catch((e) => set({ error: errorCode(e) }));
  },
  start: async () => {
    if (get().busy) return;
    requestPersistentStorage();
    clearRecoveryTimer();
    set({ busy: true, error: null });
    try {
      const s = get(),
        task = s.tasks.find((t) => t.id === s.taskId);
      if (!task) throw new TaskError("unavailable");
      const session = createSession(
        task,
        s.participant,
        s.mode,
        s.language,
        s.theme,
      );
      await repository.create(session);
      if (!(await repository.claim(session.id, owner)))
        throw new TaskError("locked");
      rememberSession(session.id);
      readyAt = performance.now();
      set({
        record: { session, trials: [], interruptions: [] },
        screen: "play",
        paused: false,
        feedback: false,
        pending: null,
        interrupted: false,
      });
    } catch (e) {
      set({ error: errorCode(e) });
    } finally {
      set({ busy: false });
    }
  },
  open: async (id, resume = false) => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      const record = await repository.get(id);
      rememberSession(id);
      if (
        resume &&
        (record.session.status === "active" ||
          record.session.status === "break")
      ) {
        if (!(await repository.claim(id, owner))) throw new TaskError("locked");
        clearRecoveryTimer();
        const event = await repository.interrupt(id, owner, "recovery");
        record.interruptions.push(event);
        set({
          record,
          screen: record.session.status === "break" ? "break" : "play",
          paused: true,
          interrupted: true,
          feedback: false,
          pending: null,
        });
      } else {
        clearRecoveryTimer();
        set({
          record,
          screen:
            record.session.mode === "research" &&
            record.session.status === "completed"
              ? "complete"
              : "report",
          paused: false,
          pending: null,
        });
      }
    } catch (e) {
      const error = errorCode(e);
      set({ error });
      if (resume && error === "locked") scheduleRecoveryRetry(id);
    } finally {
      set({ busy: false });
    }
  },
  choose: async (deck) => {
    const s = get();
    if (
      !s.record ||
      s.busy ||
      s.feedback ||
      s.paused ||
      s.error ||
      s.screen !== "play" ||
      s.record.session.status !== "active"
    )
      return;
    if (!s.soundMuted) primeOutcomeAudio();
    const command: ChoiceCommand = {
      id: crypto.randomUUID(),
      deck,
      selectedAt: new Date().toISOString(),
      responseTimeMs: s.interrupted
        ? null
        : Math.max(0, Math.round(performance.now() - readyAt)),
      afterInterruption: s.interrupted,
    };
    set({ pending: command });
    await get().retry();
  },
  retry: async () => {
    const s = get();
    if (s.busy) return;
    if (!s.pending) {
      set({ error: null });
      await get().resume();
      return;
    }
    if (!s.record) return;
    set({ busy: true, error: null });
    try {
      if (!(await repository.claim(s.record.session.id, owner)))
        throw new TaskError("locked");
      const result = await repository.commit(
        s.record.session.id,
        owner,
        s.record.session.revision,
        s.pending,
      );
      const current = get().record!;
      const alreadyRecorded = current.trials.some(
        (t) => t.id === result.trial.id,
      );
      const trials = alreadyRecorded
        ? current.trials
        : [...current.trials, result.trial];
      set({
        record: { ...current, session: result.session, trials },
        pending: null,
        feedback: true,
        interrupted: false,
      });
      if (!alreadyRecorded && !get().soundMuted)
        playOutcome(result.trial.gain - result.trial.loss);
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => {
        readyAt = performance.now();
        const r = get().record;
        if (!r) return;
        set({
          feedback: false,
          screen:
            r.session.status === "completed"
              ? "complete"
              : r.session.status === "break"
                ? "break"
                : "play",
        });
        if (r.session.status === "completed")
          void repository.release(r.session.id, owner);
      }, result.session.task.procedure.feedbackMs ?? result.session.task.presentation.feedbackMs);
    } catch (e) {
      set({ error: errorCode(e), paused: true, interrupted: true });
      if (s.record)
        await repository
          .interrupt(s.record.session.id, owner, "storage-error")
          .then((event) =>
            set((state) => ({
              record: state.record
                ? {
                    ...state.record,
                    interruptions: [...state.record.interruptions, event],
                  }
                : null,
            })),
          )
          .catch(() => {});
    } finally {
      set({ busy: false });
    }
  },
  pause: async (type) => {
    const s = get();
    if (
      !s.record ||
      !["play", "break"].includes(s.screen) ||
      s.record.session.status === "completed"
    )
      return;
    set({ paused: true, interrupted: true });
    try {
      const event = await repository.interrupt(
        s.record.session.id,
        owner,
        type,
      );
      set((state) => ({
        record: state.record
          ? {
              ...state.record,
              interruptions: [...state.record.interruptions, event],
            }
          : null,
      }));
    } catch (e) {
      set({ error: errorCode(e) });
    }
  },
  resume: async () => {
    const s = get();
    if (!s.record || s.pending || s.busy) return;
    set({ busy: true, error: null });
    try {
      if (!(await repository.claim(s.record.session.id, owner)))
        throw new TaskError("locked");
      const record = await repository.get(s.record.session.id);
      readyAt = performance.now();
      set({
        record,
        paused: false,
        interrupted: true,
        screen:
          record.session.status === "completed"
            ? "complete"
            : record.session.status === "stopped"
              ? "report"
              : record.session.status === "break"
                ? "break"
                : "play",
      });
    } catch (e) {
      set({ error: errorCode(e), paused: true });
    } finally {
      set({ busy: false });
    }
  },
  stop: async () => {
    const s = get();
    if (!s.record || s.busy || s.pending || s.feedback) return;
    set({ busy: true, error: null });
    try {
      const session = await repository.stop(s.record.session.id, owner);
      await repository.release(session.id, owner);
      set({
        record: { ...s.record, session },
        screen: "complete",
        paused: false,
      });
    } catch (e) {
      set({ error: errorCode(e) });
    } finally {
      set({ busy: false });
    }
  },
  nextStage: async () => {
    const s = get();
    if (!s.record || s.busy || s.paused) return;
    set({ busy: true, error: null });
    try {
      const session = await repository.nextStage(s.record.session.id, owner);
      readyAt = performance.now();
      set({
        record: { ...s.record, session },
        screen: "play",
        paused: false,
        interrupted: false,
      });
    } catch (e) {
      set({ error: errorCode(e) });
    } finally {
      set({ busy: false });
    }
  },
}));
export function startLifecycle() {
  const visibility = () => {
    const s = useApp.getState();
    if (document.hidden) void s.pause("hidden");
    else if (s.paused) void s.pause("visible");
  };
  const pagehide = () => {
    const s = useApp.getState();
    if (s.record)
      void repository.release(s.record.session.id, owner).catch(() => {});
  };
  const heartbeat = setInterval(() => {
    const s = useApp.getState();
    if (!s.record || !["play", "break"].includes(s.screen)) return;
    void repository
      .renew(s.record.session.id, owner)
      .then((ok) => {
        if (!ok) {
          void repository
            .claim(s.record!.session.id, owner)
            .then(async (claimed) => {
              if (!claimed) {
                useApp.setState({
                  paused: true,
                  error: "locked",
                  interrupted: true,
                });
                return;
              }
              const record = await repository.get(s.record!.session.id);
              const event = await repository.interrupt(
                record.session.id,
                owner,
                "lease-lost",
              );
              record.interruptions.push(event);
              useApp.setState({
                record,
                paused: true,
                error: null,
                interrupted: true,
              });
            })
            .catch(() =>
              useApp.setState({
                paused: true,
                error: "storage",
                interrupted: true,
              }),
            );
        }
      })
      .catch(() =>
        useApp.setState({ paused: true, error: "storage", interrupted: true }),
      );
  }, 5000);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", pagehide);
  return () => {
    clearInterval(heartbeat);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", pagehide);
  };
}

function scheduleRecoveryRetry(id: string) {
  clearRecoveryTimer();
  recoverySessionId = id;
  recoveryTimer = setTimeout(() => {
    recoveryTimer = undefined;
    const s = useApp.getState();
    if (
      recoverySessionId === id &&
      s.initialized &&
      s.screen === "home" &&
      !s.record &&
      s.error === "locked"
    ) {
      recoverySessionId = null;
      void s.open(id, true);
    } else recoverySessionId = null;
  }, RECOVERY_RETRY_MS);
}
