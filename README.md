# Cherry Picked Chaos

Static HTML, CSS, and JavaScript website. Open index.html through a local static server. No framework or build step is required.

## Current experience

- Retro opening ticket with a countdown to the next confirmed retail session, Texas daylight-saving offsets, and a matching calendar file. opening.js owns the schedule; next-level.js refreshes the display every 30 seconds and on tab return. After April 17, 2027 at 5 pm Texas time, no new date is invented and the ticket calendar link disappears.
- Freshly Picked gallery uses labeled brand illustrations until real merchandise photos are approved. No sample photos are presented as inventory.
- Come Find Us pairs the illustrated storefront with an address map, directions, complimentary mimosas or coffee, and client-confirmed parking on both visible sides of the building. Storefront art is labeled as illustration; imagined signage is not a record of installed signage.
- Cherry Drops VIP uses an email request, as requested by the user. The modal validates name, email and consent, then opens the visitor’s email app with a prefilled request to cherrypickedchaos26@gmail.com. No automatic subscription occurs. A retry link and direct email link remain available. Future EmailOctopus integration awaits the client’s account; never put credentials in browser files.
- Hovering cherries, a capped desktop parallax effect, paper-card transitions and a keyboard-accessible footer cherry surprise. Reduced-motion preferences disable animation.
- Former shop.html redirects to Freshly Picked. Demo bag, pricing, checkout and invented product listings were removed, along with demo.js and demo.css.

## Confirmed business details

621 Lyons Ave., Schulenburg, TX 78956. Call/text 713-446-4832. Email cherrypickedchaos26@gmail.com. Website cherrypickedchaos.com. Open third weekends, Friday and Saturday, 10 am–5 pm, or by appointment. Supplied weekends: November 20–21 and December 18–19, 2026; January 15–16, February 19–20, March 19–20 and April 16–17, 2027. Facebook profile ID 100090079657840; Instagram @cherrypickedchaos.

## Add approved merchandise photos

Add local files under assets/ and add entries to treasures.json. Example structure (use real, approved content):

```json
{"items":[{"approved":true,"image":"assets/approved-photo.webp","alt":"Accurate description of the real photo","title":"Approved item name","tag":"Client-approved tag","description":"Accurate description"}]}
```

The empty items list is intentional. Only explicitly approved entries with local image paths, titles and alt text render. Keep descriptions accurate; do not imply availability without confirmation. The illustration gallery stays visible if the list is empty or unavailable. Contact is by phone/text; no online orders or holds.

## Files

index.html is the main site; style.css, groove.css, landing.css, hospitality.css, opening.css and next-level.css layer the existing design. app.js handles menus, the VIP dialog and local contact/estate previews. next-level.js handles the ticket, VIP email handoff, approved-photo gallery and small interactions. estate.html and guide.html retain the estate inquiry and Schulenburg day-trip guide. drops.html preserves the old signup link. assets/calendar/ contains six downloadable ICS files with separate Friday and Saturday events at 10 am–5 pm Texas time. Calendar imports are snapshots, not live subscriptions.

Contact and estate forms remain local previews; their response messages provide direct contact details. Google Fonts and the Google Map require network access. Map directions also work through a separate link.

## Verification

Browser checks cover widths 320, 390, 700, 800, 1000, 1050, 1280 and 1440; overflow, centered stacked hero, mobile feature cards, VIP open/close/focus return, required consent, encoded email handoff, calendar response files, legacy shop redirect, reduced motion, no-JavaScript content, and the approved-photo rendering path. Schedule checks cover Friday/Saturday transitions, March daylight saving and expiry after the final supplied weekend. All twelve calendar events were checked for 10 am–5 pm Texas time.

## Current page structure (supersedes earlier layout notes)
- index.html: hero ticket, treasure categories, Freshly Picked, opening calendar with refreshments, map, and unified Contact/VIP email form.
- about.html: Melissa and Candy biography, with room in the source for verified building history later.
- guide.html#shop-visit: address, opening schedule link, appointments, confirmed parking, storefront illustration and FAQs, followed by the four Schulenburg day-trip stops.
- estate.html: separate estate inquiry preview.

The VIP drawer and standalone invitation were removed. Contact now prepares an email with an optional unchecked VIP opt-in. A message is optional only when VIP is requested; the visitor can send a normal message, request VIP only, or combine them. Sending still takes place in the visitor's email app. No automatic subscriptions or automatic email delivery. The old signup links continue to work by leading to Contact, without preselecting consent. The About Us page is linked across all public pages. Browser checks cover all four pages at 320, 390, 800, 1000 and 1280 pixels, mobile menus, contact/VIP consent paths, local navigation anchors and legacy redirects.
