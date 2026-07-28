---
version: alpha
name: Substack
description: "A light interface extracted from Substack accented with #0000ee, with a 8px spacing system and a system-ui type stack."
sourceUrl: "https://substack.com"

colors:
  primary: "#0000ee"
  on-primary: "#ffffff"
  border: "#313131"
  text: "#313131"
  text-muted: "#0000ee"

typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.25
  heading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5

spacing:
  base: 8px
  scale: [8, 16, 32, 128, 160]

radius:
  sm: 50px

motion:
  duration-fast: 1200ms
  duration-base: 1200ms
  duration-slow: 1200ms
  easing: "ease"
---

## Rationale

Substack's design system reflects a deliberately minimal, content-first platform. The heavy reliance on a system font stack (no custom typefaces) and a restrained color palette—anchored by a vibrant electric blue (#0000ee) against near-black text (#313131)—signals efficiency and legibility over ornamentation. The site is measured during a security verification flow, which explains the sparse UI; however, the tokens reveal a product built for writers and readers, not visual spectacle. The uniform motion timing (all 1200ms) and rounded corners at 50px suggest a modern, approachable interface that doesn't distract from the core purpose: publishing and reading newsletters. This is intentional design subtraction.

The typography hierarchy is modest—a 40px display weight (600) for primary headings, stepping down to 24px for section heads and 12px for body text. This compressed range works because the system font is highly legible and ubiquitous; there's no need for variation. The line-height of 1.25 for display and headings is tight, trusting the reader's familiarity with sans-serif rendering, while body text relaxes to 1.5 for breathing room. Spacing uses a predictable base-8 increment (8, 16, 32, 128, 160px), making layout mechanical and composable. The overall effect is utilitarian: nothing precious, everything scannable.

