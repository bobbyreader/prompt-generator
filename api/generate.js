/* /api/generate — 生图。主路：用户小主机上的 9router（OpenAI 兼容接口）；
 * 兜底：Agnes 图片。两把 Key 都只读环境变量，绝不下发前端。
 * 环境变量：
 *   NINEROUTER_API_KEY   9router 远程访问 Key
 *   NINEROUTER_BASE_URL  默认 https://ai.leobobby.dpdns.org/v1
 *   IMAGE_MODEL          默认 ag/gemini-3.8-flash-high
 *   AGNES_API_KEY        兜底用（与 /api/prompt 共用）
 *   AGNES_IMAGE_MODEL    默认 agnes-image-2.0-flash
 * 请求：POST { prompt, size, negative? }
 * 响应：{ success, image, modelUsed, provider, size }
 */
const REQUEST_TIMEOUT_MS = 240000;
const MAX_PROMPT_LENGTH = 4000;

async function fetchOnce(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonSafe(text) {
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

function extractImage(data) {
  const item = data?.data?.[0];
  if (!item) return null;
  if (item.url) return item.url;
  if (item.b64_json) {
    // 按魔数判断真实格式：/9j/ 开头是 JPEG，iVBOR 是 PNG（9router 实测返回 JPEG）
    const mime = item.b64_json.startsWith('/9j/') ? 'image/jpeg'
      : item.b64_json.startsWith('iVBOR') ? 'image/png' : 'image/png';
    return `data:${mime};base64,${item.b64_json}`;
  }
  return null;
}

async function generateVia9Router(prompt, size) {
  const apiKey = process.env.NINEROUTER_API_KEY;
  if (!apiKey) return null; // 未配置则跳过主路
  const base = (process.env.NINEROUTER_BASE_URL || 'https://ai.leobobby.dpdns.org/v1').replace(/\/$/, '');
  const model = process.env.IMAGE_MODEL || 'ag/gemini-3.8-flash-high';
  const resp = await fetchOnce(`${base}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, size })
  });
  const text = await resp.text();
  const data = parseJsonSafe(text);
  if (!resp.ok) {
    throw new Error(`9router HTTP ${resp.status}: ${(data?.error?.message || text).slice(0, 200)}`);
  }
  const image = extractImage(data);
  if (!image) throw new Error('9router returned no image');
  return { image, modelUsed: model, provider: '9router' };
}

async function generateViaAgnes(prompt, size) {
  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) return null;
  const model = process.env.AGNES_IMAGE_MODEL || 'agnes-image-2.0-flash';
  const resp = await fetchOnce('https://apihub.agnes-ai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, size })
  });
  const text = await resp.text();
  const data = parseJsonSafe(text);
  if (!resp.ok) {
    throw new Error(`Agnes HTTP ${resp.status}: ${(data?.error?.message || text).slice(0, 200)}`);
  }
  const image = extractImage(data);
  if (!image) throw new Error('Agnes returned no image');
  return { image, modelUsed: model, provider: 'agnes' };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: `Prompt is too long. Keep it under ${MAX_PROMPT_LENGTH} characters.` });
  }
  const size = typeof req.body?.size === 'string' && /^\d+x\d+$/.test(req.body.size) ? req.body.size : '1024x1024';
  const negative = typeof req.body?.negative === 'string' ? req.body.negative.trim() : '';
  const fullPrompt = negative ? `${prompt}\n\nAvoid: ${negative}` : prompt;

  // 路由（2026-10-23 实测依据）：9router 固定输出 1024×1024 JPEG、不吃 size，
  // 但只要 15–20 秒且稳定；Agnes 能按比例出图但耗时波动大（9–109 秒）。
  // 所以 1:1 走 9router 主路，非方形走 Agnes 主路，失败互为兜底。
  const providers = size === '1024x1024'
    ? [generateVia9Router, generateViaAgnes]
    : [generateViaAgnes, generateVia9Router];
  const errors = [];
  for (const provider of providers) {
    try {
      const result = await provider(fullPrompt, size);
      if (result) {
        return res.status(200).json({ success: true, size, ...result });
      }
    } catch (err) {
      errors.push(err.message);
    }
  }
  if (!errors.length) {
    return res.status(500).json({ error: 'No image provider configured (set NINEROUTER_API_KEY or AGNES_API_KEY)' });
  }
  const timedOut = errors.some(e => /abort/i.test(e));
  return res.status(timedOut ? 504 : 502).json({
    error: timedOut ? 'Image generation timed out' : 'Image generation failed',
    details: errors.join(' | ')
  });
};
