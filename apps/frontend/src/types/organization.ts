import type { AppUserRecord } from "./user";

export type OrganizationStatus = "active" | "inactive" | "archived";

export type OrganizationRecord = {
  id: string;
  name: string;
  status?: OrganizationStatus | null;
  ownerId?: string | null;
  owner?: AppUserRecord | null;
  zohoAccountId?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};
