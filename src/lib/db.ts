// Central place for all Firestore reads/writes. Keeping the database code here
// (instead of inside each page) means every screen talks to the same
// collections in the same way, and there's a single file to look at when you
// want to understand how data flows through the app.

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Booking,
  BookingRideType,
  BookingStatus,
  ChatMessage,
  Complaint,
  Offer,
  SosAlert,
  UserProfile,
  UserRole,
  VehicleType,
} from './types';

// A guard we reuse everywhere: if Firebase isn't configured we fail loudly
// instead of throwing a confusing "db is null" error deep inside Firestore.
function requireDb() {
  if (!db) {
    throw new Error(
      'Database not available. Check that .env.local has your NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
  return db;
}

/* ------------------------------------------------------------------ */
/*  SOS alerts  (students raise them, admins watch them live)         */
/* ------------------------------------------------------------------ */

export interface NewSosInput {
  userName: string;
  location: string;
  reason: string;
}

// Called when a student presses "Send SOS". Creates one document in the
// `sos` collection that the admin SOS page is listening to.
export async function createSosAlert(input: NewSosInput): Promise<void> {
  const database = requireDb();
  await addDoc(collection(database, 'sos'), {
    user: input.userName,
    location: input.location,
    reason: input.reason,
    status: 'Pending',
    createdAt: serverTimestamp(),
  });
}

// Admin SOS page uses this to get a live, always-up-to-date list. The callback
// re-runs automatically every time an alert is added or its status changes.
// Returns an "unsubscribe" function you call to stop listening.
export function subscribeSosAlerts(
  onChange: (alerts: SosAlert[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'sos'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        user: data.user ?? 'Unknown',
        location: data.location ?? '—',
        reason: data.reason ?? '—',
        // createdAt is a Firestore Timestamp; format it for display.
        date: data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleString()
          : '—',
        status: (data.status as SosAlert['status']) ?? 'Pending',
      } satisfies SosAlert;
    });
    onChange(alerts);
  });
}

export async function setSosStatus(
  id: string,
  status: SosAlert['status']
): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'sos', id), { status });
}

/* ------------------------------------------------------------------ */
/*  Bookings  (student books → all drivers see it → one accepts)      */
/* ------------------------------------------------------------------ */

export interface NewBookingInput {
  studentUid: string;
  studentName: string;
  studentPhone?: string;
  pickupLabel: string;
  dropLabel: string;
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  seats: number;
  fare: number;
  rideType?: BookingRideType; // defaults to 'auto'
  vehicleType?: VehicleType;
  femaleOnly?: boolean;
}

// Turns a Firestore document into our Booking type. Shared by all the
// subscribe helpers below so the mapping lives in exactly one place.
function toBooking(id: string, data: Record<string, unknown>): Booking {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const acceptedAt = data.acceptedAt as { toDate?: () => Date } | undefined;
  const startedAt = data.startedAt as { toDate?: () => Date } | undefined;
  return {
    id,
    studentUid: (data.studentUid as string) ?? '',
    studentName: (data.studentName as string) ?? 'Unknown',
    studentPhone: data.studentPhone as string | undefined,
    pickupLabel: (data.pickupLabel as string) ?? '',
    dropLabel: (data.dropLabel as string) ?? '',
    pickup: (data.pickup as Booking['pickup']) ?? { lat: 0, lng: 0 },
    drop: (data.drop as Booking['drop']) ?? { lat: 0, lng: 0 },
    seats: (data.seats as number) ?? 1,
    fare: (data.fare as number) ?? 0,
    status: (data.status as BookingStatus) ?? 'pending',
    createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : '',
    driverUid: data.driverUid as string | undefined,
    driverName: data.driverName as string | undefined,
    driverPhone: data.driverPhone as string | undefined,
    acceptedAt: acceptedAt?.toDate ? acceptedAt.toDate().toISOString() : undefined,
    startedAt: startedAt?.toDate ? startedAt.toDate().toISOString() : undefined,
    paymentMethod: data.paymentMethod as Booking['paymentMethod'],
    otp: data.otp as string | undefined,
    ratingByStudent: data.ratingByStudent as number | undefined,
    ratingByDriver: data.ratingByDriver as number | undefined,
    rideType: (data.rideType as BookingRideType) ?? 'auto',
    vehicleType: data.vehicleType as VehicleType | undefined,
    femaleOnly: data.femaleOnly as boolean | undefined,
    declinedBy: (data.declinedBy as string[]) ?? [],
  };
}

