import { VisionPreset } from '../types/assistant';

export const VISION_PRESETS: VisionPreset[] = [
  {
    id: 'tech-gadget',
    title: 'Hardware & Circuitry',
    category: 'Hardware Specs',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    prompt: 'Examine this circuit board. Identify the primary components, bus architecture, and potential applications.',
  },
  {
    id: 'document-receipt',
    title: 'Invoice / Document',
    category: 'Document OCR',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    prompt: 'Extract all line items, totals, dates, and financial metrics into a clean structured table.',
  },
  {
    id: 'architecture-city',
    title: 'Urban Architecture',
    category: 'Scene Analysis',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    prompt: 'Analyze the architectural style, engineering features, lighting conditions, and environment.',
  },
  {
    id: 'code-editor',
    title: 'Code Snippet on Screen',
    category: 'Code Diagnostics',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    prompt: 'Read this code snippet, identify any syntax issues, explain what it does, and optimize it.',
  },
];
