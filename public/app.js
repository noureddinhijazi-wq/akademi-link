/* ── State & Config ────────────────────────────────────────── */
const S = { user: null, token: null, page: 'feed', pageParam: null, theme: 'dark' };
const API = '/api';

/* ── API ───────────────────────────────────────────────────── */
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (S.token) opts.headers['Authorization'] = `Bearer ${S.token}`;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
const GET = p => api('GET', p);
const POST = (p, b) => api('POST', p, b);
const PATCH = (p, b) => api('PATCH', p, b);
const PUT = (p, b) => api('PUT', p, b);
const DEL = p => api('DELETE', p);

/* ── Toast ─────────────────────────────────────────────────── */
function toast(msg, type = 'info') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── Theme ─────────────────────────────────────────────────── */
function applyTheme(t) {
  S.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
function toggleTheme() { applyTheme(S.theme === 'dark' ? 'light' : 'dark'); updateThemeIcon(); }
function updateThemeIcon() {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = S.theme === 'dark' ? '☀️' : '🌙';
}

/* ── Auth ──────────────────────────────────────────────────── */
function initAuth() {
  const t = localStorage.getItem('al_token'), u = localStorage.getItem('al_user');
  if (t && u) { S.token = t; S.user = JSON.parse(u); return true; }
  return false;
}
function saveAuth(token, user) {
  S.token = token; S.user = user;
  localStorage.setItem('al_token', token); localStorage.setItem('al_user', JSON.stringify(user));
}
function logout() {
  S.token = null; S.user = null;
  localStorage.removeItem('al_token'); localStorage.removeItem('al_user');
  render();
}

/* ── Navigation ────────────────────────────────────────────── */
function nav(page, param = null) { S.page = page; S.pageParam = param; render(); window.scrollTo(0, 0); }

/* ── Avatar helper ─────────────────────────────────────────── */
function avt(name = '?', cls = '') {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colors = ['#0A66C2', '#057642', '#7B3F9E', '#C37D16', '#CC1016', '#0891B2'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return `<div class="avatar ${cls}" style="background:${color}">${initials}</div>`;
}

/* ── Time helper ───────────────────────────────────────────── */
function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return 'just now'; if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`; if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return new Date(date).toLocaleDateString();
}

/* ── Modal ─────────────────────────────────────────────────── */
function modal(html) {
  closeModal();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(bg);
  bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
  bg.querySelector('[data-close]')?.addEventListener('click', closeModal);
}
function closeModal() { document.getElementById('modal-bg')?.remove(); }

/* ── MAIN RENDER ────────────────────────────────────────────── */
function render() {
  const app = document.getElementById('app');
  if (!S.user) { app.innerHTML = renderAuth(); attachAuth(); return; }
  app.innerHTML = renderShell();
  attachNav();
  updateThemeIcon();
  renderPage();
}

/* ── AUTH PAGE ─────────────────────────────────────────────── */
function renderAuth(tab = 'login', err = '') {
  return `<div class="auth-page">
    <div class="auth-wrap">
      <div class="auth-logo">
        <div class="auth-logo-icon">🔗</div>
        <h1>AkademiLink</h1>
        <p>Professional network for academics & tech professionals</p>
      </div>
      <div class="auth-card">
        ${tab === 'login' ? `
        <h2>Welcome back</h2><p class="sub">Sign in to your account</p>
        ${err ? `<div class="alert alert-error">${err}</div>` : ''}
        <div class="form-group"><label>Email</label><input id="l-email" type="email" placeholder="you@email.com" value="mehmet@email.com"/></div>
        <div class="form-group"><label>Password</label><input id="l-pass" type="password" placeholder="••••••••" value="pass123"/></div>
        <button class="btn btn-primary btn-full" id="login-btn" style="margin-top:8px">Sign In</button>
        <div class="auth-switch">Don't have an account? <a id="go-register">Join now</a></div>
        <div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--text2)">
          <strong>Demo:</strong> mehmet@email.com / pass123 &nbsp;|&nbsp; ali@email.com / pass123
        </div>` : `
        <h2>Join AkademiLink</h2><p class="sub">Build your professional identity</p>
        ${err ? `<div class="alert alert-error">${err}</div>` : ''}
        <div class="form-row">
          <div class="form-group"><label>Full Name</label><input id="r-name" placeholder="Ali Öztürk"/></div>
          <div class="form-group"><label>Email</label><input id="r-email" type="email" placeholder="ali@email.com"/></div>
        </div>
        <div class="form-group"><label>Password</label><input id="r-pass" type="password" placeholder="Min 6 chars"/></div>
        <div class="form-group"><label>Professional Headline</label><input id="r-headline" placeholder="Software Engineer @ Company | Student"/></div>
        <div class="form-group"><label>Location</label><input id="r-location" placeholder="Istanbul, Turkey"/></div>
        <button class="btn btn-primary btn-full" id="register-btn" style="margin-top:8px">Create Account</button>
        <div class="auth-switch">Already have an account? <a id="go-login">Sign in</a></div>`}
      </div>
    </div>
  </div>`;
}

function attachAuth() {
  document.getElementById('go-register')?.addEventListener('click', () => { document.getElementById('app').innerHTML = renderAuth('register'); attachAuth(); });
  document.getElementById('go-login')?.addEventListener('click', () => { document.getElementById('app').innerHTML = renderAuth('login'); attachAuth(); });

  document.getElementById('login-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-pass').value;
    try { const r = await POST('/auth/login', { email, password }); saveAuth(r.token, r.user); render(); }
    catch (e) { document.getElementById('app').innerHTML = renderAuth('login', e.message); attachAuth(); }
  });
  document.getElementById('l-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-btn')?.click(); });

  document.getElementById('register-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-pass').value;
    const headline = document.getElementById('r-headline').value.trim();
    const location = document.getElementById('r-location').value.trim();
    if (!name || !email || !password) { document.getElementById('app').innerHTML = renderAuth('register', 'Please fill all required fields'); attachAuth(); return; }
    try { const r = await POST('/auth/register', { name, email, password, headline, location }); saveAuth(r.token, r.user); render(); }
    catch (e) { document.getElementById('app').innerHTML = renderAuth('register', e.message); attachAuth(); }
  });
}

/* ── SHELL ─────────────────────────────────────────────────── */
function renderShell() {
  const pages = [
    { id: 'feed', icon: '🏠', label: 'Home' },
    { id: 'network', icon: '👥', label: 'My Network' },
    { id: 'jobs', icon: '💼', label: 'Jobs' },
    { id: 'messages', icon: '💬', label: 'Messaging' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
  ];
  return `
  <nav class="navbar">
    <a class="nav-logo" href="#" onclick="nav('feed');return false;">
      <div class="nav-logo-icon">🔗</div>
      <span>AkademiLink</span>
    </a>
    <div class="nav-search">
      <div class="nav-search-wrap">
        <span class="nav-search-icon">🔍</span>
        <input class="nav-search-input" id="nav-search" placeholder="Search people, jobs..." />
      </div>
    </div>
    <div class="nav-items">
      ${pages.map(p => `<button class="nav-item ${S.page === p.id ? 'active' : ''}" data-page="${p.id}">
        <span class="nav-icon">${p.icon}</span>
        <span class="nav-label">${p.label}</span>
      </button>`).join('')}
      <button class="nav-item ${S.page === 'profile' && S.pageParam === S.user.id ? 'active' : ''}" data-page="profile" data-param="${S.user.id}">
        ${avt(S.user.name, 'avatar-xs')}
        <span class="nav-label">Me</span>
      </button>
      <button class="nav-theme-btn" id="theme-btn" title="Toggle theme">☀️</button>
    </div>
  </nav>
  <div id="page-root"></div>`;
}

function attachNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const param = btn.dataset.param ? Number(btn.dataset.param) : null;
      nav(btn.dataset.page, param);
    });
  });
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
  const search = document.getElementById('nav-search');
  if (search) {
    search.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.value.trim()) nav('search', e.target.value.trim());
    });
  }
  updateThemeIcon();
}

/* ── PAGE DISPATCH ─────────────────────────────────────────── */
async function renderPage() {
  const el = document.getElementById('page-root'); if (!el) return;
  el.innerHTML = `<div style="text-align:center;padding:80px;color:var(--text3)">Loading...</div>`;
  try {
    const map = { feed: pgFeed, network: pgNetwork, jobs: pgJobs, messages: pgMessages, notifications: pgNotifications, profile: pgProfile, search: pgSearch };
    const fn = map[S.page];
    if (fn) await fn(el, S.pageParam);
    else el.innerHTML = `<div class="empty"><div class="empty-icon">🚧</div><p>Page not found</p></div>`;
  } catch (e) { el.innerHTML = `<div class="alert alert-error" style="margin:20px">${e.message}</div>`; }
}

/* ── FEED PAGE ─────────────────────────────────────────────── */
async function pgFeed(el) {
  const [posts, me] = await Promise.all([GET('/feed'), GET('/users/me')]);
  el.innerHTML = `
  <div class="layout">
    <div class="layout-inner">
      <div class="layout-left">
        ${renderProfileCard(me)}
        ${renderSidebarLinks()}
      </div>
      <div class="layout-center">
        <div class="card">
          <div class="create-post">
            ${avt(me.name)}
            <button class="create-post-input" id="open-create-post">Start a post...</button>
          </div>
          <div class="create-post-actions">
            <button class="create-action" id="open-create-post2">📷 Photo</button>
            <button class="create-action" id="open-create-post3">📝 Article</button>
          </div>
        </div>
        <div id="feed-posts">
          ${posts.length === 0 ? `<div class="card"><div class="empty"><div class="empty-icon">📰</div><p>No posts yet. Connect with people to see their posts!</p></div></div>` : posts.map(p => renderPost(p)).join('')}
        </div>
      </div>
      <div class="layout-right">
        ${await renderSuggestions()}
      </div>
    </div>
  </div>`;
  document.getElementById('open-create-post')?.addEventListener('click', openCreatePost);
  document.getElementById('open-create-post2')?.addEventListener('click', openCreatePost);
  document.getElementById('open-create-post3')?.addEventListener('click', openCreatePost);
  attachPostListeners(el);
}

function renderProfileCard(u) {
  return `<div class="card">
    <div class="profile-card-cover"></div>
    <div class="profile-card-avatar-wrap">${avt(u.name, 'avatar-lg')}</div>
    <div class="profile-card-info">
      <h3 style="cursor:pointer" onclick="nav('profile',${u.id})">${u.name}</h3>
      <p>${u.headline || 'Add a headline'}</p>
    </div>
    <div class="profile-card-divider"></div>
    <div class="profile-card-stat" style="cursor:pointer" onclick="nav('network')">
      <span>Connections</span><span>${countConnections(u.id)}</span>
    </div>
    <div class="profile-card-divider"></div>
    <div class="sidebar-link" onclick="nav('profile',${u.id})"><span class="icon">👤</span>View my profile</div>
  </div>`;
}

function countConnections(userId) {
  // approximate from local state - just show dynamic count
  return '—';
}

function renderSidebarLinks() {
  return `<div class="card">
    <div class="sidebar-link" onclick="nav('jobs')"><span class="icon">💼</span>Jobs for you</div>
    <div class="sidebar-link" onclick="nav('network')"><span class="icon">👥</span>Grow your network</div>
    <div class="sidebar-link" onclick="nav('notifications')"><span class="icon">🔔</span>Notifications</div>
  </div>`;
}

async function renderSuggestions() {
  try {
    const people = await GET('/connections/suggestions');
    if (!people.length) return '';
    return `<div class="card">
      <div class="section-title" style="font-size:14px;font-weight:700;padding:14px 16px 10px">People you may know</div>
      ${people.slice(0, 3).map(p => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid var(--border)">
          ${avt(p.name)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;cursor:pointer" onclick="nav('profile',${p.id})">${p.name}</div>
            <div style="font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.headline || p.location || ''}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="connectUser(${p.id},this)">Connect</button>
        </div>`).join('')}
    </div>`;
  } catch { return ''; }
}

function renderPost(p) {
  return `<div class="card post-card" data-post-id="${p.id}">
    <div class="post-header">
      ${avt(p.authorName)}
      <div class="post-author-info">
        <div class="post-author-name" onclick="nav('profile',${p.authorId})">${p.authorName}</div>
        <div class="post-author-headline">${p.authorHeadline || ''}</div>
        <div class="post-time">${timeAgo(p.createdAt)}</div>
      </div>
      ${p.authorId === S.user.id ? `<button class="btn-icon" onclick="deletePost(${p.id},this)" title="Delete post">🗑</button>` : ''}
    </div>
    <div class="post-content">${escHtml(p.content)}</div>
    <div class="post-stats">
      <span class="post-stats-likes" onclick="toggleComments(${p.id})">
        ${p.likes > 0 ? `👍 ${p.likes}` : ''}
      </span>
      <span style="cursor:pointer" onclick="toggleComments(${p.id})">${p.commentsCount > 0 ? `${p.commentsCount} comment${p.commentsCount !== 1 ? 's' : ''}` : ''}</span>
    </div>
    <div class="post-actions">
      <button class="post-action ${p.liked ? 'liked' : ''}" data-like="${p.id}">
        ${p.liked ? '👍' : '👍'} <span>${p.liked ? 'Liked' : 'Like'}</span>
      </button>
      <button class="post-action" onclick="toggleComments(${p.id})">💬 Comment</button>
      <button class="post-action">↗ Share</button>
    </div>
    <div class="comments-section" id="comments-${p.id}" style="display:none"></div>
  </div>`;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function attachPostListeners(el) {
  el.querySelectorAll('[data-like]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.like);
      try {
        const r = await POST(`/posts/${id}/like`);
        const card = el.querySelector(`.post-card[data-post-id="${id}"]`);
        if (!card) return;
        btn.className = `post-action ${r.liked ? 'liked' : ''}`;
        btn.innerHTML = `${r.liked ? '👍' : '👍'} <span>${r.liked ? 'Liked' : 'Like'}</span>`;
        const stats = card.querySelector('.post-stats-likes');
        if (stats) stats.textContent = r.likes > 0 ? `👍 ${r.likes}` : '';
      } catch (e) { toast(e.message, 'error'); }
    });
  });
}

window.deletePost = async function(id, btn) {
  if (!confirm('Delete this post?')) return;
  try { await DEL(`/posts/${id}`); btn.closest('.post-card').remove(); toast('Post deleted', 'success'); }
  catch (e) { toast(e.message, 'error'); }
};

window.toggleComments = async function(postId) {
  const section = document.getElementById(`comments-${postId}`); if (!section) return;
  if (section.style.display !== 'none') { section.style.display = 'none'; return; }
  section.style.display = 'block';
  if (section.dataset.loaded) return;
  section.dataset.loaded = '1';
  section.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0">Loading...</div>';
  const comments = await GET(`/posts/${postId}/comments`);
  section.innerHTML = `
    ${comments.map(c => `<div class="comment">
      ${avt(c.authorName, 'avatar-sm')}
      <div class="comment-bubble">
        <div class="comment-author">${c.authorName}</div>
        <div class="comment-headline">${c.authorHeadline || ''}</div>
        <div class="comment-text">${escHtml(c.content)}</div>
      </div>
    </div>`).join('')}
    <div class="comment-input-wrap">
      ${avt(S.user.name, 'avatar-sm')}
      <input class="comment-input" id="ci-${postId}" placeholder="Add a comment..." />
      <button class="btn btn-primary btn-sm" onclick="submitComment(${postId})">Post</button>
    </div>`;
  document.getElementById(`ci-${postId}`)?.addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(postId); });
};

