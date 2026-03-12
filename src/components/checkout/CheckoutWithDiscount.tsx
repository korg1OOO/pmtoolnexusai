/**
 * Checkout Integration with Discount Validation
 * Example component showing how to integrate advanced discount validation
 */

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateDiscountCode, calculateDiscount } from '@/hooks/useAdvancedAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CheckoutWithDiscountProps {
    userId: string;
    tier: 'pro' | 'business' | 'agency';
    originalAmount: number;
    onCheckout: (finalAmount: number, discountCode?: string) => void;
}

export function CheckoutWithDiscount({
    userId,
    tier,
    originalAmount,
    onCheckout,
}: CheckoutWithDiscountProps) {
    const [discountCode, setDiscountCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<{
        code: string;
        discountAmount: number;
        finalAmount: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleValidateDiscount = async () => {
        if (!discountCode.trim()) {
            setError('Please enter a discount code');
            return;
        }

        setValidating(true);
        setError(null);

        try {
            // Validate discount code with tier and user restrictions
            const result = await validateDiscountCode(discountCode.toUpperCase(), userId, tier);

            if (!result.valid) {
                setError(result.error || 'Invalid discount code');
                setAppliedDiscount(null);
                toast({
                    title: 'Invalid Code',
                    description: result.error,
                    variant: 'destructive',
                });
                return;
            }

            // Calculate discount amount
            const discount = calculateDiscount(
                originalAmount,
                result.discountCode.discount_type,
                result.discountCode.discount_value
            );

            setAppliedDiscount({
                code: discountCode.toUpperCase(),
                discountAmount: discount.discountAmount,
                finalAmount: discount.finalAmount,
            });

            toast({
                title: 'Discount Applied!',
                description: `You saved $${discount.discountAmount.toFixed(2)}`,
            });
        } catch (err) {
            console.error('Discount validation error:', err);
            setError('Failed to validate discount code');
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setError(null);
    };

    const handleProceedToCheckout = () => {
        const finalAmount = appliedDiscount?.finalAmount || originalAmount;
        onCheckout(finalAmount, appliedDiscount?.code);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Pricing Summary */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-lg">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">${originalAmount.toFixed(2)}</span>
                    </div>

                    {/* Discount Code Input */}
                    <div className="space-y-2">
                        <Label htmlFor="discountCode">Discount Code (optional)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="discountCode"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                placeholder="Enter code"
                                disabled={!!appliedDiscount}
                                className="uppercase"
                                onKeyDown={(e) => e.key === 'Enter' && handleValidateDiscount()}
                            />
                            {!appliedDiscount ? (
                                <Button
                                    onClick={handleValidateDiscount}
                                    disabled={validating || !discountCode.trim()}
                                    variant="outline"
                                >
                                    {validating ? 'Validating...' : 'Apply'}
                                </Button>
                            ) : (
                                <Button onClick={handleRemoveDiscount} variant="outline">
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-destructive">{error}</div>
                        </div>
                    )}

                    {/* Applied Discount */}
                    {appliedDiscount && (
                        <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/30 rounded-md">
                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-success">
                                    Discount code "{appliedDiscount.code}" applied!
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    You're saving ${appliedDiscount.discountAmount.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Discount Line Item */}
                    {appliedDiscount && (
                        <div className="flex items-center justify-between text-success">
                            <span className="flex items-center gap-1">
                                <Percent className="h-4 w-4" />
                                Discount
                            </span>
                            <span className="font-semibold">-${appliedDiscount.discountAmount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Total */}
                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-2xl font-bold">
                            <span>Total</span>
                            <span>
                                ${(appliedDiscount?.finalAmount || originalAmount).toFixed(2)}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-right">
                            Billed {tier} plan
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <Button className="w-full" size="lg" onClick={handleProceedToCheckout}>
                    Proceed to Payment
                </Button>

                {/* Info Badges */}
                <div className="flex gap-2 justify-center">
                    <Badge variant="secondary" className="text-xs">
                        {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                    </Badge>
                    {appliedDiscount && (
                        <Badge variant="outline" className="text-xs text-success">
                            Discount Applied
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
