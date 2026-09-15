declare type SearchParamProps = {
  params: { [key: string]: string };
  type: string;
  // searchParams: { [key: string]: string | string[] | undefined };
};

// ========================================

declare type SignUpParams = {
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  address: string;
  email: string;
  password: string;
};

declare type LoginUser = {
  email: string;
  password: string;
};

declare type User = {
  whoId: string;
  client_sc_id: number | string;
  vendor_sc_id: number | string;
  photo: string;
  name: string;
  email: string;
  isSubscribed: string;
  plan: string;
  complete: string;
  refund_plocy: string;
  terms_and_conditions: string;
};