window.submitComment = async function(postId) {
  const input = document.getElementById(`ci-${postId}`); if (!input) return;
  const content = input.value.trim(); if (!content) return;
  try {
    const comment = await POST(`/posts/${postId}/comments`, { content });
    input.value = '';
    const section = document.getElementById(`comments-${postId}`);
    const wrap = section.querySelector('.comment-input-wrap');
    const el = document.createElement('div'); el.className = 'comment';
    el.innerHTML = `${avt(comment.authorName, 'avatar-sm')}<div class="comment-bubble"><div class="comment-author">${comment.authorName}</div><div class="comment-text">${escHtml(comment.content)}</div></div>`;
    section.insertBefore(el, wrap);
    const statsEl = document.querySelector(`.post-card[data-post-id="${postId}"] .post-stats span:last-child`);
    if (statsEl) { const cur = parseInt(statsEl.textContent) || 0; statsEl.textContent = `${cur + 1} comment${cur + 1 !== 1 ? 's' : ''}`; }
  } catch (e) { toast(e.message, 'error'); }
};

function openCreatePost() {
  modal(`<div class="modal-head"><h2>Create a post</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div style="display:flex;gap:12px;margin-bottom:14px">${avt(S.user.name)}<div><div style="font-weight:700">${S.user.name}</div><div style="font-size:12px;color:var(--text2)">Post to anyone</div></div></div>
    <textarea id="post-content" rows="5" style="width:100%;background:var(--bg);border:none;resize:none;font-size:16px;color:var(--text);padding:0;line-height:1.6" placeholder="What do you want to talk about?"></textarea>
  </div>
  <div class="modal-foot"><button class="btn btn-primary" id="submit-post" disabled>Post</button></div>`);
  const ta = document.getElementById('post-content');
  const btn = document.getElementById('submit-post');
  ta.addEventListener('input', () => { btn.disabled = !ta.value.trim(); });
  ta.focus();
  btn.addEventListener('click', async () => {
    try {
      const post = await POST('/posts', { content: ta.value.trim() });
      closeModal();
      toast('Post published!', 'success');
      const feed = document.getElementById('feed-posts'); if (!feed) return;
      const el = document.createElement('div'); el.innerHTML = renderPost({ ...post, liked: false }); 
      feed.prepend(el.firstChild);
      attachPostListeners(feed);
    } catch (e) { toast(e.message, 'error'); }
  });
}

