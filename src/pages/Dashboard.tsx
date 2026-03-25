import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, type Proposal, type Subscription } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, MoreVertical, Trash2, FileSearch, BarChart3, Tag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score < 5 ? 'bg-primary/20 text-primary' : score < 8 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success';
  return <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-semibold ${color}`}>{score}/10</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');

      const [proposalsRes, subRes] = await Promise.all([
        supabase.from('proposals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
      ]);

      setProposals(proposalsRes.data || []);
      setSubscription(subRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const deleteProposal = async (id: string) => {
    try {
      await supabase.from('proposals').delete().eq('id', id);
      setProposals((p) => p.filter((x) => x.id !== id));
      toast.success('Proposal deleted');
    } catch {
      toast.error('Failed to delete');
    }
    setOpenMenu(null);
  };

  const completedProposals = proposals.filter((p) => p.status === 'complete');
  const avgScore = completedProposals.length
    ? Math.round(completedProposals.reduce((s, p) => s + (p.score || 0), 0) / completedProposals.length * 10) / 10
    : 0;

  // Pattern detection
  const tagCounts: Record<string, number> = {};
  completedProposals.forEach((p) => p.pattern_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
  const showPattern = completedProposals.length >= 3;

  const firstScore = completedProposals.length ? completedProposals[completedProposals.length - 1]?.score : null;
  const lastScore = completedProposals.length ? completedProposals[0]?.score : null;

  return (
    <div className="min-h-screen bg-background animate-fade-in-up">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard" className="font-mono text-lg font-bold">
            <span className="text-foreground">Deal</span>
            <span className="text-primary">Autopsy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/autopsy/new"><Button size="sm"><Plus className="mr-1 h-4 w-4" />New Autopsy</Button></Link>
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                {userEmail?.[0]?.toUpperCase() || 'U'}
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-10 w-48 rounded-lg border border-border bg-card p-2 shadow-lg">
                  <p className="truncate px-2 py-1 text-xs text-muted-foreground">{userEmail}</p>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-secondary">
                    <LogOut className="h-4 w-4" />Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Pattern Banner */}
        {showPattern && topTag && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Your proposals most often lose because of: <span className="font-mono font-semibold text-primary">{topTag[0]}</span> ({topTag[1]} out of {completedProposals.length} losses)
            </p>
            {firstScore !== null && lastScore !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Average score: {firstScore} → {lastScore} {lastScore > firstScore ? '(improving)' : lastScore < firstScore ? '(declining)' : '(stable)'}
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FileSearch} label="Total Analyzed" value={String(completedProposals.length)} />
            <StatCard icon={BarChart3} label="Average Score" value={avgScore ? `${avgScore}/10` : '—'} />
            <StatCard icon={Tag} label="Most Common Tag" value={topTag ? topTag[0] : '—'} mono />
            <StatCard icon={DollarSign} label="Est. Revenue Lost" value={`$${(completedProposals.length * 3500).toLocaleString()}`} />
          </div>
        )}

        {/* Proposals */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Proposals</h2>
          {subscription && (
            <span className="text-xs text-muted-foreground font-mono">
              {subscription.analyses_used}/{subscription.analyses_limit} used
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center">
            <FileSearch className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No autopsies yet.</h3>
            <p className="mt-1 text-sm text-muted-foreground">Paste your first rejected proposal to get started.</p>
            <Link to="/autopsy/new"><Button className="mt-6">Run First Autopsy</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <div key={p.id} className="card-hover-border flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    {p.project_type && <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">{p.project_type}</span>}
                    <span className="font-mono text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                    <ScoreBadge score={p.score} />
                  </div>
                  {p.analysis_json && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {(p.analysis_json as any)?.top_reasons?.[0]?.reason || ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {p.status === 'complete' && (
                    <Link to={`/autopsy/${p.id}`}><Button variant="outline" size="sm">View Report</Button></Link>
                  )}
                  {p.status === 'pending' && <span className="text-xs text-warning font-mono">Processing...</span>}
                  {p.status === 'error' && <span className="text-xs text-primary font-mono">Failed</span>}
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)} className="p-1 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === p.id && (
                      <div className="absolute right-0 top-8 w-32 rounded-lg border border-border bg-card p-1 shadow-lg z-10">
                        <button onClick={() => deleteProposal(p.id)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-primary hover:bg-secondary">
                          <Trash2 className="h-3 w-3" />Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`mt-2 text-xl font-bold text-foreground ${mono ? 'font-mono text-base' : ''}`}>{value}</p>
    </div>
  );
}
