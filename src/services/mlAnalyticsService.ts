/**
 * ML Analytics Service
 * Frontend service layer for interacting with ML prediction Edge Functions
 * Implements caching, error handling, and confidence threshold filtering
 */

import { supabase } from "@/integrations/supabase/client";
import type {
    RiskPrediction,
    CostForecast,
    ScheduleDelayPrediction,
    MLPredictionResponse,
    PredictionType,
} from "@/types/mlAnalytics";

// In-memory cache for predictions (24-hour TTL)
const predictionCache = new Map<string, {
    data: any;
    timestamp: number;
    expiresAt: number;
}>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_CONFIDENCE_THRESHOLD = 0.70;

/**
 * Get a cached prediction if available and not expired
 */
function getCachedPrediction(projectId: string, predictionType: PredictionType): any | null {
    const key = `${projectId}-${predictionType}`;
    const cached = predictionCache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
        return {
            ...cached.data,
            from_cache: true,
        };
    }

    // Clean up expired cache
    if (cached) {
        predictionCache.delete(key);
    }

    return null;
}

/**
 * Store a prediction in the cache
 */
function setCachedPrediction(projectId: string, predictionType: PredictionType, data: any) {
    const key = `${projectId}-${predictionType}`;
    predictionCache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}

/**
 * Clear all cached predictions for a project
 */
export function clearProjectPredictionCache(projectId: string) {
    const keys = Array.from(predictionCache.keys()).filter(k => k.startsWith(projectId));
    keys.forEach(k => predictionCache.delete(k));
}

/**
 * Predict project risks using ML
 */
export async function predictRisks(
    projectId: string,
    options: { useCache?: boolean; confidenceThreshold?: number } = {}
): Promise<MLPredictionResponse<RiskPrediction>> {
    const { useCache = true, confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD } = options;

    try {
        // Check cache first
        if (useCache) {
            const cached = getCachedPrediction(projectId, "risk");
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    confidence_score: cached.confidence_score,
                    from_cache: true,
                };
            }
        }

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke("ml-predict-risks", {
            body: { projectId },
        });

        if (error) {
            throw error;
        }

        // Check confidence threshold
        if (data.confidence_score < confidenceThreshold) {
            return {
                data: null,
                error: `Prediction confidence (${(data.confidence_score * 100).toFixed(1)}%) below threshold (${(confidenceThreshold * 100).toFixed(1)}%)`,
                confidence_score: data.confidence_score,
            };
        }

        // Cache the result
        if (useCache) {
            setCachedPrediction(projectId, "risk", data);
        }

        return {
            data: data as RiskPrediction,
            error: null,
            confidence_score: data.confidence_score,
            prediction_id: data.prediction_id,
            from_cache: data.from_cache || false,
        };
    } catch (err: unknown) {
        const error = err as Error;
        console.error("Error in predictRisks:", error);
        return {
            data: null,
            error: error.message || "Failed to predict risks",
            confidence_score: 0,
        };
    }
}

/**
 * Forecast project costs using ML
 */
export async function forecastCosts(
    projectId: string,
    options: { useCache?: boolean; confidenceThreshold?: number; timeframe?: '6month' | '12month' | 'project_end' } = {}
): Promise<MLPredictionResponse<CostForecast>> {
    const { useCache = true, confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD, timeframe = 'project_end' } = options;

    try {
        // Check cache first
        if (useCache) {
            const cached = getCachedPrediction(projectId, "cost");
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    confidence_score: cached.confidence_score,
                    from_cache: true,
                };
            }
        }

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke("ml-forecast-costs", {
            body: { projectId, timeframe },
        });

        if (error) {
            throw error;
        }

        // Check confidence threshold
        if (data.confidence_score < confidenceThreshold) {
            return {
                data: null,
                error: `Prediction confidence (${(data.confidence_score * 100).toFixed(1)}%) below threshold (${(confidenceThreshold * 100).toFixed(1)}%)`,
                confidence_score: data.confidence_score,
            };
        }

        // Cache the result
        if (useCache) {
            setCachedPrediction(projectId, "cost", data);
        }

        return {
            data: data as CostForecast,
            error: null,
            confidence_score: data.confidence_score,
            prediction_id: data.prediction_id,
            from_cache: data.from_cache || false,
        };
    } catch (err: unknown) {
        const error = err as Error;
        console.error("Error in forecastCosts:", error);
        return {
            data: null,
            error: error.message || "Failed to forecast costs",
            confidence_score: 0,
        };
    }
}

/**
 * Predict schedule delays using ML
 */
export async function predictDelays(
    projectId: string,
    options: { useCache?: boolean; confidenceThreshold?: number } = {}
): Promise<MLPredictionResponse<ScheduleDelayPrediction>> {
    const { useCache = true, confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD } = options;

    try {
        // Check cache first
        if (useCache) {
            const cached = getCachedPrediction(projectId, "schedule");
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    confidence_score: cached.confidence_score,
                    from_cache: true,
                };
            }
        }

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke("ml-predict-delays", {
            body: { projectId },
        });

        if (error) {
            throw error;
        }

        // Check confidence threshold
        if (data.confidence_score < confidenceThreshold) {
            return {
                data: null,
                error: `Prediction confidence (${(data.confidence_score * 100).toFixed(1)}%) below threshold (${(confidenceThreshold * 100).toFixed(1)}%)`,
                confidence_score: data.confidence_score,
            };
        }

        // Cache the result
        if (useCache) {
            setCachedPrediction(projectId, "schedule", data);
        }

        return {
            data: data as ScheduleDelayPrediction,
            error: null,
            confidence_score: data.confidence_score,
            prediction_id: data.prediction_id,
            from_cache: data.from_cache || false,
        };
    } catch (err: unknown) {
        const error = err as Error;
        console.error("Error in predictDelays:", error);
        return {
            data: null,
            error: error.message || "Failed to predict delays",
            confidence_score: 0,
        };
    }
}

/**
 * Get all ML predictions for a project
 */
export async function getAllPredictions(
    projectId: string,
    options: { useCache?: boolean; confidenceThreshold?: number } = {}
): Promise<{
    risk: MLPredictionResponse<RiskPrediction>;
    cost: MLPredictionResponse<CostForecast>;
    schedule: MLPredictionResponse<ScheduleDelayPrediction>;
}> {
    const [risk, cost, schedule] = await Promise.all([
        predictRisks(projectId, options),
        forecastCosts(projectId, options),
        predictDelays(projectId, options),
    ]);

    return { risk, cost, schedule };
}

/**
 * Refresh predictions by bypassing cache
 */
export async function refreshPredictions(projectId: string) {
    clearProjectPredictionCache(projectId);
    return getAllPredictions(projectId, { useCache: false });
}
