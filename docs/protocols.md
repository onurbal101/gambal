# Task definitions and evidence

## Enabled: Gambal Legacy v1

This is a preserved Gambal schedule with a new presentation. It is not a claim of equivalence to a published or licensed clinical IGT.

The fixture is based on `gambal/src/new_iowa/src/decks/deck_{a,b,c,d}.csv`. Each deck has 60 cards. The source files have identical C and D decks. The app fixture keeps the source card order and gain values. Only Deck D cards 10, 20, 29, 35, 45, and 58 have losses: 250, 275, 300, 325, 350, and 375. All other Deck D losses are 0. The original CSV files stay unchanged. The fixture check compares Decks A-C with their source rows, then checks all Deck D gains, card order, and loss values.

The procedure starts at 2,000, stops at 100 choices, and makes an exhausted deck unavailable. Negative balances do not end play. Each session has an immutable task snapshot, source paths, stable version ID, and a SHA-256 deck checksum. The checksum input is the JSON serialization of the ordered A/B/C/D arrays of `[gain, loss]` pairs.

`puzzle-v1` presents each outcome for a fixed 900 ms input interval. Gain and loss remain separate even when their net result is positive. The last outcome stays visible. The instructions are new Turkish and English text for this preserved schedule. Neither the instructions nor this timing are presented as verified clinical instructions or timing. A verified procedure can override the presentation interval.

## Original IGT (1994): evidence review

**Decision: keep disabled.** The original paper verifies the main task, its 100-choice end, and the starting loan. It does not verify every rule needed for a complete playable definition. This project does not add or estimate any missing rule.

### Verified in the 1994 paper

[Bechara et al. (1994), *Cognition* 50, pages 7–15](https://doi.org/10.1016/0010-0277(94)90018-3) is the primary source.

- Participants sit in front of four decks with the same appearance and size.
- Each participant receives a $2,000 loan of play money.
- The participant chooses one card at a time from any deck. The reward appears after the card is turned. Some cards also have a penalty. The reward and penalty schedule is hidden from the participant.
- The stated goal is to maximize profit on the loan. The participant may change decks at any time and as often as they wish.
- The participant is not told the number of choices in advance. The task stops after 100 choices.
- Decks A and B give $100 per card. Decks C and D give $50 per card.
- Figure 1 shows the score cards. Its caption says that handwritten numbers show the choice order of two example participants. The 1994 methods refer to these cards as the source of the programmed reward and penalty schedules.

The 1994 text summarizes the first ten cards in each deck, but it does not print the full schedule as a text table. The score-card figure contains the card data. This project has not copied all outcomes from that figure into a data file or checked each value. No card data have been added from estimates.

### Protocol check by rule

| Rule | What the primary sources say | Gap for this task |
| --- | --- | --- |
| Stopping | The 1994 paper says to stop after 100 choices. | Verified. |
| Deck exhaustion | The 1994 paper does not say what to do when a deck has no cards left. Bechara et al. (1999) says to stop using that deck and continue with the other decks in its computer version. | The later computer rule is not stated as a rule of the 1994 task. |
| Borrowing and balance | The 1994 paper gives a $2,000 loan and says to maximize profit on that loan. | It does not say whether a participant can borrow more, or what to do if the current balance cannot cover a penalty. |
| Timing | The 1994 paper gives no response limit or interval between choices. Bechara et al. (1999) says the computer interval can be set by the examiner; that study used six seconds to record skin conductance. | The later computer setting does not verify timing for the 1994 task. |
| Instructions | The 1994 paper gives the instruction content: the goal, free deck switching, hidden outcomes, and an undisclosed task length. | It does not give exact spoken instructions. The script in the 1999 paper is for its computer version. |
| Full card data | Figure 1 in the 1994 paper shows the score cards. Bechara et al. (1999) says the computer version has 40 cards per deck and uses outcomes based on the 1994 version. | This project has not copied and checked all 40 outcomes for each deck. |

[Bechara et al. (1999), *Journal of Neuroscience* 19, pages 5473–5481](https://pmc.ncbi.nlm.nih.gov/articles/PMC6782338/) is also a primary source. It describes a later computerized version based on the 1994 task. It sets a six-second interval for that study, gives a computer-specific verbal script, and states a rule for an exhausted deck. These details are evidence for that 1999 computer version. This project does not treat them as verified 1994 rules.

### Turkish and other digital implementations

These sources describe other versions. They add evidence for those versions, but they do not fill the missing 1994 rules by transfer.

- Güleç et al. (2007), [the Turkish IGT adaptation](https://www.researchgate.net/publication/327499365_Eriskin_Dikkat_Eksikligi_Hiperaktivite_Bozuklugu_Tanisi_Konmus_Erkek_Mahkumlarda_IOWA_Kumar_Testi_Turkce_Uyarlamasinin_Psikometrik_Ozellikleri), reports verbal instructions translated from English to Turkish and back-translated for comparison. It reports a 2,000,000,000 TL play-money loan, 100 choices, 40 cards per deck, and aggregate ten-card net results. It does not publish the complete ordered card outcomes, response timing, exhaustion behavior, or any further-borrowing rule.
- İçellioglu (2015), [the Turkish normative study](https://doi.org/10.5350/DAJPN2015280305), reports a computerized Bechara version with Turkish screen terms and TL units, a 2,000 TL advance, participant instructions, an undisclosed 100-choice length, and an automatic stop after choice 100. It does not publish the complete ordered card outcomes, response timing, or exhaustion behavior.
- İçellioglu and Ermiş (2017), [a Turkish computer study](https://doi.org/10.15405/epsbs.2017.01.02.2), reports translated screen text, a 2,000 TL stake, 100 undisclosed choices, and an automatic stop. It does not add the full card order, timing, or exhaustion rule.
- An [Istanbul University thesis](https://nek.istanbul.edu.tr/ekos/TEZ/43546.pdf) describes a separate computer procedure: if the balance fell below $2,000 before the end, the computer lent another $2,000; the participant was then asked to finish above $4,000. It reports a 100-choice end and an estimated duration of 15–20 minutes. This is evidence for that thesis's implementation, not for an extra-loan rule in the 1994 task.

The Turkish and digital sources document several distinct procedures. They improve the record for those versions, but they do not provide one complete, source-verified 1994 protocol. The original IGT remains disabled. No Turkish or later-version card data or procedure rules have been copied into its definition.

### Other unavailable definitions

| Definition | Evidence gap |
| --- | --- |
| Clinical IGT | The comparison paper supplies loss-order evidence, but not the exact variable reward order. |
| Three-stage clinical IGT | This task needs the exact clinical schedule and a verified reset, break, instruction, and stage-transition procedure. |

Unavailable entries have no playable cards and a null checksum. The engine rejects starting them. No inferred schedule is substituted. A generic stage engine is present, but only synthetic stage fixtures are tested; no published multi-stage protocol is enabled.

The clinical-version evidence gap follows [Lin et al. (2013)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00220/full). This is a comparison paper, not the source for the 1994 task.

## Calculations

- Balance = starting balance + gains − losses.
- Net score = (C + D) − (A + B).
- Blocks retain fixed ranges 1–20, 21–40, 41–60, 61–80, and 81–100, including incomplete sessions.
- Halves retain ranges 1–50 and 51–100.
- Empty percentages and rescaled scores are null. An empty net count is zero.
- Rescaled score = 100 × net score / recorded choices, with range −100 to +100. It is not a clinical norm or percentile.

The old report-key mismatch is removed by typed report fields. The new report separates missing percentages from zero. It provides no diagnosis or clinical interpretation.
