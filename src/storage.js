/* ==================== LocalStorage 存储模块 ==================== */

export const STORAGE_KEYS = {
    HISTORY: 'prompt_history',
    FAVORITES: 'prompt_favorites',
    FEEDBACK: 'prompt_feedback',
    PREFERENCES: 'prompt_preferences',
    SNAPSHOTS: 'prompt_preference_snapshots',
    STATS: 'prompt_stats',
    THEME: 'prompt_theme'
};

const MAX_HISTORY = 50;
const DEFAULT_IMAGE_SETTINGS = {
    size: '1024x1024'
};

// 运行时注入，不形成循环依赖
let _showToast = () => {};
let _announce = () => {};
let _updateStatsFn = () => {};
let _applyStoredPromptItem = null;

export function injectDeps({ showToast, announce, updateStats, applyStoredPromptItem }) {
    _showToast = showToast || _showToast;
    _announce = announce || _announce;
    _updateStatsFn = updateStats || _updateStatsFn;
    _applyStoredPromptItem = applyStoredPromptItem || _applyStoredPromptItem;
}

function load(key, defaultVal) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultVal;
    } catch {
        return defaultVal;
    }
}

function save(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch {}
}

function normalizeImageSettings(settings) {
    return {
        ...DEFAULT_IMAGE_SETTINGS,
        ...(settings && typeof settings === 'object' ? settings : {})
    };
}

function normalizePromptItem(item) {
    return {
        ...(item || {}),
        imageSettings: normalizeImageSettings(item?.imageSettings),
        schema: item?.schema && typeof item.schema === 'object' ? item.schema : null
    };
}

function formatImageSettingsMeta(item) {
    const size = item?.imageSettings?.size;
    return size ? ` · ${size}` : '';
}

/* ==================== 主题 ==================== */
export function initTheme() {
    const saved = load(STORAGE_KEYS.THEME, 'dark');
    if (saved === 'light') {
        document.body.classList.add('light');
    }
    updateThemeUI();
}

export function toggleTheme() {
    document.body.classList.toggle('light');
    save(STORAGE_KEYS.THEME, document.body.classList.contains('light') ? 'light' : 'dark');
    updateThemeUI();
}

export function updateThemeUI() {
    const isLight = document.body.classList.contains('light');
    document.getElementById('themeIcon').textContent = isLight ? '☀️' : '🌙';
    document.getElementById('themeText').textContent = isLight ? '浅色' : '深色';
}

/* ==================== 历史记录 ==================== */
export function addToHistory(promptOrItem, style, imageSettings = DEFAULT_IMAGE_SETTINGS) {
    const history = load(STORAGE_KEYS.HISTORY, []);
    const baseItem = typeof promptOrItem === 'object' && promptOrItem !== null
        ? promptOrItem
        : { text: promptOrItem, style, imageSettings };
    history.unshift(normalizePromptItem({
        ...baseItem,
        time: Date.now(),
        id: Date.now()
    }));
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    save(STORAGE_KEYS.HISTORY, history);
    renderHistory();
    _updateStatsFn();
}

export function renderHistory() {
    const history = load(STORAGE_KEYS.HISTORY, []);
    const container = document.getElementById('historyList');
    if (!history.length) {
        container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
        return;
    }
    container.innerHTML = history.map(rawItem => {
        const item = normalizePromptItem(rawItem);
        return `
        <div class="history-item">
            <div>
                <div class="history-item-text">${escapeHtml(item.text)}</div>
                <div class="history-item-meta">${item.style}${formatImageSettingsMeta(item)}${item.schema ? ' · 已保存结构化字段' : ''} · ${formatTime(item.time)}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn use-btn" data-id="${item.id}" data-action="use">使用</button>
                <button class="item-btn fav-btn" data-id="${item.id}" data-action="fav">⭐</button>
                <button class="item-btn del-btn" data-id="${item.id}" data-action="del">×</button>
            </div>
        </div>
    `;
    }).join('');
}

