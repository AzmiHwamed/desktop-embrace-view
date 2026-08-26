// store/account/types.ts
export type SubscriptionStatus = "active" | "trial" | "expired" | "cancelled" | "canceled";

export type Profile = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  currencyId: string;
  currentCountryId: string;
  languageId: string;
  language?: Language;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
};

export type Currency = {
  id: string;
  code: string;
  name: string;
};

export type Country = {
  id: string;
  name: string;
  alpha2Code: string;
  alpha3Code: string;
  flag?: string;
  currency?: Currency | null;
  language?: Language | null;
};

export type CountryPreferences = {
  countryId: string;
  currency: Currency | null;
  language: Language | null;
};

export type Language = {
  id: string;
  code: string;
  name: string;
};

export type AccountState = {
  profile: Profile | null;
  currencies: Currency[];
  countries: Country[];
  languages: Language[];
  loading: boolean;
  referenceLoading: boolean;
  saving: boolean;
  error: string | null;

  // True once each initial fetch has settled (fulfilled OR rejected) at
  // least once — gates the page skeleton, same pattern as the other slices.
  profileLoaded: boolean;
  referenceLoaded: boolean;
};
