import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from './auth.service';
import { Condition, Role } from '@prisma/client';
import {
  ConditionVerificationResult,
  ImageQuality,
  PreCheckConditionInput,
  rawAiConditionResponseSchema,
  RawAiConditionResponse,
  VerificationStatus,
} from '../validations/conditionVerification.validation';

export const CONDITION_RANKS: Record<Condition, number> = {
  NEW: 4,
  LIKE_NEW: 3,
  GOOD: 2,
  FAIR: 1,
};

export const AI_CONDITION_NOTICE =
  'AI-generated estimate based on uploaded images. Final condition depends on user/admin review.';

export function evaluateConditionMismatch(
  declared: Condition,
  estimated: Condition
): {
  mismatch: boolean;
  differenceLevels: number;
  status: VerificationStatus;
} {
  const declaredRank = CONDITION_RANKS[declared] || 2;
  const estimatedRank = CONDITION_RANKS[estimated] || 2;
  const difference = Math.abs(declaredRank - estimatedRank);

  let status: VerificationStatus = 'CONSISTENT';
  let mismatch = false;

  if (difference === 0) {
    status = 'CONSISTENT';
    mismatch = false;
  } else if (difference === 1) {
    status = 'REVIEW_RECOMMENDED';
    mismatch = true;
  } else {
    status = 'MISMATCH_WARNING';
    mismatch = true;
  }

  return {
    mismatch,
    differenceLevels: difference,
    status,
  };
}

// In-memory rate limiting map: listingId -> last analyzed timestamp
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 20_000; // 20 seconds between forced re-analyses

