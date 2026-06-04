import { describe, it, expect } from 'vitest';
import { styleEnhancers, promptTemplates, variables } from '../src/data.js';

describe('styleEnhancers', () => {
    it('包含所有风格', () => {
        expect(styleEnhancers).toHaveProperty('auto');
        expect(styleEnhancers).toHaveProperty('photography');
        expect(styleEnhancers).toHaveProperty('illustration');
        expect(styleEnhancers).toHaveProperty('anime');
        expect(styleEnhancers).toHaveProperty('concept');
        expect(styleEnhancers).toHaveProperty('3d');
    });

    it('每种风格都有 common 和 modifiers', () => {
        Object.values(styleEnhancers).forEach(style => {
            expect(typeof style.common).toBe('string');
            expect(Array.isArray(style.modifiers)).toBe(true);
            expect(style.modifiers.length).toBeGreaterThan(0);
        });
    });

    it('common 包含质量关键词', () => {
        Object.values(styleEnhancers).forEach(style => {
            expect(style.common.length).toBeGreaterThan(10);
        });
    });
});

describe('promptTemplates', () => {
    it('包含所有模板类型', () => {
        expect(promptTemplates).toHaveProperty('portrait');
        expect(promptTemplates).toHaveProperty('landscape');
        expect(promptTemplates).toHaveProperty('anime');
        expect(promptTemplates).toHaveProperty('cyberpunk');
        expect(promptTemplates).toHaveProperty('fantasy');
        expect(promptTemplates).toHaveProperty('product');
        expect(promptTemplates).toHaveProperty('poster');
        expect(promptTemplates).toHaveProperty('concept');
    });

    it('每个模板至少有3个变体', () => {
        Object.values(promptTemplates).forEach(templates => {
            expect(templates.length).toBeGreaterThanOrEqual(3);
            templates.forEach(t => {
                expect(typeof t).toBe('string');
                expect(t.length).toBeGreaterThan(20);
            });
        });
    });

    it('模板包含占位符', () => {
        promptTemplates.portrait.forEach(t => {
            expect(t).toContain('{subject}');
        });
    });
});

describe('variables', () => {
    it('包含所有变量类别', () => {
        expect(variables).toHaveProperty('subject');
        expect(variables).toHaveProperty('lighting');
        expect(variables).toHaveProperty('mood');
        expect(variables).toHaveProperty('camera');
        expect(variables).toHaveProperty('setting');
    });

    it('subject 有多个子类', () => {
        expect(variables.subject).toHaveProperty('common');
        expect(variables.subject).toHaveProperty('portrait');
        expect(variables.subject).toHaveProperty('landscape');
        expect(Array.isArray(variables.subject.common)).toBe(true);
    });

    it('所有数组变量非空', () => {
        Object.entries(variables).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                expect(val.length).toBeGreaterThan(0);
            } else {
                Object.values(val).forEach(arr => {
                    expect(arr.length).toBeGreaterThan(0);
                });
            }
        });
    });
});
