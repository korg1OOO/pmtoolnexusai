/**
 * Generate TypeScript types for retraining tables
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addRetrainingTypes() {
    try {
        console.log('📝 Adding retraining table types...\n');

        // Read existing types file
        const typesPath = join(__dirname, '../src/integrations/supabase/types.ts');
        let existingTypes = readFileSync(typesPath, 'utf-8');

        // Generate new type definitions for retraining tables
        const retrainingTypesAddition = `
    ml_retraining_jobs: {
      Row: {
        id: string;
        model_type: string;
        status: string;
        started_at: string | null;
        completed_at: string | null;
        training_samples_count: number | null;
        new_model_id: string | null;
        accuracy_before: number | null;
        accuracy_after: number | null;
        improvement_percent: number | null;
        error_message: string | null;
        training_config: Json | null;
        created_at: string;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        model_type: string;
        status: string;
        started_at?: string | null;
        completed_at?: string | null;
        training_samples_count?: number | null;
        new_model_id?: string | null;
        accuracy_before?: number | null;
        accuracy_after?: number | null;
        improvement_percent?: number | null;
        error_message?: string | null;
        training_config?: Json | null;
        created_at?: string;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        model_type?: string;
        status?: string;
        started_at?: string | null;
        completed_at?: string | null;
        training_samples_count?: number | null;
        new_model_id?: string | null;
        accuracy_before?: number | null;
        accuracy_after?: number | null;
        improvement_percent?: number | null;
        error_message?: string | null;
        training_config?: Json | null;
        created_at?: string;
        created_by?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "ml_retraining_jobs_new_model_id_fkey";
          columns: ["new_model_id"];
          isOneToOne: false;
          referencedRelation: "ml_model_metadata";
          referencedColumns: ["id"];
        }
      ];
    };
    ml_accuracy_logs: {
      Row: {
        id: string;
        prediction_id: string | null;
        model_id: string | null;
        model_type: string;
        predicted_value: Json;
        actual_value: Json;
        accuracy_score: number | null;
        deviation_percent: number | null;
        is_within_threshold: boolean | null;
        notes: string | null;
        logged_at: string;
        logged_by: string | null;
      };
      Insert: {
        id?: string;
        prediction_id?: string | null;
        model_id?: string | null;
        model_type: string;
        predicted_value: Json;
        actual_value: Json;
        accuracy_score?: number | null;
        deviation_percent?: number | null;
        is_within_threshold?: boolean | null;
        notes?: string | null;
        logged_at?: string;
        logged_by?: string | null;
      };
      Update: {
        id?: string;
        prediction_id?: string | null;
        model_id?: string | null;
        model_type?: string;
        predicted_value?: Json;
        actual_value?: Json;
        accuracy_score?: number | null;
        deviation_percent?: number | null;
        is_within_threshold?: boolean | null;
        notes?: string | null;
        logged_at?: string;
        logged_by?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "ml_accuracy_logs_prediction_id_fkey";
          columns: ["prediction_id"];
          isOneToOne: false;
          referencedRelation: "ml_predictions";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "ml_accuracy_logs_model_id_fkey";
          columns: ["model_id"];
          isOneToOne: false;
          referencedRelation: "ml_model_metadata";
          referencedColumns: ["id"];
        }
      ];
    };
    ml_alerts: {
      Row: {
        id: string;
        model_type: string;
        alert_type: string;
        severity: string;
        title: string;
        message: string;
        metadata: Json | null;
        is_acknowledged: boolean;
        acknowledged_by: string | null;
        acknowledged_at: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        model_type: string;
        alert_type: string;
        severity: string;
        title: string;
        message: string;
        metadata?: Json | null;
        is_acknowledged?: boolean;
        acknowledged_by?: string | null;
        acknowledged_at?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        model_type?: string;
        alert_type?: string;
        severity?: string;
        title?: string;
        message?: string;
        metadata?: Json | null;
        is_acknowledged?: boolean;
        acknowledged_by?: string | null;
        acknowledged_at?: string | null;
        created_at?: string;
      };
      Relationships: [];
    };`;

        // Find where to insert the types (after ml_training_data)
        const insertPosition = existingTypes.indexOf('ml_training_data:');
        const mlTrainingDataEnd = existingTypes.indexOf('};', insertPosition);
        const closingBrace = existingTypes.indexOf('}', mlTrainingDataEnd + 3);

        const updatedTypes = existingTypes.substring(0, closingBrace) + retrainingTypesAddition + '\n' + existingTypes.substring(closingBrace);

        // Write updated types
        writeFileSync(typesPath, updatedTypes, 'utf-8');

        console.log('✅ Types generated and saved to src/integrations/supabase/types.ts\n');
        console.log('🎉 Type generation completed!\n');

    } catch (error: any) {
        console.error('❌ Type generation failed:', error.message);
        process.exit(1);
    }
}

addRetrainingTypes();