// A driver declines a request. Recorded on the booking so the student's screen
// can tell when every available driver has declined.
export async function declineBooking(bookingId: string, driverUid: string): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'bookings', bookingId), {
    declinedBy: arrayUnion(driverUid),
  });
}

// Student books a ride. Returns the new booking's id so the student page can
// then watch that specific booking for a driver to accept it.
export async function createBooking(input: NewBookingInput): Promise<string> {
  const database = requireDb();
  // Build the payload explicitly so we never send `undefined` values (which
  // Firestore rejects). Optional fields are only included when present.
  const payload: Record<string, unknown> = {
    studentUid: input.studentUid,
    studentName: input.studentName,
    pickupLabel: input.pickupLabel,
    dropLabel: input.dropLabel,
    pickup: input.pickup,
    drop: input.drop,
    seats: input.seats,
    fare: input.fare,
    rideType: input.rideType ?? 'auto',
    status: 'pending' as BookingStatus,
    createdAt: serverTimestamp(),
  };
  if (input.studentPhone) payload.studentPhone = input.studentPhone;
  if (input.vehicleType) payload.vehicleType = input.vehicleType;
  if (typeof input.femaleOnly === 'boolean') payload.femaleOnly = input.femaleOnly;

  const ref = await addDoc(collection(database, 'bookings'), payload);
  return ref.id;
}

// Driver dashboard: live list of rides still waiting for a driver, filtered to
// a ride type ('auto' for auto-drivers, 'student' for student-drivers). We
// filter status in the query and ride type in JS so no composite index needed.
export function subscribePendingBookings(
  rideType: BookingRideType,
  onChange: (bookings: Booking[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(
    collection(database, 'bookings'),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snap) => {
    const bookings = snap.docs
      .map((d) => toBooking(d.id, d.data()))
      .filter((b) => (b.rideType ?? 'auto') === rideType)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onChange(bookings);
  });
}

// Admin: live list of every booking, whatever its status.
export function subscribeAllBookings(
  onChange: (bookings: Booking[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(
    collection(database, 'bookings'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => toBooking(d.id, d.data())));
  });
}

// Student: watch one specific booking so the UI updates the moment a driver
// accepts (status flips to 'accepted' and the driver's details appear).
export function subscribeBooking(
  bookingId: string,
  onChange: (booking: Booking | null) => void
): Unsubscribe {
  const database = requireDb();
  return onSnapshot(doc(database, 'bookings', bookingId), (snap) => {
    onChange(snap.exists() ? toBooking(snap.id, snap.data()) : null);
  });
}

export interface AcceptingDriver {
  uid: string;
  name: string;
  phone?: string;
}

// Driver taps "Accept". This stamps the booking with the driver's details and
// starts the ride straight away (status 'ongoing' + startedAt), so the auto
// begins moving along the route immediately on confirmation. Payment is cash.
export async function acceptBooking(
  bookingId: string,
  driver: AcceptingDriver
): Promise<void> {
  const database = requireDb();
  const ref = doc(database, 'bookings', bookingId);
  // A 4-digit OTP the student shares with the driver to start the ride.
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  // Run in a transaction so only the FIRST driver to accept wins — if it's no
  // longer pending by the time we commit, the accept is rejected.
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('This ride no longer exists.');
    if (snap.data().status !== 'pending') throw new Error('This ride has just been taken.');
    tx.update(ref, {
      status: 'accepted' as BookingStatus,
      driverUid: driver.uid,
      driverName: driver.name,
      driverPhone: driver.phone ?? null,
      acceptedAt: serverTimestamp(),
      paymentMethod: 'cash',
      otp,
    });
  });
}

