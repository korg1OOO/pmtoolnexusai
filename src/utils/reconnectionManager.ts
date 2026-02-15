/**
 * Reconnection Manager
 * Handles automatic reconnection with exponential backoff
 */

export class ReconnectionManager {
    private attempts = 0;
    private maxAttempts: number;
    private baseDelay: number;
    private maxDelay: number;
    private timeoutId: NodeJS.Timeout | null = null;
    private isReconnecting = false;

    constructor(
        maxAttempts = 10,
        baseDelay = 1000,
        maxDelay = 30000
    ) {
        this.maxAttempts = maxAttempts;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    /**
     * Calculate delay with exponential backoff
     */
    private calculateDelay(): number {
        const exponentialDelay = this.baseDelay * Math.pow(2, this.attempts);
        return Math.min(exponentialDelay, this.maxDelay);
    }

    /**
     * Attempt reconnection with backoff
     */
    async reconnect(connectFn: () => Promise<void>): Promise<boolean> {
        if (this.isReconnecting) {
            return false;
        }

        if (this.attempts >= this.maxAttempts) {
            console.error('Max reconnection attempts reached');
            return false;
        }

        this.isReconnecting = true;
        this.attempts++;

        const delay = this.calculateDelay();
        console.log(`Reconnecting in ${delay}ms (attempt ${this.attempts}/${this.maxAttempts})`);

        return new Promise((resolve) => {
            this.timeoutId = setTimeout(async () => {
                try {
                    await connectFn();
                    this.reset();
                    this.isReconnecting = false;
                    resolve(true);
                } catch (error) {
                    console.error('Reconnection failed:', error);
                    this.isReconnecting = false;
                    resolve(false);
                }
            }, delay);
        });
    }

    /**
     * Reset reconnection state
     */
    reset(): void {
        this.attempts = 0;
        this.isReconnecting = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * Cancel ongoing reconnection
     */
    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.isReconnecting = false;
    }

    /**
     * Get current attempt count
     */
    getAttempts(): number {
        return this.attempts;
    }

    /**
     * Check if currently reconnecting
     */
    isActive(): boolean {
        return this.isReconnecting;
    }
}
