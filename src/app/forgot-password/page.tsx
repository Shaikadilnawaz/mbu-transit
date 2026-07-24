'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: 'Password Reset',
        description: 'If an account exists for this email, a reset link has been sent.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Could not send reset link',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline text-accent">Forgot Your Password?</h1>
          <p className="mt-2 text-muted-foreground">
            No worries! Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
        <div className="text-center text-sm">
          Remembered your password?{' '}
          <Link href="/login" className="underline text-accent">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
