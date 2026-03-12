import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingUp } from 'lucide-react';
import { PricingTier } from '@/services/aiCreditsService';

interface PricingCardProps {
    tier: PricingTier;
    onSelect: (tierId: string) => void;
    isLoading?: boolean;
}

export function PricingCard({ tier, onSelect, isLoading }: PricingCardProps) {
    const tokensCount = tier.credits * 1000;
    const pricePerCredit = tier.price / tier.credits;

    return (
        <Card
            className={`
                relative p-6 transition-all hover:shadow-lg
                ${tier.is_featured ? 'border-2 border-primary shadow-md' : 'border'}
            `}
        >
            {/* Featured Badge */}
            {tier.is_featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Most Popular
                    </Badge>
                </div>
            )}

            {/* Tier Name */}
            <div className="text-center mb-4">
                <h3 className="text-2xl font-bold">{tier.tier_name}</h3>
                {tier.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {tier.description}
                    </p>
                )}
            </div>

            {/* Price */}
            <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">
                        ${tier.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                        {tier.currency}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {tier.credits.toLocaleString()} AI Credits
                </p>
                {tier.discount_percentage > 0 && (
                    <Badge variant="secondary" className="mt-2">
                        Save {tier.discount_percentage}%
                    </Badge>
                )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-medium">
                            {tokensCount.toLocaleString()} tokens
                        </span>
                        <p className="text-xs text-muted-foreground">
                            1 credit = 1,000 tokens
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-medium">Never expires</span>
                        <p className="text-xs text-muted-foreground">
                            Use credits anytime
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-medium">All AI features</span>
                        <p className="text-xs text-muted-foreground">
                            Summaries, analysis, generation
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-medium">
                            ${pricePerCredit.toFixed(3)} per credit
                        </span>
                        <p className="text-xs text-muted-foreground">
                            Best value pricing
                        </p>
                    </div>
                </li>
            </ul>

            {/* Purchase Button */}
            <Button
                className="w-full"
                size="lg"
                variant={tier.is_featured ? 'default' : 'outline'}
                onClick={() => onSelect(tier.id)}
                disabled={isLoading}
            >
                <Zap className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Purchase Credits'}
            </Button>

            {/* Price Breakdown */}
            <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                    ≈ ${(tier.price / tokensCount * 1000).toFixed(4)} per 1K tokens
                </p>
            </div>
        </Card>
    );
}
