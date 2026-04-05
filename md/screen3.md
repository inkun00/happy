# Design System Strategy: The Radiant Glow

## 1. Overview & Creative North Star
**Creative North Star: "The Radiant Nudge"**

This design system moves away from the cold, clinical nature of traditional tracking apps. Instead of a rigid ledger of data, we are building a "Digital Hearth"—a space that feels warm, inviting, and inherently supportive. To achieve a high-end editorial feel, we reject the "standard grid." We embrace **Intentional Asymmetry** and **Tonal Depth**, allowing elements to float and overlap like pieces of paper on a sunlit desk.

The experience is defined by a "nudge" aesthetic: nothing is sharp, nothing is aggressive. Every corner is generously rounded, and every interaction feels like a soft, encouraging gesture. We break the "template" look by using a dramatic typography scale and a layering system that favors color-on-color depth over traditional borders.

---

## 2. Colors & Atmospheric Tone
The palette is a sophisticated blend of sun-drenched yellows, energetic ambers, and grounding teals. It is designed to evoke the feeling of a golden-hour sunrise.

*   **Primary (`#7b5400` / `#feb300`):** Used for moments of achievement and primary actions.
*   **Secondary (`#a83206` / `#ffc4b3`):** Injected for energy, warmth, and vital "nudges."
*   **Tertiary (`#00675f` / `#81f3e5`):** The "calm" in the system, used for reflection and restorative tasks.
*   **Neutral/Surface (`#fff6e1`):** A warm cream base that avoids the sterile "app-white," providing a soft canvas for the eye.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit directly on a `surface` background to create a soft, organic edge.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
*   **Level 0:** `surface` (The base canvas).
*   **Level 1:** `surface-container-low` (Secondary content blocks).
*   **Level 2:** `surface-container` (Interactive cards).
*   **Level 3:** `surface-container-high` (Active elements or "nudges").
Nesting should always move from low to high (darker/deeper to lighter/brighter) to guide the user's eye toward the interaction.

### The "Glass & Gradient" Rule
To add soul to the UI, use **Glassmorphism** for floating action buttons or navigation bars. Utilize the `surface-container-lowest` token at 80% opacity with a `20px` backdrop blur. 
**Signature Textures:** Apply subtle linear gradients (e.g., `primary` to `primary-container`) on hero cards to create a sense of depth and luminosity that flat colors cannot replicate.

---

## 3. Typography
We utilize a dual-font strategy to balance personality with extreme legibility.

*   **Display & Headline (Plus Jakarta Sans):** These are our "Voice." With a wide stance and friendly apertures, use `display-lg` and `headline-md` with generous leading to create an editorial, open feel. Use these for encouraging affirmations and daily summaries.
*   **Title, Body, & Label (Be Vietnam Pro):** This is our "Utility." It provides a clean, neutral contrast to the expressive headlines. It ensures that even at `body-sm`, tracking progress remains effortless.

The hierarchy should be high-contrast. Pair a `display-sm` headline with a `body-md` description to create a sophisticated, unbalanced layout that feels modern and intentional.

---

## 4. Elevation & Depth
In this design system, depth is a feeling, not a structure.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This "Tonal Layering" creates a soft lift that feels integrated into the environment.
*   **Ambient Shadows:** When an element must float (like a modal or FAB), use a custom shadow: `Y: 20px, Blur: 40px, Spread: -5px`. The color should be `on-surface` at 6% opacity, ensuring it feels like a soft glow rather than a heavy drop-shadow.
*   **The "Ghost Border":** If accessibility requires a stroke, use the `outline-variant` token at 15% opacity. It should be nearly invisible, acting as a "whisper" of a boundary.
*   **Frosted Depth:** Use backdrop blurs on any overlay to allow the vibrant primary and secondary background colors to bleed through, maintaining the "Warmth" even when content is layered.

---

## 5. Components

### Buttons
*   **Primary:** High-radii (`full`), using a gradient from `primary` to `primary-fixed-dim`. No border.
*   **Secondary:** `secondary-container` background with `on-secondary-container` text. Large `1.5rem` (md) corner radius.
*   **Tertiary:** No background. Bold `label-md` text in `tertiary`.

### Cards & Lists
*   **No Dividers:** Forbid the use of divider lines. Separate list items using `1rem` of vertical white space or by alternating between `surface-container-low` and `surface-container-lowest`.
*   **Corner Logic:** Cards should utilize the `lg` (2rem) or `xl` (3rem) rounding scale to emphasize the "soft" brand personality.

### Input Fields
*   **Style:** Minimalist. Use a `surface-container` background with a `full` rounded corner. 
*   **States:** On focus, the background shifts to `surface-bright` with a `2px` "Ghost Border" of `primary`.

### Specialized "Nudge" Components
*   **The Affirmation Toast:** A floating `tertiary-container` element with `xl` rounding and an expressive, soft-edged icon.
*   **The Progress Ribbon:** Use a fluid, non-linear progress bar that utilizes the `secondary` to `primary` gradient scale, avoiding "gamification" in favor of "celebration."

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If in doubt, add more padding.
*   **DO** overlap elements (e.g., an icon breaking the top edge of a card) to create a custom, high-end feel.
*   **DO** use `tertiary` (teal) as a cooling agent when the screen feels too "hot" with oranges and yellows.

### Don't
*   **DON'T** use pure black (`#000000`) for text. Use `on-surface` to maintain the warm, organic atmosphere.
*   **DON'T** use the `none` or `sm` rounding tokens for primary UI containers. Softness is a requirement, not an option.
*   **DON'T** use standard Material shadows. They are too "heavy" for this light-filled system. Stick to Tonal Layering.