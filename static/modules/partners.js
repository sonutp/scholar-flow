/**
 * OmniStudy Study Partners & Collaborative Groups Hub
 * Search and match study partners, simulated direct study messaging, and group workspaces.
 */

let partners = [];
let groups = [];
let activeChatPartner = null;
let chatMessages = {};

export function initPartnersModule(showToastFn) {
  loadPartnersAndGroups();

  const searchInput = document.getElementById('partner-search-input');
  const subjectFilter = document.getElementById('partner-subject-filter');
  const styleFilter = document.getElementById('partner-style-filter');
  const createGroupForm = document.getElementById('create-group-form');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatInput = document.getElementById('chat-input-text');
  const closeChatBtn = document.getElementById('chat-modal-close');

  [searchInput, subjectFilter, styleFilter].forEach(elem => {
    elem?.addEventListener('input', () => renderPartnersList(showToastFn));
  });

  // Create new group
  createGroupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-group-name');
    const topicInput = document.getElementById('new-group-topic');
    const descInput = document.getElementById('new-group-desc');

    if (!nameInput.value.trim()) return;

    const newGroup = {
      id: `group_${Date.now()}`,
      name: nameInput.value.trim(),
      topic: topicInput.value.trim() || 'General Study',
      members_count: 1,
      description: descInput.value.trim() || 'Study group formed on OmniStudy.',
      pinned_note: 'Welcome to our study group! Add shared resources here.'
    };

    groups.unshift(newGroup);
    localStorage.setItem('omnistudy_groups', JSON.stringify(groups));
    renderGroupsList(showToastFn);
    
    // Close modal
    document.getElementById('create-group-modal')?.classList.remove('open');
    nameInput.value = '';
    descInput.value = '';
    if (showToastFn) showToastFn(`✓ Study Group "${newGroup.name}" created!`);
  });

  // Direct chat messaging
  chatSendBtn?.addEventListener('click', () => sendChatMessage());
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
  closeChatBtn?.addEventListener('click', () => {
    document.getElementById('chat-modal')?.classList.remove('open');
  });

  // Initial render
  renderPartnersList(showToastFn);
  renderGroupsList(showToastFn);
}

function loadPartnersAndGroups() {
  const savedPartners = localStorage.getItem('omnistudy_partners');
  if (savedPartners) {
    partners = JSON.parse(savedPartners);
  } else {
    partners = [
      { id: 'p1', name: 'Elena Rostova', avatar: '👩‍💻', subject: 'Computer Science', style: 'Pomodoro & LeetCode', timezone: 'UTC+1', bio: 'Prepping for SWE distributed systems rounds. Daily 50m pomodoros.', status: 'online' },
      { id: 'p2', name: 'Dr. Marcus Chen', avatar: '👨‍⚕️', subject: 'Medicine', style: 'Flashcards & Active Recall', timezone: 'UTC-5', bio: 'USMLE Step 2 sprint. Reviewing pathology & clinical vignettes.', status: 'study-mode' },
      { id: 'p3', name: 'Aisha Al-Mansoor', avatar: '⚖️', subject: 'Law', style: 'Case Analysis & Debate', timezone: 'UTC+4', bio: 'Commercial law & bar prep. Seeking debate & oral argument partner.', status: 'online' },
      { id: 'p4', name: 'Lucas Silva', avatar: '📐', subject: 'Data Science & AI', style: 'Project-Based & Papers', timezone: 'UTC-3', bio: 'Reading transformer & LLM papers, coding PyTorch models.', status: 'online' },
      { id: 'p5', name: 'Sarah Jenkins', avatar: '📊', subject: 'Finance', style: 'Problem Sets & Modeling', timezone: 'UTC+0', bio: 'CFA Level 1 study sprint. 6 AM morning study sessions.', status: 'offline' }
    ];
    localStorage.setItem('omnistudy_partners', JSON.stringify(partners));
  }

  const savedGroups = localStorage.getItem('omnistudy_groups');
  if (savedGroups) {
    groups = JSON.parse(savedGroups);
  } else {
    groups = [
      { id: 'g1', name: 'Algorithms & Problem Solving Sprint', topic: 'Computer Science', members_count: 142, description: 'Daily algorithmic puzzles, Big-O deep dives, and mock technical interviews.', pinned_note: 'Next live mock session: Saturday 4 PM UTC. Practice dynamic programming.' },
      { id: 'g2', name: 'USMLE / Med School High-Yield Sprint', topic: 'Medicine', members_count: 89, description: 'Cardio, renal, and pharmacology mnemonics with active recall flashcard rounds.', pinned_note: 'Check the cardiovascular notes compiled in the Notes tab.' },
      { id: 'g3', name: 'Deep Learning & Neural Architectures', topic: 'AI & Math', members_count: 210, description: 'arXiv reading group and practical PyTorch implementation workshops.', pinned_note: 'Discussing attention heads and KV-cache optimizations this week.' }
    ];
    localStorage.setItem('omnistudy_groups', JSON.stringify(groups));
  }
}

