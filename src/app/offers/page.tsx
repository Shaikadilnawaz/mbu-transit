'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GuestNav } from '@/components/layout/guest-nav';

const offers = [
  { title: '20% off on your next 5 auto rides', code: 'AUTO20', description: 'Enjoy a 20% discount on your next five auto rides booked through the app. Maximum discount of ₹10 per ride.', expiry: '2024-08-31' },
  { title: 'Free Bus Pass for a Week', code: 'BUSFREE', description: 'Get a free weekly pass for all APSRTC buses on campus routes. Limited time offer.', expiry: '2024-08-15' },
  { title: 'Refer a Friend, Get ₹50', code: 'REFER50', description: 'Refer a friend to the MCONNECTS app and get ₹50 in your wallet when they complete their first ride.', expiry: '2024-09-30' },
  { title: 'Morning Commute Special', code: 'MORNING10', description: 'Get 10% off on all rides booked between 7 AM and 9 AM. Applicable on both auto and bus tickets.', expiry: '2024-08-31' },
];

export default function OffersPage() {
  const { toast } = useToast();

  const handleClaim = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Offer Code Copied!',
      description: `Code "${code}" has been copied to your clipboard. Apply it during checkout.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <GuestNav />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Deals &amp; Offers</h1>
          <p className="text-muted-foreground">Exclusive deals for MBU students. Save more on your daily commute!</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.code} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Ticket className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-lg">{offer.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription>{offer.description}</CardDescription>
              </CardContent>
              <div className="flex flex-col gap-3 p-6 pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expires on {offer.expiry}</span>
                </div>
                <Button onClick={() => handleClaim(offer.code)} className="w-full">
                  Claim Offer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
