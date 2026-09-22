# Task definitions and evidence

## Enabled: Gambal Legacy v1

This is a preserved Gambal schedule with a new presentation. It is not a claim of equivalence to a published or licensed clinical IGT.

The fixture is copied from `gambal/src/new_iowa/src/decks/deck_{a,b,c,d}.csv`. Each deck has 60 cards. C and D are identical in those files; the new fixture preserves that fact. Tests compare all 240 gain/loss pairs against the original CSV files.

The procedure starts at 2,000, stops at 100 choices, and makes an exhausted deck unavailable. Negative balances do not end play. Each session has an immutable task snapshot, source paths, stable version ID, and a SHA-256 deck checksum. The checksum input is the JSON serialization of the ordered A/B/C/D arrays of `[gain, loss]` pairs.

`puzzle-v1` presents each outcome for a fixed 900 ms input interval. Gain and loss remain separate even when their net result is positive. The last outcome stays visible. The instructions are new Turkish and English text for this preserved schedule. Neither the instructions nor this timing are presented as verified clinical instructions or timing. A verified procedure can override the presentation interval.

## Unavailable definitions

| Definition               | Evidence gap                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original IGT             | Complete original card order and procedure must be verified together, including exhaustion, stopping, borrowing, timing, and instruction wording. |
| Clinical IGT             | The comparison paper supplies loss-order evidence, but not the exact variable reward order.                                                       |
| Three-stage clinical IGT | Requires that exact clinical schedule and a complete verified reset, break, instruction, and stage-transition procedure.                          |

Unavailable entries have no playable cards and a null checksum. The engine rejects starting them. No inferred schedule is substituted. A generic stage engine is present, but only synthetic stage fixtures are tested; no published multi-stage protocol is enabled.

Primary source reviewed: [Lin et al. (2013), discussion of original and clinical IGT versions](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00220/full). Its comparison is useful evidence, but it does not establish every detail needed for a complete task definition.

## Calculations

- Balance = starting balance + gains − losses.
- Net score = (C + D) − (A + B).
- Blocks retain fixed ranges 1–20, 21–40, 41–60, 61–80, and 81–100, including incomplete sessions.
- Halves retain ranges 1–50 and 51–100.
- Empty percentages and rescaled scores are null. An empty net count is zero.
- Rescaled score = 100 × net score / recorded choices, with range −100 to +100. It is not a clinical norm or percentile.

The old report-key mismatch is removed by typed report fields. The new report separates missing percentages from zero. It provides no diagnosis or clinical interpretation.
