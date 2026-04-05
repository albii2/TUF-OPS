import { UserRole } from "@prisma/client";

export type AppRole = UserRole;

export type AppSessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
  managerId: string | null;
};