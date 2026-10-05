"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const env_1 = require("../config/env");
const aiRecommendation_validation_1 = require("../validations/aiRecommendation.validation");
class AiService {
    /**
     * Request structured AI recommendations from configured provider
     * Returns validated AiRecommendationResponse or null if AI is disabled or fails
     */
    static async getPersonalizedRanking(payload) {
        const apiKey = env_1.env.AI_API_KEY?.trim();
        if (!apiKey) {
            // AI provider key is not configured; caller will fallback to Phase 6
            return null;
        }
        const provider = (env_1.env.AI_PROVIDER || 'gemini').toLowerCase();
        const model = env_1.env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');
        const systemPrompt = `You are the SwapWear AI Fashion Matching Assistant.
Your task is to analyze candidate clothing listings and rank their swap compatibility for this specific user.

CRITICAL RULES:
1. Base evaluations ONLY on the supplied data: value parity, category outfit pairing, size match, condition, location proximity, and verified swap history.
2. DO NOT invent or assume user preferences, past purchases, or brand tastes that are not in the input.
3. Every reason MUST be concise, professional, factual, and strictly under 150 characters.
4. Return ONLY valid, minified JSON adhering strictly to this schema:
{"recommendations":[{"listingId":"string","score":number_between_0_and_100,"reason":"string"}]}
5. Do NOT output markdown code blocks, backticks, or any conversational text. Return raw JSON only.`;
        const userPrompt = JSON.stringify({
            userProfile: payload.userProfile,
            userClosetItems: payload.userItems,
            recentSwapActivity: payload.swapHistorySummary,
            candidates: payload.candidateListings,
        });
        try {
            let rawResponseText = '';
            if (provider === 'openai') {
                rawResponseText = await this.callOpenAi(apiKey, model, systemPrompt, userPrompt);
            }
            else {
                // Default to Google Gemini
                rawResponseText = await this.callGemini(apiKey, model, systemPrompt, userPrompt);
            }
            if (!rawResponseText) {
                return null;
            }
            // Clean markdown code blocks if the model included any
            const cleanedJson = rawResponseText
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
            const parsed = JSON.parse(cleanedJson);
            const validated = aiRecommendation_validation_1.aiRecommendationResponseSchema.safeParse(parsed);
            if (!validated.success) {
                console.warn('[AiService] AI response failed schema validation:', validated.error.issues);
                return null;
            }
            // Filter recommendations to ensure listingIds belong strictly to candidateListings
            const validCandidateIds = new Set(payload.candidateListings.map((c) => c.id));
            const sanitizedRecommendations = validated.data.recommendations
                .filter((rec) => validCandidateIds.has(rec.listingId))
                .map((rec) => ({
                listingId: rec.listingId,
                score: Math.max(0, Math.min(100, Math.round(rec.score))),
                reason: rec.reason.slice(0, 150),
            }));
            return { recommendations: sanitizedRecommendations };
        }
        catch (error) {
            const errMessage = error instanceof Error ? error.message : 'Unknown AI request error';
            console.warn(`[AiService] Request to AI provider (${provider}) failed safely: ${errMessage}`);
            return null;
        }
    }
    /**
     * Call Google Gemini API
     */
    static async callGemini(apiKey, model, systemPrompt, userPrompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        {
                            parts: [{ text: userPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: 'application/json',
                    },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`Gemini HTTP ${res.status}: ${errorBody.slice(0, 200)}`);
            }
            const json = await res.json();
            const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            return content || '';
        }
        catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
    /**
     * Call OpenAI-compatible Chat Completions API
     */
    static async callOpenAi(apiKey, model, systemPrompt, userPrompt) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
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
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.2,
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
        }
        catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
}
exports.AiService = AiService;
