/* ── Digital Prayer Companion — App JS ─────────────── */

// ── Storage helpers ──────────────────────────────────
const STORAGE_KEY = 'dpc_v1';
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// ── Journal auto-save ─────────────────────────────────
function initJournal() {
  const data = loadData();
  document.querySelectorAll('.journal-area').forEach(area => {
    const key = area.dataset.key;
    if (!key) return;
    if (data[key]) area.value = data[key];
    area.addEventListener('input', () => {
      const d = loadData(); d[key] = area.value; saveData(d);
    });
  });
}

// ── Day completion ────────────────────────────────────
function initCompleteBtn() {
  const btn = document.querySelector('.complete-btn');
  if (!btn) return;
  const dayNum = btn.dataset.day;
  const data   = loadData();
  if (data[`day_done_${dayNum}`]) {
    btn.textContent = '✔ Day Completed'; btn.classList.add('done');
  }
  btn.addEventListener('click', () => {
    const d = loadData();
    d[`day_done_${dayNum}`] = true; saveData(d);
    btn.textContent = '✔ Day Completed'; btn.classList.add('done');
    showToast('Day ' + dayNum + ' marked complete! Keep going 🙏', 'success');
    updateJourneyProgress();
  });
}

// ── Journey progress ──────────────────────────────────
function updateJourneyProgress() {
  const fill  = document.querySelector('.progress-fill');
  const label = document.querySelector('.progress-count');
  const cards = document.querySelectorAll('.day-card');
  const data  = loadData();
  let done = 0;
  cards.forEach(card => {
    const day = card.dataset.day;
    if (day && data[`day_done_${day}`]) { card.classList.add('done'); done++; }
  });
  const pct = Math.round((done / 21) * 100);
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = done + ' / 21';
}

// ── Accordion ─────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll('.accordion__trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion__item');
      const open = item.classList.contains('open');
      document.querySelectorAll('.accordion__item.open').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
}

// ── Mobile nav ───────────────────────────────────────
function initMobileNav() {
  const toggle = document.querySelector('.nav__toggle');
  const links  = document.querySelector('.nav__links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav') && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.textContent = '☰';
    }
  });
}

// ── Sticky nav shadow ─────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── Scroll-reveal animations ──────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

// ── Modal ────────────────────────────────────────────
function openModal(id)  { const el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn  => btn.addEventListener('click', () => openModal(btn.dataset.modalOpen)));
  document.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modalClose)));
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
}

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div'); toast.id = 'toast';
    toast.className = 'toast'; document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast toast--${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Track selection ───────────────────────────────────
function initTrackSelection() {
  document.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      const track = card.dataset.track; if (!track) return;
      const data = loadData(); data.selected_track = track; saveData(data);
    });
  });
}

// ── Highlight current day ─────────────────────────────
function highlightCurrentDay() {
  const data   = loadData();
  const maxDay = parseInt(data.selected_track || '21');
  let current  = 1;
  for (let i = 1; i <= maxDay; i++) { if (data[`day_done_${i}`]) current = i + 1; }
  const today = document.querySelector(`.day-card[data-day="${current}"]`);
  if (today) {
    today.style.borderColor = 'var(--purple-mid)';
    today.style.background  = 'var(--purple-pale)';
  }
}

// ── Share ─────────────────────────────────────────────
function shareDay(day, title) {
  const url  = window.location.href;
  const text = `Day ${day}: ${title} — Digital Prayer Companion`;
  if (navigator.share) {
    navigator.share({ title: 'Digital Prayer Companion', text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text}\n${url}`).then(() => showToast('Link copied!', 'info'));
  }
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initNavScroll();
  initAccordions();
  initModals();
  initJournal();
  initCompleteBtn();
  updateJourneyProgress();
  initTrackSelection();
  highlightCurrentDay();
  initScrollReveal();
});

window.showToast  = showToast;
window.openModal  = openModal;
window.closeModal = closeModal;
window.shareDay   = shareDay;
