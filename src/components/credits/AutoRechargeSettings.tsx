import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Save, Info } from 'lucide-react';
import { aiCreditsService } from '@/services/aiCreditsService';
import { toast } from 'sonner';

export function AutoRechargeSettings() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    // Fetch current balance
    const { data: balance, isLoading } = useQuery({
        queryKey: ['ai-credits-balance'],
        queryFn: () => aiCreditsService.getBalance()
    });

    // Form state
    const [enabled, setEnabled] = useState(balance?.auto_recharge_enabled || false);
    const [amount, setAmount] = useState(balance?.auto_recharge_amount || 500);
    const [threshold, setThreshold] = useState(balance?.auto_recharge_threshold || 50);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!balance) return;

            return await aiCreditsService.updateAutoRecharge(
                enabled,
                amount,
                threshold,
                balance.tenant_id,
                balance.user_id
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-credits-balance'] });
            toast.success('Auto-recharge settings updated');
            setIsEditing(false);
        },
        onError: (error: any) => {
            toast.error('Failed to update settings', {
                description: error.message
            });
        }
    });

    const handleSave = () => {
        updateMutation.mutate();
    };

    const handleCancel = () => {
        if (balance) {
            setEnabled(balance.auto_recharge_enabled);
            setAmount(balance.auto_recharge_amount);
            setThreshold(balance.auto_recharge_threshold);
        }
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
            </Card>
        );
    }

    if (!balance) {
        return null;
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Auto-Recharge Settings</h3>
                </div>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Edit
                    </Button>
                )}
            </div>

            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Auto-recharge automatically purchases credits when your balance falls below the threshold.
                    Requires a saved payment method.
                </AlertDescription>
            </Alert>

            <div className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="auto-recharge-enabled">Enable Auto-Recharge</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically purchase credits when balance is low
                        </p>
                    </div>
                    <Switch
                        id="auto-recharge-enabled"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        disabled={!isEditing}
                    />
                </div>

                {/* Recharge Amount */}
                <div className="space-y-2">
                    <Label htmlFor="recharge-amount">Recharge Amount (credits)</Label>
                    <Select
                        value={amount.toString()}
                        onValueChange={(value) => setAmount(parseInt(value))}
                        disabled={!isEditing || !enabled}
                    >
                        <SelectTrigger id="recharge-amount">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">100 credits ($10)</SelectItem>
                            <SelectItem value="500">500 credits ($45)</SelectItem>
                            <SelectItem value="1000">1,000 credits ($80)</SelectItem>
                            <SelectItem value="5000">5,000 credits ($350)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        Credits to purchase when auto-recharge triggers
                    </p>
                </div>

                {/* Threshold */}
                <div className="space-y-2">
                    <Label htmlFor="recharge-threshold">Trigger Threshold (credits)</Label>
                    <Input
                        id="recharge-threshold"
                        type="number"
                        min="10"
                        max="1000"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        disabled={!isEditing || !enabled}
                    />
                    <p className="text-sm text-muted-foreground">
                        Auto-recharge when balance falls below this amount
                    </p>
                </div>

                {/* Current Status */}
                {!isEditing && (
                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Current Status</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                                Auto-recharge: {balance.auto_recharge_enabled ? (
                                    <span className="text-green-600 font-medium">Enabled</span>
                                ) : (
                                    <span className="text-gray-600 font-medium">Disabled</span>
                                )}
                            </p>
                            {balance.auto_recharge_enabled && (
                                <>
                                    <p>Amount: {balance.auto_recharge_amount} credits</p>
                                    <p>Threshold: {balance.auto_recharge_threshold} credits</p>
                                    {balance.last_recharged_at && (
                                        <p>
                                            Last recharged: {new Date(balance.last_recharged_at).toLocaleString()}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex-1"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={updateMutation.isPending}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
