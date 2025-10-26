export interface AnalysisResult {
  description: string;
  keywords: string[];
  phonetics?: { [key: string]: string; };
}

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';
