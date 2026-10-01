import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import fixture from "./fixtures/g-a866be62.json";
import { useApp } from "../src/state/store";
import type { SessionRecord } from "../src/domain/types";
import { Report } from "../src/screens/Report";
import { download } from "../src/storage/backup";
vi.mock("../src/storage/backup", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/storage/backup")>()),
  download: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  useApp.setState({
    record: structuredClone(fixture) as SessionRecord,
    language: "en",
    screen: "report",
  });
});
afterEach(cleanup);

it("renders the source report with separate pair scales, a choice raster, and correct disclosure names", () => {
  render(<Report />);
  expect(screen.getByRole("heading", { name: "Results" })).toBeVisible();
  expect(screen.getByText("76%")).toBeVisible();
  expect(screen.getByText("A 41.7%")).toBeVisible();
  expect(screen.getByText("C 73.7%")).toBeVisible();
  expect(
    screen.getByText("Block details", { selector: "summary" }),
  ).toBeVisible();
  expect(screen.getAllByText("Session details")).toHaveLength(1);
  expect(document.querySelectorAll(".raster-cell")).toHaveLength(100);
  expect(screen.getByText("Record checks agree")).toBeVisible();
});
it("localizes every section in Turkish", () => {
  useApp.setState({ language: "tr" });
  render(<Report />);
  expect(screen.getByRole("heading", { name: "Seçim profili" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Öğrenme seyri" })).toBeVisible();
  expect(screen.getByText("C %73,7")).toBeVisible();
  expect(
    screen.getByText("Blok ayrıntıları", { selector: "summary" }),
  ).toBeVisible();
  expect(screen.getAllByText("Oturum bilgileri")).toHaveLength(1);
});
it("shows exact outcome details when the chart control selects a trial", () => {
  render(<Report />);
  const punishment = fixture.trials.find(
    (row) => row.deck === "B" && row.loss === 1250,
  )!;
  fireEvent.change(screen.getByRole("slider"), {
    target: { value: punishment.sequence },
  });
  const reading = document.querySelector(".chart-reading") as HTMLElement;
  expect(within(reading).getByText("B")).toBeVisible();
  expect(within(reading).getByText("$1,250")).toBeVisible();
  expect(screen.getByRole("slider")).toHaveValue(String(punishment.sequence));
});
it("keeps raw exports separate from the versioned derived analysis", () => {
  render(<Report />);
  fireEvent.click(screen.getByRole("button", { name: "Analysis · JSON" }));
  const derived = JSON.parse(vi.mocked(download).mock.calls[0][0]);
  expect(derived.format).toBe("gambal-analysis");
  expect(derived.analysis.core.netScore).toBe(52);
  expect(derived.analysis.parameters.fastThresholdMs).toBe(150);
  fireEvent.click(screen.getByRole("button", { name: "Session · JSON" }));
  const raw = JSON.parse(vi.mocked(download).mock.calls[1][0]);
  expect(raw.format).toBe("gambal-backup");
  expect(raw.records[0]).toEqual(fixture);
  expect(raw.records[0]).not.toHaveProperty("analysis");
  fireEvent.click(screen.getByRole("button", { name: "Choices · CSV" }));
  expect(vi.mocked(download).mock.calls[2][0].split("\r\n")).toHaveLength(101);
});
it("opens research details for print and restores each prior disclosure state", () => {
  render(<Report />);
  const details = Array.from(document.querySelectorAll("details"));
  details[0].open = true;
  const states = details.map((d) => d.open);
  fireEvent(window, new Event("beforeprint"));
  fireEvent(window, new Event("beforeprint"));
  expect(details.every((d) => d.open)).toBe(true);
  fireEvent(window, new Event("afterprint"));
  expect(details.map((d) => d.open)).toEqual(states);
});
