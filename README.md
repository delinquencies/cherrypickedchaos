# Cherry Picked Chaos — landing-page preview

Static HTML, CSS, and vanilla JavaScript. No installation or build step required.

## Preview

Open index.html, or serve this folder with `python -m http.server 8001 --bind 127.0.0.1` and visit http://127.0.0.1:8001/index.html?v=estate-2.

The main experience is a groovy, cherry-heavy landing page with an illustrated hero, temporary brand gallery, Schulenburg area map, contact form, Cherry Bombs signup, and visitor FAQs. Shop details and gallery photos await the client. The map is an area overview, not a verified shop pin. The illustration includes imagined signage and displays.

The Visit section includes a user-confirmed complimentary mimosa note during open retail hours and a small vector illustration. Cherry Bombs has a compact CTA between Gallery and Visit, with its signup in a native dialog that slides in on request. Contact remains the only inline form. Instagram/Facebook icon buttons are labeled, disabled placeholders awaiting client URLs. hospitality.css styles these additions. The signup dialog supports Escape, a close button, background dismissal on desktop, and focus return; it does not auto-open on ordinary landing-page visits. Links ending in #cherry-bombs explicitly open it.

The hero's Next chance to cherry-pick card appears below its buttons and before the mobile collage. Update the dateLabel and hoursLabel in opening.js to update both the card and Visit together. Both have HTML placeholder fallbacks if JavaScript is unavailable. The hanging Closed — Out Pickin’ sign is a decorative preview while hours are pending; no live status or automatic event expiration is implemented.

## File organization

- index.html, landing.css, and app.js: landing experience and local preview forms.
- style.css and groove.css: shared foundation and retro identity.
- shop.html, demo.js, and demo.css: independent shopping demonstration, including product rendering, prices, filters, Surprise Me, persistent demo bag, drawer, and commerce animation. Demo resources are not loaded by the landing page. A discreet footer link opens the demo.
- guide.html: restored Schulenburg day-trip guide, reached through a small illustrated teaser in Visit; guide.css supplies its mobile-first layout. Painted Churches and dining links point to the Chamber's visitor information, checked November 4, 2026. The church illustration is decorative, not a likeness of a particular church.
- estate.html, estate.css, assets/estate-keepsakes.svg: dedicated Estate Liquidation page, linked from the public nav and home footer. Covers estate inquiries, downsizing, and collections with a preview-only form. Service area, project terms, and availability need client confirmation. The form does not send data, book visits, or provide quotes. Public pages use the mobile menu through 950px to keep the expanded navigation comfortable.
- drops.html: legacy URL redirects to the Cherry Bombs signup.
- reference/: original Google Stitch export and supplied references.
- AUDIT.md: historical initial audit, before restructuring.

## Template fillers

Client address, opening dates, phone, and email appear as bracketed placeholders in index.html. Replace them, update the map query and caption, and supply approved shop/gallery photos when available.

Contact and signup forms validate and show local preview feedback. They do not send, store, or subscribe anyone. Signup consent is required for the preview. Inline cancellation also prevents field values being submitted if JavaScript fails to load. Connecting real delivery or a mailing-list service is a future step requiring confirmed client details. No payments, orders, inventory sync, or reservations are implemented.

Google Fonts and the embedded Google Map require internet access. The map has a separate area-map link. Other artwork is bundled locally.

The town guide has stable cards for future local partner/affiliate links (`data-partner-slot`). No affiliate relationships, tracking, or commissions are active. Once real partners are supplied, update each relevant card's destination and place a clear disclosure beside any affiliate link. Keep the landing-page teaser small and preserve the town guide when changing commerce features.

## Validation

Checked JavaScript syntax, local references, desktop and phone layouts, form validation and consent, preview responses, map rendering, mobile menu dismissal, and independent shop filtering/Surprise Me/bag behavior. The demo drawer excludes hidden controls from keyboard navigation, focuses Close on open, contains Tab navigation, and restores its opener on Escape.
