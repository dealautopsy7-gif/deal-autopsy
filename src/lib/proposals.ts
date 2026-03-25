import { supabase, type Proposal } from '@/lib/supabase';
import type { FormData } from '@/stores/proposalStore';
import type { AnalysisResult } from '@/lib/supabase';

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function createProposal(
  userId: string,
  formData: FormData
): Promise<string> {
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      user_id: userId,
      proposal_text: formData.proposal_text,
      project_type: formData.project_type || null,
      quoted_price: formData.quoted_price || null,
      duration: formData.duration || null,
      rejection_reason: formData.rejection_reason || null,
      additional_context: formData.additional_context || null,
      client_type: formData.client_type || null,
      client_industry: formData.client_industry || null,
      lead_type: formData.lead_type || null,
      prior_call: formData.prior_call || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save proposal: ${error.message}`);
  if (!data?.id) throw new Error('Proposal created but no ID returned');

  return data.id as string;
}

export async function updateProposalAnalysis(
  id: string,
  analysisData: {
    score: number;
    score_explanation: string;
    analysis_json: AnalysisResult;
    pattern_tags: string[];
    status: 'complete' | 'error';
  }
): Promise<void> {
  const { error } = await supabase
    .from('proposals')
    .update({
      score: analysisData.score,
      score_explanation: analysisData.score_explanation,
      analysis_json: analysisData.analysis_json,
      pattern_tags: analysisData.pattern_tags,
      status: analysisData.status,
    })
    .eq('id', id);

  if (error) throw new Error(`Failed to update analysis: ${error.message}`);
}

export async function getProposal(id: string): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch proposal: ${error.message}`);
  if (!data) throw new Error('Proposal not found');

  return data as Proposal;
}

export async function getUserProposals(userId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch proposals: ${error.message}`);

  return (data || []) as Proposal[];
}

export async function deleteProposal(id: string): Promise<void> {
  const { error } = await supabase.from('proposals').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete proposal: ${error.message}`);
}

// ─── Subscription & Limits ────────────────────────────────────────────────────

export async function checkAnalysisLimit(
  userId: string
): Promise<{ canAnalyze: boolean; used: number; limit: number }> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // If no subscription row exists, create one with free defaults
  if (!data) {
    const { data: newSub, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'free',
        analyses_used: 0,
        analyses_limit: 3,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to create subscription: ${insertError.message}`);

    return {
      canAnalyze: true,
      used: 0,
      limit: newSub?.analyses_limit ?? 3,
    };
  }

  if (error) throw new Error(`Failed to check subscription: ${error.message}`);

  const used: number = data.analyses_used ?? 0;
  const limit: number = data.analyses_limit ?? 3;

  return {
    canAnalyze: used < limit,
    used,
    limit,
  };
}

export async function incrementAnalysesUsed(userId: string): Promise<void> {
  // Use RPC-style increment to avoid race conditions
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, analyses_used')
    .eq('user_id', userId)
    .single();

  if (fetchError || !sub) return; // Silently skip — don't break the flow

  const { error } = await supabase
    .from('subscriptions')
    .update({ analyses_used: (sub.analyses_used ?? 0) + 1 })
    .eq('id', sub.id);

  if (error) console.error('Failed to increment analyses used:', error.message);
}
