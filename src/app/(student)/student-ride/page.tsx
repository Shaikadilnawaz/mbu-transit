'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  Users,
  ChevronLeft,
  User,
  Loader2,
  Search,
  X,
  Phone,
  CheckCircle2,
  Navigation,
  Banknote,
  ShieldCheck,
  Bike,
  Car,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GuestNav } from '@/components/layout/guest-nav';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  MAX_RADIUS_KM,
  RIDE_SIM_DURATION_MS,
  distanceKm,
  isWithinCampusRadius,
  kmFromCampus,
  fareForDistance,
  computeDiscount,
  searchPlaces,
  reverseGeocode,
  type PlaceResult,
} from '@/lib/geo';
import {
  createBooking,
  subscribeBooking,
  setBookingStatus,
  completeRide,
  rateBooking,
  subscribeUsersByRole,
  subscribeStudentActiveBooking,
  subscribeStudentBookings,
  subscribeOffers,
} from '@/lib/db';
import { SEATS_FOR_VEHICLE, type Booking, type LatLng, type VehicleType, type UserProfile, type Offer } from '@/lib/types';
import { ChatBox } from '@/components/chat/chat-box';
import { StarRating } from '@/components/ui/star-rating';
import { useRideProgress } from '@/components/map/use-ride-progress';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  ),
});
const RideTrackingMap = dynamic(() => import('@/components/map/ride-tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  ),
});

type PointKind = 'pickup' | 'drop';

