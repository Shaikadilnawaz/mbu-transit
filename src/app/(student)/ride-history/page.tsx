'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GuestNav } from '@/components/layout/guest-nav';
import { RoleGuard } from '@/components/auth/role-guard';
import { useAuth } from '@/context/auth-context';
import { subscribeStudentBookings } from '@/lib/db';
import type { Booking } from '@/lib/types';

const STATUS_STYLES: Record<Booking['status'], { label: string; className: string }> = {
  pending: { label: 'Finding driver', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Driver assigned', className: 'bg-blue-100 text-blue-800' },
  ongoing: { label: 'In progress', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

function Content() {
  const { profile } = useAuth();
  const [rides, setRides] = useState<Booking[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeStudentBookings(profile.uid, setRides);
    return unsub;
  }, [profile]);

  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ride History</h1>
          <p className="text-muted-foreground">A record of all your rides.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No rides yet. Book your first ride!
                  </TableCell>
                </TableRow>
              )}
              {rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-accent" />
                      <span>Auto</span>
                    </div>
                  </TableCell>
                  <TableCell>{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{ride.pickupLabel}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{ride.dropLabel}</TableCell>
                  <TableCell>₹{ride.fare}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[ride.status].className}>
                      {STATUS_STYLES[ride.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/track/${ride.id}`}>
                        {ride.status === 'ongoing' || ride.status === 'accepted' ? 'Track' : 'View'}
                      </Link>
                    </Button>
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

export default function RideHistoryPage() {
  return (
    <RoleGuard role="student">
      <Content />
    </RoleGuard>
  );
}