export function renderPartnersList(showToastFn) {
  const container = document.getElementById('partners-grid');
  if (!container) return;

  const search = document.getElementById('partner-search-input')?.value.toLowerCase() || '';
  const subj = document.getElementById('partner-subject-filter')?.value || 'all';
  const style = document.getElementById('partner-style-filter')?.value || 'all';

  const filtered = partners.filter(p => {
    const matchSubj = subj === 'all' || p.subject.toLowerCase().includes(subj.toLowerCase());
    const matchStyle = style === 'all' || p.style.toLowerCase().includes(style.toLowerCase());
    const matchSearch = !search || p.name.toLowerCase().includes(search) || p.bio.toLowerCase().includes(search) || p.subject.toLowerCase().includes(search);
    return matchSubj && matchStyle && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">No study partners found matching your filters. Try adjusting search criteria.</div>';
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="partner-card">
      <div class="partner-header">
        <div class="partner-avatar">${p.avatar}</div>
        <div>
          <div style="font-weight: 700; font-size: 1rem;">${escapeHtml(p.name)}</div>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
            <span class="status-dot" style="background: ${p.status === 'online' ? '#10b981' : p.status === 'study-mode' ? '#06b6d4' : '#94a3b8'}; box-shadow: none;"></span>
            <span style="text-transform: capitalize;">${p.status.replace('-', ' ')}</span> • <span>${p.timezone}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        <span class="note-tag-badge">${p.subject}</span>
        <span class="note-tag-badge" style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.3); color: #06b6d4;">${p.style}</span>
      </div>

      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; flex: 1;">
        ${escapeHtml(p.bio)}
      </p>

      <div style="display: flex; gap: 10px; margin-top: 6px;">
        <button class="btn-primary open-chat-btn" data-id="${p.id}" style="flex: 1; padding: 7px 12px; font-size: 0.85rem;">
          💬 Message
        </button>
        <button class="btn-secondary invite-session-btn" data-name="${p.name}" style="padding: 7px 12px; font-size: 0.85rem;">
          🤝 Invite
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.open-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const partner = partners.find(p => p.id === id);
      if (partner) openChatModal(partner);
    });
  });

  container.querySelectorAll('.invite-session-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (showToastFn) showToastFn(`✓ Study invite sent to ${name}!`);
    });
  });
}

export function renderGroupsList(showToastFn) {
  const container = document.getElementById('study-groups-grid');
  if (!container) return;

  container.innerHTML = groups.map(g => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="note-tag-badge" style="color: var(--primary);">${escapeHtml(g.topic)}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">👥 ${g.members_count} members</span>
        </div>
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 6px;">${escapeHtml(g.name)}</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
          ${escapeHtml(g.description)}
        </div>
        <div style="font-size: 0.8rem; background: var(--bg-input); padding: 8px 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent); margin-bottom: 14px;">
          📌 <strong>Pinned:</strong> ${escapeHtml(g.pinned_note)}
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-secondary join-group-btn" data-id="${g.id}" style="flex: 1; font-size: 0.85rem;">
          ${g.isJoined ? 'Joined ✓' : 'Join Group'}
        </button>
        <button class="btn-primary open-group-feed-btn" data-name="${g.name}" style="padding: 7px 12px; font-size: 0.85rem;">
          Room 🚀
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.join-group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const g = groups.find(item => item.id === id);
      if (g) {
        g.isJoined = !g.isJoined;
        g.members_count += g.isJoined ? 1 : -1;
        renderGroupsList(showToastFn);
        if (showToastFn) showToastFn(g.isJoined ? `✓ Joined "${g.name}"!` : `Left "${g.name}".`);
      }
    });
  });

  container.querySelectorAll('.open-group-feed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (showToastFn) showToastFn(`🚀 Entered ${name} live study room!`);
    });
  });
}

function openChatModal(partner) {
  activeChatPartner = partner;
  const modal = document.getElementById('chat-modal');
  const title = document.getElementById('chat-partner-name');
  const subtitle = document.getElementById('chat-partner-sub');

  if (title) title.textContent = `${partner.avatar} ${partner.name}`;
  if (subtitle) subtitle.textContent = `${partner.subject} • ${partner.style}`;

  // Initialize partner chat thread if empty
  if (!chatMessages[partner.id]) {
    chatMessages[partner.id] = [
      { sender: 'them', text: `Hi! I saw you're studying on OmniStudy. Ready to do some pomodoro focus blocks together?`, time: '10:14 AM' }
    ];
  }

  renderChatMessages();
  modal?.classList.add('open');
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages-container');
  if (!container || !activeChatPartner) return;

  const msgs = chatMessages[activeChatPartner.id] || [];
  container.innerHTML = msgs.map(m => `
    <div style="display: flex; justify-content: ${m.sender === 'me' ? 'flex-end' : 'flex-start'}; margin-bottom: 10px;">
      <div style="
        max-width: 75%;
        padding: 10px 14px;
        border-radius: ${m.sender === 'me' ? '14px 14px 2px 14px' : '14px 14px 14px 2px'};
        background: ${m.sender === 'me' ? 'var(--primary)' : 'var(--bg-input)'};
        color: ${m.sender === 'me' ? '#fff' : 'var(--text-primary)'};
        font-size: 0.9rem;
        border: 1px solid var(--border);
      ">
        <div>${escapeHtml(m.text)}</div>
        <div style="font-size: 0.65rem; opacity: 0.7; text-align: right; margin-top: 4px;">${m.time}</div>
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chat-input-text');
  if (!input || !input.value.trim() || !activeChatPartner) return;

  const text = input.value.trim();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!chatMessages[activeChatPartner.id]) chatMessages[activeChatPartner.id] = [];
  chatMessages[activeChatPartner.id].push({ sender: 'me', text, time });

  input.value = '';
  renderChatMessages();

  // Simulated partner auto-reply
  setTimeout(() => {
    if (activeChatPartner) {
      chatMessages[activeChatPartner.id].push({
        sender: 'them',
        text: `Sounds great! I'm starting a 25-minute Pomodoro session now. Let's compare notes right after!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderChatMessages();
    }
  }, 1200);
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}