export function useHistory(id) {
    const history = load(STORAGE_KEYS.HISTORY, []);
    const item = normalizePromptItem(history.find(h => h.id == id));
    if (item) {
        if (_applyStoredPromptItem) {
            _applyStoredPromptItem(item);
        } else {
            document.getElementById('promptOutput').value = item.text;
        }
        const chip = document.querySelector(`.style-chip[data-style="${item.style}"]`);
        if (chip) chip.click();
        const sizeInput = document.querySelector(`input[name="imageSize"][value="${item.imageSettings.size}"]`);
        if (sizeInput) sizeInput.click();
        _showToast('已加载历史提示词');
        _announce('已从历史记录加载提示词');
    }
}

export function historyToFavorite(id) {
    const history = load(STORAGE_KEYS.HISTORY, []);
    const item = normalizePromptItem(history.find(h => h.id == id));
    if (item) {
        addToFavorites(item);
        _showToast('已收藏');
    }
}

export function deleteHistory(id) {
    let history = load(STORAGE_KEYS.HISTORY, []);
    history = history.filter(h => h.id != id);
    save(STORAGE_KEYS.HISTORY, history);
    renderHistory();
    _updateStatsFn();
}

export function clearHistory() {
    save(STORAGE_KEYS.HISTORY, []);
    renderHistory();
    _updateStatsFn();
    _showToast('历史已清空');
}

/* ==================== 收藏夹 ==================== */
export function addToFavorites(itemOrText, style, imageSettings = DEFAULT_IMAGE_SETTINGS) {
    const favorites = load(STORAGE_KEYS.FAVORITES, []);
    const baseItem = typeof itemOrText === 'object' && itemOrText !== null
        ? itemOrText
        : { text: itemOrText, style, imageSettings };
    if (favorites.some(f => f.text === baseItem.text)) return;
    favorites.unshift(normalizePromptItem({
        ...baseItem,
        time: Date.now(),
        id: Date.now()
    }));
    save(STORAGE_KEYS.FAVORITES, favorites);
    renderFavorites();
}

export function renderFavorites() {
    const favorites = load(STORAGE_KEYS.FAVORITES, []);
    const container = document.getElementById('favoritesList');
    if (!favorites.length) {
        container.innerHTML = '<div class="empty-state">暂无收藏</div>';
        return;
    }
    container.innerHTML = favorites.map(rawItem => {
        const item = normalizePromptItem(rawItem);
        return `
        <div class="favorite-item">
            <div class="favorite-item-text">${escapeHtml(item.text)}</div>
            <div class="history-item-meta">${item.style}${formatImageSettingsMeta(item)}${item.schema ? ' · 已保存结构化字段' : ''}</div>
            <div class="item-actions">
                <button class="item-btn use-btn" data-id="${item.id}" data-action="useFav">使用</button>
                <button class="item-btn del-btn" data-id="${item.id}" data-action="delFav">×</button>
            </div>
        </div>
    `;
    }).join('');
}

export function useFavorite(id) {
    const favorites = load(STORAGE_KEYS.FAVORITES, []);
    const item = normalizePromptItem(favorites.find(f => f.id == id));
    if (item) {
        if (_applyStoredPromptItem) {
            _applyStoredPromptItem(item);
        } else {
            document.getElementById('promptOutput').value = item.text;
        }
        const chip = document.querySelector(`.style-chip[data-style="${item.style}"]`);
        if (chip) chip.click();
        const sizeInput = document.querySelector(`input[name="imageSize"][value="${item.imageSettings.size}"]`);
        if (sizeInput) sizeInput.click();
        _showToast('已加载收藏');
        _announce('已从收藏加载提示词');
    }
}

export function deleteFavorite(id) {
    let favorites = load(STORAGE_KEYS.FAVORITES, []);
    favorites = favorites.filter(f => f.id != id);
    save(STORAGE_KEYS.FAVORITES, favorites);
    renderFavorites();
}

export function clearFavorites() {
    save(STORAGE_KEYS.FAVORITES, []);
    renderFavorites();
    _showToast('收藏已清空');
}

/* ==================== 偏好反馈 ==================== */
export function addPromptFeedback(feedback) {
    const items = load(STORAGE_KEYS.FEEDBACK, []);
    items.unshift({
        ...feedback,
        id: Date.now(),
        time: Date.now()
    });
    if (items.length > MAX_HISTORY) {
        items.length = MAX_HISTORY;
    }
    save(STORAGE_KEYS.FEEDBACK, items);
}

export function getPromptFeedback() {
    return load(STORAGE_KEYS.FEEDBACK, []);
}

