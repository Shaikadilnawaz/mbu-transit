'use client';

import { useEffect, useState } from 'react';
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
import { subscribeUsersByRole } from '@/lib/db';
import type { UserProfile } from '@/lib/types';

function MainContent() {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = subscribeUsersByRole('driver', setDrivers);
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Drivers</CardTitle>
          <CardDescription>
            {drivers.length} driver{drivers.length === 1 ? '' : 's'} registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No drivers registered yet.
                  </TableCell>
                </TableRow>
              )}
              {drivers.map((d) => (
                <TableRow key={d.uid}>
                  <TableCell className="font-medium">{d.name || '—'}</TableCell>
                  <TableCell>{d.email}</TableCell>
                  <TableCell>{d.phone ?? '—'}</TableCell>
                  <TableCell>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDriversPage() {
  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
