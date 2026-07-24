'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { subscribeAllBookings } from '@/lib/db';
import type { Booking } from '@/lib/types';
import {
  Users,
  Car,
  Settings,
  LogOut,
  Shield,
  LayoutDashboard,
  MapPin,
  History,
  Activity,
  BarChart3,
  MessageSquareWarning,
  Siren,
} from 'lucide-react';
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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AdminShell } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';

function MainContent() {
  // Live bookings from Firestore. We show the ones that are still active
  // (waiting for a driver, or accepted and on the way).
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const unsub = subscribeAllBookings(setBookings);
    return unsub;
  }, []);

  const activeRides = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'ongoing'
  );

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Rides</CardTitle>
            <CardDescription>
              Live bookings that are waiting for a driver or currently on the way.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Track</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRides.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No active rides right now.
                    </TableCell>
                  </TableRow>
                )}
                {activeRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell className="font-medium">{ride.studentName}</TableCell>
                    <TableCell>{ride.driverName ?? '—'}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{ride.pickupLabel}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{ride.dropLabel}</TableCell>
                    <TableCell>{ride.seats}</TableCell>
                    <TableCell>₹{ride.fare}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ride.status === 'ongoing'
                            ? 'bg-green-100 text-green-800'
                            : ride.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {ride.status === 'ongoing'
                          ? 'In progress'
                          : ride.status === 'accepted'
                          ? 'Driver assigned'
                          : 'Waiting for driver'}
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

export default function AdminActiveRidesPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
