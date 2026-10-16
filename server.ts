import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse JSON with larger limit for base64 camera images/audio
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Shared Gemini AI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_SYSTEM_INSTRUCTION = `You are ROCKLEX AI, an elite, ultra-capable multimodal mobile AI assistant.
You interact fluidly across three distinct modalities: Voice, Vision, and Text.
Your personality is articulate, concise, perceptive, sharp, and helpful.
When responding in Voice mode, keep responses punchy, conversational, and direct (1-3 sentences) so they sound natural when spoken.
When in Text or Vision mode, provide clear markdown formatting, bullet points, code blocks when requested, or detailed visual breakdowns.
Always acknowledge what you see when given an image or camera frame.`;

// Health check endpoint
app.get('/api/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'online',
    assistant: 'ROCKLEX AI',
    configured: hasKey,
    voices: ['Zephyr', 'Kore', 'Puck', 'Fenrir', 'Charon'],
    version: '3.8',
  });
});

// Helper to extract base64 data & mimeType
function parseDataUrl(dataUrlString: string): { mimeType: string; data: string } {
  if (dataUrlString.startsWith('data:')) {
    const matches = dataUrlString.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return { mimeType: matches[1], data: matches[2] };
    }
  }
  return { mimeType: 'image/jpeg', data: dataUrlString };
}

function extractFriendlyError(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'Gemini free-tier request quota reached. Please pause for 15-20 seconds before asking again.';
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
    return 'Gemini is currently experiencing high demand. Please try again in a few moments.';
  }
  return 'Unable to process query at this moment. Please try again shortly.';
}

// Helper to call Gemini with resilient fallback and graceful recovery
async function generateWithFallback(options: {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModel?: string;
}): Promise<any> {
  const primary = options.primaryModel || 'gemini-3.1-flash-lite';
  const fallback = options.fallbackModel || 'gemini-3.8-flash';
  try {
    return await ai.models.generateContent({
      model: primary,
      contents: options.contents,
      config: options.config,
    });
  } catch (err: any) {
    try {
      return await ai.models.generateContent({
        model: fallback,
        contents: options.contents,
        config: options.config,
      });
    } catch (fallbackErr: any) {
      const friendlyNotice = extractFriendlyError(fallbackErr || err);
      return { text: friendlyNotice, isNotice: true };
    }
  }
}

// Helper to generate speech with multi-tier fallback
async function synthesizeSpeech(text: string, voiceName: string = 'Zephyr'): Promise<string | null> {
  try {
    // Sanitize text for TTS (strip excessive markdown/code formatting)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#>-]/g, '')
      .trim();

    if (!cleanText) return null;

    // Truncate to reasonable length for spoken response if too long
    const spokenSlice = cleanText.length > 500 ? cleanText.slice(0, 500) + '...' : cleanText;

    const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

    for (const modelName of ttsModels) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: spokenSlice,
                  speechMetadata: {
                    style: 'Crisp, natural, confident AI voice assistant',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' },
              },
            },
          },
        });

        const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) return audioBase64;
      } catch {
        // Continue to fallback model
      }
    }

    return null;
  } catch {
    return null;
  }
}

