import React from 'react';
import {
  X,
  Volume2,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  CheckCircle,
} from 'lucide-react';
import { AssistantSettings, VoicePersona } from '../types/assistant';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssistantSettings;
  onSaveSettings: (settings: AssistantSettings) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const voices: { id: VoicePersona; label: string; desc: string }[] = [
    { id: 'Zephyr', label: 'Zephyr', desc: 'Crisp, articulate, dynamic modern voice' },
    { id: 'Kore', label: 'Kore', desc: 'Warm, natural, pleasant conversational tone' },
    { id: 'Puck', label: 'Puck', desc: 'Lively, curious, enthusiastic personality' },
    { id: 'Fenrir', label: 'Fenrir', desc: 'Deep, resonant, calm masculine presence' },
    { id: 'Charon', label: 'Charon', desc: 'Authoritative, precise, analytical delivery' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel-elevated rounded-3xl p-5 border border-white/15 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ROCKLEX Engine Settings</h3>
              <p className="text-[10px] text-slate-400">Configure assistant behavior & modalities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voice Persona Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            Active Voice Persona (Gemini 3.8 Flash-Lite TTS)
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {voices.map((v) => (
              <button
                key={v.id}
                onClick={() => onSaveSettings({ ...settings, voicePersona: v.id })}
                className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                  settings.voicePersona === v.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{v.label}</div>
                  <div className="text-[10px] text-slate-400">{v.desc}</div>
                </div>
                {settings.voicePersona === v.id && (
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <div className="text-xs font-medium text-slate-200">Auto-Speak Voice Replies</div>
              <div className="text-[10px] text-slate-400">Play spoken audio automatically</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeakResponse}
              onChange={(e) =>
                onSaveSettings({ ...settings, autoSpeakResponse: e.target.checked })
              }
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <div className="text-xs font-medium text-slate-200">Synthesized UI Chimes</div>
              <div className="text-[10px] text-slate-400">Tactile acoustic feedback on actions</div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) =>
                onSaveSettings({ ...settings, soundEffects: e.target.checked })
              }
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* System Prompt Customization */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Custom Persona & System Directive
          </label>
          <textarea
            rows={3}
            value={settings.systemInstruction}
            onChange={(e) =>
              onSaveSettings({ ...settings, systemInstruction: e.target.value })
            }
            className="w-full p-2.5 rounded-xl glass-panel text-xs text-slate-200 border border-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            placeholder="Define ROCKLEX AI's tone or persona..."
          />
        </div>

        {/* Telemetry & Architecture Badges */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1.5 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <span>CORE INTELLIGENCE</span>
            <span className="text-cyan-400 font-semibold">gemini-3.8-flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span>VOICE SYNTHESIS</span>
            <span className="text-purple-400 font-semibold">gemini-3.8-flash-lite-tts</span>
          </div>
          <div className="flex items-center justify-between">
            <span>AUDIO TRANSCRIPTION</span>
            <span className="text-emerald-400 font-semibold">gemini-3.5-transcribe</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            onClick={onResetDefaults}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
