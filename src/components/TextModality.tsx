import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  Mic,
  Copy,
  Check,
  Volume2,
  Trash2,
  Image as ImageIcon,
  X,
  Code,
  CornerDownLeft,
} from 'lucide-react';
import { ChatMessage, VoicePersona } from '../types/assistant';

interface TextModalityProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, image?: string) => Promise<void>;
  isThinking: boolean;
  onReadAloud: (text: string) => void;
  onClearMessages: () => void;
  voicePersona: VoicePersona;
  onStartSpeechDictation?: () => void;
  isListening?: boolean;
}

export const TextModality: React.FC<TextModalityProps> = ({
  messages,
  onSendMessage,
  isThinking,
  onReadAloud,
  onClearMessages,
  voicePersona,
  onStartSpeechDictation,
  isListening,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const starterChips = [
    'Explain how neural attention works',
    'Write a TypeScript rate limiter utility',
    'Summarize key AI trends in 2026',
    'Draft a crisp product launch email',
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!inputText.trim() && !attachedImage) return;
    onSendMessage(inputText.trim(), attachedImage || undefined);
    setInputText('');
    setAttachedImage(null);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper to render markdown-like formatting (code blocks, bold, headers)
  const renderFormattedText = (rawText: string) => {
    const parts = rawText.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].match(/^[a-z0-9_-]+$/i) ? lines[0] : '';
        const codeContent = language ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div
            key={index}
            className="my-2 rounded-xl overflow-hidden bg-black/60 border border-white/10 font-mono text-[11px]"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-slate-400">
              <span className="text-[10px] uppercase text-cyan-400">{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-emerald-300">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Simple inline bold and line break formatting
      const lines = part.split('\n');
      return (
        <span key={index}>
          {lines.map((line, lIndex) => {
            const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((subPart, sIndex) => {
              if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return (
                  <strong key={sIndex} className="font-bold text-white">
                    {subPart.slice(2, -2)}
                  </strong>
                );
              }
              if (subPart.startsWith('`') && subPart.endsWith('`')) {
                return (
                  <code key={sIndex} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-cyan-300 text-[11px]">
                    {subPart.slice(1, -1)}
                  </code>
                );
              }
              return subPart;
            });

            return (
              <React.Fragment key={lIndex}>
                {formattedLine}
                {lIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden cyber-grid">
      {/* Top Bar inside Chat */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide">ROCKLEX Workspace Chat</h2>
            <p className="text-[10px] text-slate-400">Gemini 3.8 Flash Multimodal Reasoning</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearMessages}
            title="Clear conversation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Welcome to ROCKLEX AI</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Communicate across text, vision attachments, or spoken audio with high-precision reasoning.
            </p>
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              {starterChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(chip)}
                  className="p-2 rounded-xl glass-pill text-left text-xs text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all truncate"
                >
                  "{chip}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}
              >
                {/* Attached Image Thumbnail */}
                {msg.image && (
                  <div className="mb-1.5 rounded-xl overflow-hidden border border-white/10 max-w-[220px] shadow-lg">
                    <img src={msg.image} alt="Attachment" className="w-full h-auto object-cover max-h-36" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[86%] rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm'
                      : 'glass-panel-elevated text-slate-200 rounded-tl-sm border border-white/10'
                  }`}
                >
                  <div>{renderFormattedText(msg.text)}</div>

                  {/* Actions footer for Assistant messages */}
                  {!isUser && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="text-cyan-400">ROCKLEX 3.8</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copy text"
                          className="hover:text-white transition-colors flex items-center gap-0.5"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => onReadAloud(msg.text)}
                          title="Read aloud with Gemini TTS"
                          className="hover:text-cyan-300 transition-colors flex items-center gap-0.5"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 glass-panel rounded-2xl px-3.5 py-2.5 w-fit border border-cyan-500/20 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="font-medium animate-pulse">ROCKLEX is formulating thought...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview (if user selected image before sending) */}
      {attachedImage && (
        <div className="px-4 py-2 border-t border-white/5 bg-black/40 flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-cyan-500/50">
            <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white hover:bg-rose-500"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
          <span className="text-[11px] text-slate-300">Image attached. Ask ROCKLEX to analyze it.</span>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
        <div className="relative flex items-center gap-1.5">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white hover:border-cyan-500/30 transition-colors shrink-0"
            title="Attach Image"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Speech Dictation Button */}
          {onStartSpeechDictation && (
            <button
              onClick={onStartSpeechDictation}
              className={`p-2.5 rounded-xl glass-panel transition-colors shrink-0 ${
                isListening
                  ? 'text-rose-400 border-rose-500/50 bg-rose-500/20 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:border-indigo-500/30'
              }`}
              title="Voice Dictate"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Text Area / Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask ROCKLEX anything or attach an image..."
            className="flex-1 px-3.5 py-2.5 rounded-xl glass-panel text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-white/10"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() && !attachedImage}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-40 transition-all shrink-0 shadow-md"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
