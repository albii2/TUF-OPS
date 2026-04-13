export type AppRole = "admin" | "regional_director" | "sales_rep";

export type AppSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: AppRole;
};

export type AppSession = {
  user: AppSessionUser;
};
