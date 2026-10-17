const root = document.documentElement;
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.site-nav');
const hero = document.querySelector('.hero');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopViewport = window.matchMedia('(min-width: 651px)');

function closeMenu(restoreFocus = false) {
  menu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('.sr-only').textContent = 'Abrir menu';
  document.body.style.overflow = '';
  if (restoreFocus) menuButton.focus({ preventScroll: true });
}

menuButton.addEventListener('click', () => {
  const opening = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', opening);
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.querySelector('.sr-only').textContent = opening ? 'Fechar menu' : 'Abrir menu';
  document.body.style.overflow = opening ? 'hidden' : '';
});

menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
});
desktopViewport.addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

// Cada bloco de texto reage sem transformar novamente seus elementos internos.
document.querySelectorAll('a:not(.skip-link), h1, h2, h3, h4, p:not(.current-aside), figcaption, time, cite, summary, .timeline-period, .section-index, .formation-mark, .service-number, .current-aside > span, .process-strip strong, .scroll-mark > span').forEach((element) => {
  element.classList.add('text-hover');
});

// O toque mostra o mesmo destaque do hover, sem prender a rolagem ou os links.
const touchFeedbackSelector = '.text-hover, .photo-window, .intro-photo, .repertoire-photos figure, .formation-step, .service-card, .timeline-list li, .process-strip article, .before-after article';
let touchFeedbackElements = [];
let touchFeedbackPointer = null;
let touchFeedbackTimeout;

function clearTouchFeedback() {
  clearTimeout(touchFeedbackTimeout);
  touchFeedbackElements.forEach((element) => element.classList.remove('is-touch-active'));
  touchFeedbackElements = [];
  touchFeedbackPointer = null;
}

document.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
  clearTouchFeedback();
  if (!event.isPrimary || !root.classList.contains('motion-enabled')) return;

  touchFeedbackElements = event.composedPath().filter((element) => element instanceof Element && element.matches(touchFeedbackSelector));
  if (!touchFeedbackElements.length) return;
  touchFeedbackPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  touchFeedbackElements.forEach((element) => element.classList.add('is-touch-active'));
}, { passive: true });

document.addEventListener('pointermove', (event) => {
  if (!touchFeedbackPointer || event.pointerId !== touchFeedbackPointer.id) return;
  if (Math.hypot(event.clientX - touchFeedbackPointer.x, event.clientY - touchFeedbackPointer.y) > 10) clearTouchFeedback();
}, { passive: true });

document.addEventListener('pointerup', (event) => {
  if (!touchFeedbackPointer || event.pointerId !== touchFeedbackPointer.id) return;
  touchFeedbackPointer = null;
  touchFeedbackTimeout = setTimeout(clearTouchFeedback, 600);
}, { passive: true });

document.addEventListener('pointercancel', clearTouchFeedback, { passive: true });
document.addEventListener('scroll', clearTouchFeedback, { passive: true, capture: true });
document.addEventListener('contextmenu', clearTouchFeedback, { passive: true });
window.addEventListener('blur', clearTouchFeedback);

// Sem JavaScript ou com movimento reduzido, todo o conteúdo permanece visível.
document.querySelectorAll('.before-after > div, .before-after article, .process-strip article, .closing-quote p, .footer > *').forEach((element) => {
  element.classList.add('reveal');
});

const revealGroups = [
  ['.formation-step', 85],
  ['.service-card', 110],
  ['.timeline-list li', 90],
  ['.current-aside > span', 130],
  ['.repertoire-photos figure', 120],
  ['.before-after > div, .before-after article', 90],
  ['.process-strip article', 85],
  ['.closing-quote p', 100],
  ['.footer > *', 80],
];
revealGroups.forEach(([selector, interval]) => {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${index * interval}ms`);
  });
});
document.querySelectorAll('.hero-content > *').forEach((element, index) => {
  element.style.setProperty('--intro-delay', `${100 + index * 110}ms`);
});

const revealElements = [...document.querySelectorAll('.reveal')];
let revealObserver;
let animationFrame = 0;
let heroIsVisible = true;

function updateScrollEffects() {
  animationFrame = 0;
  const scrollableHeight = root.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
  root.style.setProperty('--reading-progress', progress.toFixed(4));

  if (!root.classList.contains('motion-enabled')) return;
  const offset = desktopViewport.matches && heroIsVisible ? Math.min(24, Math.max(0, -hero.getBoundingClientRect().top * 0.045)) : 0;
  hero.style.setProperty('--hero-offset', `${offset.toFixed(1)}px`);
}

function requestScrollUpdate() {
  if (!animationFrame) animationFrame = requestAnimationFrame(updateScrollEffects);
}

function updateMotion() {
  const enabled = !motionPreference.matches;
  root.classList.toggle('motion-ready', !motionPreference.matches);
  root.classList.toggle('motion-enabled', enabled);
  root.classList.toggle('page-hidden', document.hidden);
  if (!enabled) {
    hero.classList.remove('intro-animate');
    clearTouchFeedback();
  }

  if (revealObserver) revealObserver.disconnect();
  if (enabled && !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else if (enabled) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    revealElements.filter((element) => !element.classList.contains('is-visible')).forEach((element) => revealObserver.observe(element));
  }
  requestScrollUpdate();
}

motionPreference.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', () => {
  root.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) clearTouchFeedback();
  if (!document.hidden) requestScrollUpdate();
});

if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    heroIsVisible = entry.isIntersecting;
    hero.classList.toggle('is-in-view', heroIsVisible);
    requestScrollUpdate();
  });
  heroObserver.observe(hero);
} else {
  hero.classList.add('is-in-view');
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
window.addEventListener('load', requestScrollUpdate, { once: true });
updateMotion();
if (root.classList.contains('motion-enabled')) hero.classList.add('intro-animate');
