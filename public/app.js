/* ── State ─────────────────────────────────────────────────── */
const S = { user: null, token: null, page: 'dashboard', pageParam: null, theme: 'dark' };

/* ── API ───────────────────────────────────────────────────── */
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (S.token) opts.headers['Authorization'] = `Bearer ${S.token}`;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('/api' + path, opts);
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
  let w = document.querySelector('.toast-wrap');
  if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span><span>${msg}</span>`;
  w.appendChild(t); setTimeout(() => t.remove(), 3500);
}

/* ── Theme ─────────────────────────────────────────────────── */
function applyTheme(t) { S.theme = t; document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t); }
function toggleTheme() { applyTheme(S.theme === 'dark' ? 'light' : 'dark'); const b = document.getElementById('theme-btn'); if (b) b.textContent = S.theme === 'dark' ? '☀️' : '🌙'; }

/* ── Auth ──────────────────────────────────────────────────── */
function initAuth() {
  const t = localStorage.getItem('al_token'), u = localStorage.getItem('al_user');
  if (t && u) { S.token = t; S.user = JSON.parse(u); if(!S.user.name) S.user.name = S.user.email || 'User'; return true; }
  return false;
}
function saveAuth(token, user) { S.token = token; S.user = user; if(!S.user.name) S.user.name = S.user.email || 'User'; localStorage.setItem('al_token', token); localStorage.setItem('al_user', JSON.stringify(user)); }
function logout() { S.token = null; S.user = null; localStorage.removeItem('al_token'); localStorage.removeItem('al_user'); render(); }

/* ── Nav ───────────────────────────────────────────────────── */
function nav(page, param = null) { S.page = page; S.pageParam = param; render(); window.scrollTo(0, 0); }

/* ── Helpers ───────────────────────────────────────────────── */
function avt(name, cls) { name = name || '?'; cls = cls || '';
  const i = name.split(' ').slice(0,2).map(w=>w&&w[0]?w[0]:'').join('').toUpperCase()||'?';
  const c = ['#6366f1','#0A66C2','#057642','#7B3F9E','#C37D16','#CC1016'][name.charCodeAt(0) % 6];
  return `<div class="avatar ${cls}" style="background:${c}">${i}</div>`;
}
function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return new Date(d).toLocaleDateString();
}
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function typeBadge(type) {
  const map = { 'Course Project': 'badge-blue', 'TÜBİTAK Student Project': 'badge-green', 'Teknofest Student Project': 'badge-orange' };
  return `<span class="badge ${map[type]||'badge-gray'}">${esc(type)}</span>`;
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

/* ── RENDER ────────────────────────────────────────────────── */
function render() {
  const app = document.getElementById('app');
  if (!S.user) { app.innerHTML = renderAuth(); attachAuth(); return; }
  app.innerHTML = renderShell();
  attachNav();
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = S.theme === 'dark' ? '☀️' : '🌙';
  renderPage();
}

/* ── AUTH ──────────────────────────────────────────────────── */
function renderAuth(tab = 'login', err = '') {
  return `<div class="auth-page">
    <div class="auth-wrap">
      <div class="auth-logo">
        <div class="auth-logo-icon">🎓</div>
        <h1>Saving Private Öğrenci</h1>
        <p>Project Matching & Team Formation Platform · Uskudar University</p>
      </div>
      <div class="auth-card">
        ${tab === 'login' ? `
          <h2>Welcome back</h2><p class="sub">Sign in to your account</p>
          ${err ? `<div class="alert alert-error">${err}</div>` : ''}
          <div class="form-group"><label>Email</label><input id="l-email" type="email" placeholder="you@uskudar.edu.tr" value="ali@student.uskudar.edu.tr"/></div>
          <div class="form-group"><label>Password</label><input id="l-pass" type="password" value="student123"/></div>
          <button class="btn btn-primary btn-full" id="login-btn" style="margin-top:8px">Sign In →</button>
          <div class="auth-switch">New here? <a id="go-register" style="cursor:pointer">Create account</a></div>
          <div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--text2);line-height:1.8">
            <strong>Demo accounts:</strong><br/>
            👤 admin@uskudar.edu.tr / admin123<br/>
            🧑‍🏫 kristin@uskudar.edu.tr / advisor123<br/>
            🎓 ali@student.uskudar.edu.tr / student123
          </div>` : `
          <h2>Join the Platform</h2><p class="sub">Create your account</p>
          ${err ? `<div class="alert alert-error">${err}</div>` : ''}
          <div class="form-row">
            <div class="form-group"><label>Full Name *</label><input id="r-name" placeholder="Ali ÖZTÜRK"/></div>
            <div class="form-group"><label>Email *</label><input id="r-email" type="email" placeholder="ali@student.uskudar.edu.tr"/></div>
          </div>
          <div class="form-group"><label>Password *</label><input id="r-pass" type="password" placeholder="Min 6 characters"/></div>
          <div class="form-row">
            <div class="form-group"><label>Role</label>
              <select id="r-role"><option value="student">Student</option><option value="instructor">Instructor</option></select>
            </div>
            <div class="form-group"><label>Department</label><input id="r-dept" placeholder="Software Engineering"/></div>
          </div>
          <div id="student-fields">
            <div class="form-group"><label>Year</label>
              <select id="r-year"><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option selected>4th Year</option></select>
            </div>
          </div>
          <div id="instructor-fields" style="display:none">
            <div class="form-group"><label>Academic Title</label>
              <select id="r-title"><option>Dr.</option><option>Assoc. Prof.</option><option>Prof.</option><option>Lecturer</option></select>
            </div>
          </div>
          <button class="btn btn-primary btn-full" id="register-btn" style="margin-top:8px">Create Account →</button>
          <div class="auth-switch">Already have an account? <a id="go-login" style="cursor:pointer">Sign in</a></div>`}
      </div>
    </div>
  </div>`;
}

function attachAuth() {
  document.getElementById('go-register')?.addEventListener('click', () => { document.getElementById('app').innerHTML = renderAuth('register'); attachAuth(); });
  document.getElementById('go-login')?.addEventListener('click', () => { document.getElementById('app').innerHTML = renderAuth('login'); attachAuth(); });
  document.getElementById('r-role')?.addEventListener('change', e => {
    document.getElementById('student-fields').style.display = e.target.value === 'student' ? '' : 'none';
    document.getElementById('instructor-fields').style.display = e.target.value === 'instructor' ? '' : 'none';
  });
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
    const role = document.getElementById('r-role')?.value || 'student';
    const department = document.getElementById('r-dept').value.trim();
    const year = document.getElementById('r-year')?.value || '';
    const academicTitle = document.getElementById('r-title')?.value || '';
    if (!name || !email || !password) { document.getElementById('app').innerHTML = renderAuth('register', 'Please fill all required fields'); attachAuth(); return; }
    try { const r = await POST('/auth/register', { name, email, password, role, department, year, academicTitle }); saveAuth(r.token, r.user); render(); }
    catch (e) { document.getElementById('app').innerHTML = renderAuth('register', e.message); attachAuth(); }
  });
}

/* ── SHELL ─────────────────────────────────────────────────── */
function getNavItems() {
  const u = S.user;
  const common = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'announcements', icon: '📢', label: 'Announcements' },
  ];
  if (u.role === 'student') return [...common,
    { id: 'projects-browse', icon: '🔍', label: 'Browse Projects' },
    { id: 'projects-mine', icon: '📁', label: 'My Projects' },
    { id: 'find-instructor', icon: '👩‍🏫', label: 'Find Instructor' },
    { id: 'my-applications', icon: '📝', label: 'Applications' },
    { id: 'my-advisor-requests', icon: '📬', label: 'Advisor Requests' },
    { id: 'profile', icon: '👤', label: 'My Profile' },
  ];
  if (u.role === 'instructor') return [...common,
    { id: 'advisor-inbox', icon: '📥', label: 'Student Requests' },
    { id: 'profile', icon: '👤', label: 'My Profile' },
  ];
  if (u.role === 'admin') return [...common,
    { id: 'admin-users', icon: '👥', label: 'Users' },
    { id: 'admin-categories', icon: '🗂', label: 'Categories' },
    { id: 'admin-projects', icon: '📁', label: 'All Projects' },
  ];
  return common;
}

function renderShell() {
  const u = S.user;
  const navItems = getNavItems();
  return `
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">🎓</div>
        <div><div class="sidebar-title">SPÖ Platform</div><div class="sidebar-sub">Uskudar University</div></div>
      </div>
      <nav class="sidebar-nav">
        ${navItems.map(n => `
          <button class="nav-item ${S.page === n.id ? 'active' : ''}" data-page="${n.id}">
            <span class="nav-icon">${n.icon}</span>
            <span>${n.label}</span>
          </button>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          ${avt(u.name, 'avatar-sm')}
          <div style="flex:1;min-width:0">
            <div class="sidebar-user-name">${u.name}</div>
            <div class="sidebar-user-role">${(u.role||'user').charAt(0).toUpperCase()+(u.role||'user').slice(1)}</div>
          </div>
          <button class="btn-icon" id="theme-btn" title="Toggle theme">☀️</button>
          <button class="btn-icon" id="logout-btn" title="Sign out">⏏</button>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <div id="page-root"></div>
    </main>
  </div>`;
}

function attachNav() {
  document.getElementById('logout-btn')?.addEventListener('click', () => { if (confirm('Sign out?')) logout(); });
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => nav(btn.dataset.page));
  });
}

