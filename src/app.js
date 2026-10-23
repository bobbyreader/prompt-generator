/* 提示词工坊 v2 前端
 * 主路：/api/prompt（Agnes 真 AI，一次出 3 个候选）；失败时用本地模板兜底并明确标注。
 * 生图：/api/generate（服务端 9router 主路 / Agnes 兜底），前端长超时 + 已等待秒数提示。
 */
import { buildPromptCandidates, schemaToPrompt } from './fallback.js';

const $ = id => document.getElementById(id);
const FIELD_LABELS = {
  purpose: '用途', subject: '主体', scene: '场景', action: '动作', style: '风格',
  composition: '构图', lighting: '光线', mood: '情绪', details: '细节',
  constraints: '约束', avoid: '避免'
};
const TEMPLATES = [
  ['人像摄影', '一位年轻女性站在樱花树下，春风吹动发丝，浅色针织衫，温柔治愈的氛围'],
  ['风景大片', '云海之上的雪山日出，金色阳光洒在山脊，前景有松树剪影，史诗感'],
  ['动漫风格', '少女站在夏日海边的车站，蓝天白云，电车驶过，新海诚式清新画面'],
  ['赛博朋克', '雨夜的未来都市街头，霓虹灯牌倒映在湿漉漉的路面，行人撑着透明雨伞'],
  ['奇幻魔法', '漂浮在空中的古老图书馆，书页化作光蝶飞舞，一位小法师站在旋梯上'],
  ['产品展示', '一瓶极简包装的精华液放在晨光中的大理石台面上，旁边有绿植叶片的影子'],
  ['海报设计', '一位宇航员站在荒漠中央望向巨大的落日，画面下方留出标题空间，复古科幻海报'],
  ['概念艺术', '深海中的废弃地铁站，鲸鱼从破裂的穹顶上方游过，光束穿透海水']
];

let currentStyle = 'auto';
let currentPurpose = '通用图片';
let currentSize = '1024x1024';
let candidates = [];
let activeId = null;
let generatingPrompt = false;
let generatingImage = false;
let currentImageUrl = null;

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function load(key, dflt) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : dflt; } catch { return dflt; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

/* ---------- 选项 ---------- */
function wireChips(containerId, attr, apply) {
  const box = $(containerId);
  box.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      box.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      apply(chip.dataset[attr]);
    });
  });
}

/* ---------- 候选 ---------- */
function activeCandidate() { return candidates.find(c => c.id === activeId) || candidates[0] || null; }

function renderCandidates(noteZh) {
  const tabs = $('candidateTabs');
  if (!candidates.length) { tabs.hidden = true; $('fieldsDetails').hidden = true; return; }
  tabs.hidden = false;
  tabs.innerHTML = candidates.map(c =>
    `<button type="button" class="chip${c.id === activeId ? ' active' : ''}" data-cid="${c.id}">${escapeHtml(c.label)}</button>`
  ).join('');
  tabs.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => selectCandidate(chip.dataset.cid));
  });
  $('noteZh').textContent = noteZh || '';
  renderActive();
}

function selectCandidate(id) {
  activeId = id;
  document.querySelectorAll('#candidateTabs .chip').forEach(c => c.classList.toggle('active', c.dataset.cid === id));
  renderActive();
}

function renderActive() {
  const c = activeCandidate();
  if (!c) return;
  $('promptOutput').value = c.prompt || '';
  $('negativeOutput').value = c.negative || '';
  renderFields(c);
}

function renderFields(c) {
  const fields = c.fields || {};
  const keys = Object.keys(FIELD_LABELS);
  const has = keys.some(k => fields[k]);
  $('fieldsDetails').hidden = !has;
  if (!has) return;
  $('fieldsGrid').innerHTML = keys.map(k => {
    const wide = ['details', 'constraints', 'avoid'].includes(k);
    const val = escapeHtml(fields[k] || '');
    return `<div class="${wide ? 'wide' : ''}"><label>${FIELD_LABELS[k]}` +
      (wide
        ? `<textarea rows="2" data-field="${k}">${val}</textarea>`
        : `<input type="text" data-field="${k}" value="${val}">`) +
      `</label></div>`;
  }).join('');
  $('fieldsGrid').querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('input', () => {
      const cur = activeCandidate();
      if (!cur) return;
      cur.fields[input.dataset.field] = input.value;
      cur.prompt = schemaToPrompt(cur.fields);
      if (input.dataset.field === 'avoid') cur.negative = input.value;
      $('promptOutput').value = cur.prompt;
      $('negativeOutput').value = cur.negative || '';
    });
  });
}

