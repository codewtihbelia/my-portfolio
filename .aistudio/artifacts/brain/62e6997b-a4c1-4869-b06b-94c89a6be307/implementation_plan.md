# Implementation Plan: Photorealistic Dark Hoodie Flashlight Reveal (`heroBannerCover.png`)

Implement a photorealistic, Landon Norris-style flashlight spotlight reveal utilizing the user's uploaded cutout image (`/public/heroBannerCover.png`) directly over the portrait (`/public/heroBanner.png`), completely eliminating synthetic SVGs.

---

## 1. User Choices & Design Specifications
- **Assets**:
  - **Base Layer**: `/public/heroBanner.png` (Transparent cutout portrait of the developer in black techwear).
  - **Cover Layer**: `/public/heroBannerCover.png` (Photorealistic matching transparent cutout with the dark hoodie pulled up and pitch-black void inside).
- **Rest State**:
  - Completely **clean portrait** with no wireframes, no synthetic SVG overlays, and pure transparent background.
- **Hover / Drag Interaction (Landon Norris Style)**:
  - As the visitor moves their cursor (or drags on touch screens), a dynamic flashlight aperture mask (`radial-gradient(circle ... at cursor)`) smoothly reveals the matching dark hoodie cover (`heroBannerCover.png`) directly over the portrait.
  - A subtle glowing aperture ring and crosshair reticle traces the cursor position.
  - Smooth opacity transitions on enter/leave for a buttery feel.
  - Includes a sleek glass "LOCK HOOD" toggle button for direct view.

---

## 2. Technical Architecture in `src/components/ui/InteractiveHackerHero.tsx`

1. **Alignment & Proportion Matching**:
   - `heroBanner.png` is `1166 x 1105`.
   - `heroBannerCover.png` is `1166 x 1137`.
   - Both share the exact same width (`1166px`), shoulders, straps, zippers, and center alignment.
   - We align both images to the bottom (`object-bottom object-contain`) inside an `aspect-[1166/1137]` container so the suit, zippers, and straps match up with pixel precision.
2. **Flashlight Aperture GPU Masking**:
   - The cover layer (`heroBannerCover.png`) is styled with hardware-accelerated CSS mask:
     ```css
     mask-image: radial-gradient(circle 220px at {x}px {y}px, black 0%, black 70%, transparent 100%);
     -webkit-mask-image: radial-gradient(circle 220px at {x}px {y}px, black 0%, black 70%, transparent 100%);
     ```
   - When not hovered, the cover layer opacity is `0` (clean portrait).
   - When hovered, the cover layer opacity is `1`, revealing the dark hoodie right beneath the spotlight beam.
3. **Floating Controls & Clean Layout**:
   - Floating glass chip: `BLACK_HOODIE // STANDBY` (updates to `REVEALED` on hover).
   - "LOCK HOOD" button toggles full persistent view.
   - Pure transparent background without cards, borders, or boxes.

---

## 3. Verification & Testing Plan
- Co-execute `compile_applet` and `lint_applet` together to verify clean build and 0 type errors.
- Verify seamless pixel alignment between the suit shoulders and zippers of `heroBanner.png` and `heroBannerCover.png`.
- Test cursor flashlight spotlight tracking across the head on desktop and touch dragging on mobile devices.
- Verify clean rest state (no SVG lines, clean natural portrait).
