'use client';

// Lightweight top navigation for the public/guest-facing pages (landing,
// login, signup). Shows Login / Sign Up when logged out, or quick links +
// Logout when logged in.

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bus, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useAuth } from '@/context/auth-context';
import { SOSButton } from '@/components/sos-button';
import { ThemeToggle } from '@/components/theme-toggle';

// Links shown in the top bar for a logged-in student.
const studentLinks = [
  { href: '/dashboard', label: 'Home' },
  { href: '/book-auto', label: 'Book Auto' },
  { href: '/ride-history', label: 'Rides' },
  { href: '/messages', label: 'Messages' },
  { href: '/offers', label: 'Offers' },
  { href: '/contact', label: 'Contact' },
];

export function GuestNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Bus className="h-5 w-5" />
          </span>
          MCONNECTS
        </Link>

        {/* Center nav links for logged-in students */}
        {user && profile && (
          <nav className="hidden items-center gap-1 md:flex">
            {studentLinks.map((link) => {
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
        )}

        {user && profile ? (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SOSButton />
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile.name}</span>
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
            <MobileNav links={studentLinks} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn className="mr-1.5 h-4 w-4" /> Login
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                <UserPlus className="mr-1.5 h-4 w-4" /> Sign Up
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
