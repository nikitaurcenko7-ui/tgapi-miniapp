const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#131313');
  tg.setBackgroundColor('#0e0e0e');
}

const OWNER_IDS = ['713635428', '1043964303'];
const REQUIRED_CHANNEL_URL = 'https://t.me/StandrankingSCS';
const REQUIRED_CHANNEL_NAME = '@StandrankingSCS';

// Для настоящей проверки подписки сюда нужен endpoint backend-а.
// Backend должен проверить initData Telegram и вызвать Bot API getChatMember.
const SUBSCRIPTION_CHECK_URL = '';

const ASSETS = {
  bg: './design-assets/Content.svg',
  banner: './design-assets/Баннер турнира.svg',
  menu: './design-assets/Меню.svg',
  adminButton: './design-assets/Button admin.svg',
};

const icons = {
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H5a2 2 0 0 0 0 4h2"/><path d="M17 6h2a2 2 0 0 1 0 4h-2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  back: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
};

const seedTournaments = [
  {
    id: 't1',
    title: 'Epic Championship',
    subtitle: 'Главный турнир недели',
    status: 'active',
  },
  {
    id: 't2',
    title: 'Major Qualifier',
    subtitle: 'Отборочные матчи',
    status: 'active',
  },
];

const seedMatches = [
  {
    id: 'm1',
    tournamentId: 't1',
    teamA: 'Saints',
    teamB: 'Elevate',
    time: '18:00',
    date: 'Сегодня',
    format: 'BO3',
    pick: 'Победа Elevate',
    coefficient: '2.10',
    confidence: 74,
    status: 'live',
    score: '1:1',
    result: 'Ожидается',
    text: 'Elevate стабильнее играет поздние раунды и лучше закрывает карты после сильного старта.',
  },
  {
    id: 'm2',
    tournamentId: 't1',
    teamA: 'Saints',
    teamB: 'Vortex',
    time: '19:00',
    date: 'Сегодня',
    format: 'BO3',
    pick: 'Тотал больше 2.5',
    coefficient: '1.86',
    confidence: 68,
    status: 'open',
    score: '-',
    result: 'Не начался',
    text: 'Обе команды часто размениваются картами, поэтому тотал выглядит надежнее выбора победителя.',
  },
  {
    id: 'm3',
    tournamentId: 't2',
    teamA: 'Borz',
    teamB: 'Format',
    time: '21:00',
    date: 'Сегодня',
    format: 'BO3',
    pick: 'Фора Format +1.5',
    coefficient: '1.72',
    confidence: 81,
    status: 'open',
    score: '-',
    result: 'Не начался',
    text: 'Format хорошо держит свой пик и редко проваливается по экономике.',
  },
];

const statusLabels = {
  open: 'Открыт',
  live: 'Live',
  finished: 'Завершен',
  cancelled: 'Отмена',
};

const state = {
  view: 'tournaments',
  selectedTournamentId: 't1',
  selectedMatchId: null,
  editTournamentId: null,
  editMatchId: null,
  adminSection: 'dashboard',
  toast: '',
  checkingSubscription: false,
};

const app = document.querySelector('#app');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readJson(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return structuredClone(fallback);
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return structuredClone(fallback);
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readTournaments() {
  return readJson('tgapi.tournaments.v1', seedTournaments);
}

function saveTournaments(tournaments) {
  saveJson('tgapi.tournaments.v1', tournaments);
}

function readMatches() {
  return readJson('tgapi.matches.v3', seedMatches);
}

function saveMatches(matches) {
  saveJson('tgapi.matches.v3', matches);
}

function readAdmins() {
  return readJson('tgapi.admins', []);
}

function saveAdmins(admins) {
  saveJson('tgapi.admins', admins);
}

function currentUser() {
  const user = tg?.initDataUnsafe?.user;
  const search = new URLSearchParams(window.location.search);
  const fallbackId = search.get('user_id') || '';
  const fallbackUsername = search.get('username') || '';

  return {
    id: user?.id ? String(user.id) : fallbackId,
    name: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : 'Demo User',
    username: user?.username ? `@${user.username}` : fallbackUsername ? `@${fallbackUsername.replace(/^@/, '')}` : '@telegram_user',
    initials: user?.first_name?.slice(0, 1)?.toUpperCase() || 'D',
  };
}

function normalizeAdminValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return { type: 'id', value: raw };
  if (/^@[a-zA-Z0-9_]{5,32}$/.test(raw)) return { type: 'username', value: raw.toLowerCase() };
  return null;
}

