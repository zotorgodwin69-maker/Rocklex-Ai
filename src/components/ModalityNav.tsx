import React from 'react';
import { Mic, Camera, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { ModalityType } from '../types/assistant';

interface ModalityNavProps {
  activeModality: ModalityType;
  onChangeModality: (modality: ModalityType) => void;
  onOpenSettings: () => void;
  isListening?: boolean;
  cameraActive?: boolean;
}

export const ModalityNav: React.FC<ModalityNavProps> = ({
  activeModality,
  onChangeModality,
  onOpenSettings,
  isListening,
  cameraActive,
}) => {
  const tabs = [
    {
      id: 'voice' as ModalityType,
      label: 'Voice',
      icon: Mic,
      activeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
      indicator: isListening,
    },
    {
      id: 'vision' as ModalityType,
      label: 'Vision',
      icon: Camera,
      activeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      indicator: cameraActive,
    },
    {
      id: 'text' as ModalityType,
      label: 'Chat',
      icon: MessageSquare,
      activeColor: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)]',
    },
  ];

  return (
    <div className="w-full px-4 pb-4 pt-2">
      <div className="relative glass-panel rounded-2xl p-1.5 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-1 flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModality === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeModality(tab.id)}
                className={`flex-1 relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border ${
                  isActive
                    ? `${tab.activeColor} border`
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.indicator && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1.5" />

        {/* Quick Settings Icon */}
        <button
          onClick={onOpenSettings}
          title="ROCKLEX AI Settings"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
