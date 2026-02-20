/**
 * use-toast — Sonner shim
 *
 * All callers using `const { toast } = useToast()` or `toast({ title, description })`
 * continue to work without changes. This module now delegates to Sonner so there is
 * a single toast system in the app.
 *
 * Call sites that previously used:
 *   toast({ title: 'X', description: 'Y', variant: 'destructive' })
 * are mapped to:
 *   sonnerToast.error('X', { description: 'Y' })
 *
 * For new code, prefer importing `toast` directly from 'sonner'.
 */
import { toast as sonnerToast } from 'sonner';

export type ToastVariant = 'default' | 'destructive';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Shim function compatible with the legacy Radix-based `toast({ title, description, variant })` API.
 */
export function toast(opts: ToastOptions) {
  const { title, description, variant, duration } = opts;
  const message = title ?? '';
  const options = { description, duration };

  if (variant === 'destructive') {
    sonnerToast.error(message, options);
  } else {
    sonnerToast(message, options);
  }
}

/**
 * Hook returning a `toast` function compatible with the legacy `useToast()` API.
 * New components should use `import { toast } from 'sonner'` directly.
 */
export function useToast() {
  return { toast };
}

// Re-export for any callers that also import the raw Sonner toast from here
export { sonnerToast };
