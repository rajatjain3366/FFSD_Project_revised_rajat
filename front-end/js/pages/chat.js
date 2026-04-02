/**
 * Gameunity — Channel Chat Logic
 * Handles messaging, channel switching, sidebar toggles, search, and UI interactions.
 */

// ==========================================
// 1. DATA & STATE
// ==========================================
const CHANNEL_TOPICS = {
    'general': "The main hub — say hello, share updates, ask anything 👋",
    'introductions': "New here? Introduce yourself and your gaming setup!",
    'off-topic': "Non-gaming chat — memes, life, random goodness 😄",
    'frontend': "HTML, CSS, JS, React, Vue, Angular and all things UI",
    'Strategy': "Gaming strategy, builds, tier lists and meta discussion",
    'code-review': "Post your code — get honest, constructive feedback",
    'Streaming': "Streaming setups, OBS tips, Twitch and YouTube growth",
    'open-source': "Share projects, PRs, and contribution opportunities",
    'job-board': "Jobs, freelance gigs, and career opportunities",
    'portfolio-review': "Share your portfolio for peer feedback",
    'announcements': "Official announcements from the Pro Gamers team 📣",
    'rules-and-info': "Community rules and important information 📌",
    'study-together': "Voice channel — join and grind with others 🎮",
    'pair-programming': "Voice channel — find a duo queue partner 👥",
};

const EMOJI_LIST = [
    '👍','👎','❤️','🔥','🎉','😂','😮','😢','😡','🎮',
    '🚀','⭐','💯','🙏','👏','🤔','😎','🤯','💪','🎯',
    '🏆','⚡','😊','🙌','👀','🤝','💬','📌','🎲','🛡',
];

let currentOpenMenu = null;
let currentEmojiTarget = null;
let replyingTo = null;
let collapsedCategories = new Set();

// ==========================================
// 2. MEMBER SIDEBAR TOGGLE
// ==========================================
window.toggleMemberSidebar = function () {
    const sidebar = document.getElementById('memberSidebar');
    const chip = document.getElementById('memberCountChip');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    if (chip) chip.classList.toggle('active', isOpen);
};

// ==========================================
// 3. SEARCH BAR TOGGLE
// ==========================================
window.toggleSearchBar = function () {
    const bar = document.getElementById('chatSearchBar');
    const btn = document.getElementById('searchToggleBtn');
    if (!bar) return;
    const isOpen = bar.classList.toggle('open');
    if (btn) btn.classList.toggle('active', isOpen);
    if (isOpen) {
        const input = document.getElementById('chatSearchInput');
        if (input) { input.value = ''; input.focus(); }
        searchMessages('');
    } else {
        clearSearchHighlights();
        const count = document.getElementById('chatSearchCount');
        if (count) count.textContent = '';
    }
};

function clearSearchHighlights() {
    document.querySelectorAll('.msg-text.search-hidden').forEach(el => el.closest('.msg-group, .msg-cont')?.classList.remove('search-hidden-row'));
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.outerHTML = el.textContent;
    });
}

