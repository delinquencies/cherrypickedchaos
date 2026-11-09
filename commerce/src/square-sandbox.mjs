const apiOrigin = 'https://connect.squareupsandbox.com';
const paymentLinks = '/v2/online-checkout/payment-links';
const testTaxBps = 825;

export function sandboxReady(env) {
  return Boolean(env.SQUARE_SANDBOX_ACCESS_TOKEN?.trim() && env.SQUARE_SANDBOX_LOCATION_ID?.trim());
}

async function square(env, path, method = 'GET', body) {
  const response = await fetch(apiOrigin + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + env.SQUARE_SANDBOX_ACCESS_TOKEN.trim(),
      'Square-Version': '2026-09-16',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Square Sandbox request failed');
  return response.json();
}

export function getSandboxCheckout(db, id) {
  return db.prepare('SELECT * FROM sandbox_checkouts WHERE id = ?').bind(id).first();
}

export async function reserveSandboxCheckout(env, id, item, shipping = null) {
  const db = env.STORE_DB;
  await db.prepare(`
    INSERT INTO sandbox_checkouts (id, item_key, title, price_cents, tax_bps, location_id, shipping_cents, shipping_address)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?
    WHERE ? IS NULL OR EXISTS (SELECT 1 FROM listings WHERE id = ? AND version = ? AND status = 'published')
    ON CONFLICT DO NOTHING
  `).bind(id, item.id ?? item.image, item.title, item.price_cents, testTaxBps,
    env.SQUARE_SANDBOX_LOCATION_ID.trim(), shipping?.cents ?? 0,
    shipping ? JSON.stringify({ ...shipping.address, rateMode: shipping.mode }) : null,
    item.id ?? null, item.id ?? null, item.version ?? null).run();
  return getSandboxCheckout(db, id);
}

export async function openSandboxCheckout(env, checkout) {
  const db = env.STORE_DB;
  const { id } = checkout;
  await db.prepare("UPDATE sandbox_checkouts SET state = 'creating' WHERE id = ? AND state = 'reserved'").bind(id).run();
  const current = await getSandboxCheckout(db, id);
  if (current.state !== 'creating') return current;

  const { payment_link: link, related_resources: resources } = await square(env, paymentLinks, 'POST', {
    idempotency_key: id,
    order: {
      location_id: current.location_id,
      reference_id: id,
      line_items: [{ name: current.title, quantity: '1', base_price_money: { amount: current.price_cents, currency: 'USD' } }],
      taxes: [{ name: 'Sandbox sales tax', percentage: (current.tax_bps / 100).toFixed(2), type: 'ADDITIVE', scope: 'ORDER' }],
      ...(current.shipping_cents ? { service_charges: [{
        name: 'USPS Ground Advantage', amount_money: { amount: current.shipping_cents, currency: 'USD' },
        calculation_phase: 'SUBTOTAL_PHASE', taxable: true
      }] } : {})
    },
    checkout_options: { allow_tipping: false }
  });
  const url = link?.url && new URL(link.url);
  if (!link?.id || !link.order_id || url?.origin !== 'https://sandbox.square.link') {
    throw new Error('Unexpected Square Sandbox checkout link');
  }
  const order = resources?.orders?.find(candidate => candidate.id === link.order_id) ??
    (await square(env, '/v2/orders/' + encodeURIComponent(link.order_id))).order;
  // Square rounds half-cent ties to the nearest even cent.
  const subtotal = current.price_cents + current.shipping_cents;
  const scaledTax = subtotal * current.tax_bps;
  const wholeTax = Math.floor(scaledTax / 10000);
  const tax = scaledTax % 10000 === 5000 ? wholeTax + wholeTax % 2 : Math.round(scaledTax / 10000);
  if (order?.location_id !== current.location_id || order.total_money?.currency !== 'USD' ||
      order.total_money.amount !== subtotal + tax) throw new Error('Unexpected Square Sandbox order total');

  await db.prepare(`
    UPDATE sandbox_checkouts SET state = 'open', square_link_id = ?, square_order_id = ?, square_url = ?, total_cents = ?
    WHERE id = ? AND state = 'creating'
  `).bind(link.id, link.order_id, url.href, order.total_money.amount, id).run();
  return getSandboxCheckout(db, id);
}

export async function checkSandboxPayment(env, checkout) {
  if (checkout.state !== 'open') return checkout;
  const { order } = await square(env, '/v2/orders/' + encodeURIComponent(checkout.square_order_id));
  for (const tender of order?.tenders ?? []) {
    const paymentId = tender.payment_id ?? tender.id;
    if (!paymentId) continue;
    if (await confirmSandboxPayment(env, checkout, paymentId)) {
      return getSandboxCheckout(env.STORE_DB, checkout.id);
    }
  }
  return checkout;
}

async function confirmSandboxPayment(env, checkout, paymentId) {
  const { payment } = await square(env, '/v2/payments/' + encodeURIComponent(paymentId));
  if (payment?.status !== 'COMPLETED' || payment.order_id !== checkout.square_order_id ||
      payment.location_id !== checkout.location_id || payment.total_money?.currency !== 'USD' ||
      payment.total_money.amount !== checkout.total_cents || payment.refunded_money?.amount) return false;
  await env.STORE_DB.prepare("UPDATE sandbox_checkouts SET state = 'paid' WHERE id = ? AND state = 'open'")
    .bind(checkout.id).run();
  return true;
}

export async function handleSandboxWebhook(request, env) {
  const key = env.SQUARE_SANDBOX_WEBHOOK_KEY?.trim();
  const url = env.SQUARE_SANDBOX_WEBHOOK_URL?.trim();
  if (!key || !url || request.method !== 'POST') return new Response(null, { status: 404 });
  const signature = request.headers.get('x-square-hmacsha256-signature') ?? '';
  if (!/^[A-Za-z0-9+/]{43}=$/.test(signature)) return new Response(null, { status: 403 });
  const raw = await request.text();
  if (raw.length > 64000) return new Response(null, { status: 413 });
  const encoder = new TextEncoder();
  const hmacKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(atob(signature), char => char.charCodeAt(0));
  if (!await crypto.subtle.verify('HMAC', hmacKey, bytes, encoder.encode(url + raw))) {
    return new Response(null, { status: 403 });
  }
  let event;
  try { event = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  const payment = event?.data?.object?.payment;
  if (['payment.created', 'payment.updated'].includes(event?.type) &&
      payment?.status === 'COMPLETED' && typeof payment.id === 'string' && typeof payment.order_id === 'string') {
    const checkout = await env.STORE_DB.prepare("SELECT * FROM sandbox_checkouts WHERE square_order_id = ? AND state = 'open'")
      .bind(payment.order_id).first();
    if (checkout) await confirmSandboxPayment(env, checkout, payment.id);
  }
  return new Response(null, { status: 204 });
}

export async function cancelSandboxCheckout(env, checkout) {
  const db = env.STORE_DB;
  if (checkout.state === 'reserved') {
    await db.prepare("UPDATE sandbox_checkouts SET state = 'canceled' WHERE id = ? AND state = 'reserved'")
      .bind(checkout.id).run();
  } else if (checkout.state === 'open') {
    const checked = await checkSandboxPayment(env, checkout);
    if (checked.state !== 'open') return checked;
    const result = await square(env, paymentLinks + '/' + encodeURIComponent(checked.square_link_id), 'DELETE');
    if (result.cancelled_order_id !== checked.square_order_id) throw new Error('Square did not confirm cancellation');
    await db.prepare("UPDATE sandbox_checkouts SET state = 'canceled' WHERE id = ? AND state = 'open'")
      .bind(checked.id).run();
  }
  return getSandboxCheckout(db, checkout.id);
}
