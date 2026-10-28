# Advanced Typography Studio Overhaul (Urdu Designer & CapCut)

Upgrade the Cinema Styling Studio drawer with a professional suite of advanced typography tools, parameters, and utilities inspired by Urdu Designer (calligraphic shaping, Kashida elongation, calligraphy ligatures, text warping) and CapCut (modern subtitle presets, neon glow, 3D extrusions, backdrop ribbons), structured cleanly into four intuitive sub-tabs.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following directions have been confirmed based on your requirements and interactive questionnaire feedback:

- **Confirmed Decision 1 (Dual Feature Scope)**: Full integration of both Urdu Designer calligraphy/shaping utilities and CapCut high-impact video subtitle styles.
- **Confirmed Decision 2 (Drawer Architecture)**: Typography controls organized into four structured sub-tabs: **Basic Typography**, **Visual Effects**, **Urdu Shaping & Calligraphy**, and **Style Presets**.
- **Confirmed Decision 3 (Preset & Manual Flexibility)**: Comprehensive one-click templates (CapCut viral subtitle styles + Urdu Designer artistic layouts) combined with granular manual adjustment sliders and numeric inputs.
- **Confirmed Decision 4 (Zero Live Leaks to Workspace)**: All typography modifications strictly render in real-time within the Studio's broadcast preview screen, and are only applied to the translation workspace upon explicit confirmation ("Apply to Subtitles").

---

### 1. Overview & Core Concept

- **What It Does**: Empowers video subtitlers, translators, and content creators to transform subtitle streams into broadcast-quality typography. Creators can fine-tune Nastaliq calligraphy flourishes, stretch Arabic/Urdu words with Kashida, curve text along cinematic arcs, generate multi-stroke neon glows, wrap captions in CapCut-style backdrop badges, and apply viral video caption presets with a single click.
- **Target Audience / Persona**: Video editors, subtitle localizers, Urdu/bilingual content creators, and social media producers (TikTok, YouTube Shorts, Reels, Cinema).
- **Key Value**: Eliminates the need to switch out of the application to external design software (like Urdu Designer or CapCut) just to style high-impact translated captions.

---

### 2. User Experience & Visual Design

#### Sub-Tab Architecture within Typography
Inside the **Typography** drawer tab, a segmented sub-navigation bar provides fast switching across four dedicated tool suites:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Aa] Basic      │  [✨] Effects     │  [✒️] Shaping     │  [🎨] Presets  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Basic Sub-Tab**:
   - **Dual Font Selection**: Dedicated typography selectors for Urdu (Jameel Noori Nastaliq, Noto Nastaliq Urdu, Gulzar, Mehr Nastaliq, Al Qalam, Noto Sans Arabic) and English / Source scripts with typography preview chips.
   - **Precise Sizing & Scale**: Interactive slider (12px–64px) with quick-access preset buttons (`16px`, `20px`, `24px`, `28px`, `32px`, `40px`, `48px`).
   - **Typographic Weight & Stance**: 7-level font weight grid (300 Light to 900 Black), italic angle, bold tags, and text case transformation (`None`, `UPPERCASE`, `Capitalize`, `lowercase`).
   - **Spacing Utilities**: Letter tracking slider (`-2px` to `+8px`), line height leading (`1.2` to `3.0`), and word spacing (`0px` to `16px`).
   - **Alignment & Direction**: Auto, Left, Center, Right, Justified alignment, with explicit RTL / LTR baseline toggles.

2. **Effects Sub-Tab (CapCut Style)**:
   - **Multi-Stroke & Double Border**: Dual outline engine allowing inner crisp stroke + outer soft diffusion or contrast ring with independent color and thickness.
   - **CapCut Glow & Bloom**: Multi-level text glow with adjustable radius, intensity, and neon saturation for viral social video captions.
   - **3D Extrusion & Perspective Skew**: Depth bevel and isometric extrusion with X/Y tilt angles and drop shading.
   - **Backdrop Containers & Ribbons**: Solid/gradient background boxes, comic speech pills, YouTube/TikTok rounded banners with adjustable padding, corner radius, opacity, and borders.
   - **Dynamic Kinetic Effects**: Karaoke highlight tracking, subtle pulse, wave bounce, and shimmer animations.

3. **Shaping Sub-Tab (Urdu Designer Style)**:
   - **Kashida (Tatweel) Text Elongation**: Automatic and manual Kashida insertion tool that stretches Arabic/Urdu cursive connections for balanced justification and calligraphic elegance (`Light`, `Medium`, `Maximum`, `Custom`).
   - **Islamic & Calligraphic Ligatures**: One-click insertion utility for authentic calligraphic marks (ﷺ, ﷻ, ﷽, ؓ, ؒ, ؑ, ﷴ, ﷲ) that integrate smoothly into subtitle lines.
   - **Text Arc & Curve Warping**: Curvature tool to bend subtitle lines along convex/concave arcs or subtle cinema waves.
   - **Urdu Baseline Offset & Diacritic Tuning**: Vertical optical balance adjustments to accommodate tall Nastaliq ascenders/descenders without clipping.

