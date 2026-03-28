/**
 * input-otp Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';

describe('input-otp', () => {
    it('exports InputOTP', () => {
        expect(InputOTP).toBeDefined();
    });
    it('exports InputOTPGroup', () => {
        expect(InputOTPGroup).toBeDefined();
    });
    it('exports InputOTPSlot', () => {
        expect(InputOTPSlot).toBeDefined();
    });
    it('exports InputOTPSeparator', () => {
        expect(InputOTPSeparator).toBeDefined();
    });
});
