# Kiosk Design Reference

**Status:** ⏸ PARKED — visual alternative only; do not implement without renewed user approval.  
**Recorded:** 2026-09-20  
**Scope:** `ezzy-vendor-mobile` kiosk catalogue/booking screen only.

This document preserves the approved-for-reference **flat, no-gradient** alternative discussed during kiosk polish. It is intentionally separate from the current gradient-based implementation so a future session can evaluate it without reconstructing the design conversation.

## Direction: flat surface hierarchy

The goal is a calm, modern kiosk with no unnecessary boxes:

- Use hierarchy through alignment, whitespace, typography, thin borders, and modest tonal elevation — not decorative gradients, blur, fades, or extra panels.
- The offering cards are the only elevated surfaces.
- The bottom booking summary (for example, `Choose an offering` / `Select a time to continue`) rests directly on the page background. It has generous top spacing and safe-area bottom padding, but **no** card, rectangle, divider, blur, fade, or background-colour change.
- Retain the explicit in-flow Back control and the existing kiosk interaction model.

## Light theme specification

- Base page: flat `#f8fafc`.
- Offering cards: `#ffffff`, thin neutral `#e2e8f0` border, modest shadow, 12pt radius.
- Primary actions: solid vendor blue `#2563eb` rather than a gradient; compact card actions remain at least 44pt tall.
- No-photo offering media: flat `#eff6ff` tile, `#bfdbfe` border, centred offering code in `#1d4ed8`.

## Dark theme specification

- Base page: flat near-black navy `#0b1220`.
- Offering cards: elevated `#111827`, subtle `#243044` border, restrained shadow.
- Primary actions: solid vendor blue `#2563eb`; keep accessible white label contrast.
- No-photo offering media: flat slate-blue tile with the offering code; do not invent an illustration or a generic product icon.

## Explicit exclusions

- No page, button, media-tile, or bottom-dock gradients.
- No background logo, watermark, purple/violet accent, decorative artwork, or generic shoe/product illustration.
- No solid/translucent bottom bar, top divider, or rounded outer container around the booking summary.
- Do not alter offering data, images that vendors have uploaded, booking flow, availability refresh, payment flow, navigation, or kiosk containment.

## Implementation boundary if revived

Relevant current implementation files:

- `src/components/kiosk/KioskShell/KioskShell.tsx`
- `src/components/kiosk/KioskShell/useKioskShell.ts`
- `src/components/kiosk/KioskCatalogue/KioskCatalogue.tsx`
- `src/components/kiosk/KioskCatalogue/KioskCatalogue.styles.ts`
- `src/components/kiosk/KioskCatalogue/useKioskCatalogue.ts`

Before changing code, compare this alternative against the then-current kiosk design and ask the user whether this should replace, rather than layer on top of, the active gradient/veil treatment. Verify both themes and a physical Android/iOS device before calling it complete.