window.connectUser = async function(userId, btn) {
  try { await POST(`/connections/request/${userId}`); btn.textContent = 'Pending'; btn.disabled = true; toast('Connection request sent!', 'success'); }
  catch (e) { toast(e.message, 'error'); }
};

/* ── PROFILE PAGE ──────────────────────────────────────────── */
async function pgProfile(el, userId) {
  const uid = userId || S.user.id;
  const [user, posts, connStatus] = await Promise.all([
    GET(`/users/${uid}`),
    GET(`/users/${uid}/posts`),
    uid !== S.user.id ? GET(`/connections/status/${uid}`) : Promise.resolve({ status: 'self' })
  ]);
  const isMe = uid === S.user.id;
  let exp = []; let edu = [];
  try { exp = JSON.parse(user.experience || '[]'); } catch {}
  try { edu = JSON.parse(user.education || '[]'); } catch {}

  el.innerHTML = `<div class="page-wrap" style="padding:20px 16px">
    <div class="card" style="margin-bottom:14px">
      <div class="profile-cover"></div>
      <div class="profile-top">
        ${avt(user.name, 'avatar-xl')}
        <div class="profile-actions">
          ${isMe
            ? `<button class="btn btn-outline" onclick="openEditProfile()">✏️ Edit Profile</button>`
            : connStatus.status === 'connected'
              ? `<button class="btn btn-ghost">✓ Connected</button><button class="btn btn-outline" onclick="nav('messages');setTimeout(()=>openChat(${uid},'${user.name}'),200)">💬 Message</button>`
              : connStatus.status === 'pending' && connStatus.isSender
                ? `<button class="btn btn-ghost" disabled>Pending...</button>`
                : connStatus.status === 'pending'
                  ? `<button class="btn btn-primary" onclick="acceptConn(${connStatus.connId})">Accept Request</button>`
                  : `<button class="btn btn-primary" onclick="connectUser(${uid},this)">🤝 Connect</button><button class="btn btn-outline" onclick="nav('messages');setTimeout(()=>openChat(${uid},'${user.name}'),200)">💬 Message</button>`}
        </div>
      </div>
      <div class="profile-info">
        <div class="profile-name">${user.name}</div>
        ${user.headline ? `<div class="profile-headline">${user.headline}</div>` : ''}
        ${user.location ? `<div class="profile-location">📍 ${user.location}</div>` : ''}
      </div>
    </div>
    ${user.about ? `<div class="card" style="margin-bottom:14px"><div class="profile-section"><h3>About</h3><p style="font-size:14px;line-height:1.7;color:var(--text2)">${user.about}</p></div></div>` : ''}
    ${exp.length ? `<div class="card" style="margin-bottom:14px"><div class="profile-section"><h3>Experience</h3>${exp.map(e=>`<div class="exp-item"><div class="exp-icon">🏢</div><div><div class="exp-title">${e.title}</div><div class="exp-company">${e.company}</div><div class="exp-duration">${e.duration}</div></div></div>`).join('')}</div></div>` : ''}
    ${edu.length ? `<div class="card" style="margin-bottom:14px"><div class="profile-section"><h3>Education</h3>${edu.map(e=>`<div class="exp-item"><div class="exp-icon">🎓</div><div><div class="exp-title">${e.school}</div><div class="exp-company">${e.degree}</div><div class="exp-duration">${e.year}</div></div></div>`).join('')}</div></div>` : ''}
    ${user.skills ? `<div class="card" style="margin-bottom:14px"><div class="profile-section"><h3>Skills</h3><div>${user.skills.split(',').map(s=>`<span class="skill-tag">${s.trim()}</span>`).join('')}</div></div></div>` : ''}
    ${posts.length ? `<div class="card"><div class="section-title">Activity</div>${posts.map(p=>renderPost(p)).join('')}</div>` : ''}
  </div>`;
  attachPostListeners(el);
}

