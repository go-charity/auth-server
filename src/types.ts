export type UserType = {
  _id?: string;
  user_type: "orphanage" | "donor";
  government_ID: string;
  email: string;
  password: string;
  authenticated: boolean;
  metadata: {
    fullname: string;
    phone_number: number;
    tagline?: string;
  };
};

export type TokenDataType = {
  user_ID: string;
  user_role: string;
};

export type TokenObjType = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenType = {
  id: string;
  user_ID: string;
  expires_in: Date;
  valid_days: number;
  user_role: string;
};
