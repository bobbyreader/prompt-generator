import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/generate.js';

function createRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

describe('api/generate handler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        process.env.GEMINI_API_KEY = 'test-key';
        delete process.env.GEMINI_MODEL;
        delete process.env.AI_IMAGE_PROVIDER;
        delete process.env.AGNES_API_KEY;
        delete process.env.AGNES_IMAGE_MODEL;
    });

    it('rejects empty prompts after trimming', async () => {
        const req = { method: 'POST', body: { prompt: '   ' } };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Prompt is required');
    });

    it('returns provider details when upstream request fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve(JSON.stringify({
                error: { message: 'quota exceeded' }
            }))
        });

        const req = { method: 'POST', body: { prompt: 'draw a fox' } };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Image generation request failed');
        expect(res.body.details).toContain('quota exceeded');
    });

    it('returns success payload when provider sends inline image data', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({
                candidates: [{
                    content: {
                        parts: [{
                            inlineData: {
                                mimeType: 'image/png',
                                data: 'abc123'
                            }
                        }]
                    }
                }]
            }))
        });

        const req = { method: 'POST', body: { prompt: 'draw a fox' } };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.image).toBe('data:image/png;base64,abc123');
    });

    it('returns a friendly response when no image is produced', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({
                candidates: [{
                    finishReason: 'SAFETY'
                }]
            }))
        });

        const req = { method: 'POST', body: { prompt: 'draw a fox' } };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.details).toBe('SAFETY');
    });

    it('uses Agnes image generation endpoint when provider is agnes', async () => {
        process.env.AI_IMAGE_PROVIDER = 'agnes';
        process.env.AGNES_API_KEY = 'agnes-key';

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({
                data: [{
                    url: 'https://cdn.example.com/generated.png'
                }]
            }))
        });
        global.fetch = fetchMock;

        const { default: agnesHandler } = await import('../api/generate.js');
        const req = { method: 'POST', body: { prompt: 'draw a fox' } };
        const res = createRes();

        await agnesHandler(req, res);

        expect(fetchMock).toHaveBeenCalledWith(
            'https://apihub.agnes-ai.com/v1/images/generations',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer agnes-key'
                })
            })
        );
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.image).toBe('https://cdn.example.com/generated.png');
        expect(res.body.modelUsed).toBe('agnes-image-1.2');
    });
});
