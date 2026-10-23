/* /api/prompt — 服务端调用 Agnes 文本模型，一次生成 3 个真正不同的候选方向。
 * 请求：POST { idea, style, purpose, size }
 * 响应：{ success, source: 'agnes', candidates: [{id,label,prompt,negative,fields}], note_zh }
 * Key 只从环境变量 AGNES_API_KEY 读取，绝不下发前端。
 */
const AGNES_URL = 'https://apihub.agnes-ai.com/v1/chat/completions';
const ATTEMPT_TIMEOUT_MS = 50000;

const STYLE_NAMES = {
  auto: '自动（由你判断最合适的视觉风格）',
  photography: '摄影（真实相机拍摄质感）',
  illustration: '插画（编辑级数字插画）',
  anime: '动漫（日式动漫主视觉）',
  concept: '概念艺术（高端概念设计）',
  '3d': '3D 渲染（高品质三维渲染）'
};

function buildSystemPrompt() {
  return [
    'You are an expert image-prompt engineer for modern text-to-image models.',
    'Given a user idea (often in Chinese), produce THREE genuinely different prompt candidates in one JSON object.',
    'Candidates: "balanced" （平衡版： versatile, faithful to the idea), "bold" （冲击版： stronger visual hook, drama, contrast), "clean" （克制版： minimal, premium, generous negative space). They must differ in composition, lighting and mood — not just in a few adjectives.',
    'Each candidate needs:',
    '- prompt: a complete English prompt as ONE coherent descriptive paragraph (natural language, not keyword spam). Translate and expand the user idea into vivid visual detail: subject, action, environment, materials, colors. Never leave Chinese characters in the prompt. Never mention "AI" or instructions.',
    '- negative: an English comma-separated negative prompt tailored to this subject (only relevant failure modes).',
    '- fields: {purpose, subject, scene, action, style, composition, lighting, mood, details, constraints, avoid} — concise English phrases that exactly correspond to the prompt.',
    'Also return "note_zh": one short Chinese sentence summarizing the three directions for the user.',
    'Output ONLY valid JSON, no markdown fences, no commentary. Schema:',
    '{"note_zh":"...","candidates":[{"id":"balanced","label":"平衡版","prompt":"...","negative":"...","fields":{"purpose":"...","subject":"...","scene":"...","action":"...","style":"...","composition":"...","lighting":"...","mood":"...","details":"...","constraints":"...","avoid":"..."}},{"id":"bold","label":"冲击版","prompt":"...","negative":"...","fields":{...}},{"id":"clean","label":"克制版","prompt":"...","negative":"...","fields":{...}}]}'
  ].join('\n');
}

function parseModelJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}

function normalizeCandidates(parsed) {
  if (!parsed || !Array.isArray(parsed.candidates)) return null;
  const out = parsed.candidates
    .filter(c => c && typeof c.prompt === 'string' && c.prompt.trim())
    .slice(0, 3)
    .map((c, i) => ({
      id: ['balanced', 'bold', 'clean'].includes(c.id) ? c.id : ['balanced', 'bold', 'clean'][i] || `c${i}`,
      label: typeof c.label === 'string' && c.label ? c.label : ['平衡版', '冲击版', '克制版'][i] || `方向 ${i + 1}`,
      prompt: c.prompt.trim(),
      negative: typeof c.negative === 'string' ? c.negative.trim() : '',
      fields: c.fields && typeof c.fields === 'object' ? c.fields : {}
    }));
  return out.length ? out : null;
}

async function callAgnes(apiKey, model, payload) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const resp = await fetch(AGNES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: JSON.stringify(payload) }
          ],
          temperature: 0.8
        }),
        signal: controller.signal
      });
      const text = await resp.text();
      if (resp.status === 429 && attempt < 2) {
        // Agnes 按来源 IP 限流，窗口约需几十秒：退避 15s / 30s
        await new Promise(r => setTimeout(r, attempt === 0 ? 15000 : 30000));
        continue;
      }
      if (!resp.ok) {
        throw new Error(`Agnes HTTP ${resp.status}: ${text.slice(0, 200)}`);
      }
      const data = JSON.parse(text);
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      lastError = err;
      if (attempt < 2 && (err.name === 'AbortError' || /429/.test(err.message))) {
        await new Promise(r => setTimeout(r, 8000));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('Agnes request failed');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const idea = typeof req.body?.idea === 'string' ? req.body.idea.trim() : '';
  if (!idea) return res.status(400).json({ error: 'idea is required' });
  if (idea.length > 500) return res.status(400).json({ error: 'idea too long (max 500 chars)' });

  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AGNES_API_KEY not configured' });
  const model = process.env.AGNES_MODEL || 'agnes-3.0-flash';

  const payload = {
    idea,
    style: STYLE_NAMES[req.body?.style] || STYLE_NAMES.auto,
    purpose: typeof req.body?.purpose === 'string' ? req.body.purpose.slice(0, 40) : '通用图片',
    size: typeof req.body?.size === 'string' ? req.body.size : '1024x1024'
  };

  try {
    const content = await callAgnes(apiKey, model, payload);
    const parsed = parseModelJson(content);
    const candidates = normalizeCandidates(parsed);
    if (!candidates) {
      return res.status(502).json({ error: 'Model returned unusable output', details: String(content).slice(0, 200) });
    }
    return res.status(200).json({
      success: true,
      source: 'agnes',
      modelUsed: model,
      note_zh: typeof parsed.note_zh === 'string' ? parsed.note_zh : '',
      candidates
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Prompt generation timed out' : 'Prompt generation failed',
      details: err.message
    });
  }
};

// 供本地测试脚本引用（不影响线上）
module.exports._buildSystemPrompt = buildSystemPrompt;
