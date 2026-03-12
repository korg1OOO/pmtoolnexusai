import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import type { PlanConfig } from '@/hooks/usePlanConfigs';
import { useUpdatePlanConfig } from '@/hooks/usePlanConfigs';

interface PlanCardProps {
    plan: PlanConfig;
}

export function PlanCard({ plan }: PlanCardProps) {
    const [formData, setFormData] = useState(plan);
    const [isDirty, setIsDirty] = useState(false);
    const updatePlan = useUpdatePlanConfig();

    const handleChange = (field: keyof PlanConfig, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        updatePlan.mutate(
            { ...formData, tier: plan.tier },
            { onSuccess: () => setIsDirty(false) }
        );
    };

    return (
        <Card className={`relative transition-all ${isDirty ? 'border-yellow-400' : ''}`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold capitalize flex items-center gap-2">
                        {plan.display_name}
                        <Badge variant="outline" className="text-xs font-normal">{plan.tier}</Badge>
                    </CardTitle>
                    {plan.is_popular && <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Popular</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Description */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                        value={formData.description || ''}
                        onChange={e => handleChange('description', e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Price (Mo)</Label>
                        <Input
                            type="number"
                            value={formData.price_monthly}
                            onChange={e => handleChange('price_monthly', parseFloat(e.target.value))}
                            className="h-8 text-sm"
                        />
                    </div>
                </div>

                {/* Limits */}
                <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-semibold">Limits (-1 for Unlimited)</Label>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Projects</Label>
                            <Input
                                type="number"
                                value={formData.max_projects}
                                onChange={e => handleChange('max_projects', parseInt(e.target.value))}
                                className="h-7 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Members</Label>
                            <Input
                                type="number"
                                value={formData.max_members}
                                onChange={e => handleChange('max_members', parseInt(e.target.value))}
                                className="h-7 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">AI Credits</Label>
                            <Input
                                type="number"
                                value={formData.max_ai_credits}
                                onChange={e => handleChange('max_ai_credits', parseInt(e.target.value))}
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between pt-2">
                    <Label className="text-xs">Active on Pricing Page</Label>
                    <Switch
                        checked={formData.is_active}
                        onCheckedChange={checked => handleChange('is_active', checked)}
                    />
                </div>

                {/* Save Button */}
                {isDirty && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updatePlan.isPending}
                        className="w-full mt-2"
                    >
                        {updatePlan.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                        Save Changes
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
