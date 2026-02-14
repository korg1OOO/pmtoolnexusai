import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, Shield, Zap } from 'lucide-react';
import { aiCreditsService } from '@/services/aiCreditsService';
import { stripePaymentService } from '@/services/stripePaymentService';
import { PricingCard } from './PricingCard';
import { PaymentDialog } from './PaymentDialog';
import { toast } from 'sonner';

export function PurchaseCreditsPage() {
    const navigate = useNavigate();
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    // Fetch pricing tiers
    const { data: pricingTiers, isLoading } = useQuery({
        queryKey: ['ai-pricing-tiers'],
        queryFn: () => aiCreditsService.getPricingTiers()
    });

    // Fetch current balance
    const { data: balance } = useQuery({
        queryKey: ['ai-credits-balance'],
        queryFn: () => aiCreditsService.getBalance()
    });

    const handleSelectTier = (tierId: string) => {
        setSelectedTierId(tierId);
        setIsPaymentDialogOpen(true);
    };

    const handlePaymentSuccess = (creditsAdded: number, newBalance: number) => {
        setIsPaymentDialogOpen(false);
        setSelectedTierId(null);

        toast.success('Purchase Successful!', {
            description: `${creditsAdded} credits added. New balance: ${newBalance} credits`
        });

        // Refresh balance
        // queryClient.invalidateQueries(['ai-credits-balance']);
    };

    const handlePaymentCancel = () => {
        setIsPaymentDialogOpen(false);
        setSelectedTierId(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">
                                Purchase AI Credits
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Power your AI features with flexible credit packages
                            </p>
                        </div>

                        {balance && (
                            <Card className="p-4">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-3xl font-bold">
                                    {balance.available_credits.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    credits available
                                </p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Info Alert */}
                <Alert className="mb-8">
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                        <strong>How it works:</strong> 1 credit = 1,000 AI tokens.
                        Credits are deducted automatically based on actual usage.
                        Credits never expire and can be used across all AI features.
                    </AlertDescription>
                </Alert>

                {/* Pricing Tiers */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i} className="p-6">
                                <Skeleton className="h-8 w-32 mb-4" />
                                <Skeleton className="h-12 w-24 mb-6" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-full mb-6" />
                                <Skeleton className="h-10 w-full" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingTiers?.map(tier => (
                            <PricingCard
                                key={tier.id}
                                tier={tier}
                                onSelect={handleSelectTier}
                            />
                        ))}
                    </div>
                )}

                {/* Features Section */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Secure Payments
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Powered by Stripe. Your payment information is encrypted and secure.
                        </p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Instant Activation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Credits are added to your account immediately after purchase.
                        </p>
                    </Card>

                    <Card className="p-6 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            No Expiration
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Your credits never expire. Use them whenever you need AI features.
                        </p>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">
                        Frequently Asked Questions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">
                                What are AI Credits?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                AI Credits are used to power AI features like meeting summaries,
                                document analysis, and task generation. 1 credit = 1,000 AI tokens.
                            </p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">
                                How are credits deducted?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Credits are automatically deducted based on actual AI usage.
                                You only pay for what you use, calculated dynamically per request.
                            </p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">
                                Do credits expire?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                No! Your credits never expire and can be used anytime across
                                all AI features in the application.
                            </p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">
                                Can I get a refund?
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Unused credits can be refunded within 30 days of purchase.
                                Contact support for refund requests.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Payment Dialog */}
            {selectedTierId && (
                <PaymentDialog
                    isOpen={isPaymentDialogOpen}
                    onClose={handlePaymentCancel}
                    pricingTierId={selectedTierId}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
