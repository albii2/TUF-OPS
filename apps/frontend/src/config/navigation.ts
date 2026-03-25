import { LayoutDashboard, Building, Briefcase } from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "regional_director", "sales_rep"],
  },
  {
    label: "Organizations",
    href: "/organizations",
    icon: Building,
    roles: ["admin", "regional_director", "sales_rep"],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: Briefcase,
    roles: ["admin", "regional_director", "sales_rep"],
  },
];