const DEFAULT_PREFERENCES = {
    general: '',
    product: '',
    cover: '',
    poster: '',
    pet: '',
    portrait: ''
};

export function getPromptPreferences() {
    return {
        ...DEFAULT_PREFERENCES,
        ...load(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES)
    };
}

export function savePromptPreferences(preferences) {
    save(STORAGE_KEYS.PREFERENCES, {
        ...DEFAULT_PREFERENCES,
        ...(preferences && typeof preferences === 'object' ? preferences : {})
    });
}

export function clearPromptFeedback() {
    save(STORAGE_KEYS.FEEDBACK, []);
}

export function getPreferenceSnapshots() {
    const snapshots = load(STORAGE_KEYS.SNAPSHOTS, []);
    return Array.isArray(snapshots)
        ? snapshots
            .filter(item => item && typeof item === 'object' && typeof item.name === 'string')
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        : [];
}

export function savePreferenceSnapshot(name, preferences = getPromptPreferences()) {
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName) {
        throw new Error('Snapshot name is required');
    }

    const snapshots = getPreferenceSnapshots();
    const existing = snapshots.find(item => item.name === normalizedName);
    const now = Date.now();
    const payload = {
        id: existing?.id || now,
        name: normalizedName,
        preferences: {
            ...DEFAULT_PREFERENCES,
            ...(preferences && typeof preferences === 'object' ? preferences : {})
        },
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };

    const nextSnapshots = existing
        ? snapshots.map(item => (item.name === normalizedName ? payload : item))
        : [payload, ...snapshots];

    save(STORAGE_KEYS.SNAPSHOTS, nextSnapshots);
    return payload;
}

export function deletePreferenceSnapshot(snapshotId) {
    const snapshots = getPreferenceSnapshots().filter(item => String(item.id) !== String(snapshotId));
    save(STORAGE_KEYS.SNAPSHOTS, snapshots);
}

export function getPreferenceSnapshot(snapshotId) {
    return getPreferenceSnapshots().find(item => String(item.id) === String(snapshotId)) || null;
}

export function exportPreferenceBundle() {
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        preferences: getPromptPreferences(),
        feedback: getPromptFeedback(),
        snapshots: getPreferenceSnapshots()
    };
}

export function importPreferenceBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') {
        throw new Error('Invalid preference bundle');
    }

    savePromptPreferences(bundle.preferences || {});

    const feedback = Array.isArray(bundle.feedback) ? bundle.feedback : [];
    save(STORAGE_KEYS.FEEDBACK, feedback);

    const snapshots = Array.isArray(bundle.snapshots) ? bundle.snapshots : [];
    save(STORAGE_KEYS.SNAPSHOTS, snapshots);
}

/* ==================== 使用统计 ==================== */
export function updateStats() {
    const stats = load(STORAGE_KEYS.STATS, { total: 0, today: 0, todayDate: '', byStyle: {} });
    const today = new Date().toDateString();
    if (stats.todayDate !== today) {
        stats.today = 0;
        stats.todayDate = today;
    }
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statToday').textContent = stats.today;

    const totalStyle = Object.values(stats.byStyle).reduce((a, b) => a + b, 0) || 1;
    ['photography', 'illustration', 'anime', 'concept', '3d'].forEach(style => {
        const count = stats.byStyle[style] || 0;
        const pct = Math.round((count / totalStyle) * 100);
        const el = document.getElementById('chart-' + style);
        const cnt = document.getElementById('count-' + style);
        if (el) el.style.width = pct + '%';
        if (cnt) cnt.textContent = count;
    });
    save(STORAGE_KEYS.STATS, stats);
}

export function incrementStats(style) {
    const stats = load(STORAGE_KEYS.STATS, { total: 0, today: 0, todayDate: '', byStyle: {} });
    const today = new Date().toDateString();
    if (stats.todayDate !== today) {
        stats.today = 0;
        stats.todayDate = today;
    }
    stats.total++;
    stats.today++;
    if (!stats.byStyle[style]) stats.byStyle[style] = 0;
    stats.byStyle[style]++;
    save(STORAGE_KEYS.STATS, stats);
}

/* ==================== 工具函数 ==================== */
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return new Date(ts).toLocaleDateString('zh-CN');
}
