'use client';

import { type Session } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, Box, Folder, Home, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Opportunities', href: '/opportunities', icon: Folder },
    { name: 'Orders', href: '/orders', icon: Box },
    { name: 'Programs', href: '/programs', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface AppSidebarProps {
    session: Session | null;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export function AppSidebar({ session, sidebarOpen, setSidebarOpen }: AppSidebarProps) {
    const pathname = usePathname();

    const navContent = (
        <>
            <div className="flex items-center flex-shrink-0 px-4">
                <Image className="h-8 w-auto" src="/tuf-ops-logo.png" alt="TUF Ops" width={32} height={32} />
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                    >
                        <item.icon
                            className={cn(
                                pathname === item.href ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                                'mr-3 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                        />
                        {item.name}
                    </Link>
                ))}
            </nav>
        </>
    );

    return (
        <>
            {/* Mobile sidebar */}
            <div className={`md:hidden ${sidebarOpen ? 'fixed inset-0 flex z-40' : 'hidden'}`}>
                <div className="fixed inset-0">
                    <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
                </div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            type="button"
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Close sidebar</span>
                            <X className="h-6 w-6 text-white" aria-hidden="true" />
                        </button>
                    </div>
                    {navContent}
                </div>
                <div className="flex-shrink-0 w-14"></div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col h-0 flex-1">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                           {navContent}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
