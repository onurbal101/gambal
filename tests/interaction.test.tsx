import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useApp, owner } from "../src/state/store";
import { repository } from "../src/storage/repository";
import { createSession } from "../src/domain/engine";
import { getTasks } from "../src/domain/tasks";
import { Play } from "../src/screens/Play";
let sessionId = "";
beforeEach(async () => {
  const s = createSession(
    (await getTasks())[0],
    { code: "TEST" },
    "self",
    "en",
    "light",
  );
  sessionId = s.id;
  await repository.create(s);
  await repository.claim(s.id, owner);
  useApp.setState({
    record: { session: s, trials: [], interruptions: [] },
    screen: "play",
    busy: false,
    feedback: false,
    paused: false,
    error: null,
    pending: null,
    interrupted: false,
  });
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  await repository.release(sessionId, owner);
  await repository.remove(sessionId);
});
describe("input and recovery", () => {
  it("rejects concurrent taps and unlocks only after 900 ms", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await Promise.all([
      useApp.getState().choose("A"),
      useApp.getState().choose("B"),
    ]);
    expect(useApp.getState().record?.trials).toHaveLength(1);
    expect(useApp.getState().feedback).toBe(true);
    await vi.advanceTimersByTimeAsync(899);
    expect(useApp.getState().feedback).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(useApp.getState().feedback).toBe(false);
  });
  it("retains the exact failed command for retry", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const original = repository.commit.bind(repository);
    const spy = vi
      .spyOn(repository, "commit")
      .mockRejectedValueOnce(new Error("disk full"))
      .mockImplementation(original);
    await useApp.getState().choose("A");
    const id = useApp.getState().pending?.id;
    expect(id).toBeTruthy();
    expect(useApp.getState().record?.trials).toHaveLength(0);
    expect(useApp.getState().paused).toBe(true);
    await useApp.getState().retry();
    expect(spy.mock.calls[1][3].id).toBe(id);
    expect(useApp.getState().record?.trials[0].id).toBe(id);
    await vi.advanceTimersByTimeAsync(900);
  });
  it("marks the first response after recovery separately", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await useApp.getState().pause("hidden");
    await useApp.getState().resume();
    await useApp.getState().choose("C");
    const trial = useApp.getState().record?.trials[0];
    expect(trial?.afterInterruption).toBe(true);
    expect(trial?.responseTimeMs).toBeNull();
    expect(useApp.getState().record?.interruptions[0].type).toBe("hidden");
    await vi.advanceTimersByTimeAsync(900);
  });
  it("shows separate gain and loss and disables keyboard activation during feedback", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    render(<Play />);
    await act(async () => {
      const settled = new Promise<void>((resolve) => {
        const unsubscribe = useApp.subscribe((state) => {
          if (!state.busy && state.feedback) {
            unsubscribe();
            resolve();
          }
        });
      });
      fireEvent.click(screen.getByRole("button", { name: "Deck A" }));
      await settled;
    });
    expect(screen.getByText("+$100")).toBeVisible();
    expect(screen.getByText("$0")).toBeVisible();
    expect(screen.getByRole("button", { name: "Deck A" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("button", { name: "Deck A" }), {
      key: "Enter",
      repeat: true,
    });
    expect(useApp.getState().record?.trials).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(900));
    expect(screen.getByRole("button", { name: "Deck A" })).toBeEnabled();
  });
});
