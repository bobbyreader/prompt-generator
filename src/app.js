/* ==================== 核心逻辑模块 ==================== */

import {
    styleEnhancers,
    promptTemplates,
    variables,
    enhancements,
    atmosphereDescriptions,
    DEFAULT_IMAGE_SIZE
} from './data.js';
import {
    addPromptFeedback,
    clearPromptFeedback,
    deletePreferenceSnapshot,
    exportPreferenceBundle,
    getPreferenceSnapshot,
    getPreferenceSnapshots,
    getPromptFeedback,
    getPromptPreferences,
    importPreferenceBundle,
    savePreferenceSnapshot,
    savePromptPreferences,
    toggleTheme, initTheme,
    addToHistory, incrementStats, addToFavorites,
    renderHistory, renderFavorites, updateStats, formatTime,
    deleteHistory, deleteFavorite, clearHistory, clearFavorites,
    useHistory, useFavorite, historyToFavorite,
    injectDeps
} from './storage.js';
import {
    applyExplicitPreference,
    buildPreferenceProfile,
    buildCandidatesFromSchema,
    buildLocalPromptPackage,
    buildPromptCandidates,
    deriveSceneKey,
    applyPolishToSchema,
    applyImageSizeRecommendationToSchema,
    IMAGE_SIZE_RECOMMENDATIONS,
    normalizeSchema,
    resolvePreferenceProfile,
    schemaToPrompt,
    schemaToSummary
} from './prompt-builder.js';

// 全局状态
let currentStyle = 'auto';
let currentImageUrl = null;
let currentPrompt = '';
let isGenerating = false;
let activeImageRequestId = 0;
let currentImageSize = DEFAULT_IMAGE_SIZE;
let currentPromptSchema = null;
let currentPromptCandidates = [];
let activeCandidateId = null;
let currentPreferenceProfile = null;
let currentSceneKey = 'general';
let currentExplicitPreferences = null;

const TEMPLATE_STYLE_MAP = {
    portrait: 'photography',
    landscape: 'photography',
    anime: 'anime',
    cyberpunk: 'concept',
    fantasy: 'illustration',
    product: 'photography',
    poster: 'concept',
    concept: 'concept'
};

/* ==================== 依赖注入（解决循环依赖） ==================== */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function announce(message) {
    const el = document.getElementById('ariaAnnounce');
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = message; });
}

function applyStoredPromptItem(item) {
    document.getElementById('promptOutput').value = item.text || '';
    if (item.schema) {
        renderPromptSchema(item.schema);
    } else {
        hidePromptSchema();
    }
}

// 注入到 storage.js，让它调用这里的 showToast/announce/updateStats
injectDeps({ showToast, announce, updateStats, applyStoredPromptItem });

/* ==================== 工具函数 ==================== */
function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template, category) {
    return template
        .replace('{subject}', getRandom(variables.subject[category] || variables.subject.common))
        .replace('{lighting}', getRandom(variables.lighting))
        .replace('{background}', getRandom(variables.background))
        .replace('{camera}', getRandom(variables.camera))
        .replace('{lens}', getRandom(variables.lens))
        .replace('{mood}', getRandom(variables.mood))
        .replace('{clothing}', getRandom(variables.clothing))
        .replace('{pose}', getRandom(variables.pose))
        .replace('{expression}', getRandom(variables.expression))
        .replace('{setting}', getRandom(variables.setting))
        .replace('{time}', getRandom(variables.time))
        .replace('{atmosphere}', getRandom(variables.atmosphere))
        .replace('{details}', getRandom(variables.details))
        .replace('{action}', getRandom(variables.action))
        .replace('{layout}', getRandom(variables.layout))
        .replace('{typography}', getRandom(variables.typography))
        .replace('{colors}', getRandom(variables.colors))
        .replace('{style}', getRandom(variables.style));
}

function setActiveStyle(style) {
    currentStyle = style;
    document.querySelectorAll('.style-chip').forEach(chip => {
        const isActive = chip.dataset.style === style;
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-checked', isActive ? 'true' : 'false');
        chip.tabIndex = isActive ? 0 : -1;
    });
}

function setActiveImageSize(size) {
    currentImageSize = size;
    document.querySelectorAll('input[name="imageSize"]').forEach(input => {
        const isActive = input.value === size;
        input.checked = isActive;
        input.closest('.image-size-card')?.classList.toggle('selected', isActive);
    });
    updateImageSizeRecommendationUi();
}

