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
