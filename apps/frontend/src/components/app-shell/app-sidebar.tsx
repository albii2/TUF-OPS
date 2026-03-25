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
      <div className="border-b p-4">
        <div className="text-lg font-semibold">TUF Ops</div>
      </div>

      <div className="p-4">
        <NavMain items={items} pathname={pathname} />
      </div>
    </aside>
  );
}
