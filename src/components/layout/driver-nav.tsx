'use client';

// Professional top navigation for the driver area (replaces the old sidebar).

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Car, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';

const links = [
  { href: '/driver/dashboard', label: 'Dashboard' },
  { href: '/driver/ride-history', label: 'Ride History' },
  { href: '/driver/messages', label: 'Messages' },
  { href: '/driver/profile', label: 'Profile' },
];

export function DriverNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/driver/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Car className="h-5 w-5" />
          </span>
          MCONNECTS <span className="text-muted-foreground font-normal">Driver</span>
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
          <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.name ?? 'Driver'}</span>
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