function getCurrentImageSettings() {
    return {
        size: currentImageSize
    };
}

function getGenerationStyle() {
    return currentStyle === 'auto' ? 'photography' : currentStyle;
}

function getSchemaFieldElements() {
    return Array.from(document.querySelectorAll('[data-schema-field]'));
}

function getSchemaPanel() {
    return document.getElementById('promptSchemaPanel');
}

function getSchemaSummary() {
    return document.getElementById('schemaSummary');
}

function getCandidatePanel() {
    return document.getElementById('candidatePanel');
}

function getCandidateList() {
    return document.getElementById('candidateList');
}

function getCandidateExplanationElements() {
    return {
        badge: document.getElementById('candidateExplainBadge'),
        text: document.getElementById('candidateExplainText')
    };
}

function getImageSizeRecommendationElements() {
    return {
        label: document.getElementById('imageRecommendationLabel'),
        detail: document.getElementById('imageRecommendationDetail')
    };
}

function updateImageSizeRecommendationUi() {
    const recommendation = IMAGE_SIZE_RECOMMENDATIONS[currentImageSize] || IMAGE_SIZE_RECOMMENDATIONS['1024x1024'];
    const { label, detail } = getImageSizeRecommendationElements();
    if (label) {
        label.textContent = `推荐构图：${recommendation.platform}`;
    }
    if (detail) {
        detail.textContent = recommendation.composition;
    }
}

function refreshPreferenceProfile() {
    const storedPreferences = currentExplicitPreferences || getPromptPreferences();
    const explicitPreference = storedPreferences[currentSceneKey] || storedPreferences.general || '';
    currentPreferenceProfile = applyExplicitPreference(
        resolvePreferenceProfile(getPromptFeedback(), currentSceneKey),
        explicitPreference
    );
}

function getPreferenceSelectMap() {
    return {
        general: document.getElementById('pref-general'),
        product: document.getElementById('pref-product'),
        cover: document.getElementById('pref-cover'),
        poster: document.getElementById('pref-poster'),
        pet: document.getElementById('pref-pet'),
        portrait: document.getElementById('pref-portrait')
    };
}

function formatSnapshotTime(timestamp) {
    if (!timestamp) {
        return '刚刚保存';
    }
    return `更新于 ${formatTime(timestamp)}`;
}

function summarizePreferences(preferences = {}) {
    const labels = {
        general: '全局',
        product: '产品图',
        cover: '封面图',
        poster: '海报图',
        pet: '宠物图',
        portrait: '人像图'
    };
    const valueLabels = {
        balanced: '平衡版',
        bold: '冲击版',
        clean: '克制版'
    };
    const activeEntries = Object.entries(labels)
        .filter(([key]) => preferences[key])
        .map(([key, label]) => `${label}默认${valueLabels[preferences[key]]}`);

    return activeEntries.length
        ? activeEntries.join('，')
        : '全部交给自动学习，没有写死任何默认方向。';
}

function rerenderCandidatesForPreferences() {
    if (!currentPromptSchema || !currentPromptCandidates.length) {
        return;
    }

    const candidates = buildCandidatesFromSchema(
        currentPromptSchema,
        currentStyle,
        currentImageSize,
        currentPreferenceProfile
    );
    renderCandidates(candidates);
}

function renderPreferencePanel() {
    currentExplicitPreferences = getPromptPreferences();
    const selectMap = getPreferenceSelectMap();
    Object.entries(selectMap).forEach(([key, element]) => {
        if (element) {
            element.value = currentExplicitPreferences[key] || '';
        }
    });
    renderPreferenceSnapshots();
}

function collectPreferencePanelValues() {
    const selectMap = getPreferenceSelectMap();
    const result = {};
    Object.entries(selectMap).forEach(([key, element]) => {
        result[key] = element?.value || '';
    });
    return result;
}

function savePreferencePanel() {
    currentExplicitPreferences = collectPreferencePanelValues();
    savePromptPreferences(currentExplicitPreferences);
    refreshPreferenceProfile();
    rerenderCandidatesForPreferences();
    showToast('偏好设置已保存');
    announce('显式偏好设置已保存');
}

function resetPreferencePanel() {
    currentExplicitPreferences = {
        general: '',
        product: '',
        cover: '',
        poster: '',
        pet: '',
        portrait: ''
    };
    savePromptPreferences(currentExplicitPreferences);
    renderPreferencePanel();
    refreshPreferenceProfile();
    rerenderCandidatesForPreferences();
    showToast('已恢复为自动学习');
    announce('偏好设置已重置');
}

