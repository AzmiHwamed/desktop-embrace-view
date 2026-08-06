// features/scan/scanSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { ApiError, apiFetch, type ApiResponse } from "@/lib/api-client";

import type {
  ExpenseCategory,
  ExpenseRecommendation,
  Receipt,
  ScanErrorCode,
  ScanState,
} from "./types";

type ScanRootState = { scan: ScanState };

const initialState: ScanState = {
  status: "idle",
  fileName: null,
  targetLanguage: "English",
  result: null,
  error: null,
  errorCode: null,
  translatedResult: null,
  translationStatus: "idle",
  translationError: null,
  translationErrorCode: null,
  showTranslated: false,
  recommendation: null,
  recommendationStatus: "idle",
  categories: [],
  categoriesStatus: "idle",
  saveStatus: "idle",
  saveError: null,
  savedExpenseId: null,
};

const RECEIPT_TRANSLATE_IGNORE_KEYS = [
  "id",
  "receiptId",
  "documentType",
  "language",
  "country",
  "phone",
  "invoiceNumber",
  "date",
  "time",
  "currency",
  "subtotal",
  "tax",
  "total",
  "convertedSubtotal",
  "convertedTax",
  "convertedTotal",
  "paymentMethod",
  "rawText",
  "originalFileName",
  "imageMimeType",
  "createdAt",
  "updatedAt",
  "quantity",
  "unitPrice",
  "totalPrice",
  "convertedUnitPrice",
  "convertedTotalPrice",
];

type ScanFailure = { code: ScanErrorCode; detail: string };

function classifyScanError(error: unknown, fallback: string): ScanFailure {
  if (error instanceof ApiError) {
    if (error.status === 408 || error.status === 504) return { code: "timeout", detail: error.message };
    if (error.status === 429) return { code: "rateLimit", detail: error.message };
    if (error.status === 502 || error.status === 503) return { code: "unavailable", detail: error.message };
    if ([400, 413, 415, 422].includes(error.status)) return { code: "invalidFile", detail: error.message };
    if (error.status >= 500) return { code: "server", detail: error.message };
    return { code: "unknown", detail: error.message };
  }
  if (error instanceof TypeError) return { code: "network", detail: error.message };
  return { code: "unknown", detail: error instanceof Error ? error.message : fallback };
}

export const extractReceipt = createAsyncThunk<Receipt, File, { rejectValue: ScanFailure }>(
  "scan/extractReceipt",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await apiFetch<ApiResponse<Receipt>>("/receipts/extract", {
        method: "POST",
        body: formData,
      });

      return res.data;
    } catch (error) {
      return rejectWithValue(classifyScanError(error, "Extraction failed"));
    }
  }
);

// Kept for backward compatibility with any existing callers.
export async function getExpenseCategories() {
  const res = await apiFetch<ApiResponse<any[]>>("/expense-categories");
  return res.data;
}

export const fetchExpenseCategories = createAsyncThunk<
  ExpenseCategory[],
  void,
  { rejectValue: string }
>("scan/fetchExpenseCategories", async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch<ApiResponse<ExpenseCategory[]>>("/expense-categories");
    return res.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to load categories");
  }
});

export const createExpenseCategory = createAsyncThunk<
  ExpenseCategory,
  { name: string },
  { rejectValue: string }
