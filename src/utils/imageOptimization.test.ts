/**
 * Deep tests for imageOptimization (154 lines)
 * Pure functions: validateImageFile, generateImageFilename
 * (optimizeImage, getImageDimensions need canvas/Image mocking — skipped)
 */
import { describe, it, expect } from 'vitest';
import { validateImageFile, generateImageFilename } from './imageOptimization';

// =================== validateImageFile ===================
describe('validateImageFile', () => {
    const makeFile = (name: string, type: string, size: number): File => {
        const blob = new Blob(['x'.repeat(size)], { type });
        return new File([blob], name, { type });
    };

    it('valid JPEG', () => {
        const r = validateImageFile(makeFile('photo.jpg', 'image/jpeg', 1000));
        expect(r.valid).toBe(true);
        expect(r.error).toBeUndefined();
    });

    it('valid PNG', () => {
        expect(validateImageFile(makeFile('img.png', 'image/png', 5000)).valid).toBe(true);
    });

    it('valid WebP', () => {
        expect(validateImageFile(makeFile('img.webp', 'image/webp', 3000)).valid).toBe(true);
    });

    it('valid GIF', () => {
        expect(validateImageFile(makeFile('anim.gif', 'image/gif', 2000)).valid).toBe(true);
    });

    it('invalid type — SVG', () => {
        const r = validateImageFile(makeFile('logo.svg', 'image/svg+xml', 1000));
        expect(r.valid).toBe(false);
        expect(r.error).toContain('Invalid file type');
    });

    it('invalid type — text', () => {
        const r = validateImageFile(makeFile('doc.txt', 'text/plain', 100));
        expect(r.valid).toBe(false);
        expect(r.error).toContain('Invalid file type');
    });

    it('file too large (>10MB)', () => {
        const smallBlob = new Blob(['test'], { type: 'image/jpeg' });
        const file = new File([smallBlob], 'big.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
        const r = validateImageFile(file);
        expect(r.valid).toBe(false);
        expect(r.error).toContain('10MB');
    });

    it('file exactly at 10MB limit', () => {
        const smallBlob = new Blob(['test'], { type: 'image/jpeg' });
        const file = new File([smallBlob], 'exact.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });
        const r = validateImageFile(file);
        expect(r.valid).toBe(true);
    });

    it('empty file', () => {
        const r = validateImageFile(makeFile('empty.jpg', 'image/jpeg', 0));
        expect(r.valid).toBe(true); // valid type and under size
    });
});

// =================== generateImageFilename ===================
describe('generateImageFilename', () => {
    it('generates with default prefix', () => {
        const name = generateImageFilename('photo.jpg');
        expect(name).toMatch(/^img_\d+_[a-z0-9]+\.jpg$/);
    });

    it('uses custom prefix', () => {
        const name = generateImageFilename('avatar.png', 'avatar');
        expect(name).toMatch(/^avatar_\d+_[a-z0-9]+\.png$/);
    });

    it('preserves extension lowercase', () => {
        const name = generateImageFilename('FILE.PNG');
        expect(name).toMatch('.png');
    });

    it('handles no extension', () => {
        const name = generateImageFilename('noext');
        // When no dot in name, split('.').pop() returns 'noext', used as extension
        expect(name).toMatch('.noext');
    });

    it('generates unique names', () => {
        const n1 = generateImageFilename('photo.jpg');
        const n2 = generateImageFilename('photo.jpg');
        expect(n1).not.toBe(n2);
    });

    it('handles complex original name', () => {
        const name = generateImageFilename('my-photo.test.final.webp');
        expect(name).toMatch('.webp');
    });
});
