import type { NavItem } from "@/types/navigation";

export const APP_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["admin", "regional_director", "sales_rep"],
  },
  {
    label: "Organizations",
    href: "/organizations",
    roles: ["admin", "regional_director", "sales_rep"],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    roles: ["admin", "regional_director", "sales_rep"],
  },
];
