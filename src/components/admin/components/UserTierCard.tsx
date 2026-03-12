/**
 * User Tier Card Component
 * Displays user count and pricing for subscription tiers
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserTierCardProps {
    tierName: string;
    price: string;
    userCount: number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color: 'green' | 'blue' | 'purple';
    icon?: React.ReactNode;
}

const colorStyles = {
    green: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-500',
        badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-500',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-500',
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
};

export function UserTierCard({ tierName, price, userCount, trend, color, icon }: UserTierCardProps) {
    const styles = colorStyles[color];

    return (
        <Card className={cn('transition-all hover:scale-105', styles.border)}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', styles.bg)}>
                        {icon}
                    </div>
                    <Badge variant="outline" className={styles.badge}>
                        {price}
                    </Badge>
                </div>
                <h3 className="font-semibold mb-1">{tierName}</h3>
                <div className="flex items-baseline gap-2">
                    <span className={cn('text-3xl font-bold', styles.text)}>{userCount}</span>
                    {trend && (
                        <div className="flex items-center gap-1">
                            {trend.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    trend.isPositive ? 'text-success' : 'text-destructive'
                                )}
                            >
                                {trend.value}%
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
