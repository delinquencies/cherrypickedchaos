# Cherry Picked Chaos — local audit

Reviewed November 4, 2026. Website source files were left unchanged. This report and screenshots in `audit/` are the only additions after extracting the handoff.

## Project understanding

Read AGENTS.md, START_HERE_CODEX.md, README.md, all four current pages, app.js, style.css, and groove.css. Reviewed the original Stitch HTML content and both original design specifications inside the reference ZIP, the v2 desktop reference, the May 2024 Street View reference, and the illustrated storefront asset.

The current site is a static HTML/CSS/vanilla-JavaScript prototype. style.css supplies the foundation; groove.css layers the expressive retro design over it. app.js supplies four illustrative products, filtering, Surprise Me, the persistent demo bag, animation, mobile navigation, and preview VIP interactions. No build system or backend is required.

The original Stitch export included unverified addresses, schedules, live-status claims, inventory, pickup promises, and signup/order confirmations. The current version appropriately replaces those with demo behavior and notices. Those original claims should not be restored as factual store information.

## Design assessment

Keep the visual identity: cherry red, cream, blush, olive, expressive display typography, illustrated cherries and flowers, paper-like shadows, tilted cards, scalloped edges, and the layered hero collage. The voice is warm and distinctive. The current desktop and phone layouts feel like the same shop.

The storefront illustration is a strong stylistic match. Its building shape resembles the supplied historical reference, but its sign, window displays, plants, lighting, and "Open" sign are idealized details. Neither that artwork nor the historical screenshot establishes the current address, opening status, accessibility, inventory, or installed signage.

## Browser checks

Preview: http://127.0.0.1:8001/index.html (localhost only).

Checked the desktop preview, phone layout at a requested 390 × 844 viewport, tablet at 768 × 1024, and intermediate widths of 701 and 480 pixels. Screenshots: `audit/home-desktop.jpg`, `audit/home-mobile.jpg`, and `audit/home-tablet.jpg`.

Verified through browser interactions:

- Navigation across all four pages and the mobile menu toggle/navigation.
- Stoneware filtering isolates the correct sample product.
- Surprise Me resets the filter, highlights and focuses a sample card, and announces its selection.
- Adding a sample product updates the bag count and illustrative total; adding it twice is prevented.
- The bag persists across page navigation. Removing its product restores the empty state and $0 total.
- Bag opening, Escape dismissal, and preview-only checkout feedback work.
- A visitor FAQ expands correctly.
- VIP category selection toggles; blank required fields block submission; fictional valid values produce the preview-only response.

No missing local HTML-linked files were found. No error/warning entries were returned by the inspected browser console log. Reduced-motion handling was reviewed in source, including skipping cherry bursts and smooth Surprise Me scrolling; it was not tested with an emulated OS preference. This was a focused audit, not a full browser/device or accessibility certification.

## Prioritized improvements

### 1. Fix bag keyboard behavior without changing its appearance

Confirmed: from the final footer link, Tab focuses the offscreen "Close bag" button while the drawer is closed. Opening the drawer leaves focus on the background Bag button. The drawer has no modal dialog semantics, focus containment, background inertness, or focus restoration.

Recommendation: keep closed drawer controls out of the tab order/accessibility tree; move focus inside on open; contain focus while modal; restore focus to the opener on close; preserve scrim and Escape dismissal. Give each Remove button a product-specific accessible name. Removal currently also loses focus when its row is rebuilt.

Affected: shared drawer markup in all four HTML pages, toggleCart/renderCart in app.js, and drawer visibility CSS.

### 2. Resolve the tablet hero collision

At 768 pixels, the decorative "THE GOOD KIND OF CHAOS" ticket overlaps the right end of the headline. The two-column composition also becomes cramped near the 700-pixel breakpoint, and the flower can fall onto its own line.

Recommendation: reposition or scale the ticket for tablet widths and adjust the hero's stacking breakpoint after checking 700–900 pixels. Keep the collage, cherries, typography, and desktop composition. See `audit/home-tablet.jpg`.

### 3. Polish navigation and filter accessibility

Escape closes the bag but leaves the mobile menu open. Add menu dismissal and sensible focus return. Add a skip-to-main link for keyboard users. Initial filter buttons lack aria-pressed; that state appears only after clicking a filter or Surprise Me. Set the initial states in markup and announce filtered result counts without moving focus unexpectedly.

The continuously scrolling decorative ribbon has reduced-motion handling. Consider a pause control for people who want to stop it without changing their device preference.

### 4. Make Visit useful with confirmed store content

The current page warns visitors to confirm dates/location, but offers no confirmed store contact or schedule source. The Maps link correctly searches downtown generally; it should not be treated as store directions.

After owner confirmation, add a compact next-opening card, exact address, a store-specific directions link, and one preferred contact/social channel. Replace public-facing development explanations such as "The Stitch screens supplied..." with short visitor-oriented copy while keeping clear preview labeling. Until information is supplied, retain uncertainty rather than inventing details.

### 5. Improve loading and stability

Both CSS files import Google Fonts, including older base font families and the v2 families. Audit which families/weights actually remain in use and consolidate loading while preserving the chosen type. The supplied v2 reference screenshot has visibly different display letterforms from the current browser rendering; agree on the intended typography before attempting to match that screenshot.

Add explicit dimensions/aspect ratios to images where absent. The storefront PNG is approximately 2.55 MB and is currently unused; create responsive WebP/AVIF derivatives before integrating it, retain the original, and lazy-load it if below the fold. Existing product WebP assets are already reasonably compact (roughly 100–222 KB).

### 6. Small robustness and maintenance improvements

The bag loader accepts any array from localStorage; stale/unknown IDs can inflate its count while renderCart silently omits them. Normalize stored IDs against PRODUCTS and deduplicate them. This is a source-review edge case, not a failure observed in ordinary interactions.

Keep any fixes small and reviewable. Shared navigation/footer/drawer markup is duplicated across four pages, so synchronize changes carefully. No framework or service is needed for the above fixes. Social sharing metadata can be added when approved public copy and a suitable image are available.

## Proposed storefront integration — for discussion

Preferred placement: the existing homepage Visit teaser currently using the dough-bowl image, with a related feature in Visit & Guide if desired. This adds a recognizable sense of place without displacing the existing hero identity.

- Use the full illustration in a cream postcard-style frame; preserve the entrance and full sign rather than using a tight product-photo crop.
- Put a visible caption directly beneath it: "Illustrated storefront concept — decorative signage and display details are imagined."
- Suggested alt text: "Retro illustration inspired by the shop building, with imagined Cherry Picked Chaos signage."
- Avoid overlaying a real-time opening status or treating the painted "Open" sign as verified information.
- Keep any verified event date, address, and directions in adjacent HTML text, separate from the artwork.
- On mobile, stack the illustration and visit copy; do not add more animated decorations over the art.

Suggested order: first make the accessibility and tablet fixes, then agree on the storefront placement/caption, then add confirmed store content. No integration or redesign has been implemented during this audit.
