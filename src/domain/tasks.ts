import legacy from "../data/legacy.json";
import type { DeckSchedule, TaskDefinition } from "./types";
const source =
  "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00220/full";
const instructions = {
  tr: "$2000 ile başlarsınız. Her seçimde dört desteden bir kart alın. Kartlar para kazandırır; bazı kartlar aynı zamanda para kaybettirir. Amacınız bakiyenizi artırmaktır. Bitiş ekranını görene kadar devam edin.",
  en: "You start with $2000. Select a card from one of the four decks each time. Cards give you money; some cards also take money away. Your aim is to increase your balance. Keep playing until the end screen appears.",
};
export async function checksum(decks: DeckSchedule): Promise<string> {
  const bytes = new TextEncoder().encode(
    JSON.stringify(
      ["A", "B", "C", "D"].map((d) =>
        decks[d as keyof DeckSchedule].map((c) => [c.gain, c.loss]),
      ),
    ),
  );
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
}
const base: TaskDefinition = {
  id: "gambal-legacy-v1",
  revision: 1,
  title: { tr: "gambal · Eski sürüm", en: "gambal · Legacy" },
  verification: "legacy-preserved",
  sources: ["gambal/src/new_iowa/src/decks/deck_{a,b,c,d}.csv"],
  decks: legacy,
  deckChecksum: null,
  procedure: {
    startingBalance: 2000,
    trialsPerStage: 100,
    stages: 1,
    exhaustion: "disable",
    resetBetweenStages: true,
    breakMs: 0,
  },
  presentation: { id: "puzzle-v1", feedbackMs: 900 },
  instructions,
};
export async function getTasks(): Promise<TaskDefinition[]> {
  const ready = {
    ...structuredClone(base),
    deckChecksum: await checksum(base.decks),
  };
  return [
    ready,
    ...[
      {
        id: "igt-original-1994",
        title: { tr: "IGT · Özgün", en: "IGT · Original" },
        reason: {
          tr: "Tam protokol doğrulanmalı",
          en: "Full protocol needs verification",
        },
      },
      {
        id: "igt-clinical-2007",
        title: { tr: "IGT · Klinik", en: "IGT · Clinical" },
        reason: {
          tr: "Kesin ödül sırası gerekli",
          en: "Exact reward order required",
        },
      },
      {
        id: "igt-clinical-three-stage-2013",
        title: { tr: "IGT · Üç aşama", en: "IGT · Three stages" },
        reason: { tr: "Kesin protokol gerekli", en: "Exact protocol required" },
      },
    ].map((entry, i): TaskDefinition => ({
      ...structuredClone(base),
      ...entry,
      verification: "unavailable",
      decks: { A: [], B: [], C: [], D: [] },
      deckChecksum: null,
      sources: [source],
      procedure: { ...base.procedure, stages: i === 2 ? 3 : 1 },
    })),
  ];
}
