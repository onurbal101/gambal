export const trReport = {
  advantageousChoices: "Avantajlı seçimler",
  learning: "Öğrenme seyri",
  composition: "Deste dağılımı",
  compositionNote:
    "Her çubuk, o blokta kaydedilen seçimlerin tamamını gösterir. Harfler deste kimliğini, sayılar seçim adedini belirtir.",
  learningDelta: "Yarılar arası değişim",
  percentagePoints: "yüzde puan",
  choiceProfile: "Seçim profili",
  disadvantageousPair: "Dezavantajlı desteler · A / B",
  advantageousPair: "Avantajlı desteler · C / D",
  frequent: "Sık kayıp",
  infrequent: "Seyrek kayıp",
  structureNote:
    "A ve C’de kayıplar daha sık; B ve D’de daha seyrek ve daha büyüktür. A/B ve C/D, uzun vadeli değer ekseninde ayrı gruplardır. Bunlar bu görevin davranışsal ölçüleridir; kişilik puanı değildir.",
  overallFrequency: "Tüm seçimlerde sıklık tercihi",
  frequencyShift: "Bağlama göre sıklık tercihi farkı",
  sustainedOnset: "Kalıcı avantajlı seçim başlangıcı",
  sustainedNote:
    "{trial}. seçimden oturum sonuna kadar yalnızca C/D seçildi ({count} seçim).",
  longestAdvantageousRun: "En uzun ardışık C/D dizisi",
  longestDeckRun: "Tek destede en uzun ardışık dizi",
  sequence: "Seçim dizisi",
  sequenceNote:
    "Soldan sağa, yukarıdan aşağıya. Her hücre bir seçimdir; alt çizgi kayıp yaşanan seçimleri gösterir.",
  deckProfile: "Deste profili",
  observedNote:
    "Bu oturumda yaşanan kazanç ve kayıplar. Destelerin kuramsal beklenen değerleri değildir.",
  observedNet: "Gözlenen net sonuç",
  choicePercent: "Seçim (%)",
  averageNet: "Seçim başına net",
  punishmentEvents: "Kayıp olayı",
  punishmentRate: "Kayıp sıklığı (%)",
  largestLoss: "En büyük kayıp",
  deckOutcomeDetails: "Deste sonuçlarının ayrıntıları",
  feedbackAnalysis: "Geri bildirime tepki",
  exploratory: "Betimsel · keşif amaçlı",
  punishmentStay: "Kayıptan sonra aynı deste",
  punishmentSwitch: "Kayıptan sonra deste değişimi",
  negativeSwitch: "Net negatif sonuçtan sonra değişim",
  feedbackNote:
    "Kayıp olayı (kayıp > 0) ve net negatif sonuç (kazanç − kayıp < 0) ayrı değerlendirilir. Oranlar yalnızca aynı aşamada bir sonraki seçimi kaydedilen olayları içerir.",
  salientNote:
    "Yaşanan en büyük {count} pozitif kayıp gösterilir; eşit kayıplarda önceki seçim alınır. Oklar sonraki en fazla beş seçimi gösterir. Bunlar nedensel etki ölçüleri değildir.",
  returnLatency: "Aynı desteye dönüş: {count} seçim sonra",
  noReturn: "İzleyen {count} seçimde aynı desteye dönüş gözlenmedi",
  noNextChoice: "İzleyen seçim yok",
  noLossEvents: "Kaydedilmiş kayıp olayı yok.",
  dataQuality: "Veri kalitesi",
  qualityReview: "Kayıt kontrolü gerekiyor",
  qualityClean: "Kayıt kontrolleri tutarlı",
  medianResponse: "Ortanca yanıt süresi",
  responseIqr: "Çeyrekler arası aralık (IQR)",
  responseRange: "En kısa / en uzun yanıt",
  quartiles: "Birinci / üçüncü çeyrek",
  fastResponses: "Olağan dışı hızlı yanıtlar",
  fastNote:
    "{threshold} ms altındaki yanıtlar sayılır; otomatik olarak geçersiz sayılmaz. Yanıt süresi, geri bildirim bittikten sonraki süreyi ölçer. Eksik süreler hesaplamadan çıkarılır; kesinti sonrası seçimler ayrıca sayılır.",
  rtMethod:
    "Çeyrekler sıralı değerlerde (n − 1) × p konumunda doğrusal ara değer hesabıyla bulunur.",
  missingResponse: "Eksik yanıt süresi",
  validResponses: "Hesaba katılan yanıt süreleri",
  afterInterruption: "Kesinti sonrası seçimler",
  expectedChoices: "Kaydedilen / beklenen seçim",
  missingTrials: "Kayıt içinde eksik seçim",
  unobservedTrials: "Görev sonunda beklenen ek seçim",
  malformedValues: "Hatalı değerler (seçim / süre)",
  balanceCheck: "Bakiye kontrolü",
  positionCheck: "Deste sırası kontrolü",
  outcomeCheck: "Görev çizelgesiyle sonuç kontrolü",
  sequenceCheck: "Seçim sırası ve sayaç kontrolü",
  consistent: "Tutarlı",
  inconsistent: "Tutarsız",
  qualityNote:
    "Kontroller kayıtlı görev tanımını kullanır ve aşama sıfırlamalarını dikkate alır. Teknik tutarlılık, klinik geçerlilik anlamına gelmez.",
  incompleteSession:
    "Oturum tamamlanmadı; sonuçlar kaydedilen seçimleri kapsar.",
  trialCountMismatch: "Seçim sayısı görevde beklenen toplamla eşleşmiyor.",
  sequenceMismatch: "Seçim sırası veya oturum sayaçları eşleşmiyor.",
  balanceMismatch: "Bakiye, seçim geçmişiyle eşleşmiyor.",
  positionMismatch: "Deste konumları, seçim geçmişiyle eşleşmiyor.",
  outcomeMismatch:
    "Kazanç veya kayıplar, kayıtlı deste çizelgesiyle eşleşmiyor.",
  advancedAnalysis: "Ayrıntılı analiz ve hesaplama yöntemi",
  formulas:
    "Net puan = (C + D) − (A + B). Avantajlı seçim oranı = (C + D) / N. Sıklık tercihleri: C / (C + D), A / (A + B), (A + C) / N. Bağlama göre fark = C / (C + D) − A / (A + B). Yarılar arası değişim = ikinci yarı oranı − ilk yarı oranı; yüzde puan olarak gösterilir.",
  slicingNote:
    "Yarılar, görevin beklenen toplam seçim sayısına göre bölünür (tek sayıda seçim varsa fazladan seçim ikinci yarıya girer). Bloklar her aşamada 20 seçimdir. Eksik oturumlarda yalnızca kaydedilen seçimler hesaplanır; boş paydalarda değer gösterilmez. Diziler ve geri bildirim ölçüleri aşama sınırında veya eksik seçimde kesilir.",
  summaryScope:
    "Bu özet yalnızca bu oturumdaki seçimleri açıklar; norm veya klinik yorum içermez.",
  summaryUnusable:
    "Seçim kaydında tutarsızlık var. Davranışsal özet için önce veri kalitesini kontrol edin.",
  summaryInsufficient: "Yarıları karşılaştırmak için yeterli kayıt yok.",
  summaryIncrease:
    "Avantajlı seçim oranı ilk yarıda {first} iken ikinci yarıda {second} oldu; {delta} yüzde puan arttı.",
  summaryDecrease:
    "Avantajlı seçim oranı ilk yarıda {first} iken ikinci yarıda {second} oldu; {delta} yüzde puan azaldı.",
  summaryStable: "Avantajlı seçim oranı iki yarıda da {first} olarak kaldı.",
  summaryC: "Avantajlı seçimler içinde C, D’den daha sık seçildi ({rate}).",
  summaryD: "Avantajlı seçimler içinde D, C’den daha sık seçildi ({rate}).",
  summaryEqual: "Avantajlı seçimlerde C ve D eşit sıklıkta seçildi.",
  summaryNoAdvantage: "Avantajlı destelerden seçim kaydedilmedi.",
  summaryB: "Tüm seçimlerin yarıdan fazlası B destesinden yapıldı ({rate}).",
  summaryA: "Tüm seçimlerin yarıdan fazlası A destesinden yapıldı ({rate}).",
  summaryLateDeck:
    "İkinci yarıda seçimlerin çoğu {deck} destesindeydi ({rate}).",
  blockDetails: "Blok ayrıntıları",
  unavailableValue: "Veri yok",
  netOutcome: "Net sonuç",
  startingBalance: "Başlangıç bakiyesi",
  chartHelp:
    "Noktalara dokunun veya ok tuşlarıyla seçimleri inceleyin. İşaretli halkalar en büyük kayıpları gösterir.",
  downloadAnalysis: "Analiz · JSON",
  printReport: "Yazdır / PDF",
};
export const enReport: Record<keyof typeof trReport, string> = {
  advantageousChoices: "Advantageous choices",
  learning: "Learning trajectory",
  composition: "Deck composition",
  compositionNote:
    "Each bar shows all recorded choices in that block. Letters identify decks; numbers give choice counts.",
  learningDelta: "Change between halves",
  percentagePoints: "percentage points",
  choiceProfile: "Choice profile",
  disadvantageousPair: "Disadvantageous decks · A / B",
  advantageousPair: "Advantageous decks · C / D",
  frequent: "Frequent loss",
  infrequent: "Infrequent loss",
  structureNote:
    "A and C have more frequent losses; B and D have less frequent, larger losses. A/B and C/D form separate groups on the long-term value axis. These are behavioral measures in this task, not personality scores.",
  overallFrequency: "Overall frequency preference",
  frequencyShift: "Frequency preference shift",
  sustainedOnset: "Sustained advantageous-choice onset",
  sustainedNote:
    "Only C/D was selected from trial {trial} through the end ({count} choices).",
  longestAdvantageousRun: "Longest consecutive C/D run",
  longestDeckRun: "Longest consecutive single-deck run",
  sequence: "Choice sequence",
  sequenceNote:
    "Read left to right, then top to bottom. Each cell is one choice; an underline marks a loss event.",
  deckProfile: "Deck profile",
  observedNote:
    "Gains and losses experienced in this session. These are not the theoretical expected values of the decks.",
  observedNet: "Observed net outcome",
  choicePercent: "Choices (%)",
  averageNet: "Net per choice",
  punishmentEvents: "Loss events",
  punishmentRate: "Loss-event rate (%)",
  largestLoss: "Largest loss",
  deckOutcomeDetails: "Detailed deck outcomes",
  feedbackAnalysis: "Response to feedback",
  exploratory: "Descriptive · exploratory",
  punishmentStay: "Same deck after a loss",
  punishmentSwitch: "Deck switch after a loss",
  negativeSwitch: "Switch after a net-negative outcome",
  feedbackNote:
    "Loss events (loss > 0) and net-negative outcomes (gain − loss < 0) are separate. Rates include only events with a recorded next choice in the same stage.",
  salientNote:
    "The {count} largest positive losses are shown; earlier trials break ties. Arrows show up to five following choices. These are not measures of causal effects.",
  returnLatency: "Return to the same deck: {count} choices later",
  noReturn: "No return to the same deck in {count} observed following choices",
  noNextChoice: "No following choice",
  noLossEvents: "No recorded loss events.",
  dataQuality: "Data quality",
  qualityReview: "Record checks need review",
  qualityClean: "Record checks agree",
  medianResponse: "Median response time",
  responseIqr: "Interquartile range (IQR)",
  responseRange: "Minimum / maximum response",
  quartiles: "First / third quartile",
  fastResponses: "Unusually fast responses",
  fastNote:
    "Responses below {threshold} ms are counted; they are not automatically invalid. Response time starts after feedback ends. Missing times are excluded; choices after interruptions are counted separately.",
  rtMethod:
    "Quartiles use linear interpolation at position (n − 1) × p in the sorted values.",
  missingResponse: "Missing response time",
  validResponses: "Response times included",
  afterInterruption: "Choices after interruptions",
  expectedChoices: "Recorded / expected choices",
  missingTrials: "Missing choices within the record",
  unobservedTrials: "Additional choices expected by task end",
  malformedValues: "Malformed values (choices / times)",
  balanceCheck: "Balance check",
  positionCheck: "Deck-position check",
  outcomeCheck: "Outcome check against task schedule",
  sequenceCheck: "Trial-order and counter check",
  consistent: "Consistent",
  inconsistent: "Inconsistent",
  qualityNote:
    "Checks use the stored task definition and account for stage resets. Technical consistency does not establish clinical validity.",
  incompleteSession:
    "This session is incomplete; results cover the recorded choices.",
  trialCountMismatch:
    "The choice count does not match the expected task total.",
  sequenceMismatch: "Trial order or session counters do not agree.",
  balanceMismatch: "The balance does not agree with the trial history.",
  positionMismatch: "Deck positions do not agree with the trial history.",
  outcomeMismatch: "Gains or losses do not match the stored deck schedule.",
  advancedAnalysis: "Detailed analysis and calculation method",
  formulas:
    "Net score = (C + D) − (A + B). Advantageous-choice rate = (C + D) / N. Frequency preferences: C / (C + D), A / (A + B), (A + C) / N. Context shift = C / (C + D) − A / (A + B). Change between halves = second-half rate − first-half rate, shown in percentage points.",
  slicingNote:
    "Halves use the expected total choice count (an odd extra choice goes in the second half). Blocks cover 20 trials within each stage. Incomplete sessions use recorded choices only; empty denominators have no value. Runs and feedback measures stop at stage boundaries or missing trials.",
  summaryScope:
    "This summary describes choices in this session only. It contains no norms or clinical interpretation.",
  summaryUnusable:
    "The choice record has inconsistencies. Check data quality before interpreting behavior.",
  summaryInsufficient:
    "There are not enough recorded choices to compare halves.",
  summaryIncrease:
    "Advantageous choices rose from {first} in the first half to {second} in the second half, an increase of {delta} percentage points.",
  summaryDecrease:
    "Advantageous choices fell from {first} in the first half to {second} in the second half, a decrease of {delta} percentage points.",
  summaryStable: "Advantageous choices stayed at {first} in both halves.",
  summaryC:
    "Within advantageous choices, C was selected more often than D ({rate}).",
  summaryD:
    "Within advantageous choices, D was selected more often than C ({rate}).",
  summaryEqual:
    "C and D were selected equally often within advantageous choices.",
  summaryNoAdvantage: "No choices from advantageous decks were recorded.",
  summaryB: "More than half of all choices were from deck B ({rate}).",
  summaryA: "More than half of all choices were from deck A ({rate}).",
  summaryLateDeck:
    "In the second half, most choices were from deck {deck} ({rate}).",
  blockDetails: "Block details",
  unavailableValue: "No data",
  netOutcome: "Net outcome",
  startingBalance: "Starting balance",
  chartHelp:
    "Tap points or use arrow keys to inspect trials. Outlined markers show the largest losses.",
  downloadAnalysis: "Analysis · JSON",
  printReport: "Print / PDF",
};
