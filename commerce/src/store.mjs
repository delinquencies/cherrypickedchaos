import { demoShippingCents, shippingCents, shippingOrigin, shippingRateMode } from './shipping.mjs';

const imageLimit = 1_000_000;
const itemId = '[a-f0-9-]{36}';
const packageColumns = 'ship_weight_lb, ship_length_in, ship_width_in, ship_height_in';
const packageFields = [
  ['ship_weight_lb', 'Packed weight (lb)', 0.01, 70],
  ['ship_length_in', 'Box length (in)', 1, 108],
  ['ship_width_in', 'Box width (in)', 1, 108],
  ['ship_height_in', 'Box height (in)', 1, 108]
];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const categories = {
  wear: 'Vintage Wear',
  stoneware: 'Stoneware',
  primitives: 'Primitives',
  americana: 'Americana',
  'vintage-clothes': 'Vintage Clothes',
  records: 'Records',
  ephemera: 'Ephemera',
  toys: 'Toys',
  kitchenware: 'Kitchenware',
  gadgets: 'Gadgets',
  gifts: 'Gifts',
  oddities: 'Oddities',
  seasonal: 'Seasonal',
  glassware: 'Glassware',
  'handbags-accessories': 'Handbags & Accessories',
  jewelry: 'Jewelry',
  'sports-collectibles': 'Sports Collectibles',
  'pop-culture-collectibles': 'Pop Culture Collectibles',
  furniture: 'Furniture',
  'crafts-sewing': 'Crafts & Sewing',
  other: 'Other Finds'
};
const categoriesByName = Object.entries(categories)
  .sort(([, left], [, right]) => left.localeCompare(right, 'en-US'));
const securityHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex'
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function page(title, content, status = 200, { editor = false, shop = false, showBag = false } = {}) {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fff9ee">
  <title>${escapeHtml(title)} | Cherry Picked Chaos</title>
  <link rel="icon" href="/brand/cherries.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/store.css">
  ${editor ? '<script defer src="/manage.js"></script>' : ''}
  ${shop ? '<script defer src="/shop.js"></script>' : ''}
</head>
<body>
  <div class="announcement">A little vintage • A lotta personality • Schulenburg, Texas</div>
  <header class="site-header">
    <div class="container header-row">
      <a class="brand" href="/" aria-label="Cherry Picked Chaos storefront">
        <img src="/brand/cherries.svg" alt="" width="50" height="54">
        <span>Cherry Picked <strong>Chaos!</strong></span>
      </a>
      <div class="header-actions">
        <a class="header-link" href="${shop ? 'https://www.cherrypickedchaos.com/' : '/'}">${shop ? '← Back to the main site' : 'View shop ↗'}</a>
        ${showBag ? '<button class="bag-toggle" type="button" aria-haspopup="dialog" aria-controls="shop-bag" hidden>Bag <span class="bag-count">0</span></button>' : ''}
      </div>
    </div>
  </header>
  <main class="${shop ? 'shop' : 'container workspace'}">${content}</main>
  ${shop ? '<footer class="site-footer"><div class="container"><strong>Cherry Picked Chaos!</strong><p>Curated with intention. Chosen just for you. ♥</p></div></footer>' : ''}
</body>
</html>`, { status, headers: { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
}

function redirect(path) {
  return new Response(null, { status: 303, headers: { ...securityHeaders, Location: path } });
}

const sampleFinds = [
  { title: 'Chainstitch Embroidered Denim Jacket', image: 'jacket', price_cents: 18500, category: 'wear', description: 'Western floral chainstitch on well-worn denim.', ship_weight_lb: 3, ship_length_in: 14, ship_width_in: 10, ship_height_in: 4 },
  { title: 'Texas Salt-Glazed Stoneware Crock', image: 'crock', price_cents: 14500, category: 'stoneware', description: 'Cobalt-blue folk floral details and old mercantile charm.' },
  { title: 'Vintage Texas Gasoline Porcelain Sign', image: 'sign', price_cents: 32000, category: 'americana', description: 'Weathered roadside style with collectible Texas character.' },
  { title: 'Primitive Pine Dough Bowl & Scoop', image: 'bowl', price_cents: 21000, category: 'primitives', description: 'Rustic hand-carved wood with a warm aged patina.' }
];

function shippingControl(item, id, ratesAvailable) {
  if (item.status === 'sold') return '';
  if (!item.ship_weight_lb) return '<p class="fulfillment-note">Local pickup</p>';
  if (!ratesAvailable) return '<p class="fulfillment-note">Local pickup · U.S. shipping rates coming soon</p>';
  return `<details class="shipping">
    <summary>Calculate U.S. shipping</summary>
    <form action="/shipping/${id}" method="get">
      <label for="zip-${id}">Delivery ZIP code</label>
      <div class="shipping-row">
        <input id="zip-${id}" name="zip" type="text" inputmode="numeric" autocomplete="shipping postal-code" pattern="[0-9]{5}" maxlength="5" required>
        <button type="submit">Get estimate</button>
      </div>
    </form>
    <p class="hint">Local pickup is also available.</p>
  </details>`;
}

function bagDrawer(preview, showSamples) {
  const storageKey = showSamples ? 'cpc-demo-bag' : preview ? 'cpc-preview-listing-bag' : 'cpc-shop-bag';
  return `<dialog class="bag-drawer" id="shop-bag" aria-labelledby="bag-title" aria-describedby="bag-note" data-storage-key="${storageKey}">
    <div class="bag-heading">
      <h2 id="bag-title">${preview ? 'Demo Bag' : 'Your Bag'} ♥</h2>
      <form method="dialog"><button class="bag-close" type="submit" aria-label="Close bag" autofocus>✕</button></form>
    </div>
    <p class="hint" id="bag-note">${preview ? 'Preview only. ' : ''}Adding a find doesn’t reserve it or place an order.</p>
    <p class="bag-empty">A little empty in here! Find a treasure to tuck away.</p>
    <ul class="bag-items" aria-label="Finds in your bag"></ul>
    <p class="bag-subtotal"><span>Item subtotal</span><strong>$0.00</strong></p>
    <div class="bag-actions">
      <form action="/checkout" method="get" class="bag-checkout" hidden>
        <input type="hidden" name="items">
        <button type="submit">${preview ? 'Checkout' : 'View order summary'}</button>
      </form>
      <form method="dialog"><button class="continue-shopping" type="submit">Continue shopping</button></form>
    </div>
  </dialog>`;
}

function storefront(items, preview, ratesAvailable) {
  const showSamples = preview && items.length === 0;
  const finds = showSamples ? sampleFinds : items;
  const listedCategories = new Set(finds.map(item => item.category));
  const showBag = !preview || finds.some(item => item.status !== 'sold');
  const cards = finds.map(item => {
    const id = showSamples ? 'sample-' + item.image : item.id;
    return `
    <article class="card" id="find-${id}" tabindex="-1" data-category="${item.category}">
      <div class="card-photo">
        <img src="${showSamples ? '/samples/' + item.image + '.webp' : '/photo/' + item.id + '?v=' + item.version}" alt="${escapeHtml(item.title)}" loading="lazy">
        <span class="tag">${showSamples ? 'Sample listing' : item.status === 'sold' ? 'Sold' : 'One of a kind'}</span>
      </div>
      <div class="card-body">
        <span class="category-tag">${escapeHtml(categories[item.category])}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="description">${escapeHtml(item.description)}</p>
        <p class="price">${currency.format(item.price_cents / 100)}${showSamples ? '<small>Illustrative price</small>' : ''}</p>
        ${item.status !== 'sold' ? `<button class="bag-add" type="button" data-bag-item="${showSamples ? item.image : id}" data-price-cents="${item.price_cents}" hidden>${preview ? 'Add to demo bag' : 'Add to bag'}</button>` : ''}
        ${shippingControl(item, id, ratesAvailable)}
      </div>
    </article>`;
  }).join('');
  const filters = categoriesByName
    .filter(([category]) => listedCategories.has(category))
    .map(([category, label]) => `<button type="button" data-filter="${category}" aria-pressed="false">${escapeHtml(label)}</button>`).join('');
  return page('Shop Selected Finds', `
    <section class="shop-hero">
      <img class="hero-cherries" src="/brand/cherries.svg" alt="" aria-hidden="true" width="145" height="150">
      <div class="container">
        <p class="eyebrow">The digital treasure table</p>
        <h1>Good stuff, <em>picked for you.</em></h1>
        <p>One-of-a-kind vintage finds, picked with love in Schulenburg.</p>
      </div>
    </section>
    <section class="container shop-finds" aria-label="Shop finds">
      <p class="notice">${showSamples ? 'These sample finds and prices are for browsing. ' : ''}Online checkout is coming soon.</p>
      ${cards ? `
        <div class="lucky-bar">
          <p>Go on, have a little look!</p>
          <button class="lucky-button" type="button" hidden><img src="/brand/cherries.svg" alt="" width="24" height="24"> Surprise me!</button>
        </div>
        <div class="filters" role="group" aria-label="Product categories" hidden>
          <button type="button" data-filter="all" aria-pressed="true">✦ All Finds</button>${filters}
        </div>
        <div class="grid">${cards}</div>
        <p class="empty-category" role="status" hidden>No finds in this category yet.</p>` : '<p>No finds have been published yet.</p>'}
    </section>
    ${showBag ? bagDrawer(preview, showSamples) : ''}`, 200, { shop: true, showBag });
}

function editor(item = null) {
  const editing = item !== null;
  const id = editing ? item.id : '';
  const categoryOptions = categoriesByName.map(([value, label]) =>
    `<option value="${value}"${item?.category === value ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('');
  const ships = Boolean(item?.ship_weight_lb);
  const packageInputs = packageFields.map(([name, label, min, max]) => `
    <label>${label}<input name="${name}" type="number" inputmode="decimal" min="${min}" max="${max}" step="0.01" value="${item?.[name] ?? ''}"></label>`).join('');
  return `
    <form class="editor" method="post" enctype="multipart/form-data" action="/manage/save">
      <input type="hidden" name="id" value="${id}">
      <input type="hidden" name="version" value="${item?.version ?? ''}">
      <label>Title <input name="title" required maxlength="100" value="${escapeHtml(item?.title ?? '')}"></label>
      <label>Category <select name="category" required><option value="">Choose a category</option>${categoryOptions}</select></label>
      <label>Description and condition <textarea name="description" required maxlength="2000" rows="5">${escapeHtml(item?.description ?? '')}</textarea></label>
      <label>Price in dollars <input name="price" type="number" inputmode="decimal" min="0.01" max="99999.99" step="0.01" required value="${editing ? (item.price_cents / 100).toFixed(2) : ''}"></label>
      <label>Fulfillment <select name="fulfillment">
        <option value="pickup">Local pickup only</option>
        <option value="ship"${ships ? ' selected' : ''}>Local pickup or U.S. shipping</option>
      </select></label>
      <fieldset class="package-fields" aria-describedby="package-help">
        <legend>Shipping package</legend>
        <p id="package-help" class="hint">For shippable finds, enter the weight and outside dimensions of the packed box, including padding.</p>
        <div>${packageInputs}</div>
      </fieldset>
      <label>${editing ? 'Replace photo (optional)' : 'Photo'}
        <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" ${editing ? '' : 'required'}>
      </label>
      <p id="photo-help" class="hint">Choose a JPEG, PNG, or WebP. Larger photos are resized in your browser.</p>
      <button type="submit">${editing ? 'Save changes' : 'Save draft'}</button>
    </form>`;
}

function manage(items, preview) {
  const rows = items.map(item => `
    <li>
      <div><strong>${escapeHtml(item.title)}</strong><br><span class="hint">${currency.format(item.price_cents / 100)} · ${escapeHtml(categories[item.category])} · ${item.status}</span></div>
      <a href="/manage/item/${item.id}">Edit listing →</a>
    </li>`).join('');
  return page('Manage listings', `
    <p class="eyebrow">Behind the treasure table</p>
    <h1>Manage listings.</h1>
    ${preview ? '<p class="notice">Local preview. Listings saved here stay on this computer.</p>' : ''}
    <a class="button" href="/manage/new">Add a find</a>
    <h2>Your finds</h2>
    ${rows ? `<ul class="listings">${rows}</ul>` : '<p>No listings yet. Add your first find and save it as a draft.</p>'}`);
}

function editPage(item) {
  const actions = item.status === 'draft' ? [['published', 'Publish to shop']] :
    item.status === 'published' ? [['draft', 'Take off the shop'], ['sold', 'Mark sold']] :
      [['draft', 'Move back to draft']];
  const controls = actions.map(([status, label]) => `
    <form action="/manage/status" method="post">
      <input type="hidden" name="id" value="${item.id}">
      <input type="hidden" name="version" value="${item.version}">
      <button type="submit" name="status" value="${status}">${label}</button>
    </form>`).join('');
  return page('Edit listing', `
    <a href="/manage">← All listings</a>
    <h1>Edit listing.</h1>
    <p class="notice">Status: <strong>${item.status}</strong></p>
    <div class="actions">${controls}
      ${item.status === 'draft' ? `<a class="button" href="/manage/item/${item.id}/delete">Delete draft</a>` : ''}
    </div>
    <img class="editor-photo" src="/manage/photo/${item.id}?v=${item.version}" alt="${escapeHtml(item.title)}">
    ${editor(item)}`, 200, { editor: true });
}

function confirmDeleteDraft(item) {
  if (item.status !== 'draft') return staleListing();
  return page('Delete draft', `
    <h1>Delete draft?</h1>
    <p>This permanently deletes <strong>${escapeHtml(item.title)}</strong> and its photo.</p>
    <div class="actions">
      <a class="button" href="/manage/item/${item.id}">Cancel</a>
      <form action="/manage/delete" method="post">
        <input type="hidden" name="id" value="${item.id}">
        <input type="hidden" name="version" value="${item.version}">
        <button type="submit">Permanently delete draft</button>
      </form>
    </div>`);
}

class ListingError extends Error {}

function getField(form, name) {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function validateDetails(form) {
  const title = getField(form, 'title');
  const description = getField(form, 'description');
  const price = getField(form, 'price');
  if (!title || title.length > 100) throw new ListingError('Enter a title of up to 100 characters.');
  if (!description || description.length > 2000) throw new ListingError('Enter a description of up to 2,000 characters.');
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(price)) throw new ListingError('Enter a price such as 24.50.');
  const [dollars, cents = ''] = price.split('.');
  const priceCents = Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
  if (priceCents < 1) throw new ListingError('Enter a price greater than zero.');
  return { title, description, priceCents };
}

function validatePackage(form) {
  const fulfillment = getField(form, 'fulfillment');
  if (fulfillment === '' || fulfillment === 'pickup') return [null, null, null, null];
  if (fulfillment !== 'ship') throw new ListingError('Choose a valid fulfillment option.');
  const [weight, ...dimensions] = packageFields.map(([name, , min, max]) => {
    const raw = getField(form, name);
    const value = Number(raw);
    if (!/^(?:\d{1,3}(?:\.\d{1,2})?|\.\d{1,2})$/.test(raw) || value < min || value > max) {
      throw new ListingError('Enter the packed weight and all three box dimensions within the displayed limits.');
    }
    return value;
  });
  const [length, width, height] = dimensions.sort((a, b) => b - a);
  if (Math.round((length + 2 * (width + height)) * 100) > 13000) {
    throw new ListingError('The longest side plus the distance around the box must be 130 inches or less.');
  }
  return [weight, length, width, height];
}

async function readPhoto(form) {
  const file = form.get('photo');
  if (!(file instanceof File) || !file.size) return null;
  if (file.size > imageLimit) throw new ListingError('The photo must be 1 MB or smaller after resizing.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const starts = (...signature) => signature.every((byte, index) => bytes[index] === byte);
  const webp = starts(82, 73, 70, 70) && bytes.slice(8, 12).join() === '87,69,66,80';
  const mime = starts(255, 216, 255) ? 'image/jpeg' :
    starts(137, 80, 78, 71, 13, 10, 26, 10) ? 'image/png' :
      webp ? 'image/webp' : '';
  if (!mime) throw new ListingError('Choose a JPEG, PNG, or WebP photo.');
  return { mime, bytes };
}

async function saveListing(db, form) {
  const id = getField(form, 'id');
  const version = Number(getField(form, 'version'));
  const { title, description, priceCents } = validateDetails(form);
  const category = getField(form, 'category') || null;
  if (category !== null && !Object.hasOwn(categories, category)) throw new ListingError('Choose a valid category.');
  const packageValues = validatePackage(form);
  const photo = await readPhoto(form);
  if (!id) {
    if (!photo) throw new ListingError('Choose a photo for the listing.');
    const newId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO listings (id, title, description, price_cents, category, image_mime, image, updated_at, ${packageColumns})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(newId, title, description, priceCents, category ?? 'other', photo.mime, photo.bytes, new Date().toISOString(), ...packageValues).run();
    return redirect('/manage/item/' + newId);
  }
  if (!new RegExp(`^${itemId}$`).test(id) || !Number.isInteger(version) || version < 1) {
    throw new ListingError('This listing could not be updated.');
  }
  const photoFields = photo ? ', image_mime = ?, image = ?' : '';
  const values = [];
  if (photo) values.push(photo.mime, photo.bytes);
  const shippingFields = form.has('fulfillment') ? ', ship_weight_lb = ?, ship_length_in = ?, ship_width_in = ?, ship_height_in = ?' : '';
  if (shippingFields) values.push(...packageValues);
  const result = await db.prepare(`
    UPDATE listings SET title = ?, description = ?, price_cents = ?, category = COALESCE(?, category), updated_at = ?,
      version = version + 1 ${photoFields} ${shippingFields} WHERE id = ? AND version = ?
  `).bind(title, description, priceCents, category, new Date().toISOString(), ...values, id, version).run();
  if (!result.meta.changes) return staleListing();
  return redirect('/manage/item/' + id);
}

function staleListing() {
  return page('Listing changed', '<h1>This listing changed.</h1><p>Open it again to see its latest details.</p><a href="/manage">Return to your listings →</a>', 409);
}

async function setStatus(db, form) {
  const id = getField(form, 'id');
  const version = Number(getField(form, 'version'));
  const status = getField(form, 'status');
  const allowed = { draft: ['published', 'sold'], published: ['draft'], sold: ['published'] };
  if (!Object.hasOwn(allowed, status) || !new RegExp(`^${itemId}$`).test(id) || !Number.isInteger(version) || version < 1) {
    throw new ListingError('Choose an available listing action.');
  }
  const [first, second = first] = allowed[status];
  const result = await db.prepare(`
    UPDATE listings SET status = ?, updated_at = ?, version = version + 1
    WHERE id = ? AND version = ? AND status IN (?, ?)
  `).bind(status, new Date().toISOString(), id, version, first, second).run();
  if (!result.meta.changes) return staleListing();
  return redirect('/manage/item/' + id);
}

async function deleteDraft(db, form) {
  const id = getField(form, 'id');
  const version = Number(getField(form, 'version'));
  if (!new RegExp(`^${itemId}$`).test(id) || !Number.isInteger(version) || version < 1) {
    throw new ListingError('This draft could not be deleted.');
  }
  const result = await db.prepare("DELETE FROM listings WHERE id = ? AND version = ? AND status = 'draft'")
    .bind(id, version).run();
  if (!result.meta.changes) return staleListing();
  return redirect('/manage');
}

function notFound() {
  return page('Page not found', '<h1>This page wandered off.</h1><a href="/">Back to the shop →</a>', 404);
}

async function shopListings(db) {
  const { results } = await db.prepare(`
    SELECT id, title, description, price_cents, status, version, category, ${packageColumns} FROM listings
    WHERE status IN ('published', 'sold') ORDER BY status, updated_at DESC
  `).all();
  return results;
}

function validShippingZip(zip) {
  return /^\d{5}$/.test(zip) && zip !== '00000';
}

async function quoteShipping(items, zip, env, mode, clientIp) {
  if (mode === 'example') return { cents: demoShippingCents * items.length, status: 200 };
  if (!mode) return { cents: null, status: 503, message: 'U.S. shipping rates are coming soon. Local pickup is available.' };
  if (items.length > 10) return { cents: null, status: 400, message: 'Estimate shipping for up to 10 finds at a time.' };
  try {
    if (mode === 'live' && !(await env.SHIPPING_RATE_LIMIT.limit({ key: clientIp })).success) {
      return { cents: null, status: 429, message: 'Too many shipping estimates. Try again in a minute.' };
    }
    const prices = await Promise.all(items.map(item => shippingCents(item, zip, env)));
    if (prices.every(price => price !== null)) {
      return { cents: prices.reduce((total, price) => total + price, 0), status: 200 };
    }
    return { cents: null, status: 200, message: 'A rate is unavailable for this ZIP and package. Check the ZIP code or choose local pickup.' };
  } catch {
    return { cents: null, status: 503, message: 'The carrier rate lookup is temporarily unavailable. Try again shortly.' };
  }
}

async function checkoutSummary(env, params, preview, clientIp) {
  const listings = await shopListings(env.STORE_DB);
  const finds = preview && !listings.length ? sampleFinds : listings.filter(item => item.status === 'published');
  const available = new Map(finds.map(item => [item.id ?? item.image, item]));
  const ids = [...new Set((params.get('items') ?? '').split(',').filter(Boolean))];
  const items = ids.map(id => available.get(id)).filter(Boolean);
  const back = '<a href="/">← Back to the shop</a>';
  const title = preview ? 'Demo checkout' : 'Order summary';
  const heading = `${back}<h1>${title}.</h1>`;
  if (!items.length || items.length !== ids.length) {
    return page(title, `${heading}<p>${ids.length ? 'A find in your bag is no longer available. Return to the shop to review your bag.' : 'Add a find to your bag to see its order summary.'}</p>`);
  }

  const canShip = items.every(item => item.ship_weight_lb);
  const zip = params.get('zip')?.trim() ?? '';
  const wantsShipping = canShip && params.has('zip');
  const mode = shippingRateMode(env, preview);
  const quote = mode && wantsShipping && validShippingZip(zip) ? await quoteShipping(items, zip, env, mode, clientIp) : null;
  const shippingLabel = mode === 'example' ? 'Example shipping' : mode === 'test' ? 'Shippo test shipping' : 'Estimated shipping';
  const shippingHint = mode === 'example' ? 'The demo uses example postage for each packed box.' :
    mode === 'test' ? 'Shippo test rates are estimated for each packed box.' : 'Shipping is estimated for each packed box.';
  const hasQuote = quote?.cents != null;
  const postage = quote?.cents ?? 0;
  const subtotal = items.reduce((sum, item) => sum + item.price_cents, 0);
  const pickupUrl = '/checkout?items=' + encodeURIComponent(ids.join(','));

  return page(title, `${heading}
    <p class="notice">Online orders and payments are coming soon. This is an estimate.</p>
    <div class="checkout-grid">
      <section class="quote-panel" aria-labelledby="delivery-title">
        <h2 id="delivery-title">Pickup or shipping</h2>
        <p>${hasQuote ? `U.S. shipping to ${zip} selected. <a href="${pickupUrl}">Switch to local pickup</a>` : 'Free local pickup in Schulenburg, Texas.'}</p>
        ${canShip && mode ? `<form class="checkout-shipping" action="/checkout" method="get">
          <input type="hidden" name="items" value="${escapeHtml(ids.join(','))}">
          <label for="checkout-zip">Delivery ZIP code</label>
          <div class="shipping-row">
            <input id="checkout-zip" name="zip" type="text" inputmode="numeric" autocomplete="shipping postal-code" pattern="[0-9]{5}" maxlength="5" value="${escapeHtml(zip.slice(0, 20))}" required>
            <button type="submit">Calculate shipping</button>
          </div>
          ${wantsShipping && !hasQuote ? `<p role="alert">${quote?.message ?? 'Enter a five-digit U.S. ZIP code.'}</p>` : ''}
        </form>
        <p class="hint">${shippingHint}</p>` : canShip ? '<p class="hint">U.S. shipping estimates are coming soon.</p>' : '<p class="hint">Your bag includes a pickup-only find. To estimate shipping, return to the shop and remove any pickup-only finds from your bag.</p>'}
      </section>
      <section class="quote-panel" aria-labelledby="summary-title">
        <h2 id="summary-title">Order summary</h2>
        <ul class="checkout-items">${items.map(item => `<li><span>${escapeHtml(item.title)}</span><strong>${currency.format(item.price_cents / 100)}</strong></li>`).join('')}</ul>
        <dl class="checkout-totals">
          <div><dt>Item subtotal</dt><dd>${currency.format(subtotal / 100)}</dd></div>
          <div><dt>${hasQuote ? shippingLabel : 'Local pickup'}</dt><dd>${currency.format(postage / 100)}</dd></div>
          <div class="price"><dt>Estimated total before tax</dt><dd>${currency.format((subtotal + postage) / 100)}</dd></div>
        </dl>
      </section>
    </div>`, quote?.status ?? 200);
}

async function shippingEstimate(id, zip, env, preview, clientIp) {
  const sample = preview && sampleFinds.find(find => id === 'sample-' + find.image);
  const item = sample || (new RegExp(`^${itemId}$`).test(id) && await env.STORE_DB.prepare(`
    SELECT title, ${packageColumns} FROM listings WHERE id = ? AND status = 'published'
  `).bind(id).first());
  if (!item?.ship_weight_lb) return notFound();

  const back = `<a href="/#find-${id}">← Back to this find</a>`;
  if (!validShippingZip(zip)) {
    return page('Check the delivery ZIP', `${back}<h1>Check the delivery ZIP.</h1><p>Enter a five-digit U.S. ZIP code.</p>`, 400);
  }

  const mode = shippingRateMode(env, preview);
  const { cents, status, message } = await quoteShipping([item], zip, env, mode, clientIp);

  return page('Shipping estimate', `
    ${back}
    <h1>Shipping estimate.</h1>
    <section class="quote-panel" aria-label="Shipping estimate details">
      <h2>${escapeHtml(item.title)}</h2>
      <p>From Schulenburg, TX ${shippingOrigin} to ZIP ${zip}</p>
      ${cents === null ? `<p>${message}</p>` : `<p class="price">${currency.format(cents / 100)} · USPS Ground Advantage</p>`}
      ${mode === 'example' ? '<p class="hint">Preview only. This example amount stays the same for every ZIP.</p>' : ''}
      ${mode === 'test' ? '<p class="hint">Shippo test rates may differ from live postage.</p>' : ''}
      ${mode === 'example' || cents === null ? `<p class="hint">Packed box: ${item.ship_weight_lb} lb, ${item.ship_length_in} × ${item.ship_width_in} × ${item.ship_height_in} in.</p>` : ''}
      <p class="hint">Postage only. Local pickup is also available. Online checkout is coming soon.</p>
    </section>`, status);
}

export function createStore(isAdmin, { preview = false } = {}) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const path = url.pathname;
      const adminRoute = path === '/manage' || path.startsWith('/manage/');
      const db = env.STORE_DB;
      try {
        if (adminRoute && !(await isAdmin(request, env))) {
          return page('Sign-in required', '<h1>Private shop editor.</h1><p>Sign in with the approved shop account to continue.</p>', 403);
        }

        if (request.method === 'GET') {
          if (path === '/') {
            return storefront(await shopListings(db), preview, Boolean(shippingRateMode(env, preview)));
          }
          const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
          if (path === '/checkout') return await checkoutSummary(env, url.searchParams, preview, clientIp);
          const shipping = path.match(/^\/shipping\/([a-z0-9-]+)$/);
          if (shipping) return await shippingEstimate(shipping[1], url.searchParams.get('zip') ?? '', env, preview, clientIp);
          if (path === '/manage') {
            const { results } = await db.prepare('SELECT id, title, price_cents, status, category FROM listings ORDER BY updated_at DESC').all();
            return manage(results, preview);
          }
          if (path === '/manage/new') return page('New listing', '<a href="/manage">← All listings</a><h1>Add a find.</h1>' + editor(), 200, { editor: true });
          const item = path.match(new RegExp(`^/manage/item/(${itemId})(/delete)?$`));
          if (item) {
            const record = await db.prepare(`SELECT id, title, description, price_cents, status, version, category, ${packageColumns} FROM listings WHERE id = ?`).bind(item[1]).first();
            if (!record) return notFound();
            return item[2] ? confirmDeleteDraft(record) : editPage(record);
          }
          const image = path.match(new RegExp(`^/(?:manage/)?photo/(${itemId})$`));
          if (image) {
            const visibility = adminRoute ? '' : " AND status IN ('published', 'sold')";
            const record = await db.prepare('SELECT image, image_mime FROM listings WHERE id = ?' + visibility).bind(image[1]).first();
            if (!record) return new Response(null, { status: 404, headers: securityHeaders });
            return new Response(new Uint8Array(record.image), {
              headers: { ...securityHeaders, 'Content-Type': record.image_mime }
            });
          }
          if (path === '/store.css' || path === '/manage.js') return env.ASSETS.fetch(request);
        }

        if (request.method === 'POST' && ['/manage/save', '/manage/status', '/manage/delete'].includes(path)) {
          if (request.headers.get('Origin') !== url.origin) return new Response(null, { status: 403, headers: securityHeaders });
          if (Number(request.headers.get('Content-Length')) > imageLimit + 40_000) {
            throw new ListingError('Choose a smaller photo and try again.');
          }
          const form = await request.formData();
          if (path === '/manage/delete') return await deleteDraft(db, form);
          return path === '/manage/save' ? await saveListing(db, form) : await setStatus(db, form);
        }
        return notFound();
      } catch (error) {
        if (error instanceof ListingError) {
          return page('Check your listing', `<h1>Check your listing.</h1><p>${escapeHtml(error.message)}</p><a href="/manage">Return to your listings →</a>`, 400);
        }
        console.error('Store request failed:', error.name);
        return page('Shop unavailable', '<h1>Give us a moment.</h1><p>The shop is having trouble loading. Please try again shortly.</p>', 503);
      }
    }
  };
}
