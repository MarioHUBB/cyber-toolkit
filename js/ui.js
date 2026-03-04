/* ============================================================
   ui.js — Shared UI utilities
   • Light mode default (dark mode optional via toggle)
   • Navbar active state & hamburger
   • Toast notifications
   • Spark / electricity grid animation (canvas)
   ============================================================ */

/* ── Theme: light is default ── */
(function initTheme() {
  const saved = localStorage.getItem('cyberTheme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cyberTheme', next);
  _syncThemeIcon();
  _updateSparkColour();
}

function _syncThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  btn.textContent = theme === 'light' ? '🌙' : '☀️';
}

/* ── Navbar active link ── */
function setNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === path) a.classList.add('active');
    else a.classList.remove('active');
  });
  _syncThemeIcon();
}

/* ── Hamburger menu ── */
function initHamburger() {
  const burger = document.getElementById('navHamburger');
  const links  = document.getElementById('navLinks');
  if (!burger || !links) return;
  burger.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => links.classList.remove('open'))
  );
}

/* ── Toast notifications ── */
function showToast(msg, type, duration) {
  type = type || 'info';
  duration = duration || 2400;
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast' +
    (type === 'error' ? ' error' : type === 'warn' ? ' warn' : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '0.3s ease';
    setTimeout(function() { toast.remove(); }, 340);
  }, duration);
}

/* ============================================================
   SPARK / ELECTRICITY GRID ANIMATION
   One full-screen canvas sits behind all content.
   Grid cell = 48px (matches CSS grid lines).
   Sparks travel along grid lines with a glowing tail.
   Max 6 simultaneous sparks for smooth performance.
   ============================================================ */

var GRID_SIZE    = 48;
var MAX_SPARKS   = 6;
var SPAWN_MS     = 700;   // ms between spawn attempts

var _canvas = null;
var _ctx    = null;
var _sparks = [];
var _sparkRGB = '0,100,200'; // updated per theme

function _updateSparkColour() {
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  _sparkRGB = dark ? '0,220,255' : '0,100,200';
}

function initSparkCanvas() {
  _canvas = document.createElement('canvas');
  _canvas.id = 'sparkCanvas';
  document.body.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');
  _updateSparkColour();
  _resizeCanvas();
  window.addEventListener('resize', _resizeCanvas);
  setInterval(_spawnSpark, SPAWN_MS);
  _animLoop();
}

function _resizeCanvas() {
  if (!_canvas) return;
  _canvas.width  = window.innerWidth;
  _canvas.height = window.innerHeight;
}

function _spawnSpark() {
  if (_sparks.length >= MAX_SPARKS) return;
  var W = _canvas.width;
  var H = _canvas.height;
  var horiz = Math.random() < 0.5;
  var speed = 2.5 + Math.random() * 2;

  if (horiz) {
    var row = Math.floor(Math.random() * Math.floor(H / GRID_SIZE));
    var y   = row * GRID_SIZE;
    var rtl = Math.random() < 0.5;
    _sparks.push({ x: rtl ? W : 0, y: y, dx: rtl ? -speed : speed, dy: 0,
      life: 1.0, decay: 0.010 + Math.random() * 0.010,
      size: 1.8 + Math.random() * 1.4, tail: [] });
  } else {
    var col = Math.floor(Math.random() * Math.floor(W / GRID_SIZE));
    var x   = col * GRID_SIZE;
    var btt = Math.random() < 0.5;
    _sparks.push({ x: x, y: btt ? H : 0, dx: 0, dy: btt ? -speed : speed,
      life: 1.0, decay: 0.010 + Math.random() * 0.010,
      size: 1.8 + Math.random() * 1.4, tail: [] });
  }
}

function _animLoop() {
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  _sparks = _sparks.filter(function(s) { return s.life > 0; });

  _sparks.forEach(function(s) {
    s.tail.push({ x: s.x, y: s.y, life: s.life });
    if (s.tail.length > 20) s.tail.shift();

    /* Draw tail segments */
    for (var i = 0; i < s.tail.length - 1; i++) {
      var t     = s.tail[i];
      var alpha = (i / s.tail.length) * t.life * 0.45;
      _ctx.beginPath();
      _ctx.strokeStyle = 'rgba(' + _sparkRGB + ',' + alpha.toFixed(3) + ')';
      _ctx.lineWidth   = s.size * (i / s.tail.length);
      _ctx.moveTo(t.x, t.y);
      _ctx.lineTo(s.tail[i + 1].x, s.tail[i + 1].y);
      _ctx.stroke();
    }

    /* Draw head glow */
    var r   = s.size * 6;
    var grd = _ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
    grd.addColorStop(0, 'rgba(' + _sparkRGB + ',' + (s.life * 0.85).toFixed(3) + ')');
    grd.addColorStop(1, 'rgba(' + _sparkRGB + ',0)');
    _ctx.beginPath();
    _ctx.fillStyle = grd;
    _ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    _ctx.fill();

    s.x    += s.dx;
    s.y    += s.dy;
    s.life -= s.decay;
  });

  requestAnimationFrame(_animLoop);
}

/* ── DOM-ready init ── */
document.addEventListener('DOMContentLoaded', function() {
  setNavActive();
  initHamburger();
  initSparkCanvas();
});