function isOwner() {
  return OWNER_IDS.includes(currentUser().id);
}

function isAdmin() {
  const user = currentUser();
  const username = user.username.toLowerCase();

  if (OWNER_IDS.includes(user.id)) return true;
  return readAdmins().some((admin) => {
    if (admin.type === 'id') return admin.value === user.id;
    if (admin.type === 'username') return admin.value === username;
    return false;
  });
}

function hasChannelAccess() {
  if (isAdmin()) return true;
  return localStorage.getItem('tgapi.channelVerified.v1') === 'true';
}

function showToast(text) {
  state.toast = text;
  render();
  window.setTimeout(() => {
    state.toast = '';
    render();
  }, 1800);
}

function setView(view, payload = {}) {
  state.view = view;
  Object.assign(state, payload);
  render();
}

function tournamentById(id) {
  return readTournaments().find((item) => item.id === id) || readTournaments()[0];
}

function matchById(id) {
  return readMatches().find((item) => item.id === id) || readMatches()[0];
}

function matchesForTournament(tournamentId) {
  return readMatches().filter((match) => match.tournamentId === tournamentId);
}

function appFrame(content, nav = true) {
  return `
    <main class="screen app-bg">
      ${content}
    </main>
    ${nav ? bottomNav() : ''}
  `;
}

function topbar(title, options = {}) {
  const { subtitle = 'Epic Champions', back = false, admin = true } = options;
  return `
    <header class="topbar">
      <button class="icon-btn" data-action="${back ? 'back' : 'noop'}" aria-label="${back ? 'Назад' : 'Меню'}">
        ${back ? icons.back : `<img src="${ASSETS.menu}" alt="" />`}
      </button>
      <div class="brand">
        <div class="eyebrow">${escapeHtml(subtitle)}</div>
        <h1 class="title">${escapeHtml(title)}</h1>
      </div>
      ${isAdmin() && admin ? `<button class="icon-btn" data-action="admin" aria-label="Админка">${icons.plus}</button>` : '<span class="icon-btn ghost"></span>'}
    </header>
  `;
}

function logo(team, big = false) {
  const initials = String(team)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return `<div class="team-logo ${big ? 'big-logo' : ''}">${escapeHtml(initials || '?')}</div>`;
}

function renderSubscriptionGate() {
  return appFrame(`
    <section class="card hero-card gate-card">
      <div class="eyebrow">Доступ к mini app</div>
      <h1 class="title">Нужна подписка</h1>
      <p class="text-block">Чтобы пользоваться приложением, подпишись на ${REQUIRED_CHANNEL_NAME}.</p>
      <button class="action" data-action="open-channel">Открыть канал</button>
      <button class="action secondary" data-action="confirm-subscription">
        ${state.checkingSubscription ? 'Проверяем...' : 'Проверить подписку'}
      </button>
      <p class="label">Обычный пользователь не пройдет дальше без серверной проверки подписки.</p>
    </section>
  `, false);
}

