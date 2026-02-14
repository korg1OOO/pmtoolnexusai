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
import { stripePaymentService } from '@/services/stripePaymentService';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pricingTierId: string;
    onSuccess: (creditsAdded: number, newBalance: number) => void;
}

export function PaymentDialog({
    isOpen,
    onClose,
    pricingTierId,
    onSuccess
}: PaymentDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

    // Fetch pricing tier
    const { data: tier, isLoading } = useQuery({
        queryKey: ['pricing-tier', pricingTierId],
        queryFn: () => aiCreditsService.getPricingTier(pricingTierId),
        enabled: !!pricingTierId
    });

    const handleConfirmPurchase = async () => {
        if (!tier) return;

        setIsProcessing(true);
        setError(null);
        setPaymentStep('processing');

        try {
            // Create payment intent
            const paymentIntent = await stripePaymentService.createPaymentIntent(pricingTierId);

            // In a real implementation, you would:
            // 1. Load Stripe.js
            // 2. Create Stripe Elements
            // 3. Confirm payment with card details
            // 4. Handle 3D Secure if needed

            // For now, we'll simulate a successful payment
            // TODO: Replace with actual Stripe integration
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Confirm purchase
            const result = await stripePaymentService.confirmPurchase(
                paymentIntent.id,
                pricingTierId
            );

            if (result.success) {
                setPaymentStep('success');
                setTimeout(() => {
                    onSuccess(result.credits_added!, result.new_balance!);
                }, 1500);
            } else {
                throw new Error(result.error || 'Purchase failed');
            }

        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
            setPaymentStep('confirm');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading || !tier) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {paymentStep === 'success' ? 'Purchase Successful!' : 'Confirm Purchase'}
                    </DialogTitle>
                    <DialogDescription>
                        {paymentStep === 'success'
                            ? 'Your credits have been added to your account'
                            : 'Review your purchase details'
                        }
                    </DialogDescription>
                </DialogHeader>

                {paymentStep === 'confirm' && (
                    <div className="space-y-4">
                        {/* Purchase Summary */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Package</span>
                                <span className="font-medium">{tier.tier_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Credits</span>
                                <span className="font-medium">{tier.credits.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Tokens</span>
                                <span className="font-medium">
                                    {(tier.credits * 1000).toLocaleString()}
                                </span>
                            </div>
                            {tier.discount_percentage > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span className="text-sm">Discount</span>
                                    <span className="font-medium">
                                        {tier.discount_percentage}% off
                                    </span>
                                </div>
                            )}
                            <div className="pt-3 border-t flex justify-between text-lg">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold">
                                    ${tier.price.toFixed(2)} {tier.currency}
                                </span>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Payment Info */}
                        <Alert>
                            <CreditCard className="h-4 w-4" />
                            <AlertDescription>
                                Payment processed securely via Stripe.
                                Credits will be added immediately after payment.
                            </AlertDescription>
                        </Alert>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmPurchase}
                                disabled={isProcessing}
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
                                        Pay ${tier.price.toFixed(2)}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {paymentStep === 'processing' && (
                    <div className="py-8 text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <div>
                            <p className="font-medium">Processing payment...</p>
                            <p className="text-sm text-muted-foreground">
                                Please wait while we process your payment
                            </p>
                        </div>
                    </div>
                )}

                {paymentStep === 'success' && (
                    <div className="py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-lg">Payment Successful!</p>
                            <p className="text-sm text-muted-foreground">
                                {tier.credits.toLocaleString()} credits have been added to your account
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