>("scan/createExpenseCategory", async (dto, { rejectWithValue }) => {
  try {
    const res = await apiFetch<ApiResponse<ExpenseCategory>>("/expense-categories", {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return res.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to create category");
  }
});

export const getReceiptRecommendations = createAsyncThunk<
  ExpenseRecommendation,
  string,
  { rejectValue: string }
>("scan/getReceiptRecommendations", async (receiptId, { rejectWithValue }) => {
  try {
    const res = await apiFetch<ApiResponse<ExpenseRecommendation>>(
      `/receipts/receipt-recommendations/${receiptId}`,
      { method: "POST" }
    );
    return res.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load recommendations"
    );
  }
});

export const translateReceipt = createAsyncThunk<
  Receipt,
  string,
  { state: ScanRootState; rejectValue: ScanFailure }
>("scan/translateReceipt", async (targetLanguage, { getState, rejectWithValue }) => {
  const { result } = getState().scan;
  if (!result) return rejectWithValue({ code: "unknown", detail: "Nothing to translate yet" });

  try {
    const res = await apiFetch<ApiResponse<{ data: Receipt }> | { data: Receipt }>(
      "/translation/json",
      {
        method: "POST",
        body: JSON.stringify({
          data: result,
          target: targetLanguage,
          ignoreKeys: RECEIPT_TRANSLATE_IGNORE_KEYS,
        }),
      }
    );

    const outer = (res as ApiResponse<{ data: Receipt }>).data ?? (res as { data: Receipt }).data;
    const translated = (outer as { data?: Receipt })?.data ?? (outer.data as Receipt);

    return translated;
  } catch (error) {
    return rejectWithValue(classifyScanError(error, "Translation failed"));
  }
});

export type SaveExpenseFromReceiptArgs = {
  receiptId: string;
  categoryId: string;
  description?: string;
  amount?: number;
  date?: string;
};

export const saveExpenseFromReceipt = createAsyncThunk<
  { id: string } & Record<string, unknown>,
  SaveExpenseFromReceiptArgs,
  { rejectValue: string }
>("scan/saveExpenseFromReceipt", async (dto, { rejectWithValue }) => {
  try {
    const res = await apiFetch<ApiResponse<{ id: string } & Record<string, unknown>>>(
      "/expenses/from-receipt",
      {
        method: "POST",
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to save expense");
  }
});

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    fileSelected(state, action: PayloadAction<string>) {
      state.fileName = action.payload;
      state.status = "uploading";
      state.error = null;
      state.errorCode = null;
      state.translatedResult = null;
      state.translationStatus = "idle";
      state.translationError = null;
      state.translationErrorCode = null;
      state.showTranslated = false;
      state.recommendation = null;
      state.recommendationStatus = "idle";
      state.saveStatus = "idle";
      state.saveError = null;
      state.savedExpenseId = null;
    },
    setTargetLanguage(state, action: PayloadAction<string>) {
      state.targetLanguage = action.payload;
    },
    toggleShowTranslated(state) {
      state.showTranslated = !state.showTranslated;
    },
    resetSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = null;
      state.savedExpenseId = null;
    },
    clearScanErrors(state) {
      state.error = null;
      state.errorCode = null;
      state.translationError = null;
      state.translationErrorCode = null;
      if (state.status === "error") state.status = "idle";
      if (state.translationStatus === "error") state.translationStatus = "idle";
    },
    resetScan() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(extractReceipt.pending, (state) => {
        state.status = "uploading";
        state.error = null;
        state.errorCode = null;
      })
      .addCase(extractReceipt.fulfilled, (state, action) => {
        state.status = "done";
        state.result = action.payload;
      })
      .addCase(extractReceipt.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload?.detail ?? "Extraction failed";
        state.errorCode = action.payload?.code ?? "unknown";
      })
      .addCase(getReceiptRecommendations.pending, (state) => {
        state.recommendationStatus = "loading";
      })
      .addCase(getReceiptRecommendations.fulfilled, (state, action) => {
        state.recommendationStatus = "done";
        state.recommendation = action.payload;
      })
      .addCase(getReceiptRecommendations.rejected, (state) => {
        state.recommendationStatus = "error";
      })
      .addCase(translateReceipt.pending, (state) => {
        state.translationStatus = "translating";
        state.translationError = null;
        state.translationErrorCode = null;
      })
      .addCase(translateReceipt.fulfilled, (state, action) => {
        state.translationStatus = "done";
        state.translatedResult = action.payload;
        state.showTranslated = true;
      })
      .addCase(translateReceipt.rejected, (state, action) => {
        state.translationStatus = "error";
        state.translationError = action.payload?.detail ?? "Translation failed";
        state.translationErrorCode = action.payload?.code ?? "unknown";
      })
      .addCase(fetchExpenseCategories.pending, (state) => {
        state.categoriesStatus = "loading";
      })
      .addCase(fetchExpenseCategories.fulfilled, (state, action) => {
        state.categoriesStatus = "done";
        state.categories = action.payload;
      })
      .addCase(fetchExpenseCategories.rejected, (state) => {
        state.categoriesStatus = "error";
      })
      .addCase(createExpenseCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(saveExpenseFromReceipt.pending, (state) => {
        state.saveStatus = "saving";
        state.saveError = null;
      })
      .addCase(saveExpenseFromReceipt.fulfilled, (state, action) => {
        state.saveStatus = "done";
        state.savedExpenseId = action.payload.id;
      })
      .addCase(saveExpenseFromReceipt.rejected, (state, action) => {
        state.saveStatus = "error";
        state.saveError = action.payload ?? "Failed to save expense";
      });
  },
});

export const {
  fileSelected,
  setTargetLanguage,
  toggleShowTranslated,
  resetScan,
  resetSaveStatus,
  clearScanErrors,
} = scanSlice.actions;
export default scanSlice.reducer;
