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
  const [students, setStudents] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = subscribeUsersByRole('student', setStudents);
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Students</CardTitle>
          <CardDescription>
            {students.length} student{students.length === 1 ? '' : 's'} registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No students registered yet.
                  </TableCell>
                </TableRow>
              )}
              {students.map((s) => (
                <TableRow key={s.uid}>
                  <TableCell className="font-medium">{s.name || '—'}</TableCell>
                  <TableCell>{s.rollNumber ?? '—'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone ?? '—'}</TableCell>
                  <TableCell className="capitalize">{s.gender ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
