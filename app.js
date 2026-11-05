// Shared navigation, legacy links, and the separate estate inquiry preview.
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
  // Preserve former signup and biography deep links after simplifying the page.
  function legacyLinks() {
    if (['#cherry-bombs', '#cherry-drops', '#vip'].includes(location.hash)) {
      if (!document.getElementById('contact')) return;
      history.replaceState(null, '', '#contact');
      document.getElementById('contact').scrollIntoView({behavior:'auto'});
      document.getElementById('contact-vip')?.focus({preventScroll:true});
    }
    if (location.hash === '#about' && document.body.classList.contains('landing-page') && !document.body.classList.contains('about-page')) location.replace('about.html');
  }
  legacyLinks();
  window.addEventListener('hashchange', legacyLinks);
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
        contact: 'Your message preview looks good. Nothing was sent or saved — please email cherrypickedchaos26@gmail.com or call 713-446-4832 to reach us.',
        signup: 'You’ve tried the Cherry Bombs signup! No subscription was created and no details were sent or saved. The mailing list is coming soon.',
        estate: 'Your estate inquiry preview is ready. Nothing was sent or saved, and no visit or service was booked. Please call 713-446-4832 or email cherrypickedchaos26@gmail.com to discuss your inquiry.'
      };
      response.textContent = messages[form.dataset.previewForm] || 'Preview only — nothing was sent or saved.';
      response.hidden = false;
    });
    form.addEventListener('input', () => { response.hidden = true; });
  });
});
