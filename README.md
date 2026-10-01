# gambal

Local-first gambling task built with React, TypeScript, Vite, Zustand, and Dexie. All session records stay in this browser. There is no server submission or account system.

## Run

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

For the offline-capable production app:

```sh
npm run build
npm run preview
```

Open the address shown by Vite. A successful first online load caches the app, fonts, icons, manifest, translations, and task definitions. After that, play, reports, and CSV/JSON downloads work offline. Use localhost or HTTPS. Development mode does not test the service worker.

On supported browsers, install gambal from the browser menu. On iPhone or iPad, use Share > Add to Home Screen. In Safari on Mac, use Share > Add to Dock. Offline use starts after the first online load.

```sh
npm test
npm run typecheck
```

## Use

Select the language, theme, task version, and session mode before play. Optional participant and researcher fields are under More details. Researcher mode shows a completion screen before results. The session list contains saved sessions and backup controls. JSON files are complete, versioned backups; CSV files contain the trial log for analysis.

Only **gambal Legacy** is enabled. Original IGT, Clinical IGT, and Three-stage IGT remain unavailable until their full definitions are verified. See [protocol evidence](docs/protocols.md).

Each choice is saved before its outcome is shown. A failed write blocks play. Retry keeps the same choice ID. An expiring database lease permits only one writer for a session. Gambal reopens the last session after a reload or app restart and pauses it before play resumes. If a closed tab leaves its lease behind, Gambal retries when the lease expires. The browser is also asked to preserve Gambal's site data. An interrupted response has a null response time, with the interruption stored separately.

Browser storage is specific to the origin, browser, and profile. Export JSON backups to retain data outside that storage. Import validates and replays each record, skips exact duplicates, and rejects conflicts without replacing existing sessions. Deletion requires confirmation.

## Structure

- `src/domain`: versioned definitions, deterministic engine, and reports.
- `src/storage`: repository interface, Dexie transactions, backup validation, and export.
- `src/state`: interface state, input locks, and lifecycle events.
- `src/screens`: setup, instructions, play, completion, session list, and reports.
- `tests`: calculations, persistence, migration, backup, and input tests.

The old `gambal/` and `iowa_gambling/` folders are reference material. They are unchanged. The new application is at the workspace root.

See [verification and design notes](docs/verification.md) for evidence and remaining browser checks.
