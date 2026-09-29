/**
 * OmniStudy Settings & Visual Customization Module
 * Controls themes, accent color palettes, typography engines, font scaling,
 * background canvas patterns, and scholar account profile personalization.
 */

import { playNotificationChime } from './calendar.js';

// Pre-defined Obsidian & Notion Accent Palettes
export const ACCENT_PALETTES = [
  { name: 'Obsidian Violet', hex: '#7c3aed', hover: '#6d28d9', light: 'rgba(124, 58, 237, 0.14)', glow: 'rgba(124, 58, 237, 0.25)' },
  { name: 'Cyber Cyan', hex: '#06b6d4', hover: '#0891b2', light: 'rgba(6, 182, 212, 0.14)', glow: 'rgba(6, 182, 212, 0.25)' },
  { name: 'Emerald Mint', hex: '#10b981', hover: '#059669', light: 'rgba(16, 185, 129, 0.14)', glow: 'rgba(16, 185, 129, 0.25)' },
  { name: 'Amber Gold', hex: '#f59e0b', hover: '#d97706', light: 'rgba(245, 158, 11, 0.14)', glow: 'rgba(245, 158, 11, 0.25)' },
  { name: 'Rose Crimson', hex: '#f43f5e', hover: '#e11d48', light: 'rgba(244, 63, 94, 0.14)', glow: 'rgba(244, 63, 94, 0.25)' },
  { name: 'Electric Blue', hex: '#3b82f6', hover: '#2563eb', light: 'rgba(59, 130, 246, 0.14)', glow: 'rgba(59, 130, 246, 0.25)' }
];

export function initSettingsModule(showToastFn) {
  // Load and apply saved visual preferences
  applySavedVisuals();

  // Color Swatches
  renderColorSwatches(showToastFn);

  // Theme mode buttons
  const darkThemeBtn = document.getElementById('setting-theme-dark');
  const lightThemeBtn = document.getElementById('setting-theme-light');
  
  darkThemeBtn?.addEventListener('click', () => {
    setThemeMode('dark');
    if (showToastFn) showToastFn('🌙 Dark Mode (Obsidian Graphite) applied');
  });

  lightThemeBtn?.addEventListener('click', () => {
    setThemeMode('light');
    if (showToastFn) showToastFn('☀️ Light Mode (Notion Warm Ivory) applied');
  });

  // Typography selector
  const fontSelect = document.getElementById('setting-font-family');
  fontSelect?.addEventListener('change', () => {
    setFontFamily(fontSelect.value);
    if (showToastFn) showToastFn(`✓ Font updated to ${fontSelect.options[fontSelect.selectedIndex].text}`);
  });

  // Font size selector
  const sizeSelect = document.getElementById('setting-font-size');
  sizeSelect?.addEventListener('change', () => {
    setFontScale(sizeSelect.value);
  });

  // Background Grid Canvas Toggle
  const gridToggle = document.getElementById('setting-canvas-grid');
  gridToggle?.addEventListener('change', () => {
    toggleCanvasGrid(gridToggle.checked);
    if (showToastFn) showToastFn(gridToggle.checked ? '✓ Subtle dot grid canvas enabled' : '✓ Plain canvas enabled');
  });

  // Profile Form
  const profileForm = document.getElementById('scholar-profile-form');
  profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('profile-name-input');
    const roleInput = document.getElementById('profile-role-input');
    const avatarInput = document.getElementById('profile-avatar-input');

    const profileData = {
      name: nameInput.value.trim() || 'Scholar Account',
      role: roleInput.value.trim() || 'Active • Local Sync',
      avatar: avatarInput.value.trim() || 'ST'
    };

    saveProfile(profileData);
    if (showToastFn) showToastFn('✓ Scholar Account profile updated successfully!');
  });

  // Test Chime button
  document.getElementById('setting-test-chime-btn')?.addEventListener('click', () => {
    playNotificationChime();
    if (showToastFn) showToastFn('🔔 Melodic Web Audio Chime played!');
  });

  // Backup & Export JSON
  document.getElementById('setting-export-backup-btn')?.addEventListener('click', () => {
    exportFullWorkspaceBackup();
    if (showToastFn) showToastFn('💾 Workspace backup exported!');
  });

  // Import JSON
  const importFile = document.getElementById('setting-import-file');
  importFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importWorkspaceBackup(file, showToastFn);
    }
  });

  // Reset to Defaults
  document.getElementById('setting-reset-defaults-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset visual settings and workspace defaults? (Your written notes will be preserved)')) {
      resetVisualDefaults();
      if (showToastFn) showToastFn('✓ Visual settings reset to default.');
    }
  });

  // Profile card click listener
  document.getElementById('sidebar-profile-card')?.addEventListener('click', () => {
    const settingsTab = document.querySelector('[data-view="view-settings"]');
    if (settingsTab) settingsTab.click();
  });
}

