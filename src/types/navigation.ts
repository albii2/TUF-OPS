import type { AppRole } from "./auth";

export type NavItem = {
  label: string;
  href: string;
  icon?: React.ElementType;
  roles: AppRole[];
};
