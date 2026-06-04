import { describe, it, expect, beforeEach } from 'vitest';
import {
    STORAGE_KEYS,
    escapeHtml,
    formatTime
} from '../src/storage.js';

describe('STORAGE_KEYS', () => {
    it('包含所有存储键名', () => {
        expect(STORAGE_KEYS.HISTORY).toBe('prompt_history');
        expect(STORAGE_KEYS.FAVORITES).toBe('prompt_favorites');
        expect(STORAGE_KEYS.STATS).toBe('prompt_stats');
        expect(STORAGE_KEYS.THEME).toBe('prompt_theme');
    });
});

describe('escapeHtml', () => {
    it('转义 HTML 特殊字符', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
        expect(escapeHtml('a & b')).toBe('a &amp; b');
        // textContent 不转义双引号（这是预期行为）
        expect(escapeHtml('"quoted"')).toBe('"quoted"');
    });

    it('普通文本不变', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
        expect(escapeHtml('中文测试')).toBe('中文测试');
    });

    it('处理空字符串', () => {
        expect(escapeHtml('')).toBe('');
    });
});

describe('formatTime', () => {
    it('刚刚（60秒内）', () => {
        const now = Date.now();
        expect(formatTime(now)).toBe('刚刚');
        expect(formatTime(now - 30000)).toBe('刚刚');
    });

    it('分钟前', () => {
        const now = Date.now();
        expect(formatTime(now - 60000)).toBe('1分钟前');
        expect(formatTime(now - 300000)).toBe('5分钟前');
    });

    it('小时前', () => {
        const now = Date.now();
        expect(formatTime(now - 3600000)).toBe('1小时前');
        expect(formatTime(now - 7200000)).toBe('2小时前');
    });

    it('超过24小时显示日期', () => {
        const old = Date.now() - 86400000 * 2;
        const result = formatTime(old);
        expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
    });
});
