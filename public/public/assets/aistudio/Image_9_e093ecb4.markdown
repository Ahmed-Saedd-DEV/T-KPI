---
name: Telemetry Dark Industrial
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#b9c7e5'
  on-secondary: '#233148'
  secondary-container: '#394760'
  on-secondary-container: '#a7b5d3'
  tertiary: '#52e87c'
  on-tertiary: '#003915'
  tertiary-container: '#2ccb63'
  on-tertiary-container: '#004f20'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#b9c7e5'
  on-secondary-fixed: '#0d1c32'
  on-secondary-fixed-variant: '#394760'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  metric-num-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
  metric-num-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
  metric-num-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-sm: 0.75rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for industrial analytics, floor control, and warehouse operations. It prioritizes clarity, situational awareness, and split-second operational intelligence under low-fatigue high-contrast conditions.

The brand personality is precise, mission-critical, unembellished, and authoritative. It combines contemporary SaaS minimalism with industrial HUD telemetry. The aesthetic balances deep navy backdrops with luminescent operational accents, ensuring dense data points and performance metrics are instantly parseable across warehouse terminal mounts, office supervisor setups, and handheld rugged devices.

## Colors

The palette leverages a dark hierarchy engineered to eliminate display glow and eyestrain while maximizing contrast for high-density telemetry.

### Surfaces
- **Canvas / Root Background**: `#0B1120`
- **Primary Surface / Cards**: `#151F32`
- **Secondary Surface / Elevated Panels & Drawers**: `#1B2940`
- **Tertiary Surface / Interactive Hover States**: `#223554`

### Structure & Outlines
- **Subtle Borders**: `#1E293B`
- **Focused & Interactive Borders**: `#334155`
- **Accent Hairlines**: `rgba(56, 189, 248, 0.25)`

### Typography & Content
- **Primary Text**: `#F8FAFC`
- **Secondary / Supporting Text**: `#94A3B8`
- **Muted / Placeholder Text**: `#64748B`

### Core Brand Accents
- **Primary Core Accent**: `#38BDF8` (Sky blue for actions, focus rings, and baseline indicators)
- **Primary Core Accent Muted**: `rgba(56, 189, 248, 0.12)`

### Performance Tiers & Operational Telemetry
- **Tier 1 (Excellent)**: `#22C55E`
- **Tier 2 (Very Good)**: `#A3D977`
- **Tier 3 (Good)**: `#FDE047`
- **Tier 4 (Average)**: `#FBBF24`
- **Tier 5 (Below Average)**: `#FB923C`
- **Tier 6 (Low Performance / Action Required)**: `#F87171`

All tier tokens must be accompanied by an opacity-tinted background (typically 12–16% fill over `#151F32`) to render non-disruptive, highly scannable status chips, metrics badges, and chart marks.

## Typography

The design system uses Inter exclusively across all tiers. Inter delivers pristine tabular spacing, tall x-height, and neutral precision needed for rapid reading of picks per hour (PPH), cycle times, and operational quotas.

### Numerical Data & Tabular Figures
All numeric values, timers, rates, and timestamps must render with font feature settings enabled: `tnum` (tabular figures) and `cv02`, `cv03`, `cv04` for disambiguated character geometry.

### Capitalization and Sizing Rules
- Metric labels, table headers, and category chips use `label-sm` or `label-md` with `letter-spacing: 0.05em` and uppercase styling.
- Primary values must lead with the `metric-num-*` scale, paired with an adjacent or subordinate `label-sm` unit token in `#94A3B8`.

## Layout & Spacing

The layout is built upon an adaptive 12-column fluid grid engineered for responsive dashboards. 

### Breakpoints & Layout Topology
- **Desktop (1280px and above)**: 12-column grid, `margin-lg` (32px), `gutter-lg` (24px). Persistent left-hand operations rail (collapsed to 72px or expanded to 240px) with fluid multi-column analytic widget tiles.
- **Tablet / Mid-View (768px – 1279px)**: 8-column grid, `margin` (24px), `gutter` (16px). Left rail collapses to a micro-sidebar; KPI clusters snap to 2x2 grids.
- **Mobile Handheld (320px – 767px)**: 4-column grid, `margin-sm` (12px), `gutter-sm` (12px). Full-bleed cards, bottom fixed quick-switch bar, and full-height slide-over drawer for filters and picker drill-downs.

### Spacing Philosophy
Rhythm follows strict 4px / 8px sub-divisions. Inner container padding strictly maintains high density without cognitive clutter: metric tiles use `space-md` (16px) internal padding, while complex operational data tables use compact vertical padding (`space-xs` to `space-sm`) to optimize above-the-fold record density.

## Elevation & Depth

Visual hierarchy is constructed through tonal layering and crisp, low-contrast structural outlines rather than heavy drop shadows.

