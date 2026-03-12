
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { projectTemplates } from '../src/data/templateData'; // Direct import from source code is tricky with TS/ESM mixed.
// Better to just inline or parse the file if simple, OR rely on tsx handling imports.
// Since templateData.ts is TS, we need tsx to run this.

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function seed() {
    console.log('Seeding templates...');
    try {
        // Clear existing templates to avoid duplicates (optional, or use UPSERT)
        // await sql`DELETE FROM project_templates`; 

        for (const t of projectTemplates) {
            console.log(`Seeding template: ${t.name}`);

            const {
                id, name, description, category, methodology,
                complexity, icon, color, isActive, createdAt, updatedAt, ...content
            } = t;

            await sql`
        INSERT INTO project_templates (
          id, name, description, category, methodology, 
          complexity, icon, color, content, is_active, created_at, updated_at
        ) VALUES (
          ${id}, ${name}, ${description}, ${category}, ${methodology}, 
          ${complexity}, ${icon}, ${color}, ${sql.json(content)}, ${isActive}, ${createdAt}, ${updatedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          content = EXCLUDED.content,
          updated_at = NOW()
      `;
        }
        console.log('Seeding complete!');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

seed();
