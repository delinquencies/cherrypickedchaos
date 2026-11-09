export const shippingOrigin = '78956';
export const demoShippingCents = 1250;

export function shippingRateMode(env, preview) {
  const token = env.SHIPPO_API_TOKEN?.trim();
  const testToken = token?.startsWith('shippo_test_');
  if (preview) return testToken ? 'test' : 'example';
  return token?.startsWith('shippo_live_') && env.SHIPPING_RATE_LIMIT ? 'live' : null;
}

export async function shippingCents(item, address, env) {
  const response = await fetch('https://api.goshippo.com/shipments/', {
    method: 'POST',
    headers: {
      Authorization: 'ShippoToken ' + env.SHIPPO_API_TOKEN.trim(),
      'Content-Type': 'application/json',
      'SHIPPO-API-VERSION': '2018-02-08'
    },
    body: JSON.stringify({
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
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(8000)
  });
  if (response.status === 400 || response.status === 422) return null;
  if (!response.ok) throw new Error('Shippo rate lookup failed');
  const { rates } = await response.json();
  const prices = (rates ?? [])
    .filter(rate => rate.currency === 'USD' && rate.servicelevel?.token === 'usps_ground_advantage')
    .map(rate => Number(rate.amount))
    .filter(price => Number.isFinite(price) && price > 0);
  return prices.length ? Math.round(Math.min(...prices) * 100) : null;
}
