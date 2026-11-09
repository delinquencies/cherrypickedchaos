# Cherry Picked Chaos storefront

This small store is separate from the public site. It uses a JavaScript Worker, a D1 database, and HTML forms. Melissa can add a title, condition, description, price, and photo. New listings start as drafts. Publish from the listing editor, take it off the shop, or mark it sold. A draft and its photo are available only in the editor.

## Local preview

From this directory:

```sh
npm ci
npm run prepare:preview
npm run preview
```

- Shop: http://127.0.0.1:8004/
- Editor: http://127.0.0.1:8004/manage

The local editor is open for testing on loopback and uses a local database. Use the production Worker entry point when deploying. The local preview config is for development only.

## Private online editor

1. Pick a shop hostname in the account that hosts the domain. Create a D1 database and copy `wrangler.example.toml` to `wrangler.toml`. Use the example's production entry point, `src/worker.mjs`, and attach the shop hostname as a Worker custom domain.
2. In Cloudflare Access, set up a self-hosted application covering `/manage` and its subpaths. Enable one-time PIN or the owners' identity provider and allow only `mdbarton81@gmail.com`. Copy the Access application audience, team issuer, and D1 database ID into the configuration.
3. Apply the production migration and deploy the Worker. Verify the editor and its write endpoints deny signed-out and unapproved users, then verify Melissa can sign in, publish a test listing, and take it offline. The Worker validates the Access signature, audience, expiration, and approved email on each private request.

## Checkout before launch

The current storefront is a preview for managing listings. Once the shop has Square Sandbox access, add a single-item pickup checkout with Square-hosted card fields. The server should price from the listing, atomically hold the item, and use a stable idempotency key for the payment. Verify Square's completed payment and match it to the order before recording the sale and notifying both owners. Keep holds pending while the payment outcome is uncertain. Confirm declines, duplicate attempts, concurrent buyers, refunds, and the two owner notifications in Sandbox before enabling real charges. Configure the production Square credentials as Worker secrets. No checkout or sale alerts are enabled in this preview.
