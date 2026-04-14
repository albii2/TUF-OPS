'use client';

import { type Session } from 'next-auth';
import { Menu } from 'lucide-react';
import { NavUser } from './nav-user';

interface AppHeaderProps {
    setSidebarOpen: (open: boolean) => void;
    session: Session | null;
}

export function AppHeader({ setSidebarOpen, session }: AppHeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-background border-b border-border">
        <button
            type="button"
            className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setSidebarOpen(true)}
        >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 px-4 flex justify-end">
            <div className="ml-4 flex items-center md:ml-6">
                {session && <NavUser user={session.user} />}
            </div>
        </div>
    </div>
  );
}
