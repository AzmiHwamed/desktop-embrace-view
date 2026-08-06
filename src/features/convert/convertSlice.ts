// features/convert/convertSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch } from "@/lib/api-client";

import type {
  ConvertState,
  Currency,
  ConversionResult,
} from "./types";


type ApiResponse<T> = {
  status_code: number;
  title: string;
  body: string;
  data: T;
};



const initialState: ConvertState = {
  amount: 100,

  fromCurrencyId: "",
  toCurrencyId: "",

  currencies: [],

  result: null,

  loading: false,
  error: null,

  currenciesLoaded: false,
};



// =====================
// GET ALL CURRENCIES
// =====================

export const fetchCurrencies = createAsyncThunk<
  Currency[],
  void,
  { rejectValue: string }
>(
  "convert/fetchCurrencies",

  async (_, { rejectWithValue }) => {

    try {

      const response = await apiFetch<ApiResponse<Currency[]>>(
        "/currencies"
      );


      return response.data;


    } catch (error) {

      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to load currencies"
      );

    }

  }
);





// =====================
// CONVERT CURRENCY
// =====================

export const convertCurrency = createAsyncThunk<
  ConversionResult,
  void,
  {
    state: {
      convert: ConvertState;
    };
    rejectValue: string;
  }
>(

  "convert/convertCurrency",

  async (_, { getState, rejectWithValue }) => {

    try {

      const state = getState().convert;


      const response =
        await apiFetch<ApiResponse<ConversionResult>>(
          `/currencies/convert?amount=${state.amount}&fromCurrencyId=${state.fromCurrencyId}&toCurrencyId=${state.toCurrencyId}`
        );


      return response.data;


    } catch(error){

      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Conversion failed"
      );

    }

  }

);





const convertSlice = createSlice({

  name: "convert",

  initialState,


  reducers: {


    setAmount(
      state,
      action: PayloadAction<number>
    ){

      state.amount = action.payload;

    },



    setFromCurrency(
      state,
      action: PayloadAction<string>
    ){

      state.fromCurrencyId = action.payload;

    },



    setToCurrency(
      state,
      action: PayloadAction<string>
    ){

      state.toCurrencyId = action.payload;

    },



    swapCurrencies(state){

      const temp = state.fromCurrencyId;

      state.fromCurrencyId =
        state.toCurrencyId;

      state.toCurrencyId =
        temp;

    },


  },



  extraReducers(builder){


    builder



      // =====================
      // FETCH CURRENCIES
      // =====================

      .addCase(
        fetchCurrencies.pending,
        (state)=>{

          state.loading = true;
          state.error = null;

        }
      )


      .addCase(
        fetchCurrencies.fulfilled,
        (state, action)=>{


          state.loading = false;
          state.currenciesLoaded = true;


          state.currencies =
            action.payload;



          if(action.payload.length >= 2){


            state.fromCurrencyId =
              action.payload.find(
                c => c.code === "EUR"
              )?.id
              ??
              action.payload[0].id;



            state.toCurrencyId =
              action.payload.find(
                c => c.code === "JPY"
              )?.id
              ??
              action.payload[1].id;


          }


        }
      )


      .addCase(
        fetchCurrencies.rejected,
        (state, action)=>{

          state.loading = false;
          state.currenciesLoaded = true;

          state.error =
            action.payload ??
            "Unable to load currencies";

        }
      )





      // =====================
      // CONVERT
      // =====================


      .addCase(
        convertCurrency.pending,
        (state)=>{

          state.loading = true;
          state.error = null;

        }
      )



      .addCase(
        convertCurrency.fulfilled,
        (state, action)=>{

          state.loading = false;

          state.result =
            action.payload;

        }
      )



      .addCase(
        convertCurrency.rejected,
        (state, action)=>{

          state.loading = false;

          state.error =
            action.payload ??
            "Conversion failed";

        }
      );


  },


});





export const {
  setAmount,
  setFromCurrency,
  setToCurrency,
  swapCurrencies,

} = convertSlice.actions;



export default convertSlice.reducer;