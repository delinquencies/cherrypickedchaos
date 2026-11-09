const squareOrigin = 'https://connect.squareup.com';
const shopOrigin = 'https://shop.cherrypickedchaos.com';
const paymentLinks = '/v2/online-checkout/payment-links';
const holdMilliseconds = 20 * 60 * 1000;

export function texasTaxCents(subtotal) {
  // 8.25% at the verified Schulenburg location. Texas rounds half cents up.
  return Math.floor((subtotal * 825 + 5000) / 10000);
}

export function liveCheckoutReady(env) {
  return env.LIVE_CHECKOUT_ENABLED === 'true' && Boolean(env.SQUARE_ACCESS_TOKEN &&
    env.SQUARE_LOCATION_ID && env.SQUARE_WEBHOOK_KEY && env.CHECKOUT_RATE_LIMIT);
}

async function square(env, path, method = 'GET', body) {
  const response = await fetch(squareOrigin + path, {
    method,
    headers: { Authorization: 'Bearer ' + env.SQUARE_ACCESS_TOKEN, 'Square-Version': '2026-09-16', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'error',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Square request failed');
  return response.json();
}

export function liveOrder(db, id) {
  return db.prepare('SELECT * FROM live_orders WHERE id = ?').bind(id).first();
}

export async function reserveOrder(env, id, item, name, shipping) {
  const db = env.STORE_DB;
  const postage = shipping?.cents ?? 0;
  const tax = (shipping?.address.state ?? 'TX') === 'TX' ? texasTaxCents(item.price_cents + postage) : 0;
  await db.prepare(`
    INSERT INTO live_orders (id, listing_id, title, subtotal_cents, shipping_cents, tax_cents,
      location_id, customer_name, shipping_address, expires_at, shipping_package)
    SELECT ?, id, title, price_cents, ?, ?, ?, ?, ?, ?, ? FROM listings
    WHERE id = ? AND version = ? AND status = 'published'
    ON CONFLICT DO NOTHING
  `).bind(id, postage, tax, env.SQUARE_LOCATION_ID, name,
    shipping ? JSON.stringify(shipping.address) : null, Date.now() + holdMilliseconds,
    shipping ? JSON.stringify({ weight: item.ship_weight_lb, length: item.ship_length_in,
      width: item.ship_width_in, height: item.ship_height_in }) : null, item.id, item.version).run();
  return liveOrder(db, id);
}

export async function openOrder(env, order) {
  const db = env.STORE_DB;
  await db.prepare("UPDATE live_orders SET state = 'creating' WHERE id = ? AND state = 'held' AND expires_at > ?")
    .bind(order.id, Date.now()).run();
  const current = await liveOrder(db, order.id);
  if (current.state !== 'creating') return current;

  const amount = current.subtotal_cents + current.shipping_cents + current.tax_cents;
  const { payment_link: link, related_resources: resources } = await square(env, paymentLinks, 'POST', {
    idempotency_key: current.id,
    quick_pay: { name: current.title, price_money: { amount, currency: 'USD' }, location_id: current.location_id },
    checkout_options: {
      allow_tipping: false, enable_coupon: false, enable_loyalty: false,
      redirect_url: shopOrigin + '/pay/' + current.id
    }
  });
  const url = link?.url && new URL(link.url);
  if (!link?.id || !link.order_id || url?.origin !== 'https://square.link') throw new Error('Unexpected Square payment link');
  const squareOrder = resources?.orders?.find(candidate => candidate.id === link.order_id) ??
    (await square(env, '/v2/orders/' + encodeURIComponent(link.order_id))).order;
  if (squareOrder?.location_id !== current.location_id || squareOrder.total_money?.currency !== 'USD' ||
      squareOrder.total_money.amount !== amount) throw new Error('Unexpected Square order total');

  await db.prepare(`UPDATE live_orders SET state = 'open', square_link_id = ?, square_order_id = ?, square_url = ?
    WHERE id = ? AND state = 'creating'`).bind(link.id, link.order_id, url.href, current.id).run();
  return liveOrder(db, current.id);
}

async function reconcilePayment(env, order, paymentId) {
  const { payment } = await square(env, '/v2/payments/' + encodeURIComponent(paymentId));
  const total = order.subtotal_cents + order.shipping_cents + order.tax_cents;
  if (payment?.status !== 'COMPLETED' || payment.order_id !== order.square_order_id ||
      payment.location_id !== order.location_id || payment.total_money?.currency !== 'USD' ||
      payment.total_money.amount !== total) return false;
  const refunded = payment.refunded_money?.amount ?? 0;
  if (!Number.isInteger(refunded) || refunded < 0 || refunded > total) return false;

  await env.STORE_DB.prepare(`UPDATE live_orders SET state = 'paid', square_payment_id = ?,
    paid_at = COALESCE(paid_at, ?), refunded_cents = MAX(refunded_cents, ?)
    WHERE id = ? AND (state = 'open' OR (state = 'paid' AND square_payment_id = ?))`)
    .bind(payment.id, payment.created_at ?? new Date().toISOString(), refunded, order.id, payment.id).run();
  return true;
}

export async function checkOrder(env, order) {
  if (order.state !== 'open') return order;
  const { order: upstream } = await square(env, '/v2/orders/' + encodeURIComponent(order.square_order_id));
  for (const tender of upstream?.tenders ?? []) {
    const paymentId = tender.payment_id ?? tender.id;
    if (paymentId && await reconcilePayment(env, order, paymentId)) return liveOrder(env.STORE_DB, order.id);
  }
  if (upstream?.state === 'CANCELED' && upstream.id === order.square_order_id && upstream.location_id === order.location_id) {
    return closeOrder(env.STORE_DB, order.id, 'open');
  }
  return order;
}

async function closeOrder(db, id, state) {
  await db.prepare("UPDATE live_orders SET state = 'canceled', customer_name = NULL, shipping_address = NULL WHERE id = ? AND state = ?")
    .bind(id, state).run();
  return liveOrder(db, id);
}

export async function cancelOrder(env, order) {
  const db = env.STORE_DB;
  if (order.state === 'held') return closeOrder(db, order.id, 'held');
  if (order.state === 'open') {
    const checked = await checkOrder(env, order);
    if (checked.state !== 'open') return checked;
    const { cancelled_order_id: canceledId } = await square(env, paymentLinks + '/' + encodeURIComponent(order.square_link_id), 'DELETE');
    if (canceledId !== order.square_order_id) throw new Error('Square did not confirm cancellation');
    return closeOrder(db, order.id, 'open');
  }
  return liveOrder(db, order.id);
}

export async function expireLiveOrders(env) {
  const { results } = await env.STORE_DB.prepare(`SELECT * FROM live_orders WHERE expires_at <= ?
    AND state IN ('held', 'creating', 'open') ORDER BY expires_at LIMIT 8`).bind(Date.now()).all();
  for (const order of results) {
    try {
      const current = order.state === 'creating' ? await openOrder(env, order) : order;
      await cancelOrder(env, current);
    } catch {
      console.error('Could not safely reconcile expired Square order');
    }
  }
}

export async function liveWebhook(request, env) {
  if (request.method !== 'POST' || !env.SQUARE_WEBHOOK_KEY || !env.SQUARE_ACCESS_TOKEN) return new Response(null, { status: 404 });
  const signature = request.headers.get('x-square-hmacsha256-signature') ?? '';
  if (!/^[A-Za-z0-9+/]{43}=$/.test(signature)) return new Response(null, { status: 403 });
  const raw = await request.text();
  if (raw.length > 64000) return new Response(null, { status: 413 });
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SQUARE_WEBHOOK_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(atob(signature), char => char.charCodeAt(0));
  if (!await crypto.subtle.verify('HMAC', key, bytes, encoder.encode(shopOrigin + '/square/webhook' + raw))) {
    return new Response(null, { status: 403 });
  }
  let event;
  try { event = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  const payment = event?.data?.object?.payment;
  const refund = event?.data?.object?.refund;
  if (['payment.created', 'payment.updated'].includes(event?.type) && payment?.status === 'COMPLETED') {
    const order = await env.STORE_DB.prepare("SELECT * FROM live_orders WHERE square_order_id = ? AND state IN ('open', 'paid')")
      .bind(payment.order_id ?? '').first();
    if (order && payment.id) await reconcilePayment(env, order, payment.id);
  } else if (['refund.created', 'refund.updated'].includes(event?.type) && refund?.status === 'COMPLETED') {
    const order = await env.STORE_DB.prepare("SELECT * FROM live_orders WHERE square_payment_id = ? AND state = 'paid'")
      .bind(refund.payment_id ?? '').first();
    if (order) await reconcilePayment(env, order, refund.payment_id);
  }
  return new Response(null, { status: 204 });
}
