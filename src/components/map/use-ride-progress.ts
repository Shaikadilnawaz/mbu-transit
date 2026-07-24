'use client';

// Computes how far along the ride is (0 = at pickup, 1 = at drop) from the
// booking's shared `startedAt` time. Because every panel reads the same
// `startedAt`, they all compute the same position — so the auto moves in sync.

import { useEffect, useState } from 'react';
import { RIDE_SIM_DURATION_MS } from '@/lib/geo';
import type { Booking } from '@/lib/types';

export function useRideProgress(booking: Booking | null): number {
  const [progress, setProgress] = useState(0);
  const status = booking?.status;
  const startedAt = booking?.startedAt;

  useEffect(() => {
    if (status === 'completed') {
      setProgress(1);
      return;
    }
    if (status !== 'ongoing') {
      setProgress(0);
      return;
    }
    // Start moving the instant the ride is 'ongoing'. `startedAt` comes from a
    // server timestamp that can lag a moment; until it arrives we start the
    // clock from now so the auto never sits still after Start is pressed.
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min((Date.now() - start) / RIDE_SIM_DURATION_MS, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [status, startedAt]);

  return progress;
}
