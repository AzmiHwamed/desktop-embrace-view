// features/convert/types.ts
export type Currency = {
  id: string;
  code: string;
  name: string;
};

export type ConversionResult = {
  from: Currency;
  to: Currency;
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  date: string;
};

export type ConvertState = {
  amount: number;

  fromCurrencyId: string;
  toCurrencyId: string;

  currencies: Currency[];

  result: ConversionResult | null;

  loading: boolean;
  error: string | null;

  // True once the initial currencies fetch has settled (fulfilled OR
  // rejected) at least once — gates the page skeleton, separate from
  // `loading`, which is shared between fetchCurrencies and convertCurrency
  // and toggles on every request.
  currenciesLoaded: boolean;
};