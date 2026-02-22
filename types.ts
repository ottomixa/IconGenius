export interface IconData {
  id: string;
  prompt: string;
  originalPrompt: string;
  base64Data: string;
  createdAt: number;
  size: '1K' | '2K';
}

export interface PromptEnhancementResponse {
  refinedPrompt: string;
  suggestedSize: '1K' | '2K';
  styleDescription: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ENHANCING_PROMPT = 'ENHANCING_PROMPT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ModelTier = 'free' | 'pro';
export type IconType = 'standard' | 'chrome_extension';

export interface AppSettings {
  modelTier: ModelTier;
  iconType: IconType;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
