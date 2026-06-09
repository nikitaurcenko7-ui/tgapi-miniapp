const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#131313');
  tg.setBackgroundColor('#0e0e0e');
}

const icons = {
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H5a2 2 0 0 0 0 4h2"/><path d="M17 6h2a2 2 0 0 1 0 4h-2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
  back: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
};

const seedPredictions = [
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
    text: 'Format хорошо держит свой пик и редко проваливается по экономике. Даже против фаворита команда выглядит достаточно надежно для плюсовой форы.',
  },
];

const state = {
  view: 'predictions',
  filter: 'all',
  selectedId: null,
  toast: '',
};

const app = document.querySelector('#app');

function readPredictions() {
  const saved = localStorage.getItem('tgapi.predictions');
  if (!saved) {
    localStorage.setItem('tgapi.predictions', JSON.stringify(seedPredictions));
    return seedPredictions;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem('tgapi.predictions', JSON.stringify(seedPredictions));
    return seedPredictions;
  }
}

function savePredictions(predictions) {
  localStorage.setItem('tgapi.predictions', JSON.stringify(predictions));
}

function currentUser() {
  const user = tg?.initDataUnsafe?.user;
  return {
    name: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : 'Demo User',
    username: user?.username ? `@${user.username}` : '@telegram_user',
    initials: user?.first_name?.slice(0, 1)?.toUpperCase() || 'D',
  };
}

function setView(view, payload = {}) {
  state.view = view;
  state.selectedId = payload.id || null;
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
  const initials = team
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return `<div class="team-logo ${big ? 'big-logo' : ''}">${initials}</div>`;
}

function topbar(title, eyebrow = 'Турнирные прогнозы', back = false) {
  return `
    <header class="topbar">
      <button class="icon-btn" data-action="${back ? 'back' : 'menu'}" aria-label="${back ? 'Назад' : 'Меню'}">
        ${back ? icons.back : icons.menu}
      </button>
      <div class="brand">
        <div class="eyebrow">${eyebrow}</div>
        <h1 class="title">${title}</h1>
      </div>
      <button class="icon-btn" data-action="admin" aria-label="Добавить прогноз">${icons.plus}</button>
    </header>
  `;
}

function predictionCard(prediction) {
  return `
    <article class="card match-card" data-action="open-prediction" data-id="${prediction.id}">
      <div class="match-head">
        ${logo(prediction.teamA)}
        <div class="match-teams">
          <span>${prediction.teamA}</span>
          <b>vs</b>
          <span>${prediction.teamB}</span>
        </div>
        <div class="status">${prediction.status === 'live' ? 'Live' : 'Open'}</div>
        ${logo(prediction.teamB)}
      </div>
      <div class="match-body">
        <div class="match-meta">
          <div>
            <div class="label">Время</div>
            <div class="value">${prediction.time}</div>
          </div>
          <div>
            <div class="label">${prediction.league}</div>
            <div class="value">${prediction.format}</div>
          </div>
          <div class="pick">${prediction.pick}</div>
        </div>
      </div>
    </article>
  `;
}

