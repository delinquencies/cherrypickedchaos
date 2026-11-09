export const shippingOrigin = '78956';
const usps = 'https://apis.usps.com';
const mailClass = 'USPS_GROUND_ADVANTAGE';
let cachedToken;

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return fetch(usps + path, {
    method: 'POST', headers, body: JSON.stringify(body),
    redirect: 'error', signal: AbortSignal.timeout(5000)
  });
}

async function authorize(env) {
  if (cachedToken?.expiresAt > Date.now()) return cachedToken.value;
  const response = await post('/oauth2/v3/token', {
    grant_type: 'client_credentials', client_id: env.USPS_CLIENT_ID, client_secret: env.USPS_CLIENT_SECRET
  });
  if (!response.ok) throw new Error('USPS authorization failed');
  const { access_token: value, expires_in: expiresIn } = await response.json();
  if (typeof value !== 'string' || !value) throw new Error('Missing USPS token');
  cachedToken = { value, expiresAt: Date.now() + (Number(expiresIn) - 60) * 1000 };
  return value;
}

export function hasLiveShipping(env) {
  return Boolean(env.USPS_CLIENT_ID && env.USPS_CLIENT_SECRET);
}

export async function shippingCents(item, zip, env) {
  const response = await post('/prices/v3/total-rates/search', {
    originZIPCode: shippingOrigin,
    destinationZIPCode: zip,
    weight: item.ship_weight_lb,
    length: item.ship_length_in,
    width: item.ship_width_in,
    height: item.ship_height_in,
    mailClasses: [mailClass],
    priceType: 'RETAIL',
    extraServices: [920]
  }, await authorize(env));
  if (response.status === 401) cachedToken = undefined;
  if (response.status === 400 || response.status === 404 || response.status === 422) return null;
  if (!response.ok) throw new Error('USPS rate lookup failed');
  const { rateOptions } = await response.json();
  const prices = (rateOptions ?? [])
    .filter(option => option.rates?.some(rate => rate.mailClass === mailClass && rate.priceType === 'RETAIL'))
    .map(option => option.totalPrice)
    .filter(price => typeof price === 'number' && Number.isFinite(price) && price > 0);
  return prices.length ? Math.round(Math.min(...prices) * 100) : null;
}
