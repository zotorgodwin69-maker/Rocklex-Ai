import React, { useState } from 'react';
import { Smartphone, Maximize2, Minimize2, Wifi, Battery, Sparkles } from 'lucide-react';
import { DynamicIsland } from './DynamicIsland';
import { ModalityType } from '../types/assistant';

interface MobileFrameProps {
  children: React.ReactNode;
  modality: ModalityType;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  cameraActive: boolean;
  onIslandTap?: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  modality,
  isListening,
  isSpeaking,
  isThinking,
  cameraActive,
  onIslandTap,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050811] flex items-center justify-center p-0 sm:p-4 overflow-hidden selection:bg-cyan-500/30">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Frame Mode Switcher Floating Pill (Top Bar outside phone) */}
      <div className="absolute top-3 right-4 hidden sm:flex items-center gap-2 z-40 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300 shadow-xl">
        <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          ROCKLEX AI Mobile Core
        </span>
        <span className="text-white/20">|</span>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          title={isFullscreen ? 'Switch to Device Frame' : 'Expand Fullscreen'}
        >
          {isFullscreen ? (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Device View</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container - either constrained phone mockup or full view */}
      <div
        className={`relative transition-all duration-300 ease-in-out flex flex-col bg-[#080d1a] overflow-hidden ${
          isFullscreen
            ? 'w-full h-screen max-w-full rounded-none border-none shadow-none'
            : 'w-full sm:w-[410px] h-[100dvh] sm:h-[844px] sm:max-h-[95vh] sm:rounded-[48px] border-0 sm:border-[8px] sm:border-slate-800/90 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(56,189,248,0.12)] ring-1 ring-white/10'
        }`}
      >
        {/* Hardware Bezel Notch details (only in device view) */}
        {!isFullscreen && (
          <div className="absolute -left-[10px] top-28 w-1 h-12 bg-slate-700/60 rounded-l-md hidden sm:block" />
        )}
        {!isFullscreen && (
          <div className="absolute -left-[10px] top-44 w-1 h-12 bg-slate-700/60 rounded-l-md hidden sm:block" />
        )}
        {!isFullscreen && (
          <div className="absolute -right-[10px] top-36 w-1 h-16 bg-slate-700/60 rounded-r-md hidden sm:block" />
        )}

        {/* Status Bar */}
        <div className="w-full pt-3 px-6 pb-1 flex items-center justify-between text-xs font-semibold text-slate-300 z-50 select-none">
          <span className="tracking-tight text-[13px]">{currentTime}</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] font-mono tracking-wider text-slate-400">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">98%</span>
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/80" />
            </div>
          </div>
        </div>

        {/* Dynamic Island */}
        <DynamicIsland
          modality={modality}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          cameraActive={cameraActive}
          onTap={onIslandTap}
        />

        {/* Screen Content */}
        <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
          {children}
        </div>

        {/* Bottom Mobile Home Indicator Bar */}
        <div className="w-full flex justify-center pb-2 pt-1 select-none pointer-events-none">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};
