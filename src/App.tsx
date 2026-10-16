import React, { useState, useEffect, useRef } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { ModalityNav } from './components/ModalityNav';
import { VoiceModality } from './components/VoiceModality';
import { VisionModality } from './components/VisionModality';
import { TextModality } from './components/TextModality';
import { SettingsModal } from './components/SettingsModal';
import {
  ModalityType,
  ChatMessage,
  AssistantSettings,
  VoicePersona,
  VisionAnalysisMode,
} from './types/assistant';
import { AudioPlayer, playUiChime, createSpeechRecognition } from './utils/audio';

const STORAGE_KEY_SETTINGS = 'rocklex_assistant_settings_v1';
const STORAGE_KEY_MESSAGES = 'rocklex_assistant_messages_v1';

const DEFAULT_SETTINGS: AssistantSettings = {
  voicePersona: 'Zephyr',
  autoSpeakResponse: true,
  systemInstruction: `You are ROCKLEX AI, an elite, ultra-capable multimodal mobile AI assistant.
You interact fluidly across three distinct modalities: Voice, Vision, and Text.
Your personality is articulate, concise, perceptive, sharp, and helpful.
When responding in Voice mode, keep responses punchy, conversational, and direct (1-3 sentences) so they sound natural when spoken.
When in Text or Vision mode, provide clear markdown formatting, bullet points, code blocks when requested, or detailed visual breakdowns.
Always acknowledge what you see when given an image or camera frame.`,
  soundEffects: true,
  haptics: true,
  continuousListening: false,
  visionScanInterval: 5,
};

function parseHumanErrorMessage(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'Gemini free-tier request quota reached. Please wait about 15-20 seconds before asking your next question.';
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return 'Gemini is currently experiencing high traffic. Please try again in a few moments.';
  }
  return 'Unable to process query at this moment. Please try again shortly.';
}

