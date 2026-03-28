import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Extracted data shape (mirrors DB schema) ─────────────────────────────────

export interface ExtractedContractTerms {
  contract_value: number;
  currency: string;
  payment_terms_days: number;
  penalty_rate_pct: number;
  penalty_cap_pct: number;
  acceptance_period_days: number;
  key_personnel_review_days: number;
  subcontractor_review_days: number | null;
  training_sessions_target: number;
  training_hours_target: number;
  training_max_per_session: number;
  hypercare_weeks: number;
  governing_reference: string;
  notes: string;
}

export interface ExtractedPerson {
  name: string;
  role: string;
  organisation: 'client' | 'si' | 'other';
  contract_start_date: string | null;
}

export interface ExtractedMilestone {
  name: string;
  due_date: string | null;
  description: string;
  is_critical: boolean;
}

export interface ExtractedAssumption {
  title: string;
  category: string;
  owner_name: string;
  impact_if_wrong: string;
}

export interface ExtractedDependency {
  title: string;
  dependent_on: string;
  provider: string;
  owner_name: string;
  notes: string;
}

export interface ExtractedRisk {
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  owner_name: string;
  mitigation_plan: string;
}

export interface ExtractedContractData {
  contract_terms: ExtractedContractTerms;
  key_personnel: ExtractedPerson[];
  milestones: ExtractedMilestone[];
  assumptions: ExtractedAssumption[];
  dependencies: ExtractedDependency[];
  risks: ExtractedRisk[];
  // Metadata
  si_name: string;
  client_name: string;
  project_name: string;
  summary: string;
}

// ─── Extraction prompt ────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are a contract analysis expert for professional services / ERP implementation programs.

Extract ALL structured data from the provided contract text and return ONLY valid JSON matching this exact schema:

{
  "si_name": "string — Solution Implementer / vendor company name",
  "client_name": "string — Client / customer company name",
  "project_name": "string — Program or project name",
  "summary": "string — 1 sentence summary of what this contract covers",

  "contract_terms": {
    "contract_value": number (0 if not stated / confidential),
    "currency": "USD|AED|GBP|EUR|SAR|INR|SGD|AUD",
    "payment_terms_days": number (days — default 30),
    "penalty_rate_pct": number (% per week of delay — default 0.5),
    "penalty_cap_pct": number (% of milestone value — default 10),
    "acceptance_period_days": number (UAT/acceptance window in days — default 10),
    "key_personnel_review_days": number (days to review personnel changes — default 7),
    "subcontractor_review_days": number or null,
    "training_sessions_target": number (total training sessions contractually required),
    "training_hours_target": number (total training hours),
    "training_max_per_session": number (max attendees per session — default 15),
    "hypercare_weeks": number (post go-live hypercare weeks — default 13),
    "governing_reference": "string — master agreement / contract reference number",
    "notes": "string — key commercial terms, liability cap, warranty notes, offer expiry"
  },

  "key_personnel": [
    {
      "name": "string",
      "role": "string",
      "organisation": "si|client|other",
      "contract_start_date": "YYYY-MM-DD or null"
    }
  ],

  "milestones": [
    {
      "name": "string — clear milestone description",
      "due_date": "YYYY-MM-DD or null if relative",
      "description": "string — what must be achieved",
      "is_critical": true|false (true = UAT sign-offs and major go-lives)
    }
  ],

  "assumptions": [
    {
      "title": "string",
      "category": "string (e.g. Data Migration, Infrastructure, Scope, Governance, Testing)",
      "owner_name": "string — who owns validating this assumption",
      "impact_if_wrong": "string — consequence if assumption is invalid"
    }
  ],

  "dependencies": [
    {
      "title": "string — what is needed",
      "dependent_on": "string — which party/system",
      "provider": "string — who provides it",
      "owner_name": "string — accountability owner",
      "notes": "string — timing or technical requirements"
    }
  ],

  "risks": [
    {
      "title": "string",
      "description": "string",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "owner_name": "string",
      "mitigation_plan": "string"
    }
  ]
}

IMPORTANT RULES:
- Return ONLY the JSON object. No markdown, no prose, no code fences.
- If a field is not mentioned in the contract, use sensible defaults rather than omitting it.
- Extract ALL key personnel explicitly named — both SI team and client team.
- Milestones must be specific. Include UAT sign-offs, go-lives, playbacks, hypercare end dates.
- Generate at least 3 risks inferred from the contract scope and clauses.
- Generate at least 3 assumptions inferred from the scope description.
- Never include real person PII beyond what is in the document.`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContractExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedContractData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extract = async (contractText: string): Promise<ExtractedContractData | null> => {
    if (!contractText.trim()) {
      setError('Please paste or upload contract text first.');
      return null;
    }

    setIsExtracting(true);
    setError(null);
    setExtracted(null);

    try {
      // Truncate to ~24k chars to stay within token limits
      const truncated = contractText.slice(0, 24000);

      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          query: `Extract all structured contract data from this document and return ONLY a JSON object matching the schema:\n\n${truncated}`,
          projectId: 'contract-extraction',
          userRole: 'admin',
          conversationHistory: [],
          projectContext: { mode: 'contract_extraction' },
          // Pass a special flag so orchestrator skips intent routing
          _extractionMode: true,
          _systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        },
      });

      if (fnError) throw new Error(fnError.message);

      // The orchestrator returns { response: "...", agentType, ... }
      const rawResponse: string = (data as { response?: string })?.response ?? '';

      // Extract JSON from the response (it may be wrapped in prose)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI did not return valid JSON. Please try again — ensure the text clearly describes a professional services contract.');
      }

      const parsed: ExtractedContractData = JSON.parse(jsonMatch[0]);

      // Basic validation
      if (!parsed.contract_terms || !Array.isArray(parsed.key_personnel)) {
        throw new Error('Extracted data is incomplete. The document may not be a recognisable contract format.');
      }

      setExtracted(parsed);
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed. Please try again.';
      setError(msg);
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const reset = () => {
    setExtracted(null);
    setError(null);
  };

  return { extract, isExtracting, extracted, error, reset };
}
