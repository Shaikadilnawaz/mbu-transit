import { Loader2 } from 'lucide-react';

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}
