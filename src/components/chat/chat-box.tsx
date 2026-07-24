'use client';

// Real-time chat between the student and driver of a booking. Both sides see
// messages live via a Firestore subscription.

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { subscribeMessages, sendMessage } from '@/lib/db';
import type { ChatMessage } from '@/lib/types';

export function ChatBox({
  bookingId,
  title = 'Chat',
  className,
}: {
  bookingId: string;
  title?: string;
  className?: string;
}) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeMessages(bookingId, setMessages);
    return unsub;
  }, [bookingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !profile) return;
    setText('');
    try {
      await sendMessage(bookingId, {
        senderUid: profile.uid,
        senderName: profile.name || 'User',
        text: t,
      });
    } catch {
      setText(t); // restore on failure
    }
  };

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-2xl border bg-card', className)}>
      <div className="flex items-center gap-2 border-b px-4 py-3 font-semibold">
        <MessageCircle className="h-5 w-5 text-accent" /> {title}
      </div>
      <div className="max-h-80 min-h-40 flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.senderUid === profile?.uid;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                {!mine && <span className="mb-0.5 block text-xs font-medium opacity-70">{m.senderName}</span>}
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" autoComplete="off" />
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
