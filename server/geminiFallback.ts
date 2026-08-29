import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

// Model Fallback Ladder specification
export const MODEL_FALLBACK_LADDER = [
  { model: "gemini-3.6-flash", tier: "Primary" as const, desc: "Ultra-fast primary processing model" },
  { model: "gemini-3.1-flash-lite", tier: "High-Availability Fallback" as const, desc: "Low-latency fallback model" },
  { model: "gemini-flash-latest", tier: "Dynamic Alias" as const, desc: "Auto-routed flash alias" },
  { model: "gemini-3.7-flash", tier: "Deep Reasoning Fallback" as const, desc: "High-intelligence reasoning fallback" },
];

export interface FallbackExecutionResult {
  response: GenerateContentResponse;
  text: string;
  selectedModel: string;
  attempts: {
    model: string;
    tier: string;
    success: boolean;
    latencyMs: number;
    error?: string;
  }[];
}

// Lazy-initialized Gemini client singleton
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Defensive payload sanitizer: strips all undefined values recursively
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value);
      }
    }
    return clean as T;
  }
  return obj;
}

// Resilient Model Fallback Ladder implementation
export async function generateContentWithFallback(
  params: Omit<GenerateContentParameters, "model">,
  simulatedErrorModel?: string
): Promise<FallbackExecutionResult> {
  const ai = getGeminiClient();
  const attempts: FallbackExecutionResult["attempts"] = [];

  let lastError: any = null;

  for (const item of MODEL_FALLBACK_LADDER) {
    const startTime = Date.now();
    try {
      // Optional simulation hook for testing fallback behavior in dev mode
      if (simulatedErrorModel && simulatedErrorModel === item.model) {
        throw new Error(`[SIMULATED_FAILOVER] 503 Service Unavailable on ${item.model}`);
      }

      const response = await ai.models.generateContent({
        ...params,
        model: item.model,
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || "";

      attempts.push({
        model: item.model,
        tier: item.tier,
        success: true,
        latencyMs,
      });

      return {
        response,
        text,
        selectedModel: item.model,
        attempts,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err?.message || String(err);
      lastError = err;

      attempts.push({
        model: item.model,
        tier: item.tier,
        success: false,
        latencyMs,
        error: errorMsg,
      });

      console.warn(`[GEMINI_FALLBACK] Error with model ${item.model} (${item.tier}): ${errorMsg}. Falling back to next model...`);
      // Continue to next model in the fallback ladder
    }
  }

  // If all models in the ladder failed
  throw new Error(
    `All models in the resilient fallback ladder failed. Last error: ${lastError?.message || lastError}. Trace: ${JSON.stringify(
      attempts
    )}`
  );
}
