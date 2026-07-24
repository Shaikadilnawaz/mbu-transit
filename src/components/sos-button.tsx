'use client';

import { useState, useEffect } from 'react';
import { Siren, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useAuth } from '@/context/auth-context';
import { createSosAlert } from '@/lib/db';

const emergencyReasons = [
    "Suspicious driver behavior",
    "Taking wrong route",
    "Demanding more fare",
    "Vehicle breakdown",
    "Medical emergency",
];

export function SOSButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`Latitude: ${latitude}, Longitude: ${longitude}`);
        },
        () => {
          setLocation("MBU Campus (Default)"); 
        }
      );
    } else {
        setLocation("MBU Campus (Default)");
    }
  }, []);

  const handleSOSClick = () => {
    setIsReasonDialogOpen(true);
  }

  const handleGenerateMessage = async () => {
    if (!selectedReason) {
        toast({
            variant: 'destructive',
            title: 'Reason Required',
            description: 'Please select a reason for the SOS.',
        });
        return;
    }
    
    setIsReasonDialogOpen(false);
    setIsLoading(true);

    const userName = profile?.name || 'Student User';
    const userLocation = location || 'MBU Campus';

    try {
      // The important part: record the alert so it shows up on the admin's
      // live SOS dashboard immediately.
      await createSosAlert({
        userName,
        location: userLocation,
        reason: selectedReason,
      });

      toast({
        title: 'Alert Sent!',
        description: 'Your SOS has been sent to the admin. Help is on the way.',
        variant: 'destructive',
      });

      setIsMessageDialogOpen(true);
    } catch (error) {
      console.error('SOS Error:', error);
      toast({
        title: 'Could not send SOS',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <Button
        variant="destructive"
        onClick={handleSOSClick}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 text-white font-bold"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Siren className="mr-2 h-4 w-4" />
        )}
        SOS
      </Button>

      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="h-6 w-6 text-red-600" />
              What's the emergency?
            </DialogTitle>
            <DialogDescription>
                Select a reason for your SOS. This will help us respond appropriately.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="my-4 space-y-2">
            {emergencyReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason} id={reason} />
                    <Label htmlFor={reason}>{reason}</Label>
                </div>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button onClick={handleGenerateMessage} className="w-full bg-red-600 hover:bg-red-700">
              Send SOS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <DialogTitle className="text-2xl">
              Alert Sent Successfully
            </DialogTitle>
            <DialogDescription>
              Your SOS has been sent to the admin. They will get in touch with you shortly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsMessageDialogOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
