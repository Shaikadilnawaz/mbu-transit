'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardPathForRole } from '@/context/auth-context';
import { isUserRole } from '@/lib/types';
import { AuthLoadingScreen } from './auth-loading-screen';

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const hasValidSession = Boolean(user && profile && isUserRole(profile.role));

  useEffect(() => {
    if (!loading && user && profile && isUserRole(profile.role)) {
      router.replace(dashboardPathForRole(profile.role));
    }
  }, [loading, user, profile, router]);

  if (loading || hasValidSession) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
