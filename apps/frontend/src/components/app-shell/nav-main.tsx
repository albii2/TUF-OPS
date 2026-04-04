import { cn } from "@/lib/utils";
import Link from "next/link";
import { Package } from "lucide-react";
import type { NavItem } from "@/types/navigation";

export function NavMain({ 
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  // TODO: Move this logic to the parent component that defines the navigation items
  const allItems = [...items];
  if (!allItems.some((item) => item.href === "/orders")) {
    const opportunitiesIndex = allItems.findIndex(
      (item) => item.href === "/opportunities"
    );
    const orderItem = { href: "/orders", label: "Orders", icon: Package };
    if (opportunitiesIndex !== -1) {
      allItems.splice(opportunitiesIndex + 1, 0, orderItem);
    } else {
      allItems.push(orderItem);
    }
  }

  return (
    <nav className="space-y-1">
      {allItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
