/**
 * Password Strength Indicator
 * Real-time password validation and strength feedback
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    validatePassword,
    getPasswordStrength,
    getPasswordStrengthLabel,
    PasswordPolicy,
} from '@/services/passwordPolicyService';

interface PasswordStrengthIndicatorProps {
    password: string;
    policy: PasswordPolicy;
    className?: string;
}

export function PasswordStrengthIndicator({
    password,
    policy,
    className,
}: PasswordStrengthIndicatorProps) {
    const validation = validatePassword(password, policy);
    const strength = getPasswordStrength(password);
    const strengthLabel = getPasswordStrengthLabel(strength);

    const strengthColors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-blue-500',
        'bg-green-500',
    ];

    const strengthTextColors = [
        'text-red-600',
        'text-orange-600',
        'text-yellow-600',
        'text-blue-600',
        'text-green-600',
    ];

    return (
        <div className={cn('space-y-3', className)}>
            {/* Strength Bar */}
            {password && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Password Strength</span>
                        <span className={cn('font-medium', strengthTextColors[strength])}>
                            {strengthLabel}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((index) => (
                            <div
                                key={index}
                                className={cn(
                                    'h-1 flex-1 rounded-full transition-colors',
                                    index <= strength ? strengthColors[strength] : 'bg-muted'
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Requirements Checklist */}
            {password && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
                    <div className="space-y-1">
                        <RequirementItem
                            met={password.length >= policy.min_length}
                            text={`At least ${policy.min_length} characters`}
                        />
                        {policy.require_uppercase && (
                            <RequirementItem
                                met={/[A-Z]/.test(password)}
                                text="One uppercase letter"
                            />
                        )}
                        {policy.require_lowercase && (
                            <RequirementItem
                                met={/[a-z]/.test(password)}
                                text="One lowercase letter"
                            />
                        )}
                        {policy.require_numbers && (
                            <RequirementItem
                                met={/[0-9]/.test(password)}
                                text="One number"
                            />
                        )}
                        {policy.require_special_chars && (
                            <RequirementItem
                                met={/[^A-Za-z0-9]/.test(password)}
                                text="One special character"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface RequirementItemProps {
    met: boolean;
    text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {met ? (
                <Check className="h-3 w-3 text-green-600" />
            ) : (
                <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(met ? 'text-green-600' : 'text-muted-foreground')}>
                {text}
            </span>
        </div>
    );
}