function renderTournaments() {
  const tournaments = readTournaments();

  return appFrame(`
    ${topbar('Турниры')}
    <section class="banner-card">
      <img src="${ASSETS.banner}" alt="Epic Championship" />
    </section>
    <section class="stack">
      ${tournaments.map((tournament) => `
        <article class="tournament-card" data-action="open-tournament" data-id="${escapeHtml(tournament.id)}">
          <div>
            <div class="eyebrow">${escapeHtml(tournament.status === 'active' ? 'Активный' : 'Архив')}</div>
            <h2>${escapeHtml(tournament.title)}</h2>
            <p>${escapeHtml(tournament.subtitle)}</p>
          </div>
          <span>${matchesForTournament(tournament.id).length}</span>
        </article>
      `).join('')}
    </section>
  `);
}

function renderTournament() {
  const tournament = tournamentById(state.selectedTournamentId);
  const matches = matchesForTournament(tournament.id);

  return appFrame(`
    ${topbar(tournament.title, { subtitle: tournament.subtitle, back: true })}
    <section class="stack">
      ${matches.length ? matches.map(matchCard).join('') : '<div class="card empty">Матчей пока нет.</div>'}
    </section>
    ${isAdmin() ? '<button class="floating-action" data-action="create-match">Дать предикт</button>' : ''}
  `);
}