function renderPreferenceSnapshots() {
    const container = document.getElementById('preferenceSnapshotList');
    if (!container) {
        return;
    }

    const snapshots = getPreferenceSnapshots();
    if (!snapshots.length) {
        container.innerHTML = '<div class="empty-state">还没有保存的人格快照</div>';
        return;
    }

    container.innerHTML = snapshots.map(snapshot => `
        <div class="snapshot-card">
            <div class="snapshot-card-head">
                <div class="snapshot-card-title">${snapshot.name}</div>
                <div class="snapshot-card-time">${formatSnapshotTime(snapshot.updatedAt)}</div>
            </div>
            <div class="snapshot-card-summary">${summarizePreferences(snapshot.preferences)}</div>
            <div class="snapshot-card-actions">
                <button class="action-btn enhance-btn" data-snapshot-action="apply" data-snapshot-id="${snapshot.id}" type="button">
                    <span>⚡</span><span>一键切换</span>
                </button>
                <button class="action-btn clear-btn" data-snapshot-action="delete" data-snapshot-id="${snapshot.id}" type="button">
                    <span>🗑️</span><span>删除</span>
                </button>
            </div>
        </div>
    `).join('');
}

function savePreferenceSnapshotFromPanel() {
    const input = document.getElementById('preferenceSnapshotName');
    const snapshotName = input?.value.trim() || '';
    if (!snapshotName) {
        showToast('先给这个风格人格起个名字');
        return;
    }

    const snapshot = savePreferenceSnapshot(snapshotName, collectPreferencePanelValues());
    renderPreferenceSnapshots();
    if (input) {
        input.value = '';
    }
    showToast(`已保存人格：${snapshot.name}`);
    announce('风格人格已保存');
}

function applyPreferenceSnapshotById(snapshotId) {
    const snapshot = getPreferenceSnapshot(snapshotId);
    if (!snapshot) {
        showToast('这个人格快照不存在了');
        return;
    }

    currentExplicitPreferences = {
        ...snapshot.preferences
    };
    savePromptPreferences(currentExplicitPreferences);
    renderPreferencePanel();
    refreshPreferenceProfile();
    rerenderCandidatesForPreferences();
    showToast(`已切换到人格：${snapshot.name}`);
    announce('已切换风格人格');
}

function deletePreferenceSnapshotById(snapshotId) {
    const snapshot = getPreferenceSnapshot(snapshotId);
    deletePreferenceSnapshot(snapshotId);
    renderPreferenceSnapshots();
    showToast(snapshot ? `已删除人格：${snapshot.name}` : '已删除人格快照');
    announce('风格人格已删除');
}

async function exportPreferenceBundleToClipboard() {
    const bundle = exportPreferenceBundle();
    const formatted = JSON.stringify(bundle, null, 2);
    const input = document.getElementById('preferenceBundleInput');
    if (input) {
        input.value = formatted;
    }
    await navigator.clipboard.writeText(formatted);
    showToast('偏好数据已导出到剪贴板');
    announce('偏好数据已导出');
}

function importPreferenceBundleFromInput() {
    const input = document.getElementById('preferenceBundleInput');
    const raw = input?.value.trim();
    if (!raw) {
        showToast('先粘贴偏好数据 JSON');
        return;
    }

    try {
        importPreferenceBundle(JSON.parse(raw));
        renderPreferencePanel();
        refreshPreferenceProfile();
        rerenderCandidatesForPreferences();
        showToast('偏好数据已导入');
        announce('偏好数据已导入');
    } catch (error) {
        showToast(`导入失败：${error.message}`);
    }
}

function clearLearningData() {
    clearPromptFeedback();
    refreshPreferenceProfile();
    rerenderCandidatesForPreferences();
    showToast('学习数据已清空');
    announce('学习数据已清空');
}

function updatePromptOutputFromSchema() {
    if (!currentPromptSchema) {
        return;
    }

    const normalized = normalizeSchema(currentPromptSchema, currentStyle);
    currentPromptSchema = normalized;
    const prompt = schemaToPrompt(normalized);
    document.getElementById('promptOutput').value = prompt;
    currentPrompt = prompt;

    const summaryEl = getSchemaSummary();
    if (summaryEl) {
        summaryEl.textContent = schemaToSummary(normalized);
    }
}

