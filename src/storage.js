/* ==================== LocalStorage 存储模块 ==================== */

export const STORAGE_KEYS = {
    HISTORY: 'prompt_history',
    FAVORITES: 'prompt_favorites',
    STATS: 'prompt_stats',
    THEME: 'prompt_theme'
};

const MAX_HISTORY = 50;

// 运行时注入，不形成循环依赖
let _showToast = () => {};
let _announce = () => {};
let _updateStatsFn = () => {};

export function injectDeps({ showToast, announce, updateStats }) {
    _showToast = showToast || _showToast;
    _announce = announce || _announce;
    _updateStatsFn = updateStats || _updateStatsFn;
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
export function addToHistory(prompt, style) {
    const history = load(STORAGE_KEYS.HISTORY, []);
    history.unshift({ text: prompt, style, time: Date.now(), id: Date.now() });
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
    container.innerHTML = history.map(item => `
        <div class="history-item">
            <div>
                <div class="history-item-text">${escapeHtml(item.text)}</div>
                <div class="history-item-meta">${item.style} · ${formatTime(item.time)}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn use-btn" data-id="${item.id}" data-action="use">使用</button>
                <button class="item-btn fav-btn" data-id="${item.id}" data-action="fav">⭐</button>
                <button class="item-btn del-btn" data-id="${item.id}" data-action="del">×</button>
            </div>
        </div>
    `).join('');
}

export function useHistory(id) {
    const history = load(STORAGE_KEYS.HISTORY, []);
    const item = history.find(h => h.id == id);
    if (item) {
        document.getElementById('promptOutput').value = item.text;
        const chip = document.querySelector(`.style-chip[data-style="${item.style}"]`);
        if (chip) chip.click();
        _showToast('已加载历史提示词');
        _announce('已从历史记录加载提示词');
    }
}

export function historyToFavorite(id) {
    const history = load(STORAGE_KEYS.HISTORY, []);
    const item = history.find(h => h.id == id);
    if (item) {
        addToFavorites(item.text, item.style);
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
export function addToFavorites(text, style) {
    const favorites = load(STORAGE_KEYS.FAVORITES, []);
    if (favorites.some(f => f.text === text)) return;
    favorites.unshift({ text, style, time: Date.now(), id: Date.now() });
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
    container.innerHTML = favorites.map(item => `
        <div class="favorite-item">
            <div class="favorite-item-text">${escapeHtml(item.text)}</div>
            <div class="item-actions">
                <button class="item-btn use-btn" data-id="${item.id}" data-action="useFav">使用</button>
                <button class="item-btn del-btn" data-id="${item.id}" data-action="delFav">×</button>
            </div>
        </div>
    `).join('');
}

export function useFavorite(id) {
    const favorites = load(STORAGE_KEYS.FAVORITES, []);
    const item = favorites.find(f => f.id == id);
    if (item) {
        document.getElementById('promptOutput').value = item.text;
        const chip = document.querySelector(`.style-chip[data-style="${item.style}"]`);
        if (chip) chip.click();
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

