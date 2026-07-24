// Shared schema for MCONNECTS. UserProfile is wired to Firestore (users/{uid}).
// The remaining types describe the shape of data pages currently hardcode
// inline (rides, drivers, complaints, SOS, buses) — they aren't backed by
// Firestore yet, but exist here as the single source of truth for the
// migration that will wire those pages up in a later milestone.

export type UserRole = 'student' | 'admin' | 'driver' | 'student-driver';

export const USER_ROLES: UserRole[] = ['student', 'admin', 'driver', 'student-driver'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as string[]).includes(value);
}

// Which email domain each role must use. Students use the university domain;
// drivers and admins use Gmail (so password resets reach a real inbox).
export const ROLE_EMAIL_DOMAIN: Record<UserRole, string> = {
  student: 'mbu.asia',
  admin: 'gmail.com',
  driver: 'gmail.com',
  'student-driver': 'mbu.asia',
};

// True if the email ends with the domain required for that role.
export function emailMatchesRole(email: string, role: UserRole): boolean {
  return email.trim().toLowerCase().endsWith('@' + ROLE_EMAIL_DOMAIN[role]);
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  rollNumber?: string;
  phone?: string;
  gender?: string;
  createdAt: string;
  // Drivers & student-drivers: whether they're available to receive requests.
  online?: boolean;
}

export type RideStatus = 'In Progress' | 'Completed' | 'Cancelled';
export type RideType = 'Auto' | 'Student Ride' | 'Bus';

export interface Ride {
  id: string;
  user: string;
  driver: string;
  type: RideType;
  startedAt: string;
  from: string;
  to: string;
  status: RideStatus;
}

// A live ride booking. Written by a student when they book, read in real time
// by every driver (to accept) and by admins (to monitor). Coordinates are kept
// so the map can draw pickup/drop and the trip route.
export type BookingStatus =
  | 'pending'        // waiting for a driver to accept
  | 'accepted'       // a driver took it, heading to pickup
  | 'ongoing'        // ride started, auto moving pickup -> drop
  | 'completed'
  | 'cancelled';

export interface LatLng {
  lat: number;
  lng: number;
}

// 'auto' = on-demand auto ride; 'student' = student-driven ride (carpool).
export type BookingRideType = 'auto' | 'student';
export type VehicleType = 'bike' | 'car';

// Seats available depending on the student-driver's vehicle.
export const SEATS_FOR_VEHICLE: Record<VehicleType, number> = {
  bike: 1,
  car: 4,
};

export interface Booking {
  id: string;
  // student
  studentUid: string;
  studentName: string;
  studentPhone?: string;
  // trip
  pickupLabel: string;
  dropLabel: string;
  pickup: LatLng;
  drop: LatLng;
  seats: number;
  fare: number;
  status: BookingStatus;
  createdAt: string;
  // Student-driven ride extras (undefined for plain auto rides).
  rideType?: BookingRideType;
  vehicleType?: VehicleType;
  femaleOnly?: boolean;
  // UIDs of drivers who declined this request (used to detect "no drivers").
  declinedBy?: string[];
  // driver (filled in on accept)
  driverUid?: string;
  driverName?: string;
  driverPhone?: string;
  acceptedAt?: string;
  startedAt?: string; // when the ride started (drives the animation)
  paymentMethod?: 'cash';
  otp?: string; // shown to student; driver must enter it to start the ride
  ratingByStudent?: number; // student's 1-5 rating of the driver
  ratingByDriver?: number; // driver's 1-5 rating of the student
}

export type DriverStatus = 'Active' | 'Suspended' | 'Inactive';

export interface Driver {
  name: string;
  phone: string;
  aadhar: string;
  license: string;
  age: number;
  rating: number;
  status: DriverStatus;
}

export type StudentStatus = 'Active' | 'Suspended';

export interface Student {
  name: string;
  rollNumber: string;
  phone: string;
  gender: string;
  status: StudentStatus;
}

export type ComplaintStatus = 'Pending' | 'In Review' | 'Completed';

export interface Complaint {
  id: string;
  user: string;
  driver: string;
  rideId: string;
  complaint: string;
  date: string;
  status: ComplaintStatus;
}

export type SosStatus = 'Pending' | 'Resolved';

export interface SosAlert {
  id: string;
  user: string;
  location: string;
  reason: string;
  date: string;
  status: SosStatus;
}

// A chat message between the student and the driver of a booking. Stored in
// the `messages` subcollection under each booking.
export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: string;
}

// A discount coupon. Only admins create/edit these; students see the active
// ones on their dashboard.
export interface Offer {
  id: string;
  code: string;
  title: string;
  discountType: 'percent' | 'flat';
  value: number; // percent off (e.g. 10) or flat rupees off
  active: boolean;
  createdAt: string;
}

export interface BusSchedule {
  serviceNumber: string;
  departure: string;
  collegeArrival: string;
  destinationArrival: string;
  trackUrl: string;
}
