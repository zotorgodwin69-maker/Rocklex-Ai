/**
 * Audio synthesis, playback, and analysis utilities for ROCKLEX AI
 */

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

// Play futuristic tactile UI sound effects synthesized via Web Audio oscillators
export function playUiChime(type: 'activate' | 'success' | 'send' | 'beep') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'activate') {
      // Upward smooth two-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'success') {
      // Satisfying chord tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.09);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (err) {
    // Audio context might be restricted before user gesture
  }
}

// Convert base64 string to audio element for playback
export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private onEndCallback: (() => void) | null = null;

  public playBase64(base64Data: string, mimeType: string = 'audio/wav', onEnd?: () => void) {
    this.stop();
    this.onEndCallback = onEnd || null;

    try {
      const src = base64Data.startsWith('data:')
        ? base64Data
        : `data:${mimeType};base64,${base64Data}`;

      this.audio = new Audio(src);
      this.audio.onended = () => {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
      this.audio.onerror = (e) => {
        console.error('Audio playback error', e);
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
      this.audio.play().catch((err) => {
        console.warn('Playback blocked or failed', err);
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      });
    } catch (e) {
      console.error('Failed to create audio', e);
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }

  public speakTextFallback(text: string, onEnd?: () => void) {
    this.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const clean = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#>-]/g, '')
        .trim();
      if (!clean) {
        if (onEnd) onEnd();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(clean.slice(0, 300));
      utterance.rate = 1.05;
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }
  }

  public isPlaying(): boolean {
    return !!(this.audio && !this.audio.paused && !this.audio.ended);
  }
}

// Speech Recognition helper with cross-browser support
export function createSpeechRecognition(): any {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  return recognition;
}
