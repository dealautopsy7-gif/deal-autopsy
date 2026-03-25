import { create } from 'zustand';
import { analyzeProposal } from '@/lib/claude';
import { createProposal, updateProposalAnalysis, incrementAnalysesUsed } from '@/lib/proposals';

export type FormData = {
  proposal_text: string;
  project_type: string;
  quoted_price: string;
  duration: string;
  rejection_reason: string;
  additional_context: string;
  client_type: string;
  client_industry: string;
  lead_type: string;
  prior_call: string;
};

type AutopsyStore = {
  step: number;
  formData: FormData;
  isLoading: boolean;
  error: string | null;
  currentProposalId: string | null;

  setStep: (step: number) => void;
  updateFormData: (partial: Partial<FormData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  setCurrentProposalId: (id: string | null) => void;
  resetForm: () => void;
  submitAutopsy: (userId: string) => Promise<string>;

  // Legacy aliases used by NewAutopsy.tsx (Lovable generated)
  currentStep: number;
  updateForm: (data: Partial<FormData>) => void;
};

const initialFormData: FormData = {
  proposal_text: '',
  project_type: '',
  quoted_price: '',
  duration: '',
  rejection_reason: '',
  additional_context: '',
  client_type: '',
  client_industry: '',
  lead_type: '',
  prior_call: '',
};

export const useProposalStore = create<AutopsyStore>((set, get) => ({
  step: 1,
  currentStep: 1, // alias
  formData: { ...initialFormData },
  isLoading: false,
  error: null,
  currentProposalId: null,

  setStep: (step) => set({ step, currentStep: step }),
  updateFormData: (partial) =>
    set((state) => ({ formData: { ...state.formData, ...partial } })),

  // Alias used by NewAutopsy.tsx
  updateForm: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCurrentProposalId: (currentProposalId) => set({ currentProposalId }),

  resetForm: () =>
    set({
      step: 1,
      currentStep: 1,
      formData: { ...initialFormData },
      isLoading: false,
      error: null,
      currentProposalId: null,
    }),

  submitAutopsy: async (userId: string): Promise<string> => {
    const { formData } = get();

    set({ isLoading: true, error: null });

    let proposalId: string | null = null;

    try {
      // 1. Save proposal row (status: pending)
      proposalId = await createProposal(userId, formData);

      // 2. Call Gemini AI
      const analysis = await analyzeProposal(formData);

      // 3. Update proposal with analysis result
      await updateProposalAnalysis(proposalId, {
        score: analysis.score,
        score_explanation: analysis.score_explanation,
        analysis_json: analysis,
        pattern_tags: analysis.pattern_tags,
        status: 'complete',
      });

      // 4. Increment usage counter
      await incrementAnalysesUsed(userId);

      // 5. Set state
      set({ currentProposalId: proposalId, isLoading: false });

      return proposalId;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Analysis failed. Please try again.';

      // Mark proposal as error if it was created
      if (proposalId) {
        try {
          await updateProposalAnalysis(proposalId, {
            score: 0,
            score_explanation: 'Analysis failed',
            analysis_json: {} as never,
            pattern_tags: [],
            status: 'error',
          });
        } catch {
          // ignore secondary failure
        }
      }

      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));
