// Shared navigation and local form previews. Commerce lives in demo.js.
document.addEventListener('DOMContentLoaded', () => {
  const opening = window.CPC_OPENING;
  if (opening) {
    document.querySelectorAll('[data-opening-date]').forEach(el => el.textContent = opening.dateLabel);
    document.querySelectorAll('[data-opening-hours]').forEach(el => el.textContent = opening.hoursLabel);
  }
  const menu = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('nav-links');
  function closeMenu(returnFocus = false) {
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    if (returnFocus) menu?.focus();
  }
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  // Newsletter uses a native modal, independent of the commerce demo drawer.
  const bombsPanel = document.getElementById('cherry-bombs-panel');
  let bombsOpener;
  let previousOverflow;
  function openBombs(opener) {
    if (!bombsPanel || bombsPanel.open) return;
    closeMenu();
    bombsOpener = opener || document.querySelector('[data-open-bombs]');
    previousOverflow = document.body.style.overflow;
    bombsPanel.showModal();
    document.body.style.overflow = 'hidden';
  }
  document.querySelectorAll('[data-open-bombs]').forEach(button => {
    button.addEventListener('click', () => openBombs(button));
  });
  bombsPanel?.querySelector('[data-close-bombs]')?.addEventListener('click', () => bombsPanel.close());
  bombsPanel?.addEventListener('click', event => {
    if (event.target !== bombsPanel) return;
    const bounds = bombsPanel.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) bombsPanel.close();
  });
  bombsPanel?.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow || '';
    if (bombsOpener?.closest('#nav-links') && !nav.classList.contains('open') && getComputedStyle(menu).display !== 'none') menu.focus();
    else bombsOpener?.focus({preventScroll:true});
  });
  if (location.hash === '#cherry-bombs') openBombs();
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
    closeMenu();
    if (link.hash && link.pathname === location.pathname) {
      const section = document.getElementById(link.hash.slice(1));
      const heading = section?.querySelector('h2');
      if (heading) {
        event.preventDefault();
        history.pushState(null, '', link.hash);
        section.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
        heading.setAttribute('tabindex', '-1');
        heading.focus({preventScroll:true});
      }
    }
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.site-header')) closeMenu();
  });
  document.querySelectorAll('[data-preview-form]').forEach(form => {
    const response = form.querySelector('.form-response');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const messages = {
        contact: 'Your message preview looks good. Nothing was sent or saved — the contact form is waiting for the shop’s details.',
        signup: 'You’ve tried the Cherry Bombs signup! No subscription was created and no details were sent or saved. The mailing list is coming soon.',
        estate: 'Your estate inquiry preview is ready. Nothing was sent or saved, and no visit or service was booked. The inquiry form will be connected when the client’s contact details are confirmed.'
      };
      response.textContent = messages[form.dataset.previewForm] || 'Preview only — nothing was sent or saved.';
      response.hidden = false;
    });
    form.addEventListener('input', () => { response.hidden = true; });
  });
});
