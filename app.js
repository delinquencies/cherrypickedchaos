// Shared navigation, legacy links, and the estate inquiry email handoff.
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
  const form = document.querySelector('[data-estate-email]');
  if (form) {
    const response = form.querySelector('.form-response');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const lines = [];
      for (const [name, value] of new FormData(form)) {
        if (!value.trim()) continue;
        const field = form.elements.namedItem(name);
        const label = field.labels[0].textContent;
        const text = field.selectedOptions?.[0]?.textContent ?? value.trim();
        lines.push(`${label}: ${text}`);
      }
      const subject = encodeURIComponent('Cherry Picked Chaos estate inquiry');
      const body = encodeURIComponent(lines.join('\r\n\r\n'));
      const href = `${form.getAttribute('action')}?subject=${subject}&body=${body}`;
      const retry = document.createElement('a');
      retry.href = href;
      retry.textContent = 'Open my prepared email →';
      response.replaceChildren('Review and send the draft from your email app. ', retry);
      response.hidden = false;
      window.location.href = href;
    });
    form.addEventListener('input', () => { response.hidden = true; });
  }
});
