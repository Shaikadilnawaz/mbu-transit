'use client';

// Shared professional shell for every admin page: a top bar with the admin's
// name + logout, and a scrollable row of section links. Replaces the old
// per-page sidebar.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/students', label: 'Students' },
  { href: '/admin/drivers', label: 'Drivers' },
  { href: '/admin/student-drivers', label: 'Student Drivers' },
  { href: '/admin/rides/active', label: 'Active Rides' },
  { href: '/admin/rides/history', label: 'All Rides' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/complaints', label: 'Complaints' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/sos', label: 'SOS' },
];

function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Shield className="h-5 w-5" />
            </span>
            MCONNECTS <span className="font-normal text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.name ?? 'Admin'}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
