'use client';

import { useEffect, useState } from 'react';
import { DriverNav } from '@/components/layout/driver-nav';
import { useAuth } from '@/context/auth-context';
import { subscribeDriverBookings } from '@/lib/db';
import { MessagesView } from '@/components/chat/messages-view';
import type { Booking } from '@/lib/types';

export default function DriverMessagesPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeDriverBookings(profile.uid, setBookings);
    return unsub;
  }, [profile]);

  const conversations = bookings.filter((b) =>
    ['accepted', 'ongoing', 'completed'].includes(b.status)
  );

  return (
    <div className="min-h-screen bg-background">
      <DriverNav />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <MessagesView bookings={conversations} otherName={(b) => b.studentName} />
      </main>
    </div>
  );
}