function renderPromptSchema(schema, options = {}) {
    currentPromptSchema = normalizeSchema(schema, currentStyle);
    const panel = getSchemaPanel();
    if (!panel) {
        return;
    }

    panel.hidden = false;
    getSchemaFieldElements().forEach(field => {
        const key = field.dataset.schemaField;
        field.value = currentPromptSchema[key] || '';
    });

    updatePromptOutputFromSchema();
    updateImageSizeRecommendationUi();

    if (options.announceMessage) {
        announce(options.announceMessage);
    }
}

function setActiveCandidate(candidateId, options = {}) {
    const candidate = currentPromptCandidates.find(item => item.id === candidateId);
    if (!candidate) {
        return;
    }

    activeCandidateId = candidateId;
    renderPromptSchema(candidate.schema, options);

    const list = getCandidateList();
    if (list) {
        list.querySelectorAll('.candidate-card').forEach(card => {
            card.classList.toggle('active', card.dataset.candidateId === candidateId);
        });
    }
}

function renderCandidates(candidates) {
    currentPromptCandidates = candidates;
    const panel = getCandidatePanel();
    const list = getCandidateList();
    if (!panel || !list) {
        return;
    }

    panel.hidden = !candidates.length;
    const explain = getCandidateExplanationElements();
    const explanationText = currentPreferenceProfile?.explanation || '当前没有足够偏好数据，按默认候选策略排序。';
    if (explain.badge) {
        const sourceLabels = {
            explicit: '显式偏好',
            scene: '场景学习',
            global: '全局学习'
        };
        explain.badge.textContent = sourceLabels[currentPreferenceProfile?.source] || '默认策略';
    }
    if (explain.text) {
        explain.textContent = explanationText;
        explain.text.innerHTML = explanationText;
    }
    list.innerHTML = candidates.map(candidate => `
        <button type="button" class="candidate-card${candidate.id === activeCandidateId ? ' active' : ''}" data-candidate-id="${candidate.id}">
            <div class="candidate-card-head">
                <span class="candidate-card-title">${candidate.label}</span>
                <span class="candidate-card-summary">${candidate.preferred ? '更贴近你的偏好' : candidate.summary}</span>
            </div>
            <div class="candidate-card-rationale">${candidate.rationale}</div>
            <div class="candidate-card-note">${candidate.explanation}</div>
        </button>
    `).join('');

    list.querySelectorAll('.candidate-card').forEach(card => {
        card.addEventListener('click', () => {
            setActiveCandidate(card.dataset.candidateId, {
                announceMessage: '已切换候选方向'
            });
        });
    });

    if (candidates.length && !candidates.some(candidate => candidate.id === activeCandidateId)) {
        activeCandidateId = candidates[0].id;
    }

    if (activeCandidateId) {
        setActiveCandidate(activeCandidateId);
    }
}

function collectSchemaFromInputs() {
    const nextSchema = {};
    getSchemaFieldElements().forEach(field => {
        nextSchema[field.dataset.schemaField] = field.value.trim();
    });
    currentPromptSchema = normalizeSchema(nextSchema, currentStyle);
    return currentPromptSchema;
}

function hidePromptSchema() {
    currentPromptSchema = null;
    const panel = getSchemaPanel();
    if (panel) {
        panel.hidden = true;
    }
}

function clearCandidates() {
    currentPromptCandidates = [];
    activeCandidateId = null;
    const panel = getCandidatePanel();
    const list = getCandidateList();
    if (panel) {
        panel.hidden = true;
    }
    if (list) {
        list.innerHTML = '';
    }
    const feedbackInput = document.getElementById('candidateFeedbackInput');
    if (feedbackInput) {
        feedbackInput.value = '';
    }
}

function buildStoredPromptPayload(prompt, style, imageSettings = DEFAULT_IMAGE_SIZE) {
    return {
        text: prompt,
        style,
        imageSettings: typeof imageSettings === 'string' ? { size: imageSettings } : imageSettings,
        schema: currentPromptSchema ? normalizeSchema(currentPromptSchema, currentStyle) : null
    };
}

function resetImageUi() {
    document.getElementById('imagePreview').classList.remove('show');
    document.getElementById('imageActions').classList.remove('show');
    document.getElementById('imageError').classList.remove('show');
    document.getElementById('imageError').textContent = '';
}

function finishImageRequest() {
    document.getElementById('imageLoading').classList.remove('show');
    document.getElementById('generateImageBtn').disabled = false;
    isGenerating = false;
}

