'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, MessageSquareWarning, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GuestNav } from '@/components/layout/guest-nav';
import { useAuth } from '@/context/auth-context';
import { createComplaint } from '@/lib/db';

export default function ContactPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [complaint, setComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Contacts Saved!',
      description: 'Your emergency contacts have been saved successfully.',
    });
    (e.target as HTMLFormElement).reset();
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast({ title: 'Please log in to file a complaint', variant: 'destructive' });
      return;
    }
    const text = complaint.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await createComplaint({ user: profile.name || 'Student', complaint: text });
      setComplaint('');
      toast({ title: 'Complaint submitted', description: 'The admin team will review it shortly.' });
    } catch (err) {
      toast({
        title: 'Could not submit',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact Us</h1>
          <p className="text-muted-foreground">We&apos;re here to help with anything on your mind.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>Have questions? We&apos;d love to hear from you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Phone className="mt-1 h-6 w-6 text-accent" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-muted-foreground">+91 12345 67890</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="mt-1 h-6 w-6 text-accent" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-muted-foreground">support@mbutransport.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-6 w-6 text-accent" />
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p className="text-muted-foreground">Mohan Babu University, Tirupati, Andhra Pradesh</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>These numbers will be alerted when you use the SOS feature.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveContacts} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-number">Your Phone Number</Label>
                  <Input id="user-number" type="tel" placeholder="Your primary mobile number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-number">Parent&apos;s Phone Number</Label>
                  <Input id="parent-number" type="tel" placeholder="Your parent or guardian's number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="friend-number">Friend&apos;s Phone Number</Label>
                  <Input id="friend-number" type="tel" placeholder="A friend's contact number" required />
                </div>
                <Button type="submit" className="w-full">Save Contacts</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5" /> Report a Problem
            </CardTitle>
            <CardDescription>
              Had an issue with a ride or a driver? File a complaint and the admin team will look into it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleComplaint} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="complaint">Your complaint</Label>
                <Textarea
                  id="complaint"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Describe what happened…"
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting || !complaint.trim()}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Complaint
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
