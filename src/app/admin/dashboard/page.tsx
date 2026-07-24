'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Users,
  Car,
  Bus,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  LayoutDashboard,
  Menu,
  History,
  Activity,
  MessageSquareWarning,
  Siren,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { AdminShell } from '@/components/layout/admin-shell';


const adminFeatures = [
  {
    title: 'Manage Students',
    description: 'View, edit, and manage student user accounts.',
    icon: <Users className="h-8 w-8 text-accent" />,
    cta: 'View Students',
    href: '/admin/students',
  },
  {
    title: 'Manage Drivers',
    description: 'Onboard new drivers and manage existing driver profiles.',
    icon: <Car className="h-8 w-8 text-accent" />,
    cta: 'View Drivers',
    href: '/admin/drivers',
  },
  {
    title: 'Manage Student Drivers',
    description: 'Oversee students who are registered as drivers.',
    icon: <Users className="h-8 w-8 text-accent" />,
    cta: 'View Student Drivers',
    href: '/admin/student-drivers',
  },
  {
    title: 'All Rides History',
    description: 'View a complete history of all rides taken.',
    icon: <History className="h-8 w-8 text-accent" />,
    cta: 'View History',
    href: '/admin/rides/history',
  },
  {
    title: 'Active Rides',
    description: 'Monitor all rides that are currently active.',
    icon: <Activity className="h-8 w-8 text-accent" />,
    cta: 'View Active Rides',
    href: '/admin/rides/active',
  },
  {
    title: 'Analytics & Reports',
    description: 'Generate reports on usage, revenue, and more.',
    icon: <BarChart3 className="h-8 w-8 text-accent" />,
    cta: 'View Analytics',
    href: '/admin/analytics',
  },
  {
    title: 'Manage Complaints',
    description: 'View and manage user complaints.',
    icon: <MessageSquareWarning className="h-8 w-8 text-accent" />,
    cta: 'View Complaints',
    href: '/admin/complaints',
  },
  {
    title: 'SOS Alerts',
    description: 'Review and manage all emergency SOS alerts.',
    icon: <Siren className="h-8 w-8 text-accent" />,
    cta: 'View SOS Alerts',
    href: '/admin/sos',
  },
];

function MainContent() {
  return (
    <div className="space-y-6">
        <div className="mb-8">
            <h1 className="text-3xl font-headline font-bold text-accent">Admin Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome back, Admin. Manage your transport ecosystem here.
            </p>
        </div>

         <section className="w-full py-8">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {adminFeatures.map((option) => (
                <Card
                  key={option.title}
                  className="flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl bg-card"
                >
                  <div>
                    <CardHeader className="p-6 flex-row items-center gap-4">
                      {option.icon}
                      <CardTitle className="font-headline text-xl text-foreground">{option.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <p className="text-muted-foreground">{option.description}</p>
                    </CardContent>
                  </div>
                  <div className="p-6 pt-0">
                    <Button asChild variant="secondary" className="mt-6 w-full">
                      <Link href={option.href}>{option.cta}</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
