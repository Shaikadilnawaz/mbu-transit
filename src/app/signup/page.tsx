'use client';

import Link from 'next/link';
import { SignUpForm } from '@/components/auth/signup-form';
import { GuestOnly } from '@/components/auth/guest-only';
import { AuthShell } from '@/components/auth/auth-shell';

export default function SignUpPage() {
  return (
    <GuestOnly>
      <AuthShell
        badge="New student onboarding"
        title={<>Create your account in <span className="text-accent">a few quick steps.</span></>}
        subtitle="Add the minimum details once. After that, booking rides and tracking trips becomes a one-step flow."
        features={[
          { title: 'Minimal data', description: 'Name, email, phone, and roll number are enough to start.' },
          { title: 'Guest-first', description: 'You only sign up when you decide to book a ride.' },
        ]}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Create account</h2>
          <p className="text-sm text-muted-foreground">Use the details below to unlock booking.</p>
        </div>
        <SignUpForm />
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent underline">
            Login here
          </Link>
        </div>
      </AuthShell>
    </GuestOnly>
  );
}