function renderPredictions() {
  const predictions = readPredictions();
  const items = predictions.filter((item) => state.filter === 'all' || item.status === state.filter);

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
        ${items.length ? items.map(predictionCard).join('') : '<div class="card empty">Прогнозов в этой вкладке пока нет.</div>'}
      </section>
    </main>
    ${bottomNav()}
  `;
}

function renderDetail() {
  const prediction = readPredictions().find((item) => item.id === state.selectedId) || readPredictions()[0];

  return `
    <main class="screen">
      ${topbar('Прогноз', prediction.league, true)}
      <section class="card hero-card">
        <div class="detail-score">
          <div class="detail-team">${logo(prediction.teamA, true)}<span>${prediction.teamA}</span></div>
          <div class="versus">VS</div>
          <div class="detail-team">${logo(prediction.teamB, true)}<span>${prediction.teamB}</span></div>
        </div>
        <div class="stats-grid">
          <div class="stat"><strong>${prediction.time}</strong><span>${prediction.date}</span></div>
          <div class="stat"><strong>${prediction.coefficient}</strong><span>Коэфф.</span></div>
          <div class="stat"><strong>${prediction.confidence}%</strong><span>Уверенность</span></div>
        </div>
      </section>
      <section class="card hero-card" style="margin-top: 12px;">
        <h2 class="section-title">Прогноз</h2>
        <div class="pick" style="justify-self: stretch; margin-bottom: 12px;">${prediction.pick}</div>
        <p class="text-block">${prediction.text}</p>
        <button class="action" data-action="copy-pick">Скопировать прогноз</button>
      </section>
    </main>
    ${bottomNav()}
  `;
}

function renderStats() {
  const predictions = readPredictions();
  const live = predictions.filter((item) => item.status === 'live').length;

  return `
    <main class="screen">
      ${topbar('Статистика')}
      <section class="card hero-card">
        <h2 class="section-title">Общая сводка</h2>
        <div class="stats-grid">
          <div class="stat"><strong>${predictions.length}</strong><span>Прогнозов</span></div>
          <div class="stat"><strong>${live}</strong><span>Live</span></div>
          <div class="stat"><strong>72%</strong><span>Проходимость</span></div>
        </div>
      </section>
      <section class="stack" style="margin-top: 12px;">
        ${predictions.slice(0, 3).map(predictionCard).join('')}
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
          <div class="avatar">${user.initials}</div>
          <div>
            <div class="profile-name">${user.name}</div>
            <div class="label">${user.username}</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat"><strong>18</strong><span>Подписок</span></div>
          <div class="stat"><strong>9</strong><span>Побед</span></div>
          <div class="stat"><strong>2.04</strong><span>Средний кф.</span></div>
        </div>
        <button class="action" data-action="admin">Админ-панель</button>
        <button class="action secondary" data-action="reset">Сбросить demo-данные</button>
      </section>
    </main>
    ${bottomNav()}
  `;
}

function renderAdmin() {
  return `
    <main class="screen">
      ${topbar('Админ', 'Создание прогноза', true)}
      <form class="card hero-card admin-grid" id="adminForm">
        <label class="field"><span>Турнир</span><input name="league" value="Epic Champions" required /></label>
        <label class="field"><span>Команда 1</span><input name="teamA" value="Saints" required /></label>
        <label class="field"><span>Команда 2</span><input name="teamB" value="Elevate" required /></label>
        <label class="field"><span>Время</span><input name="time" value="20:00" required /></label>
        <label class="field"><span>Формат</span><input name="format" value="BO3" required /></label>
        <label class="field"><span>Ставка</span><input name="pick" value="Победа Elevate" required /></label>
        <label class="field"><span>Коэффициент</span><input name="coefficient" value="1.95" required /></label>
        <label class="field"><span>Статус</span><select name="status"><option value="open">Open</option><option value="live">Live</option></select></label>
        <label class="field"><span>Комментарий</span><textarea name="text" required>Короткое объяснение прогноза для пользователя.</textarea></label>
        <button class="action" type="submit">Опубликовать</button>
      </form>
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
      ${nav
        .map(
          ([view, label, icon]) => `
          <button class="nav-btn ${state.view === view ? 'active' : ''}" data-view="${view}">
            ${icon}
            <span>${label}</span>
          </button>
        `,
        )
        .join('')}
    </nav>
  `;
}

function render() {
  const routes = {
    predictions: renderPredictions,
    detail: renderDetail,
    stats: renderStats,
    profile: renderProfile,
    admin: renderAdmin,
  };

  app.innerHTML = routes[state.view]();

  if (state.toast) {
    app.insertAdjacentHTML('beforeend', `<div class="toast">${state.toast}</div>`);
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

  if (action === 'open-prediction') setView('detail', { id: actionButton.dataset.id });
  if (action === 'back') setView('predictions');
  if (action === 'admin' || action === 'menu') setView('admin');
  if (action === 'reset') {
    savePredictions(seedPredictions);
    showToast('Demo-данные сброшены');
  }
  if (action === 'copy-pick') {
    const prediction = readPredictions().find((item) => item.id === state.selectedId);
    const text = `${prediction.teamA} vs ${prediction.teamB}: ${prediction.pick}, кф. ${prediction.coefficient}`;
    await navigator.clipboard?.writeText(text);
    showToast('Прогноз скопирован');
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'adminForm') return;

  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const predictions = readPredictions();
  predictions.unshift({
    id: `p${Date.now()}`,
    date: 'Сегодня',
    confidence: 70,
    ...data,
  });
  savePredictions(predictions);
  state.filter = 'all';
  showToast('Прогноз опубликован');
  window.setTimeout(() => setView('predictions'), 250);
});

render();
