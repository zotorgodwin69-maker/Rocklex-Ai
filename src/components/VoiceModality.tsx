import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Radio,
  Sliders,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { VoicePersona } from '../types/assistant';

interface VoiceModalityProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  transcript: string;
  lastAssistantText: string;
  voicePersona: VoicePersona;
  onVoiceChange: (voice: VoicePersona) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onSendVoiceQuery: (text: string) => void;
  onStopSpeaking: () => void;
  onReplayAudio: () => void;
}

export const VoiceModality: React.FC<VoiceModalityProps> = ({
  isListening,
  isSpeaking,
  isThinking,
  transcript,
  lastAssistantText,
  voicePersona,
  onVoiceChange,
  onStartListening,
  onStopListening,
  onSendVoiceQuery,
  onStopSpeaking,
  onReplayAudio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [handsFree, setHandsFree] = useState(false);

  // Quick prompt inspirations
  const quickPrompts = [
    'What are 3 breakthrough trends in AI this year?',
    'Give me a 60-second productivity boost tip.',
    'Explain the theory of relativity in 2 sentences.',
    'Plan a 3-day high-energy weekend itinerary.',
  ];

  const voices: { id: VoicePersona; label: string; desc: string }[] = [
    { id: 'Zephyr', label: 'Zephyr', desc: 'Crisp & Dynamic' },
    { id: 'Kore', label: 'Kore', desc: 'Warm & Natural' },
    { id: 'Puck', label: 'Puck', desc: 'Lively & Bright' },
    { id: 'Fenrir', label: 'Fenrir', desc: 'Deep & Resonant' },
    { id: 'Charon', label: 'Charon', desc: 'Authoritative' },
  ];

  // Canvas visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Base radius & amplitude based on state
      let baseRadius = 54;
      let amp = 8;
      let speed = 0.04;
      let strokeColor1 = 'rgba(56, 189, 248, 0.7)'; // Cyan
      let strokeColor2 = 'rgba(168, 85, 247, 0.8)'; // Purple

      if (isListening) {
        baseRadius = 64;
        amp = 26;
        speed = 0.09;
        strokeColor1 = 'rgba(244, 63, 94, 0.9)'; // Rose
        strokeColor2 = 'rgba(251, 146, 60, 0.85)'; // Orange
      } else if (isSpeaking) {
        baseRadius = 68;
        amp = 32;
        speed = 0.11;
        strokeColor1 = 'rgba(168, 85, 247, 0.95)'; // Violet
        strokeColor2 = 'rgba(59, 130, 246, 0.9)'; // Blue
      } else if (isThinking) {
        baseRadius = 58;
        amp = 14;
        speed = 0.07;
        strokeColor1 = 'rgba(34, 211, 238, 0.9)'; // Cyan
        strokeColor2 = 'rgba(99, 102, 241, 0.8)'; // Indigo
      }

      phase += speed;

      // Draw background outer glowing rings
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 1.6
      );
      if (isListening) {
        glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
        glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
      } else if (isSpeaking) {
        glowGrad.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
        glowGrad.addColorStop(1, 'rgba(147, 51, 234, 0.0)');
      } else if (isThinking) {
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw multiple harmonic wave rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringOffset = (r * Math.PI) / 3;
        ctx.beginPath();

        const numPoints = 80;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const wave =
            Math.sin(angle * 5 + phase + ringOffset) *
            Math.cos(angle * 3 - phase * 0.5) *
            amp;
          const radius = baseRadius + wave + r * 6;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const strokeGrad = ctx.createLinearGradient(0, 0, width, height);
        strokeGrad.addColorStop(0, strokeColor1);
        strokeGrad.addColorStop(1, strokeColor2);

        ctx.strokeStyle = strokeGrad;
        ctx.lineWidth = r === 0 ? 3.5 : 1.8;
        ctx.stroke();
      }

      // Draw inner glowing core
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        baseRadius * 0.7
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.5, strokeColor1);
      coreGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isListening, isSpeaking, isThinking]);

  return (
    <div className="flex-1 flex flex-col justify-between px-5 py-2 overflow-y-auto cyber-grid">
      {/* Top Header & Voice Selector */}
      <div className="flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                ROCKLEX Voice Core
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  3.8 Live TTS
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Real-time voice duplex with audio synthesis</p>
            </div>
          </div>

          {/* Hands-free mode toggle */}
          <button
            onClick={() => setHandsFree(!handsFree)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border flex items-center gap-1.5 ${
              handsFree
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Auto-listen after speaking"
          >
            <Headphones className="w-3 h-3" />
            <span>{handsFree ? 'Hands-Free' : 'Manual'}</span>
          </button>
        </div>

        {/* Voice Persona Picker */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {voices.map((v) => (
            <button
              key={v.id}
              onClick={() => onVoiceChange(v.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border ${
                voicePersona === v.id
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center Interactive Orb & Waveform Canvas */}
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[220px] max-h-[300px] my-auto">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="w-[260px] h-[260px] cursor-pointer"
          onClick={isListening ? onStopListening : onStartListening}
        />

        {/* Status text label below orb */}
        <div className="mt-2 text-center">
          {isThinking ? (
            <span className="text-xs font-semibold text-cyan-400 animate-pulse tracking-wide">
              ROCKLEX is synthesizing thought...
            </span>
          ) : isListening ? (
            <span className="text-xs font-semibold text-rose-400 tracking-wide flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening to your voice... Tap to finish
            </span>
          ) : isSpeaking ? (
            <span className="text-xs font-semibold text-purple-400 tracking-wide flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Speaking response with {voicePersona} voice
            </span>
          ) : (
            <span className="text-xs text-slate-400 tracking-wide">
              Tap the glowing orb or mic to speak with ROCKLEX
            </span>
          )}
        </div>
      </div>

      {/* Bottom Live Transcript & Assistant Dialogue Display */}
      <div className="flex flex-col gap-2 z-10">
        {/* Active user transcript bubble */}
        {transcript && (
          <div className="glass-panel rounded-2xl p-3 border-rose-500/30 bg-rose-950/20 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-[11px] text-rose-400 mb-1 font-mono">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3 animate-pulse" /> You (Live Voice)
              </span>
              <span>Recording</span>
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Last Assistant Response Card */}
        {lastAssistantText && !transcript && (
          <div className="glass-panel-elevated rounded-2xl p-3.5 border-purple-500/20 relative shadow-xl max-h-32 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] text-purple-400 mb-1 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" /> ROCKLEX
              </span>
              <div className="flex items-center gap-1">
                {isSpeaking ? (
                  <button
                    onClick={onStopSpeaking}
                    className="p-1 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    title="Stop speaking"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onReplayAudio}
                    className="p-1 rounded-md bg-white/10 text-slate-300 hover:text-white hover:bg-white/20"
                    title="Replay spoken audio"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed line-clamp-4">
              {lastAssistantText}
            </p>
          </div>
        )}

        {/* Quick prompt suggestions when idle */}
        {!transcript && !lastAssistantText && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
              Try asking ROCKLEX:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {quickPrompts.slice(0, 2).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendVoiceQuery(prompt)}
                  className="w-full text-left p-2 rounded-xl glass-pill text-xs text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Primary Mic Trigger Button */}
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={isListening ? onStopListening : onStartListening}
            className={`relative group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 scale-105 shadow-[0_0_35px_rgba(244,63,94,0.6)]'
                : 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.5)]'
            }`}
          >
            {isListening ? (
              <MicOff className="w-7 h-7 animate-pulse" />
            ) : (
              <Mic className="w-7 h-7" />
            )}

            {/* Pulsing ring indicator */}
            {isListening && (
              <span className="absolute -inset-1.5 rounded-full border-2 border-rose-400 animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
