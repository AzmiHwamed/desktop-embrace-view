export type ScanStatus = "idle" | "uploading" | "translating" | "done" | "error";

export type ScanResult = {
  merchant: string;
  total: number;
  currency: string;
  convertedTotal: number;
  lines: { label: string; amount: number }[];
};

export type ScanState = {
  status: ScanStatus;
  fileName: string | null;
  targetLanguage: string;
  result: ScanResult | null;
  error: string | null;
};