async function parseGenerateResponse(response) {
    const rawText = await response.text();

    if (!rawText) {
        return {
            ok: response.ok,
            data: {}
        };
    }

    try {
        return {
            ok: response.ok,
            data: JSON.parse(rawText)
        };
    } catch {
        return {
            ok: response.ok,
            data: {
                error: response.ok ? '服务返回了无法解析的内容' : '服务返回了非 JSON 错误响应',
                details: rawText.slice(0, 300)
            }
        };
    }
}

/* ==================== 粒子背景 ==================== */
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

/* ==================== 事件绑定 ==================== */
function bindEvents() {
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // 风格选择
    document.querySelectorAll('.style-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            setActiveStyle(chip.dataset.style);
        });

        chip.addEventListener('keydown', e => {
            const chips = Array.from(document.querySelectorAll('.style-chip'));
            const index = chips.indexOf(chip);

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setActiveStyle(chip.dataset.style);
                return;
            }

            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
                return;
            }

            e.preventDefault();
            const direction = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
            const nextChip = chips[(index + direction + chips.length) % chips.length];
            setActiveStyle(nextChip.dataset.style);
            nextChip.focus();
        });
    });

    document.querySelectorAll('input[name="imageSize"]').forEach(input => {
        input.addEventListener('change', () => {
            if (input.checked) {
                setActiveImageSize(input.value);
                if (currentPromptSchema) {
                    const { schema } = applyImageSizeRecommendationToSchema(currentPromptSchema, input.value);
                    currentPromptSchema = schema;
                    renderPromptSchema(currentPromptSchema, {
                        announceMessage: '已按当前比例补充构图建议'
                    });
                }
            }
        });
    });

    getSchemaFieldElements().forEach(field => {
        field.addEventListener('input', () => {
            collectSchemaFromInputs();
            updatePromptOutputFromSchema();
        });
    });

    // 回车生成
    document.getElementById('keywordInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') generatePrompt();
    });

    // 键盘快捷键
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveFavorite();
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            clearAll();
        }
    });

    // 模板回车支持
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter') card.click();
        });
    });

    // 历史/收藏事件委托（避免内联 onclick）
    document.addEventListener('click', e => {
        const btn = e.target.closest('.item-btn');
        if (!btn) return;
        const id = parseInt(btn.dataset.id, 10);
        const action = btn.dataset.action;
        switch (action) {
            case 'use': useHistory(id); break;
            case 'fav': historyToFavorite(id); break;
            case 'del': deleteHistory(id); break;
            case 'useFav': useFavorite(id); break;
            case 'delFav': deleteFavorite(id); break;
        }
    });

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-snapshot-action]');
        if (!btn) return;
        const snapshotId = btn.dataset.snapshotId;
        if (btn.dataset.snapshotAction === 'apply') {
            applyPreferenceSnapshotById(snapshotId);
            return;
        }
        if (btn.dataset.snapshotAction === 'delete') {
            deletePreferenceSnapshotById(snapshotId);
        }
    });
}

/* ==================== 提示词生成（增强版）==================== */
function generatePrompt() {
    const keyword = document.getElementById('keywordInput').value.trim();
    const loading = document.getElementById('loading');

    if (!keyword) {
        showToast('请输入描述内容');
        return;
    }

    loading.classList.add('show');

    setTimeout(() => {
        currentSceneKey = deriveSceneKey({ purpose: keyword, subject: keyword });
        refreshPreferenceProfile();
        const candidates = buildPromptCandidates(keyword, currentStyle, currentImageSize, currentPreferenceProfile);
        renderCandidates(candidates);
        loading.classList.remove('show');
        showToast('已生成 3 个候选方向');

        const genStyle = getGenerationStyle();
        const activeCandidate = candidates.find(item => item.id === activeCandidateId) || candidates[0];
        addToHistory(buildStoredPromptPayload(activeCandidate.prompt, genStyle, getCurrentImageSettings()));
        incrementStats(genStyle);
    }, 600);
}

/* ==================== 优化润色 ==================== */
function enhancePrompt() {
    if (!currentPromptSchema && !document.getElementById('promptOutput').value.trim()) {
        showToast('先生成或输入提示词');
        return;
    }

    if (!currentPromptSchema) {
        currentPromptSchema = buildLocalPromptPackage(
            document.getElementById('promptOutput').value.trim(),
            currentStyle,
            currentImageSize
        ).schema;
    }

    currentPromptSchema = applyPolishToSchema(currentPromptSchema, currentStyle);
    renderPromptSchema(currentPromptSchema, {
        announceMessage: '提示词已按结构化方式优化'
    });
    showToast('已做结构化优化');
}