export default function App() {
  const [modality, setModality] = useState<ModalityType>('voice');
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Multimodal assistant states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastAssistantVoiceText, setLastAssistantVoiceText] = useState('');
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Vision state
  const [lastVisionAnalysis, setLastVisionAnalysis] = useState<{
    text: string;
    mode: VisionAnalysisMode;
    audioBase64?: string | null;
  } | null>(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

  const audioPlayerRef = useRef<AudioPlayer>(new AudioPlayer());
  const recognitionRef = useRef<any>(null);

  // Save settings & messages
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const recognition = createSpeechRecognition();
    if (recognition) {
      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalResult = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalResult += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        const currentText = finalResult || currentInterim;
        setTranscript(currentText);

        // If a final result was recognized, submit after brief pause
        if (finalResult && finalResult.trim().length > 1) {
          handleVoiceQuerySubmit(finalResult.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      audioPlayerRef.current.stop();
    };
  }, []);

  // Play chimes with setting check
  const triggerChime = (type: 'activate' | 'success' | 'send' | 'beep') => {
    if (settings.soundEffects) {
      playUiChime(type);
    }
  };

  // Start Voice Listening
  const startListening = () => {
    audioPlayerRef.current.stop();
    setIsSpeaking(false);
    setTranscript('');

    triggerChime('activate');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start recognition directly:', err);
      }
    } else {
      // Fallback prompt for browsers without Web Speech
      const sample = prompt('Enter your voice command (Speech API unavailable in this browser):');
      if (sample) {
        handleVoiceQuerySubmit(sample);
      }
    }
  };

  // Stop Voice Listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);

    if (transcript.trim()) {
      handleVoiceQuerySubmit(transcript.trim());
    }
  };

  // Send voice query to Gemini backend
  const handleVoiceQuerySubmit = async (queryText: string) => {
    if (!queryText.trim()) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setIsThinking(true);
    triggerChime('send');

    // Add user message to conversation history
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      text: queryText,
      timestamp: Date.now(),
      modality: 'voice',
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          messages: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
            image: m.image,
          })),
          voiceReply: settings.autoSpeakResponse,
          voiceName: settings.voicePersona,
          systemInstruction: settings.systemInstruction,
        }),
      });

      const data = await res.json();
      const replyText = data.text || (data.error ? parseHumanErrorMessage(data.error) : 'No response generated.');

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        text: replyText,
        audioBase64: data.audioBase64,
        timestamp: Date.now(),
        modality: 'voice',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLastAssistantVoiceText(replyText);
      setLastAudioBase64(data.audioBase64 || null);
      setTranscript('');

      triggerChime('success');

      // Play synthesized audio if available, or fall back to native speech
      if (data.audioBase64) {
        setIsSpeaking(true);
        audioPlayerRef.current.playBase64(data.audioBase64, 'audio/wav', () => {
          setIsSpeaking(false);
          if (settings.continuousListening) {
            setTimeout(startListening, 600);
          }
        });
      } else if (settings.autoSpeakResponse && replyText) {
        setIsSpeaking(true);
        audioPlayerRef.current.speakTextFallback(replyText, () => {
          setIsSpeaking(false);
          if (settings.continuousListening) {
            setTimeout(startListening, 600);
          }
        });
      }
    } catch (err: any) {
      console.warn('Voice query handled:', err);
      const friendlyText = parseHumanErrorMessage(err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        text: friendlyText,
        timestamp: Date.now(),
        modality: 'voice',
      };
      setMessages((prev) => [...prev, errorMsg]);
      setLastAssistantVoiceText(friendlyText);
    } finally {
      setIsThinking(false);
    }
  };

  // Inspect vision frame / camera snapshot
  const handleInspectImage = async (params: {
    image: string;
    mode: VisionAnalysisMode;
    prompt?: string;
    voiceReply?: boolean;
  }) => {
    setIsAnalyzingVision(true);
    setIsThinking(true);
    triggerChime('send');

    try {
      const res = await fetch('/api/vision-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: params.image,
          mode: params.mode,
          prompt: params.prompt,
          voiceReply: params.voiceReply,
          voiceName: settings.voicePersona,
        }),
      });

      const data = await res.json();
      const outputText = data.text || (data.error ? parseHumanErrorMessage(data.error) : 'Visual analysis unavailable.');

      setLastVisionAnalysis({
        text: outputText,
        mode: params.mode,
        audioBase64: data.audioBase64,
      });

      triggerChime('success');

      // Also log into chat history so thoughts persist across modalities!
      const userVisionMsg: ChatMessage = {
        id: `vis-u-${Date.now()}`,
        role: 'user',
        text: params.prompt || `Inspect frame in ${params.mode} mode`,
        image: params.image,
        timestamp: Date.now(),
        modality: 'vision',
      };
      const assistantVisionMsg: ChatMessage = {
        id: `vis-a-${Date.now()}`,
        role: 'assistant',
        text: outputText,
        audioBase64: data.audioBase64,
        timestamp: Date.now(),
        modality: 'vision',
      };
      setMessages((prev) => [...prev, userVisionMsg, assistantVisionMsg]);

      // Play audio if generated or speak fallback
      if (data.audioBase64) {
        setIsSpeaking(true);
        audioPlayerRef.current.playBase64(data.audioBase64, 'audio/wav', () => {
          setIsSpeaking(false);
        });
      } else if (params.voiceReply && outputText) {
        setIsSpeaking(true);
        audioPlayerRef.current.speakTextFallback(outputText, () => {
          setIsSpeaking(false);
        });
      }
    } catch (err: any) {
      console.warn('Vision inspect handled:', err);
      const friendlyText = parseHumanErrorMessage(err);
      setLastVisionAnalysis({
        text: friendlyText,
        mode: params.mode,
      });
    } finally {
      setIsAnalyzingVision(false);
      setIsThinking(false);
    }
  };

  // Send message from Text Modality
  const handleSendTextMessage = async (text: string, image?: string) => {
    setIsThinking(true);
    triggerChime('send');

    const userMsg: ChatMessage = {
      id: `txt-u-${Date.now()}`,
      role: 'user',
      text,
      image,
      timestamp: Date.now(),
      modality: 'text',
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          image,
          messages: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
            image: m.image,
          })),
          voiceReply: false, // In text chat, read-aloud is on-demand
          systemInstruction: settings.systemInstruction,
        }),
      });

      const data = await res.json();
      const replyText = data.text || (data.error ? parseHumanErrorMessage(data.error) : 'Unable to generate response.');

      const assistantMsg: ChatMessage = {
        id: `txt-a-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        modality: 'text',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      triggerChime('success');
    } catch (err: any) {
      console.warn('Chat handled:', err);
      const friendlyText = parseHumanErrorMessage(err);
      const errMsg: ChatMessage = {
        id: `txt-err-${Date.now()}`,
        role: 'assistant',
        text: friendlyText,
        timestamp: Date.now(),
        modality: 'text',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Read aloud any message using Gemini TTS
  const handleReadAloud = async (text: string) => {
    if (isSpeaking) {
      audioPlayerRef.current.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: settings.voicePersona,
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        audioPlayerRef.current.playBase64(data.audioBase64, 'audio/wav', () => {
          setIsSpeaking(false);
        });
      } else {
        audioPlayerRef.current.speakTextFallback(text, () => {
          setIsSpeaking(false);
        });
      }
    } catch {
      audioPlayerRef.current.speakTextFallback(text, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Replay last voice audio
  const handleReplayVoiceAudio = () => {
    if (lastAudioBase64) {
      setIsSpeaking(true);
      audioPlayerRef.current.playBase64(lastAudioBase64, 'audio/wav', () => {
        setIsSpeaking(false);
      });
    } else if (lastAssistantVoiceText) {
      handleReadAloud(lastAssistantVoiceText);
    }
  };

  // Stop speaking
  const handleStopSpeaking = () => {
    audioPlayerRef.current.stop();
    setIsSpeaking(false);
  };

  // Clear chat history
  const handleClearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    triggerChime('beep');
  };

  return (
    <MobileFrame
      modality={modality}
      isListening={isListening}
      isSpeaking={isSpeaking}
      isThinking={isThinking}
      cameraActive={cameraActive}
      onIslandTap={() => {
        if (isSpeaking) {
          handleStopSpeaking();
        } else {
          setIsSettingsOpen(true);
        }
      }}
    >
      {/* Active Modality View */}
      {modality === 'voice' && (
        <VoiceModality
          isListening={isListening}
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          transcript={transcript}
          lastAssistantText={lastAssistantVoiceText}
          voicePersona={settings.voicePersona}
          onVoiceChange={(v) => setSettings({ ...settings, voicePersona: v })}
          onStartListening={startListening}
          onStopListening={stopListening}
          onSendVoiceQuery={handleVoiceQuerySubmit}
          onStopSpeaking={handleStopSpeaking}
          onReplayAudio={handleReplayVoiceAudio}
        />
      )}

      {modality === 'vision' && (
        <VisionModality
          onInspectImage={handleInspectImage}
          isAnalyzing={isAnalyzingVision}
          lastAnalysis={lastVisionAnalysis}
          voicePersona={settings.voicePersona}
          onSendToChat={(text, image) => {
            handleSendTextMessage(text, image);
            setModality('text');
          }}
          onCameraActiveChange={setCameraActive}
        />
      )}

      {modality === 'text' && (
        <TextModality
          messages={messages}
          onSendMessage={handleSendTextMessage}
          isThinking={isThinking}
          onReadAloud={handleReadAloud}
          onClearMessages={handleClearMessages}
          voicePersona={settings.voicePersona}
          onStartSpeechDictation={startListening}
          isListening={isListening}
        />
      )}

      {/* Bottom Floating Modality Switcher Bar */}
      <ModalityNav
        activeModality={modality}
        onChangeModality={(m) => {
          setModality(m);
          triggerChime('beep');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isListening={isListening}
        cameraActive={cameraActive}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onResetDefaults={() => setSettings(DEFAULT_SETTINGS)}
      />
    </MobileFrame>
  );
}
