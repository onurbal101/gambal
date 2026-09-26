type ActiveVoice = {
  oscillator: OscillatorNode;
  envelope: GainNode;
};

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let context: AudioContext | null = null;
let master: GainNode | null = null;
let activeVoices: ActiveVoice[] = [];
let cueRequest = 0;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context?.state === "closed") {
    context = null;
    master = null;
    activeVoices = [];
  }
  if (context) return context;

  const audioWindow = window as AudioWindow;
  const AudioContextConstructor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    const createdContext = new AudioContextConstructor();
    context = createdContext;
    master = createdContext.createGain();
    master.gain.value = 0.3;
    master.connect(createdContext.destination);
    return createdContext;
  } catch {
    context = null;
    master = null;
    return null;
  }
}

/** Call directly from the choice gesture so browsers can unlock audio. */
export function primeOutcomeAudio(): void {
  try {
    const audio = getContext();
    if (audio && audio.state !== "running") void audio.resume().catch(() => {});
  } catch {
    // Audio is optional. A device or browser error must not block a choice.
  }
}

/** Stop the current cue when the player mutes sound. */
export function stopOutcomeAudio(): void {
  cueRequest += 1;
  try {
    if (context && context.state !== "closed") stopCurrentCue(context);
  } catch {
    // Audio is optional. A device or browser error must not block play.
  }
}

function stopCurrentCue(audio: AudioContext): void {
  const now = audio.currentTime;
  const voices = activeVoices;
  activeVoices = [];
  for (const { oscillator, envelope } of voices) {
    try {
      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setTargetAtTime(0, now, 0.012);
      oscillator.stop(now + 0.05);
    } catch {
      // A voice may have ended between scheduling and cancellation.
    }
  }
}

function addVoice(
  audio: AudioContext,
  destination: GainNode,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscillatorType,
): void {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  const attack = 0.012;
  const decay = Math.min(0.075, duration * 0.4);
  const sustain = Math.max(0.0001, volume * 0.28);
  const endAt = startAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(volume, startAt + attack);
  envelope.gain.exponentialRampToValueAtTime(sustain, startAt + decay);
  envelope.gain.setValueAtTime(sustain, endAt - 0.025);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.onended = () => {
    activeVoices = activeVoices.filter(
      (voice) => voice.oscillator !== oscillator,
    );
    oscillator.disconnect();
    envelope.disconnect();
  };
  activeVoices.push({ oscillator, envelope });
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.01);
}

function scheduleCue(audio: AudioContext, net: number): void {
  if (!master) return;
  stopCurrentCue(audio);
  const start = audio.currentTime + 0.015;

  if (net > 0) {
    // A short, warm major arpeggio gives gains a clear lift.
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      addVoice(
        audio,
        master!,
        frequency,
        start + index * 0.105,
        index === 2 ? 0.3 : 0.24,
        0.17,
        "sine",
      );
      addVoice(
        audio,
        master!,
        frequency * 2,
        start + index * 0.105,
        index === 2 ? 0.3 : 0.24,
        0.024,
        "sine",
      );
    });
    return;
  }

  if (net < 0) {
    // A soft descending minor arpeggio signals a loss without a harsh buzzer.
    [392, 311.13, 261.63].forEach((frequency, index) => {
      addVoice(
        audio,
        master!,
        frequency,
        start + index * 0.11,
        index === 2 ? 0.28 : 0.22,
        0.135,
        "sine",
      );
    });
    return;
  }

  // Two quiet, even taps mark a neutral result.
  [0, 0.105].forEach((offset) => {
    addVoice(audio, master!, 440, start + offset, 0.095, 0.12, "triangle");
  });
}

/** Play one best-effort cue for a newly saved result. */
export function playOutcome(net: number): void {
  try {
    const audio = context;
    if (!audio || audio.state === "closed" || !Number.isFinite(net)) return;
    const request = ++cueRequest;
    const play = () => {
      if (request !== cueRequest || audio.state !== "running") return;
      try {
        scheduleCue(audio, net);
      } catch {
        // Audio is optional. A device or browser error must not affect the game.
      }
    };

    if (audio.state === "running") play();
    else
      void audio
        .resume()
        .then(play)
        .catch(() => {});
  } catch {
    // Audio is optional. A device or browser error must not affect the game.
  }
}