function renderColorSwatches(showToastFn) {
  const container = document.getElementById('accent-color-swatches');
  if (!container) return;

  const currentAccent = localStorage.getItem('omnistudy_accent_color') || '#7c3aed';

  container.innerHTML = ACCENT_PALETTES.map(p => `
    <button class="color-swatch-btn ${p.hex.toLowerCase() === currentAccent.toLowerCase() ? 'active' : ''}" 
            data-hex="${p.hex}" 
            title="${p.name}" 
            style="background: ${p.hex};">
      ${p.hex.toLowerCase() === currentAccent.toLowerCase() ? '✓' : ''}
    </button>
  `).join('');

  container.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.dataset.hex;
      applyAccentColor(hex);
      renderColorSwatches(showToastFn);
      if (showToastFn) showToastFn(`🎨 Accent color changed!`);
    });
  });
}

export function applyAccentColor(hex) {
  const palette = ACCENT_PALETTES.find(p => p.hex.toLowerCase() === hex.toLowerCase()) || {
    hex,
    hover: hex,
    light: hex + '20',
    glow: hex + '35'
  };

  document.documentElement.style.setProperty('--primary', palette.hex);
  document.documentElement.style.setProperty('--primary-hover', palette.hover);
  document.documentElement.style.setProperty('--primary-light', palette.light);
  document.documentElement.style.setProperty('--primary-glow', palette.glow);
  document.documentElement.style.setProperty('--border-focus', palette.hex);

  localStorage.setItem('omnistudy_accent_color', palette.hex);
}

function setThemeMode(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('omnistudy_theme', mode);
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) themeToggleBtn.innerHTML = mode === 'dark' ? '☀️' : '🌙';

  // Update theme button state in settings
  document.getElementById('setting-theme-dark')?.classList.toggle('active', mode === 'dark');
  document.getElementById('setting-theme-light')?.classList.toggle('active', mode === 'light');
}

function setFontFamily(type) {
  let fontVal = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, Helvetica, Arial, sans-serif';
  if (type === 'mono') {
    fontVal = 'ui-monospace, "SF Mono", "Cascadia Code", "JetBrains Mono", Menlo, Consolas, monospace';
  } else if (type === 'serif') {
    fontVal = 'Georgia, Cambria, "Times New Roman", Times, serif';
  }

  document.documentElement.style.setProperty('--font-sans', fontVal);
  localStorage.setItem('omnistudy_font_type', type);
}

function setFontScale(scale) {
  let basePx = '14px';
  if (scale === 'compact') basePx = '13px';
  if (scale === 'relaxed') basePx = '15.5px';

  document.body.style.fontSize = basePx;
  localStorage.setItem('omnistudy_font_scale', scale);
}

function toggleCanvasGrid(enabled) {
  if (enabled) {
    document.body.classList.add('canvas-grid-pattern');
  } else {
    document.body.classList.remove('canvas-grid-pattern');
  }
  localStorage.setItem('omnistudy_canvas_grid', enabled ? '1' : '0');
}

function saveProfile(profile) {
  localStorage.setItem('omnistudy_scholar_profile', JSON.stringify(profile));

  // Update UI everywhere
  const sidebarName = document.getElementById('sidebar-profile-name');
  const sidebarRole = document.getElementById('sidebar-profile-role');
  const sidebarAvatar = document.getElementById('sidebar-avatar-badge');

  if (sidebarName) sidebarName.textContent = profile.name;
  if (sidebarRole) sidebarRole.textContent = profile.role;
  if (sidebarAvatar) sidebarAvatar.textContent = profile.avatar;
}

