// Small, independent enhancements. Core content and links work without JavaScript.
document.addEventListener('DOMContentLoaded', () => {
  function updateTicket() {
    const state = window.CPC_SCHEDULE?.getState();
    if (!state) return;
    document.querySelectorAll('[data-opening-date]').forEach(el => el.textContent = state.dateLabel);
    document.querySelectorAll('[data-opening-countdown]').forEach(el => el.textContent = state.countdown);
    document.querySelectorAll('[data-next-calendar]').forEach(link => {
      link.hidden = !state.calendar;
      if (state.calendar) link.setAttribute('href', state.calendar);
    });
  }
  updateTicket();
  setInterval(updateTicket, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateTicket(); });

  const form = document.querySelector('[data-contact-email]');
  const message = form?.querySelector('[name="message"]');
  const vip = form?.querySelector('[name="vip"]');
  function validateMessage() {
    message?.setCustomValidity(!message.value.trim() && !vip.checked ? 'Please add a message, or tick the box to request Cherry Drops VIP emails.' : '');
  }
  form?.addEventListener('submit', event => {
    event.preventDefault();
    validateMessage();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const name = String(fields.get('name') || '').trim();
    const email = String(fields.get('email') || '').trim();
    const text = String(fields.get('message') || '').trim();
    const wantsVIP = fields.get('vip') === 'yes';
    const lines = ['Hi Melissa and Candy!', '', 'Name: ' + name, 'Email: ' + email, ''];
    if (text) lines.push('Message:', text, '');
    if (wantsVIP) lines.push('Cherry Drops VIP signup requested: YES.', 'I consent to emails about shop news, finds, and opening dates. I can ask to leave the list anytime.');
    const subject = wantsVIP ? 'Hello + Cherry Drops VIP request' : 'Hello from the Cherry Picked Chaos website';
    const href = 'mailto:cherrypickedchaos26@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    const response = form.querySelector('.form-response');
    response.replaceChildren(document.createTextNode('Your email is ready. Review and send it in your email app.' + (wantsVIP ? ' Your VIP request is included; no automatic subscription has been created.' : '') + ' '));
    const retry = document.createElement('a');retry.href = href;retry.textContent = 'Open my prepared email →';
    response.append(retry);response.hidden = false;
    window.location.href = href;
  });
  form?.addEventListener('input', () => { message.setCustomValidity(''); form.querySelector('.form-response').hidden = true; });
  vip?.addEventListener('change', () => { message.setCustomValidity(''); form.querySelector('.form-response').hidden = true; });

  const secret = document.querySelector('.secret-cherry');
  const notes = ['You found the cherry on top. Excellent snooping.', 'Some people collect stamps. We collect “just one more thing.”', 'Official diagnosis: a very good eye.'];
  let discoveries = 0;
  secret?.addEventListener('click', () => {
    document.querySelector('.secret-note').textContent = notes[discoveries++ % notes.length];
    secret.classList.remove('cherry-hop');
    requestAnimationFrame(() => secret.classList.add('cherry-hop'));
  });
  const stack = document.querySelector('.hero .photo-stack');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width:1051px)');
  let queued = false;
  function parallax() {
    if (!stack || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      stack.style.setProperty('--parallax', !motion.matches && wide.matches ? `${Math.min(scrollY * .025, 12)}px` : '0px');
      queued = false;
    });
  }
  addEventListener('scroll', parallax, {passive:true});
  wide.addEventListener('change', parallax); motion.addEventListener('change', parallax);

  // Only populate with client-approved photos and descriptions. Empty by design.
  // Keeping the illustrated fallback avoids implying sample imagery is current stock.
  fetch('treasures.json').then(response => {
    if (!response.ok) throw new Error('Gallery unavailable');
    return response.json();
  }).then(data => {
    const items = Array.isArray(data.items) ? data.items.filter(item =>
      item.approved === true && typeof item.title === 'string' && item.title.trim() &&
      typeof item.alt === 'string' && item.alt.trim() &&
      typeof item.image === 'string' && /^assets\/[a-zA-Z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(item.image) && !item.image.includes('..')
    ) : [];
    if (!items.length) return;
    const gallery = document.getElementById('treasure-gallery');
    if (!gallery) return;
    gallery.replaceChildren(); gallery.classList.add('real-treasures');
    for (const item of items) {
      const card = document.createElement('figure');card.className = 'gallery-card';
      const tag = document.createElement('span');tag.className = 'treasure-tag';tag.textContent = item.tag || 'Freshly Picked';
      const image = document.createElement('img');image.src = item.image;image.alt = item.alt;image.loading = 'lazy';image.width = 600;image.height = 750;
      const caption = document.createElement('figcaption');
      const title = document.createElement('strong');title.textContent = item.title;caption.append(title);
      if (item.description) { const description = document.createElement('span');description.textContent = item.description;caption.append(description); }
      card.append(tag, image, caption);gallery.append(card);
    }
    document.querySelector('.gallery-disclosure').textContent = 'A few client-approved finds from the shop. Ask us about availability before making a special trip.';
    document.querySelector('.gallery-note').textContent = 'Something catch your eye? Call or text 713-446-4832. No online checkout or reservations.';
  }).catch(() => { /* Keep the clearly labeled illustration gallery. */ });
});
