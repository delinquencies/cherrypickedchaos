import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createStore } from './store.mjs';
import { expireLiveOrders } from './live-checkout.mjs';
import { processPaidOrders } from './order-handoff.mjs';

let keySet;
let keyIssuer;

async function isAdmin(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const issuer = env.ACCESS_ISSUER;
  const approvedEmails = (env.STORE_ADMIN_EMAIL ?? '').split(',')
    .map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!token || !approvedEmails.length || !env.ACCESS_AUDIENCE ||
      !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer ?? '')) return false;

  if (keyIssuer !== issuer) {
    keySet = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer));
    keyIssuer = issuer;
  }
  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer,
      audience: env.ACCESS_AUDIENCE,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email']
    });
    return payload.type === 'app' && typeof payload.email === 'string' &&
      approvedEmails.includes(payload.email.toLowerCase());
  } catch {
    return false;
  }
}

const store = createStore(isAdmin);

export default {
  fetch: store.fetch,
  async scheduled(_event, env) {
    if (env.SQUARE_ACCESS_TOKEN) await Promise.all([expireLiveOrders(env), processPaidOrders(env)]);
  }
};
