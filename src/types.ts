import { metric_label_enum } from "./utils/utils";

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
  [x: string]: any;
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

export type LoginResponseType = {
  message: string;
  access_token: string;
  refresh_token: string;
};

export type LoginEmailErrorResponseType = {
  message: string;
  otp_access_token: string;
  otp_refresh_token: string;
};

export type RequestType = Request & {
  endTimer: (
    labels?: Partial<Record<metric_label_enum, string | number>> | undefined
  ) => void;
  used_memory_before: number;
  used_cpu_before: number;
  req_url: URL;
};