function applySavedVisuals() {
  // 1. Accent Color
  const savedAccent = localStorage.getItem('omnistudy_accent_color');
  if (savedAccent) applyAccentColor(savedAccent);

  // 2. Font Type
  const savedFont = localStorage.getItem('omnistudy_font_type');
  if (savedFont) {
    setFontFamily(savedFont);
    const fontSelect = document.getElementById('setting-font-family');
    if (fontSelect) fontSelect.value = savedFont;
  }

  // 3. Font Scale
  const savedScale = localStorage.getItem('omnistudy_font_scale');
  if (savedScale) {
    setFontScale(savedScale);
    const sizeSelect = document.getElementById('setting-font-size');
    if (sizeSelect) sizeSelect.value = savedScale;
  }

  // 4. Canvas Grid Pattern
  const savedGrid = localStorage.getItem('omnistudy_canvas_grid');
  if (savedGrid === '1') {
    toggleCanvasGrid(true);
    const gridToggle = document.getElementById('setting-canvas-grid');
    if (gridToggle) gridToggle.checked = true;
  }

  // 5. Theme button highlights in settings
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  document.getElementById('setting-theme-dark')?.classList.toggle('active', currentTheme === 'dark');
  document.getElementById('setting-theme-light')?.classList.toggle('active', currentTheme === 'light');

  // 6. Scholar Profile Rehydration
  const savedProfile = localStorage.getItem('omnistudy_scholar_profile');
  if (savedProfile) {
    try {
      const p = JSON.parse(savedProfile);
      saveProfile(p);
      const nameInp = document.getElementById('profile-name-input');
      const roleInp = document.getElementById('profile-role-input');
      const avInp = document.getElementById('profile-avatar-input');
      if (nameInp) nameInp.value = p.name;
      if (roleInp) roleInp.value = p.role;
      if (avInp) avInp.value = p.avatar;
    } catch {}
  }
}

function exportFullWorkspaceBackup() {
  const backup = {
    app: 'OmniStudy',
    exportedAt: new Date().toISOString(),
    profile: JSON.parse(localStorage.getItem('omnistudy_scholar_profile') || '{}'),
    subjects: JSON.parse(localStorage.getItem('omnistudy_subjects') || '[]'),
    notes: JSON.parse(localStorage.getItem('omnistudy_notes') || '[]'),
    reminders: JSON.parse(localStorage.getItem('omnistudy_reminders') || '[]'),
    learning_tracks: JSON.parse(localStorage.getItem('omnistudy_learning_tracks') || '[]'),
    creators: JSON.parse(localStorage.getItem('omnistudy_creators') || '[]'),
    theme: localStorage.getItem('omnistudy_theme') || 'dark',
    accent: localStorage.getItem('omnistudy_accent_color') || '#7c3aed'
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omnistudy_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function importWorkspaceBackup(file, showToastFn) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.subjects) localStorage.setItem('omnistudy_subjects', JSON.stringify(data.subjects));
      if (data.notes) localStorage.setItem('omnistudy_notes', JSON.stringify(data.notes));
      if (data.reminders) localStorage.setItem('omnistudy_reminders', JSON.stringify(data.reminders));
      if (data.profile) saveProfile(data.profile);
      if (data.accent) applyAccentColor(data.accent);
      if (data.theme) setThemeMode(data.theme);

      if (showToastFn) showToastFn('✓ Workspace successfully restored from backup! Refreshing...');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      alert('Invalid backup JSON file.');
    }
  };
  reader.readAsText(file);
}

function resetVisualDefaults() {
  localStorage.removeItem('omnistudy_accent_color');
  localStorage.removeItem('omnistudy_font_type');
  localStorage.removeItem('omnistudy_font_scale');
  localStorage.removeItem('omnistudy_canvas_grid');
  applyAccentColor('#7c3aed');
  setFontFamily('sans');
  setFontScale('default');
  toggleCanvasGrid(false);
}
