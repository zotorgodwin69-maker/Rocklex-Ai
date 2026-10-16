import React from 'react';
import { Mic, Eye, Sparkles, Volume2, ShieldCheck } from 'lucide-react';
import { ModalityType } from '../types/assistant';

interface DynamicIslandProps {
  modality: ModalityType;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  cameraActive: boolean;
  onTap?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  modality,
  isListening,
  isSpeaking,
  isThinking,
  cameraActive,
  onTap,
}) => {
  return (
    <div className="w-full flex items-center justify-center pt-2 pb-1 z-50">
      <div
        onClick={onTap}
        className={`relative cursor-pointer transition-all duration-300 ease-out bg-black/90 backdrop-blur-2xl rounded-full border border-white/10 flex items-center justify-between px-3.5 py-1.5 shadow-lg ${
          isSpeaking || isListening || isThinking
            ? 'w-64 h-9 ring-1 ring-cyan-500/30 shadow-cyan-500/10'
            : 'w-36 h-7 hover:ring-1 hover:ring-white/20'
        }`}
      >
        {/* Left icon / state */}
        <div className="flex items-center gap-1.5 min-w-[24px]">
          {isThinking ? (
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-medium tracking-tight text-cyan-300">ROCKLEX</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-1 text-rose-400">
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[11px] font-semibold text-rose-300">Listening</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-center gap-1.5 text-purple-400">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span className="text-[11px] font-medium text-purple-200">Speaking</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-[11px] font-semibold tracking-wide text-white/90">ROCKLEX</span>
            </div>
          )}
        </div>

        {/* Center / Right activity indicators */}
        <div className="flex items-center gap-2">
          {cameraActive && (
            <div className="flex items-center gap-1" title="Camera hardware sensor active">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              <Eye className="w-3 h-3 text-emerald-400/80" />
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-3 bg-purple-400 rounded-full animate-wave-1" />
              <span className="w-0.5 h-3.5 bg-indigo-400 rounded-full animate-wave-2" />
              <span className="w-0.5 h-2 bg-pink-400 rounded-full animate-wave-3" />
              <span className="w-0.5 h-3.5 bg-purple-400 rounded-full animate-wave-4" />
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-2 bg-rose-400 rounded-full animate-wave-2" />
              <span className="w-0.5 h-3.5 bg-rose-300 rounded-full animate-wave-1" />
              <span className="w-0.5 h-2 bg-rose-500 rounded-full animate-wave-4" />
            </div>
          )}

          {isThinking && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-cyan-400/90 font-mono">3.8 Flash</span>
            </div>
          )}

          {!isListening && !isSpeaking && !isThinking && (
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <span className="uppercase font-mono text-[9px] text-white/50">{modality}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