/* ==================== 追加增强词 ==================== */
function addEnhancement(text) {
    if (currentPromptSchema) {
        const existing = currentPromptSchema.details ? `${currentPromptSchema.details}, ` : '';
        currentPromptSchema.details = `${existing}${text}`;
        renderPromptSchema(currentPromptSchema);
        return;
    }

    const output = document.getElementById('promptOutput');
    if (output.value.trim()) {
        output.value += ', ' + text;
    } else {
        output.value = text;
    }
}

/* ==================== 快速添加元素 ==================== */
function addToPrompt(text) {
    navigator.clipboard.writeText(text);
    showToast('已复制：' + text);
}

/* ==================== 复制提示词 ==================== */
function copyPrompt() {
    const output = document.getElementById('promptOutput');
    if (!output.value.trim()) {
        showToast('没有可复制的内容');
        return;
    }

    navigator.clipboard.writeText(output.value).then(() => {
        showToast('已复制到剪贴板！');
        const btn = document.querySelector('.copy-btn');
        btn.classList.add('copied');
        btn.innerHTML = '<span>✓</span><span>已复制</span>';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<span>📋</span><span>复制提示词</span>';
        }, 2000);
    });
}

/* ==================== 收藏 ==================== */
function saveFavorite() {
    const prompt = document.getElementById('promptOutput').value.trim();
    if (!prompt) {
        showToast('没有可收藏的内容');
        return;
    }
    if (!currentPromptSchema && !getSchemaPanel()?.hidden) {
        collectSchemaFromInputs();
    }
    addToFavorites(buildStoredPromptPayload(prompt, currentStyle, getCurrentImageSettings()));
    showToast('已收藏 ⭐');
    announce('提示词已收藏');
}

function saveCandidateFeedback() {
    const activeCandidate = currentPromptCandidates.find(item => item.id === activeCandidateId);
    if (!activeCandidate) {
        showToast('先生成并选择一个候选');
        return;
    }

    const feedbackText = document.getElementById('candidateFeedbackInput')?.value.trim() || '';
    currentSceneKey = deriveSceneKey(activeCandidate.schema);
    addPromptFeedback({
        candidateId: activeCandidate.id,
        candidateLabel: activeCandidate.label,
        prompt: activeCandidate.prompt,
        schema: activeCandidate.schema,
        sceneKey: currentSceneKey,
        imageSize: currentImageSize,
        style: getGenerationStyle(),
        note: feedbackText
    });
    refreshPreferenceProfile();
    showToast(feedbackText ? '偏好反馈已保存' : '已记录你的候选选择');
    announce('候选偏好已保存');
}

/* ==================== 清空 ==================== */
function clearAll() {
    document.getElementById('keywordInput').value = '';
    document.getElementById('promptOutput').value = '';
    const summaryEl = getSchemaSummary();
    if (summaryEl) {
        summaryEl.textContent = '';
    }
    hidePromptSchema();
    clearCandidates();
    resetImageUi();
    document.getElementById('generateImageBtn').disabled = false;
    document.getElementById('generatedImage').src = '';
    currentImageUrl = null;
    currentPrompt = '';
    isGenerating = false;
    activeImageRequestId++;
    setActiveImageSize(DEFAULT_IMAGE_SIZE);
    showToast('已清空');
}

/* ==================== 模板 ==================== */
function useTemplate(type) {
    document.getElementById('keywordInput').value = '';
    const displayStyle = TEMPLATE_STYLE_MAP[type] || 'auto';
    setActiveStyle(displayStyle);

    const templates = promptTemplates[type] || promptTemplates.portrait;
    const seededIdea = fillTemplate(getRandom(templates), type);
    currentSceneKey = deriveSceneKey({ purpose: seededIdea, subject: seededIdea });
    refreshPreferenceProfile();
    const candidates = buildPromptCandidates(seededIdea, displayStyle, currentImageSize, currentPreferenceProfile);
    renderCandidates(candidates);
    const activeCandidate = candidates.find(item => item.id === activeCandidateId) || candidates[0];
    addToHistory(buildStoredPromptPayload(activeCandidate.prompt, displayStyle, getCurrentImageSettings()));
    incrementStats(displayStyle);
    showToast('已应用模板：' + type);
}

