import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { analyzeProposal } from '@/lib/claude';
import { useProposalStore } from '@/stores/proposalStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Tag, User, Ghost, DollarSign, HelpCircle, XCircle, Check } from 'lucide-react';

const PROJECT_TYPES = ['Web App', 'E-commerce', 'Mobile App', 'Design', 'Branding', 'Marketing', 'Other'];
const DURATIONS = ['Less than 1 week', '1-2 weeks', '1 month', '2-3 months', '3+ months'];
const CLIENT_TYPES = ['Small Business', 'Startup', 'Agency', 'Enterprise', 'Individual'];
const INDUSTRIES = ['Tech', 'Healthcare', 'Retail', 'Education', 'Real Estate', 'Restaurant', 'Legal', 'Finance', 'Other'];

const REJECTION_REASONS = [
  { value: 'Went with someone cheaper', icon: Tag, label: 'Went with someone cheaper' },
  { value: 'Chose another provider', icon: User, label: 'Chose another provider' },
  { value: 'No response / Ghosted me', icon: Ghost, label: 'No response / Ghosted me' },
  { value: 'Said it was too expensive', icon: DollarSign, label: 'Said it was too expensive' },
  { value: "Said scope wasn't clear", icon: HelpCircle, label: "Said scope wasn't clear" },
  { value: 'Project got cancelled', icon: XCircle, label: 'Project got cancelled' },
];

const LOADING_TEXTS = [
  'Reading your proposal...',
  'Identifying weak sections...',
  'Generating rewrite...',
  'Finalizing your report...',
];

