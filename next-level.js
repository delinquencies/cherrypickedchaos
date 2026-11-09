// Small, independent enhancements. Core content and links work without JavaScript.
function initPhotoGallery(track, toolbar) {
  const count = toolbar.querySelector('.gallery-count');
  const buttons = [...toolbar.querySelectorAll('[data-gallery-step]')];
  const photos = [...track.children];
  if (photos.length < 2) return;

  function position() {
    const visible = Number(getComputedStyle(track).getPropertyValue('--gallery-columns'));
    const step = photos[1].offsetLeft - photos[0].offsetLeft;
    const last = Math.max(0, photos.length - visible);
    const first = step > 0 ? Math.min(last, Math.round(track.scrollLeft / step)) : 0;
    return { visible, last, first };
  }

  function updateControls() {
    const { visible, last, first } = position();
    const text = visible === 1
      ? `Photo ${first + 1} of ${photos.length}`
      : `Photos ${first + 1}–${Math.min(first + visible, photos.length)} of ${photos.length}`;
    if (count.textContent !== text) count.textContent = text;
    buttons[0].setAttribute('aria-disabled', String(first === 0));
    buttons[1].setAttribute('aria-disabled', String(first === last));
  }

  function moveTo(index) {
    const { last } = position();
    const target = photos[Math.min(last, Math.max(0, index))];
    track.scrollTo({ left: target.offsetLeft, behavior: 'instant' });
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    moveTo(position().first + Number(button.dataset.galleryStep));
  }));
  track.addEventListener('keydown', event => {
    const { first, last } = position();
    const targets = { ArrowLeft: first - 1, ArrowRight: first + 1, Home: 0, End: last };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    moveTo(targets[event.key]);
  });
  track.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(track);
  track.setAttribute('aria-describedby', 'gallery-hint');
  toolbar.hidden = false;
  updateControls();
}

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
    const href = form.getAttribute('action') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
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

  // Keep the illustrations as a fallback when approved photos can't be loaded.
  fetch('treasures.json?v=shop-gallery-1').then(response => {
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
    const toolbar = document.createElement('div');
    toolbar.className = 'gallery-toolbar';
    toolbar.hidden = true;
    toolbar.innerHTML = `
      <p class="gallery-hint" id="gallery-hint">Swipe or use the arrows to browse.</p>
      <div class="gallery-controls">
        <button type="button" data-gallery-step="-1" aria-label="Previous photo" aria-controls="shop-photos">←</button>
        <span class="gallery-count" role="status"></span>
        <button type="button" data-gallery-step="1" aria-label="Next photo" aria-controls="shop-photos">→</button>
      </div>
    `;
    const track = document.createElement('ul');
    track.className = 'gallery-track';
    track.id = 'shop-photos';
    track.tabIndex = 0;
    track.setAttribute('role', 'list');
    track.setAttribute('aria-label', 'Shop photos');
    for (const item of items) {
      const slide = document.createElement('li');
      const card = document.createElement('figure');
      card.className = 'gallery-card';
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = item.alt;
      image.width = item.width || 600;
      image.height = item.height || 750;
      image.src = item.image;
      const caption = document.createElement('figcaption');
      const title = document.createElement('strong');
      title.textContent = item.title;
      caption.append(title);
      if (item.tag) {
        const tag = document.createElement('span');
        tag.className = 'treasure-tag';
        tag.textContent = item.tag;
        card.append(tag);
      }
      if (item.description) {
        const description = document.createElement('span');
        description.textContent = item.description;
        caption.append(description);
      }
      card.append(image, caption);
      slide.append(card);
      track.append(slide);
    }
    gallery.classList.replace('gallery-grid', 'real-treasures');
    gallery.replaceChildren(toolbar, track);
    initPhotoGallery(track, toolbar);
    document.querySelector('.gallery-disclosure').textContent = 'Step inside and see what we’ve picked.';
    document.querySelector('.gallery-note').textContent = 'A peek at past displays. Finds change as we pick.';
  }).catch(() => { /* Keep the clearly labeled illustration gallery. */ });
});
