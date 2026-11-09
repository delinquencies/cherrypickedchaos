import { createShippoOrder } from './shipping.mjs';

async function handOffShipment(env, order) {
  const db = env.STORE_DB;
  const claimed = await db.prepare(`UPDATE live_orders SET shippo_state = 'sending'
    WHERE id = ? AND state = 'paid' AND shipping_address IS NOT NULL AND refunded_cents = 0 AND shippo_state IS NULL`)
    .bind(order.id).run();
  if (!claimed.meta.changes) return;
  try {
    const shippoId = await createShippoOrder(order, env);
    await db.prepare("UPDATE live_orders SET shippo_state = 'sent', shippo_order_id = ? WHERE id = ?")
      .bind(shippoId, order.id).run();
  } catch {
    // Shippo does not deduplicate order numbers. Check its dashboard before retrying an uncertain import.
    await db.prepare("UPDATE live_orders SET shippo_state = 'review' WHERE id = ?").bind(order.id).run();
  }
}

async function sendSaleAlert(env, order, now) {
  const db = env.STORE_DB;
  const claimed = await db.prepare(`UPDATE live_orders SET alert_attempt_at = ?
    WHERE id = ? AND state = 'paid' AND refunded_cents = 0 AND alert_sent_at IS NULL
      AND (alert_attempt_at IS NULL OR alert_attempt_at < ?)`)
    .bind(now, order.id, now - 15 * 60 * 1000).run();
  if (!claimed.meta.changes) return;
  const shipment = order.shipping_address ? order.shippo_state === 'sent' ?
    'Open Shippo Orders to buy and print the shipping label.' : 'Check the shipping status in Manage orders before buying a label.' :
    'Set the item aside for local pickup.';
  try {
    await env.ORDER_ALERT_EMAIL.send({
      from: env.ORDER_ALERT_FROM, to: env.ORDER_ALERT_TO,
      subject: 'Cherry Picked Chaos · Item sold',
      text: `${order.title} sold online.\n\n${shipment}\n\nOrder: ${order.id}\nhttps://shop.cherrypickedchaos.com/manage/orders#order-${order.id}`
    });
    await db.prepare('UPDATE live_orders SET alert_sent_at = ? WHERE id = ?').bind(Date.now(), order.id).run();
  } catch {
    console.error('Sale alert delivery failed');
  }
}

export async function processPaidOrders(env) {
  const db = env.STORE_DB;
  if (env.SHIPPO_API_TOKEN?.startsWith('shippo_live_')) {
    const { results } = await db.prepare(`SELECT * FROM live_orders WHERE state = 'paid' AND refunded_cents = 0
      AND shipping_address IS NOT NULL AND shipping_package IS NOT NULL AND shippo_state IS NULL
      ORDER BY paid_at LIMIT 5`).all();
    for (const order of results) await handOffShipment(env, order);
  }
  if (env.ORDER_ALERT_EMAIL && env.ORDER_ALERT_FROM && env.ORDER_ALERT_TO) {
    const now = Date.now();
    const { results } = await db.prepare(`SELECT * FROM live_orders WHERE state = 'paid' AND refunded_cents = 0
      AND alert_sent_at IS NULL AND (alert_attempt_at IS NULL OR alert_attempt_at < ?)
      AND (shipping_address IS NULL OR shipping_package IS NULL OR shippo_state IN ('sent', 'review') OR paid_at < ?)
      ORDER BY paid_at LIMIT 5`).bind(now - 15 * 60 * 1000, new Date(now - 15 * 60 * 1000).toISOString()).all();
    for (const order of results) await sendSaleAlert(env, order, now);
  }
}