/* ==================== 图片生成 ==================== */
async function generateImage() {
    if (isGenerating) return;

    const prompt = document.getElementById('promptOutput').value.trim();
    if (!prompt) {
        showToast('请先生成或输入提示词');
        return;
    }

    if (prompt.length > 4000) {
        showToast('提示词过长，请控制在 4000 字符以内');
        return;
    }

    const generateBtn = document.getElementById('generateImageBtn');
    const loading = document.getElementById('imageLoading');
    const preview = document.getElementById('imagePreview');
    const error = document.getElementById('imageError');
    const actions = document.getElementById('imageActions');
    const requestId = ++activeImageRequestId;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    resetImageUi();
    currentImageUrl = null;
    document.getElementById('generatedImage').src = '';
    loading.classList.add('show');
    generateBtn.disabled = true;
    isGenerating = true;
    currentPrompt = prompt;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                size: currentImageSize
            }),
            signal: controller.signal
        });

        const { ok, data } = await parseGenerateResponse(response);
        if (requestId !== activeImageRequestId) {
            return;
        }

        finishImageRequest();

        if (!ok || data.error) {
            const details = data.details ? `：${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : '';
            error.textContent = `生成失败：${data.error || '请求未成功'}${details}`;
            error.classList.add('show');
            return;
        }

        if (data.image) {
            currentImageUrl = data.image;
            document.getElementById('generatedImage').src = data.image;
            preview.classList.add('show');
            actions.classList.add('show');
            showToast('图片生成成功！');
        } else {
            error.textContent = '未返回图片数据，请稍后重试';
            error.classList.add('show');
        }
    } catch (err) {
        if (requestId !== activeImageRequestId) {
            return;
        }

        finishImageRequest();
        error.textContent = err.name === 'AbortError'
            ? '生成超时：请稍后重试或简化提示词'
            : '网络错误：' + err.message;
        error.classList.add('show');
    } finally {
        clearTimeout(timeoutId);
    }
}

/* ==================== 下载图片 ==================== */
function downloadImage() {
    if (!currentImageUrl) {
        showToast('没有可下载的图片');
        return;
    }

    if (currentImageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = currentImageUrl;
        link.download = 'generated-image.png';
        link.click();
        showToast('图片下载中...');
        return;
    }

    fetch(currentImageUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'generated-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('图片下载成功！');
        })
        .catch(() => {
            window.open(currentImageUrl, '_blank');
            showToast('请右键图片另存为');
        });
}

/* ==================== AI 智能共创引导 ==================== */
let wizardStep = 'what';
let wizardContext = [];
let wizardUserInput = '';

function startAIWizard() {
    const keyword = document.getElementById('keywordInput').value.trim();
    if (!keyword) {
        showToast('请先输入你的想法');
        return;
    }

    wizardUserInput = keyword;
    wizardStep = 'what';
    wizardContext = [];

    document.getElementById('aiWizardPanel').style.display = 'block';
    document.getElementById('wizardLoading').style.display = 'none';
    document.getElementById('wizardContent').style.display = 'block';
    document.getElementById('wizardStep').textContent = '第一步：明确主题';
    document.getElementById('wizardInput').value = '';
    document.getElementById('wizardInput').focus();

    // 调用 AI 获取第一个问题
    callWizardAPI(wizardStep, wizardUserInput, '');
}

async function callWizardAPI(step, userInput, context) {
    const wizardContent = document.getElementById('wizardContent');
    const wizardLoading = document.getElementById('wizardLoading');
    const wizardQuestion = document.getElementById('wizardQuestion');

    wizardContent.style.display = 'none';
    wizardLoading.style.display = 'flex';

    try {
        const response = await fetch('/api/enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step, userInput, context })
        });

        const data = await response.json();

        wizardLoading.style.display = 'none';
        wizardContent.style.display = 'block';

        if (!response.ok || data.error) {
            wizardQuestion.textContent = '服务出错：' + (data.error || data.details || '请稍后重试');
            return;
        }

        if (data.success && data.type === 'question') {
            wizardQuestion.textContent = data.content;
            document.getElementById('wizardInput').focus();
        } else if (data.success && data.type === 'structured') {
            closeAIWizard();
            currentSceneKey = deriveSceneKey(data.schema || {});
            refreshPreferenceProfile();
            const candidates = buildCandidatesFromSchema(data.schema || {}, currentStyle, currentImageSize, currentPreferenceProfile);
            renderCandidates(candidates);
            const summaryEl = getSchemaSummary();
            if (summaryEl && data.summary) {
                summaryEl.textContent = `${data.summary} | 已扩展为 3 个候选方向`;
            }
            showToast('AI 已生成 3 个候选方向');
            const generationStyle = getGenerationStyle();
            const activeCandidate = candidates.find(item => item.id === activeCandidateId) || candidates[0];
            addToHistory(buildStoredPromptPayload(activeCandidate.prompt, generationStyle, getCurrentImageSettings()));
            incrementStats(generationStyle);
        } else if (data.success && data.type === 'prompt') {
            // 最终提示词生成完成
            closeAIWizard();
            document.getElementById('promptOutput').value = data.content;
            currentPrompt = data.content;
            showToast('AI 提示词生成完成！');
            const generationStyle = getGenerationStyle();
            addToHistory(buildStoredPromptPayload(data.content, generationStyle, getCurrentImageSettings()));
            incrementStats(generationStyle);
        } else {
            wizardQuestion.textContent = 'AI 思考中，请稍后...';
        }
    } catch (err) {
        wizardLoading.style.display = 'none';
        wizardContent.style.display = 'block';
        wizardQuestion.textContent = '网络错误，请重试或点击"跳过"直接生成';
        console.error('Wizard API error:', err);
    }
}

function submitWizardAnswer() {
    const answer = document.getElementById('wizardInput').value.trim();
    if (answer) {
        wizardContext.push(answer);
    }

    // 根据当前步骤更新 UI 并调用下一个问题
    if (wizardStep === 'what') {
        wizardStep = 'why';
        document.getElementById('wizardStep').textContent = '第二步：理解动机';
        callWizardAPI(wizardStep, wizardUserInput, wizardContext.join(' | '));
    } else if (wizardStep === 'why') {
        wizardStep = 'how';
        document.getElementById('wizardStep').textContent = '第三步：确定呈现';
        callWizardAPI(wizardStep, wizardUserInput, wizardContext.join(' | '));
    } else if (wizardStep === 'how') {
        // 最后一步：生成增强提示词
        wizardStep = 'enhance';
        document.getElementById('wizardStep').textContent = '正在生成...';
        callWizardAPI(wizardStep, wizardUserInput, wizardContext.join(' | '));
    }
}

function skipWizard() {
    // 跳过引导，直接用 enhance 模式生成
    wizardStep = 'enhance';
    document.getElementById('wizardStep').textContent = '正在生成...';
    callWizardAPI(wizardStep, wizardUserInput, '');
}

function closeAIWizard() {
    document.getElementById('aiWizardPanel').style.display = 'none';
    wizardStep = 'what';
    wizardContext = [];
    wizardUserInput = '';
}

// 导出给 HTML onclick
window.startAIWizard = startAIWizard;
window.submitWizardAnswer = submitWizardAnswer;
window.skipWizard = skipWizard;
window.closeAIWizard = closeAIWizard;

// 导出给 HTML onclick（事件委托处理历史/收藏按钮）
window.generatePrompt = generatePrompt;
window.enhancePrompt = enhancePrompt;
window.addEnhancement = addEnhancement;
window.addToPrompt = addToPrompt;
window.copyPrompt = copyPrompt;
window.saveFavorite = saveFavorite;
window.saveCandidateFeedback = saveCandidateFeedback;
window.savePreferencePanel = savePreferencePanel;
window.resetPreferencePanel = resetPreferencePanel;
window.savePreferenceSnapshotFromPanel = savePreferenceSnapshotFromPanel;
window.exportPreferenceBundleToClipboard = exportPreferenceBundleToClipboard;
window.importPreferenceBundleFromInput = importPreferenceBundleFromInput;
window.clearLearningData = clearLearningData;
window.clearAll = clearAll;
window.useTemplate = useTemplate;
window.generateImage = generateImage;
window.downloadImage = downloadImage;
window.clearHistory = clearHistory;
window.clearFavorites = clearFavorites;
// 历史/收藏通过事件委托，无需 window 导出

/* ==================== 初始化 ==================== */
export function init() {
    createParticles();
    initTheme();
    bindEvents();
    renderPreferencePanel();
    refreshPreferenceProfile();
    setActiveImageSize(DEFAULT_IMAGE_SIZE);
    renderHistory();
    renderFavorites();
    updateStats();
}
