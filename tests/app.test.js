import { beforeEach, describe, expect, it, vi } from 'vitest';

function buildDom() {
    document.body.innerHTML = `
        <div id="toast"></div>
        <div id="ariaAnnounce"></div>
        <div id="particles"></div>
        <button id="themeToggle"></button>
        <span id="themeIcon"></span>
        <span id="themeText"></span>
        <input id="keywordInput" />
        <textarea id="promptOutput"></textarea>
        <div id="loading"></div>
        <div id="imagePreview"></div>
        <div id="imageActions"></div>
        <div id="imageError"></div>
        <button id="generateImageBtn"></button>
        <div id="imageLoading"></div>
        <img id="generatedImage" alt="" />
        <label><input type="radio" name="imageSize" value="1024x1024" checked /></label>
        <label><input type="radio" name="imageSize" value="1536x1024" /></label>
        <label><input type="radio" name="imageSize" value="1024x1536" /></label>
        <label><input type="radio" name="imageSize" value="1536x864" /></label>
        <label><input type="radio" name="imageSize" value="864x1536" /></label>
        <div id="historyList"></div>
        <div id="favoritesList"></div>
        <div id="statTotal"></div>
        <div id="statToday"></div>
        <div id="chart-photography"></div>
        <div id="count-photography"></div>
        <div id="chart-illustration"></div>
        <div id="count-illustration"></div>
        <div id="chart-anime"></div>
        <div id="count-anime"></div>
        <div id="chart-concept"></div>
        <div id="count-concept"></div>
        <div id="chart-3d"></div>
        <div id="count-3d"></div>
        <button class="copy-btn"></button>
        <div class="style-chip active" data-style="auto" role="radio" aria-checked="true" tabindex="0"></div>
        <div class="style-chip" data-style="photography" role="radio" aria-checked="false" tabindex="-1"></div>
        <div class="style-chip" data-style="illustration" role="radio" aria-checked="false" tabindex="-1"></div>
        <div class="style-chip" data-style="anime" role="radio" aria-checked="false" tabindex="-1"></div>
        <div class="style-chip" data-style="concept" role="radio" aria-checked="false" tabindex="-1"></div>
        <div class="style-chip" data-style="3d" role="radio" aria-checked="false" tabindex="-1"></div>
        <div class="template-card" tabindex="0"></div>
    `;
}

describe('app interactions', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        localStorage.clear();
        buildDom();
        window.requestAnimationFrame = callback => callback();
        navigator.clipboard = { writeText: vi.fn().mockResolvedValue() };
    });

    it('exposes history clearing functions for inline buttons', async () => {
        await import('../src/app.js');

        expect(typeof window.clearHistory).toBe('function');
        expect(typeof window.clearFavorites).toBe('function');
    });

    it('maps template usage to display style stats and history', async () => {
        const { init } = await import('../src/app.js');
        init();

        window.useTemplate('portrait');

        const stats = JSON.parse(localStorage.getItem('prompt_stats'));
        const history = JSON.parse(localStorage.getItem('prompt_history'));

        expect(stats.total).toBe(1);
        expect(stats.byStyle.photography).toBe(1);
        expect(stats.byStyle.portrait).toBeUndefined();
        expect(history[0].style).toBe('photography');
        expect(history[0].imageSettings.size).toBe('1024x1024');
    });

    it('updates aria state when clicking a style chip', async () => {
        const { init } = await import('../src/app.js');
        init();

        const photographyChip = document.querySelector('.style-chip[data-style="photography"]');
        const autoChip = document.querySelector('.style-chip[data-style="auto"]');

        photographyChip.click();

        expect(photographyChip.classList.contains('active')).toBe(true);
        expect(photographyChip.getAttribute('aria-checked')).toBe('true');
        expect(photographyChip.tabIndex).toBe(0);
        expect(autoChip.getAttribute('aria-checked')).toBe('false');
        expect(autoChip.tabIndex).toBe(-1);
    });

    it('supports keyboard navigation across style chips', async () => {
        const { init } = await import('../src/app.js');
        init();

        const autoChip = document.querySelector('.style-chip[data-style="auto"]');
        const photographyChip = document.querySelector('.style-chip[data-style="photography"]');

        autoChip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

        expect(photographyChip.getAttribute('aria-checked')).toBe('true');
        expect(document.activeElement).toBe(photographyChip);
    });

    it('history action delegation can load a saved prompt without crashing', async () => {
        localStorage.setItem('prompt_history', JSON.stringify([
            {
                id: 1,
                text: 'saved prompt',
                style: 'photography',
                imageSettings: { size: '1024x1536' },
                time: Date.now()
            }
        ]));

        const { init } = await import('../src/app.js');
        init();

        document.body.insertAdjacentHTML(
            'beforeend',
            '<button class="item-btn" data-id="1" data-action="use">use</button>'
        );

        document.querySelector('.item-btn').click();

        expect(document.getElementById('promptOutput').value).toBe('saved prompt');
        expect(document.querySelector('input[name="imageSize"][value="1024x1536"]').checked).toBe(true);
    });

    it('shows generated image when API succeeds', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({
                success: true,
                image: 'data:image/png;base64,abc123'
            }))
        });

        const { init } = await import('../src/app.js');
        init();
        document.getElementById('promptOutput').value = 'draw a fox';
        document.querySelector('input[name="imageSize"][value="1536x1024"]').click();

        await window.generateImage();

        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            body: JSON.stringify({
                prompt: 'draw a fox',
                size: '1536x1024'
            })
        }));
        expect(document.getElementById('generatedImage').src).toContain('data:image/png;base64,abc123');
        expect(document.getElementById('imagePreview').classList.contains('show')).toBe(true);
        expect(document.getElementById('imageActions').classList.contains('show')).toBe(true);
        expect(document.getElementById('generateImageBtn').disabled).toBe(false);
    });

    it('favorites preserve image size metadata when saving a prompt', async () => {
        const { init } = await import('../src/app.js');
        init();

        document.getElementById('promptOutput').value = 'poster prompt';
        document.querySelector('input[name="imageSize"][value="864x1536"]').click();

        window.saveFavorite();

        const favorites = JSON.parse(localStorage.getItem('prompt_favorites'));
        expect(favorites[0].imageSettings.size).toBe('864x1536');
    });

    it('shows provider error details when API fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            text: () => Promise.resolve(JSON.stringify({
                error: 'Image generation request failed',
                details: 'quota exceeded'
            }))
        });

        const { init } = await import('../src/app.js');
        init();
        document.getElementById('promptOutput').value = 'draw a fox';

        await window.generateImage();

        expect(document.getElementById('imageError').textContent).toContain('quota exceeded');
        expect(document.getElementById('imageError').classList.contains('show')).toBe(true);
        expect(document.getElementById('generateImageBtn').disabled).toBe(false);
    });

    it('handles non-json responses without crashing', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            text: () => Promise.resolve('<html>bad gateway</html>')
        });

        const { init } = await import('../src/app.js');
        init();
        document.getElementById('promptOutput').value = 'draw a fox';

        await window.generateImage();

        expect(document.getElementById('imageError').textContent).toContain('非 JSON');
    });
});