### Surface Tiers
- **Layer 0 (Canvas)**: `#0B1120` — Baseline application background.
- **Layer 1 (Cards & Data Containers)**: `#151F32` with a 1px uniform outline of `#1E293B`.
- **Layer 2 (Elevated Flyouts, Popovers, & Drawers)**: `#1B2940` with a 1px uniform outline of `#334155`.
- **Layer 3 (Modals & Tooltips)**: `#1E293B` with border `#475569` and a tight ambient shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.60)`.

### Depth Accents
Shadows are flat and desaturated; glowing halos are reserved strictly for active alerts or hovered interactive rings. Active picker selection or filter states feature an inner glow hairline: `box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.4)`.

## Shapes

The design system adopts a Soft shape system (`roundedness: 1`), conveying technical rigor and functional efficiency.

- **Base Radius (0.25rem / 4px)**: Input fields, table row highlight containers, small badge chips, and progress track caps.
- **Medium Radius (`rounded-lg`, 0.5rem / 8px)**: KPI cards, operational module tiles, dropdown menus, and popover panels.
- **Large Radius (`rounded-xl`, 0.75rem / 12px)**: Mobile bottom sheets, slide-over drawer heads, and dialog modals.
- **Circular (`rounded-full`)**: Exclusively reserved for status indicators, circular SVG gauge tracks, avatar badges, and icon buttons.

## Components

### Buttons
- **Primary Action**: Solid `#38BDF8` background with `#0B1120` bold text. On hover, background transitions to `#7DD3FC`. Focus ring: 2px offset border in `#38BDF8`.
- **Secondary Action**: `#1B2940` background, 1px border of `#334155`, `#F8FAFC` text. Hover shifts background to `#223554`.
- **Ghost / Utility**: Transparent background, `#94A3B8` text, hover reveals `#151F32` with `#F8FAFC` text.

### KPI Cards & Performance Metrics
- Constructed on Layer 1 `#151F32` with `#1E293B` 1px border.
- Layout: Top row contains micro-label (`label-sm`, `#94A3B8`) and tier badge. Center row displays the primary metric using `metric-num-lg` in `#F8FAFC`. Bottom row pairs trend delta icons (up/down) with comparative baseline figures (e.g., "vs warehouse avg").

### Circular Progress SVG Rings
- Dual-path SVG vector gauges displaying individual picker velocity or shift progress.
- **Background Track**: `#1E293B` stroke, width 6px–8px.
- **Active Meter Path**: Stroke dynamically mapped to the picker performance tier color (e.g., `#22C55E` for Excellent, `#F87171` for Low Performance). Stroke-cap must be rounded. Center cutout holds the percentage value using `metric-num-md` with tabular font features.

### Performance Status Badges & Chips
- Padding: 2px 8px. Height: 22px. Radius: `0.25rem`.
- Structure: 6px solid circular dot on the left, followed by uppercase label (`label-sm`).
- Dynamic Color Mapping:
  - Excellent: Background `rgba(34, 197, 94, 0.12)`, text `#22C55E`, dot `#22C55E`.
  - Very Good: Background `rgba(163, 217, 119, 0.12)`, text `#A3D977`, dot `#A3D977`.
  - Good: Background `rgba(253, 224, 71, 0.12)`, text `#FDE047`, dot `#FDE047`.
  - Average: Background `rgba(251, 191, 36, 0.12)`, text `#FBBF24`, dot `#FBBF24`.
  - Below Average: Background `rgba(251, 146, 60, 0.12)`, text `#FB923C`, dot `#FB923C`.
  - Low: Background `rgba(248, 113, 113, 0.12)`, text `#F87171`, dot `#F87171`.

### Data Tables & Picker Leaderboards
- Headers: `#0B1120` or `#151F32` sticky row, border-bottom 1px `#1E293B`, typography `label-sm` in `#94A3B8`.
- Rows: Background `#151F32`, alternate rows tinted subtly or separated with 1px `#1E293B`. Hover state applies `#1B2940`.
- Cells: Text `#F8FAFC`, tabular numeric right-alignment for PPH, total units, accuracy percentage, and idle time.

### Inputs & Selectors
- Background `#0B1120`, border 1px `#334155`, text `#F8FAFC`, placeholder `#64748B`.
- Focus State: Border color `#38BDF8`, inner box shadow `0 0 0 1px #38BDF8`.

### Navigation Architecture
- **Desktop Sidebar**: Layer 1 `#151F32` surface with right border `#1E293B`. Iconography in `#94A3B8` switching to `#38BDF8` with a 3px active vertical pill indicator on the left edge.
- **Mobile Bottom Navigation Bar**: Fixed at bottom, `#151F32` with top border `#1E293B`. 4 core destinations (Floor, Pickers, Zones, Alerts) with tap targets minimum 48px height.
- **Mobile Operational Drawer**: Slides from right or bottom, background `#1B2940`, header containing title and dismiss touch target, housing filter parameters, picker profile details, and shift log reassignments.