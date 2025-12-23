const API = 'https://api.jikan.moe/v4';

let currentPage = 1;
let totalPages = 1;
let currentYear = 2006;
let currentSeason = 'summer';
let currentGenre = '';
let isSearching = false;

/* ================= FETCH LIST ================= */

async function fetchAnimeList() {
  isSearching = false;
  home(true);
  renderSkeleton();

  try {
    let url = `${API}/seasons/${currentYear}/${currentSeason}?sfw&page=${currentPage}`;
    if (currentGenre) url += `&genres=${currentGenre}`;

    const res = await fetch(url);
    const json = await res.json();

    totalPages = json.pagination.last_visible_page;
    renderAnimeList(json.data);
    renderPagination();

  } catch (err) {
    animeGrid().innerHTML = '<p>Gagal memuat daftar anime.</p>';
    console.error(err);
  }
}

/* ================= RENDER LIST ================= */

function renderAnimeList(list) {
  animeGrid().innerHTML = '';

  list.forEach(a => {
    const image =
      a.images?.jpg?.large_image_url ||
      a.images?.webp?.large_image_url ||
      'https://placehold.co/400x600/020617/ffffff?text=No+Image';

    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => fetchDetail(a.mal_id);

    card.innerHTML = `
      <img src="${image}" loading="lazy">
      <div class="anime-info">
        <div class="anime-title">${a.title}</div>
        <div class="anime-meta">
          ${a.type ?? '?'} • EP ${a.episodes ?? '?'} • ${a.year ?? '?'}
        </div>
      </div>
    `;

    animeGrid().appendChild(card);
  });
}

/* ================= PAGINATION ================= */

function renderPagination() {
  if (isSearching) return;

  const p = document.getElementById('pagination');
  p.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const b = document.createElement('button');
    b.textContent = i;

    if (i === currentPage) b.classList.add('active');

    b.onclick = () => {
      currentPage = i;
      fetchAnimeList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    p.appendChild(b);
  }
}

/* ================= DETAIL ================= */

async function fetchDetail(id) {
  home(false);
  detail().innerHTML = '<p>Memuat detail...</p>';

  try {
    const res = await fetch(`${API}/anime/${id}/full`);
    const json = await res.json();
    renderDetail(json.data);
  } catch (err) {
    detail().innerHTML = '<p>Gagal memuat detail anime.</p>';
    console.error(err);
  }
}

function renderDetail(a) {
  const image =
    a.images?.jpg?.large_image_url ||
    a.images?.webp?.large_image_url;

  const banner =
    a.trailer?.images?.maximum_image_url || image;

  const studios = a.studios?.length
    ? a.studios.map(s => s.name).join(', ')
    : 'Unknown';

  const episodes = a.episodes ?? 'Unknown';

  detail().innerHTML = `
    <div class="banner" style="background-image:url('${banner}')"></div>

    <div class="detail-main">
      <img class="detail-poster" src="${image}">

      <div class="detail-info">
        <h1>${a.title}</h1>

        <div class="rating">⭐ ${a.score ?? 'N/A'}</div>

        <div class="detail-meta">
          <span><strong>Studio:</strong> ${studios}</span>
          <span><strong>Episodes:</strong> ${episodes}</span>
        </div>

        <p class="desc">
          ${a.synopsis ?? 'Tidak ada sinopsis.'}
        </p>
      </div>
    </div>
  `;
}

/* ================= GENRE ================= */

async function fetchGenres() {
  try {
    const res = await fetch(`${API}/genres/anime`);
    const json = await res.json();

    const g = document.getElementById('genreSelect');
    json.data.forEach(genre => {
      const opt = document.createElement('option');
      opt.value = genre.mal_id;
      opt.textContent = genre.name;
      g.appendChild(opt);
    });
  } catch (err) {
    console.error('Gagal memuat genre', err);
  }
}

/* ================= CONTROLS ================= */

function initControls() {
  const y = document.getElementById('yearSelect');
  const s = document.getElementById('seasonSelect');
  const g = document.getElementById('genreSelect');

  for (let i = 1990; i <= new Date().getFullYear(); i++) {
    y.innerHTML += `<option value="${i}" ${i === currentYear ? 'selected' : ''}>${i}</option>`;
  }

  y.onchange = s.onchange = g.onchange = () => {
    currentYear = y.value;
    currentSeason = s.value;
    currentGenre = g.value;
    currentPage = 1;
    fetchAnimeList();
  };

  document.getElementById('searchInput').onkeydown = e => {
    if (e.key === 'Enter') searchAnime();
  };
}

/* ================= SEARCH ================= */

async function searchAnime() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;

  isSearching = true;
  home(true);
  renderSkeleton(8);
  document.getElementById('pagination').innerHTML = '';

  try {
    const res = await fetch(`${API}/anime?q=${q}&sfw`);
    const json = await res.json();
    renderAnimeList(json.data);
  } catch (err) {
    animeGrid().innerHTML = '<p>Pencarian gagal.</p>';
    console.error(err);
  }
}

/* ================= HELPERS ================= */

const animeGrid = () => document.getElementById('anime-grid');
const detail = () => document.getElementById('detail-content');

function home(show = true) {
  document.getElementById('home-view').style.display = show ? 'block' : 'none';
  document.getElementById('detail-view').style.display = show ? 'none' : 'block';
}

function goHome() {
  home(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================= SKELETON ================= */

function renderSkeleton(count = 12) {
  animeGrid().innerHTML = '';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'anime-card skeleton-card';

    card.innerHTML = `
      <div class="skeleton skeleton-poster"></div>
      <div class="skeleton-info">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-meta"></div>
      </div>
    `;

    animeGrid().appendChild(card);
  }
}

/* ================= INIT ================= */

initControls();
fetchGenres();
fetchAnimeList();