// Driver enters the OTP the student read out. If it matches, the ride starts
// (status 'ongoing' + startedAt drives the animation). Verified in a
// transaction so the code can't be bypassed.
export async function startRideWithOtp(bookingId: string, enteredOtp: string): Promise<void> {
  const database = requireDb();
  const ref = doc(database, 'bookings', bookingId);
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Ride not found.');
    const data = snap.data();
    if (data.status !== 'accepted') throw new Error('This ride can no longer be started.');
    if (String(data.otp) !== enteredOtp.trim()) {
      throw new Error('Incorrect OTP. Ask the student to read it again.');
    }
    tx.update(ref, { status: 'ongoing' as BookingStatus, startedAt: serverTimestamp() });
  });
}

// Save a 1-5 star rating. `by` says who is rating: the student rates the
// driver, or the driver rates the student.
export async function rateBooking(
  bookingId: string,
  by: 'student' | 'driver',
  rating: number
): Promise<void> {
  const database = requireDb();
  const field = by === 'student' ? 'ratingByStudent' : 'ratingByDriver';
  await updateDoc(doc(database, 'bookings', bookingId), { [field]: rating });
}

export async function setBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'bookings', bookingId), { status });
}

/* ------------------------------------------------------------------ */
/*  Offers / coupons  (admin creates them, students see them)         */
/* ------------------------------------------------------------------ */

export interface NewOfferInput {
  code: string;
  title: string;
  discountType: 'percent' | 'flat';
  value: number;
}

export async function createOffer(input: NewOfferInput): Promise<void> {
  const database = requireDb();
  await addDoc(collection(database, 'offers'), {
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    discountType: input.discountType,
    value: input.value,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export function subscribeOffers(onChange: (offers: Offer[]) => void): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'offers'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
        return {
          id: d.id,
          code: (data.code as string) ?? '',
          title: (data.title as string) ?? '',
          discountType: (data.discountType as Offer['discountType']) ?? 'percent',
          value: (data.value as number) ?? 0,
          active: (data.active as boolean) ?? true,
          createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : '',
        } satisfies Offer;
      })
    );
  });
}

export async function setOfferActive(offerId: string, active: boolean): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'offers', offerId), { active });
}

export async function deleteOffer(offerId: string): Promise<void> {
  const database = requireDb();
  await deleteDoc(doc(database, 'offers', offerId));
}

/* ------------------------------------------------------------------ */
/*  Chat  (messages between the student and driver of a booking)      */
/* ------------------------------------------------------------------ */

export interface NewMessageInput {
  senderUid: string;
  senderName: string;
  text: string;
}

export async function sendMessage(bookingId: string, msg: NewMessageInput): Promise<void> {
  const database = requireDb();
  await addDoc(collection(database, 'bookings', bookingId, 'messages'), {
    ...msg,
    createdAt: serverTimestamp(),
  });
}

// Live, ordered list of messages for a booking's chat.
export function subscribeMessages(
  bookingId: string,
  onChange: (messages: ChatMessage[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'bookings', bookingId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
        return {
          id: d.id,
          senderUid: (data.senderUid as string) ?? '',
          senderName: (data.senderName as string) ?? 'User',
          text: (data.text as string) ?? '',
          createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : '',
        } satisfies ChatMessage;
      })
    );
  });
}

// Driver starts the ride. Stamping `startedAt` here (a server time everyone
// reads) is what makes the auto animate in sync on all three panels.
export async function startRide(bookingId: string): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'bookings', bookingId), {
    status: 'ongoing' as BookingStatus,
    startedAt: serverTimestamp(),
  });
}

// A student's own bookings (their ride history), newest first.
export function subscribeStudentBookings(
  studentUid: string,
  onChange: (bookings: Booking[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'bookings'), where('studentUid', '==', studentUid));
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs
        .map((d) => toBooking(d.id, d.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  });
}

