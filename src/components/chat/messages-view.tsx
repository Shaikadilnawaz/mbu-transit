'use client';

// A simple messages screen: a list of conversations (one per ride that has a
// driver assigned) on the left, and the selected chat on the right.

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatBox } from '@/components/chat/chat-box';
import type { Booking } from '@/lib/types';

export function MessagesView({
  bookings,
  otherName,
}: {
  bookings: Booking[];
  otherName: (b: Booking) => string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">Messages</h1>
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {bookings.length === 0 && (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              No conversations yet. A chat appears here once a ride is confirmed.
            </p>
          )}
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={cn(
                'w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted',
                selectedId === b.id && 'border-accent bg-accent/5'
              )}
            >
              <div className="font-medium">{otherName(b)}</div>
              <div className="truncate text-xs text-muted-foreground">
                {b.pickupLabel} → {b.dropLabel}
              </div>
              <div className="text-xs capitalize text-muted-foreground">{b.status}</div>
            </button>
          ))}
        </div>
        <div>
          {selected ? (
            <ChatBox bookingId={selected.id} title={`Chat with ${otherName(selected)}`} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border bg-card text-muted-foreground">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
