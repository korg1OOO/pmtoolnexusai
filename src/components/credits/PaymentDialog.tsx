import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Check, AlertTriangle } from 'lucide-react';
import { aiCreditsService } from '@/services/aiCreditsService';
import { createCreditPaymentIntent, confirmCreditPurchase } from '@/services/stripeService';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

// ── Stripe publishable key (safe to expose client-side) ──────────────────────
const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''
);

// ── Types ────────────────────────────────────────────────────────────────────
interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pricingTierId: string;
    onSuccess: (creditsAdded: number, newBalance: number) => void;
}

// ── Inner form (must be a child of <Elements>) ───────────────────────────────
function CheckoutForm({
    pricingTierId,
    price,
    currency,
    onSuccess,
    onClose,
}: {
    pricingTierId: string;
    price: number;
    currency: string;
    onSuccess: (credits: number, balance: number) => void;
    onClose: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [succeeded, setSucceeded] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setError(null);

        // Confirm the payment using the card details already mounted in <PaymentElement>
        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL only needed if redirect is triggered (3D Secure etc.)
                return_url: `${window.location.origin}/credits?purchase=success`,
            },
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message ?? 'Payment failed. Please try again.');
            setIsProcessing(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            // Record purchase + credit balance on the server
            const result = await confirmCreditPurchase(
                paymentIntent.id,
                pricingTierId
            );

            if (result.success) {
                setSucceeded(true);
                setTimeout(() => {
                    onSuccess(result.credits_added!, result.new_balance!);
                }, 1500);
            } else {
                setError(result.error ?? 'Purchase confirmation failed.');
            }
        }

        setIsProcessing(false);
    };

    if (succeeded) {
        return (
            <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                    <p className="font-medium text-lg">Payment Successful!</p>
                    <p className="text-sm text-muted-foreground">
                        Credits have been added to your account.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Stripe-hosted card input */}
            <PaymentElement />

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                    Payment processed securely via Stripe. Credits added immediately after payment.
                </AlertDescription>
            </Alert>

            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay ${price.toFixed(2)} {currency}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

// ── Main dialog ──────────────────────────────────────────────────────────────
export function PaymentDialog({
    isOpen,
    onClose,
    pricingTierId,
    onSuccess,
}: PaymentDialogProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    // Fetch pricing tier
    const { data: tier, isLoading } = useQuery({
        queryKey: ['pricing-tier', pricingTierId],
        queryFn: () => aiCreditsService.getPricingTier(pricingTierId),
        enabled: !!pricingTierId && isOpen,
    });

    // Once we have the tier, create a PaymentIntent on the backend
    const { isError: intentError, error: intentErr } = useQuery({
        queryKey: ['payment-intent', pricingTierId],
        queryFn: async () => {
            const intent = await createCreditPaymentIntent(pricingTierId);
            setClientSecret(intent.client_secret);
            return intent;
        },
        enabled: !!tier && isOpen && !clientSecret,
        retry: false,
    });

    // Surface payment intent creation errors
    if (intentError && intentErr && !initError) {
        setInitError((intentErr as any).message ?? 'Failed to initialise payment');
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Purchase</DialogTitle>
                    <DialogDescription>
                        {tier
                            ? `${tier.tier_name} — ${tier.credits.toLocaleString()} credits for $${tier.price.toFixed(2)} ${tier.currency}`
                            : 'Loading…'}
                    </DialogDescription>
                </DialogHeader>

                {(isLoading || !clientSecret) && !initError && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {initError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{initError}</AlertDescription>
                    </Alert>
                )}

                {clientSecret && tier && (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: { theme: 'stripe' },
                        }}
                    >
                        <CheckoutForm
                            pricingTierId={pricingTierId}
                            price={tier.price}
                            currency={tier.currency}
                            onSuccess={onSuccess}
                            onClose={onClose}
                        />
                    </Elements>
                )}
            </DialogContent>
        </Dialog>
    );
}