/* ---------- 生成提示词 ---------- */
async function generatePrompt() {
  if (generatingPrompt) return;
  const idea = $('ideaInput').value.trim();
  if (!idea) { toast('先写下你的想法'); $('ideaInput').focus(); return; }
  generatingPrompt = true;
  const btn = $('generatePromptBtn');
  const status = $('promptStatus');
  btn.disabled = true;
  btn.textContent = 'AI 生成中…';
  status.classList.remove('error');
  status.textContent = '正在请 AI 构思三个方向，通常几秒到几十秒…';
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    const resp = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, style: currentStyle, purpose: currentPurpose, size: currentSize }),
      signal: controller.signal
    });
    clearTimeout(timer);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.candidates?.length) throw new Error(data.error || `HTTP ${resp.status}`);
    candidates = data.candidates;
    activeId = candidates[0].id;
    renderCandidates(data.note_zh ? `AI 说明：${data.note_zh}` : '');
    status.textContent = `已生成（AI · ${data.modelUsed || 'agnes'}，${Math.round((Date.now() - started) / 1000)} 秒）`;
    addToHistory(idea);
    toast('已生成 3 个候选方向');
  } catch (err) {
    // 本地模板兜底：明确标注，不假装是 AI
    const local = buildPromptCandidates(idea, currentStyle, currentSize, null);
    candidates = local.map(c => ({
      id: c.id, label: c.label, prompt: c.prompt,
      negative: c.schema?.avoid || '', fields: c.schema || {}
    }));
    activeId = candidates[0]?.id;
    renderCandidates('');
    status.classList.add('error');
    status.textContent = 'AI 暂时不可用（' + (err.name === 'AbortError' ? '请求超时' : '服务异常') + '），已用本地模板生成，质量会打折，可稍后重试。';
    addToHistory(idea);
  } finally {
    generatingPrompt = false;
    btn.disabled = false;
    btn.textContent = '生成提示词';
  }
}

/* ---------- 生图 ---------- */
async function generateImage() {
  if (generatingImage) return;
  const prompt = $('promptOutput').value.trim();
  if (!prompt) { toast('请先生成或填写提示词'); return; }
  generatingImage = true;
  const btn = $('generateImageBtn');
  const status = $('imageStatus');
  const error = $('imageError');
  btn.disabled = true;
  btn.textContent = '生成中…';
  error.classList.remove('show');
  error.textContent = '';
  $('imagePreview').hidden = true;
  $('imageActions').hidden = true;
  const started = Date.now();
  const routeHint = currentSize === '1024x1024'
    ? '1:1 走 9router 快速通道，通常 15–30 秒'
    : '非方形比例走 Agnes 通道，通常 10–90 秒，波动较大';
  status.textContent = `已提交，正在生图…（${routeHint}；已等待 0 秒）`;
  const ticker = setInterval(() => {
    status.textContent = `已提交，正在生图…（${routeHint}；已等待 ${Math.round((Date.now() - started) / 1000)} 秒，不要重复点击）`;
  }, 1000);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300000);
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, negative: $('negativeOutput').value.trim(), size: currentSize }),
      signal: controller.signal
    });
    clearTimeout(timer);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.image) throw new Error((data.error || `HTTP ${resp.status}`) + (data.details ? `：${data.details}` : ''));
    currentImageUrl = data.image;
    const img = $('generatedImage');
    img.onload = () => {
      $('imageMeta').textContent =
        `通道：${data.provider || ''} · 模型：${data.modelUsed || ''} · 请求尺寸 ${data.size || currentSize} · 实际 ${img.naturalWidth}×${img.naturalHeight} · 耗时 ${Math.round((Date.now() - started) / 1000)} 秒`;
    };
    img.src = data.image;
    $('imagePreview').hidden = false;
    $('imageActions').hidden = false;
    status.textContent = '图片生成成功';
    toast('图片生成成功');
  } catch (err) {
    error.textContent = err.name === 'AbortError' ? '生图超时（超过 5 分钟），请稍后重试或简化提示词' : `生成失败：${err.message}`;
    error.classList.add('show');
    status.textContent = '';
  } finally {
    clearInterval(ticker);
    generatingImage = false;
    btn.disabled = false;
    btn.textContent = '生成图片';
  }
}

