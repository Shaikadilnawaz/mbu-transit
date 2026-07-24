'use client';

import { Star, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DriverNav } from '@/components/layout/driver-nav';
import { useAuth } from '@/context/auth-context';

export default function DriverProfilePage() {
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved.',
    });
  };

  const name = profile?.name ?? 'Driver';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <DriverNav />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Driver Profile</CardTitle>
            <CardDescription>View and manage your personal and vehicle information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="flex items-center gap-6">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 text-3xl font-bold text-accent">
                  {initial}
                </span>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{name}</h2>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-5 w-5 fill-accent text-accent" />
                    <span>4.8 (150+ rides)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue={profile?.phone ?? ''} placeholder="+91 …" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhar">Aadhar Number</Label>
                  <Input id="aadhar" defaultValue="1234 5678 9012" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">Driving License</Label>
                  <Input id="license" defaultValue="AP03 20180012345" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle-model">Vehicle Model</Label>
                  <Input id="vehicle-model" defaultValue="Bajaj RE" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle-plate">Vehicle Plate Number</Label>
                  <Input id="vehicle-plate" defaultValue="AP 03 N 1234" />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
