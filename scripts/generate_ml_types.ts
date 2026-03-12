/**
 * Generate TypeScript types from database schema
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read DATABASE_URL from project root .env file
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
    console.error('❌ Error: DATABASE_URL not found in .env');
    process.exit(1);
}

const connectionString = dbUrlMatch[1];

async function generateTypes() {
    const client = new Client({ connectionString });

    try {
        console.log('🔌 Connecting to database...\n');
        await client.connect();
        console.log('✅ Connected!\n');

        console.log('📋 Querying ML table schemas...\n');

        // Get columns for ml_predictions
        const mlPredictions = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ml_predictions' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

        // Get columns for ml_model_metadata
        const mlModelMetadata = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ml_model_metadata' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

        // Get columns for ml_training_data
        const mlTrainingData = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ml_training_data' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

        console.log('✅ Schema loaded for all 3 tables\n');
        console.log('📝 Generating types...\n');

        // Read existing types file
        const typesPath = join(__dirname, '../src/integrations/supabase/types.ts');
        let existingTypes = readFileSync(typesPath, 'utf-8');

        // Generate new type definitions
        const mlTypesAddition = `
    ml_predictions: {
      Row: {
        id: string;
        project_id: string;
        prediction_type: string;
        prediction_data: Json;
        confidence_score: number;
        created_at: string;
        expires_at: string;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        project_id: string;
        prediction_type: string;
        prediction_data: Json;
        confidence_score: number;
        created_at?: string;
        expires_at?: string;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        project_id?: string;
        prediction_type?: string;
        prediction_data?: Json;
        confidence_score?: number;
        created_at?: string;
        expires_at?: string;
        created_by?: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "ml_predictions_project_id_fkey";
          columns: ["project_id"];
          isOneToOne: false;
          referencedRelation: "projects";
          referencedColumns: ["id"];
        }
      ];
    };
   ml_model_metadata: {
      Row: {
        id: string;
        model_type: string;
        model_version: string;
        algorithm: string;
        accuracy_metrics: Json;
        is_active: boolean;
        training_date: string;
        training_data_period_start: string | null;
        training_data_period_end: string | null;
        hyperparameters: Json | null;
        feature_importance: Json | null;
        validation_score: number | null;
        created_at: string;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        model_type: string;
        model_version: string;
        algorithm: string;
        accuracy_metrics: Json;
        is_active?: boolean;
        training_date?: string;
        training_data_period_start?: string | null;
        training_data_period_end?: string | null,
        hyperparameters?: Json | null;
        feature_importance?: Json | null;
        validation_score?: number | null;
        created_at?: string;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        model_type?: string;
        model_version?: string;
        algorithm?: string;
        accuracy_metrics?: Json;
        is_active?: boolean;
        training_date?: string;
        training_data_period_start?: string | null;
        training_data_period_end?: string | null;
        hyperparameters?: Json | null;
        feature_importance?: Json | null;
        validation_score?: number | null;
        created_at?: string;
        created_by?: string | null;
      };
      Relationships: [];
    };
    ml_training_data: {
      Row: {
        id: string;
        project_id: string;
        snapshot_date: string;
        snapshot_data: Json;
        data_quality_score: number;
        created_at: string;
      };
      Insert: {
        id?: string;
        project_id: string;
        snapshot_date?: string;
        snapshot_data: Json;
        data_quality_score: number;
        created_at?: string;
      };
      Update: {
        id?: string;
        project_id?: string;
        snapshot_date?: string;
        snapshot_data?: Json;
        data_quality_score?: number;
        created_at?: string;
      };
      Relationships: [
        {
          foreignKeyName: "ml_training_data_project_id_fkey";
          columns: ["project_id"];
          isOneToOne: false;
          referencedRelation: "projects";
          referencedColumns: ["id"];
        }
      ];
    };`;

        // Find where to insert the types (before the closing of Tables interface)
        const insertPosition = existingTypes.lastIndexOf('user_roles:');
        const userRolesEnd = existingTypes.indexOf('};', insertPosition + 11) + 3;

        const updatedTypes = existingTypes.substring(0, userRolesEnd - 1) + mlTypesAddition + '\n' + existingTypes.substring(userRolesEnd);

        // Write updated types
        writeFileSync(typesPath, updatedTypes, 'utf-8');

        console.log('✅ Types generated and saved to src/integrations/supabase/types.ts\n');
        console.log('🎉 Type generation completed!\n');

    } catch (error: any) {
        console.error('❌ Type generation failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

generateTypes();
