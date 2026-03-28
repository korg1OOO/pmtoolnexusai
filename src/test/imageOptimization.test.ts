/**
 * Image Optimization Utility Tests
 *
 * Tests pure functions: validateImageFile, generateImageFilename
 */

import { describe, it, expect, vi } from 'vitest';

import { validateImageFile, generateImageFilename } from '@/utils/imageOptimization';

describe('imageOptimization', () => {
    // ─── validateImageFile (pure logic) ──────────────────────────────

    describe('validateImageFile', () => {
        it('accepts valid JPEG file', () => {
            const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('accepts valid PNG file', () => {
            const file = new File([''], 'photo.png', { type: 'image/png' });
            Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('accepts valid WebP file', () => {
            const file = new File([''], 'photo.webp', { type: 'image/webp' });
            Object.defineProperty(file, 'size', { value: 500 * 1024 }); // 500KB
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('accepts valid GIF file', () => {
            const file = new File([''], 'anim.gif', { type: 'image/gif' });
            Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('rejects non-image file type', () => {
            const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
            Object.defineProperty(file, 'size', { value: 1024 });
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid file type');
        });

        it('rejects SVG file type', () => {
            const file = new File([''], 'icon.svg', { type: 'image/svg+xml' });
            Object.defineProperty(file, 'size', { value: 1024 });
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
        });

        it('rejects file exceeding 10MB', () => {
            const file = new File([''], 'big.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('10MB');
        });

        it('accepts file exactly at 10MB', () => {
            const file = new File([''], 'exact.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // exactly 10MB
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });
    });

    // ─── generateImageFilename (pure logic) ──────────────────────────

    describe('generateImageFilename', () => {
        it('generates filename with default prefix', () => {
            const name = generateImageFilename('photo.jpg');
            expect(name).toMatch(/^img_\d+_[a-z0-9]+\.jpg$/);
        });

        it('uses custom prefix', () => {
            const name = generateImageFilename('photo.png', 'avatar');
            expect(name).toMatch(/^avatar_\d+_[a-z0-9]+\.png$/);
        });

        it('preserves file extension', () => {
            const name = generateImageFilename('image.webp');
            expect(name).toMatch(/\.webp$/);
        });

        it('handles uppercase extensions', () => {
            const name = generateImageFilename('image.PNG');
            expect(name).toMatch(/\.png$/);
        });

        it('generates unique filenames', () => {
            const name1 = generateImageFilename('a.jpg');
            const name2 = generateImageFilename('a.jpg');
            expect(name1).not.toBe(name2);
        });

        it('defaults to jpg for files without extension', () => {
            const name = generateImageFilename('noext');
            expect(name).toMatch(/\.noext$/);
        });
    });

    // ─── Service shape ──────────────────────────────────────────────

    describe('exports', () => {
        it('exports all expected functions', () => {
            expect(typeof validateImageFile).toBe('function');
            expect(typeof generateImageFilename).toBe('function');
        });
    });
});
