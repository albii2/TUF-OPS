import type { ReactNode } from "react";

export function AppShell({ 
  sidebar,
  header,
  children,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {sidebar}
        <div className="flex min-h-screen flex-1 flex-col">
          {header}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
