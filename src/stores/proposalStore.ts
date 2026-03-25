import { create } from 'zustand';

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

type ProposalStore = {
  currentStep: number;
  formData: FormData;
  setStep: (step: number) => void;
  updateForm: (data: Partial<FormData>) => void;
  resetForm: () => void;
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

export const useProposalStore = create<ProposalStore>((set) => ({
  currentStep: 1,
  formData: { ...initialFormData },
  setStep: (step) => set({ currentStep: step }),
  updateForm: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ currentStep: 1, formData: { ...initialFormData } }),
}));
