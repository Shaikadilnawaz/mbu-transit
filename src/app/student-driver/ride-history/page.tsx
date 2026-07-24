'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StudentDriverNav } from '@/components/layout/student-driver-nav';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/context/auth-context';
import { subscribeDriverBookings, rateBooking } from '@/lib/db';
import type { Booking } from '@/lib/types';

const STATUS_STYLES: Record<Booking['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', className: 'bg-blue-100 text-blue-800' },
  ongoing: { label: 'In progress', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

export default function StudentDriverRideHistoryPage() {
  const { profile } = useAuth();
  const [rides, setRides] = useState<Booking[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeDriverBookings(profile.uid, setRides);
    return unsub;
  }, [profile]);

  return (
    <div className="min-h-screen bg-background">
      <StudentDriverNav />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Ride History</h1>
          <p className="text-muted-foreground">Rides you&apos;ve given to fellow students.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rate Student</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No rides yet. Accept a request from your dashboard.
                  </TableCell>
                </TableRow>
              )}
              {rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell className="font-medium">{ride.studentName}</TableCell>
                  <TableCell>{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{ride.pickupLabel}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{ride.dropLabel}</TableCell>
                  <TableCell>₹{ride.fare}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[ride.status].className}>
                      {STATUS_STYLES[ride.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ride.status === 'completed' ? (
                      <StarRating
                        size={18}
                        value={ride.ratingByDriver ?? 0}
                        readOnly={!!ride.ratingByDriver}
                        onRate={(n) => rateBooking(ride.id, 'driver', n)}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
