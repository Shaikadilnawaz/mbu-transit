'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { subscribeSosAlerts, setSosStatus } from '@/lib/db';
import type { SosAlert } from '@/lib/types';
import {
  Users,
  Car,
  Settings,
  LogOut,
  Shield,
  LayoutDashboard,
  MoreHorizontal,
  FilePenLine,
  History,
  Activity,
  BarChart3,
  MessageSquareWarning,
  Siren,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AdminShell } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';

function MainContent() {
  // Live list of SOS alerts. This starts empty and fills in from Firestore;
  // it re-renders automatically whenever a student raises a new alert.
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeSosAlerts(setSosAlerts);
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SOS Alerts</CardTitle>
            <CardDescription>
              A list of all emergency SOS alerts from users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SOS ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sosAlerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No SOS alerts yet.
                    </TableCell>
                  </TableRow>
                )}
                {sosAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.id}</TableCell>
                    <TableCell>{alert.user}</TableCell>
                    <TableCell>{alert.location}</TableCell>
                    <TableCell className="max-w-xs truncate">{alert.reason}</TableCell>
                    <TableCell>{alert.date}</TableCell>
                    <TableCell>
                       <Badge
                        variant={
                          alert.status === 'Resolved'
                            ? 'default'
                            : 'destructive'
                        }
                        className={
                          alert.status === 'Resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {alert.status !== 'Resolved' && (
                            <DropdownMenuItem onClick={() => setSosStatus(alert.id, 'Resolved')}>
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Mark as Resolved
                            </DropdownMenuItem>
                          )}
                          {alert.status === 'Resolved' && (
                            <DropdownMenuItem onClick={() => setSosStatus(alert.id, 'Pending')}>
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

export default function AdminSOSPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
