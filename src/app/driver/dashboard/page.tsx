'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  Car,
  Activity,
  DollarSign,
  Star,
  Bell,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Navigation,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
  } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DriverNav } from '@/components/layout/driver-nav';
import { useToast } from '@/hooks/use-toast';
import {
  subscribePendingBookings,
  acceptBooking,
  declineBooking,
  completeRide,
  setDriverOnline,
  subscribeDriverActiveBooking,
  subscribeDriverBookings,
} from '@/lib/db';
import { RIDE_SIM_DURATION_MS } from '@/lib/geo';
import type { Booking } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MainContent() {
  const { toast } = useToast();
  const { profile } = useAuth();

  // Live list of ride requests waiting for a driver — shared by every driver.
  const [rideRequests, setRideRequests] = useState<Booking[]>([]);
  // Requests this driver personally dismissed (declined). Since requests are
  // broadcast to all drivers, declining just hides it for this driver, it
  // doesn't cancel the ride for the student.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  // The ride this driver is currently handling (accepted or ongoing).
  const [activeRide, setActiveRide] = useState<Booking | null>(null);
  // All of this driver's bookings, used for the earnings/stats.
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  // Whether this driver is online (available to receive requests).
  const [online, setOnline] = useState(false);
  useEffect(() => {
    setOnline(profile?.online ?? false);
  }, [profile?.uid, profile?.online]);
  const toggleOnline = (v: boolean) => {
    setOnline(v);
    if (profile) setDriverOnline(profile.uid, v).catch(() => {});
  };

  useEffect(() => {
    const unsub = subscribePendingBookings('auto', setRideRequests);
    return unsub;
  }, []);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeDriverActiveBooking(profile.uid, setActiveRide);
    return unsub;
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeDriverBookings(profile.uid, setMyBookings);
    return unsub;
  }, [profile]);

  // Finish the active ride once it's had time to reach the destination, so it
  // clears from the dashboard even if the student isn't watching their screen.
  useEffect(() => {
    if (activeRide?.status !== 'ongoing' || !activeRide.startedAt) return;
    const elapsed = Date.now() - new Date(activeRide.startedAt).getTime();
    const timer = setTimeout(() => completeRide(activeRide.id).catch(() => {}), Math.max(RIDE_SIM_DURATION_MS - elapsed, 0));
    return () => clearTimeout(timer);
  }, [activeRide?.status, activeRide?.startedAt, activeRide?.id]);

  const visibleRequests = rideRequests.filter((r) => !dismissed.has(r.id));

  // ---- Real earnings/stats derived from this driver's completed rides -----
  const completed = myBookings.filter((b) => b.status === 'completed');
  const totalRevenue = completed.reduce((sum, b) => sum + (b.fare || 0), 0);
  const today = new Date().toDateString();
  const ridesToday = completed.filter(
    (b) => b.createdAt && new Date(b.createdAt).toDateString() === today
  ).length;
  const ratings = completed
    .map((b) => b.ratingByStudent)
    .filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  // Earnings for each of the last 7 days.
  const weeklyEarnings = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const earnings = completed
      .filter((b) => b.createdAt && new Date(b.createdAt).toDateString() === key)
      .reduce((s, b) => s + (b.fare || 0), 0);
    return { day: WEEKDAYS[d.getDay()], earnings };
  });

  const handleAccept = async (booking: Booking) => {
    if (!profile) return;
    if (activeRide) {
      toast({
        variant: 'destructive',
        title: 'Finish your current ride first',
        description: 'You can only handle one ride at a time.',
      });
      return;
    }
    setAcceptingId(booking.id);
    try {
      await acceptBooking(booking.id, {
        uid: profile.uid,
        name: profile.name || 'Driver',
        phone: profile.phone,
      });
      toast({
        title: 'Ride Accepted!',
        description: `${booking.studentName} has been notified you're on the way.`,
      });
    } catch (e) {
      // If another driver accepted a split-second earlier, the request will
      // already be gone from the pending list — surface a friendly message.
      toast({
        variant: 'destructive',
        title: 'Could not accept',
        description: e instanceof Error ? e.message : 'This ride may have just been taken.',
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    if (profile) declineBooking(id, profile.uid).catch(() => {});
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between rounded-2xl border bg-card p-4">
          <div>
            <p className="font-semibold">{online ? 'You are online' : 'You are offline'}</p>
            <p className="text-sm text-muted-foreground">
              {online ? 'You can receive ride requests.' : 'Go online to receive ride requests.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
            <Switch checked={online} onCheckedChange={toggleOnline} aria-label="Toggle online" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {completed.length} completed ride{completed.length === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visibleRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                {visibleRequests.length > 0 ? 'Waiting for a driver' : 'No pending requests'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rides Today</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ridesToday}</div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating ? avgRating.toFixed(1) : '—'}</div>
              <p className="text-xs text-muted-foreground">
                Based on {ratings.length} rating{ratings.length === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Weekly Earnings
                </CardTitle>
                <CardDescription>
                    Your earnings for the last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyEarnings}>
                    <XAxis
                        dataKey="day"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                        contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        }}
                    />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        {activeRide && (
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" /> Your Active Ride
              </CardTitle>
              <CardDescription>
                {activeRide.status === 'ongoing'
                  ? 'Ride in progress — track it live.'
                  : "Head to pickup, then enter the student's OTP to start."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm">
                <p className="font-semibold">{activeRide.studentName}</p>
                <p className="text-muted-foreground">From: {activeRide.pickupLabel}</p>
                <p className="text-muted-foreground">To: {activeRide.dropLabel}</p>
                <p className="text-muted-foreground">Fare: ₹{activeRide.fare}</p>
              </div>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href={`/track/${activeRide.id}`}>
                  <Navigation className="mr-2 h-4 w-4" /> Open Live Tracking
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> New Ride Requests
            </CardTitle>
            <CardDescription>
              Accept or decline incoming ride requests from students.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!online && (
              <p className="py-8 text-center text-muted-foreground">
                You&apos;re offline. Turn on <strong>Online</strong> above to receive ride requests.
              </p>
            )}
            {online && activeRide && (
              <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                Finish your current ride to accept new requests.
              </p>
            )}
            {online && (visibleRequests.length > 0 ? visibleRequests.map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <p className="font-semibold">{request.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    From: {request.pickupLabel} <br />
                    To: {request.dropLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Seats: {request.seats}</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-lg font-bold text-accent">₹{request.fare}</div>
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       size="icon"
                       className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                       disabled={acceptingId === request.id || !!activeRide}
                       onClick={() => handleAccept(request)}
                     >
                       {acceptingId === request.id ? (
                         <Loader2 className="h-5 w-5 animate-spin" />
                       ) : (
                         <CheckCircle2 className="h-5 w-5" />
                       )}
                     </Button>
                     <Button
                       variant="outline"
                       size="icon"
                       className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                       onClick={() => handleDecline(request.id)}
                     >
                       <XCircle className="h-5 w-5" />
                     </Button>
                   </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-10 w-10 mb-2" />
                <p>No new ride requests at the moment.</p>
              </div>
            ))}
          </CardContent>
        </Card>
    </main>
  );
}

export default function DriverDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DriverNav />
      <MainContent />
    </div>
  );
}