window.searchMessages = function (query) {
    const wrap = document.getElementById('messagesWrap');
    const countEl = document.getElementById('chatSearchCount');
    if (!wrap) return;

    const q = query.trim().toLowerCase();
    const rows = wrap.querySelectorAll('.msg-group, .msg-cont');
    let matchCount = 0;

    rows.forEach(row => {
        const textEl = row.querySelector('.msg-text');
        if (!textEl) return;
        const rawText = textEl.textContent;

        if (!q) {
            row.style.display = '';
            return;
        }

        const lower = rawText.toLowerCase();
        if (lower.includes(q)) {
            row.style.display = '';
            matchCount++;
            // Highlight — simple approach
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(${escaped})`, 'gi');
            textEl.innerHTML = textEl.innerHTML.replace(/<[^>]*>/g, m => m)
                || textEl.textContent.replace(re, '<mark class="search-highlight">$1</mark>');
        } else {
            row.style.display = 'none';
        }
    });

    if (countEl) {
        countEl.textContent = q ? (matchCount > 0 ? `${matchCount} result${matchCount !== 1 ? 's' : ''}` : 'No results') : '';
    }
};

// ==========================================
// 4. PINNED PANEL TOGGLE
// ==========================================
window.togglePinnedPanel = function () {
    const panel = document.getElementById('pinnedPanel');
    const btn = document.getElementById('pinnedToggleBtn');
    if (!panel) return;
    const isOpen = panel.classList.toggle('open');
    if (btn) btn.classList.toggle('active', isOpen);
};

window.addToPinned = function (text, author) {
    const list = document.getElementById('pinnedList');
    const emptyEl = document.getElementById('pinnedEmpty');
    if (!list) return;

    if (emptyEl) emptyEl.style.display = 'none';

    const item = document.createElement('div');
    item.className = 'pinned-item';
    item.innerHTML = `
        <div class="pinned-item-meta">
            <span class="pinned-item-author">${author}</span>
            <span class="pinned-item-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="pinned-item-text">${text}</div>
    `;
    list.appendChild(item);
    showToast('Message pinned!');
};

// ==========================================
// 5. CHANNEL SIDEBAR — SEARCH & COLLAPSE
// ==========================================
window.filterChannels = function (query) {
    const q = query.trim().toLowerCase();
    const categories = document.querySelectorAll('.ch-category');

    categories.forEach(cat => {
        const items = cat.querySelectorAll('.ch-row');
        let anyVisible = false;

        items.forEach(row => {
            const lbl = row.querySelector('.ch-lbl');
            const text = lbl ? lbl.textContent.toLowerCase() : '';
            const match = !q || text.includes(q);
            row.style.display = match ? '' : 'none';
            if (match) anyVisible = true;
        });

        cat.style.display = !q || anyVisible ? '' : 'none';

        // Force expand categories that have results during search
        const itemsContainer = cat.querySelector('.ch-category-items');
        if (q && anyVisible && itemsContainer) {
            itemsContainer.style.display = '';
        }
    });
};

window.toggleCategory = function (categoryKey) {
    const cat = document.querySelector(`.ch-category[data-category="${categoryKey}"]`);
    if (!cat) return;
    const items = cat.querySelector('.ch-category-items');
    const arrow = cat.querySelector('.cat-arrow');
    if (!items) return;

    const isCollapsed = collapsedCategories.has(categoryKey);
    if (isCollapsed) {
        collapsedCategories.delete(categoryKey);
        items.style.maxHeight = items.scrollHeight + 'px';
        setTimeout(() => { items.style.maxHeight = ''; items.style.display = ''; }, 200);
        if (arrow) arrow.textContent = '▾';
    } else {
        collapsedCategories.add(categoryKey);
        items.style.maxHeight = items.scrollHeight + 'px';
        requestAnimationFrame(() => { items.style.maxHeight = '0'; });
        setTimeout(() => { items.style.display = 'none'; }, 200);
        if (arrow) arrow.textContent = '▸';
    }
};

window.setChannel = function (el, name, type) {
    document.querySelectorAll('.ch-row').forEach(r => r.classList.remove('active'));
    el.classList.add('active');

    const nameDisplay = document.getElementById('activeChanName');
    const hashDisplay = document.getElementById('activeChanHash');
    const topicDisplay = document.getElementById('activeChanTopic');
    const inputField = document.getElementById('msgInput');
    const searchInput = document.getElementById('chatSearchInput');

    if (nameDisplay) nameDisplay.textContent = name;
    if (hashDisplay) hashDisplay.textContent = type;
    if (topicDisplay) topicDisplay.textContent = CHANNEL_TOPICS[name] || '';
    if (inputField) {
        const prefix = (type === '#' || type === '📣' || type === '📌') ? '#' : '';
        inputField.placeholder = `Message ${prefix}${name}…`;
        inputField.focus();
    }
    if (searchInput) {
        searchInput.placeholder = `Search messages in ${type === '#' ? '#' : ''}${name}…`;
    }

    const badge = el.querySelector('.ch-unread');
    if (badge) badge.remove();
};

// ==========================================
// 6. EMOJI PICKER
// ==========================================

/** Ensure the emoji grid is built exactly once. */
function ensureEmojiGridBuilt() {
    const grid = document.getElementById('emojiPickerGrid');
    if (!grid || grid.dataset.built) return;
    EMOJI_LIST.forEach(emoji => {
        const btn2 = document.createElement('button');
        btn2.className = 'emoji-btn';
        btn2.textContent = emoji;
        btn2.dataset.emoji = emoji;
        // onclick is set dynamically each time picker opens — see rewireEmojiGrid
        grid.appendChild(btn2);
    });
    grid.dataset.built = 'true';
}

/** Rewire all emoji buttons to call the provided callback. */
function rewireEmojiGrid(callback) {
    const grid = document.getElementById('emojiPickerGrid');
    if (!grid) return;
    grid.querySelectorAll('.emoji-btn').forEach(btn2 => {
        // Replace onclick every time so there are no stale closures
        btn2.onclick = (e) => {
            e.stopPropagation();
            callback(btn2.dataset.emoji);
        };
    });
}

function positionPicker(picker, anchorRect) {
    picker.style.top = '';
    picker.style.bottom = '';
    picker.style.left = '';

    const pickerWidth = 320; // Default width of emoji picker
    const pickerHeight = 350; // Approximated height
    
    let top = anchorRect.top - pickerHeight - 8;
    let left = anchorRect.left;

    // Flip below if not enough space above
    if (top < 8) top = anchorRect.bottom + 8;
    // Keep within right edge
    if (left + pickerWidth > window.innerWidth - 8) left = window.innerWidth - pickerWidth - 8;
    if (left < 8) left = 8;

    picker.style.top = `${top}px`;
    picker.style.left = `${left}px`;
    picker.classList.add('open');
}

/** Open emoji picker anchored to a message's 😊 act-btn. */
window.openEmojiPicker = function (btn, event) {
    if (event) event.stopPropagation();
    
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;

    if (currentOpenMenu) { currentOpenMenu.remove(); currentOpenMenu = null; }

    // Toggle: close if already open for same button
    if (currentEmojiTarget === btn && picker.classList.contains('open')) {
        picker.classList.remove('open');
        currentEmojiTarget = null;
        return;
    }

    currentEmojiTarget = btn;
    ensureEmojiGridBuilt();

    // Wire up: clicking an emoji adds a reaction to the parent message
    rewireEmojiGrid((emoji) => {
        const msgRow = currentEmojiTarget
            ? currentEmojiTarget.closest('.msg-group, .msg-cont')
            : null;
        if (msgRow) addReaction(msgRow, emoji);
        picker.classList.remove('open');
        currentEmojiTarget = null;
    });

    const rect = btn.getBoundingClientRect();
    positionPicker(picker, rect);
};

/** Open emoji picker anchored to the toolbar emoji button — inserts into textarea. */
window.openToolbarEmoji = function () {
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;

    if (currentEmojiTarget === 'toolbar' && picker.classList.contains('open')) {
        picker.classList.remove('open');
        currentEmojiTarget = null;
        return;
    }

    currentEmojiTarget = 'toolbar';
    ensureEmojiGridBuilt();

    // Wire up: clicking an emoji inserts it into the message input
    rewireEmojiGrid((emoji) => {
        insertAtCursor(emoji);
        picker.classList.remove('open');
        currentEmojiTarget = null;
    });

    const toolbarBtn = document.querySelector('.tb-btn[title="Emoji"]');
    const rect = toolbarBtn
        ? toolbarBtn.getBoundingClientRect()
        : { top: window.innerHeight - 200, bottom: window.innerHeight - 200, left: 300 };
    positionPicker(picker, rect);
};

// ==========================================
// 7. REPLY BAR
// ==========================================
window.replyToMessage = function (btn) {
    const msgGroup = btn.closest('.msg-group');
    let userName = 'User';
    if (msgGroup) {
        const nameEl = msgGroup.querySelector('.msg-uname');
        if (nameEl) userName = nameEl.textContent.trim();
    }

    replyingTo = userName;
    const replyBar = document.getElementById('replyBar');
    const replyBarName = document.getElementById('replyBarName');
    if (replyBar) replyBar.style.display = '';
    if (replyBarName) replyBarName.textContent = userName;

    const input = document.getElementById('msgInput');
    if (input) input.focus();
};

window.cancelReply = function () {
    replyingTo = null;
    const replyBar = document.getElementById('replyBar');
    if (replyBar) replyBar.style.display = 'none';
};

// ==========================================
// 8. MORE MENU (⋯)
// ==========================================
window.showMessageMenu = function (btn, event) {
    if (event) event.stopPropagation();

    if (currentOpenMenu) { currentOpenMenu.remove(); currentOpenMenu = null; }
    if (document.getElementById('emojiPicker')?.classList.contains('open')) {
        document.getElementById('emojiPicker').classList.remove('open');
    }

    const msgGroup = btn.closest('.msg-group, .msg-cont');
    let msgText = '';
    let userName = 'User';
    if (msgGroup) {
        const textEl = msgGroup.querySelector('.msg-text');
        if (textEl) msgText = textEl.textContent.trim();
        const nameEl = msgGroup.querySelector('.msg-uname');
        if (nameEl) userName = nameEl.textContent.trim();
    }

    const menu = document.createElement('div');
    menu.className = 'msg-menu show';

    const items = [
        {
            icon: '📋', label: 'Copy Text', action: () => {
                navigator.clipboard.writeText(msgText).then(() => showToast('Message copied!')).catch(() => showToast('Copy failed'));
            }
        },
        {
            icon: '📌', label: 'Pin Message', action: () => {
                addToPinned(msgText, userName);
            }
        },
        { separator: true },
        {
            icon: '🚩', label: 'Report Message', danger: true, action: () => {
                window.location.href = 'report.html';
            }
        },
    ];

    items.forEach(item => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'msg-menu-divider';
            menu.appendChild(sep);
            return;
        }

        const menuItem = document.createElement('div');
        menuItem.className = 'msg-menu-item' + (item.danger ? ' danger' : '');
        menuItem.innerHTML = `<span>${item.icon}</span> <span>${item.label}</span>`;

        menuItem.onclick = (event) => {
            event.stopPropagation();
            item.action();
            menu.remove();
            currentOpenMenu = null;
        };

        menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    const rect = btn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${Math.max(8, rect.right - 170)}px`;

    currentOpenMenu = menu;
};

// ==========================================
// 9. GLOBAL CLICK HANDLER (CLOSE MENUS)
// ==========================================
document.addEventListener('click', function (e) {
    // Close context menu if clicked outside
    if (currentOpenMenu && !currentOpenMenu.contains(e.target) && !e.target.closest('.act-btn[title="More"]')) {
        currentOpenMenu.remove();
        currentOpenMenu = null;
    }

    // Close emoji picker if clicked outside
    const picker = document.getElementById('emojiPicker');
    if (picker && picker.classList.contains('open')) {
        if (!picker.contains(e.target) && !e.target.closest('.act-btn[title="Add Reaction"]') && !e.target.closest('.tb-btn[title="Emoji"]')) {
            picker.classList.remove('open');
            currentEmojiTarget = null;
        }
    }
});

// ==========================================
// 10. REACTIONS
// ==========================================
function addReaction(msgGroup, emoji) {
    if (!msgGroup) return;

    let reactionsContainer = msgGroup.querySelector('.reactions');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'reactions';
        const msgBody = msgGroup.querySelector('.msg-body') || msgGroup;
        msgBody.appendChild(reactionsContainer);
    }

    let existingPill = Array.from(reactionsContainer.querySelectorAll('.FPS-pill'))
        .find(pill => pill.querySelector('span')?.textContent === emoji);

    if (existingPill) {
        if (existingPill.classList.contains('mine')) {
            // Already reacted — remove reaction
            const countSpan = existingPill.querySelector('.FPS-count');
            const newCount = parseInt(countSpan.textContent) - 1;
            if (newCount <= 0) { existingPill.remove(); }
            else { countSpan.textContent = newCount; existingPill.classList.remove('mine'); }
        } else {
            const countSpan = existingPill.querySelector('.FPS-count');
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
            existingPill.classList.add('mine');
        }
    } else {
        const pill = document.createElement('div');
        pill.className = 'FPS-pill mine';
        pill.onclick = function () { window.toggleFPS(this); };
        pill.innerHTML = `<span>${emoji}</span><span class="FPS-count">1</span>`;
        reactionsContainer.appendChild(pill);
    }
}

window.toggleFPS = function (pill) {
    const countEl = pill.querySelector('.FPS-count');
    let count = parseInt(countEl.textContent);
    if (pill.classList.contains('mine')) {
        // Un-react
        countEl.textContent = count - 1;
        pill.classList.remove('mine');
        if (count - 1 <= 0) pill.remove();
    } else {
        countEl.textContent = count + 1;
        pill.classList.add('mine');
    }
};

// ==========================================
// 11. TOOLBAR FORMATTING
// ==========================================
window.formatText = function (type) {
    const ta = document.getElementById('msgInput');
    if (!ta) return;
    ta.focus();

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    let replacement = '';

    switch (type) {
        case 'bold':   replacement = `**${selected || 'bold text'}**`; break;
        case 'italic': replacement = `_${selected || 'italic text'}_`; break;
        case 'code':   replacement = `\`${selected || 'code'}\``; break;
        case 'link':
            const url = prompt('Enter URL:');
            if (!url) return;
            replacement = `[${selected || 'link text'}](${url})`;
            break;
        case 'ol':
            const olLines = (selected || 'Item').split('\n');
            replacement = olLines.map((l, i) => `${i + 1}. ${l}`).join('\n');
            break;
        case 'ul':
            const ulLines = (selected || 'Item').split('\n');
            replacement = ulLines.map(l => `• ${l}`).join('\n');
            break;
        default: return;
    }

    ta.setRangeText(replacement, start, end, 'end');
    ta.dispatchEvent(new Event('input'));
};

window.triggerFileAttach = function () {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
};

window.handleFileAttach = function (input) {
    const file = input.files[0];
    if (!file) return;
    showToast(`📎 Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    input.value = '';
};

function insertAtCursor(text) {
    const ta = document.getElementById('msgInput');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.setRangeText(text, start, end, 'end');
    ta.dispatchEvent(new Event('input'));
    ta.focus();
}

// ==========================================
// 12. UTILITIES
// ==========================================
function copyCode(btn) {
    const pre = btn.closest('.code-block')?.querySelector('pre');
    if (!pre) return;
    navigator.clipboard.writeText(pre.textContent.trim())
        .then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1500); })
        .catch(() => { btn.textContent = 'Error'; setTimeout(() => btn.textContent = 'Copy', 1500); });
}
window.copyCode = copyCode;

const parseMarkdown = (text) => {
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');
    escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');
    escaped = escaped.replace(/@([a-zA-Z0-9\s]+)/g, '<span class="mention">@$1</span>');
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent)">$1</a>');
    // Bullet list
    escaped = escaped.replace(/^•\s(.+)/gm, '<li>$1</li>');
    // Numbered list
    escaped = escaped.replace(/^\d+\.\s(.+)/gm, '<li>$1</li>');

    return escaped;
};

const scrollToBottom = () => {
    const wrap = document.getElementById('messagesWrap');
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
};

function showToast(message) {
    const existing = document.getElementById('nexus-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'nexus-toast';
    toast.textContent = message;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: 'var(--accent)',
        color: '#fff',
        padding: '10px 22px',
        borderRadius: '30px',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: '99999',
        boxShadow: '0 8px 24px rgba(91, 110, 245, 0.4)',
        opacity: '0',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fontFamily: '"DM Sans", sans-serif',
        letterSpacing: '0.2px',
        pointerEvents: 'none',
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
window.showToast = showToast;

// ==========================================
// 13. MESSAGING LOGIC
// ==========================================
window.autoResize = function (ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
};

window.handleKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.sendMessage();
    }
};

window.sendMessage = function () {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (!text) return;

    const wrap = document.getElementById('messagesWrap');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let replyBadge = '';
    if (replyingTo) {
        replyBadge = `<div class="msg-reply-indicator">↩ Replying to <strong>${replyingTo}</strong></div>`;
        cancelReply();
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'msg-group';
    msgEl.style.animation = 'fadeUp 0.25s ease forwards';
    msgEl.innerHTML = `
        <div class="msg-av grad-violet">AM</div>
        <div class="msg-body">
            ${replyBadge}
            <div class="msg-header">
                <span class="msg-uname" style="color:var(--accent-light,#818cf8)">Alex Morgan</span>
                <span class="msg-role" style="background:rgba(91,110,245,0.1);color:var(--accent);font-size:9px;padding:1px 6px;border-radius:10px;">You</span>
                <span class="msg-time">${time}</span>
            </div>
            <div class="msg-text self-msg">${parseMarkdown(text)}</div>
        </div>
        <div class="msg-actions">
            <div class="act-btn" title="Add Reaction" onclick="openEmojiPicker(this, event)">😊</div>
            <div class="act-btn" title="Reply" onclick="replyToMessage(this)">↩</div>
            <div class="act-btn" title="More" onclick="showMessageMenu(this, event)">⋯</div>
        </div>
    `;

    wrap.appendChild(msgEl);

    input.value = '';
    input.style.height = 'auto';
    scrollToBottom();

    simulateResponse();
};

function simulateResponse() {
    setTimeout(() => {
        const wrap = document.getElementById('messagesWrap');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const replyEl = document.createElement('div');
        replyEl.className = 'msg-group';
        replyEl.style.animation = 'fadeUp 0.25s ease forwards';
        replyEl.innerHTML = `
            <div class="msg-av grad-pink">MP</div>
            <div class="msg-body">
                <div class="msg-header">
                    <span class="msg-uname" style="color:#F472B6">Mia Park</span>
                    <span class="msg-time">${time}</span>
                </div>
                <div class="msg-text">Got it! We'll be using the <strong>Nexus Design System</strong> to keep things consistent. Can't wait for tomorrow! 🚀</div>
                <div class="reactions">
                    <div class="FPS-pill" onclick="toggleFPS(this)"><span>🔥</span><span class="FPS-count">1</span></div>
                </div>
            </div>
            <div class="msg-actions">
                <div class="act-btn" title="Add Reaction" onclick="openEmojiPicker(this, event)">😊</div>
                <div class="act-btn" title="Reply" onclick="replyToMessage(this)">↩</div>
                <div class="act-btn" title="More" onclick="showMessageMenu(this, event)">⋯</div>
            </div>
        `;

        wrap.appendChild(replyEl);
        scrollToBottom();
    }, 1500);
}

// ==========================================
// 14. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Restore selected channel from session (from community page)
    const selectedChannel = sessionStorage.getItem('selectedChannel');
    const fromCommunityPage = sessionStorage.getItem('fromCommunityPage');

    if (selectedChannel && fromCommunityPage === 'true') {
        const channelName = selectedChannel.replace('#', '');
        document.querySelectorAll('.ch-row').forEach(row => {
            const channelLabel = row.querySelector('.ch-lbl');
            if (channelLabel && channelLabel.textContent === channelName) {
                const icon = row.querySelector('.ch-type');
                const iconText = icon ? icon.textContent : '#';
                setChannel(row, channelName, iconText);
                sessionStorage.removeItem('selectedChannel');
                sessionStorage.removeItem('fromCommunityPage');
            }
        });
    }

    scrollToBottom();

    // Category items smooth transition setup
    document.querySelectorAll('.ch-category-items').forEach(items => {
        items.style.transition = 'max-height 0.2s ease, opacity 0.2s ease';
        items.style.overflow = 'hidden';
    });

    // Core animation for new messages
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Emoji picker close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const picker = document.getElementById('emojiPicker');
            if (picker) picker.classList.remove('open');
            if (currentOpenMenu) { currentOpenMenu.remove(); currentOpenMenu = null; }

            const searchBar = document.getElementById('chatSearchBar');
            if (searchBar && searchBar.classList.contains('open')) {
                toggleSearchBar();
            }

            const pinnedPanel = document.getElementById('pinnedPanel');
            if (pinnedPanel && pinnedPanel.classList.contains('open')) {
                togglePinnedPanel();
            }
        }
    });
});