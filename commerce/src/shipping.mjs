export const shippingOrigin = '78956';
export const demoShippingCents = 1250;

export function shippingRateMode(env, preview) {
  const token = env.SHIPPO_API_TOKEN?.trim();
  const testToken = token?.startsWith('shippo_test_');
  if (preview) return testToken ? 'test' : 'example';
  return token?.startsWith('shippo_live_') && env.SHIPPING_RATE_LIMIT ? 'live' : null;
}

function shippoRequest(path, body, env) {
  return fetch('https://api.goshippo.com' + path, {
    method: 'POST',
    headers: {
      Authorization: 'ShippoToken ' + env.SHIPPO_API_TOKEN.trim(),
      'Content-Type': 'application/json',
      'SHIPPO-API-VERSION': '2018-02-08'
    },
    body: JSON.stringify(body),
    redirect: 'manual',
    signal: AbortSignal.timeout(8000)
  });
}

export async function validateTexasAddress(address, env) {
  const response = await shippoRequest('/addresses/', { ...address, validate: true, state: 'TX', country: 'US' }, env);
  if (response.status === 400 || response.status === 422) return null;
  if (!response.ok) throw new Error('Shippo address validation failed');
  const result = await response.json();
  if (result.validation_results?.is_valid !== true || result.state !== 'TX' || result.country !== 'US' ||
      !result.street1 || !result.city || !/^\d{5}(?:-\d{4})?$/.test(result.zip)) return null;
  const { street1, street2, city, state, zip } = result;
  if (address.street2 && !street2) return null;
  return { street1, street2: street2 || '', city, state, zip };
}

export async function shippingCents(item, address, env) {
  const response = await shippoRequest('/shipments/', {
      address_from: { street1: '621 Lyons Ave.', city: 'Schulenburg', state: 'TX', zip: shippingOrigin, country: 'US' },
      address_to: { ...address, country: 'US' },
      parcels: [{
        weight: String(item.ship_weight_lb),
        length: String(item.ship_length_in),
        width: String(item.ship_width_in),
        height: String(item.ship_height_in),
        mass_unit: 'lb',
        distance_unit: 'in'
      }],
      async: false
  }, env);
  if (response.status === 400 || response.status === 422) return null;
  if (!response.ok) throw new Error('Shippo rate lookup failed');
  const { rates } = await response.json();
  const prices = (rates ?? [])
    .filter(rate => rate.currency === 'USD' && rate.servicelevel?.token === 'usps_ground_advantage')
    .map(rate => Number(rate.amount))
    .filter(price => Number.isFinite(price) && price > 0);
  return prices.length ? Math.round(Math.min(...prices) * 100) : null;
}

export async function createShippoOrder(order, env) {
  const address = JSON.parse(order.shipping_address);
  const box = JSON.parse(order.shipping_package);
  const money = cents => (cents / 100).toFixed(2);
  const response = await shippoRequest('/orders/', {
    from_address: { name: 'Cherry Picked Chaos', street1: '621 Lyons Ave.', city: 'Schulenburg', state: 'TX', zip: shippingOrigin, country: 'US' },
    to_address: { ...address, name: order.customer_name, country: 'US' },
    order_number: order.id,
    order_status: 'PAID',
    placed_at: order.paid_at,
    notes: `Packed box: ${box.weight} lb, ${box.length} × ${box.width} × ${box.height} in.`,
    currency: 'USD',
    subtotal_price: money(order.subtotal_cents),
    total_tax: money(order.tax_cents),
    total_price: money(order.subtotal_cents + order.shipping_cents + order.tax_cents),
    shipping_cost: money(order.shipping_cents),
    shipping_cost_currency: 'USD',
    shipping_method: 'USPS Ground Advantage',
    weight: String(box.weight),
    weight_unit: 'lb',
    line_items: [{ title: order.title, quantity: 1, total_price: money(order.subtotal_cents), currency: 'USD' }]
  }, env);
  if (!response.ok) throw new Error('Shippo order creation failed');
  const result = await response.json();
  if (!result.object_id || result.order_number !== order.id) throw new Error('Unexpected Shippo order');
  return result.object_id;
}
