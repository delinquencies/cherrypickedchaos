# Cherry Picked Chaos storefront

This small store is separate from the public site. It uses a JavaScript Worker, a D1 database, and HTML forms. Melissa can add a title, category, condition, description, price, and photo. New listings start as drafts. Publish from the listing editor, take it off the shop, or mark it sold. A draft and its photo are available only in the editor.

## Local preview

From this directory:

```sh
npm ci
npm run prepare:preview
npm run preview
```

- Shop: http://127.0.0.1:8004/
- Editor: http://127.0.0.1:8004/manage

The local editor is open for testing on loopback and uses a local database. When it has no published or sold listings, the preview shows the four original sample finds so you can try the filters and Surprise Me. The preview also has a demo bag that saves picks in the browser and shows an item subtotal. Use the production Worker entry point when deploying. The local preview config is for development only.

## Private online editor

1. Pick a shop hostname in the account that hosts the domain. Create a D1 database and copy `wrangler.example.toml` to `wrangler.toml`. Use the example's production entry point, `src/worker.mjs`, and attach the shop hostname as a Worker custom domain.
2. In Cloudflare Access, set up a self-hosted application covering `/manage` and its subpaths. Enable one-time PIN or the owners' identity provider and allow only `mdbarton81@gmail.com`. Copy the Access application audience, team issuer, and D1 database ID into the configuration.
3. Apply the production migration and deploy the Worker. Verify the editor and its write endpoints deny signed-out and unapproved users, then verify Melissa can sign in, publish a test listing, and take it offline. The Worker validates the Access signature, audience, expiration, and approved email on each private request.

## Checkout before launch

The demo bag opens a local checkout preview with pickup, an example shipping estimate when all items can ship, and an order summary. The preview does not place orders or collect payment details. Once the shop has Square Sandbox access, add single-item checkout with Square-hosted card fields. The server should price from the listing, re-quote shipping from the delivery address if selected, atomically hold the item, and use a stable idempotency key for the payment. Verify Square's completed payment and match it to the order before recording the sale and notifying both owners. Keep holds pending while the payment outcome is uncertain. Confirm declines, duplicate attempts, concurrent buyers, refunds, and the two owner notifications in Sandbox before enabling real charges. Configure the production Square credentials as Worker secrets.

## U.S. shipping estimates

Apply the D1 migrations before running this version. Existing listings start as local pickup only. To offer shipping, select **Local pickup or U.S. shipping** and enter the packed weight and outside box dimensions. Buyers can request a USPS Ground Advantage postage estimate by entering a five-digit U.S. delivery ZIP. The origin is the shop ZIP, `78956`.

Without credentials the local preview shows a clearly labeled example amount. The production Worker displays live estimates only when both `USPS_CLIENT_ID` and `USPS_CLIENT_SECRET` are configured as Worker secrets. Create a USPS app with access to Domestic Prices, keep its credentials out of Git, and verify carrier quotes for representative box sizes and destinations before enabling the public calculator. Use a rate-limiting rule for `/shipping/*` on the production hostname to protect the carrier quota. The calculator requests retail postage and does not buy labels or accept payment.
