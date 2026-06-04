import { describe, it, expect } from 'vitest';
import { enhancements } from '../src/data.js';

describe('enhancements', () => {
    it('包含多个优化增强词', () => {
        expect(enhancements.length).toBeGreaterThan(5);
    });

    it('每个增强词都是非空字符串', () => {
        enhancements.forEach(e => {
            expect(typeof e).toBe('string');
            expect(e.trim().length).toBeGreaterThan(0);
        });
    });

    it('包含质量相关词汇', () => {
        const text = enhancements.join(' ');
        expect(text).toMatch(/detail|quality|sharp|composition/i);
    });

    it('无重复', () => {
        const unique = new Set(enhancements);
        expect(unique.size).toBe(enhancements.length);
    });
});
