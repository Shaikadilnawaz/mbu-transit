'use client';

// Top navigation for the student-driver area.

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';

const links = [
  { href: '/student-driver/dashboard', label: 'Dashboard' },
  { href: '/student-driver/ride-history', label: 'Ride History' },
  { href: '/student-driver/messages', label: 'Messages' },
  { href: '/student-driver/profile', label: 'Profile' },
];

export function StudentDriverNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/student-driver/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Users className="h-5 w-5" />
          </span>
          MCONNECTS <span className="font-normal text-muted-foreground">Student Driver</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.name ?? 'Student Driver'}</span>
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
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
