import { supabase } from '@/lib/supabase';

export type PatternResult = {
  mostCommonTag: string;
  tagCount: number;
  totalProposals: number;
  averageScore: number;
  firstScore: number;
  latestScore: number;
  scoreImproving: boolean;
  allTagCounts: { [tag: string]: number };
};

export async function getUserPatterns(userId: string): Promise<PatternResult | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select('score, pattern_tags, created_at')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .order('created_at', { ascending: true }); // oldest first for score trend

  if (error) throw new Error(`Failed to fetch patterns: ${error.message}`);

  const proposals = data || [];

  // Need at least 3 completed proposals to show patterns
  if (proposals.length < 3) return null;

  // Count all tags across proposals
  const allTagCounts: { [tag: string]: number } = {};
  proposals.forEach((p) => {
    if (Array.isArray(p.pattern_tags)) {
      p.pattern_tags.forEach((tag: string) => {
        allTagCounts[tag] = (allTagCounts[tag] || 0) + 1;
      });
    }
  });

  // Find the most common tag
  const sorted = Object.entries(allTagCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const [mostCommonTag, tagCount] = sorted[0];

  // Score stats
  const scores = proposals.map((p) => p.score).filter((s): s is number => typeof s === 'number');

  if (scores.length === 0) return null;

  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const firstScore = scores[0]; // oldest
  const latestScore = scores[scores.length - 1]; // newest
  const scoreImproving = latestScore > firstScore;

  return {
    mostCommonTag,
    tagCount,
    totalProposals: proposals.length,
    averageScore,
    firstScore,
    latestScore,
    scoreImproving,
    allTagCounts,
  };
}
