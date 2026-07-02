const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#131313');
  tg.setBackgroundColor('#0e0e0e');
}

const OWNER_ID = '713635428';
const REQUIRED_CHANNEL_URL = 'https://t.me/StandrankingSCS';
const REQUIRED_CHANNEL_NAME = '@StandrankingSCS';
const SUBSCRIPTION_CHECK_URL = '';

const icons = {
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H5a2 2 0 0 0 0 4h2"/><path d="M17 6h2a2 2 0 0 1 0 4h-2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
  back: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
};

const seedMatches = [
  {
    id: 'p1',
    league: 'Epic Champions',
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
    text: 'Elevate стабильнее играет поздние раунды и лучше закрывает карты после сильного старта. Риск основной ставки в первой карте, поэтому оптимальный вариант - общий исход матча.',
  },
  {
    id: 'p2',
    league: 'Premier League',
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
    text: 'Обе команды часто размениваются картами, а личные встречи редко заканчиваются сухо. Для аккуратного входа лучше брать тотал, а не победителя.',
  },
  {
    id: 'p3',
    league: 'Major Qualifier',
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
    text: 'Format хорошо держит свой пик и редко проваливается по экономике. Даже против фаворита команда выглядит достаточно надежно для плюсовой форы.',
  },
];

const statusLabels = {
  open: 'Open',
  live: 'Live',
  finished: 'Done',
  cancelled: 'Cancel',
};