async function downloadImage() {
  if (!currentImageUrl) return;
  try {
    const resp = await fetch(currentImageUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'prompt-image.png'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('图片下载中');
  } catch {
    window.open(currentImageUrl, '_blank');
    toast('已在新标签打开，请右键另存');
  }
}

/* ---------- 历史 / 收藏（仅本机） ---------- */
function addToHistory(idea) {
  const c = activeCandidate();
  if (!c) return;
  const items = load('kw_history', []);
  items.unshift({
    id: Date.now(), idea, prompt: $('promptOutput').value, negative: $('negativeOutput').value,
    fields: c.fields || {}, style: currentStyle, size: currentSize, time: Date.now()
  });
  save('kw_history', items.slice(0, 50));
  renderList('historyList', load('kw_history', []), false);
}
function addToFavorites() {
  const prompt = $('promptOutput').value.trim();
  if (!prompt) { toast('没有可收藏的内容'); return; }
  const c = activeCandidate();
  const items = load('kw_favorites', []);
  items.unshift({
    id: Date.now(), idea: $('ideaInput').value.trim(), prompt,
    negative: $('negativeOutput').value, fields: c?.fields || {}, style: currentStyle, size: currentSize, time: Date.now()
  });
  save('kw_favorites', items.slice(0, 100));
  renderList('favoritesList', load('kw_favorites', []), true);
  toast('已收藏');
}
function renderList(elId, items, isFav) {
  const box = $(elId);
  if (!items.length) { box.innerHTML = `<div class="empty">${isFav ? '暂无收藏' : '暂无记录'}</div>`; return; }
  box.innerHTML = items.map(it => `
    <div class="item" data-id="${it.id}">
      <div class="item-text">${escapeHtml(it.prompt)}</div>
      <div class="item-meta">${escapeHtml(it.style || '')} · ${escapeHtml(it.size || '')} · ${new Date(it.time).toLocaleString('zh-CN', { hour12: false })}</div>
    </div>`).join('');
  box.querySelectorAll('.item').forEach(el => {
    el.addEventListener('click', () => {
      const it = items.find(x => String(x.id) === el.dataset.id);
      if (!it) return;
      candidates = [{ id: 'saved', label: '已保存', prompt: it.prompt, negative: it.negative || '', fields: it.fields || {} }];
      activeId = 'saved';
      if (it.idea) $('ideaInput').value = it.idea, $('charCount').textContent = it.idea.length;
      renderCandidates('');
      toast('已载入');
    });
  });
}

/* ---------- 初始化 ---------- */
export function init() {
  wireChips('styleChips', 'style', v => currentStyle = v);
  wireChips('purposeChips', 'purpose', v => currentPurpose = v);
  wireChips('sizeChips', 'size', v => currentSize = v);

  $('ideaInput').addEventListener('input', e => $('charCount').textContent = e.target.value.length);
  $('templateChips').innerHTML = TEMPLATES.map(([name, seed]) =>
    `<button type="button" class="chip" data-seed="${escapeHtml(seed)}">${name}</button>`).join('');
  $('templateChips').querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $('ideaInput').value = chip.dataset.seed;
      $('charCount').textContent = chip.dataset.seed.length;
      generatePrompt();
    });
  });

  $('generatePromptBtn').addEventListener('click', generatePrompt);
  $('generateImageBtn').addEventListener('click', generateImage);
  $('regenBtn').addEventListener('click', generateImage);
  $('downloadBtn').addEventListener('click', downloadImage);
  $('copyPromptBtn').addEventListener('click', async () => {
    if (!$('promptOutput').value.trim()) return toast('没有可复制的内容');
    await navigator.clipboard.writeText($('promptOutput').value);
    toast('英文提示词已复制');
  });
  $('copyAllBtn').addEventListener('click', async () => {
    const p = $('promptOutput').value.trim();
    if (!p) return toast('没有可复制的内容');
    const n = $('negativeOutput').value.trim();
    await navigator.clipboard.writeText(n ? `${p}\n\nNegative prompt: ${n}` : p);
    toast('已复制全部');
  });
  $('favoriteBtn').addEventListener('click', addToFavorites);
  $('clearHistoryBtn').addEventListener('click', () => { save('kw_history', []); renderList('historyList', [], false); });
  $('clearFavoritesBtn').addEventListener('click', () => { save('kw_favorites', []); renderList('favoritesList', [], true); });

  const theme = load('kw_theme', 'light');
  if (theme === 'dark') document.body.classList.add('dark');
  $('themeToggle').textContent = document.body.classList.contains('dark') ? '切换浅色' : '切换深色';
  $('themeToggle').addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    save('kw_theme', dark ? 'dark' : 'light');
    $('themeToggle').textContent = dark ? '切换浅色' : '切换深色';
  });

  renderList('historyList', load('kw_history', []), false);
  renderList('favoritesList', load('kw_favorites', []), true);
}
