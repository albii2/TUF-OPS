
import Link from "next/link";
import { PRIMARY_NAV } from "@/config/navigation";
import type { AppRole } from "@/types/auth";
import { NavMain } from "./nav-main";

export function AppSidebar({ 
  role,
  pathname,
}: {
  role: AppRole;
  pathname: string;
}) {
  const items = PRIMARY_NAV.filter((item) => item.roles.includes(role));

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
