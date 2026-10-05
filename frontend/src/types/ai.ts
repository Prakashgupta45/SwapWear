import { SwapMatchItem } from './match';

export interface AiPersonalizedRecommendation extends SwapMatchItem {
  isAiRecommended: boolean;
  aiReason: string | null;
  phase6Score?: number;
}

export interface AiRecommendationsResponse {
  success: boolean;
  data: {
    recommendations: AiPersonalizedRecommendation[];
    total: number;
    isAiActive: boolean;
  };
}