function matchCard(match) {
  return `
    <article class="match-card card" data-action="open-match" data-id="${escapeHtml(match.id)}">
      <div class="match-head">
        ${logo(match.teamA)}
        <div class="match-teams">
          <span>${escapeHtml(match.teamA)}</span>
          <b>VS</b>
          <span>${escapeHtml(match.teamB)}</span>
        </div>
        <div class="status">${escapeHtml(statusLabels[match.status] || match.status)}</div>
        ${logo(match.teamB)}
      </div>
      <div class="match-body">
        <div class="match-meta">
          <div>
            <div class="label">Время</div>
            <div class="value">${escapeHtml(match.time)}</div>
          </div>
          <div>
            <div class="label">Формат</div>
            <div class="value">${escapeHtml(match.format)}</div>
          </div>
          <div class="pick">${escapeHtml(match.pick)}</div>
        </div>
        <div class="mini-row">
          <span>Счет: ${escapeHtml(match.score)}</span>
          <span>${escapeHtml(match.result)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderMatchDetail() {
  const match = matchById(state.selectedMatchId);
  const tournament = tournamentById(match.tournamentId);

  return appFrame(`
    ${topbar('Прогноз', { subtitle: tournament.title, back: true })}
    <section class="card hero-card">
      <div class="detail-score">
        <div class="detail-team">${logo(match.teamA, true)}<span>${escapeHtml(match.teamA)}</span></div>
        <div class="versus">VS</div>
        <div class="detail-team">${logo(match.teamB, true)}<span>${escapeHtml(match.teamB)}</span></div>
      </div>
      <div class="stats-grid">
        <div class="stat"><strong>${escapeHtml(match.time)}</strong><span>${escapeHtml(match.date)}</span></div>
        <div class="stat"><strong>${escapeHtml(match.coefficient)}</strong><span>Коэфф.</span></div>
        <div class="stat"><strong>${escapeHtml(match.score)}</strong><span>Счет</span></div>
      </div>
    </section>
    <section class="card hero-card detail-card">
      <h2 class="section-title">Предикт</h2>
      <div class="pick wide">${escapeHtml(match.pick)}</div>
      <p class="text-block">${escapeHtml(match.text)}</p>
      <p class="text-block"><strong>Результат:</strong> ${escapeHtml(match.result)}</p>
      <button class="action" data-action="copy-pick">Скопировать</button>
      ${isAdmin() ? `<button class="action secondary" data-action="edit-match" data-id="${escapeHtml(match.id)}">Изменить</button>` : ''}
    </section>
  `);
}

function renderStats() {
  const tournaments = readTournaments();
  const matches = readMatches();
  const live = matches.filter((item) => item.status === 'live').length;
  const finished = matches.filter((item) => item.status === 'finished').length;

  return appFrame(`
    ${topbar('Статистика')}
    <section class="card hero-card">
      <div class="stats-grid">
        <div class="stat"><strong>${tournaments.length}</strong><span>Турниров</span></div>
        <div class="stat"><strong>${matches.length}</strong><span>Матчей</span></div>
        <div class="stat"><strong>${live}</strong><span>Live</span></div>
      </div>
    </section>
    <section class="card hero-card">
      <h2 class="section-title">Результаты</h2>
      <div class="stats-grid">
        <div class="stat"><strong>${finished}</strong><span>Завершено</span></div>
        <div class="stat"><strong>${matches.length - finished}</strong><span>В работе</span></div>
        <div class="stat"><strong>${readAdmins().length}</strong><span>Админов</span></div>
      </div>
    </section>
  `);
}

function renderProfile() {
  const user = currentUser();

  return appFrame(`
    ${topbar('Профиль')}
    <section class="card profile-card">
      <div class="profile-head">
        <div class="avatar">${escapeHtml(user.initials)}</div>
        <div>
          <div class="profile-name">${escapeHtml(user.name)}</div>
          <div class="label">ID: ${escapeHtml(user.id || 'нет данных')}</div>
          <div class="label">${escapeHtml(user.username)}</div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat"><strong>${isOwner() ? 'Owner' : isAdmin() ? 'Admin' : 'User'}</strong><span>Роль</span></div>
        <div class="stat"><strong>${readTournaments().length}</strong><span>Турниров</span></div>
        <div class="stat"><strong>${readMatches().length}</strong><span>Матчей</span></div>
      </div>
      ${isAdmin() ? '<button class="action" data-action="admin">Админ-панель</button>' : ''}
    </section>
  `);
}

function adminNav() {
  const sections = [
    ['dashboard', 'Главное'],
    ['tournaments', 'Турниры'],
    ['matches', 'Матчи'],
    ['admins', 'Админы'],
  ];

  return `
    <div class="admin-tabs">
      ${sections.map(([id, label]) => `<button class="${state.adminSection === id ? 'active' : ''}" data-action="admin-section" data-section="${id}">${label}</button>`).join('')}
    </div>
  `;
}

function renderAdmin() {
  if (!isAdmin()) {
    return appFrame(`
      ${topbar('Нет доступа', { back: true, admin: false })}
      <section class="card hero-card"><p class="text-block">Этот раздел доступен только администраторам.</p></section>
    `);
  }

  const content = {
    dashboard: renderAdminDashboard,
    tournaments: renderAdminTournaments,
    matches: renderAdminMatches,
    admins: renderAdminAdmins,
  }[state.adminSection]();

  return appFrame(`
    ${topbar('Админка', { subtitle: isOwner() ? 'Главный админ' : 'Админ', back: true, admin: false })}
    ${adminNav()}
    ${content}
  `);
}

function renderAdminDashboard() {
  return `
    <section class="admin-menu">
      <button data-action="admin-section" data-section="tournaments"><span>Список турниров</span><b>›</b></button>
      <button data-action="admin-section" data-section="matches"><span>Создание и изменение матчей</span><b>›</b></button>
      ${isOwner() ? '<button data-action="admin-section" data-section="admins"><span>Список админов</span><b>›</b></button>' : ''}
    </section>
  `;
}

function renderAdminTournaments() {
  const tournaments = readTournaments();
  const edit = state.editTournamentId ? tournaments.find((item) => item.id === state.editTournamentId) : null;

  return `
    ${tournamentForm(edit)}
    <section class="card hero-card admin-list">
      <h2 class="section-title">Турниры</h2>
      ${tournaments.map((tournament) => `
        <div class="admin-row">
          <div>
            <strong>${escapeHtml(tournament.title)}</strong>
            <span>${escapeHtml(tournament.subtitle)} · ${escapeHtml(tournament.status)}</span>
          </div>
          <div class="row-actions">
            <button class="mini-btn" data-action="edit-tournament" data-id="${escapeHtml(tournament.id)}">Изм.</button>
            <button class="mini-btn danger" data-action="delete-tournament" data-id="${escapeHtml(tournament.id)}">Удалить</button>
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

function tournamentForm(tournament = null) {
  return `
    <form class="card hero-card admin-grid" id="tournamentForm">
      <input type="hidden" name="id" value="${escapeHtml(tournament?.id || '')}" />
      <label class="field"><span>Название турнира</span><input name="title" value="${escapeHtml(tournament?.title || '')}" placeholder="Epic Championship" required /></label>
      <label class="field"><span>Описание</span><input name="subtitle" value="${escapeHtml(tournament?.subtitle || '')}" placeholder="Главный турнир недели" required /></label>
      <label class="field"><span>Статус</span>
        <select name="status">
          <option value="active" ${tournament?.status === 'active' ? 'selected' : ''}>active</option>
          <option value="archived" ${tournament?.status === 'archived' ? 'selected' : ''}>archived</option>
        </select>
      </label>
      <button class="action" type="submit">${tournament ? 'Сохранить турнир' : 'Создать турнир'}</button>
      ${tournament ? '<button class="action secondary" type="button" data-action="new-tournament">Новый турнир</button>' : ''}
    </form>
  `;
}

function renderAdminMatches() {
  const matches = readMatches();
  const edit = state.editMatchId ? matches.find((item) => item.id === state.editMatchId) : null;

  return `
    ${matchForm(edit)}
    <section class="card hero-card admin-list">
      <h2 class="section-title">Матчи</h2>
      ${matches.map((match) => `
        <div class="admin-row">
          <div>
            <strong>${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</strong>
            <span>${escapeHtml(tournamentById(match.tournamentId).title)} · ${escapeHtml(match.score)} · ${escapeHtml(match.result)}</span>
          </div>
          <div class="row-actions">
            <button class="mini-btn" data-action="edit-match" data-id="${escapeHtml(match.id)}">Изм.</button>
            <button class="mini-btn danger" data-action="delete-match" data-id="${escapeHtml(match.id)}">Удалить</button>
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

function matchForm(match = null) {
  const tournaments = readTournaments();
  const selectedTournamentId = match?.tournamentId || state.selectedTournamentId || tournaments[0]?.id;

  return `
    <form class="card hero-card admin-grid" id="matchForm">
      <input type="hidden" name="id" value="${escapeHtml(match?.id || '')}" />
      <label class="field"><span>Турнир</span>
        <select name="tournamentId" required>
          ${tournaments.map((tournament) => `<option value="${escapeHtml(tournament.id)}" ${selectedTournamentId === tournament.id ? 'selected' : ''}>${escapeHtml(tournament.title)}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Команда 1</span><input name="teamA" value="${escapeHtml(match?.teamA || '')}" placeholder="Saints" required /></label>
      <label class="field"><span>Команда 2</span><input name="teamB" value="${escapeHtml(match?.teamB || '')}" placeholder="Elevate" required /></label>
      <label class="field"><span>Дата</span><input name="date" value="${escapeHtml(match?.date || 'Сегодня')}" required /></label>
      <label class="field"><span>Время</span><input name="time" value="${escapeHtml(match?.time || '20:00')}" required /></label>
      <label class="field"><span>Формат</span><input name="format" value="${escapeHtml(match?.format || 'BO3')}" required /></label>
      <label class="field"><span>Предикт</span><input name="pick" value="${escapeHtml(match?.pick || '')}" placeholder="Победа Elevate" required /></label>
      <label class="field"><span>Коэффициент</span><input name="coefficient" value="${escapeHtml(match?.coefficient || '1.95')}" required /></label>
      <label class="field"><span>Уверенность, %</span><input name="confidence" type="number" min="0" max="100" value="${escapeHtml(match?.confidence || 70)}" required /></label>
      <label class="field"><span>Статус</span>
        <select name="status">
          ${Object.keys(statusLabels).map((value) => `<option value="${value}" ${match?.status === value ? 'selected' : ''}>${statusLabels[value]}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Счет</span><input name="score" value="${escapeHtml(match?.score || '-')}" required /></label>
      <label class="field"><span>Результат</span><input name="result" value="${escapeHtml(match?.result || 'Не начался')}" required /></label>
      <label class="field"><span>Описание</span><textarea name="text" required>${escapeHtml(match?.text || '')}</textarea></label>
      <button class="action" type="submit">${match ? 'Сохранить матч' : 'Дать предикт'}</button>
      ${match ? '<button class="action secondary" type="button" data-action="new-match">Новый матч</button>' : ''}
    </form>
  `;
}

function renderAdminAdmins() {
  if (!isOwner()) {
    return '<section class="card hero-card"><p class="text-block">Админов может менять только главный админ.</p></section>';
  }

  const admins = readAdmins();
  return `
    <section class="card hero-card admin-grid">
      <h2 class="section-title">Главные админы</h2>
      <div class="admin-row"><div><strong>ID</strong><span>${OWNER_IDS.join(', ')}</span></div></div>
      <form class="admin-inline" id="adminForm">
        <label class="field"><span>@username или ID пользователя</span><input name="admin" placeholder="@username или 123456789" required /></label>
        <button class="action" type="submit">Добавить админа</button>
      </form>
      ${admins.length ? admins.map((admin) => `
        <div class="admin-row">
          <div><strong>${admin.type === 'id' ? 'ID' : 'Username'}</strong><span>${escapeHtml(admin.value)}</span></div>
          <button class="mini-btn danger" data-action="remove-admin" data-admin="${escapeHtml(admin.value)}">Удалить</button>
        </div>
      `).join('') : '<div class="empty">Дополнительных админов пока нет.</div>'}
    </section>
  `;
}

function bottomNav() {
  const nav = [
    ['tournaments', 'Турниры', icons.trophy],
    ['stats', 'Статистика', icons.chart],
    ['profile', 'Профиль', icons.user],
  ];

  return `
    <nav class="bottom-nav">
      ${nav.map(([view, label, icon]) => `
        <button class="nav-btn ${state.view === view ? 'active' : ''}" data-view="${view}">
          ${icon}
          <span>${label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function render() {
  if (!hasChannelAccess()) {
    app.innerHTML = renderSubscriptionGate();
  } else {
    const routes = {
      tournaments: renderTournaments,
      tournament: renderTournament,
      match: renderMatchDetail,
      stats: renderStats,
      profile: renderProfile,
      admin: renderAdmin,
    };

    app.innerHTML = (routes[state.view] || renderTournaments)();
  }

  if (state.toast) {
    app.insertAdjacentHTML('beforeend', `<div class="toast">${escapeHtml(state.toast)}</div>`);
  }
}

async function verifySubscription() {
  if (!SUBSCRIPTION_CHECK_URL) {
    showToast('Нужен сервер проверки подписки');
    return;
  }

  state.checkingSubscription = true;
  render();

  try {
    const response = await fetch(SUBSCRIPTION_CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg?.initData || '', user: currentUser() }),
    });
    const data = await response.json();
    if (!data.subscribed) throw new Error('not_subscribed');
    localStorage.setItem('tgapi.channelVerified.v1', 'true');
    showToast('Подписка подтверждена');
  } catch {
    showToast('Подписка не подтверждена');
  } finally {
    state.checkingSubscription = false;
    render();
  }
}

document.addEventListener('click', async (event) => {
  const viewButton = event.target.closest('[data-view]');
  const actionButton = event.target.closest('[data-action]');

  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;

  if (action === 'noop') return;
  if (action === 'open-channel') {
    if (tg?.openTelegramLink) tg.openTelegramLink(REQUIRED_CHANNEL_URL);
    else window.open(REQUIRED_CHANNEL_URL, '_blank', 'noopener');
  }
  if (action === 'confirm-subscription') verifySubscription();
  if (action === 'back') {
    if (state.view === 'match') setView('tournament');
    else setView('tournaments');
  }
  if (action === 'admin') setView('admin', { adminSection: 'dashboard' });
  if (action === 'admin-section') setView('admin', { adminSection: actionButton.dataset.section });
  if (action === 'open-tournament') setView('tournament', { selectedTournamentId: id });
  if (action === 'open-match') setView('match', { selectedMatchId: id });
  if (action === 'create-match') setView('admin', { adminSection: 'matches', editMatchId: null });
  if (action === 'edit-match') setView('admin', { adminSection: 'matches', editMatchId: id });
  if (action === 'new-match') setView('admin', { adminSection: 'matches', editMatchId: null });
  if (action === 'edit-tournament') setView('admin', { adminSection: 'tournaments', editTournamentId: id });
  if (action === 'new-tournament') setView('admin', { adminSection: 'tournaments', editTournamentId: null });

  if (action === 'delete-match' && isAdmin()) {
    saveMatches(readMatches().filter((match) => match.id !== id));
    showToast('Матч удален');
  }

  if (action === 'delete-tournament' && isAdmin()) {
    const tournaments = readTournaments().filter((item) => item.id !== id);
    saveTournaments(tournaments);
    saveMatches(readMatches().filter((match) => match.tournamentId !== id));
    showToast('Турнир удален');
  }

  if (action === 'remove-admin' && isOwner()) {
    const value = actionButton.dataset.admin;
    saveAdmins(readAdmins().filter((admin) => admin.value !== value));
    showToast('Админ удален');
  }

  if (action === 'copy-pick') {
    const match = matchById(state.selectedMatchId);
    await navigator.clipboard?.writeText(`${match.teamA} vs ${match.teamB}: ${match.pick}, кф. ${match.coefficient}`);
    showToast('Предикт скопирован');
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'adminForm') {
    event.preventDefault();
    if (!isOwner()) return;

    const data = Object.fromEntries(new FormData(event.target).entries());
    const admin = normalizeAdminValue(data.admin);
    if (!admin) {
      showToast('Введи @username или ID');
      return;
    }

    const admins = readAdmins();
    if (!admins.some((item) => item.type === admin.type && item.value === admin.value)) {
      admins.push(admin);
      saveAdmins(admins);
    }
    event.target.reset();
    showToast('Админ добавлен');
  }

  if (event.target.id === 'tournamentForm') {
    event.preventDefault();
    if (!isAdmin()) return;

    const data = Object.fromEntries(new FormData(event.target).entries());
    const tournaments = readTournaments();
    const tournament = {
      id: data.id || `t${Date.now()}`,
      title: data.title,
      subtitle: data.subtitle,
      status: data.status,
    };
    const index = tournaments.findIndex((item) => item.id === tournament.id);
    if (index >= 0) tournaments[index] = tournament;
    else tournaments.unshift(tournament);
    saveTournaments(tournaments);
    state.editTournamentId = null;
    showToast(index >= 0 ? 'Турнир сохранен' : 'Турнир создан');
  }

  if (event.target.id === 'matchForm') {
    event.preventDefault();
    if (!isAdmin()) return;

    const data = Object.fromEntries(new FormData(event.target).entries());
    const matches = readMatches();
    const match = {
      id: data.id || `m${Date.now()}`,
      tournamentId: data.tournamentId,
      teamA: data.teamA,
      teamB: data.teamB,
      time: data.time,
      date: data.date,
      format: data.format,
      pick: data.pick,
      coefficient: data.coefficient,
      confidence: Number(data.confidence),
      status: data.status,
      score: data.score,
      result: data.result,
      text: data.text,
    };
    const index = matches.findIndex((item) => item.id === match.id);
    if (index >= 0) matches[index] = match;
    else matches.unshift(match);
    saveMatches(matches);
    state.editMatchId = null;
    state.selectedTournamentId = match.tournamentId;
    showToast(index >= 0 ? 'Матч сохранен' : 'Предикт создан');
  }
});

render();
