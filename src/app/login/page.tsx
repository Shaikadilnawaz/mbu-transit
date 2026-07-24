'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { GuestOnly } from '@/components/auth/guest-only';
import { AuthShell } from '@/components/auth/auth-shell';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/lib/types';

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: 'student', label: 'Student', hint: 'Book and track your rides.' },
  { value: 'student-driver', label: 'Student Driver', hint: 'Offer rides to fellow students.' },
  { value: 'driver', label: 'Driver', hint: 'Accept auto ride requests.' },
  { value: 'admin', label: 'Admin', hint: 'Manage rides, drivers and alerts.' },
];

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>('student');
  const current = ROLE_OPTIONS.find((r) => r.value === role)!;

  return (
    <GuestOnly>
      <AuthShell
        badge="Guest mode stays open until you book"
        title={<>Login only when you&apos;re <span className="text-accent">ready to book a ride.</span></>}
        subtitle="You can browse routes, offers, and schedules freely. Sign in here to unlock booking and tracking."
        features={[
          { title: 'Fast booking', description: 'Save your details once and reuse them for future trips.' },
          { title: 'Role-based access', description: 'Student, driver, and admin views stay separated.' },
        ]}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Login</h2>
          <p className="text-sm text-muted-foreground">Select your role to continue.</p>
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{current.hint}</p>
        </div>

        <LoginForm expectedRole={role} />

        <div className="mt-4 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/signup" className="font-medium text-accent underline">
            Create an account
          </Link>
        </div>
      </AuthShell>
    </GuestOnly>
  );
}
