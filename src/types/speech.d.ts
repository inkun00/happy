/** Chromium 계열 Web Speech API */

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRec;
    SpeechRecognition: new () => SpeechRec;
  }
}

interface SpeechRec extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      0: { transcript: string; confidence: number };
      isFinal: boolean;
    };
  };
}

export {};
