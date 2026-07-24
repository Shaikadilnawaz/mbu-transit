'use client';

import Link from 'next/link';
import { Bus, Clock, MapPin, ExternalLink, ShieldAlert, Radio } from 'lucide-react';
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
import { GuestNav } from '@/components/layout/guest-nav';

// Official APSRTC live tracker (real-time bus positions & schedules).
const APSRTC_LIVE = 'https://apsrtclivetrack.com/#/from_to_search_tabs_screen';

// Curated Tirupati → (MBU / A. Rangampet) → Piler services. Each "Track" opens
// that exact service live on APSRTC. Times are indicative — the live tracker is
// the source of truth. Edit this list anytime.
const routeBuses = [
  { serviceNumber: 'MLCR/7', departure: '05:10 AM', mbu: '05:45 AM', piler: '06:10 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_MLCR_7_PILER&oprsNo=MLCR/7' },
  { serviceNumber: 'GCT2/2', departure: '06:45 AM', mbu: '07:20 AM', piler: '07:45 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_GCT2_2_PILER&oprsNo=GCT2/2' },
  { serviceNumber: 'PT10/2', departure: '07:15 AM', mbu: '07:50 AM', piler: '08:15 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_PT10_2_PILER&oprsNo=PT10/2' },
  { serviceNumber: 'PLT8/2', departure: '07:30 AM', mbu: '08:05 AM', piler: '08:30 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_PLT8_2_PILER&oprsNo=PLT8/2' },
  { serviceNumber: 'TP13/2', departure: '07:45 AM', mbu: '08:20 AM', piler: '08:45 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_TP13_2_PILER&oprsNo=TP13/2' },
  { serviceNumber: '9010/2', departure: '08:15 AM', mbu: '08:50 AM', piler: '09:15 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=04012026_9010_2_PILER&oprsNo=9010/2' },
  { serviceNumber: 'TSP5/7', departure: '08:45 AM', mbu: '09:20 AM', piler: '09:45 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_TSP5_7_PILER&oprsNo=TSP5/7' },
  { serviceNumber: 'NBL2/7', departure: '09:15 AM', mbu: '09:50 AM', piler: '10:15 AM', trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_NBL2_7_PILER&oprsNo=NBL2/7' },
];

export default function BusSchedulePage() {
  return (
    <div className="min-h-screen bg-background">
      <GuestNav />

      {/* Hero — same in-app CSS/SVG style as the student-driven page. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-amber-600 to-amber-800 text-primary-foreground">
        <div className="container mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              Public transport · APSRTC
            </span>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
              Catch a bus,
              <br />
              track it live.
            </h1>
            <p className="max-w-md text-white/90">
              Government APSRTC buses run right past campus on the Tirupati–Piler road. Check the
              schedule below and follow any bus live — no booking needed, just hop on.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-2">
              <a href={APSRTC_LIVE} target="_blank" rel="noopener noreferrer">
                <Radio className="mr-2 h-4 w-4" /> Open APSRTC Live Tracker
              </a>
            </Button>
          </div>

          {/* Route illustration: Tirupati • MBU • Piler */}
          <div className="relative mx-auto aspect-[4/3] w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
            <svg viewBox="0 0 300 120" className="w-full">
              <line x1="24" y1="60" x2="276" y2="60" stroke="white" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
              <circle cx="24" cy="60" r="7" fill="white" />
              <circle cx="150" cy="60" r="9" fill="white" />
              <circle cx="276" cy="60" r="7" fill="white" />
            </svg>
            <span className="absolute left-1/2 top-8 -translate-x-1/2 text-4xl drop-shadow-lg">🚌</span>
            <div className="mt-2 flex justify-between text-xs font-medium">
              <span>Tirupati</span>
              <span className="text-center">MBU<br />(A. Rangampet)</span>
              <span>Piler</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Safety note */}
        <div className="flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
          <p>
            <strong>Safety note:</strong> please don&apos;t board buses carrying more than their
            capacity. Times below are indicative — tap <strong>Track</strong> for the live position.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" /> Tirupati → MBU → Piler
            </CardTitle>
            <CardDescription>
              Buses departing Tirupati that pass Mohan Babu University (A. Rangampet) on the way to Piler.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Bus className="mr-1 inline-block h-4 w-4" /> Service</TableHead>
                    <TableHead><Clock className="mr-1 inline-block h-4 w-4" /> Depart Tirupati</TableHead>
                    <TableHead><MapPin className="mr-1 inline-block h-4 w-4" /> MBU</TableHead>
                    <TableHead><MapPin className="mr-1 inline-block h-4 w-4" /> Piler</TableHead>
                    <TableHead className="text-right">Live</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeBuses.map((bus) => (
                    <TableRow key={bus.serviceNumber}>
                      <TableCell className="font-medium">{bus.serviceNumber}</TableCell>
                      <TableCell>{bus.departure}</TableCell>
                      <TableCell>{bus.mbu}</TableCell>
                      <TableCell>{bus.piler}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <a href={bus.trackUrl} target="_blank" rel="noopener noreferrer">
                            <MapPin className="mr-2 h-4 w-4" /> Track
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Other routes → live tracker */}
        <Card>
          <CardContent className="flex flex-col items-center justify-between gap-4 py-6 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="font-semibold text-foreground">Going somewhere else?</h3>
              <p className="text-sm text-muted-foreground">
                Search any route (Piler → Tirupati, Madanapalle, and more) and see live buses on the official APSRTC tracker.
              </p>
            </div>
            <Button asChild>
              <a href={APSRTC_LIVE} target="_blank" rel="noopener noreferrer">
                Search all routes <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