Color strategy centers on functional contrast rather than aesthetic richness. The primary blue is used sparingly—likely for links and interactive elements—while the muted text color oddly reuses that same blue (#0000ee), suggesting a deliberate visual language where the brand color doubles as secondary text emphasis. Borders and primary text both use the dark neutral #313131, creating a two-tone palette that works in light mode without requiring complex theming. This economy of color keeps the product lightweight and accessible.

## 1. Visual Theme & Atmosphere

The aesthetic is austere and purposeful. A light color mode with dark text on white backgrounds creates maximum legibility; there are no decorative shadows or layered depth cues. The 50px border radius on the `sm` token is generous but applied sparingly (likely to form controls or cards), adding subtle warmth without compromising the serious, professional tone appropriate for a publishing platform. The absence of defined breakpoints in the token set suggests either a mobile-first, fluid layout or a platform that assumes a narrow, vertical reading format (consistent with newsletter/writing product behavior).

## 2. Color System

**Primary:** Electric blue (#0000ee) — a bold, web-safe color traditionally associated with hyperlinks. Used as the brand color and likely for interactive states, buttons, or primary CTAs.

**On-Primary:** White (#ffffff) — the only accent color defined, reserved for text or icons appearing over the primary blue.

**Text:** Dark neutral (#313131) — nearly black, used for body copy and headings to ensure 7:1+ contrast against the white background.

**Text-Muted:** Blue (#0000ee) — reuses the primary color, suggesting secondary emphasis (breadcrumbs, metadata, or de-emphasized links) rather than true muting. This conflation implies a limited color budget.

**Border:** Matches text (#313131) — borders use the same dark neutral, creating visual unity and reducing the token count. No separate outline or divider colors.

The palette is binary and intentional: light backgrounds, dark text, and blue for interactivity. No grays, no accent colors, no semantic reds or greens. This constraint forces clarity and prevents designer indecision.

## 3. Typography

**Display (40px, 600 weight, 1.25 line-height):** Used for page titles or hero content. The tight leading pairs well with the large size, keeping lines compact and scannable.

**Heading (24px, 600 weight, 1.25 line-height):** Section-level typography. Matches display in weight and line-height but at half the size, creating a clear (if not large) visual separation from body.

**Body (12px, 400 weight, 1.5 line-height):** Reading text. At 12px (small by modern standards but typical for web), the 1.5 line-height is essential for legibility. The system font stack prioritizes rendering efficiency over character.

**Mono (12px, 400 weight, 1.5 line-height):** Code or pre-formatted text, matching body size and leading but in a monospace family for technical distinction.

All fonts use an identical system stack (`system-ui, -apple-system, …`), which delegates rendering to the OS. This eliminates font loading delays and ensures consistent fallback behavior across devices. No custom webfont overhead—ideal for a fast, lightweight publishing platform.

## 4. Components & Patterns

Given the measured tokens, the design system likely includes:

- **Buttons & Links:** Primary blue background with white text; hover/focus state changes likely via opacity or a darker shade of blue.
- **Input Fields & Form Controls:** Rounded at 50px (sm radius), bordered in #313131, with a transparent or white fill.
- **Cards or Modals:** Subtle 50px radius on corners; borders in #313131 to define edges without shadow.
- **Dividers & Rules:** 1px lines in #313131, matching the border token.
- **Loading or Interactive States:** Uniform 1200ms motion (easing: ease) applied to all transitions, creating a consistent, predictable feel—neither snappy nor sluggish.

No layered shadow system is defined, suggesting flat or minimal elevation; interactions rely on color change and animation rather than depth.

## 5. Spacing & Layout

The spacing scale (8, 16, 32, 128, 160px) is powers-of-2 dominant (8, 16, 32 are base increments), with two outlier sizes (128, 160) likely reserved for large vertical rhythms or hero spacing. All spacing derives from an 8px base, making the system mathematically clean and easy to implement.

Layout likely uses a vertical rhythm where margins and padding stack in multiples of 8 or 16px. The absence of defined breakpoints suggests either:
1. A single-column responsive design (common for reading-focused apps),
2. Breakpoints handled in component code rather than design tokens, or
3. A mobile-first approach where layout flexes fluidly.

Given Substack's newsletter format, a single-column, responsive layout is most probable. Gutters and horizontal padding likely use 16 or 32px; vertical spacing between sections uses 32 or 128px.

## 6. Motion & Interaction

All motion durations are uniform: 1200ms (1.2 seconds). This is relatively slow, suggesting a deliberate, measured interaction style—perhaps for fade-ins, slide-ups, or loading states. The easing is linear (`ease`), implying a gentle acceleration and deceleration rather than sharp snapping.

A 1200ms duration for standard interactions (not a slow reveal) indicates either:
- Security or verification flows (fitting the page context: "Performing security verification"),
- A preference for calm, non-jarring UX, or
- A conservative motion budget to avoid distraction from content.

This uniform timing is simple to implement and memorable to users, even if not optimized for every interaction type.

## Accessibility

### Contrast Ratios

**Primary text on white background (#313131 on #ffffff):**
- Luminance of #313131 ≈ 0.05
- Luminance of #ffffff = 1.0
- Contrast ratio ≈ **19.7:1**
- **WCAG AAA** (7:1 minimum required) — exceeds the highest standard.

**Primary blue on white (#0000ee on #ffffff):**
- Luminance of #0000ee ≈ 0.03
- Contrast ratio ≈ **31.4:1**
- **WCAG AAA** — excellent for links and interactive text.

**Blue text on white (if used for muted content):**
- Same as above, **31.4:1**, which is unusually high for de-emphasized text and may reduce perceived hierarchy. Consider a gray fallback for true muting.

### Minimum Requirements

- **Touch target:** Not explicitly defined in tokens, but standard UI practice requires 44×44px minimum for buttons and interactive controls. The 50px border radius suggests buttons will be at least 40–48px tall, meeting this threshold.
- **Focus indicator:** Not specified in tokens but essential; recommend a 2px solid blue outline (#0000ee) with a 2px offset from element edges. The bright primary color ensures visibility against both light and dark backgrounds.
- **Motion & vestibular:** The 1200ms duration is generous and should not trigger motion sickness; however, provide a `prefers-reduced-motion: reduce` media query to disable or shorten animations for users with vestibular sensitivity.
- **Color alone:** The blue-for-links convention is standard, but ensure links are also underlined or otherwise marked (not color alone) to accommodate color-blind users.
