import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertTriangle, Zap, TrendingDown } from 'lucide-react';
import { aiCreditsService } from '@/services/aiCreditsService';

interface CreditBalanceWidgetProps {
    showPurchaseButton?: boolean;
    compact?: boolean;
}

export function CreditBalanceWidget({
    showPurchaseButton = true,
    compact = false
}: CreditBalanceWidgetProps) {
    const navigate = useNavigate();

    const { data: balance, isLoading } = useQuery({
        queryKey: ['ai-credits-balance'],
        queryFn: () => aiCreditsService.getBalance(),
        refetchInterval: 60000 // Refresh every minute
    });

    if (isLoading) {
        return (
            <Card className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
            </Card>
        );
    }

    if (!balance) {
        return null;
    }

    const isLow = balance.available_credits < balance.low_balance_threshold;
    const isCritical = balance.available_credits < 10;
    const percentageUsed = (balance.used_credits / balance.total_credits) * 100;

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-primary'}`} />
                    <span className={`font-semibold ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : ''}`}>
                        {balance.available_credits.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">credits</span>
                </div>
                {showPurchaseButton && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/credits/purchase')}
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Buy
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-muted-foreground">AI Credits</p>
                        <p className={`text-3xl font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : ''}`}>
                            {balance.available_credits.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            ≈ {(balance.available_credits * 1000).toLocaleString()} tokens
                        </p>
                    </div>
                    {showPurchaseButton && (
                        <Button onClick={() => navigate('/credits/purchase')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Buy Credits
                        </Button>
                    )}
                </div>

                {/* Usage Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {balance.used_credits.toLocaleString()}</span>
                        <span>Total: {balance.total_credits.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${percentageUsed > 90 ? 'bg-red-600' :
                                    percentageUsed > 75 ? 'bg-yellow-600' :
                                        'bg-primary'
                                }`}
                            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Auto-recharge indicator */}
                {balance.auto_recharge_enabled && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>
                            Auto-recharge enabled ({balance.auto_recharge_amount} credits at {balance.auto_recharge_threshold} threshold)
                        </span>
                    </div>
                )}
            </Card>

            {/* Low Balance Alert */}
            {isLow && (
                <Alert variant={isCritical ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                        {isCritical ? 'Critical: AI Credits Almost Depleted' : 'Low AI Credits'}
                    </AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            You have {balance.available_credits} credits remaining.
                            {isCritical && ' AI features will be disabled when balance reaches 0.'}
                        </span>
                        {showPurchaseButton && (
                            <Button
                                size="sm"
                                variant={isCritical ? 'default' : 'outline'}
                                onClick={() => navigate('/credits/purchase')}
                            >
                                Buy Now
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
