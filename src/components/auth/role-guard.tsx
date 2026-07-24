'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardPathForRole } from '@/context/auth-context';
import { isUserRole, type UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AuthLoadingScreen } from './auth-loading-screen';

export function RoleGuard({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) {
      router.replace('/login');
      return;
    }
    if (!isUserRole(profile.role)) {
      // A profile with an unrecognized role (e.g. a typo made while manually
      // provisioning a test account in the Firestore console) would otherwise
      // redirect back and forth between guards forever with no way out.
      toast({
        title: 'Account error',
        description: "Your account's role is invalid. Please contact support.",
        variant: 'destructive',
      });
      signOut().then(() => router.replace('/login'));
      return;
    }
    if (profile.role !== role) {
      router.replace(dashboardPathForRole(profile.role));
    }
  }, [loading, user, profile, role, router, signOut, toast]);

  if (loading || !user || !profile || profile.role !== role) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
