import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ScanResult, ScanState } from "./types";

const initialState: ScanState = {
  status: "idle",
  fileName: null,
  targetLanguage: "English",
  result: null,
  error: null,
};

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    fileSelected(state, action: PayloadAction<string>) {
      state.fileName = action.payload;
      state.status = "uploading";
      state.error = null;
    },
    setTargetLanguage(state, action: PayloadAction<string>) {
      state.targetLanguage = action.payload;
    },
    scanSucceeded(state, action: PayloadAction<ScanResult>) {
      state.status = "done";
      state.result = action.payload;
    },
    scanFailed(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    resetScan() {
      return initialState;
    },
  },
});

export const { fileSelected, setTargetLanguage, scanSucceeded, scanFailed, resetScan } =
  scanSlice.actions;
export default scanSlice.reducer;
