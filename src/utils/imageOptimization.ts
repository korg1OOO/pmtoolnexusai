/**
 * Image Optimization Utility
 * Handles image resizing, compression, and optimization
 */

interface ImageOptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Optimizes an image file using canvas
 */
export async function optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
): Promise<Blob> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                `image/${format}`,
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        reader.onerror = () => reject(new Error('Failed to read file'));

        reader.readAsDataURL(file);
    });
}

/**
 * Generates multiple image sizes for responsive images
 */
export async function generateResponsiveImages(
    file: File
): Promise<{ thumbnail: Blob; medium: Blob; large: Blob }> {
    const [thumbnail, medium, large] = await Promise.all([
        optimizeImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.8 }),
        optimizeImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 }),
        optimizeImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.9 })
    ]);

    return { thumbnail, medium, large };
}

/**
 * Validates image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File size exceeds 10MB limit.' };
    }

    return { valid: true };
}

/**
 * Converts image to WebP format
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<Blob> {
    return optimizeImage(file, { quality, format: 'webp' });
}

/**
 * Gets image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Creates a Supabase Storage-friendly filename
 */
export function generateImageFilename(originalName: string, prefix = 'img'): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${prefix}_${timestamp}_${randomStr}.${extension}`;
}