/* ── PAGE DISPATCH ─────────────────────────────────────────── */
async function renderPage() {
  const el = document.getElementById('page-root'); if (!el) return;
  el.innerHTML = `<div class="page-loading">Loading...</div>`;
  try {
    const map = {
      dashboard: pgDashboard, announcements: pgAnnouncements,
      'projects-browse': pgProjectsBrowse, 'projects-mine': pgProjectsMine,
      'find-instructor': pgFindInstructor, 'my-applications': pgMyApplications,
      'my-advisor-requests': pgMyAdvisorRequests, 'advisor-inbox': pgAdvisorInbox,
      profile: pgProfile, 'admin-users': pgAdminUsers,
      'admin-categories': pgAdminCategories, 'admin-projects': pgAdminProjects,
    };
    const fn = map[S.page];
    if (fn) await fn(el, S.pageParam);
    else el.innerHTML = `<div class="empty"><div class="empty-icon">🚧</div><p>Page not found</p></div>`;
  } catch (e) { el.innerHTML = `<div class="alert alert-error" style="margin:24px">${e.message}</div>`; }
}

/* ── DASHBOARD ─────────────────────────────────────────────── */
async function pgDashboard(el) {
  const u = S.user;

  if (u.role === 'admin') {
    const stats = await GET('/admin/stats');
    el.innerHTML = `<div class="page-pad">
      <div class="page-header"><h1>Admin Dashboard</h1><p>System overview</p></div>
      <div class="stats-grid">
        ${statCard('👥', 'blue', stats.users, 'Total Users')}
        ${statCard('🎓', 'green', stats.students, 'Students')}
        ${statCard('👩‍🏫', 'purple', stats.instructors, 'Instructors')}
        ${statCard('📁', 'orange', stats.projects, 'Projects')}
        ${statCard('📝', 'red', stats.applications, 'Applications')}
        ${statCard('🗂', 'yellow', stats.categories, 'Categories')}
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-header"><h2>📢 Announcements</h2><button class="btn btn-primary btn-sm" onclick="nav('announcements')">Manage</button></div><div class="card-body" id="dash-ann">Loading...</div></div>
        <div class="card"><div class="card-header"><h2>📁 Recent Projects</h2></div><div class="card-body" id="dash-proj">Loading...</div></div>
      </div>
    </div>`;
    const [anns, projs] = await Promise.all([GET('/announcements'), GET('/projects')]);
    document.getElementById('dash-ann').innerHTML = anns.slice(0,3).map(a => `
      <div class="ann-item"><h4>${esc(a.title)}</h4>
      ${a.relatedCategory ? `<span class="badge badge-purple" style="font-size:11px">${esc(a.relatedCategory)}</span>` : ''}
      ${a.deadline ? `<span style="font-size:11px;color:var(--danger);margin-left:6px">⏰ ${a.deadline}</span>` : ''}
      </div>`).join('') || '<p class="text-muted">No announcements</p>';
    document.getElementById('dash-proj').innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Title</th><th>Type</th><th>Advisor</th></tr></thead>
      <tbody>${projs.slice(0,5).map(p=>`<tr><td class="fw-bold">${esc(p.title)}</td><td>${typeBadge(p.projectType)}</td><td>${p.advisorAssigned?`<span class="badge badge-green">✓ Assigned</span>`:`<span class="badge badge-yellow">Needed</span>`}</td></tr>`).join('')}</tbody>
    </table></div>`;
    return;
  }

  if (u.role === 'instructor') {
    const [inbox, anns] = await Promise.all([GET('/advisor-requests/inbox'), GET('/announcements')]);
    const pending = inbox.filter(r => r.status === 'pending');
    el.innerHTML = `<div class="page-pad">
      <div class="page-header"><h1>Welcome, ${u.academicTitle||''} ${u.name.split(' ')[0]}! 👋</h1></div>
      <div class="stats-grid">
        ${statCard('📥', 'orange', pending.length, 'Pending Requests')}
        ${statCard('✅', 'green', inbox.filter(r=>r.status==='accepted').length, 'Accepted')}
        ${statCard('📊', 'blue', inbox.length, 'Total Requests')}
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-header"><h2>📥 Pending Requests</h2><button class="btn btn-outline btn-sm" onclick="nav('advisor-inbox')">View All</button></div>
          <div class="card-body">
            ${pending.length === 0 ? '<div class="empty" style="padding:20px"><div class="empty-icon" style="font-size:28px">📭</div><p>No pending requests</p></div>' :
              pending.slice(0,3).map(r => `
                <div class="request-card">
                  <div style="display:flex;align-items:center;gap:10px">
                    ${avt(r.studentName)}
                    <div style="flex:1"><div class="fw-bold">${esc(r.studentName)}</div>
                    <div class="text-sm text-muted">${esc(r.projectTitle)} · ${typeBadge(r.projectType)}</div></div>
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-success btn-sm accept-req" data-id="${r.id}">✓ Accept</button>
                      <button class="btn btn-danger btn-sm reject-req" data-id="${r.id}">✗ Reject</button>
                    </div>
                  </div>
                </div>`).join('')}
          </div>
        </div>
        <div class="card"><div class="card-header"><h2>📢 Announcements</h2></div>
          <div class="card-body">${anns.slice(0,3).map(a => `<div class="ann-item"><h4>${esc(a.title)}</h4>${a.deadline?`<div style="font-size:12px;color:var(--danger)">⏰ Deadline: ${a.deadline}</div>`:''}</div>`).join('')||'<p class="text-muted">No announcements</p>'}</div>
        </div>
      </div>
    </div>`;
    el.querySelectorAll('.accept-req').forEach(btn => btn.addEventListener('click', async () => {
      try { await PATCH(`/advisor-requests/${btn.dataset.id}/accept`); toast('Accepted!', 'success'); renderPage(); } catch (e) { toast(e.message, 'error'); }
    }));
    el.querySelectorAll('.reject-req').forEach(btn => btn.addEventListener('click', async () => {
      try { await PATCH(`/advisor-requests/${btn.dataset.id}/reject`); toast('Rejected', 'info'); renderPage(); } catch (e) { toast(e.message, 'error'); }
    }));
    return;
  }

  // Student
  const [myProjs, myApps, myReqs, anns] = await Promise.all([GET('/projects/my'), GET('/applications/my'), GET('/advisor-requests/my'), GET('/announcements')]);
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>Welcome, ${u.name.split(' ')[0]}! 👋</h1><p>${u.department||''} · ${u.year||''}</p></div>
    <div class="stats-grid">
      ${statCard('📁', 'blue', myProjs.length, 'My Projects')}
      ${statCard('📝', 'green', myApps.length, 'Applications Sent')}
      ${statCard('✅', 'purple', myApps.filter(a=>a.status==='approved').length, 'Approved')}
      ${statCard('📬', 'orange', myReqs.length, 'Advisor Requests')}
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><h2>📁 My Projects</h2><button class="btn btn-primary btn-sm" onclick="openCreateProject()">+ New</button></div>
        <div class="card-body">
          ${myProjs.length === 0
            ? '<div class="empty" style="padding:20px"><div class="empty-icon" style="font-size:28px">📂</div><p>No projects yet</p><button class="btn btn-primary btn-sm mt-2" onclick="openCreateProject()">Create first project</button></div>'
            : myProjs.slice(0,3).map(p=>`<div style="padding:10px 0;border-bottom:1px solid var(--border)">
                <div class="fw-bold text-sm">${esc(p.title)}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                  ${typeBadge(p.projectType)}
                  ${p.advisorAssigned?`<span class="badge badge-green">✓ Advisor</span>`:`<span class="badge badge-yellow">Needs Advisor</span>`}
                  <span class="text-muted" style="font-size:11px">${p.currentMembers}/${p.teamSize} members</span>
                </div>
              </div>`).join('')}
        </div>
      </div>
      <div class="card"><div class="card-header"><h2>📢 Announcements</h2></div>
        <div class="card-body">
          ${anns.slice(0,3).map(a=>`<div class="ann-item">
            <h4>${esc(a.title)}</h4>
            ${a.relatedCategory?`<span class="badge badge-purple" style="font-size:11px">${esc(a.relatedCategory)}</span>`:''}
            ${a.deadline?`<div style="font-size:12px;color:var(--danger);margin-top:4px">⏰ Deadline: ${a.deadline}</div>`:''}
          </div>`).join('')||'<p class="text-muted">No announcements</p>'}
        </div>
      </div>
    </div>
  </div>`;
}

function statCard(icon, color, value, label) {
  return `<div class="stat-card"><div class="stat-icon ${color}">${icon}</div><div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div></div>`;
}

/* ── ANNOUNCEMENTS ─────────────────────────────────────────── */
async function pgAnnouncements(el) {
  const isAdmin = S.user.role === 'admin';
  const data = await GET('/announcements');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
      <div><h1>📢 Announcements</h1><p>${data.length} announcements</p></div>
      ${isAdmin ? `<button class="btn btn-primary" id="new-ann-btn">+ New Announcement</button>` : ''}
    </div>
    ${data.length === 0 ? '<div class="empty"><div class="empty-icon">📭</div><p>No announcements yet</p></div>' :
      data.map(a => `<div class="card mb-3">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;gap:12px">
            <div style="flex:1">
              <h3 style="font-size:16px;font-weight:700;margin-bottom:8px">${esc(a.title)}</h3>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                ${a.relatedCategory ? `<span class="badge badge-purple">${esc(a.relatedCategory)}</span>` : ''}
                ${a.deadline ? `<span class="badge badge-red">⏰ Deadline: ${a.deadline}</span>` : ''}
              </div>
              <p style="color:var(--text2);line-height:1.6;font-size:14px">${esc(a.content)}</p>
              <div style="font-size:12px;color:var(--text3);margin-top:8px">By ${esc(a.authorName)} · ${timeAgo(a.createdAt)}</div>
            </div>
            ${isAdmin ? `<div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm edit-ann" data-id="${a.id}" data-title="${encodeURIComponent(a.title)}" data-content="${encodeURIComponent(a.content)}" data-cat="${encodeURIComponent(a.relatedCategory||'')}" data-deadline="${a.deadline||''}">✏️</button>
              <button class="btn btn-danger btn-sm del-ann" data-id="${a.id}">🗑</button>
            </div>` : ''}
          </div>
        </div>
      </div>`).join('')}
  </div>`;

  document.getElementById('new-ann-btn')?.addEventListener('click', () => openAnnModal());
  el.querySelectorAll('.edit-ann').forEach(btn => btn.addEventListener('click', () =>
    openAnnModal(btn.dataset.id, decodeURIComponent(btn.dataset.title), decodeURIComponent(btn.dataset.content), decodeURIComponent(btn.dataset.cat), btn.dataset.deadline)));
  el.querySelectorAll('.del-ann').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete?')) return;
    try { await DEL(`/announcements/${btn.dataset.id}`); toast('Deleted', 'success'); renderPage(); } catch (e) { toast(e.message, 'error'); }
  }));
}

async function openAnnModal(id=null, title='', content='', cat='', deadline='') {
  const cats = await GET('/categories');
  modal(`<div class="modal-head"><h2>${id?'Edit':'New'} Announcement</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Title *</label><input id="ann-t" value="${esc(title)}" placeholder="Announcement title"/></div>
    <div class="form-group"><label>Content *</label><textarea id="ann-c" rows="4">${esc(content)}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Related Category</label>
        <select id="ann-cat">
          <option value="">-- Select --</option>
          ${cats.map(c=>`<option value="${esc(c.name)}" ${c.name===cat?'selected':''}>${esc(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Deadline Date</label><input type="date" id="ann-dl" value="${deadline}"/></div>
    </div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="ann-save">${id?'Update':'Publish'}</button></div>`);
  document.getElementById('ann-save').addEventListener('click', async () => {
    const t = document.getElementById('ann-t').value.trim();
    const c = document.getElementById('ann-c').value.trim();
    if (!t || !c) { toast('Title and content required', 'error'); return; }
    const payload = { title: t, content: c, relatedCategory: document.getElementById('ann-cat').value, deadline: document.getElementById('ann-dl').value };
    try {
      if (id) await PUT(`/announcements/${id}`, payload); else await POST('/announcements', payload);
      closeModal(); toast(id?'Updated!':'Published!', 'success'); renderPage();
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ── BROWSE PROJECTS ────────────────────────────────────────── */
async function pgProjectsBrowse(el) {
  const projects = await GET('/projects');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>🔍 Browse Projects</h1><p>Find a project to join</p></div>
    <div class="search-bar">
      <div class="search-input-wrap"><span class="search-icon">🔍</span><input id="proj-q" placeholder="Search by title, skills..." /></div>
      <select id="proj-type" class="filter-select">
        <option value="">All Types</option>
        <option value="Course Project">Course Project</option>
        <option value="TÜBİTAK Student Project">TÜBİTAK Student Project</option>
        <option value="Teknofest Student Project">Teknofest Student Project</option>
      </select>
    </div>
    <div id="proj-grid" class="projects-grid">${renderProjectCards(projects, el)}</div>
  </div>`;
  const filter = () => {
    const q = document.getElementById('proj-q').value.toLowerCase();
    const type = document.getElementById('proj-type').value;
    let f = projects;
    if (q) f = f.filter(p => p.title.toLowerCase().includes(q) || (p.requiredSkills||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
    if (type) f = f.filter(p => p.projectType === type);
    document.getElementById('proj-grid').innerHTML = renderProjectCards(f, el);
    attachProjectListeners(el);
  };
  document.getElementById('proj-q').addEventListener('input', filter);
  document.getElementById('proj-type').addEventListener('change', filter);
  attachProjectListeners(el);
}

function renderProjectCards(projects, container) {
  if (!projects.length) return '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📂</div><p>No projects found</p></div>';
  return projects.map(p => {
    const isOwner = p.ownerId === S.user?.id;
    const pct = Math.round(((p.currentMembers||1) / (p.teamSize||4)) * 100);
    const roles = p.rolesNeeded ? p.rolesNeeded.split(',') : [];
    return `<div class="project-card">
      <div class="project-card-body">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:10px">
          ${typeBadge(p.projectType)}
          ${p.advisorAssigned ? `<span class="badge badge-green">✓ Advisor Assigned</span>` : `<span class="badge badge-yellow">Needs Advisor</span>`}
        </div>
        <h3 class="project-title">${esc(p.title)}</h3>
        <p class="project-desc">${esc(p.description)}</p>
        ${p.requiredSkills ? `<div style="margin-top:8px">${p.requiredSkills.split(',').map(s=>`<span class="tag">${esc(s.trim())}</span>`).join('')}</div>` : ''}
        ${roles.length ? `<div style="margin-top:8px;font-size:12px;color:var(--text2)"><strong>Roles needed:</strong> ${roles.map(r=>`<span class="tag" style="background:var(--primary-light);color:var(--primary)">${esc(r.trim())}</span>`).join('')}</div>` : ''}
        ${p.budget ? `<div style="font-size:12px;color:var(--success);margin-top:6px">💰 Budget: ${esc(p.budget)}</div>` : ''}
      </div>
      <div style="padding:0 16px 12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:4px"><span>Team: ${p.currentMembers||1}/${p.teamSize||4}</span><span>${pct}%</span></div>
        <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="project-card-footer">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)">${avt(p.ownerName,'avatar-xs')}<span>${esc(p.ownerName)}</span></div>
        <div style="display:flex;gap:6px">
          ${!isOwner && S.user?.role === 'student' && (p.currentMembers||1) < (p.teamSize||4)
            ? `<button class="btn btn-primary btn-sm apply-btn" data-id="${p.id}" data-title="${encodeURIComponent(p.title)}" data-roles="${encodeURIComponent(p.rolesNeeded||'')}">Apply</button>`
            : isOwner ? `<span class="badge badge-gray">Your project</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function attachProjectListeners(container) {
  container.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', () => openApplyModal(btn.dataset.id, decodeURIComponent(btn.dataset.title), decodeURIComponent(btn.dataset.roles)));
  });
}

function openApplyModal(projectId, title, rolesStr) {
  const roles = rolesStr ? rolesStr.split(',').filter(Boolean) : [];
  modal(`<div class="modal-head"><h2>Apply to Project</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="alert alert-info">📁 <strong>${esc(title)}</strong></div>
    ${roles.length ? `<div class="form-group"><label>Role Applying For *</label>
      <select id="apply-role">
        <option value="">-- Select a role --</option>
        ${roles.map(r=>`<option value="${esc(r.trim())}">${esc(r.trim())}</option>`).join('')}
      </select>
    </div>` : ''}
    <div class="form-group"><label>Message to Project Owner</label><textarea id="apply-msg" rows="3" placeholder="Why do you want to join? What can you bring to the team?"></textarea></div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="apply-submit">Submit Application</button></div>`);
  document.getElementById('apply-submit').addEventListener('click', async () => {
    const roleEl = document.getElementById('apply-role');
    const roleApplied = roleEl ? roleEl.value : '';
    const message = document.getElementById('apply-msg').value.trim();
    if (roleEl && !roleApplied) { toast('Please select a role', 'error'); return; }
    try { await POST('/applications', { projectId: Number(projectId), roleApplied, message }); closeModal(); toast('Application submitted!', 'success'); }
    catch (e) { toast(e.message, 'error'); }
  });
}

/* ── MY PROJECTS ────────────────────────────────────────────── */
async function pgProjectsMine(el) {
  const projects = await GET('/projects/my');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
      <div><h1>📁 My Projects</h1><p>${projects.length} project(s)</p></div>
      <button class="btn btn-primary" onclick="openCreateProject()">+ Create Project</button>
    </div>
    ${projects.length === 0
      ? '<div class="empty"><div class="empty-icon">📂</div><p>No projects yet</p><button class="btn btn-primary mt-2" onclick="openCreateProject()">Create your first project</button></div>'
      : `<div class="projects-grid">${projects.map(p => renderMyProjectCard(p)).join('')}</div>`}
  </div>`;
  el.querySelectorAll('.view-apps').forEach(btn => btn.addEventListener('click', () => openAppsModal(btn.dataset.id)));
  el.querySelectorAll('.del-proj').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete project?')) return;
    try { await DEL(`/projects/${btn.dataset.id}`); toast('Deleted', 'success'); renderPage(); } catch (e) { toast(e.message, 'error'); }
  }));
  el.querySelectorAll('.find-adv-btn').forEach(btn => btn.addEventListener('click', () => nav('find-instructor')));
}

function renderMyProjectCard(p) {
  const roles = p.rolesNeeded ? p.rolesNeeded.split(',').filter(Boolean) : [];
  return `<div class="project-card">
    <div class="project-card-body">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
        ${typeBadge(p.projectType)}
        ${p.advisorAssigned ? `<span class="badge badge-green">✓ ${esc(p.advisorName)}</span>` : `<span class="badge badge-yellow">No Advisor</span>`}
      </div>
      <h3 class="project-title">${esc(p.title)}</h3>
      <p class="project-desc">${esc(p.description)}</p>
      ${p.requiredSkills ? `<div style="margin-top:6px">${p.requiredSkills.split(',').map(s=>`<span class="tag">${esc(s.trim())}</span>`).join('')}</div>` : ''}
      ${roles.length ? `<div style="margin-top:6px;font-size:12px;color:var(--text2)">Roles: ${roles.map(r=>`<span class="tag" style="background:var(--primary-light);color:var(--primary)">${esc(r.trim())}</span>`).join('')}</div>` : ''}
      ${p.budget ? `<div style="font-size:12px;color:var(--success);margin-top:4px">💰 ${esc(p.budget)}</div>` : ''}
    </div>
    <div class="project-card-footer" style="flex-wrap:wrap;gap:6px">
      <span class="text-sm text-muted">Team: ${p.currentMembers||1}/${p.teamSize||4}</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm view-apps" data-id="${p.id}">📝 Applications</button>
        ${!p.advisorAssigned ? `<button class="btn btn-primary btn-sm find-adv-btn" data-id="${p.id}">Find Advisor</button>` : ''}
        <button class="btn btn-danger btn-sm del-proj" data-id="${p.id}">🗑</button>
      </div>
    </div>
  </div>`;
}

async function openAppsModal(projectId) {
  modal(`<div class="modal-head"><h2>Project Applications</h2><button class="modal-close" data-close>✕</button></div><div class="modal-body" id="apps-body">Loading...</div>`);
  const apps = await GET(`/projects/${projectId}/applications`);
  const body = document.getElementById('apps-body');
  if (!apps.length) { body.innerHTML = '<div class="empty" style="padding:20px"><p>No applications yet</p></div>'; return; }
  body.innerHTML = apps.map(a => `
    <div class="request-card">
      <div style="display:flex;align-items:center;gap:12px">
        ${avt(a.applicantName)}
        <div style="flex:1">
          <div class="fw-bold">${esc(a.applicantName)}</div>
          ${a.roleApplied ? `<div class="text-sm" style="color:var(--primary)">Applying for: ${esc(a.roleApplied)}</div>` : ''}
          ${a.message ? `<div class="text-sm text-muted">"${esc(a.message)}"</div>` : ''}
          ${a.applicant ? `<div class="text-sm text-muted">${esc(a.applicant.department||'')} · ${esc(a.applicant.year||'')} · Skills: ${esc(a.applicant.skills||'')}</div>` : ''}
        </div>
        <span class="badge badge-${a.status==='approved'?'green':a.status==='rejected'?'red':'yellow'}">${a.status}</span>
        ${a.status === 'pending' ? `<div style="display:flex;gap:6px">
          <button class="btn btn-success btn-sm app-approve" data-id="${a.id}">✓</button>
          <button class="btn btn-danger btn-sm app-reject" data-id="${a.id}">✗</button>
        </div>` : ''}
      </div>
    </div>`).join('');
  body.querySelectorAll('.app-approve').forEach(btn => btn.addEventListener('click', async () => {
    try { await PATCH(`/applications/${btn.dataset.id}/approve`); toast('Approved!', 'success'); closeModal(); } catch (e) { toast(e.message, 'error'); }
  }));
  body.querySelectorAll('.app-reject').forEach(btn => btn.addEventListener('click', async () => {
    try { await PATCH(`/applications/${btn.dataset.id}/reject`); toast('Rejected', 'info'); closeModal(); } catch (e) { toast(e.message, 'error'); }
  }));
}

async function openCreateProject() {
  modal(`<div class="modal-head"><h2>Create New Project</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Project Title *</label><input id="pt" placeholder="e.g. AI-Powered Campus App"/></div>
    <div class="form-group"><label>Project Type *</label>
      <select id="ptype">
        <option value="">-- Select Type --</option>
        <option value="Course Project">Course Project</option>
        <option value="TÜBİTAK Student Project">TÜBİTAK Student Project</option>
        <option value="Teknofest Student Project">Teknofest Student Project</option>
      </select>
    </div>
    <div class="form-group"><label>Description *</label><textarea id="pd" rows="3" placeholder="Describe your project..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Team Size</label><input type="number" id="pts" value="4" min="1" max="10"/></div>
      <div class="form-group"><label>Budget (optional)</label><input id="pb" placeholder="e.g. ₺15,000"/></div>
    </div>
    <div class="form-group"><label>Required Skills (comma-separated)</label><input id="psk" placeholder="React, Node.js, Python..."/></div>
    <div class="form-group"><label>Roles Needed (comma-separated)</label><input id="pr" placeholder="Frontend Developer, Backend Developer, Designer..."/></div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="create-proj-btn">Create Project</button></div>`);
  document.getElementById('create-proj-btn').addEventListener('click', async () => {
    const title = document.getElementById('pt').value.trim();
    const projectType = document.getElementById('ptype').value;
    const description = document.getElementById('pd').value.trim();
    if (!title || !projectType || !description) { toast('Title, type and description are required', 'error'); return; }
    try {
      await POST('/projects', { title, projectType, description, teamSize: document.getElementById('pts').value, budget: document.getElementById('pb').value.trim(), requiredSkills: document.getElementById('psk').value.trim(), rolesNeeded: document.getElementById('pr').value.trim() });
      closeModal(); toast('Project created!', 'success'); nav('projects-mine');
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ── FIND INSTRUCTOR ────────────────────────────────────────── */
async function pgFindInstructor(el) {
  const myProjects = await GET('/projects/my');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>👩‍🏫 Find an Instructor</h1><p>Search by department, expertise or availability</p></div>
    <div class="search-bar">
      <div class="search-input-wrap"><span class="search-icon">🔍</span><input id="inst-q" placeholder="Search by name, department, expertise..."/></div>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--text2);white-space:nowrap">
        <input type="checkbox" id="avail-filter"/> Available only
      </label>
    </div>
    <div id="inst-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">Loading...</div>
  </div>`;

  async function loadInstructors() {
    const q = document.getElementById('inst-q').value.trim();
    const avail = document.getElementById('avail-filter').checked;
    let url = `/users/instructors?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (avail) url += `available=true`;
    const instructors = await GET(url);
    const grid = document.getElementById('inst-grid');
    if (!instructors.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">👩‍🏫</div><p>No instructors found</p></div>'; return; }
    grid.innerHTML = instructors.map(i => `
      <div class="card" style="padding:20px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
          ${avt(i.name, 'avatar-lg')}
          <div>
            <div class="fw-bold" style="font-size:15px">${esc(i.academicTitle||'')} ${esc(i.name)}</div>
            <div class="text-sm text-muted">${esc(i.department||'')}</div>
            <div style="margin-top:4px">
              <span class="badge ${i.availableForAdvising===true||i.availableForAdvising==='true' ? 'badge-green' : 'badge-red'}" style="font-size:11px">
                ${i.availableForAdvising===true||i.availableForAdvising==='true' ? '✓ Available' : '✗ Unavailable'}
              </span>
            </div>
          </div>
        </div>
        ${i.expertise ? `<div style="margin-bottom:8px">${i.expertise.split(',').map(s=>`<span class="tag">${esc(s.trim())}</span>`).join('')}</div>` : ''}
        ${i.researchInterests ? `<div class="text-sm text-muted" style="margin-bottom:8px">🔬 ${esc(i.researchInterests)}</div>` : ''}
        ${i.supervisedTypes ? `<div class="text-sm text-muted" style="margin-bottom:10px">📋 Supervises: ${esc(i.supervisedTypes)}</div>` : ''}
        ${i.about ? `<div class="text-sm text-muted" style="margin-bottom:12px">${esc(i.about)}</div>` : ''}
        ${myProjects.length > 0 && (i.availableForAdvising===true||i.availableForAdvising==='true')
          ? `<button class="btn btn-primary btn-sm" style="width:100%" onclick="openAdvisorReqModal(${i.id},'${encodeURIComponent(i.name)}')">📬 Send Advisor Request</button>`
          : myProjects.length === 0 ? `<div class="alert alert-info" style="font-size:12px;padding:8px 12px">Create a project first to send requests</div>`
          : `<div class="alert alert-error" style="font-size:12px;padding:8px 12px">Not available for advising</div>`}
      </div>`).join('');
  }
  await loadInstructors();
  document.getElementById('inst-q').addEventListener('input', () => { clearTimeout(window._it); window._it = setTimeout(loadInstructors, 300); });
  document.getElementById('avail-filter').addEventListener('change', loadInstructors);
}

window.openAdvisorReqModal = async function(instructorId, nameEnc) {
  const name = decodeURIComponent(nameEnc);
  const myProjects = await GET('/projects/my');
  const noAdvisor = myProjects.filter(p => !p.advisorAssigned);
  modal(`<div class="modal-head"><h2>Send Advisor Request</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="alert alert-info">👩‍🏫 To: <strong>${esc(name)}</strong></div>
    <div class="form-group"><label>Select Project *</label>
      <select id="req-proj">
        <option value="">-- Choose project --</option>
        ${noAdvisor.map(p=>`<option value="${p.id}">${esc(p.title)} (${esc(p.projectType)})</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Message</label><textarea id="req-msg" rows="3" placeholder="Explain your project and why you'd like this instructor..."></textarea></div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="req-send">Send Request</button></div>`);
  document.getElementById('req-send').addEventListener('click', async () => {
    const projectId = document.getElementById('req-proj').value;
    if (!projectId) { toast('Please select a project', 'error'); return; }
    const message = document.getElementById('req-msg').value.trim();
    try { await POST('/advisor-requests', { instructorId, projectId: Number(projectId), message }); closeModal(); toast('Request sent!', 'success'); }
    catch (e) { toast(e.message, 'error'); }
  });
};

/* ── MY APPLICATIONS ────────────────────────────────────────── */
async function pgMyApplications(el) {
  const apps = await GET('/applications/my');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>📝 My Applications</h1><p>${apps.length} application(s)</p></div>
    ${apps.length === 0
      ? '<div class="empty"><div class="empty-icon">📭</div><p>No applications yet</p><button class="btn btn-primary mt-2" onclick="nav(\'projects-browse\')">Browse Projects</button></div>'
      : `<div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Project</th><th>Type</th><th>Role Applied</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${apps.map(a=>`<tr>
            <td class="fw-bold">${esc(a.projectTitle)}</td>
            <td>${typeBadge(a.projectType)}</td>
            <td class="text-sm text-muted">${esc(a.roleApplied||'—')}</td>
            <td><span class="badge badge-${a.status==='approved'?'green':a.status==='rejected'?'red':'yellow'}">${a.status}</span></td>
            <td class="text-sm text-muted">${new Date(a.createdAt).toLocaleDateString()}</td>
          </tr>`).join('')}</tbody>
        </table></div></div>`}
  </div>`;
}

/* ── MY ADVISOR REQUESTS ────────────────────────────────────── */
async function pgMyAdvisorRequests(el) {
  const reqs = await GET('/advisor-requests/my');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>📬 My Advisor Requests</h1><p>Requests you've sent to instructors</p></div>
    ${reqs.length === 0
      ? '<div class="empty"><div class="empty-icon">📭</div><p>No requests sent yet</p><button class="btn btn-primary mt-2" onclick="nav(\'find-instructor\')">Find an Instructor</button></div>'
      : `<div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Instructor</th><th>Project</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${reqs.map(r=>`<tr>
            <td class="fw-bold">${esc(r.instructorName)}</td>
            <td>${esc(r.projectTitle)}</td>
            <td>${typeBadge(r.projectType)}</td>
            <td><span class="badge badge-${r.status==='accepted'?'green':r.status==='rejected'?'red':'yellow'}">${r.status}</span></td>
            <td class="text-sm text-muted">${new Date(r.createdAt).toLocaleDateString()}</td>
          </tr>`).join('')}</tbody>
        </table></div></div>`}
  </div>`;
}

/* ── ADVISOR INBOX ──────────────────────────────────────────── */
async function pgAdvisorInbox(el) {
  const reqs = await GET('/advisor-requests/inbox');
  const pending = reqs.filter(r => r.status === 'pending');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>📥 Student Requests</h1><p>${pending.length} pending</p></div>
    ${reqs.length === 0 ? '<div class="empty"><div class="empty-icon">📭</div><p>No requests yet</p></div>' :
      reqs.map(r => `<div class="card mb-3" style="margin-bottom:14px">
        <div class="card-body">
          <div style="display:flex;align-items:flex-start;gap:14px">
            ${avt(r.studentName, 'avatar-lg')}
            <div style="flex:1">
              <div class="fw-bold" style="font-size:15px">${esc(r.studentName)}</div>
              <div class="text-sm text-muted" style="margin-top:2px">Project: <strong>${esc(r.projectTitle)}</strong></div>
              <div style="margin-top:6px">${typeBadge(r.projectType)}</div>
              ${r.message ? `<div style="margin-top:10px;padding:10px 14px;background:var(--bg);border-radius:6px;border-left:3px solid var(--primary);font-size:13px;color:var(--text2)">"${esc(r.message)}"</div>` : ''}
              <div class="text-sm text-muted" style="margin-top:6px">${timeAgo(r.createdAt)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
              <span class="badge badge-${r.status==='accepted'?'green':r.status==='rejected'?'red':'yellow'}">${r.status}</span>
              ${r.status==='pending' ? `<div style="display:flex;gap:6px">
                <button class="btn btn-success btn-sm accept-req" data-id="${r.id}">✓ Accept</button>
                <button class="btn btn-danger btn-sm reject-req" data-id="${r.id}">✗ Reject</button>
              </div>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('')}
  </div>`;
  el.querySelectorAll('.accept-req').forEach(btn => btn.addEventListener('click', async () => {
    try { await PATCH(`/advisor-requests/${btn.dataset.id}/accept`); toast('Accepted!', 'success'); renderPage(); } catch (e) { toast(e.message, 'error'); }
  }));
  el.querySelectorAll('.reject-req').forEach(btn => btn.addEventListener('click', async () => {
    try { await PATCH(`/advisor-requests/${btn.dataset.id}/reject`); toast('Rejected', 'info'); renderPage(); } catch (e) { toast(e.message, 'error'); }
  }));
}

/* ── PROFILE ────────────────────────────────────────────────── */
async function pgProfile(el) {
  const user = await GET('/users/me');
  const isStudent = user.role === 'student';
  const isInstructor = user.role === 'instructor';
  el.innerHTML = `<div class="page-pad" style="max-width:800px">
    <div class="page-header"><h1>👤 My Profile</h1></div>
    <div class="card mb-3" style="margin-bottom:16px">
      <div style="height:80px;background:linear-gradient(135deg,#6366f1,#0A66C2);border-radius:var(--radius) var(--radius) 0 0)"></div>
      <div style="padding:0 24px 20px">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:-28px;margin-bottom:12px">
          ${avt(user.name, 'avatar-xl')}
        </div>
        <div style="font-size:20px;font-weight:700">${esc(user.academicTitle||'')} ${esc(user.name)}</div>
        <div style="color:var(--text2);margin-top:2px">${esc(user.department||'')}${user.year?` · ${esc(user.year)}`:''}</div>
        <div style="margin-top:6px"><span class="badge badge-blue">${esc(user.role)}</span></div>
        ${user.githubLink ? `<div style="margin-top:6px"><a href="${esc(user.githubLink)}" target="_blank" style="font-size:13px">🔗 GitHub</a></div>` : ''}
        ${user.linkedinLink ? `<div style="margin-top:4px"><a href="${esc(user.linkedinLink)}" target="_blank" style="font-size:13px">💼 LinkedIn</a></div>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h2>Edit Profile</h2></div>
      <div class="card-body">
        <div class="form-group"><label>Full Name</label><input id="pf-name" value="${esc(user.name)}"/></div>
        <div class="form-row">
          <div class="form-group"><label>Department</label><input id="pf-dept" value="${esc(user.department||'')}"/></div>
          ${isStudent ? `<div class="form-group"><label>Year</label>
            <select id="pf-year">
              ${['1st Year','2nd Year','3rd Year','4th Year'].map(y=>`<option ${user.year===y?'selected':''}>${y}</option>`).join('')}
            </select>
          </div>` : ''}
          ${isInstructor ? `<div class="form-group"><label>Academic Title</label>
            <select id="pf-title">
              ${['Dr.','Assoc. Prof.','Prof.','Lecturer'].map(t=>`<option ${user.academicTitle===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>` : ''}
        </div>
        <div class="form-group"><label>About / Bio</label><textarea id="pf-about" rows="3">${esc(user.about||'')}</textarea></div>
        ${isStudent ? `
          <div class="form-group"><label>Technical Skills (comma-separated)</label><input id="pf-skills" value="${esc(user.skills||'')}" placeholder="React, Node.js, Python..."/></div>
          <div class="form-group"><label>Interests</label><input id="pf-interests" value="${esc(user.interests||'')}" placeholder="Web Development, AI, Mobile..."/></div>
          <div class="form-row">
            <div class="form-group"><label>GitHub Link</label><input id="pf-github" value="${esc(user.githubLink||'')}" placeholder="https://github.com/..."/></div>
            <div class="form-group"><label>LinkedIn Link</label><input id="pf-linkedin" value="${esc(user.linkedinLink||'')}" placeholder="https://linkedin.com/in/..."/></div>
          </div>` : ''}
        ${isInstructor ? `
          <div class="form-group"><label>Areas of Expertise (comma-separated)</label><input id="pf-exp" value="${esc(user.expertise||'')}" placeholder="AI, Software Engineering..."/></div>
          <div class="form-group"><label>Research Interests</label><input id="pf-research" value="${esc(user.researchInterests||'')}" placeholder="Deep Learning, NLP..."/></div>
          <div class="form-group"><label>Previously Supervised Project Types</label><input id="pf-types" value="${esc(user.supervisedTypes||'')}" placeholder="Course Project, TÜBİTAK..."/></div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="pf-available" ${user.availableForAdvising===true||user.availableForAdvising==='true'?'checked':''}/>
              Available for Advising (Active)
            </label>
          </div>` : ''}
        <button class="btn btn-primary" id="save-profile">Save Changes</button>
      </div>
    </div>
  </div>`;

  document.getElementById('save-profile').addEventListener('click', async () => {
    const update = {
      name: document.getElementById('pf-name').value.trim(),
      department: document.getElementById('pf-dept').value.trim(),
      about: document.getElementById('pf-about').value.trim(),
    };
    if (isStudent) {
      update.year = document.getElementById('pf-year').value;
      update.skills = document.getElementById('pf-skills').value.trim();
      update.interests = document.getElementById('pf-interests').value.trim();
      update.githubLink = document.getElementById('pf-github').value.trim();
      update.linkedinLink = document.getElementById('pf-linkedin').value.trim();
    }
    if (isInstructor) {
      update.academicTitle = document.getElementById('pf-title').value;
      update.expertise = document.getElementById('pf-exp').value.trim();
      update.researchInterests = document.getElementById('pf-research').value.trim();
      update.supervisedTypes = document.getElementById('pf-types').value.trim();
      update.availableForAdvising = document.getElementById('pf-available').checked;
    }
    try {
      await PATCH('/users/me', update);
      Object.assign(S.user, update);
      localStorage.setItem('al_user', JSON.stringify(S.user));
      toast('Profile updated!', 'success'); renderPage();
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ── ADMIN: USERS ────────────────────────────────────────────── */
async function pgAdminUsers(el) {
  const users = await GET('/admin/users');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>👥 User Management</h1><p>${users.length} users</p></div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${users.map(u => `<tr>
        <td><div style="display:flex;align-items:center;gap:8px">${avt(u.name,'avatar-xs')}<span class="fw-bold">${esc(u.name)}</span></div></td>
        <td class="text-muted">${esc(u.email)}</td>
        <td><span class="badge badge-${u.role==='admin'?'red':u.role==='instructor'?'purple':'blue'}">${esc(u.role)}</span></td>
        <td class="text-sm text-muted">${esc(u.department||'—')}</td>
        <td><span class="badge badge-${u.status==='active'?'green':'red'}">${u.status||'active'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            ${u.role !== 'admin' ? `<button class="btn btn-secondary btn-sm change-role" data-id="${u.id}" data-role="${u.role}">Change Role</button>` : ''}
            ${u.role !== 'admin' ? `<button class="btn btn-${u.status==='active'?'danger':'success'} btn-sm toggle-status" data-id="${u.id}" data-status="${u.status||'active'}">${u.status==='active'?'Deactivate':'Activate'}</button>` : ''}
          </div>
        </td>
      </tr>`).join('')}</tbody>
    </table></div></div>
  </div>`;

  el.querySelectorAll('.change-role').forEach(btn => {
    btn.addEventListener('click', () => {
      const roles = ['student', 'instructor'];
      const cur = btn.dataset.role;
      modal(`<div class="modal-head"><h2>Change Role</h2><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <div class="form-group"><label>New Role</label>
          <select id="new-role">${roles.map(r=>`<option value="${r}" ${r===cur?'selected':''}>${r}</option>`).join('')}</select>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="save-role">Save</button></div>`);
      document.getElementById('save-role').addEventListener('click', async () => {
        const role = document.getElementById('new-role').value;
        try { await PATCH(`/admin/users/${btn.dataset.id}/role`, { role }); closeModal(); toast('Role updated!', 'success'); renderPage(); }
        catch (e) { toast(e.message, 'error'); }
      });
    });
  });

  el.querySelectorAll('.toggle-status').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.status === 'active' ? 'inactive' : 'active';
      if (!confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} this user?`)) return;
      try { await PATCH(`/admin/users/${btn.dataset.id}/status`, { status: newStatus }); toast('Status updated!', 'success'); renderPage(); }
      catch (e) { toast(e.message, 'error'); }
    });
  });
}

/* ── ADMIN: CATEGORIES ──────────────────────────────────────── */
async function pgAdminCategories(el) {
  const cats = await GET('/categories');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
      <div><h1>🗂 Project Categories</h1><p>${cats.length} categories</p></div>
      <button class="btn btn-primary" id="add-cat">+ Add Category</button>
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
      <tbody>${cats.map(c=>`<tr>
        <td class="fw-bold">${esc(c.name)}</td>
        <td class="text-muted text-sm">${esc(c.description||'—')}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm edit-cat" data-id="${c.id}" data-name="${encodeURIComponent(c.name)}" data-desc="${encodeURIComponent(c.description||'')}">✏️ Edit</button>
          <button class="btn btn-danger btn-sm del-cat" data-id="${c.id}">🗑</button>
        </div></td>
      </tr>`).join('')}</tbody>
    </table></div></div>
  </div>`;
  document.getElementById('add-cat').addEventListener('click', () => openCatModal());
  el.querySelectorAll('.edit-cat').forEach(btn => btn.addEventListener('click', () =>
    openCatModal(btn.dataset.id, decodeURIComponent(btn.dataset.name), decodeURIComponent(btn.dataset.desc))));
  el.querySelectorAll('.del-cat').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this category?')) return;
    try { await DEL(`/categories/${btn.dataset.id}`); toast('Deleted', 'success'); renderPage(); } catch (e) { toast(e.message, 'error'); }
  }));
}

function openCatModal(id=null, name='', desc='') {
  modal(`<div class="modal-head"><h2>${id?'Edit':'Add'} Category</h2><button class="modal-close" data-close>✕</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Category Name *</label><input id="cat-n" value="${esc(name)}" placeholder="e.g. TÜBİTAK Student Project"/></div>
    <div class="form-group"><label>Description</label><textarea id="cat-d" rows="2">${esc(desc)}</textarea></div>
  </div>
  <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="cat-save">${id?'Update':'Create'}</button></div>`);
  document.getElementById('cat-save').addEventListener('click', async () => {
    const n = document.getElementById('cat-n').value.trim();
    if (!n) { toast('Name required', 'error'); return; }
    try {
      if (id) await PUT(`/categories/${id}`, { name: n, description: document.getElementById('cat-d').value.trim() });
      else await POST('/categories', { name: n, description: document.getElementById('cat-d').value.trim() });
      closeModal(); toast(id?'Updated!':'Created!', 'success'); renderPage();
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ── ADMIN: ALL PROJECTS ────────────────────────────────────── */
async function pgAdminProjects(el) {
  const projects = await GET('/projects');
  el.innerHTML = `<div class="page-pad">
    <div class="page-header"><h1>📁 All Projects</h1><p>${projects.length} projects</p></div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Title</th><th>Type</th><th>Owner</th><th>Advisor</th><th>Team</th><th>Actions</th></tr></thead>
      <tbody>${projects.map(p=>`<tr>
        <td class="fw-bold">${esc(p.title)}</td>
        <td>${typeBadge(p.projectType)}</td>
        <td>${esc(p.ownerName)}</td>
        <td>${p.advisorAssigned?`<span class="badge badge-green">✓ ${esc(p.advisorName)}</span>`:`<span class="badge badge-yellow">None</span>`}</td>
        <td>${p.currentMembers||1}/${p.teamSize||4}</td>
        <td><button class="btn btn-danger btn-sm del-proj" data-id="${p.id}">🗑</button></td>
      </tr>`).join('')}</tbody>
    </table></div></div>
  </div>`;
  el.querySelectorAll('.del-proj').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete project?')) return;
    try { await DEL(`/projects/${btn.dataset.id}`); toast('Deleted', 'success'); renderPage(); } catch (e) { toast(e.message, 'error'); }
  }));
}

/* ── INIT ───────────────────────────────────────────────────── */
applyTheme(localStorage.getItem('theme') || 'dark');
if (initAuth()) render(); else render();
