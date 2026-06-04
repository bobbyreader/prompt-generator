/* ==================== 核心逻辑模块 ==================== */

import { styleEnhancers, promptTemplates, variables, enhancements } from './data.js';
import {
    toggleTheme, initTheme,
    addToHistory, incrementStats, addToFavorites,
    renderHistory, renderFavorites, updateStats,
    deleteHistory, deleteFavorite, clearHistory, clearFavorites,
    useHistory, useFavorite, historyToFavorite,
    injectDeps
} from './storage.js';

// 全局状态
let currentStyle = 'auto';
let currentImageUrl = null;
let currentPrompt = '';
let isGenerating = false;
let activeImageRequestId = 0;

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

// 注入到 storage.js，让它调用这里的 showToast/announce/updateStats
injectDeps({ showToast, announce, updateStats });

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
}

/* ==================== 提示词生成 ==================== */
function generatePrompt() {
    const keyword = document.getElementById('keywordInput').value.trim();
    const output = document.getElementById('promptOutput');
    const loading = document.getElementById('loading');

    if (!keyword) {
        showToast('请输入描述内容');
        return;
    }

    loading.classList.add('show');

    setTimeout(() => {
        let prompt = '';

        if (keyword) {
            const style = currentStyle === 'auto' ? 'photography' : currentStyle;
            const enhancers = styleEnhancers[style];
            prompt = keyword;
            prompt += ', ' + enhancers.common;

            const extraModifiers = [];
            const modCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < modCount; i++) {
                extraModifiers.push(getRandom(enhancers.modifiers));
            }
            prompt += ', ' + extraModifiers.join(', ');
            prompt += ', ' + getRandom(['8k ultra detailed', 'highly detailed', 'award winning quality', 'professional quality', 'masterpiece']);
            prompt += ', ' + getRandom(['cinematic composition', 'perfect composition', 'balanced framing', 'dramatic angle']);
        } else {
            const templates = promptTemplates[currentStyle] || promptTemplates.portrait;
            prompt = fillTemplate(getRandom(templates), currentStyle === 'auto' ? 'common' : currentStyle);
        }

        output.value = prompt;
        loading.classList.remove('show');
        showToast('提示词已生成！');

        const genStyle = currentStyle === 'auto' ? 'photography' : currentStyle;
        addToHistory(prompt, genStyle);
        incrementStats(genStyle);
    }, 600);
}

/* ==================== 优化润色 ==================== */
function enhancePrompt() {
    const output = document.getElementById('promptOutput');
    let prompt = output.value.trim();

    if (!prompt) {
        showToast('先生成或输入提示词');
        return;
    }

    const toAdd = [];
    const count = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
        const item = getRandom(enhancements);
        if (!toAdd.includes(item)) toAdd.push(item);
    }

    output.value = prompt + ', ' + toAdd.join(', ');
    showToast('已优化！');
}

/* ==================== 追加增强词 ==================== */
function addEnhancement(text) {
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
    addToFavorites(prompt, currentStyle);
    showToast('已收藏 ⭐');
    announce('提示词已收藏');
}

/* ==================== 清空 ==================== */
function clearAll() {
    document.getElementById('keywordInput').value = '';
    document.getElementById('promptOutput').value = '';
    resetImageUi();
    document.getElementById('generateImageBtn').disabled = false;
    document.getElementById('generatedImage').src = '';
    currentImageUrl = null;
    currentPrompt = '';
    isGenerating = false;
    activeImageRequestId++;
    showToast('已清空');
}

/* ==================== 模板 ==================== */
function useTemplate(type) {
    document.getElementById('keywordInput').value = '';
    const displayStyle = TEMPLATE_STYLE_MAP[type] || 'auto';
    setActiveStyle(displayStyle);

    const templates = promptTemplates[type] || promptTemplates.portrait;
    const prompt = fillTemplate(getRandom(templates), type);
    document.getElementById('promptOutput').value = prompt;
    addToHistory(prompt, displayStyle);
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
            body: JSON.stringify({ prompt }),
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

// 导出给 HTML onclick（事件委托处理历史/收藏按钮）
window.generatePrompt = generatePrompt;
window.enhancePrompt = enhancePrompt;
window.addEnhancement = addEnhancement;
window.addToPrompt = addToPrompt;
window.copyPrompt = copyPrompt;
window.saveFavorite = saveFavorite;
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
    renderHistory();
    renderFavorites();
    updateStats();
}
