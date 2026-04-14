'use client';

import { useState } from 'react';
import { type Session } from 'next-auth';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';

export function AppShellClient({ session, children }: { session: Session | null; children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex overflow-hidden bg-background">
            <AppSidebar session={session} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <AppHeader session={session} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
