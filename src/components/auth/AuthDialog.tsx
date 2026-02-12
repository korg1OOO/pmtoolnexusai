import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Check } from 'lucide-react';
import { type SubscriptionTier } from '@/hooks/useFeatureAccess';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { cn } from '@/lib/utils';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTier?: SubscriptionTier;
}

export function AuthDialog({ open, onOpenChange, defaultTier }: AuthDialogProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(defaultTier || 'free');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  // Update tier if defaultTier changes
  useEffect(() => {
    if (defaultTier) {
      setSelectedTier(defaultTier);
      setMode('signup'); // Auto-switch to signup if tier specified
    }
  }, [defaultTier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast.success('Signed in successfully');
      } else {
        // Sign up user
        const { data } = await signUp(email, password) as any;

        // Create subscription record
        if (data?.user) {
          const tierPricing: Record<SubscriptionTier, number> = {
            free: 0,
            pro: 10,
            business: 39,
            agency: 99,
          };

          await supabase.from('subscriptions').insert({
            user_id: data.user.id,
            email: data.user.email,
            tier: selectedTier,
            status: selectedTier === 'free' ? 'active' : 'trial',
            mrr: tierPricing[selectedTier],
            trial_ends_at: selectedTier !== 'free'
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 day trial
              : null,
          });

          // Update profile tier
          await supabase.from('profiles').update({
            subscription_tier: selectedTier,
          }).eq('id', data.user.id);
        }

        toast.success('Account created! Check your email to verify.');
      }
      onOpenChange(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin'
              ? 'Sign in to access your projects and collaborate with your team.'
              : 'Create an account to start managing your projects.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['free', 'pro', 'business', 'agency'] as SubscriptionTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={cn(
                      'relative px-3 py-2 rounded-md border text-sm font-medium transition-all',
                      selectedTier === tier
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {selectedTier === tier && (
                      <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
                    )}
                    <div className="capitalize">{tier}</div>
                    <div className="text-xs text-muted-foreground">
                      {tier === 'free' ? 'Free' : `$${tier === 'pro' ? '10' : tier === 'business' ? '39' : '99'}/mo`}
                    </div>
                  </button>
                ))}
              </div>
              {selectedTier !== 'free' && (
                <p className="text-xs text-muted-foreground">
                  Start with 14-day free trial, cancel anytime
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
