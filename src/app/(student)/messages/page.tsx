'use client';

import { useEffect, useState } from 'react';
import { GuestNav } from '@/components/layout/guest-nav';
import { RoleGuard } from '@/components/auth/role-guard';
import { useAuth } from '@/context/auth-context';
import { subscribeStudentBookings } from '@/lib/db';
import { MessagesView } from '@/components/chat/messages-view';
import type { Booking } from '@/lib/types';

function Content() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeStudentBookings(profile.uid, setBookings);
    return unsub;
  }, [profile]);

  const conversations = bookings.filter(
    (b) => b.driverUid && ['accepted', 'ongoing', 'completed'].includes(b.status)
  );

  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <MessagesView bookings={conversations} otherName={(b) => b.driverName ?? 'Driver'} />
      </main>
    </div>
  );
}

export default function StudentMessagesPage() {
  return (
    <RoleGuard role="student">
      <Content />
    </RoleGuard>
  );
}
