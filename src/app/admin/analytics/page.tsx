'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, Car, Activity, DollarSign, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminShell } from '@/components/layout/admin-shell';
import { subscribeAllBookings, subscribeUsersByRole } from '@/lib/db';
import type { Booking, UserProfile } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function MainContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeAllBookings(setBookings),
      subscribeUsersByRole('student', setStudents),
      subscribeUsersByRole('driver', setDrivers),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const completed = bookings.filter((b) => b.status === 'completed');
  const totalRevenue = completed.reduce((s, b) => s + (b.fare || 0), 0);

  // Bookings per day for the last 7 days.
  const perDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const bookingsCount = bookings.filter(
      (b) => b.createdAt && new Date(b.createdAt).toDateString() === key
    ).length;
    return { day: WEEKDAYS[d.getDay()], bookings: bookingsCount };
  });

  // Revenue per driver (completed rides only).
  const byDriver = new Map<string, { name: string; rides: number; revenue: number }>();
  for (const b of completed) {
    if (!b.driverName) continue;
    const cur = byDriver.get(b.driverName) ?? { name: b.driverName, rides: 0, revenue: 0 };
    cur.rides += 1;
    cur.revenue += b.fare || 0;
    byDriver.set(b.driverName, cur);
  }
  const driverRevenue = [...byDriver.values()].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics &amp; Reports</h1>
        <p className="text-muted-foreground">Live insights from real bookings and accounts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Users} label="Students" value={students.length} />
        <Stat icon={Car} label="Drivers" value={drivers.length} />
        <Stat icon={Activity} label="Total Rides" value={bookings.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} />
        <Stat icon={DollarSign} label="Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Bookings Per Day (Last 7 Days)
          </CardTitle>
          <CardDescription>Number of rides booked each day.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perDay}>
              <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
              />
              <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Driver Revenue
          </CardTitle>
          <CardDescription>Total earnings per driver from completed rides.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Rides Completed</TableHead>
                <TableHead>Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverRevenue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No completed rides yet.
                  </TableCell>
                </TableRow>
              )}
              {driverRevenue.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.rides}</TableCell>
                  <TableCell>₹{d.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
