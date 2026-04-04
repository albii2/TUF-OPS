import Link from "next/link";
import { NavMain } from "./nav-main";
import type { NavItem } from "@/types/navigation";
import type { AppRole } from "@/types/auth";
import { PRIMARY_NAV, FOCUS_NAV } from "@/config/navigation";

export function AppSidebar({ 
  role,
  pathname,
}: {
  role: AppRole;
  pathname: string;
}) {
  const primaryItems = PRIMARY_NAV.filter((item) => item.roles.includes(role));
  const focusItems = FOCUS_NAV.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard">
            <h1 className="font-vcr text-2xl font-bold text-white">TUF {/* <span className="text-blue-500">//</span> */} OPS</h1>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <NavMain items={primaryItems} pathname={pathname} />
          </nav>
          <div className="mt-4 px-4">
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Focus</h2>
            <nav className="grid items-start text-sm font-medium">
              <NavMain items={focusItems} pathname={pathname} />
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
