import type { FormData } from '@/stores/proposalStore';
import type { AnalysisResult } from '@/lib/supabase';

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are DealAutopsy, an expert sales coach specializing in freelance and agency proposal analysis. You analyze rejected proposals and give brutally honest, specific, actionable feedback. Always respond in valid JSON only. No markdown, no explanation outside the JSON.`;

export async function analyzeProposal(formData: FormData): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.');
  }

  const userPrompt = `Analyze this rejected freelance proposal and return JSON only.

PROPOSAL TEXT:
${formData.proposal_text}

CONTEXT:
Project type: ${formData.project_type || 'Not specified'}
Quoted price: ${formData.quoted_price || 'Not specified'}
Duration: ${formData.duration || 'Not specified'}
Rejection reason: ${formData.rejection_reason || 'Not specified'}
Additional context: ${formData.additional_context || 'None'}
Client type: ${formData.client_type || 'Not specified'}
Client industry: ${formData.client_industry || 'Not specified'}
Lead type: ${formData.lead_type || 'Not specified'}
Prior call before proposal: ${formData.prior_call || 'Not specified'}

Return this EXACT JSON schema (no markdown, no code fences, just raw JSON):
{
  "score": <integer 1 to 10>,
  "score_explanation": "<one concise sentence explaining the score>",
  "top_reasons": [
    {
      "rank": 1,
      "reason": "<short title>",
      "explanation": "<2-3 sentences referencing actual proposal text>",
      "severity": "high"
    },
    {
      "rank": 2,
      "reason": "<short title>",
      "explanation": "<2-3 sentences referencing actual proposal text>",
      "severity": "medium"
    },
    {
      "rank": 3,
      "reason": "<short title>",
      "explanation": "<2-3 sentences referencing actual proposal text>",
      "severity": "low"
    }
  ],
  "weakest_section": {
    "section_name": "<e.g. Pricing, Introduction, Credibility, Call-to-Action>",
    "original_excerpt": "<quoted weak text, max 100 words>",
    "why_it_hurts": "<specific explanation of why this section is damaging>",
    "rewritten_version": "<improved version of the weak section>"
  },
  "action_checklist": [
    "<specific action item 1>",
    "<specific action item 2>",
    "<specific action item 3>"
  ],
  "pattern_tags": ["<tags only from: pricing, trust, clarity, urgency, scope, social_proof>"]
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err) {
    throw new Error(`Network error calling Gemini API: ${(err as Error).message}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${errorBody || response.statusText}`);
  }

  const data = await response.json();

  // Extract text from Gemini response structure
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    // Log full response for debugging
    console.error('Gemini raw response:', JSON.stringify(data, null, 2));
    throw new Error('Empty response from Gemini AI');
  }

  console.log('Gemini raw text:', text); // debug — remove after confirmed working

  // Robustly extract the JSON object from any surrounding text / code fences
  const extractJson = (raw: string): string => {
    // 1. Strip markdown code fences first
    const stripped = raw
      .trim()
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim();

    // 2. Find the outermost { ... } block
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return stripped.slice(start, end + 1);
    }

    return stripped;
  };

  const cleaned = extractJson(text);

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned) as AnalysisResult;
  } catch (parseErr) {
    console.error('JSON parse failed. Cleaned text was:', cleaned);
    throw new Error('Invalid JSON response from AI. Please try again.');
  }

  // Validate required fields are present
  if (
    typeof parsed.score !== 'number' ||
    !Array.isArray(parsed.top_reasons) ||
    !parsed.weakest_section ||
    !Array.isArray(parsed.action_checklist)
  ) {
    throw new Error('AI response was missing required fields. Please try again.');
  }

  return parsed;
}