// 1. Text & Multimodal Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const {
      prompt,
      messages = [],
      image,
      voiceReply = false,
      voiceName = 'Zephyr',
      systemInstruction = DEFAULT_SYSTEM_INSTRUCTION,
    } = req.body;

    if (!prompt && !image && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Prompt or image is required' });
    }

    // Build contents array for Gemini
    const contents: any[] = [];

    // Append prior conversational messages if provided
    for (const msg of messages) {
      const parts: any[] = [];
      if (msg.image) {
        const parsed = parseDataUrl(msg.image);
        parts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          },
        });
      }
      if (msg.text) {
        parts.push({ text: msg.text });
      }
      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Add current turn
    const currentParts: any[] = [];
    if (image) {
      const parsed = parseDataUrl(image);
      currentParts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
    }
    if (prompt) {
      currentParts.push({ text: prompt });
    } else if (image && currentParts.length === 1) {
      currentParts.push({ text: 'Examine this view closely and tell me what you see, highlighting important details.' });
    }

    if (currentParts.length > 0) {
      contents.push({
        role: 'user',
        parts: currentParts,
      });
    }

    const response = await generateWithFallback({
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModel: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || '';

    // If voice reply requested, synthesize audio
    let audioBase64: string | null = null;
    if (voiceReply && replyText) {
      audioBase64 = await synthesizeSpeech(replyText, voiceName);
    }

    res.json({
      text: replyText,
      audioBase64,
      mimeType: audioBase64 ? 'audio/wav' : null,
    });
  } catch (error: any) {
    const friendly = extractFriendlyError(error);
    res.json({
      text: friendly,
      audioBase64: null,
      mimeType: null,
    });
  }
});

// 2. Vision Real-time Inspection API (Camera viewfinder & snapshots)
app.post('/api/vision-inspect', async (req, res) => {
  try {
    const { image, mode = 'scene', prompt, voiceReply = false, voiceName = 'Zephyr' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const parsed = parseDataUrl(image);

    let specificPrompt = prompt;
    if (!specificPrompt) {
      switch (mode) {
        case 'document':
          specificPrompt =
            'Analyze this document or text. Extract the key heading, main takeaways, transcribe crucial text, and summarize action points in clean markdown.';
          break;
        case 'detect':
          specificPrompt =
            'Identify all key objects, people, products, or elements in this frame. Return a quick categorized list of what you detect with brief positional or descriptive notes.';
          break;
        case 'code':
          specificPrompt =
            'Scan any code, diagram, formula, or UI shown here. Transcribe code accurately and explain bugs or architecture.';
          break;
        case 'scene':
        default:
          specificPrompt =
            'Provide an instant, sharp real-time perception of this camera view. Note the environment, primary subject, interesting anomalies, and offer a relevant smart suggestion.';
          break;
      }
    }

    const response = await generateWithFallback({
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModel: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: parsed.mimeType,
              data: parsed.data,
            },
          },
          {
            text: specificPrompt,
          },
        ],
      },
      config: {
        systemInstruction: `You are ROCKLEX AI's optical vision intelligence engine.
You analyze camera frames with remarkable precision.
Be direct, perceptive, and observant. Format with concise bullets or sections.
If voice commentary is requested, ensure the first paragraph is an punchy 1-2 sentence spoken summary.`,
        temperature: 0.4,
      },
    });

    const replyText = response.text || '';

    let audioBase64: string | null = null;
    if (voiceReply && replyText) {
      audioBase64 = await synthesizeSpeech(replyText, voiceName);
    }

    res.json({
      text: replyText,
      audioBase64,
      mimeType: audioBase64 ? 'audio/wav' : null,
      mode,
    });
  } catch (error: any) {
    const friendly = extractFriendlyError(error);
    res.json({
      text: friendly,
      audioBase64: null,
      mimeType: null,
      mode: req.body?.mode || 'scene',
    });
  }
});

// 3. Dedicated Text-to-Speech API
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Zephyr' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const audioBase64 = await synthesizeSpeech(text, voiceName);
    res.json({
      audioBase64: audioBase64 || null,
      mimeType: audioBase64 ? 'audio/wav' : null,
    });
  } catch (error: any) {
    console.warn('TTS endpoint caught gracefully:', error?.message || error);
    res.json({
      audioBase64: null,
      mimeType: null,
    });
  }
});

// 4. Audio Transcription API (gemini-3.5-transcribe)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: 'Transcribe the spoken words in this audio exactly. Do not add commentary.' },
        ],
      },
    });

    res.json({
      transcript: response.text?.trim() || '',
    });
  } catch (error: any) {
    console.error('Transcribe error:', error);
    res.status(500).json({
      error: error.message || 'Failed to transcribe audio',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ROCKLEX AI Mobile server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
