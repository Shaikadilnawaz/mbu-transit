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
import { Badge } from '@/components/ui/badge';
import { AdminShell } from '@/components/layout/admin-shell';
import { subscribeComplaints } from '@/lib/db';
import type { Complaint } from '@/lib/types';

function MainContent() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const unsub = subscribeComplaints(setComplaints);
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Complaints</CardTitle>
          <CardDescription>User-submitted complaints appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Complaint</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No complaints yet.
                  </TableCell>
                </TableRow>
              )}
              {complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.user}</TableCell>
                  <TableCell>{c.driver}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.complaint}</TableCell>
                  <TableCell>{c.date}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminComplaintsPage() {
  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
