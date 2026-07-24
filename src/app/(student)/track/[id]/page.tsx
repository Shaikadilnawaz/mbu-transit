'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GuestNav } from '@/components/layout/guest-nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  ChevronLeft,
  Loader2,
  Phone,
  User,
  Navigation,
  Banknote,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { subscribeBooking, completeRide, rateBooking, startRideWithOtp } from '@/lib/db';
import { useRideProgress } from '@/components/map/use-ride-progress';
import { RIDE_SIM_DURATION_MS } from '@/lib/geo';
import { StarRating } from '@/components/ui/star-rating';
import { ChatBox } from '@/components/chat/chat-box';
import type { Booking } from '@/lib/types';

const RideTrackingMap = dynamic(() => import('@/components/map/ride-tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  ),
});

const STATUS_TEXT: Record<Booking['status'], string> = {
  pending: 'Waiting for a driver to accept',
  accepted: 'Driver is heading to your pickup',
  ongoing: 'On the way to the destination',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled',
};

function TrackContent({ id }: { id: string }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [otp, setOtp] = useState('');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startRideWithOtp(id, otp);
      setOtp('');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not start ride',
        description: e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    const unsub = subscribeBooking(id, (b) => {
      setBooking(b);
      setLoaded(true);
    });
    return unsub;
  }, [id]);

  // Auto-end the ride once the auto has had time to reach the destination.
  useEffect(() => {
    if (booking?.status !== 'ongoing' || !booking.startedAt) return;
    const elapsed = Date.now() - new Date(booking.startedAt).getTime();
    const remaining = Math.max(RIDE_SIM_DURATION_MS - elapsed, 0);
    const timer = setTimeout(() => {
      completeRide(id).catch(() => {});
    }, remaining);
    return () => clearTimeout(timer);
  }, [booking?.status, booking?.startedAt, id]);

  const progress = useRideProgress(booking);
  const isAssignedDriver = !!(booking && profile && booking.driverUid === profile.uid);
  const isParticipant = !!(booking && profile && (isAssignedDriver || booking.studentUid === profile.uid));
  const canChat = !!booking && ['accepted', 'ongoing', 'completed'].includes(booking.status);
  const pct = Math.round(progress * 100);

  let body: React.ReactNode;

  if (loading || !loaded) {
    body = (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  } else if (!user) {
    body = (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">Please log in to view this ride.</p>
          <Button asChild><Link href="/login">Go to Login</Link></Button>
        </CardContent>
      </Card>
    );
  } else if (!booking) {
    body = (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          This ride could not be found.
        </CardContent>
      </Card>
    );
  } else {
    body = (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Navigation className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="font-headline text-2xl md:text-3xl text-accent">
                Live Tracking
              </CardTitle>
              <CardDescription>
                {STATUS_TEXT[booking.status]}
                {booking.status === 'ongoing' && ` · ${pct}%`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* The map with the moving auto */}
          <div className="h-80 w-full overflow-hidden rounded-lg border">
            <RideTrackingMap pickup={booking.pickup} drop={booking.drop} progress={progress} />
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${booking.status === 'completed' ? 100 : pct}%` }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Ride Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span><span className="text-muted-foreground">From: </span>{booking.pickupLabel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <span><span className="text-muted-foreground">To: </span>{booking.dropLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seats</span>
                  <strong>{booking.seats}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fare</span>
                  <strong>₹{booking.fare}</strong>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">People</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span><span className="text-muted-foreground">Student: </span>{booking.studentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span><span className="text-muted-foreground">Driver: </span>{booking.driverName ?? 'Not assigned yet'}</span>
                </div>
                {booking.driverPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${booking.driverPhone}`} className="underline">{booking.driverPhone}</a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Driver: enter the student's OTP to start the ride */}
          {isAssignedDriver && booking.status === 'accepted' && (
            <div className="space-y-3 rounded-lg border-2 border-dashed border-accent p-4">
              <p className="font-medium">Enter the student&apos;s OTP to start the ride</p>
              <div className="flex gap-2">
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4-digit OTP"
                  className="text-lg tracking-[0.3em]"
                />
                <Button onClick={handleStart} disabled={starting || otp.trim().length < 4} className="shrink-0">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Ride'}
                </Button>
              </div>
            </div>
          )}

          {/* Chat between the student and driver */}
          {canChat && isParticipant && (
            <ChatBox
              bookingId={booking.id}
              title={isAssignedDriver ? `Chat with ${booking.studentName}` : `Chat with ${booking.driverName ?? 'your driver'}`}
            />
          )}

          {/* On completion: cash payment + rating */}
          {booking.status === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                <span className="text-sm text-muted-foreground">Payment</span>
                <span className="flex items-center gap-2 font-semibold">
                  <Banknote className="h-5 w-5 text-accent" /> Cash only — ₹{booking.fare}
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center">
                <p className="font-medium">{isAssignedDriver ? 'Rate the student' : 'Rate your driver'}</p>
                <StarRating
                  value={(isAssignedDriver ? booking.ratingByDriver : booking.ratingByStudent) ?? 0}
                  readOnly={!!(isAssignedDriver ? booking.ratingByDriver : booking.ratingByStudent)}
                  onRate={(n) => rateBooking(booking.id, isAssignedDriver ? 'driver' : 'student', n)}
                />
                <p className="text-sm text-muted-foreground">
                  {(isAssignedDriver ? booking.ratingByDriver : booking.ratingByStudent)
                    ? 'Thanks for your feedback!'
                    : `Tap a star to rate ${isAssignedDriver ? booking.studentName : booking.driverName}.`}
                </p>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => router.back()} className="w-full">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto max-w-4xl px-4 py-8">{body}</main>
    </div>
  );
}

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TrackContent id={id} />;
}
