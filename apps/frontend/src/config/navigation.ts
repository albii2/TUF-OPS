import { LayoutDashboard, Building, Briefcase, Settings, Users, ClipboardList } from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "HQ",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "director", "rep"],
  },
  {
    label: "Leads",
    href: "/leads",
    icon: ClipboardList,
    roles: ["admin", "director"],
  },
  {
    label: "Programs",
    href: "/programs",
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
    label: "Team",
    href: "/opportunities/team",
    icon: Users,
    roles: ["admin", "director"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

export const FOCUS_NAV: NavItem[] = [
    {
        label: "My Programs",
        href: "/my/programs",
        roles: ["admin", "director", "rep"],
    },
    {
        label: "My Opportunities",
        href: "/my/opportunities",
        roles: ["admin", "director", "rep"],
    },
];