export default function NewAutopsy() {
  const navigate = useNavigate();
  const { currentStep, formData, setStep, updateForm, resetForm } = useProposalStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);

  const wordCount = formData.proposal_text.trim().split(/\s+/).filter(Boolean).length;

  const validateStep1 = () => {
    if (formData.proposal_text.length < 50) {
      setErrors({ proposal_text: 'Proposal must be at least 50 characters' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    if (!formData.rejection_reason) {
      setErrors({ rejection_reason: 'Please select a rejection reason' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!formData.client_type) e.client_type = 'Client type is required';
    if (!formData.client_industry) e.client_industry = 'Client industry is required';
    if (Object.keys(e).length) { setErrors(e); return false; }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setStep(currentStep + 1);
  };

  const goBack = () => setStep(currentStep - 1);

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    const interval = setInterval(() => {
      setLoadingTextIdx((i) => (i + 1) % LOADING_TEXTS.length);
    }, 2000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check free tier
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
      if (sub && sub.analyses_used >= sub.analyses_limit) {
        clearInterval(interval);
        setIsLoading(false);
        toast.info('You have used all 3 free analyses. Upgrade to Pro for unlimited analyses.');
        return;
      }

      // Save proposal
      const { data: proposal, error: insertError } = await supabase.from('proposals').insert({
        user_id: user.id,
        proposal_text: formData.proposal_text,
        project_type: formData.project_type,
        quoted_price: formData.quoted_price,
        duration: formData.duration,
        rejection_reason: formData.rejection_reason,
        additional_context: formData.additional_context,
        client_type: formData.client_type,
        client_industry: formData.client_industry,
        lead_type: formData.lead_type,
        prior_call: formData.prior_call,
        status: 'pending',
      }).select().single();

      if (insertError) throw insertError;

      // Call Claude
      const analysis = await analyzeProposal(formData);

      // Update proposal
      await supabase.from('proposals').update({
        score: analysis.score,
        score_explanation: analysis.score_explanation,
        analysis_json: analysis,
        pattern_tags: analysis.pattern_tags,
        status: 'complete',
      }).eq('id', proposal.id);

      // Increment usage
      if (sub) {
        await supabase.from('subscriptions').update({
          analyses_used: sub.analyses_used + 1,
        }).eq('id', sub.id);
      }

      clearInterval(interval);
      resetForm();
      navigate(`/autopsy/${proposal.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      toast.error('Analysis failed. Please try again.');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="h-4 w-4 rounded-full bg-primary animate-pulse-dot" />
        <p className="mt-6 font-mono text-sm text-muted-foreground">{LOADING_TEXTS[loadingTextIdx]}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in-up">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard" className="font-mono text-lg font-bold">
            <span className="text-foreground">Deal</span>
            <span className="text-primary">Autopsy</span>
          </Link>
        </div>
      </nav>

      {/* Progress */}
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <div className="flex items-center justify-center gap-4">
          {['The Proposal', 'What Happened', 'The Client'].map((label, i) => {
            const step = i + 1;
            const isActive = currentStep === step;
            const isComplete = currentStep > step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-bold ${isComplete ? 'bg-success text-success-foreground' : isActive ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : step}
                </div>
                <span className={`hidden text-xs sm:inline ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {i < 2 && <div className="mx-2 h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="animate-slide-left space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Paste your proposal</label>
              <textarea
                value={formData.proposal_text}
                onChange={(e) => updateForm({ proposal_text: e.target.value })}
                className="w-full min-h-[200px] rounded-lg border border-input-border bg-input p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus resize-y"
                placeholder="Paste your full proposal here..."
              />
              <p className="mt-1 font-mono text-xs text-muted-foreground">~{wordCount} words</p>
              {errors.proposal_text && <p className="mt-1 text-sm text-primary">{errors.proposal_text}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Project Type" value={formData.project_type} options={PROJECT_TYPES} onChange={(v) => updateForm({ project_type: v })} />
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Quoted Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    value={formData.quoted_price}
                    onChange={(e) => updateForm({ quoted_price: e.target.value })}
                    className="w-full rounded-md border border-input-border bg-input py-2 pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus"
                    placeholder="5,000"
                  />
                </div>
              </div>
              <SelectField label="Duration" value={formData.duration} options={DURATIONS} onChange={(v) => updateForm({ duration: v })} />
            </div>

            <div className="flex justify-end">
              <Button onClick={goNext} disabled={formData.proposal_text.length < 50}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="animate-slide-left space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">What did the client say?</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {REJECTION_REASONS.map((r) => {
                  const selected = formData.rejection_reason === r.value;
                  return (
                    <button
                      key={r.value}
                      onClick={() => updateForm({ rejection_reason: r.value })}
                      className={`flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${selected ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'}`}
                    >
                      <r.icon className={`h-5 w-5 shrink-0 ${selected ? 'text-primary' : ''}`} />
                      {r.label}
                    </button>
                  );
                })}
              </div>
              {errors.rejection_reason && <p className="mt-2 text-sm text-primary">{errors.rejection_reason}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Any extra context? (optional)</label>
              <textarea
                value={formData.additional_context}
                onChange={(e) => updateForm({ additional_context: e.target.value })}
                className="w-full min-h-[100px] rounded-lg border border-input-border bg-input p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus resize-y"
                placeholder="e.g. They had 3 other quotes, focused heavily on timeline..."
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
              <Button onClick={goNext} disabled={!formData.rejection_reason}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="animate-slide-left space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <SelectField label="Client Type *" value={formData.client_type} options={CLIENT_TYPES} onChange={(v) => updateForm({ client_type: v })} error={errors.client_type} />
              </div>
              <div>
                <SelectField label="Client Industry *" value={formData.client_industry} options={INDUSTRIES} onChange={(v) => updateForm({ client_industry: v })} error={errors.client_industry} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Lead Type</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Warm lead (referral or existing contact)', 'Cold outreach'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => updateForm({ lead_type: opt })}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${formData.lead_type === opt ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Prior Call</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Yes, we spoke before I submitted', 'No, proposal only'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => updateForm({ prior_call: opt })}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${formData.prior_call === opt ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={goBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
              <Button onClick={handleSubmit} className="w-full sm:w-auto">Run Autopsy →</Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">Analysis takes about 10-15 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange, error }: { label: string; value: string; options: string[]; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-foreground focus:border-input-focus focus:outline-none focus:ring-1 focus:ring-input-focus"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="mt-1 text-sm text-primary">{error}</p>}
    </div>
  );
}
