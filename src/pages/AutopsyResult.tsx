import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Proposal, type AnalysisResult } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 10) * c;
  const color = score < 5 ? 'hsl(0, 76%, 57%)' : score < 8 ? 'hsl(40, 72%, 51%)' : 'hsl(145, 45%, 43%)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(0,0%,16.5%)" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ '--ring-circumference': `${c}`, '--ring-offset': `${offset}` } as any}
          className="animate-score-ring"
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-mono text-3xl font-bold text-foreground">{score}</span>
        <span className="font-mono text-sm text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    high: 'bg-primary/20 text-primary',
    medium: 'bg-warning/20 text-warning',
    low: 'bg-secondary text-muted-foreground',
  };
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase ${styles[severity] || styles.low}`}>
      {severity}
    </span>
  );
}

export default function AutopsyResult() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`checklist-${id}`);
    if (saved) setCheckedItems(JSON.parse(saved));

    supabase.from('proposals').select('*').eq('id', id).single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError(true); setLoading(false); return; }
        setProposal(data);
        setLoading(false);
      });
  }, [id]);

  const toggleCheck = (i: number) => {
    const next = { ...checkedItems, [i]: !checkedItems[i] };
    setCheckedItems(next);
    localStorage.setItem(`checklist-${id}`, JSON.stringify(next));
  };

  const copyRewrite = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const copyMarkdown = () => {
    if (!analysis) return;
    const md = `# Autopsy Report\n\nScore: ${analysis.score}/10\n${analysis.score_explanation}\n\n## Top Reasons\n${analysis.top_reasons.map((r) => `${r.rank}. ${r.reason} (${r.severity})\n${r.explanation}`).join('\n\n')}\n\n## Weakest Section: ${analysis.weakest_section.section_name}\n${analysis.weakest_section.original_excerpt}\n\n## AI Rewrite\n${analysis.weakest_section.rewritten_version}\n\n## Action Checklist\n${analysis.action_checklist.map((a) => `- ${a}`).join('\n')}`;
    navigator.clipboard.writeText(md);
    toast.success('Copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
            <Link to="/dashboard" className="font-mono text-lg font-bold"><span className="text-foreground">Deal</span><span className="text-primary">Autopsy</span></Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card" />)}
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-foreground">Something went wrong. Refresh the page.</p>
          <Link to="/dashboard"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const analysis = proposal.analysis_json as AnalysisResult | null;
  if (!analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Analysis not yet available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in-up">
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard" className="font-mono text-lg font-bold"><span className="text-foreground">Deal</span><span className="text-primary">Autopsy</span></Link>
          <button onClick={copyMarkdown} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" />Copy Report</button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8 opacity-0 animate-fade-in-up stagger-1">
          <ScoreRing score={analysis.score} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {proposal.project_type && <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">{proposal.project_type}</span>}
              <span className="font-mono text-xs text-muted-foreground">{new Date(proposal.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="mt-2 font-mono text-xl font-bold text-foreground sm:text-2xl">
              Autopsy Report #{id?.slice(-4)}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{analysis.score_explanation}</p>
          </div>
        </div>

        {/* Top Reasons */}
        <section className="mb-8 opacity-0 animate-fade-in-up stagger-2">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Why You Lost This Deal</h2>
          <div className="space-y-3">
            {analysis.top_reasons.map((r) => (
              <div key={r.rank} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <span className="font-mono text-2xl font-bold text-primary">{String(r.rank).padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{r.reason}</h3>
                    <SeverityBadge severity={r.severity} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weakest Section */}
        <section className="mb-8 opacity-0 animate-fade-in-up stagger-3">
          <h2 className="mb-4 text-lg font-semibold text-foreground">The Weakest Part of Your Proposal</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border-l-[3px] border-primary bg-primary/[0.08] p-4">
              <p className="mb-2 font-mono text-xs font-semibold uppercase text-primary">Weak Section: {analysis.weakest_section.section_name}</p>
              <p className="text-sm text-foreground italic">"{analysis.weakest_section.original_excerpt}"</p>
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">Why this hurts:</p>
                <p className="mt-1 text-sm italic text-muted-foreground">{analysis.weakest_section.why_it_hurts}</p>
              </div>
            </div>
            <div className="relative rounded-lg border-l-[3px] border-success bg-success/[0.08] p-4">
              <p className="mb-2 font-mono text-xs font-semibold uppercase text-success">AI Rewrite</p>
              <button
                onClick={() => copyRewrite(analysis.weakest_section.rewritten_version)}
                className="absolute right-3 top-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3 w-3" />Copy
              </button>
              <p className="text-sm text-foreground">{analysis.weakest_section.rewritten_version}</p>
            </div>
          </div>
        </section>

        {/* Action Checklist */}
        <section className="mb-8 opacity-0 animate-fade-in-up stagger-4">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Fix These Before Your Next Proposal</h2>
          <div className="space-y-3">
            {analysis.action_checklist.map((action, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checkedItems[i] ? 'border-primary bg-primary' : 'border-input-border'}`}>
                  {checkedItems[i] && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className={`text-sm ${checkedItems[i] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{action}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Tags */}
        {analysis.pattern_tags && analysis.pattern_tags.length > 0 && (
          <section className="mb-8 opacity-0 animate-fade-in-up stagger-5">
            <p className="mb-2 text-xs text-muted-foreground">This loss was tagged:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.pattern_tags.map((tag) => (
                <span key={tag} className="rounded bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
          <Link to="/autopsy/new" className="flex-1"><Button className="w-full">Start New Autopsy</Button></Link>
          <Link to="/dashboard" className="flex-1"><Button variant="outline" className="w-full">Back to Dashboard</Button></Link>
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Coming soon')}>Export PDF</Button>
        </div>
      </div>
    </div>
  );
}
