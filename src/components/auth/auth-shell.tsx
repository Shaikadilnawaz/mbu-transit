'use client';

// The two-column layout shared by the login and signup pages: marketing copy
// on the left, the form card on the right. Collapses to a single column on
// small screens.

import Link from 'next/link';
import type { ReactNode } from 'react';
import { GuestNav } from '@/components/layout/guest-nav';

interface Feature {
  title: string;
  description: string;
}

interface AuthShellProps {
  badge: string;
  title: ReactNode;
  subtitle: string;
  features: Feature[];
  children: ReactNode; // the form
}

export function AuthShell({ badge, title, subtitle, features, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16 lg:py-20">
        {/* Left: marketing */}
        <div className="space-y-6">
          <span className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            {badge}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">{subtitle}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="inline-block rounded-xl border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Continue browsing as guest
          </Link>
        </div>

        {/* Right: form card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </main>
    </div>
  );
}
