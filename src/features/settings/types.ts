// store/settings/types.ts
export type SettingsState = {
  language: string;
  currency: string;
  rateAlerts: boolean;
  weeklyDigest: boolean;
  autoTranslate: boolean;
};

export type FaqCategory = {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory | null;
  categoryId: string | null;
  order: number;
  isActive: boolean;
};

export type FaqState = {
  items: Faq[];
  loading: boolean;
  error: string | null;

  // True once the initial FAQ fetch has settled (fulfilled OR rejected) at
  // least once — gates the page skeleton, same pattern as the other slices.
  faqsLoaded: boolean;
};