export type ModalityType = 'voice' | 'vision' | 'text';

export type VoicePersona = 'Zephyr' | 'Kore' | 'Puck' | 'Fenrir' | 'Charon';

export type VisionAnalysisMode = 'scene' | 'document' | 'detect' | 'code';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: number;
  audioBase64?: string;
  modality: ModalityType;
  metadata?: {
    model?: string;
    visionMode?: VisionAnalysisMode;
    tokens?: number;
    latencyMs?: number;
  };
}

export interface AssistantSettings {
  voicePersona: VoicePersona;
  autoSpeakResponse: boolean;
  systemInstruction: string;
  soundEffects: boolean;
  haptics: boolean;
  continuousListening: boolean;
  visionScanInterval: number; // in seconds for live stream
}

export interface VisionPreset {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  prompt: string;
}