window.acceptConn = async function(connId) {
  try { await PATCH(`/connections/${connId}/accept`); toast('Connected!', 'success'); renderPage(); }
  catch (e) { toast(e.message, 'error'); }
};

function openEditProfile() {
  const u = S.user;
  let exp = [], edu = [];
  try { exp = JSON.parse(u.experience || '[]'); } catch {}
  try { edu = JSON.parse(u.education || '[]'); } catch {}

  modal(`<div class="modal-head"><h2>Edit Profile</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Name</label><input id="ep-name" value="${u.name}" /></div>
    <div class="form-group"><label>Headline</label><input id="ep-headline" value="${u.headline || ''}" /></div>
    <div class="form-group"><label>Location</label><input id="ep-location" value="${u.location || ''}" /></div>
    <div class="form-group"><label>About</label><textarea id="ep-about" rows="4">${u.about || ''}</textarea></div>
    <div class="form-group"><label>Skills (comma-separated)</label><input id="ep-skills" value="${u.skills || ''}" /></div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="save-profile">Save</button></div>`);

  document.getElementById('save-profile').addEventListener('click', async () => {
    const update = { name: document.getElementById('ep-name').value.trim(), headline: document.getElementById('ep-headline').value.trim(), location: document.getElementById('ep-location').value.trim(), about: document.getElementById('ep-about').value.trim(), skills: document.getElementById('ep-skills').value.trim() };
    try {
      const updated = await PATCH('/users/me', update);
      Object.assign(S.user, updated);
      localStorage.setItem('al_user', JSON.stringify(S.user));
      closeModal(); toast('Profile updated!', 'success'); renderPage();
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ── NETWORK PAGE ─────────────────────────────────────────── */
async function pgNetwork(el) {
  const [conns, pending, suggestions] = await Promise.all([GET('/connections'), GET('/connections/pending'), GET('/connections/suggestions')]);
  el.innerHTML = `<div class="page-wrap" style="padding:20px 16px">
    ${pending.length ? `
    <div class="card" style="margin-bottom:16px">
      <div class="section-title">Pending Requests (${pending.length})</div>
      ${pending.map(c => `<div class="connection-item">
        ${avt(c.sender?.name || '?')}
        <div class="connection-info">
          <div class="connection-name" onclick="nav('profile',${c.sender?.id})">${c.sender?.name}</div>
          <div class="connection-headline">${c.sender?.headline || ''}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="acceptConnReq(${c.id},this)">Accept</button>
          <button class="btn btn-ghost btn-sm" onclick="declineConnReq(${c.id},this)">Decline</button>
        </div>
      </div>`).join('')}
    </div>` : ''}
    <div class="card" style="margin-bottom:16px">
      <div class="section-title">People You May Know</div>
      <div class="person-grid" style="padding:0 16px 16px">
        ${suggestions.map(p => `<div class="person-card">
          <div class="person-card-cover"></div>
          ${avt(p.name, 'avatar-lg')}
          <h4 style="cursor:pointer" onclick="nav('profile',${p.id})">${p.name}</h4>
          <p>${p.headline || p.location || 'Member'}</p>
          <button class="btn btn-outline btn-sm" style="margin-top:10px;width:100%" onclick="connectUser(${p.id},this)">🤝 Connect</button>
        </div>`).join('')}
        ${suggestions.length === 0 ? '<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:20px">No suggestions available</p>' : ''}
      </div>
    </div>
    <div class="card">
      <div class="section-title">My Connections (${conns.length})</div>
      ${conns.length === 0 ? '<div class="empty"><div class="empty-icon">👥</div><p>No connections yet</p></div>' :
        conns.map(c => `<div class="connection-item">
          ${avt(c.user?.name || '?')}
          <div class="connection-info">
            <div class="connection-name" onclick="nav('profile',${c.user?.id})">${c.user?.name}</div>
            <div class="connection-headline">${c.user?.headline || ''}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="nav('messages');setTimeout(()=>openChat(${c.user?.id},'${c.user?.name}'),200)">💬 Message</button>
        </div>`).join('')}
    </div>
  </div>`;

  el.querySelectorAll('[onclick*="acceptConnReq"]').forEach(() => {});
}

window.acceptConnReq = async function(id, btn) {
  try { await PATCH(`/connections/${id}/accept`); btn.closest('.connection-item').remove(); toast('Connected!', 'success'); }
  catch (e) { toast(e.message, 'error'); }
};
window.declineConnReq = async function(id, btn) {
  try { await PATCH(`/connections/${id}/decline`); btn.closest('.connection-item').remove(); toast('Declined', 'info'); }
  catch (e) { toast(e.message, 'error'); }
};

/* ── JOBS PAGE ────────────────────────────────────────────── */
async function pgJobs(el) {
  const appliedRaw = await GET('/jobs/applications').catch(() => []);
  const appliedSet = new Set(appliedRaw.map(a => a.jobId));
  const jobs = await GET('/jobs');

  el.innerHTML = `<div class="page-wrap" style="padding:20px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h2 style="font-size:20px;font-weight:700">Jobs</h2>
      <button class="btn btn-primary" onclick="openPostJob()">+ Post a Job</button>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div style="position:relative;flex:1;min-width:200px">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3)">🔍</span>
        <input id="job-search" style="width:100%;padding:10px 14px 10px 36px;background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius);color:var(--text)" placeholder="Search jobs, companies..." />
      </div>
    </div>
    <div class="card">
      <div id="jobs-list">
        ${jobs.map(j => renderJobCard(j, appliedSet.has(j.id))).join('')}
        ${jobs.length === 0 ? '<div class="empty"><div class="empty-icon">💼</div><p>No jobs posted yet</p></div>' : ''}
      </div>
    </div>
  </div>`;

  document.getElementById('job-search')?.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    const filtered = await GET(`/jobs${q ? '?q=' + encodeURIComponent(q) : ''}`);
    document.getElementById('jobs-list').innerHTML = filtered.map(j => renderJobCard(j, appliedSet.has(j.id))).join('') || '<div class="empty"><p>No jobs found</p></div>';
    attachJobListeners(el, appliedSet);
  });
  attachJobListeners(el, appliedSet);
}

function renderJobCard(j, applied) {
  return `<div class="job-card" data-job-id="${j.id}">
    <div class="job-logo">🏢</div>
    <div style="flex:1">
      <div class="job-title">${j.title}</div>
      <div class="job-company">${j.company}</div>
      <div class="job-meta">📍 ${j.location || 'Remote'} · ${j.type || 'Full-time'}${j.salary ? ` · ${j.salary}` : ''}</div>
      ${j.requirements ? `<div class="job-tags">${j.requirements.split(',').slice(0,4).map(r=>`<span class="job-tag">${r.trim()}</span>`).join('')}</div>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
      ${applied ? `<span class="btn btn-ghost btn-sm" style="cursor:default">✓ Applied</span>` : `<button class="btn btn-primary btn-sm apply-job-btn" data-job-id="${j.id}">Apply</button>`}
      ${j.postedBy === S.user.id ? `<button class="btn btn-ghost btn-sm" onclick="deleteJob(${j.id},this)">🗑</button>` : ''}
    </div>
  </div>`;
}

function attachJobListeners(el, appliedSet) {
  el.querySelectorAll('.apply-job-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const jid = Number(btn.dataset.jobId);
      try { await POST(`/jobs/${jid}/apply`); btn.outerHTML = `<span class="btn btn-ghost btn-sm" style="cursor:default">✓ Applied</span>`; appliedSet.add(jid); toast('Applied successfully!', 'success'); }
      catch (e) { toast(e.message, 'error'); }
    });
  });
}

window.deleteJob = async function(id, btn) {
  if (!confirm('Delete this job?')) return;
  try { await DEL(`/jobs/${id}`); btn.closest('.job-card').remove(); toast('Job deleted', 'success'); }
  catch (e) { toast(e.message, 'error'); }
};

function openPostJob() {
  modal(`<div class="modal-head"><h2>Post a Job</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="two-col">
      <div class="form-group"><label>Job Title *</label><input id="jt" placeholder="Senior React Developer"/></div>
      <div class="form-group"><label>Company *</label><input id="jc" placeholder="Your Company"/></div>
    </div>
    <div class="two-col">
      <div class="form-group"><label>Location</label><input id="jl" placeholder="Istanbul (Hybrid)"/></div>
      <div class="form-group"><label>Type</label><select id="jtype"><option>Full-time</option><option>Part-time</option><option>Remote</option><option>Internship</option></select></div>
    </div>
    <div class="form-group"><label>Salary Range</label><input id="jsal" placeholder="₺70,000 – ₺100,000/mo"/></div>
    <div class="form-group"><label>Description</label><textarea id="jdesc" rows="3" placeholder="Describe the role..."></textarea></div>
    <div class="form-group"><label>Requirements (comma-separated)</label><input id="jreq" placeholder="React, TypeScript, 3+ years experience"/></div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="post-job-btn">Post Job</button></div>`);

  document.getElementById('post-job-btn').addEventListener('click', async () => {
    const title = document.getElementById('jt').value.trim(), company = document.getElementById('jc').value.trim();
    if (!title || !company) { toast('Title and company required', 'error'); return; }
    try {
      await POST('/jobs', { title, company, location: document.getElementById('jl').value.trim(), type: document.getElementById('jtype').value, salary: document.getElementById('jsal').value.trim(), description: document.getElementById('jdesc').value.trim(), requirements: document.getElementById('jreq').value.trim() });
      closeModal(); toast('Job posted!', 'success'); nav('jobs');
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ── MESSAGES PAGE ────────────────────────────────────────── */
async function pgMessages(el) {
  const convs = await GET('/conversations');
  el.innerHTML = `<div style="padding:20px 16px;max-width:920px;margin:0 auto">
    <div class="messages-layout" id="msg-layout">
      <div class="conv-list">
        <div class="conv-list-header">Messaging</div>
        ${convs.length === 0
          ? '<div class="empty" style="padding:40px"><div class="empty-icon" style="font-size:28px">💬</div><p>No conversations yet</p></div>'
          : convs.map(c => `<div class="conv-item" data-uid="${c.userId}" onclick="openChat(${c.userId},'${escHtml(c.name)}')">
              ${avt(c.name)}
              <div class="conv-info">
                <div class="conv-name">${c.name}</div>
                <div class="conv-last">${c.lastMessage || ''}</div>
              </div>
              <div>
                <div class="conv-time">${timeAgo(c.lastTime)}</div>
                ${c.unread > 0 ? `<div style="background:var(--primary);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;text-align:center;margin-top:4px">${c.unread}</div>` : ''}
              </div>
            </div>`).join('')}
      </div>
      <div class="chat-area" id="chat-area">
        <div class="empty" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="empty-icon">💬</div><p>Select a conversation</p>
        </div>
      </div>
    </div>
  </div>`;
}

window.openChat = async function(userId, name) {
  const chatArea = document.getElementById('chat-area'); if (!chatArea) return;
  chatArea.innerHTML = `<div class="chat-header">${avt(name, 'avatar-sm')}<h3 style="cursor:pointer" onclick="nav('profile',${userId})">${name}</h3></div><div class="chat-messages" id="chat-msgs">Loading...</div><div class="chat-input-bar"><input class="chat-input" id="chat-in" placeholder="Write a message..." /><button class="btn btn-primary btn-sm" id="chat-send">Send</button></div>`;

  const { messages, other } = await GET(`/conversations/${userId}`);
  const msgs = document.getElementById('chat-msgs');
  msgs.innerHTML = messages.length === 0
    ? '<div class="empty" style="padding:30px"><p>No messages yet. Say hello! 👋</p></div>'
    : messages.map(m => `<div class="chat-msg ${m.senderId === S.user.id ? 'mine' : ''}">
        ${m.senderId !== S.user.id ? avt(name, 'avatar-xs') : ''}
        <div><div class="chat-bubble">${escHtml(m.content)}</div><div class="chat-time">${timeAgo(m.createdAt)}</div></div>
      </div>`).join('');
  msgs.scrollTop = msgs.scrollHeight;

  const sendMsg = async () => {
    const input = document.getElementById('chat-in'); if (!input) return;
    const content = input.value.trim(); if (!content) return;
    try {
      const msg = await POST(`/conversations/${userId}`, { content });
      input.value = '';
      const el = document.createElement('div'); el.className = 'chat-msg mine';
      el.innerHTML = `<div><div class="chat-bubble">${escHtml(msg.content)}</div><div class="chat-time">just now</div></div>`;
      msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight;
    } catch (e) { toast(e.message, 'error'); }
  };
  document.getElementById('chat-send')?.addEventListener('click', sendMsg);
  document.getElementById('chat-in')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.conv-item[data-uid="${userId}"]`)?.classList.add('active');
};

/* ── NOTIFICATIONS PAGE ───────────────────────────────────── */
async function pgNotifications(el) {
  const notifs = await GET('/notifications');
  await POST('/notifications/read-all').catch(() => {});
  el.innerHTML = `<div class="page-wrap" style="padding:20px 16px">
    <div class="card">
      <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>Notifications</span><span style="font-size:12px;color:var(--text2)">${notifs.filter(n => !n.read).length} new</span>
      </div>
      ${notifs.length === 0 ? '<div class="empty"><div class="empty-icon">🔔</div><p>No notifications yet</p></div>' :
        notifs.map(n => `<div class="notif-item ${n.read ? '' : 'unread'}">
          ${avt(n.fromName || '?')}
          <div class="notif-text">${n.message}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>`).join('')}
    </div>
  </div>`;
}

/* ── SEARCH PAGE ──────────────────────────────────────────── */
async function pgSearch(el, query) {
  const [people, jobs] = await Promise.all([GET(`/users/search?q=${encodeURIComponent(query || '')}`), GET(`/jobs?q=${encodeURIComponent(query || '')}`)]);
  el.innerHTML = `<div class="page-wrap" style="padding:20px 16px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Results for "${query}"</h2>
    ${people.length ? `<div class="card" style="margin-bottom:16px">
      <div class="section-title">People</div>
      ${people.map(p => `<div class="connection-item">
        ${avt(p.name)}
        <div class="connection-info"><div class="connection-name" onclick="nav('profile',${p.id})">${p.name}</div><div class="connection-headline">${p.headline || ''}</div></div>
        <button class="btn btn-outline btn-sm" onclick="connectUser(${p.id},this)">Connect</button>
      </div>`).join('')}
    </div>` : ''}
    ${jobs.length ? `<div class="card">
      <div class="section-title">Jobs</div>
      ${jobs.map(j => renderJobCard(j, false)).join('')}
    </div>` : ''}
    ${!people.length && !jobs.length ? '<div class="empty"><div class="empty-icon">🔍</div><p>No results found</p></div>' : ''}
  </div>`;
}

/* ── INIT ───────────────────────────────────────────────────── */
applyTheme(localStorage.getItem('theme') || 'dark');
if (initAuth()) render(); else render();
