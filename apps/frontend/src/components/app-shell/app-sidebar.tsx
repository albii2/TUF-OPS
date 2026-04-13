import Link from "next/link";
import { Home, Users, Briefcase, User } from "lucide-react";
import { NavMain, type NavItem } from "./nav-main";

const PRIMARY_NAV: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
        allowedRoles: ["user", "admin"],
    },
    {
        label: "My Workspace",
        href: "/my",
        icon: <User className="h-5 w-5" />,
        allowedRoles: ["user", "admin"],
    },
    {
        label: "Organizations",
        href: "/organizations",
        icon: <Users className="h-5 w-5" />,
        allowedRoles: ["user", "admin"],
    },
    {
        label: "Opportunities",
        href: "/opportunities",
        icon: <Briefcase className="h-5 w-5" />,
        allowedRoles: ["user", "admin"],
    },
];

export function AppSidebar({ 
  role,
  pathname,
}: {
  role: string;
  pathname: string;
}) {
  const items = PRIMARY_NAV.filter((item) => item.allowedRoles.includes(role));

  return (
    <aside className="hidden w-64 border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard">
            <h1 className="font-vcr text-2xl font-bold text-white">TUF <span className="text-blue-500">//</span> OPS</h1>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <NavMain items={items} pathname={pathname} />
          </nav>
        </div>
      </div>
    </aside>
  );
}
