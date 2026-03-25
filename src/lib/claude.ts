import type { FormData } from '@/stores/proposalStore';
import type { AnalysisResult } from '@/lib/supabase';

export async function analyzeProposal(formData: FormData): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const userPrompt = `Analyze this rejected proposal and return JSON only.

PROPOSAL TEXT:
${formData.proposal_text}

CONTEXT:
Project type: ${formData.project_type}
Quoted price: ${formData.quoted_price}
Duration: ${formData.duration}
Rejection reason: ${formData.rejection_reason}
Additional context: ${formData.additional_context}
Client type: ${formData.client_type}
Client industry: ${formData.client_industry}
Lead type: ${formData.lead_type}
Prior call: ${formData.prior_call}

Return this exact JSON schema:
{
  "score": number 1 to 10,
  "score_explanation": "one sentence string",
  "top_reasons": [
    {
      "rank": 1,
      "reason": "title string",
      "explanation": "2 to 3 sentences referencing actual proposal text",
      "severity": "high" or "medium" or "low"
    },
    same for rank 2,
    same for rank 3
  ],
  "weakest_section": {
    "section_name": "string like Pricing or Introduction",
    "original_excerpt": "quoted weak text max 100 words",
    "why_it_hurts": "specific explanation string",
    "rewritten_version": "improved version string"
  },
  "action_checklist": [
    "action string 1",
    "action string 2",
    "action string 3"
  ],
  "pattern_tags": ["array of strings from: pricing, trust, clarity, urgency, scope, social_proof"]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'You are DealAutopsy, an expert sales coach specializing in freelance and agency proposal analysis. You analyze rejected proposals and give brutally honest, specific, actionable feedback. Always respond in valid JSON only. No markdown, no explanation outside the JSON.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text;

  if (!text) throw new Error('Empty response from Claude');

  return JSON.parse(text) as AnalysisResult;
}
