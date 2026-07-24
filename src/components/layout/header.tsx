'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bus, User, Menu, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SOSButton } from '../sos-button';
import { SidebarTrigger } from '../ui/sidebar';
import { useAuth } from '@/context/auth-context';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const isDashboard = pathname.endsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  const isDriver = pathname.startsWith('/driver');

  const getDashboardLink = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isDriver) return "/driver/dashboard";
    return "/dashboard";
  }

  const getTitle = () => {
    if (isAdmin) return "MCONNECTS Admin";
    if (isDriver) return "MCONNECTS Driver";
    return "MCONNECTS";
  }

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <div className="flex items-center gap-2">
        {isDashboard ? (
          <SidebarTrigger>
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <Link
          href={getDashboardLink()}
          className="flex items-center gap-2 text-lg font-semibold md:text-base font-headline"
        >
          <span className="sr-only">MCONNECTS</span>
          <span className="font-bold text-foreground">{getTitle()}</span>
        </Link>
      </div>

      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {!isAdmin && !isDriver && <SOSButton />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('#')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/contact')}>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
