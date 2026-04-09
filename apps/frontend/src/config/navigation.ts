import { LayoutDashboard, Building, Briefcase, Settings } from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "director", "rep"],
  },
  {
    label: "Organizations",
    href: "/organizations",
    icon: Building,
    roles: ["admin", "director", "rep"],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: Briefcase,
    roles: ["admin", "director", "rep"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
];
