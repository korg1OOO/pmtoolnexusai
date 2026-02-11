/**
 * Advanced ML Analytics - Type Definitions
 * Provides TypeScript interfaces for ML predictions, model metadata, and training data
 */

// ============================================
// Core Prediction Types
// ============================================

export type PredictionType = 'risk' | 'cost' | 'schedule';
export type RiskCategory = 'financial' | 'schedule' | 'resource';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'increasing' | 'stable' | 'decreasing';
export type MitigationStatus = 'none' | 'planned' | 'in-progress' | 'completed';

// ============================================
// Risk Prediction
// ============================================

export interface RiskFactor {
    id: string;
    title: string;
    description: string;
    category: RiskCategory;
    probability: number; // 0-100
    impact: RiskLevel;
    mitigation_status: MitigationStatus;
    estimated_cost_impact?: number;
    estimated_delay_days?: number;
}

export interface RiskCategoryScore {
    category: RiskCategory;
    score: number; // 0-100
    trend: TrendDirection;
    contributing_factors: string[];
}

export interface RiskPrediction {
    overall_score: number; // 0-200 scale as per user requirements
    risk_level: RiskLevel;
    categories: RiskCategoryScore[];
    risk_factors: RiskFactor[];
    trend: TrendDirection;
    predicted_at: string;
    summary: string;
}

// ============================================
// Cost Forecasting
// ============================================

export interface CostVariance {
    category: string; // e.g., "Labor", "Materials", "Equipment"
    budgeted: number;
    forecast: number;
    variance: number;
    variance_percent: number;
}

export interface CostTimelinePoint {
    date: string; // ISO date
    budgeted: number;
    forecast: number;
    actual?: number;
}

export interface CostForecast {
    total_budget: number;
    total_forecast: number;
    total_variance: number;
    variance_percent: number;
    timeline: CostTimelinePoint[];
    variance_by_category: CostVariance[];
    insights: string[]; // ML-generated insights like "Labor trending over due to worker shortage"
    predicted_completion_cost: number;
    confidence_interval?: {
        lower: number;
        upper: number;
    };
}

// ============================================
// Schedule Delay Prediction
// ============================================

export interface TaskDelayPrediction {
    task_id: string;
    task_name: string;
    planned_duration_days: number;
    predicted_duration_days: number;
    delay_days: number;
    delay_probability: number; // 0-100
    delay_level: RiskLevel;
    delay_factors: string[]; // e.g., "Scope changes", "Coordination delays", "Labor shortage"
    impact_on_critical_path: number; // days of project delay
    is_critical: boolean;
    mitigation_priority: 'low' | 'medium' | 'high';
}

export interface ScheduleDelayPrediction {
    total_planned_days: number;
    total_predicted_days: number;
    total_delay_days: number;
    completion_probability_on_time: number; // 0-100
    task_predictions: TaskDelayPrediction[];
    critical_path_tasks: string[]; // task IDs
    summary: string;
    recommended_actions: string[];
}

// ============================================
// ML Service Response Types
// ============================================

export interface MLPredictionResponse<T> {
    data: T | null;
    error: string | null;
    confidence_score: number;
    prediction_id?: string;
    created_at?: string;
    expires_at?: string;
    from_cache?: boolean;
}

export interface ConfidenceMetadata {
    score: number; // 0-1
    threshold: number; // minimum required confidence
    is_reliable: boolean;
    factors: {
        data_quality: number;
        historical_accuracy: number;
        model_certainty: number;
    };
}

// ============================================
// Database Row Types (matching schema)
// ============================================

export interface MLPredictionRow {
    id: string;
    project_id: string;
    prediction_type: PredictionType;
    prediction_data: RiskPrediction | CostForecast | ScheduleDelayPrediction;
    confidence_score: number;
    created_at: string;
    expires_at: string;
    created_by?: string;
}

export interface MLModelMetadataRow {
    id: string;
    model_type: PredictionType;
    model_version: string;
    algorithm: string;
    accuracy_metrics?: {
        precision?: number;
        recall?: number;
        f1?: number;
        mae?: number; // mean absolute error
        rmse?: number; // root mean square error
    };
    training_date: string;
    training_data_size?: number;
    hyperparameters?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    notes?: string;
}

export interface MLTrainingDataRow {
    id: string;
    project_id: string;
    snapshot_date: string;
    budget?: number;
    actual_spent?: number;
    cost_variance?: number;
    planned_duration_days?: number;
    actual_duration_days?: number;
    schedule_variance_days?: number;
    risk_count: number;
    high_risk_count: number;
    total_tasks: number;
    completed_tasks: number;
    delayed_tasks: number;
    resource_count: number;
    resource_utilization?: number;
    project_status?: string;
    project_health?: string;
    methodology?: string;
    external_factors?: Record<string, unknown>;
    created_at: string;
}

// ============================================
// Utility Types
// ============================================

export interface MLAnalyticsFilters {
    confidence_threshold?: number; // minimum confidence to show predictions
    timeframe?: '6month' | '12month' | 'project_end';
    categories?: RiskCategory[];
    risk_levels?: RiskLevel[];
}

export interface MLAnalyticsState {
    risk_prediction?: MLPredictionResponse<RiskPrediction>;
    cost_forecast?: MLPredictionResponse<CostForecast>;
    schedule_prediction?: MLPredictionResponse<ScheduleDelayPrediction>;
    is_loading: boolean;
    error?: string;
    last_updated?: string;
}
