const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.site-nav');

function closeMenu() {
  menu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

menuButton.addEventListener('click', () => {
  const opening = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', opening);
  menuButton.setAttribute('aria-expanded', String(opening));
  document.body.style.overflow = opening ? 'hidden' : '';
});

menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}
