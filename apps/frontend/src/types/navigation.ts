import type { AppRole } from "./auth";

export type NavItem = {
  label: string;
  href: string;
  roles: AppRole[];
};
