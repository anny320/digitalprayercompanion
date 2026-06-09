/* ── Digital Prayer Companion — App JS ─────────────── */

// ── Storage helpers ──────────────────────────────────
const STORAGE_KEY = 'dpc_v1';
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// ── Analytics helper ──────────────────────────────────
// Replace G-XXXXXXXXXX with your GA4 Measurement ID
function trackEvent(name, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', name, params);
  }
}

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
    trackEvent('day_completed', { day_number: parseInt(dayNum) });
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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
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
      trackEvent('track_selected', { track_days: parseInt(track) });
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

// ── Calendar ICS Generator ────────────────────────────
const DAY_TITLES = [
  '', // index 0 unused
  'Surrender & Alignment', 'Repentance & Cleansing', 'Clarity & Direction',
  'Faith Over Fear', 'Purpose & Calling', 'Healing & Wholeness',
  'Gratitude & Praise', 'Family & Relationships', 'Finances & Provision',
  'Work & Career', 'Discipline & Consistency', 'Obedience',
  'Peace & Rest', 'Spiritual Growth', 'Forgiveness',
  'Confidence in God', 'Patience & Trust', 'Community & Service',
  'Breakthrough & Hope', 'Thanksgiving & Testimony', 'Dedication & Commissioning'
];

function padZ(n) { return String(n).padStart(2, '0'); }

function toIcsDate(date) {
  return `${date.getFullYear()}${padZ(date.getMonth()+1)}${padZ(date.getDate())}`;
}

function toIcsDateTime(date) {
  return `${date.getFullYear()}${padZ(date.getMonth()+1)}${padZ(date.getDate())}T` +
         `${padZ(date.getHours())}${padZ(date.getMinutes())}00`;
}

function generateIcs(trackDays, name, startDate) {
  const siteUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
  let events = '';
  const start = new Date(startDate);
  start.setHours(6, 0, 0, 0);

  for (let i = 1; i <= trackDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + (i - 1));
    const end = new Date(day);
    end.setMinutes(30);

    const uid = `dpc-day-${i}-${Date.now()}@digitalprayercompanion`;
    const dtstart = toIcsDateTime(day);
    const dtend   = toIcsDateTime(end);
    const created = toIcsDateTime(new Date());

    events += `BEGIN:VEVENT\r\n`;
    events += `UID:${uid}\r\n`;
    events += `DTSTAMP:${created}Z\r\n`;
    events += `DTSTART:${dtstart}\r\n`;
    events += `DTEND:${dtend}\r\n`;
    events += `SUMMARY:Day ${i}: ${DAY_TITLES[i]} 🙏\r\n`;
    events += `DESCRIPTION:Open your Day ${i} reflection at ${siteUrl}day.html?day=${i}\\n\\nDigital Prayer Companion — ${name}\r\n`;
    events += `URL:${siteUrl}day.html?day=${i}\r\n`;
    events += `CATEGORIES:Prayer,Fasting,Spiritual\r\n`;
    events += `BEGIN:VALARM\r\nTRIGGER:-PT5M\r\nACTION:DISPLAY\r\nDESCRIPTION:Time for your Day ${i} prayer 🙏\r\nEND:VALARM\r\n`;
    events += `END:VEVENT\r\n`;
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Digital Prayer Companion//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Prayer Journey (${trackDays} Days)`,
    'X-WR-CALDESC:Digital Prayer Companion — Daily reminders',
    'X-WR-TIMEZONE:UTC',
    events.trim(),
    'END:VCALENDAR'
  ].join('\r\n');
}

function downloadIcs(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Calendar Modal Handler ────────────────────────────
function initCalendarForm() {
  const form = document.getElementById('calendar-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn       = form.querySelector('.cal-submit-btn');
    const name      = form.querySelector('[name="name"]').value.trim();
    const email     = form.querySelector('[name="email"]').value.trim();
    const trackSel  = form.querySelector('[name="track"]');
    const dateSel   = form.querySelector('[name="start_date"]');
    const track     = trackSel ? parseInt(trackSel.value) : (parseInt(loadData().selected_track) || 21);
    const startDate = dateSel  ? dateSel.value : new Date().toISOString().split('T')[0];

    if (!name || !email) { showToast('Please fill in your name and email.', 'info'); return; }

    btn.textContent = 'Generating…'; btn.disabled = true;

    // Submit to Formspree (replace YOUR_FORM_ID with your Formspree form ID)
    try {
      await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name, email,
          track: `${track}-day`,
          start_date: startDate,
          source: 'calendar_download',
          _subject: `Calendar download — ${name} (${track}-day fast)`
        })
      });
    } catch (_) { /* silent — still give them the download */ }

    // Save subscriber locally for analytics dashboard
    try {
      const SUBS_KEY = 'dpc_cal_subscribers';
      const subs = JSON.parse(localStorage.getItem(SUBS_KEY) || '[]');
      subs.push({ date: new Date().toLocaleDateString(), name, email, track, start_date: startDate });
      localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
    } catch (_) {}

    // Generate & download ICS
    const ics      = generateIcs(track, name, startDate);
    const filename = `prayer-companion-${track}-day.ics`;
    downloadIcs(ics, filename);

    trackEvent('calendar_downloaded', { track_days: track, name, email });

    closeModal('calendar-modal');
    showToast(`Calendar downloaded! Import it into Google Calendar or Apple Calendar. 🙏`, 'success');
    form.reset();
    btn.textContent = 'Download My Calendar';
    btn.disabled = false;
  });
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
  initCalendarForm();
  trackEvent('page_view', { page: window.location.pathname });
});

window.showToast  = showToast;
window.openModal  = openModal;
window.closeModal = closeModal;
window.shareDay   = shareDay;
