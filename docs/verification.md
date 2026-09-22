# Verification record

## Build and automated checks

On 21 September 2026:

- Production build and TypeScript checks passed.
- 25 tests passed in three files.
- All 133 files in the saved legacy checksum list are unchanged.

Tests cover all legacy cards, unavailable-version gates, balances, negative balances, net scores, fixed blocks, empty percentages, 100-choice stopping, exhaustion, feedback timing, rapid duplicate input, keyboard repeats, failed-write retry, atomic rollback, competing writers, lease expiry, exact recovery, schema migration, backup round trips, import conflict rollback, tamper rejection, and CSV formula escaping.

The generic stage engine has synthetic reset and timing tests. No published multi-stage task is enabled, so these are not clinical protocol validation.

## Browser evidence

The production build was checked in the Codex in-app browser.

| Check | Result |
| --- | --- |
| Full researcher session | 100 choices, then completion screen before results. |
| Calculation check | 50 A + 50 C: balance 750, gains 9,000, losses 10,250, net score 0. Blocks: −20, −20, 0, 20, 20. |
| Recovery | Closed the active tab and reopened it. The saved balance was 2,050. The next C card gave 60, resulting in 2,110. The recovery event was recorded. |
| Writer lease | Reopening before lease expiry blocked writing; recovery worked after expiry. Concurrent repository tests also passed. |
| Early exit | Completion screen marked the session incomplete. |
| Offline reload | Network disabled through the browser developer interface. The production app reloaded with a fresh setup code. Network settings restored. |
| App update | A new build showed an update control outside play. Applying the update reloaded the app. |
| Responsive play | 390 × 844 viewport: all decks and essential controls visible; document height 844. Desktop checked at 1280 × 720. |
| Languages and themes | English and Turkish flows checked; light and dark play screens inspected. |
| Reduced motion | Browser media emulation removed deck animation. Timing remains controlled by the same tested 900 ms lock. |
| Console | No app errors in the final checked tab. |

The browser tool did not reload an active page with a before-unload handler. Recovery was therefore checked by closing and reopening the tab. Physical phones, native PWA installation, Safari, standalone installed mode, screen-reader output, and storage eviction are not verified. Installation metadata and icons are included, but a native install prompt was not available in this browser. No remote deployment occurred.

QA used explicitly named test sessions in the test origin (`127.0.0.1:4173`). These are browser test records, not seeded application data. The user preview uses `localhost:4173`, a separate clean local origin.

## Design comparison

Reference: the approved [puzzle mock-up](</Users/onurbal101/.codex/visualizations/2026/09/20/01a0beb8-771c-7683-b75c-b4ea1521d9d1/gambal-puzzle.html>). The reference file was not edited.

| Element | Implementation |
| --- | --- |
| Typography and colour | Bundled DM Sans, off-white paper, dark ink, restrained lime accent. |
| Deck geometry | Equal A/B/C/D tiles, black or light outlines, stacked lower edge, same resting weight. |
| Play layout | Centred balance and four-deck row. No settings or results during play. |
| Setup | Short form, compact mode choice, optional details behind disclosure. |
| Outcome feedback | Intentional addition: large, separate signed gain and loss, stable space, tile flip, fixed input lock. |
| Secondary screens | Reports and session records use the same type, borders, spacing, and colour system. |

[Approved reference capture](screenshots/approved-mockup.png), [desktop play](screenshots/play-desktop.png), [phone play with gain and loss](screenshots/play-mobile-dark.png), and [desktop report](screenshots/results-desktop.png).

The phone capture shows the active feedback state. All decks return to equal styling between choices. The desktop play capture predates a small fix that keeps the disabled brand at full opacity. The final phone capture includes that fix.

## Release limits

Only the preserved Gambal Legacy schedule is available. The other three entries are visible but disabled. Their evidence gaps are listed in [protocols.md](protocols.md). No clinical interpretation, diagnosis, percentile, or normative score is supplied.