export class ConditionVerificationService {
  /**
   * Verify an existing listing's condition by ID
   */
  static async verifyListing(
    listingId: string,
    requestingUser: { id: string; role: Role },
    force = false
  ): Promise<ConditionVerificationResult> {
    const listing = await prisma.clothingListing.findUnique({
      where: { id: listingId },
      include: {
        images: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    const isOwner = listing.ownerId === requestingUser.id;
    const isAdmin = requestingUser.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to verify this listing', 403);
    }

    if (!listing.images || listing.images.length === 0) {
      throw new AppError('Listing must have at least one uploaded image for condition verification', 400);
    }

    // Cache check: If previously analyzed and not forced, return cached DB assessment
    if (
      !force &&
      listing.aiVerificationStatus &&
      listing.aiVerificationStatus !== 'NOT_ANALYZED' &&
      listing.aiCondition &&
      listing.aiConfidence !== null
    ) {
      const mismatchEval = evaluateConditionMismatch(listing.condition, listing.aiCondition);
      return {
        verificationAvailable: true,
        listingId: listing.id,
        declaredCondition: listing.condition,
        estimatedCondition: listing.aiCondition,
        confidence: listing.aiConfidence,
        visibleIssues: listing.aiVisibleIssues || [],
        imageQuality: (listing.aiImageQuality as ImageQuality) || 'GOOD',
        recommendation:
          listing.aiRecommendation ||
          `Condition appears consistent with ${listing.aiCondition.replace('_', ' ')}.`,
        mismatch: mismatchEval.mismatch,
        differenceLevels: mismatchEval.differenceLevels,
        verificationStatus: (listing.aiVerificationStatus as VerificationStatus) || mismatchEval.status,
        analyzedAt: listing.aiAnalyzedAt ? listing.aiAnalyzedAt.toISOString() : null,
        notice: AI_CONDITION_NOTICE,
      };
    }

    // Rate-limiting check for rapid repeated requests
    const lastCalled = rateLimitCache.get(listing.id);
    const now = Date.now();
    if (lastCalled && now - lastCalled < RATE_LIMIT_COOLDOWN_MS && !isAdmin) {
      // If within cooldown and listing has existing analysis, return existing
      if (listing.aiCondition) {
        const mismatchEval = evaluateConditionMismatch(listing.condition, listing.aiCondition);
        return {
          verificationAvailable: true,
          listingId: listing.id,
          declaredCondition: listing.condition,
          estimatedCondition: listing.aiCondition,
          confidence: listing.aiConfidence,
          visibleIssues: listing.aiVisibleIssues || [],
          imageQuality: (listing.aiImageQuality as ImageQuality) || 'GOOD',
          recommendation: listing.aiRecommendation || 'Using recent verification assessment.',
          mismatch: mismatchEval.mismatch,
          differenceLevels: mismatchEval.differenceLevels,
          verificationStatus: (listing.aiVerificationStatus as VerificationStatus) || mismatchEval.status,
          analyzedAt: listing.aiAnalyzedAt ? listing.aiAnalyzedAt.toISOString() : null,
          notice: AI_CONDITION_NOTICE,
        };
      }
    }

    rateLimitCache.set(listing.id, now);

    // Call AI vision analysis
    const imageUrls = listing.images.map((img) => img.imageUrl);
    const aiOutcome = await this.analyzeImagesWithAi({
      imageUrls,
      declaredCondition: listing.condition,
      title: listing.title,
      category: listing.category,
      brand: listing.brand || undefined,
    });

    const rawAiResult = aiOutcome
      ? 'result' in aiOutcome && aiOutcome.result
        ? aiOutcome.result
        : 'estimatedCondition' in aiOutcome
        ? (aiOutcome as unknown as RawAiConditionResponse)
        : null
      : null;

    if (!rawAiResult) {
      // Graceful fallback if AI is unavailable or fails
      const outcomeErr = (aiOutcome as { error?: string } | undefined)?.error;
      const errorMsg = outcomeErr
        ? `Condition analysis is temporarily unavailable: ${outcomeErr}`
        : 'Condition analysis is temporarily unavailable.';

      return {
        verificationAvailable: false,
        listingId: listing.id,
        declaredCondition: listing.condition,
        estimatedCondition: null,
        confidence: null,
        visibleIssues: [],
        imageQuality: null,
        recommendation: errorMsg,
        mismatch: false,
        differenceLevels: 0,
        verificationStatus: 'FAILED',
        analyzedAt: null,
        notice: AI_CONDITION_NOTICE,
      };
    }

    // Evaluate mismatch comparing user's declared condition vs AI estimate
    const mismatchEval = evaluateConditionMismatch(listing.condition, rawAiResult.estimatedCondition);

    // Persist verified results to database
    const analyzedAtDate = new Date();
    await prisma.clothingListing.update({
      where: { id: listing.id },
      data: {
        aiCondition: rawAiResult.estimatedCondition,
        aiConfidence: rawAiResult.confidence,
        aiVerificationStatus: mismatchEval.status,
        aiVisibleIssues: rawAiResult.visibleIssues,
        aiImageQuality: rawAiResult.imageQuality,
        aiRecommendation: rawAiResult.recommendation,
        aiAnalyzedAt: analyzedAtDate,
      },
    });

    return {
      verificationAvailable: true,
      listingId: listing.id,
      declaredCondition: listing.condition,
      estimatedCondition: rawAiResult.estimatedCondition,
      confidence: rawAiResult.confidence,
      visibleIssues: rawAiResult.visibleIssues,
      imageQuality: rawAiResult.imageQuality,
      recommendation: rawAiResult.recommendation,
      mismatch: mismatchEval.mismatch,
      differenceLevels: mismatchEval.differenceLevels,
      verificationStatus: mismatchEval.status,
      analyzedAt: analyzedAtDate.toISOString(),
      notice: AI_CONDITION_NOTICE,
    };
  }

  /**
   * Pre-check condition verification for a new listing before database creation
   */
  static async preCheckCondition(
    input: PreCheckConditionInput
  ): Promise<ConditionVerificationResult> {
    const aiOutcome = await this.analyzeImagesWithAi({
      imageUrls: [input.imageUrl],
      declaredCondition: input.declaredCondition,
      title: input.title,
      category: input.category,
      brand: input.brand,
    });

    const rawAiResult = aiOutcome
      ? 'result' in aiOutcome && aiOutcome.result
        ? aiOutcome.result
        : 'estimatedCondition' in aiOutcome
        ? (aiOutcome as unknown as RawAiConditionResponse)
        : null
      : null;

    if (!rawAiResult) {
      const preErr = (aiOutcome as { error?: string } | undefined)?.error;
      const errorMsg = preErr
        ? `Condition analysis is temporarily unavailable: ${preErr}`
        : 'Condition analysis is temporarily unavailable.';

      return {
        verificationAvailable: false,
        declaredCondition: input.declaredCondition,
        estimatedCondition: null,
        confidence: null,
        visibleIssues: [],
        imageQuality: null,
        recommendation: errorMsg,
        mismatch: false,
        differenceLevels: 0,
        verificationStatus: 'FAILED',
        analyzedAt: null,
        notice: AI_CONDITION_NOTICE,
      };
    }

    const mismatchEval = evaluateConditionMismatch(input.declaredCondition, rawAiResult.estimatedCondition);

    return {
      verificationAvailable: true,
      declaredCondition: input.declaredCondition,
      estimatedCondition: rawAiResult.estimatedCondition,
      confidence: rawAiResult.confidence,
      visibleIssues: rawAiResult.visibleIssues,
      imageQuality: rawAiResult.imageQuality,
      recommendation: rawAiResult.recommendation,
      mismatch: mismatchEval.mismatch,
      differenceLevels: mismatchEval.differenceLevels,
      verificationStatus: mismatchEval.status,
      analyzedAt: new Date().toISOString(),
      notice: AI_CONDITION_NOTICE,
    };
  }

  /**
   * Get cached verification status for a listing
   */
  static async getListingVerification(
    listingId: string
  ): Promise<ConditionVerificationResult> {
    const listing = await prisma.clothingListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (!listing.aiCondition || listing.aiConfidence === null) {
      return {
        verificationAvailable: false,
        listingId: listing.id,
        declaredCondition: listing.condition,
        estimatedCondition: null,
        confidence: null,
        visibleIssues: [],
        imageQuality: null,
        recommendation: 'Listing has not been analyzed yet.',
        mismatch: false,
        differenceLevels: 0,
        verificationStatus: 'NOT_ANALYZED',
        analyzedAt: null,
        notice: AI_CONDITION_NOTICE,
      };
    }

    const mismatchEval = evaluateConditionMismatch(listing.condition, listing.aiCondition);

    return {
      verificationAvailable: true,
      listingId: listing.id,
      declaredCondition: listing.condition,
      estimatedCondition: listing.aiCondition,
      confidence: listing.aiConfidence,
      visibleIssues: listing.aiVisibleIssues || [],
      imageQuality: (listing.aiImageQuality as ImageQuality) || 'GOOD',
      recommendation:
        listing.aiRecommendation ||
        `Condition appears consistent with ${listing.aiCondition.replace('_', ' ')}.`,
      mismatch: mismatchEval.mismatch,
      differenceLevels: mismatchEval.differenceLevels,
      verificationStatus: (listing.aiVerificationStatus as VerificationStatus) || mismatchEval.status,
      analyzedAt: listing.aiAnalyzedAt ? listing.aiAnalyzedAt.toISOString() : null,
      notice: AI_CONDITION_NOTICE,
    };
  }

  /**
   * Call AI Provider (Gemini 1.5 Flash or OpenAI) with multimodal image input
   */
  private static async analyzeImagesWithAi(params: {
    imageUrls: string[];
    declaredCondition: Condition;
    title?: string;
    category?: string;
    brand?: string;
  }): Promise<{ result?: RawAiConditionResponse; error?: string }> {
    const apiKey = env.AI_API_KEY?.trim();
    if (!apiKey) {
      return { error: 'AI provider key is not configured in backend/.env (AI_API_KEY is empty).' };
    }

    const provider = (env.AI_PROVIDER || 'gemini').toLowerCase();
    const model = env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash');

    // Download first available image to send as multimodal inlineData
    const primaryUrl = params.imageUrls[0];
    let imageBase64: string | null = null;
    let mimeType = 'image/jpeg';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const imgRes = await fetch(primaryUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuf).toString('base64');
        const headerType = imgRes.headers.get('content-type');
        if (headerType && headerType.startsWith('image/')) {
          mimeType = headerType.split(';')[0];
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ConditionVerificationService] Notice fetching image ${primaryUrl}:`, msg);
      // Even if image fetch fails, we will attempt URL or return null
    }

    const systemPrompt = `You are the SwapWear Fashion Quality & Condition Assessment Assistant.
Analyze clothing photos to assess garment condition, image quality, and visible wear.

ALLOWED CONDITION LEVELS:
- NEW: Completely unused, pristine, original tags attached, zero wear.
- LIKE_NEW: Mint condition, worn 1-2 times, no visible pilling, fading, stains, or damage.
- GOOD: Lightly worn, minor normal wear, faint fabric softening, fully functional.
- FAIR: Visible wear, slight pilling, minor fabric thinning, fading, or minor flaws.

ALLOWED IMAGE QUALITY:
- GOOD: Clear, well-lit, clothing details sharply visible.
- FAIR: Acceptable lighting, slight blur or shadows but garment can be judged.
- POOR: Very blurry, excessively dark, clothing heavily obstructed or unrecognizable.

CRITICAL RULES:
1. NEVER guess or invent defects that are not clearly visible.
2. If image quality is POOR, set imageQuality to "POOR" and recommendation to "Please upload a clearer photo showing the full garment."
3. Output strictly valid minified JSON conforming to this schema:
{"estimatedCondition":"NEW"|"LIKE_NEW"|"GOOD"|"FAIR","confidence":number_between_0_and_100,"visibleIssues":["short issue 1"],"imageQuality":"GOOD"|"FAIR"|"POOR","recommendation":"concise assessment under 200 chars"}
4. Do NOT output markdown backticks or conversational text. Return raw JSON only.`;

    const userPromptText = JSON.stringify({
      title: params.title || 'Clothing Item',
      category: params.category || 'Apparel',
      brand: params.brand || 'Standard',
      sellerDeclaredCondition: params.declaredCondition,
      imageCount: params.imageUrls.length,
    });

    try {
      let rawText = '';
      if (provider === 'openai') {
        rawText = await this.callOpenAiVision(apiKey, model, systemPrompt, userPromptText, primaryUrl);
      } else {
        rawText = await this.callGeminiVision(apiKey, model, systemPrompt, userPromptText, imageBase64, mimeType);
      }

      if (!rawText) return { error: 'No response received from AI model.' };

      let cleanedJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const firstBrace = cleanedJson.indexOf('{');
      const lastBrace = cleanedJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleanedJson);
      const validated = rawAiConditionResponseSchema.safeParse(parsed);

      if (!validated.success) {
        console.warn('[ConditionVerificationService] AI response failed schema validation:', validated.error.issues);
        return { error: 'AI response failed schema format validation.' };
      }

      return {
        result: {
          estimatedCondition: validated.data.estimatedCondition,
          confidence: Math.max(0, Math.min(100, Math.round(validated.data.confidence))),
          visibleIssues: validated.data.visibleIssues.slice(0, 5).map((iss) => iss.slice(0, 150)),
          imageQuality: validated.data.imageQuality,
          recommendation: validated.data.recommendation.slice(0, 250),
        },
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[ConditionVerificationService] AI analysis failed safely:`, msg);
      let userFriendlyReason = 'Condition analysis is temporarily unavailable.';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        userFriendlyReason = "Invalid Google AI API Key. Google Gemini API keys must start with 'AIzaSy' from Google AI Studio.";
      } else if (msg.includes('404')) {
        userFriendlyReason = "Gemini model error (404). Please ensure the API key has access to Gemini 1.5 Flash in Google AI Studio.";
      }
      return { error: userFriendlyReason };
    }
  }

  /**
   * Multimodal Gemini Vision Call
   */
  private static async callGeminiVision(
    apiKey: string,
    requestedModel: string,
    systemPrompt: string,
    userPrompt: string,
    imageBase64: string | null,
    mimeType: string
  ): Promise<string> {
    const candidateModels = [
      requestedModel,
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.7-flash',
      'gemini-pro-latest',
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const parts: Array<Record<string, unknown>> = [{ text: `${systemPrompt}\n\nItem Data:\n${userPrompt}` }];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        });
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorBody = await res.text();
          console.warn(`[ConditionVerificationService] Model ${model} returned HTTP ${res.status}: ${errorBody.slice(0, 150)}`);
          lastError = new Error(`Gemini HTTP ${res.status}: ${errorBody.slice(0, 150)}`);
          continue;
        }

        const json = await res.json();
        const resParts = json?.candidates?.[0]?.content?.parts || [];
        const content = resParts.map((p: { text?: string }) => p.text || '').join('').trim();
        return content || '';
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ConditionVerificationService] Model ${model} failed: ${lastError.message}`);
        continue;
      }
    }

    throw lastError || new Error('No available Gemini model could process the request');
  }

  /**
   * OpenAI Multimodal Vision Call
   */
  private static async callOpenAiVision(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    imageUrl: string
  ): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`OpenAI HTTP ${res.status}: ${errorBody.slice(0, 200)}`);
      }

      const json = await res.json();
      return json?.choices?.[0]?.message?.content || '';
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
