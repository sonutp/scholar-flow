/**
 * OmniStudy Creator Hub Side Panel (YouTube & Instagram Feeds)
 * Follow educational creators and convert tutorials into study notes with one click.
 * All notification alerts and popups disabled per user preference.
 */

import { createNoteFromCreatorPost } from './notes.js';

let creators = [];
let currentFilter = 'all';

export function initCreatorsModule(showToastFn) {
  loadCreators();

  const drawer = document.getElementById('creator-drawer');
  const toggleBtn = document.getElementById('creator-drawer-toggle');
  const closeBtn = document.getElementById('creator-drawer-close');
  const addCreatorForm = document.getElementById('add-creator-form');
  const filterBtns = document.querySelectorAll('.creator-filter-btn');

  toggleBtn?.addEventListener('click', () => {
    drawer?.classList.toggle('open');
  });

  closeBtn?.addEventListener('click', () => {
    drawer?.classList.remove('open');
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.platform || 'all';
      renderCreatorsFeed(showToastFn);
    });
  });

  addCreatorForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-creator-name');
    const handleInput = document.getElementById('new-creator-handle');
    const platformSelect = document.getElementById('new-creator-platform');
    const categoryInput = document.getElementById('new-creator-category');

    if (!nameInput.value.trim() || !handleInput.value.trim()) return;

    const newCreator = {
      id: `c_${Date.now()}`,
      name: nameInput.value.trim(),
      platform: platformSelect.value,
      handle: handleInput.value.trim(),
      avatar: platformSelect.value === 'YouTube' ? '📺' : '📸',
      category: categoryInput.value.trim() || 'Education',
      last_post_title: 'Latest lecture / tutorial uploaded',
      last_post_time: 'Recently',
      last_post_url: platformSelect.value === 'YouTube' ? `https://youtube.com/${handleInput.value}` : `https://instagram.com/${handleInput.value.replace('@','')}`,
      unread: false
    };

    creators.unshift(newCreator);
    saveCreators();
    renderCreatorsFeed(showToastFn);

    // Close modal & reset
    document.getElementById('add-creator-modal')?.classList.remove('open');
    nameInput.value = '';
    handleInput.value = '';
    if (showToastFn) showToastFn(`✓ Added ${newCreator.name} to followed creators.`);
  });

  renderCreatorsFeed(showToastFn);
}

function loadCreators() {
  const saved = localStorage.getItem('omnistudy_creators');
  if (saved) {
    creators = JSON.parse(saved);
    // Ensure all unread alerts/badges are cleared
    creators.forEach(c => { c.unread = false; });
  } else {
    creators = [
      {
        id: 'c1',
        name: '3Blue1Brown',
        platform: 'YouTube',
        handle: '@3blue1brown',
        avatar: '🧮',
        category: 'Mathematics & Neural Nets',
        last_post_title: 'Why neural networks actually generalize (Geometric intuition)',
        last_post_time: '15m ago',
        last_post_url: 'https://youtube.com/@3blue1brown',
        unread: false
      },
      {
        id: 'c2',
        name: 'Huberman Lab',
        platform: 'Instagram',
        handle: '@hubermanlab',
        avatar: '🧠',
        category: 'Neuroscience & Study Focus',
        last_post_title: 'Optimal learning protocol: 90min Ultradian cycles + active recall gap effects',
        last_post_time: '42m ago',
        last_post_url: 'https://instagram.com/hubermanlab',
        unread: false
      },
      {
        id: 'c3',
        name: 'CS50 Harvard',
        platform: 'YouTube',
        handle: '@cs50',
        avatar: '💻',
        category: 'Computer Science',
        last_post_title: 'CS50 2026: Low-level memory management and pointers demystified',
        last_post_time: '2h ago',
        last_post_url: 'https://youtube.com/@cs50',
        unread: false
      },
      {
        id: 'c4',
        name: 'Ali Abdaal',
        platform: 'YouTube',
        handle: '@aliabdaal',
        avatar: '⚡',
        category: 'Evidence-Based Study',
        last_post_title: 'How to revise without burnout: The retrospective timetable technique',
        last_post_time: '4h ago',
        last_post_url: 'https://youtube.com/@aliabdaal',
        unread: false
      }
    ];
  }
  saveCreators();
}

function saveCreators() {
  localStorage.setItem('omnistudy_creators', JSON.stringify(creators));
}

export function renderCreatorsFeed(showToastFn) {
  const container = document.getElementById('creators-feed-container');
  if (!container) return;

  const filtered = creators.filter(c => {
    if (currentFilter === 'all') return true;
    return c.platform.toLowerCase() === currentFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 24px;">No creators followed in this category.</div>';
    return;
  }

  container.innerHTML = filtered.map(c => `
    <div class="creator-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="font-size: 1.6rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-input); border-radius: 50%;">
            ${c.avatar}
          </span>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">${escapeHtml(c.name)}</div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">${escapeHtml(c.handle)}</div>
          </div>
        </div>
        <span class="platform-badge platform-${c.platform.toLowerCase()}">
          ${c.platform === 'YouTube' ? '▶ YouTube' : '📷 Instagram'}
        </span>
      </div>

      <div style="font-size: 0.85rem; line-height: 1.4; font-weight: 500; margin-top: 4px;">
        ${escapeHtml(c.last_post_title)}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.75rem; color: var(--text-muted);">
        <span>🕒 ${c.last_post_time}</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn-secondary save-post-to-note-btn" data-creator="${escapeHtml(c.name)}" data-title="${escapeHtml(c.last_post_title)}" data-url="${escapeHtml(c.last_post_url)}" style="padding: 4px 8px; font-size: 0.75rem;">
            📝 Save to Notes
          </button>
          <a href="${escapeHtml(c.last_post_url)}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem; text-decoration: none;">
            Watch ↗
          </a>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.save-post-to-note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const creator = btn.dataset.creator;
      const title = btn.dataset.title;
      const url = btn.dataset.url;
      createNoteFromCreatorPost(creator, title, url);

      // Switch to notes tab
      document.querySelector('[data-view="view-notes"]')?.click();
      document.getElementById('creator-drawer')?.classList.remove('open');
      if (showToastFn) showToastFn(`✓ Converted post from ${creator} into a study note!`);
    });
  });
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}