function BookingFlow() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<PointKind>('pickup');
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [drop, setDrop] = useState<LatLng | null>(null);
  const [pickupLabel, setPickupLabel] = useState('');
  const [dropLabel, setDropLabel] = useState('');
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [seats, setSeats] = useState(1);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchReqRef = useRef(0);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [placing, setPlacing] = useState(false);

  // Pool of student-drivers, used to check female-driver availability and to
  // detect when they've all declined.
  const [studentDrivers, setStudentDrivers] = useState<UserProfile[]>([]);
  const [driversLoaded, setDriversLoaded] = useState(false);
  useEffect(() => {
    if (!profile) return; // guests aren't allowed to read the users list
    const unsub = subscribeUsersByRole('student-driver', (d) => {
      setStudentDrivers(d);
      setDriversLoaded(true);
    });
    return unsub;
  }, [profile]);
  const hasFemaleDriver = studentDrivers.some(
    (d) => (d.gender ?? '').toLowerCase() === 'female' && d.online === true
  );
  // Only female students may request a female-only driver.
  const isFemaleStudent = (profile?.gender ?? '').toLowerCase() === 'female';
  useEffect(() => {
    if (!isFemaleStudent && femaleOnly) setFemaleOnly(false);
  }, [isFemaleStudent, femaleOnly]);

  // Offers: completed-ride count (auto offers) + admin coupon codes.
  const [completedRides, setCompletedRides] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  useEffect(() => {
    if (!profile) return;
    return subscribeStudentBookings(profile.uid, (bs) =>
      setCompletedRides(bs.filter((b) => b.status === 'completed').length)
    );
  }, [profile]);
  useEffect(() => {
    if (!profile) return;
    return subscribeOffers(setOffers);
  }, [profile]);
  const applyCoupon = () => {
    const found = offers.find((o) => o.active && o.code === couponCode.trim().toUpperCase());
    if (found) {
      setAppliedOffer(found);
      toast({ title: 'Coupon applied', description: found.title });
    } else {
      setAppliedOffer(null);
      toast({ variant: 'destructive', title: 'Invalid coupon', description: 'That code is not valid or inactive.' });
    }
  };

  // Bikes seat 1; cars seat up to 4.
  const maxSeats = SEATS_FOR_VEHICLE[vehicleType];
  useEffect(() => {
    setSeats((s) => (vehicleType === 'bike' ? 1 : Math.min(s, maxSeats)));
  }, [vehicleType, maxSeats]);

  // Resume an in-progress ride and prevent a second concurrent booking.
  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeStudentActiveBooking(profile.uid, (active) => {
      setBookingId((prev) => prev ?? (active ? active.id : null));
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    if (!bookingId) return;
    const unsub = subscribeBooking(bookingId, setBooking);
    return unsub;
  }, [bookingId]);

  useEffect(() => {
    if (booking?.status !== 'ongoing' || !booking.startedAt) return;
    const elapsed = Date.now() - new Date(booking.startedAt).getTime();
    const timer = setTimeout(() => completeRide(booking.id).catch(() => {}), Math.max(RIDE_SIM_DURATION_MS - elapsed, 0));
    return () => clearTimeout(timer);
  }, [booking?.status, booking?.startedAt, booking?.id]);

  useEffect(() => {
    const q = searchText.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const reqId = ++searchReqRef.current;
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(q);
        if (searchReqRef.current === reqId) setResults(found);
      } catch {
        if (searchReqRef.current === reqId) setResults([]);
      } finally {
        if (searchReqRef.current === reqId) setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const rideProgress = useRideProgress(booking);

  // Detect when every eligible student-driver has declined (or none exist).
  const declinedBy = booking?.declinedBy ?? [];
  const eligibleDrivers = (booking?.femaleOnly
    ? studentDrivers.filter((d) => (d.gender ?? '').toLowerCase() === 'female')
    : studentDrivers
  ).filter((d) => d.online === true);
  const noDriversAvailable =
    !!booking &&
    booking.status === 'pending' &&
    driversLoaded &&
    (eligibleDrivers.length === 0 || eligibleDrivers.every((d) => declinedBy.includes(d.uid)));

  const tripKm = pickup && drop ? distanceKm(pickup, drop) : 0;
  const baseFare = fareForDistance(tripKm) * seats;
  const { finalFare, discount, label: discountLabel } = computeDiscount(baseFare, completedRides, appliedOffer);
  const pickupOk = pickup ? isWithinCampusRadius(pickup) : true;
  const dropOk = drop ? isWithinCampusRadius(drop) : true;

  const applyPoint = (kind: PointKind, point: LatLng, label: string) => {
    if (kind === 'pickup') {
      setPickup(point);
      setPickupLabel(label);
    } else {
      setDrop(point);
      setDropLabel(label);
    }
    setError(null);
  };

  const handleMapPick = async (point: LatLng) => {
    const kind = mode;
    applyPoint(kind, point, 'Locating…');
    setFocus(point);
    if (kind === 'pickup' && !drop) setMode('drop');
    applyPoint(kind, point, await reverseGeocode(point));
  };

  const chooseResult = (r: PlaceResult) => {
    const kind = mode;
    const point = { lat: r.lat, lng: r.lng };
    applyPoint(kind, point, r.label);
    setFocus(point);
    setResults([]);
    setSearchText('');
    if (kind === 'pickup' && !drop) setMode('drop');
  };

  const handleBook = async () => {
    if (!user || !profile) {
      toast({ title: 'Please log in to book', description: 'Booking needs a student account.' });
      router.push('/login');
      return;
    }
    if (!pickup || !drop) {
      setError('Please set both a pickup and a drop point on the map.');
      return;
    }
    if (!isWithinCampusRadius(pickup)) {
      setError(`Invalid pickup location — ${kmFromCampus(pickup)} km away. Must be within ${MAX_RADIUS_KM} km of MBU.`);
      return;
    }
    if (!isWithinCampusRadius(drop)) {
      setError(`Invalid drop location — ${kmFromCampus(drop)} km away. Must be within ${MAX_RADIUS_KM} km of MBU.`);
      return;
    }
    if (distanceKm(pickup, drop) < 0.1) {
      setError('Pickup and drop cannot be the same place.');
      return;
    }
    if (femaleOnly && !hasFemaleDriver) {
      toast({
        variant: 'destructive',
        title: 'No female drivers available',
        description: 'Sorry for the inconvenience — there are no female drivers at present.',
      });
      return;
    }

    setPlacing(true);
    try {
      const id = await createBooking({
        studentUid: profile.uid,
        studentName: profile.name || 'Student',
        studentPhone: profile.phone,
        pickupLabel,
        dropLabel,
        pickup,
        drop,
        seats,
        fare: finalFare,
        rideType: 'student',
        vehicleType,
        femaleOnly,
      });
      setBookingId(id);
    } catch (e) {
      toast({
        title: 'Could not place booking',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPlacing(false);
    }
  };

  const cancelBooking = async () => {
    if (bookingId) await setBookingStatus(bookingId, 'cancelled');
    resetBooking();
  };

  const resetBooking = () => {
    setBookingId(null);
    setBooking(null);
    setPickup(null);
    setDrop(null);
    setPickupLabel('');
    setDropLabel('');
    setMode('pickup');
    setError(null);
  };

  // ---- Placed booking: waiting / ongoing / completed ---------------------
  if (bookingId && booking) {
    if (booking.status === 'completed') {
      return (
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="font-headline text-3xl text-accent">Ride completed 🎉</CardTitle>
            <CardDescription>Thanks for riding with a fellow student!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
              <span className="text-sm text-muted-foreground">Payment</span>
              <span className="flex items-center gap-2 font-semibold">
                <Banknote className="h-5 w-5 text-accent" /> Cash only — ₹{booking.fare}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center">
              <p className="font-medium">Rate your driver</p>
              <StarRating
                value={booking.ratingByStudent ?? 0}
                readOnly={!!booking.ratingByStudent}
                onRate={(n) => rateBooking(booking.id, 'student', n)}
              />
            </div>
            <ChatBox bookingId={booking.id} title={`Chat with ${booking.driverName ?? 'your driver'}`} />
            <Button onClick={resetBooking} className="w-full bg-primary hover:bg-primary/90">
              <ChevronLeft className="mr-2 h-4 w-4" /> Book Another Ride
            </Button>
          </CardContent>
        </Card>
      );
    }
    if (booking.status === 'accepted' || booking.status === 'ongoing') {
      const inProgress = booking.status === 'ongoing';
      return (
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="font-headline text-3xl text-accent">
              {inProgress ? 'Ride in progress' : 'Driver on the way!'}
            </CardTitle>
            <CardDescription>{booking.driverName} is your student driver.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!inProgress && booking.otp && (
              <div className="rounded-lg border-2 border-dashed border-accent bg-accent/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Share this OTP with your driver to start the ride</p>
                <p className="mt-1 text-4xl font-bold tracking-[0.3em] text-accent">{booking.otp}</p>
              </div>
            )}
            {inProgress && (
              <div className="h-64 w-full overflow-hidden rounded-lg border">
                <RideTrackingMap pickup={booking.pickup} drop={booking.drop} progress={rideProgress} />
              </div>
            )}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5 text-accent" /> {booking.driverName}
              </div>
              {booking.driverPhone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {booking.driverPhone}
                </div>
              )}
            </div>
            <ChatBox bookingId={booking.id} title={`Chat with ${booking.driverName ?? 'your driver'}`} />
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href={`/track/${booking.id}`}>Track Ride</Link>
            </Button>
            <Button variant="ghost" onClick={cancelBooking} className="w-full text-muted-foreground">
              Cancel ride
            </Button>
          </CardContent>
        </Card>
      );
    }
    if (booking.status === 'pending') {
      if (noDriversAvailable) {
        return (
          <Card className="w-full shadow-lg">
            <CardHeader className="text-center">
              <X className="mx-auto h-12 w-12 text-red-500" />
              <CardTitle className="font-headline text-3xl text-accent">No drivers right now</CardTitle>
              <CardDescription>
                Sorry for the inconvenience — there are no student drivers available at the moment. Please try again shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={cancelBooking} className="w-full bg-primary hover:bg-primary/90">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to booking
              </Button>
            </CardContent>
          </Card>
        );
      }
      return (
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
            <CardTitle className="font-headline text-3xl text-accent">Finding a student driver…</CardTitle>
            <CardDescription>We&apos;ve sent your request to fellow students heading your way.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg bg-accent/5 p-4 text-left text-sm">
              <p><span className="text-muted-foreground">Pickup:</span> {booking.pickupLabel}</p>
              <p><span className="text-muted-foreground">Drop:</span> {booking.dropLabel}</p>
              <p>
                <span className="text-muted-foreground">Vehicle:</span> {booking.vehicleType} ·{' '}
                <span className="text-muted-foreground">Seats:</span> {booking.seats} ·{' '}
                <span className="text-muted-foreground">Fare:</span> ₹{booking.fare}
                {booking.femaleOnly ? ' · Female only' : ''}
              </p>
            </div>
            <Button variant="outline" onClick={cancelBooking} className="w-full">
              <X className="mr-2 h-4 w-4" /> Cancel Request
            </Button>
          </CardContent>
        </Card>
      );
    }
  }

  // ---- Booking form ------------------------------------------------------
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-accent">Book a Student Ride</CardTitle>
        <CardDescription>
          Get a ride from a fellow student, within {MAX_RADIUS_KM} km of Mohan Babu University.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Pickup / drop toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={mode === 'pickup' ? 'default' : 'outline'} onClick={() => setMode('pickup')} className="justify-start">
            <MapPin className="mr-2 h-4 w-4 text-green-600" /> Set Pickup
          </Button>
          <Button type="button" variant={mode === 'drop' ? 'default' : 'outline'} onClick={() => setMode('drop')} className="justify-start">
            <MapPin className="mr-2 h-4 w-4 text-red-600" /> Set Drop
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="place-search">
            <Search className="mr-2 inline-block h-4 w-4" />
            Search a place for your {mode}
          </Label>
          <div className="relative">
            <Input
              id="place-search"
              placeholder="Start typing a place…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoComplete="off"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            {results.length > 0 && (
              <div className="absolute z-[1000] mt-1 max-h-56 w-full divide-y overflow-auto rounded-lg border bg-popover shadow-lg">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      chooseResult(r);
                    }}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="line-clamp-2">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Tip: you can also tap directly on the map.</p>
        </div>

        {/* Map */}
        <div className="h-64 w-full overflow-hidden rounded-lg border">
          <LocationPicker pickup={pickup} drop={drop} onPick={handleMapPick} focus={focus} />
        </div>

        {/* Chosen points */}
        <div className="grid gap-2 text-sm">
          <div className={`rounded-lg border p-3 ${pickup && !pickupOk ? 'border-red-500 bg-red-50' : ''}`}>
            <div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-green-600" /> Pickup</div>
            <p className="line-clamp-2 text-muted-foreground">{pickupLabel || 'Not set yet'}</p>
            {pickup && !pickupOk && <p className="mt-1 font-medium text-red-600">Invalid — {kmFromCampus(pickup)} km from MBU (max {MAX_RADIUS_KM}).</p>}
          </div>
          <div className={`rounded-lg border p-3 ${drop && !dropOk ? 'border-red-500 bg-red-50' : ''}`}>
            <div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-red-600" /> Drop</div>
            <p className="line-clamp-2 text-muted-foreground">{dropLabel || 'Not set yet'}</p>
            {drop && !dropOk && <p className="mt-1 font-medium text-red-600">Invalid — {kmFromCampus(drop)} km from MBU (max {MAX_RADIUS_KM}).</p>}
          </div>
        </div>

        {/* Vehicle type */}
        <div className="space-y-2">
          <Label>Vehicle type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={vehicleType === 'bike' ? 'default' : 'outline'} onClick={() => setVehicleType('bike')}>
              <Bike className="mr-2 h-4 w-4" /> Bike (1 seat)
            </Button>
            <Button type="button" variant={vehicleType === 'car' ? 'default' : 'outline'} onClick={() => setVehicleType('car')}>
              <Car className="mr-2 h-4 w-4" /> Car (up to 4)
            </Button>
          </div>
        </div>

        {/* Seats */}
        <div className="space-y-2">
          <Label htmlFor="seats"><Users className="mr-2 inline-block h-4 w-4" /> Seats</Label>
          {vehicleType === 'bike' ? (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">1 seat (bike)</p>
          ) : (
            <Select value={String(seats)} onValueChange={(v) => setSeats(parseInt(v, 10))}>
              <SelectTrigger id="seats"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Female only — available to female students only */}
        <button
          type="button"
          disabled={!isFemaleStudent}
          onClick={() => isFemaleStudent && setFemaleOnly((v) => !v)}
          className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            femaleOnly ? 'border-pink-500 bg-pink-50' : 'enabled:hover:bg-muted'
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            <ShieldCheck className={`h-4 w-4 ${femaleOnly ? 'text-pink-600' : 'text-muted-foreground'}`} />
            Female driver only
          </span>
          <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${femaleOnly ? 'bg-pink-500' : 'bg-muted-foreground/30'}`}>
            <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${femaleOnly ? 'translate-x-4' : ''}`} />
          </span>
        </button>
        {!isFemaleStudent && (
          <p className="text-xs text-muted-foreground">Only female students can request a female driver.</p>
        )}
        {femaleOnly && !hasFemaleDriver && (
          <p className="rounded-lg border border-pink-500 bg-pink-50 p-3 text-sm font-medium text-pink-700">
            Sorry for the inconvenience — there are no female drivers at present.
          </p>
        )}

        {/* Coupon */}
        {pickup && drop && (
          <div className="space-y-2">
            <Label htmlFor="coupon">
              <Ticket className="mr-2 inline-block h-4 w-4" /> Have a coupon?
            </Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
              />
              <Button type="button" variant="outline" onClick={applyCoupon} disabled={!couponCode.trim()}>
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Fare */}
        {pickup && drop && (
          <div className="flex items-center justify-between rounded-lg bg-accent/5 p-4 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Navigation className="h-4 w-4" /> Trip: {Math.round(tripKm * 10) / 10} km
            </span>
            <span className="flex items-center gap-2">
              {discount > 0 && <span className="text-muted-foreground line-through">₹{baseFare}</span>}
              <span className="text-lg font-bold text-accent">₹{finalFare}</span>
            </span>
          </div>
        )}
        {pickup && drop && discount > 0 && (
          <p className="text-sm font-medium text-green-600">🎉 {discountLabel} — you saved ₹{discount}!</p>
        )}

        {error && <p className="rounded-lg border border-red-500 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

        <Button
          onClick={handleBook}
          disabled={placing || !pickup || !drop || !pickupOk || !dropOk || (femaleOnly && !hasFemaleDriver)}
          className="w-full bg-primary py-6 text-lg hover:bg-primary/90"
        >
          {placing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Users className="mr-2 h-5 w-5" />}
          Book Student Ride
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StudentRidePage() {
  return (
    <div className="min-h-screen bg-background">
      <GuestNav />

      {/* Carpooling hero — built in-app with CSS + SVG. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-amber-600 to-amber-800 text-primary-foreground">
        <div className="container mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              Student-to-student rides
            </span>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
              Share the ride,
              <br />
              split the cost.
            </h1>
            <p className="max-w-md text-white/90">
              A fellow MBU student is heading your way. Hop on a bike or into a car, share the
              fuel, and travel together — safe, cheap, and by students, for students.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Verified students</span>
              <span className="flex items-center gap-1.5"><Bike className="h-4 w-4" /> Bike or car</span>
              <span className="flex items-center gap-1.5"><Banknote className="h-4 w-4" /> Split the fare</span>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <svg viewBox="0 0 300 200" className="h-full w-full">
              <path d="M28 172 C 110 120, 190 210, 272 34" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
              <circle cx="28" cy="172" r="7" fill="white" />
              <circle cx="272" cy="34" r="7" fill="white" />
            </svg>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl drop-shadow-lg">🚗</span>
            <span className="absolute bottom-3 left-4 text-xs font-medium">Pickup</span>
            <span className="absolute right-4 top-3 text-xs font-medium">Drop</span>
          </div>
        </div>
      </section>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <BookingFlow />
      </main>
    </div>
  );
}
