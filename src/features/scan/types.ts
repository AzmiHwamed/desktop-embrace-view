// features/scan/types.ts
export type ScanStatus = "idle" | "uploading" | "done" | "error";

export type ReceiptItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  convertedUnitPrice?: number | null;
  convertedTotalPrice?: number | null;
};

export type Receipt = {
  id: string;
  documentType: string;
  language: string | null;
  country: string | null;
  merchant: string | null;
  address: string | null;
  phone: string | null;
  invoiceNumber?: string | null;
  date?: string | null;
  time?: string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  convertedSubtotal?: number | null;
  convertedTax?: number | null;
  convertedTotal?: number | null;
  paymentMethod: string | null;
  items: ReceiptItem[];
};

export type TranslationStatus = "idle" | "translating" | "done" | "error";
export type SaveStatus = "idle" | "saving" | "done" | "error";
export type CategoriesStatus = "idle" | "loading" | "done" | "error";
export type ScanErrorCode =
  | "network"
  | "timeout"
  | "unavailable"
  | "rateLimit"
  | "invalidFile"
  | "server"
  | "unknown";

export type ExpenseCategory = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
};

// features/scan/types.ts
export type ExpenseRecommendation = {
  categoryRecommendation?: {
    matched: boolean;
    confidence?: number;
    reason?: string;
    // Present when matched === true — the existing category that was matched.
    expenseType?: {
      id: string;
      name: string;
    };
    // Present when matched === false — a suggested new category to create.
    suggestedExpenseType?: {
      name: string;
      description?: string;
    };
  };
  descriptionRecommendation?: {
    description: string;
  };
};

export type ScanState = {
  status: ScanStatus;
  fileName: string | null;
  targetLanguage: string;
  result: Receipt | null;
  error: string | null;
  errorCode: ScanErrorCode | null;
  translatedResult: Receipt | null;
  translationStatus: TranslationStatus;
  translationError: string | null;
  translationErrorCode: ScanErrorCode | null;
  showTranslated: boolean;
  recommendation: ExpenseRecommendation | null;
  recommendationStatus: "idle" | "loading" | "done" | "error";
  categories: ExpenseCategory[];
  categoriesStatus: CategoriesStatus;
  saveStatus: SaveStatus;
  saveError: string | null;
  savedExpenseId: string | null;
};
