import type { AppUserRecord } from "./user";

export type OrganizationRecord = {
  id: string;
  name: string;
  ownerId?: string | null;
  owner?: AppUserRecord | null;
  zohoAccountId?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};