const state = {
  view: 'predictions',
  filter: 'all',
  selectedId: null,
  editId: null,
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
    return fallback;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function readMatches() {
  return readJson('tgapi.predictions', seedMatches).map((match) => ({
    score: '-',
    result: 'Не начался',
    ...match,
  }));
}

function saveMatches(matches) {
  localStorage.setItem('tgapi.predictions', JSON.stringify(matches));
}

function readAdmins() {
  return readJson('tgapi.admins', []);
}

function saveAdmins(admins) {
  localStorage.setItem('tgapi.admins', JSON.stringify(admins));
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
  return currentUser().id === OWNER_ID;
}

function isAdmin() {
  const user = currentUser();
  const username = user.username.toLowerCase();

  if (user.id === OWNER_ID) return true;
  return readAdmins().some((admin) => {
    if (admin.type === 'id') return admin.value === user.id;
    if (admin.type === 'username') return admin.value === username;
    return false;
  });
}

function hasChannelAccess() {
  if (isOwner()) return true;
  return localStorage.getItem('tgapi.channelConfirmed') === 'true';
}

function setView(view, payload = {}) {
  state.view = view;
  state.selectedId = payload.id || null;
  state.editId = payload.editId || null;
  render();
}

function showToast(text) {
  state.toast = text;
  render();
  window.setTimeout(() => {
    state.toast = '';
    render();
  }, 1800);
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

function topbar(title, eyebrow = 'Турнирные прогнозы', back = false) {
  const adminButton = isAdmin()
    ? `<button class="icon-btn" data-action="admin" aria-label="Админ-панель">${icons.plus}</button>`
    : '<span class="icon-btn ghost"></span>';

  return `
    <header class="topbar">
      <button class="icon-btn" data-action="${back ? 'back' : 'menu'}" aria-label="${back ? 'Назад' : 'Меню'}">
        ${back ? icons.back : icons.menu}
      </button>
      <div class="brand">
        <div class="eyebrow">${escapeHtml(eyebrow)}</div>
        <h1 class="title">${escapeHtml(title)}</h1>
      </div>
      ${adminButton}
    </header>
  `;
}

function predictionCard(match) {
  return `
    <article class="card match-card" data-action="open-prediction" data-id="${escapeHtml(match.id)}">
      <div class="match-head">
        ${logo(match.teamA)}
        <div class="match-teams">
          <span>${escapeHtml(match.teamA)}</span>
          <b>vs</b>
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
            <div class="label">${escapeHtml(match.league)}</div>
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

function renderSubscriptionGate() {
  return `
    <main class="screen gate-screen">
      <section class="card hero-card gate-card">
        <div class="eyebrow">Доступ к mini app</div>
        <h1 class="title">Подпишись на канал</h1>
        <p class="text-block">
          Чтобы пользоваться приложением, нужна подписка на ${REQUIRED_CHANNEL_NAME}.
        </p>
        <button class="action" data-action="open-channel">Открыть канал</button>
        <button class="action secondary" data-action="confirm-subscription">
          ${state.checkingSubscription ? 'Проверяем...' : 'Я подписался'}
        </button>
        <p class="label">
          В текущей статической версии GitHub Pages реальная проверка подписки требует backend с Bot API.
        </p>
      </section>
    </main>
  `;
}

function renderPredictions() {
  const matches = readMatches();
  const items = matches.filter((item) => state.filter === 'all' || item.status === state.filter);

  return `
    <main class="screen">
      ${topbar('Epic Champions')}
      <div class="banner">
        <img src="./design-assets/Баннер турнира.svg" alt="Epic Champions" />
      </div>
      <div class="tabs">
        <button class="tab ${state.filter === 'all' ? 'active' : ''}" data-filter="all">Все</button>
        <button class="tab ${state.filter === 'live' ? 'active' : ''}" data-filter="live">Live</button>
        <button class="tab ${state.filter === 'open' ? 'active' : ''}" data-filter="open">Открытые</button>
      </div>
      <section class="stack">
        ${items.length ? items.map(predictionCard).join('') : '<div class="card empty">Матчей в этой вкладке пока нет.</div>'}
      </section>
    </main>
    ${bottomNav()}
  `;
}

function renderDetail() {
  const match = readMatches().find((item) => item.id === state.selectedId) || readMatches()[0];

  return `
    <main class="screen">
      ${topbar('Прогноз', match.league, true)}
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
      <section class="card hero-card" style="margin-top: 12px;">
        <h2 class="section-title">Прогноз</h2>
        <div class="pick" style="justify-self: stretch; margin-bottom: 12px;">${escapeHtml(match.pick)}</div>
        <p class="text-block">${escapeHtml(match.text)}</p>
        <p class="text-block"><strong>Результат:</strong> ${escapeHtml(match.result)}</p>
        <button class="action" data-action="copy-pick">Скопировать прогноз</button>
        ${isAdmin() ? `<button class="action secondary" data-action="edit-match" data-id="${escapeHtml(match.id)}">Редактировать</button>` : ''}
      </section>
    </main>
    ${bottomNav()}
  `;
}

function renderStats() {
  const matches = readMatches();
  const live = matches.filter((item) => item.status === 'live').length;
  const finished = matches.filter((item) => item.status === 'finished').length;

  return `
    <main class="screen">
      ${topbar('Статистика')}
      <section class="card hero-card">
        <h2 class="section-title">Общая сводка</h2>
        <div class="stats-grid">
          <div class="stat"><strong>${matches.length}</strong><span>Матчей</span></div>
          <div class="stat"><strong>${live}</strong><span>Live</span></div>
          <div class="stat"><strong>${finished}</strong><span>Завершено</span></div>
        </div>
      </section>
      <section class="stack" style="margin-top: 12px;">
        ${matches.slice(0, 3).map(predictionCard).join('')}
      </section>
    </main>
    ${bottomNav()}
  `;
}

function renderProfile() {
  const user = currentUser();

  return `
    <main class="screen">
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
          <div class="stat"><strong>${readMatches().length}</strong><span>Матчей</span></div>
          <div class="stat"><strong>${readAdmins().length}</strong><span>Админов</span></div>
        </div>
        ${isAdmin() ? '<button class="action" data-action="admin">Админ-панель</button>' : ''}
        <button class="action secondary" data-action="reset">Сбросить demo-данные</button>
      </section>
    </main>
    ${bottomNav()}
  `;
}

function matchForm(match = {}) {
  return `
    <form class="card hero-card admin-grid" id="matchForm">
      <input type="hidden" name="id" value="${escapeHtml(match.id || '')}" />
      <label class="field"><span>Турнир</span><input name="league" value="${escapeHtml(match.league || 'Epic Champions')}" required /></label>
      <label class="field"><span>Команда 1</span><input name="teamA" value="${escapeHtml(match.teamA || 'Saints')}" required /></label>
      <label class="field"><span>Команда 2</span><input name="teamB" value="${escapeHtml(match.teamB || 'Elevate')}" required /></label>
      <label class="field"><span>Дата</span><input name="date" value="${escapeHtml(match.date || 'Сегодня')}" required /></label>
      <label class="field"><span>Время</span><input name="time" value="${escapeHtml(match.time || '20:00')}" required /></label>
      <label class="field"><span>Формат</span><input name="format" value="${escapeHtml(match.format || 'BO3')}" required /></label>
      <label class="field"><span>Ставка</span><input name="pick" value="${escapeHtml(match.pick || 'Победа Elevate')}" required /></label>
      <label class="field"><span>Коэффициент</span><input name="coefficient" value="${escapeHtml(match.coefficient || '1.95')}" required /></label>
      <label class="field"><span>Уверенность, %</span><input name="confidence" type="number" min="0" max="100" value="${escapeHtml(match.confidence || 70)}" required /></label>
      <label class="field"><span>Статус</span>
        <select name="status">
          ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${match.status === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Счет</span><input name="score" value="${escapeHtml(match.score || '-')}" required /></label>
      <label class="field"><span>Результат матча</span><input name="result" value="${escapeHtml(match.result || 'Не начался')}" required /></label>
      <label class="field"><span>Комментарий</span><textarea name="text" required>${escapeHtml(match.text || 'Короткое объяснение прогноза для пользователя.')}</textarea></label>
      <button class="action" type="submit">${match.id ? 'Сохранить матч' : 'Создать матч'}</button>
      ${match.id ? '<button class="action secondary" type="button" data-action="new-match">Создать новый</button>' : ''}
    </form>
  `;
}

function adminList() {
  const matches = readMatches();
  return `
    <section class="card hero-card admin-list">
      <h2 class="section-title">Матчи</h2>
      ${matches.map((match) => `
        <div class="admin-row">
          <div>
            <strong>${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</strong>
            <span>${escapeHtml(match.status)} · ${escapeHtml(match.score)} · ${escapeHtml(match.result)}</span>
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

function adminManager() {
  if (!isOwner()) return '';

  const admins = readAdmins();
  return `
    <section class="card hero-card admin-grid">
      <h2 class="section-title">Админы</h2>
      <div class="admin-row">
        <div>
          <strong>Главный админ</strong>
          <span>ID: ${OWNER_ID}</span>
        </div>
      </div>
      <form class="admin-inline" id="adminForm">
        <label class="field"><span>@username или ID пользователя</span><input name="admin" placeholder="@username или 123456789" required /></label>
        <button class="action" type="submit">Добавить админа</button>
      </form>
      ${admins.length ? admins.map((admin) => `
        <div class="admin-row">
          <div>
            <strong>${admin.type === 'id' ? 'ID' : 'Username'}</strong>
            <span>${escapeHtml(admin.value)}</span>
          </div>
          <button class="mini-btn danger" data-action="remove-admin" data-admin="${escapeHtml(admin.value)}">Удалить</button>
        </div>
      `).join('') : '<div class="empty">Дополнительных админов пока нет.</div>'}
    </section>
  `;
}

function renderAdmin() {
  if (!isAdmin()) {
    return `
      <main class="screen">
        ${topbar('Нет доступа', 'Админ-панель', true)}
        <section class="card hero-card">
          <p class="text-block">Этот раздел доступен только владельцу и администраторам.</p>
        </section>
      </main>
      ${bottomNav()}
    `;
  }

  const editMatch = state.editId ? readMatches().find((match) => match.id === state.editId) : null;

  return `
    <main class="screen">
      ${topbar('Админ', isOwner() ? 'Владелец' : 'Администратор', true)}
      ${matchForm(editMatch || {})}
      ${adminList()}
      ${adminManager()}
    </main>
    ${bottomNav()}
  `;
}

function bottomNav() {
  const nav = [
    ['predictions', 'Турниры', icons.trophy],
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
      predictions: renderPredictions,
      detail: renderDetail,
      stats: renderStats,
      profile: renderProfile,
      admin: renderAdmin,
    };

    app.innerHTML = routes[state.view]();
  }

  if (state.toast) {
    app.insertAdjacentHTML('beforeend', `<div class="toast">${escapeHtml(state.toast)}</div>`);
  }
}

async function verifySubscription() {
  if (!SUBSCRIPTION_CHECK_URL) {
    localStorage.setItem('tgapi.channelConfirmed', 'true');
    showToast('Подписка отмечена');
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
    localStorage.setItem('tgapi.channelConfirmed', 'true');
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
  const filterButton = event.target.closest('[data-filter]');

  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  if (filterButton) {
    state.filter = filterButton.dataset.filter;
    render();
    return;
  }

  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;

  if (action === 'open-channel') {
    if (tg?.openTelegramLink) tg.openTelegramLink(REQUIRED_CHANNEL_URL);
    else window.open(REQUIRED_CHANNEL_URL, '_blank', 'noopener');
  }

  if (action === 'confirm-subscription') verifySubscription();
  if (action === 'open-prediction') setView('detail', { id });
  if (action === 'back') setView('predictions');
  if (action === 'admin' || action === 'menu') setView('admin');
  if (action === 'new-match') setView('admin');
  if (action === 'edit-match') setView('admin', { editId: id });

  if (action === 'delete-match' && isAdmin()) {
    saveMatches(readMatches().filter((match) => match.id !== id));
    showToast('Матч удален');
  }

  if (action === 'remove-admin' && isOwner()) {
    const value = actionButton.dataset.admin;
    saveAdmins(readAdmins().filter((admin) => admin.value !== value));
    showToast('Админ удален');
  }

  if (action === 'reset') {
    saveMatches(seedMatches);
    saveAdmins([]);
    localStorage.removeItem('tgapi.channelConfirmed');
    showToast('Demo-данные сброшены');
  }

  if (action === 'copy-pick') {
    const match = readMatches().find((item) => item.id === state.selectedId);
    const text = `${match.teamA} vs ${match.teamB}: ${match.pick}, кф. ${match.coefficient}`;
    await navigator.clipboard?.writeText(text);
    showToast('Прогноз скопирован');
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
    showToast('Админ добавлен');
  }

  if (event.target.id === 'matchForm') {
    event.preventDefault();
    if (!isAdmin()) return;

    const data = Object.fromEntries(new FormData(event.target).entries());
    const matches = readMatches();
    const match = {
      id: data.id || `p${Date.now()}`,
      league: data.league,
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
    state.editId = null;
    showToast(index >= 0 ? 'Матч сохранен' : 'Матч создан');
  }
});

render();
