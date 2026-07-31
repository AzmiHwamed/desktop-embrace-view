export type Profile = {
  name: string;
  email: string;
  city: string;
  homeCurrency: string;
};

export type AccountState = {
  profile: Profile;
  saving: boolean;
};