// The student's current in-progress booking (pending/accepted/ongoing), if any.
// Used to resume a ride after a refresh and to stop a student booking twice.
export function subscribeStudentActiveBooking(
  studentUid: string,
  onChange: (booking: Booking | null) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'bookings'), where('studentUid', '==', studentUid));
  return onSnapshot(q, (snap) => {
    const active = snap.docs
      .map((d) => toBooking(d.id, d.data()))
      .filter((b) => ['pending', 'accepted', 'ongoing'].includes(b.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    onChange(active ?? null);
  });
}

// A driver's own bookings (their ride history + earnings source), newest first.
export function subscribeDriverBookings(
  driverUid: string,
  onChange: (bookings: Booking[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'bookings'), where('driverUid', '==', driverUid));
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs
        .map((d) => toBooking(d.id, d.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Users & complaints (admin lists)                                  */
/* ------------------------------------------------------------------ */

function toUser(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: (data.uid as string) ?? id,
    email: (data.email as string) ?? '',
    name: (data.name as string) ?? '',
    role: (data.role as UserRole) ?? 'student',
    rollNumber: data.rollNumber as string | undefined,
    phone: data.phone as string | undefined,
    gender: data.gender as string | undefined,
    createdAt: (data.createdAt as string) ?? '',
    online: data.online as boolean | undefined,
  };
}

// A driver / student-driver sets whether they're online (available to receive
// ride requests). Only online drivers count towards availability.
export async function setDriverOnline(uid: string, online: boolean): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'users', uid), { online });
}

// Live list of all users with a given role (admins only, per the rules).
export function subscribeUsersByRole(
  role: UserRole,
  onChange: (users: UserProfile[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'users'), where('role', '==', role));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => toUser(d.id, d.data())));
  });
}

export interface NewComplaintInput {
  user: string;
  driver?: string;
  rideId?: string;
  complaint: string;
}

// A student files a complaint. It lands in the `complaints` collection, which
// the admin Complaints page reads live.
export async function createComplaint(input: NewComplaintInput): Promise<void> {
  const database = requireDb();
  const payload: Record<string, unknown> = {
    user: input.user,
    complaint: input.complaint,
    status: 'Pending',
    createdAt: serverTimestamp(),
  };
  if (input.driver) payload.driver = input.driver;
  if (input.rideId) payload.rideId = input.rideId;
  await addDoc(collection(database, 'complaints'), payload);
}

// Live list of complaints for the admin. Empty until a complaint feature
// writes into the `complaints` collection.
export function subscribeComplaints(
  onChange: (complaints: Complaint[]) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'complaints'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
          return {
            id: d.id,
            user: (data.user as string) ?? 'Unknown',
            driver: (data.driver as string) ?? '—',
            rideId: (data.rideId as string) ?? '—',
            complaint: (data.complaint as string) ?? '',
            date: createdAt?.toDate ? createdAt.toDate().toLocaleDateString() : '—',
            status: (data.status as Complaint['status']) ?? 'Pending',
          } satisfies Complaint;
        })
      );
    },
    () => onChange([]) // if the collection has no rules/data yet, just show empty
  );
}

export async function completeRide(bookingId: string): Promise<void> {
  const database = requireDb();
  await updateDoc(doc(database, 'bookings', bookingId), {
    status: 'completed' as BookingStatus,
  });
}

// Driver dashboard: the ride this driver is currently handling (accepted or
// ongoing). Filtered by driverUid; sorted/newest-first picked in JS to avoid
// needing a composite index.
export function subscribeDriverActiveBooking(
  driverUid: string,
  onChange: (booking: Booking | null) => void
): Unsubscribe {
  const database = requireDb();
  const q = query(collection(database, 'bookings'), where('driverUid', '==', driverUid));
  return onSnapshot(q, (snap) => {
    const active = snap.docs
      .map((d) => toBooking(d.id, d.data()))
      .filter((b) => b.status === 'accepted' || b.status === 'ongoing')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onChange(active[0] ?? null);
  });
}
