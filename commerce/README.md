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
2. In Cloudflare Access, set up a self-hosted application covering `/manage` and its subpaths. Enable one-time PIN or the owners' identity provider and allow only the approved shop editors. Set `STORE_ADMIN_EMAIL` to the same email addresses, separated by commas. Copy the Access application audience, team issuer, and D1 database ID into the configuration.
3. Apply the production migration and deploy the Worker. Verify the editor and its write endpoints deny signed-out and unapproved users, then verify each editor can sign in and that an editor can publish a test listing and take it offline. The Worker validates the Access signature, audience, expiration, and approved email on each private request.

## Checkout before launch

The local preview supports a one-item pickup test with a Square-hosted Sandbox payment link. In the ignored `commerce/.dev.vars` file, set `SQUARE_SANDBOX_ACCESS_TOKEN` and `SQUARE_SANDBOX_LOCATION_ID`. Apply the local migrations again with `npm run prepare:preview`, then start the preview. Add one find to the bag, choose pickup, and select **Start Square Sandbox pickup test**. Open the generated test link and use Square's test panel. Return to the preview and choose **Check payment status** to reconcile the payment.

The Sandbox uses an 8.25% test tax. The server holds one item per checkout and retries Square link creation using the same request ID. If the payment outcome is uncertain, the item stays held. Canceling releases the hold after Square confirms cancellation. Confirmed test payments are recorded in the local checkout table.

Before taking production payments, add fulfillment and verified tax rules, confirm payment and cancellation through webhooks, update sale inventory, and verify declines, refunds, and owner notifications. For shipping, quote from the buyer's delivery address. Keep production Square credentials in Worker secrets.

## U.S. shipping estimates

Apply the D1 migrations before running this version. Existing listings start as local pickup only. To offer shipping, select **Local pickup or U.S. shipping** and enter the packed weight and outside box dimensions. The calculator requests USPS Ground Advantage rates from Shippo using the Schulenburg shop address and the buyer’s five-digit U.S. delivery ZIP. Checkout estimates one box per item.

Generate a [Shippo test API key](https://docs.goshippo.com/guides/testing) and set `SHIPPO_API_TOKEN` in the ignored `commerce/.dev.vars` file. Restart the local preview to enable Shippo test quotes on listing and checkout pages. Without a test key, the preview shows example postage.

For the production Worker, configure a live `SHIPPO_API_TOKEN` as a Worker secret and include the `SHIPPING_RATE_LIMIT` binding from `wrangler.example.toml`. The calculator and bag summary share a limit of six quote requests per minute per client IP at each Cloudflare location. Each request can quote up to ten packed boxes. Verify live quotes on a published shippable listing before relying on the estimates. Label purchases and payment processing are separate integrations.
