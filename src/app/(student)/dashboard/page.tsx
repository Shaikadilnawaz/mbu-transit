'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Users,
  Siren,
  ShieldCheck,
  Clock,
  CircleDollarSign,
  Map,
  MapPin,
  Navigation,
  ArrowRight,
  BadgePercent,
  Ticket,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GuestNav } from '@/components/layout/guest-nav';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { subscribeStudentBookings, subscribeOffers } from '@/lib/db';
import type { Offer } from '@/lib/types';

const services = [
  {
    title: 'Auto',
    description: 'Everyday autos, made easy — with live tracking.',
    emoji: '🛺',
    cta: 'Book Now',
    href: '/book-auto',
  },
  {
    title: 'Student Driven Ride',
    description: 'For the students, by the students.',
    emoji: '🧑‍🎓',
    cta: 'Book Now',
    href: '/student-ride',
  },
  {
    title: 'Bus Timings',
    description: 'APSRTC live schedules and timings at a glance.',
    emoji: '🚌',
    cta: 'View Schedule',
    href: '/bus-schedule',
  },
];

const features = [
  { icon: Siren, title: 'Emergency SOS', description: 'Instantly alert the admin and your contacts in an emergency.' },
  { icon: ShieldCheck, title: 'Safety First', description: 'All drivers are verified for your safety and peace of mind.' },
  { icon: Clock, title: 'Timely Service', description: 'Punctuality is our priority — arrive on time, every time.' },
  { icon: CircleDollarSign, title: 'Affordable Rates', description: 'Competitive, transparent pricing built for students.' },
  { icon: Map, title: 'Live Tracking', description: 'Track your ride in real time from booking to arrival.' },
  { icon: Users, title: 'Student Community', description: 'Rides run by and for the MBU student community.' },
];

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [completedRides, setCompletedRides] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);

  // Quick-book form in the hero. What the student types is carried to the full
  // booking page (with the map) through the URL, where it prefills the search.
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  const handleQuickBook = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickup.trim()) params.set('pickup', pickup.trim());
    if (drop.trim()) params.set('drop', drop.trim());
    const qs = params.toString();
    router.push(qs ? `/book-auto?${qs}` : '/book-auto');
  };

  // Count the student's completed rides (drives the automatic offers).
  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeStudentBookings(profile.uid, (bookings) => {
      setCompletedRides(bookings.filter((b) => b.status === 'completed').length);
    });
    return unsub;
  }, [profile]);

  // Admin-created coupons.
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeOffers(setOffers);
    return unsub;
  }, [user]);

  // Automatic offers based on how many rides the student has taken.
  const autoOffers: { title: string; desc: string }[] = [];
  if (completedRides === 0) {
    autoOffers.push({ title: 'First ride FREE 🎉', desc: 'Your very first ride is on us — applied automatically.' });
  } else if (completedRides < 5) {
    autoOffers.push({ title: '10% off your first 5 rides', desc: `Applied automatically — this is ride ${completedRides + 1} of 5.` });
  }
  const activeOffers = offers.filter((o) => o.active);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied!', description: code });
  };

  // While we don't yet know if someone is logged in, show a blank frame to
  // avoid flashing the wrong page.
  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <GuestNav />

      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          {/* Left: headline + quick book */}
          <div>
            <span className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              {user && profile ? `Welcome back, ${profile.name}` : 'Guest mode enabled'}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Student rides, <span className="text-accent">made simple</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Quick, affordable, and safe travel between Mohan Babu University and Tirupati —
              right from your phone.
            </p>

            {/* Quick-book card */}
            <form
              onSubmit={handleQuickBook}
              className="mt-8 max-w-md space-y-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 rounded-xl border bg-background px-3">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <Input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup location"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-background px-3">
                <Navigation className="h-5 w-5 shrink-0 text-accent" />
                <Input
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  placeholder="Enter drop location"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Book Ride
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link href="/student-ride" className="font-medium text-accent hover:underline">
                Student ride &rarr;
              </Link>
              <Link href="/bus-schedule" className="font-medium text-accent hover:underline">
                Bus timings &rarr;
              </Link>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl border shadow-sm md:block">
            <Image
              src="/images/campus-entrance.jpg"
              alt="Mohan Babu University campus"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Our Services</h2>
          <div className="mt-3 h-1 w-20 rounded-full bg-accent" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, description, emoji, cta, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-accent">
                  {cta}
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <span className="shrink-0 text-5xl" aria-hidden>
                {emoji}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Coupons & Offers */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-center gap-2">
            <BadgePercent className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Coupons &amp; Offers</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {autoOffers.map((o) => (
              <div key={o.title} className="rounded-2xl border bg-gradient-to-br from-accent/10 to-transparent p-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  <Gift className="h-3.5 w-3.5" /> Auto-applied
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{o.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
              </div>
            ))}
            {activeOffers.map((o) => (
              <div key={o.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-accent" />
                  <h3 className="font-bold text-foreground">{o.title}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {o.discountType === 'percent' ? `${o.value}% off` : `₹${o.value} off`}
                </p>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed p-2">
                  <span className="font-mono font-semibold tracking-wider">{o.code}</span>
                  <Button size="sm" variant="ghost" onClick={() => copyCode(o.code)}>
                    Copy
                  </Button>
                </div>
              </div>
            ))}
            {autoOffers.length === 0 && activeOffers.length === 0 && (
              <p className="text-muted-foreground">No offers right now — check back soon!</p>
            )}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why choose MBU Transport?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              A seamless and secure transportation experience, tailored for students.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