4. **Presets Sub-Tab (Instant Templates)**:
   - **CapCut Viral Subtitle Library**: "Viral Yellow Punch", "TikTok Glow Split", "Cinema Minimalist White", "Bold Gaming Neon", "Retro VHS Amber", "CapCut News Ribbon", "Hormozi Kinetic Caption", "Podcast Pastel Duo".
   - **Urdu Designer Calligraphic Library**: "Jashn-e-Urdu Nastaliq", "Royal Gold Calligraphy", "Emerald Quranic Theme", "Diwani Poetry Ribbon", "Modern Headline Nastaliq".
   - **Custom User Presets**: Ability to name and save custom typography configurations into browser local storage for instant reuse across sessions.

---

### 3. Key Product Decisions & Trade-Offs

- **Sub-Tab Navigation vs Accordion Overflow**:
  - *Chosen Approach*: Horizontal segmented sub-tabs within the Typography section.
  - *Why*: Accommodates dozens of advanced sliders and utilities without forcing the user to scroll endlessly down a massive drawer.
  - *Alternative Considered*: Accordions inside one long view, which becomes unwieldy on mobile and compact laptop viewports.

- **Non-Destructive Tatweel / Kashida Engine**:
  - *Chosen Approach*: Visual tatweel rendering algorithm that applies Kashida elongations dynamically during subtitle formatting, preserving raw clean text in underlying data structures.
  - *Why*: Ensures subtitles remain cleanly searchable, exportable to standard SRT, and editable without permanent text corruption.

- **CSS-Native 3D & Curved Text Rendering**:
  - *Chosen Approach*: Modern SVG text path warping and layered CSS text-shadow/clip-path transforms.
  - *Why*: Lightweight, 60fps hardware accelerated in modern browsers without heavy WebGL dependencies.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      StylingStudioDrawer Component                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Cinema Preview Screen Viewport                │  │
│  │       (Real-Time In-Drawer Renderer: CSS / SVG / WebFonts)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Typography Sub-Tab Controller                 │  │
│  │  ┌──────────────┬──────────────┬──────────────┬───────────────┐  │  │
│  │  │ Basic Specs  │ Visual FX    │ Urdu Shaping │ Quick Presets │  │  │
│  │  └──────────────┴──────────────┴──────────────┴───────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┬────────────────────┘
                                                    │
                                     [Apply to Subtitles Action]
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  App.tsx - Translation Workspace Table                 │
│         (Updates Subtitles & Applied Styling State Upon Confirm)       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Extended Configuration Schema (`ActiveStylingConfig`)
The configuration state will be augmented with type-safe properties:
- `wordSpacing: string`
- `textGlowIntensity: number`, `textGlowColor: string`, `textGlowRadius: number`
- `secondaryOutlineColor?: string`, `secondaryOutlineWidth?: number`
- `extrusionDepth: number`, `extrusionAngle: number`
- `kashidaLevel: 'none' | 'subtle' | 'moderate' | 'dramatic'`
- `textArc: 'none' | 'arc-up' | 'arc-down' | 'wave'`
- `textArcRadius: number`
- `backdropShape: 'box' | 'rounded' | 'pill' | 'ribbon' | 'badge' | 'comic'`
- `customTypographyPresets: StylingPreset[]`

---

### 5. Step-by-Step Implementation Strategy

1. **State & Type Definitions**:
   - Update `ActiveStylingConfig` interface and default config constants in `StylingStudioDrawer.tsx` to include new typography properties.
   - Create helper utility functions in `subtitleFormatter.ts` to compute advanced styles (dual strokes, Kashida elongation insertion, curved text rendering, CapCut glow).
2. **Typography Sub-Tab UI Component**:
   - Build sub-navigation tabs (Basic, Effects, Shaping, Presets) inside the typography section of `StylingStudioDrawer.tsx`.
   - Implement the **Basic** controls (font selectors, scale, weights, letter/word spacing, alignment).
   - Implement the **Effects** controls (CapCut glow, double stroke, 3D extrusion, backdrop ribbons).
   - Implement the **Shaping** controls (Urdu Kashida slider, calligraphic symbols insert bar, arc curvature).
   - Implement the **Presets** gallery with CapCut viral styles and Urdu Designer calligraphy themes.
3. **Cinema Preview Screen Synchronization**:
   - Update `renderStylizedSubtitleHtml` and the preview container in `StylingStudioDrawer.tsx` so all new parameters preview instantly in the studio viewport.
4. **Workspace Application Pipeline**:
   - Verify that all newly added typography parameters flow cleanly into `handleApplyToSubtitles` and propagate to the translation workspace upon user confirmation.
5. **Compilation & Quality Check**:
   - Run `compile_applet` and `lint_applet` to verify clean build without TypeScript or styling regressions.
