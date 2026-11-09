const button = document.querySelector('.lucky-button');
const finds = [...document.querySelectorAll('.card')];
const filters = document.querySelector('.filters');

if (filters && button) {
  const empty = document.querySelector('.empty-category');
  const controls = [...filters.querySelectorAll('[data-filter]')];
  let visibleFinds = finds;
  let previous;
  filters.hidden = false;
  button.hidden = finds.length < 2;

  controls.forEach(control => control.addEventListener('click', () => {
    const category = control.dataset.filter;
    previous?.classList.remove('lucky-pick');
    previous = undefined;
    controls.forEach(filter => filter.setAttribute('aria-pressed', String(filter === control)));
    visibleFinds = finds.filter(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      return !card.hidden;
    });
    empty.hidden = visibleFinds.length !== 0;
    button.hidden = finds.length < 2 || visibleFinds.length === 0;
  }));

  button.addEventListener('click', () => {
    previous?.classList.remove('lucky-pick');
    const options = visibleFinds.length > 1 ? visibleFinds.filter(card => card !== previous) : visibleFinds;
    previous = options[Math.floor(Math.random() * options.length)];
    previous.classList.add('lucky-pick');
    previous.focus({ preventScroll: true });
    previous.scrollIntoView({
      block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  });
}

const drawer = document.querySelector('.bag-drawer');
if (drawer && typeof drawer.showModal === 'function') {
  const opener = document.querySelector('.bag-toggle');
  const count = opener.querySelector('.bag-count');
  const close = drawer.querySelector('.bag-close');
  const list = drawer.querySelector('.bag-items');
  const empty = drawer.querySelector('.bag-empty');
  const subtotal = drawer.querySelector('.bag-subtotal strong');
  const addButtons = [...document.querySelectorAll('.bag-add')];
  const products = new Map(addButtons.map(add => [add.dataset.bagItem, add]));
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const storageKey = drawer.dataset.storageKey;
  let bag = new Set();

  function restoreBag() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      bag = new Set(Array.isArray(saved) ? saved.filter(id => products.has(id)) : []);
    } catch {
      // The bag still works for this page if browser storage is unavailable.
    }
  }

  function updateBag() {
    try { localStorage.setItem(storageKey, JSON.stringify([...bag])); } catch {}
    renderBag();
  }

  function renderBag() {
    count.textContent = bag.size;
    empty.hidden = bag.size > 0;
    let cents = 0;
    const rows = [...bag].map((id, index) => {
      const add = products.get(id);
      const card = add.closest('.card');
      const price = Number(add.dataset.priceCents);
      cents += price;

      const row = document.createElement('li');
      const image = document.createElement('img');
      image.src = card.querySelector('.card-photo img').src;
      image.alt = '';
      const details = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = card.querySelector('h2').textContent;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + title.textContent);
      remove.addEventListener('click', () => {
        bag.delete(id);
        updateBag();
        const buttons = list.querySelectorAll('button');
        (buttons[index] ?? buttons[index - 1] ?? close).focus();
      });
      const amount = document.createElement('strong');
      amount.textContent = currency.format(price / 100);
      details.append(title, remove);
      row.append(image, details, amount);
      return row;
    });
    list.replaceChildren(...rows);
    subtotal.textContent = currency.format(cents / 100);
  }

  addButtons.forEach(add => {
    add.hidden = false;
    add.addEventListener('click', () => {
      const id = add.dataset.bagItem;
      if (!bag.has(id)) {
        bag.add(id);
        updateBag();
      }
      add.focus({ preventScroll: true });
      drawer.showModal();
    });
  });
  opener.hidden = false;
  opener.addEventListener('click', () => drawer.showModal());
  drawer.addEventListener('click', event => {
    if (event.target === drawer && event.clientX < drawer.getBoundingClientRect().left) drawer.close();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      restoreBag();
      renderBag();
    }
  });
  restoreBag();
  renderBag();
}
