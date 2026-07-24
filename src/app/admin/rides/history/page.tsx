'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminShell } from '@/components/layout/admin-shell';
import { subscribeAllBookings } from '@/lib/db';
import type { Booking } from '@/lib/types';

const STATUS_STYLES: Record<Booking['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', className: 'bg-blue-100 text-blue-800' },
  ongoing: { label: 'In progress', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

function MainContent() {
  const [rides, setRides] = useState<Booking[]>([]);

  useEffect(() => {
    const unsub = subscribeAllBookings(setRides);
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Rides History</CardTitle>
          <CardDescription>A complete record of every ride in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Track</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No rides yet.
                  </TableCell>
                </TableRow>
              )}
              {rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell className="font-medium">{ride.studentName}</TableCell>
                  <TableCell>{ride.driverName ?? '—'}</TableCell>
                  <TableCell>{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{ride.pickupLabel}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{ride.dropLabel}</TableCell>
                  <TableCell>₹{ride.fare}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[ride.status].className}>
                      {STATUS_STYLES[ride.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/track/${ride.id}`}>
                        <MapPin className="mr-2 h-4 w-4" /> Track
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminRidesHistoryPage() {
  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
