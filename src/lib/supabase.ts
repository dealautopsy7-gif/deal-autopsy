/*
  Run this SQL in your Supabase SQL Editor:

  CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    proposal_text TEXT NOT NULL,
    project_type TEXT,
    quoted_price TEXT,
    duration TEXT,
    rejection_reason TEXT,
    additional_context TEXT,
    client_type TEXT,
    client_industry TEXT,
    lead_type TEXT,
    prior_call TEXT,
    score INTEGER,
    score_explanation TEXT,
    analysis_json JSONB,
    pattern_tags TEXT[],
    status TEXT DEFAULT 'pending'
  );

  ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can only access own proposals"
  ON proposals FOR ALL
  USING (auth.uid() = user_id);

  CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    plan TEXT DEFAULT 'free',
    analyses_used INTEGER DEFAULT 0,
    analyses_limit INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can only access own subscription"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id);
*/

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Proposal = {
  id: string;
  user_id: string;
  created_at: string;
  proposal_text: string;
  project_type: string | null;
  quoted_price: string | null;
  duration: string | null;
  rejection_reason: string | null;
  additional_context: string | null;
  client_type: string | null;
  client_industry: string | null;
  lead_type: string | null;
  prior_call: string | null;
  score: number | null;
  score_explanation: string | null;
  analysis_json: AnalysisResult | null;
  pattern_tags: string[] | null;
  status: string;
};

export type AnalysisResult = {
  score: number;
  score_explanation: string;
  top_reasons: {
    rank: number;
    reason: string;
    explanation: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  weakest_section: {
    section_name: string;
    original_excerpt: string;
    why_it_hurts: string;
    rewritten_version: string;
  };
  action_checklist: string[];
  pattern_tags: string[];
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  analyses_used: number;
  analyses_limit: number;
  status: string;
  created_at: string;
};
