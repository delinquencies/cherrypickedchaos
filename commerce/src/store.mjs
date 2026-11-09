const imageLimit = 1_000_000;
const itemId = '[a-f0-9-]{36}';
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const securityHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex'
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function page(title, content, status = 200, admin = false) {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Cherry Picked Chaos</title>
  <link rel="stylesheet" href="/store.css">
  ${admin ? '<script defer src="/manage.js"></script>' : ''}
</head>
<body>
  <header><a href="/">🍒 Cherry Picked Chaos</a></header>
  <main>${content}</main>
</body>
</html>`, { status, headers: { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
}

function redirect(path) {
  return new Response(null, { status: 303, headers: { ...securityHeaders, Location: path } });
}

function storefront(items) {
  const cards = items.map(item => `
    <article class="card">
      <img src="/photo/${item.id}?v=${item.version}" alt="${escapeHtml(item.title)}" loading="lazy">
      <div class="card-body">
        <span class="tag">${item.status === 'sold' ? 'Sold' : 'One of a kind'}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="description">${escapeHtml(item.description)}</p>
        <p class="price">${currency.format(item.price_cents / 100)}</p>
      </div>
    </article>`).join('');
  return page('Shop Selected Finds', `
    <p class="eyebrow">The digital treasure table</p>
    <h1>Shop Selected Finds.</h1>
    <p>A little collection of one-of-a-kind finds for pickup in Schulenburg.</p>
    <p class="notice">Store preview. Checkout will open after Square is connected.</p>
    ${cards ? `<div class="grid">${cards}</div>` : '<p>No finds have been published yet.</p>'}`);
}

function editor(item = null) {
  const editing = item !== null;
  const id = editing ? item.id : '';
  return `
    <form class="editor" method="post" enctype="multipart/form-data" action="/manage/save">
      <input type="hidden" name="id" value="${id}">
      <input type="hidden" name="version" value="${item?.version ?? ''}">
      <label>Title <input name="title" required maxlength="100" value="${escapeHtml(item?.title ?? '')}"></label>
      <label>Description and condition <textarea name="description" required maxlength="2000" rows="5">${escapeHtml(item?.description ?? '')}</textarea></label>
      <label>Price in dollars <input name="price" type="number" inputmode="decimal" min="0.01" max="99999.99" step="0.01" required value="${editing ? (item.price_cents / 100).toFixed(2) : ''}"></label>
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
      <div><strong>${escapeHtml(item.title)}</strong><br><span class="hint">${currency.format(item.price_cents / 100)} · ${item.status}</span></div>
      <a href="/manage/item/${item.id}">Edit listing →</a>
    </li>`).join('');
  return page('Manage listings', `
    <p class="eyebrow">Shop editor</p>
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
    <div class="actions">${controls}</div>
    <img class="editor-photo" src="/manage/photo/${item.id}?v=${item.version}" alt="${escapeHtml(item.title)}">
    ${editor(item)}`, 200, true);
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
  const photo = await readPhoto(form);
  if (!id) {
    if (!photo) throw new ListingError('Choose a photo for the listing.');
    const newId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO listings (id, title, description, price_cents, image_mime, image, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(newId, title, description, priceCents, photo.mime, photo.bytes, new Date().toISOString()).run();
    return redirect('/manage/item/' + newId);
  }
  if (!new RegExp(`^${itemId}$`).test(id) || !Number.isInteger(version) || version < 1) {
    throw new ListingError('This listing could not be updated.');
  }
  const photoFields = photo ? ', image_mime = ?, image = ?' : '';
  const values = photo ? [photo.mime, photo.bytes] : [];
  const result = await db.prepare(`
    UPDATE listings SET title = ?, description = ?, price_cents = ?, updated_at = ?,
      version = version + 1 ${photoFields} WHERE id = ? AND version = ?
  `).bind(title, description, priceCents, new Date().toISOString(), ...values, id, version).run();
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

function notFound() {
  return page('Page not found', '<h1>This page wandered off.</h1><a href="/">Back to the shop →</a>', 404);
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
            const { results } = await db.prepare(`
              SELECT id, title, description, price_cents, status, version FROM listings
              WHERE status IN ('published', 'sold') ORDER BY status, updated_at DESC
            `).all();
            return storefront(results);
          }
          if (path === '/manage') {
            const { results } = await db.prepare('SELECT id, title, price_cents, status FROM listings ORDER BY updated_at DESC').all();
            return manage(results, preview);
          }
          if (path === '/manage/new') return page('New listing', '<a href="/manage">← All listings</a><h1>Add a find.</h1>' + editor(), 200, true);
          const item = path.match(new RegExp(`^/manage/item/(${itemId})$`));
          if (item) {
            const record = await db.prepare('SELECT id, title, description, price_cents, status, version FROM listings WHERE id = ?').bind(item[1]).first();
            return record ? editPage(record) : notFound();
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

        if (request.method === 'POST' && (path === '/manage/save' || path === '/manage/status')) {
          if (request.headers.get('Origin') !== url.origin) return new Response(null, { status: 403, headers: securityHeaders });
          if (Number(request.headers.get('Content-Length')) > imageLimit + 40_000) {
            throw new ListingError('Choose a smaller photo and try again.');
          }
          const form = await request.formData();
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
