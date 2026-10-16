import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  Sparkles,
  Zap,
  FileText,
  Scan,
  Code2,
  Image as ImageIcon,
  Send,
  Volume2,
  VolumeX,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VisionAnalysisMode, VoicePersona } from '../types/assistant';
import { VISION_PRESETS } from '../data/visionPresets';

interface VisionModalityProps {
  onInspectImage: (params: {
    image: string;
    mode: VisionAnalysisMode;
    prompt?: string;
    voiceReply?: boolean;
  }) => Promise<void>;
  isAnalyzing: boolean;
  lastAnalysis: {
    text: string;
    mode: VisionAnalysisMode;
    audioBase64?: string | null;
  } | null;
  voicePersona: VoicePersona;
  onSendToChat: (text: string, image: string) => void;
  onCameraActiveChange: (active: boolean) => void;
}

export const VisionModality: React.FC<VisionModalityProps> = ({
  onInspectImage,
  isAnalyzing,
  lastAnalysis,
  voicePersona,
  onSendToChat,
  onCameraActiveChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [visionMode, setVisionMode] = useState<VisionAnalysisMode>('scene');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [voiceCommentary, setVoiceCommentary] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Vision mode descriptions & icons
  const modeOptions: { id: VisionAnalysisMode; label: string; icon: any; hint: string }[] = [
    { id: 'scene', label: 'Scene Intel', icon: Scan, hint: 'Context & environment' },
    { id: 'document', label: 'Document/OCR', icon: FileText, hint: 'Text & tables' },
    { id: 'detect', label: 'Object Specs', icon: Layers, hint: 'Hardware & gear' },
    { id: 'code', label: 'Code & Screen', icon: Code2, hint: 'Syntax & debug' },
  ];

  // Start real camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setSelectedPreset(null);
        setCapturedImage(null);
        onCameraActiveChange(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera stream unavailable. You can use sample presets or upload photos.');
      setStreamActive(false);
      onCameraActiveChange(false);
      // Auto-fallback to first preset for instant delightful experience
      if (!capturedImage) {
        selectPreset(VISION_PRESETS[0].id);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    onCameraActiveChange(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Capture frame from active video
  const captureFrame = (): string | null => {
    if (capturedImage) return capturedImage;

    const video = videoRef.current;
    if (!video || !streamActive) return null;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl;
  };

  // Handle snap and analyze trigger
  const handleSnapAndAnalyze = async (promptOverride?: string) => {
    let imageToAnalyze = capturedImage;

    if (!imageToAnalyze && streamActive) {
      imageToAnalyze = captureFrame();
      if (imageToAnalyze) {
        setCapturedImage(imageToAnalyze);
      }
    }

    if (!imageToAnalyze && selectedPreset) {
      const preset = VISION_PRESETS.find((p) => p.id === selectedPreset);
      if (preset) {
        imageToAnalyze = preset.imageUrl;
      }
    }

    if (!imageToAnalyze) {
      setCameraError('Please capture a frame, select a preset, or upload an image.');
      return;
    }

    await onInspectImage({
      image: imageToAnalyze,
      mode: visionMode,
      prompt: promptOverride || customPrompt.trim() || undefined,
      voiceReply: voiceCommentary,
    });
  };

  // Switch to preset
  const selectPreset = (presetId: string) => {
    stopCamera();
    const preset = VISION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset.id);
      setCapturedImage(preset.imageUrl);
      setCameraError(null);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      stopCamera();
      setSelectedPreset(null);
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 py-2 cyber-grid">
      {/* Top HUD Bar */}
      <div className="flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                ROCKLEX Vision Lens
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Multimodal 3.8
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Real-time scene analysis & visual perception</p>
            </div>
          </div>

          {/* Voice Commentary Toggle */}
          <button
            onClick={() => setVoiceCommentary(!voiceCommentary)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border flex items-center gap-1.5 ${
              voiceCommentary
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="Auto-speak visual observations"
          >
            {voiceCommentary ? <Volume2 className="w-3 h-3 text-purple-400" /> : <VolumeX className="w-3 h-3" />}
            <span>Voice Intel</span>
          </button>
        </div>

        {/* Vision Mode Selectors */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {modeOptions.map((m) => {
            const Icon = m.icon;
            const isSelected = visionMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setVisionMode(m.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-1" />
                <span className="text-[10px] font-semibold leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewfinder / Lens Feed */}
      <div className="relative my-2 w-full h-[240px] sm:h-[270px] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl flex items-center justify-center">
        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            streamActive && !capturedImage ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />

        {/* Captured or Preset Image Display */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Viewfinder snapshot"
            className="w-full h-full object-cover animate-in fade-in duration-200"
          />
        )}

        {/* Hidden Canvas for Frame Grab */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Cybernetic HUD Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
          {/* Top HUD Telemetry */}
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${streamActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {streamActive ? 'FEED: LIVE 30FPS' : capturedImage ? 'STATIC SNAPSHOT' : 'STANDBY'}
            </span>
            <span className="uppercase text-cyan-300 font-semibold">{visionMode} MODE</span>
          </div>

          {/* Center Target Crosshairs */}
          <div className="relative w-full flex items-center justify-center">
            <div className="w-24 h-24 border border-cyan-400/30 rounded-lg flex items-center justify-center relative">
              <div className="w-2 h-2 border-t-2 border-l-2 border-cyan-400 absolute -top-1 -left-1" />
              <div className="w-2 h-2 border-t-2 border-r-2 border-cyan-400 absolute -top-1 -right-1" />
              <div className="w-2 h-2 border-b-2 border-l-2 border-cyan-400 absolute -bottom-1 -left-1" />
              <div className="w-2 h-2 border-b-2 border-r-2 border-cyan-400 absolute -bottom-1 -right-1" />
              <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full" />
            </div>

            {/* Scanning radar line when analyzing */}
            {isAnalyzing && (
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
            )}
          </div>

          {/* Bottom HUD controls within camera viewfinder */}
          <div className="flex items-center justify-between pointer-events-auto">
            {/* Flip Camera */}
            <button
              onClick={() => {
                setCapturedImage(null);
                setFacingMode(facingMode === 'user' ? 'environment' : 'user');
              }}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/10"
              title="Flip Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Presets & Upload Picker */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="px-2 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-mono text-cyan-300 hover:text-white border border-white/10 flex items-center gap-1"
              >
                <Layers className="w-3 h-3" />
                <span>Presets</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/10"
                title="Upload Photo"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        {/* Camera error / Fallback banner */}
        {cameraError && !capturedImage && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs text-slate-300 mb-3 max-w-xs">{cameraError}</p>
            <button
              onClick={() => selectPreset(VISION_PRESETS[0].id)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400"
            >
              Load Preset Scene
            </button>
          </div>
        )}
      </div>

      {/* Preset drawer modal / popover */}
      {showPresets && (
        <div className="mb-2 p-2.5 glass-panel rounded-2xl border border-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
            <span>Select Optical Benchmark Preset:</span>
            <button onClick={() => setShowPresets(false)} className="text-[10px] text-slate-400 hover:text-white">
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {VISION_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  selectPreset(p.id);
                  setShowPresets(false);
                }}
                className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                  selectedPreset === p.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <img src={p.imageUrl} alt={p.title} className="w-8 h-8 rounded-lg object-cover" />
                <div className="overflow-hidden">
                  <div className="text-[11px] font-medium text-slate-200 truncate">{p.title}</div>
                  <div className="text-[9px] text-cyan-400 font-mono truncate">{p.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Output Drawer */}
      {lastAnalysis && (
        <div className="mb-2 glass-panel-elevated rounded-2xl p-3 max-h-36 overflow-y-auto border border-cyan-500/20">
          <div className="flex items-center justify-between text-[11px] text-cyan-400 mb-1.5 font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> ROCKLEX Perception: {lastAnalysis.mode.toUpperCase()}
            </span>
            <button
              onClick={() => {
                const img = capturedImage || (selectedPreset ? VISION_PRESETS.find(p => p.id === selectedPreset)?.imageUrl : null);
                if (img) {
                  onSendToChat(`Visual observation from camera: ${lastAnalysis.text}`, img);
                }
              }}
              className="text-[10px] text-indigo-300 hover:text-indigo-200 underline"
            >
              Export to Chat
            </button>
          </div>
          <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {lastAnalysis.text}
          </p>
        </div>
      )}

      {/* Action / Capture Controls */}
      <div className="flex flex-col gap-2 z-10">
        {/* Custom Question / Query input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSnapAndAnalyze();
            }}
            placeholder={`Ask ROCKLEX about this view (e.g. "What is this?")`}
            className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-panel text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-white/10"
          />
          <button
            onClick={() => handleSnapAndAnalyze()}
            disabled={isAnalyzing}
            className="absolute right-1.5 p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Primary Snap & Inspect Trigger */}
        <div className="flex items-center justify-center pt-1">
          <button
            onClick={() => handleSnapAndAnalyze()}
            disabled={isAnalyzing}
            className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold tracking-wide transition-all duration-200 shadow-xl ${
              isAnalyzing
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-95 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>ROCKLEX Optical Engine Analyzing Frame...</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>Inspect Current Frame</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
