'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  Users,
  Car,
  ChevronLeft,
  User,
  Loader2,
  Search,
  X,
  Phone,
  CheckCircle2,
  Navigation,
  Banknote,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Booking, LatLng, UserProfile, Offer } from '@/lib/types';
import { GuestNav } from '@/components/layout/guest-nav';
import { StarRating } from '@/components/ui/star-rating';
import { ChatBox } from '@/components/chat/chat-box';
import { useRideProgress } from '@/components/map/use-ride-progress';

// The map talks to the browser directly (Leaflet), so it must not be rendered
// on the server. next/dynamic with ssr:false loads it only in the browser.
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

function MainContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Which point the next tap / search will set.
  const [mode, setMode] = useState<PointKind>('pickup');
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [drop, setDrop] = useState<LatLng | null>(null);
  const [pickupLabel, setPickupLabel] = useState('');
  const [dropLabel, setDropLabel] = useState('');
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Address search box (live suggestions as you type).
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  // Used to ignore out-of-order search responses (a slow earlier request
  // arriving after a newer one).
  const searchReqRef = useRef(0);

  // Once a booking is placed we watch it live until a driver accepts.
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [placing, setPlacing] = useState(false);

  // The pool of auto drivers, to detect when they've all declined. Only query
  // it when signed in — guests aren't allowed to read the users list.
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [driversLoaded, setDriversLoaded] = useState(false);
  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeUsersByRole('driver', (d) => {
      setDrivers(d);
      setDriversLoaded(true);
    });
    return unsub;
  }, [profile]);

  // Offers: the student's completed-ride count (auto offers) + admin coupons.
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

  // Subscribe to the placed booking so the screen updates the instant a driver
  // accepts (or if it gets cancelled).
  // Resume an in-progress ride (e.g. after a page refresh), and stop the student
  // from starting a second booking while one is still active.
  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeStudentActiveBooking(profile.uid, (active) => {
      setBookingId((prev) => prev ?? (active ? active.id : null));
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    if (!bookingId) return;
    const unsub = subscribeBooking(bookingId, (b) => setBooking(b));
    return unsub;
  }, [bookingId]);

  // Auto-end the ride once the auto has had time to reach the destination.
  useEffect(() => {
    if (booking?.status !== 'ongoing' || !booking.startedAt) return;
    const elapsed = Date.now() - new Date(booking.startedAt).getTime();
    const remaining = Math.max(RIDE_SIM_DURATION_MS - elapsed, 0);
    const timer = setTimeout(() => {
      completeRide(booking.id).catch(() => {});
    }, remaining);
    return () => clearTimeout(timer);
  }, [booking?.status, booking?.startedAt, booking?.id]);

  // Live search: whenever the typed text changes, wait 400ms (so we don't fire
  // a request on every keystroke), then fetch matching places and show them as
  // suggestions — just like Rapido/Uber.
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

  // If we arrived here from the home page's quick-book form, prefill the search
  // box with what the student typed there (carried in the URL). Runs once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('pickup');
    const d = params.get('drop');
    if (p) {
      setMode('pickup');
      setSearchText(p);
    } else if (d) {
      setMode('drop');
      setSearchText(d);
    }
  }, []);

  // Live progress of the moving auto (0..1) once the ride is ongoing.
  const rideProgress = useRideProgress(booking);

  // True when every ONLINE driver has declined (or none are online).
  const declinedBy = booking?.declinedBy ?? [];
  const onlineDrivers = drivers.filter((d) => d.online === true);
  const noDriversAvailable =
    !!booking &&
    booking.status === 'pending' &&
    driversLoaded &&
    (onlineDrivers.length === 0 || onlineDrivers.every((d) => declinedBy.includes(d.uid)));

  const tripKm = pickup && drop ? distanceKm(pickup, drop) : 0;
  const baseFare = fareForDistance(tripKm) * seats;
  const { finalFare, discount, label: discountLabel } = computeDiscount(baseFare, completedRides, appliedOffer);

  const pickupOk = pickup ? isWithinCampusRadius(pickup) : true;
  const dropOk = drop ? isWithinCampusRadius(drop) : true;

  // Store a chosen point on whichever field is active, then fetch a nice label.
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
    // After choosing a pickup by tapping, jump to setting the drop next.
    if (kind === 'pickup' && !drop) setMode('drop');
    const label = await reverseGeocode(point);
    applyPoint(kind, point, label);
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
      toast({
        title: 'Please log in to book a ride',
        description: 'Booking needs a student account.',
      });
      router.push('/login');
      return;
    }
    if (!pickup || !drop) {
      setError('Please set both a pickup and a drop point on the map.');
      return;
    }
    // The 30 km rule.
    if (!isWithinCampusRadius(pickup)) {
      setError(
        `Invalid pickup location — it is ${kmFromCampus(pickup)} km away. Pickup must be within ${MAX_RADIUS_KM} km of Mohan Babu University.`
      );
      return;
    }
    if (!isWithinCampusRadius(drop)) {
      setError(
        `Invalid drop location — it is ${kmFromCampus(drop)} km away. Drop must be within ${MAX_RADIUS_KM} km of Mohan Babu University.`
      );
      return;
    }
    if (distanceKm(pickup, drop) < 0.1) {
      setError('Pickup and drop cannot be the same place.');
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

  // ---- Screen: waiting for a driver, driver accepted, or completed -------
  if (bookingId && booking) {
    if (booking.status === 'completed') {
      return (
        <Card className="w-full shadow-lg animate-in fade-in-50">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="font-headline text-3xl text-accent">Ride completed 🎉</CardTitle>
            <CardDescription>Thanks for riding with MCONNECTS!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">From</p>
                <p className="font-medium line-clamp-2">{booking.pickupLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">To</p>
                <p className="font-medium line-clamp-2">{booking.dropLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Driver</p>
                <p className="font-medium">{booking.driverName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fare</p>
                <p className="font-medium">₹{booking.fare}</p>
              </div>
            </div>

            {/* Payment — cash only */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
              <span className="text-sm text-muted-foreground">Payment</span>
              <span className="flex items-center gap-2 font-semibold">
                <Banknote className="h-5 w-5 text-accent" /> Cash only — pay ₹{booking.fare}
              </span>
            </div>

            {/* Rate the driver */}
            <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center">
              <p className="font-medium">Rate your driver</p>
              <StarRating
                value={booking.ratingByStudent ?? 0}
                readOnly={!!booking.ratingByStudent}
                onRate={(n) => rateBooking(booking.id, 'student', n)}
              />
              {booking.ratingByStudent ? (
                <p className="text-sm text-muted-foreground">Thanks for your feedback!</p>
              ) : (
                <p className="text-sm text-muted-foreground">Tap a star to rate {booking.driverName}.</p>
              )}
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
        <Card className="w-full shadow-lg animate-in fade-in-50">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="font-headline text-3xl text-accent">
              {inProgress ? 'Ride in progress' : 'Driver on the way!'}
            </CardTitle>
            <CardDescription>
              {inProgress
                ? `${booking.driverName} has started your ride.`
                : `${booking.driverName} accepted your ride.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!inProgress && booking.otp && (
              <div className="rounded-lg border-2 border-dashed border-accent bg-accent/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Share this OTP with your driver to start the ride</p>
                <p className="mt-1 text-4xl font-bold tracking-[0.3em] text-accent">{booking.otp}</p>
              </div>
            )}
            {inProgress && (
              <>
                <div className="h-64 w-full overflow-hidden rounded-lg border">
                  <RideTrackingMap pickup={booking.pickup} drop={booking.drop} progress={rideProgress} />
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.round(rideProgress * 100)}%` }}
                  />
                </div>
              </>
            )}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <User className="h-5 w-5 text-accent" /> {booking.driverName}
              </div>
              {booking.driverPhone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {booking.driverPhone}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pickup</p>
                <p className="font-medium line-clamp-2">{booking.pickupLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Drop</p>
                <p className="font-medium line-clamp-2">{booking.dropLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Seats</p>
                <p className="font-medium">{booking.seats}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fare</p>
                <p className="font-medium">₹{booking.fare}</p>
              </div>
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
          <Card className="w-full shadow-lg animate-in fade-in-50">
            <CardHeader className="text-center">
              <X className="mx-auto h-12 w-12 text-red-500" />
              <CardTitle className="font-headline text-3xl text-accent">No drivers right now</CardTitle>
              <CardDescription>
                Sorry for the inconvenience — there are no drivers available at the moment. Please try again shortly.
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
        <Card className="w-full shadow-lg animate-in fade-in-50">
          <CardHeader className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-accent animate-spin" />
            <CardTitle className="font-headline text-3xl text-accent">Finding your driver…</CardTitle>
            <CardDescription>
              We&apos;ve sent your request to nearby drivers. Hang tight while one accepts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg bg-accent/5 p-4 text-sm text-left space-y-1">
              <p><span className="text-muted-foreground">Pickup:</span> {booking.pickupLabel}</p>
              <p><span className="text-muted-foreground">Drop:</span> {booking.dropLabel}</p>
              <p><span className="text-muted-foreground">Seats:</span> {booking.seats} · <span className="text-muted-foreground">Fare:</span> ₹{booking.fare}</p>
            </div>
            <Button variant="outline" onClick={cancelBooking} className="w-full">
              <X className="mr-2 h-4 w-4" /> Cancel Request
            </Button>
          </CardContent>
        </Card>
      );
    }
    // status === 'cancelled' falls through to the booking form below.
  }

  // ---- Screen: the booking form with the map -----------------------------
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-accent">Book an Auto Ride</CardTitle>
        <CardDescription>
          Set your pickup and drop within {MAX_RADIUS_KM} km of Mohan Babu University.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Which point are we choosing? */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === 'pickup' ? 'default' : 'outline'}
            onClick={() => setMode('pickup')}
            className="justify-start"
          >
            <MapPin className="mr-2 h-4 w-4 text-green-600" /> Set Pickup
          </Button>
          <Button
            type="button"
            variant={mode === 'drop' ? 'default' : 'outline'}
            onClick={() => setMode('drop')}
            className="justify-start"
          >
            <MapPin className="mr-2 h-4 w-4 text-red-600" /> Set Drop
          </Button>
        </div>

        {/* Search box with live suggestions */}
        <div className="space-y-2">
          <Label htmlFor="place-search">
            <Search className="inline-block mr-2 h-4 w-4" />
            Search a place for your {mode === 'pickup' ? 'pickup' : 'drop'}
          </Label>
          <div className="relative">
            <Input
              id="place-search"
              placeholder="Start typing a place, e.g. Tirupati Bus Stand"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoComplete="off"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {/* Suggestions dropdown that floats over the content below it. */}
            {results.length > 0 && (
              <div className="absolute z-[1000] mt-1 w-full rounded-lg border bg-popover shadow-lg divide-y max-h-56 overflow-auto">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    // onMouseDown fires before the input's blur, so the click
                    // isn't lost when focus leaves the search box.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      chooseResult(r);
                    }}
                    className="flex w-full items-start gap-2 text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="line-clamp-2">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: you can also tap directly on the map to drop a pin.
          </p>
        </div>

        {/* The map */}
        <div className="h-72 w-full overflow-hidden rounded-lg border">
          <LocationPicker pickup={pickup} drop={drop} onPick={handleMapPick} focus={focus} />
        </div>

        {/* Chosen points summary */}
        <div className="grid gap-2 text-sm">
          <div className={`rounded-lg border p-3 ${pickup && !pickupOk ? 'border-red-500 bg-red-50' : ''}`}>
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4 text-green-600" /> Pickup
            </div>
            <p className="text-muted-foreground line-clamp-2">{pickupLabel || 'Not set yet'}</p>
            {pickup && !pickupOk && (
              <p className="text-red-600 font-medium mt-1">
                Invalid pickup location — {kmFromCampus(pickup)} km from MBU (max {MAX_RADIUS_KM} km).
              </p>
            )}
          </div>
          <div className={`rounded-lg border p-3 ${drop && !dropOk ? 'border-red-500 bg-red-50' : ''}`}>
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4 text-red-600" /> Drop
            </div>
            <p className="text-muted-foreground line-clamp-2">{dropLabel || 'Not set yet'}</p>
            {drop && !dropOk && (
              <p className="text-red-600 font-medium mt-1">
                Invalid drop location — {kmFromCampus(drop)} km from MBU (max {MAX_RADIUS_KM} km).
              </p>
            )}
          </div>
        </div>

        {/* Seats */}
        <div className="space-y-2">
          <Label htmlFor="seats">
            <Users className="inline-block mr-2 h-4 w-4" />
            Seats Wanted
          </Label>
          <Select value={String(seats)} onValueChange={(v) => setSeats(parseInt(v, 10))}>
            <SelectTrigger id="seats">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

        {/* Fare + distance */}
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

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-500 p-3 text-sm text-red-600 font-medium">
            {error}
          </p>
        )}

        <Button
          onClick={handleBook}
          disabled={placing || !pickup || !drop || !pickupOk || !dropOk}
          className="w-full bg-primary text-lg py-6 hover:bg-primary/90"
        >
          {placing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Car className="mr-2 h-5 w-5" />}
          Book Auto
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BookAutoPage() {
  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <MainContent />
      </main>
    </div>
  );
}
