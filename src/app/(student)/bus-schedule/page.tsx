'use client';

import { useState } from 'react';
import {
  Search,
  Bus,
  MapPin,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  History,
  Contact,
  BadgePercent,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const pilerBuses = [
    {
      serviceNumber: 'MLCR/7',
      departure: '05:10 AM',
      collegeArrival: '05:45 AM',
      destinationArrival: '06:10 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_MLCR_7_PILER&oprsNo=MLCR/7',
    },
    {
      serviceNumber: 'GCT2/2',
      departure: '06:45 AM',
      collegeArrival: '07:20 AM',
      destinationArrival: '07:45 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_GCT2_2_PILER&oprsNo=GCT2/2',
    },
    {
      serviceNumber: 'PT10/2',
      departure: '07:15 AM',
      collegeArrival: '07:50 AM',
      destinationArrival: '08:15 AM',
      trackUrl: 'http://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_PT10_2_PILER&oprsNo=PT10/2',
    },
    {
      serviceNumber: 'PLT8/2',
      departure: '07:30 AM',
      collegeArrival: '08:05 AM',
      destinationArrival: '08:30 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_PLT8_2_PILER&oprsNo=PLT8/2',
    },
    {
      serviceNumber: 'TP13/2',
      departure: '07:45 AM',
      collegeArrival: '08:20 AM',
      destinationArrival: '08:45 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_TP13_2_PILER&oprsNo=TP13/2',
    },
    {
      serviceNumber: '9010/2',
      departure: '08:15 AM',
      collegeArrival: '08:50 AM',
      destinationArrival: '09:15 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=04012026_9010_2_PILER&oprsNo=9010/2',
    },
    {
      serviceNumber: 'TSP5/7',
      departure: '08:45 AM',
      collegeArrival: '09:20 AM',
      destinationArrival: '09:45 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_TSP5_7_PILER&oprsNo=TSP5/7',
    },
    {
      serviceNumber: 'NBL2/7',
      departure: '09:15 AM',
      collegeArrival: '09:50 AM',
      destinationArrival: '10:15 AM',
      trackUrl: 'https://apsrtclivetrack.com/#/trip_details?serviceDocId=05012026_NBL2_7_PILER&oprsNo=NBL2/7',
    },
  ];
  
const mbuBuses = [
  {
    serviceNumber: '304A',
    departure: '08:00 AM',
    collegeArrival: '08:45 AM',
    destinationArrival: '09:15 AM',
    trackUrl: '/track/304A',
  },
  {
    serviceNumber: '305B',
    departure: '08:15 AM',
    collegeArrival: '09:00 AM',
    destinationArrival: '09:30 AM',
    trackUrl: '/track/305B',
  },
  {
    serviceNumber: '304C',
    departure: '08:30 AM',
    collegeArrival: '09:15 AM',
    destinationArrival: '09:45 AM',
    trackUrl: '/track/304C',
  },
  {
    serviceNumber: '306D',
    departure: '08:45 AM',
    collegeArrival: '09:30 AM',
    destinationArrival: '10:00 AM',
    trackUrl: '/track/306D',
  },
];

const busLocations = [
  'Tirupati',
  'Madanapalle',
  'Piler',
  'MBU Campus',
  'MBU Main Gate',
  'SrinivasaMangapuram',
  'Zoo',
  'Chandhragiri',
  'Railway Station',
  'SV University',
  'Tirupati Bus Stand',
];

type BusData = {
    serviceNumber: string;
    departure: string;
    collegeArrival?: string;
    destinationArrival?: string;
    trackUrl: string;
}

function MainContent() {
  const [searchResults, setSearchResults] = useState<BusData[]>([]);
  const [searched, setSearched] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fromInput = (form.elements.namedItem('from') as HTMLInputElement).value;
    const toInput = (form.elements.namedItem('to') as HTMLInputElement).value;
    
    const from = fromInput.trim().toLowerCase();
    const to = toInput.trim().toLowerCase();
    
    setFromLocation(fromInput);
    setToLocation(toInput);
    
    setSearched(true);
    if (from.includes('tirupati') && to.includes('piler')) {
      setSearchResults(pilerBuses);
    } else if (from.includes('tirupati') && to.includes('mbu')) {
      setSearchResults(mbuBuses);
    } else {
      setSearchResults([]);
    }
  };

  const isPilerRoute = toLocation.trim().toLowerCase() === 'piler';

  return (
    <div className="flex min-h-screen w-full flex-col bg-card">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-12 px-4">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-primary">
                APSRTC Bus Schedule
              </CardTitle>
              <CardDescription>
                Find timings for buses to and from the university.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4 items-end mb-8"
              >
                <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor="from">
                    <MapPin className="inline-block mr-2 h-4 w-4" /> From
                  </Label>
                  <Input
                    id="from"
                    name="from"
                    placeholder="e.g., Tirupati"
                    required
                    list="bus-locations"
                  />
                </div>
                <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor="to">
                    <MapPin className="inline-block mr-2 h-4 w-4" /> To
                  </Label>
                  <Input
                    id="to"
                    name="to"
                    placeholder="e.g., MBU Campus or Piler"
                    required
                    list="bus-locations"
                  />
                </div>
                <datalist id="bus-locations">
                  {busLocations.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
                <Button
                  type="submit"
                  className="w-full md:w-auto bg-accent hover:bg-accent/90"
                >
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </form>

              {searched && searchResults.length > 0 && (
                <div className="space-y-6">
                  <Alert
                    variant="destructive"
                    className="bg-yellow-50 border-yellow-200 text-yellow-800"
                  >
                    <AlertTriangle className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle className="font-bold">Safety Note</AlertTitle>
                    <AlertDescription>
                      Please do not travel in buses with more passengers than
                      capacity. Your safety is our priority.
                    </AlertDescription>
                  </Alert>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Bus className="inline-block mr-2 h-4 w-4" />
                            Service No.
                          </TableHead>
                          <TableHead>
                            <Clock className="inline-block mr-2 h-4 w-4" />
                            Departure ({fromLocation})
                          </TableHead>
                          
                          <TableHead>
                              <Clock className="inline-block mr-2 h-4 w-4" />
                              College Arrival
                          </TableHead>
                          <TableHead>
                              <Clock className="inline-block mr-2 h-4 w-4" />
                              Arrival ({toLocation})
                          </TableHead>
                          
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((bus) => (
                          <TableRow key={bus.serviceNumber}>
                            <TableCell className="font-medium">
                              {bus.serviceNumber}
                            </TableCell>
                            <TableCell>{bus.departure}</TableCell>
                            
                            <TableCell>{bus.collegeArrival}</TableCell>
                            <TableCell>{bus.destinationArrival}</TableCell>
                            
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm">
                                <Link href={bus.trackUrl} target="_blank" rel="noopener noreferrer">
                                  <MapPin className="mr-2 h-4 w-4" /> Track
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {searched && searchResults.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Bus className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-semibold">
                    No buses found for the selected route.
                  </p>
                  <p>Please check your locations or try again later.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function BusSchedulePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="offcanvas">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span className="font-bold text-lg">Student User</span>
              <span className="text-sm text-muted-foreground">student@mbu.com</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/ride-history">
                  <History />
                  <span>Ride History</span>
                </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/contact">
                  <Contact />
                  <span>Contact</span>
                </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/offers">
                  <BadgePercent />
                  <span>Offers</span>
                </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button variant="ghost" className="w-full justify-start" onClick={async () => { await signOut(); router.push('/login'); }}>
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <MainContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
