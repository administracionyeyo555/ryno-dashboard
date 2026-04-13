# RYNO Studio - Design Philosophy

## Overview

RYNO Studio is a **Command Center Dashboard** for monitoring AI agents and managing development projects. The design philosophy centers around creating an interface that is **bold, purposeful, and unmistakably RYNO** - not another generic admin panel.

---

## Core Design Principles

### 1. Tech-Industrial Aesthetic

The visual language draws inspiration from **mission control centers** and **industrial tech interfaces**:

- Deep, space-inspired backgrounds (`#0a0a0f` to `#12121a`)
- Electric accent colors with intentional glow effects
- Geometric patterns and grid overlays for depth
- Subtle noise textures for tactile richness

### 2. Signature Orange

The **RYNO Orange** (`#FF6B35`) is the brand's signature color:

```css
--accent: #FF6B35;
--accent-hover: #ff8554;
--accent-glow: rgba(255, 107, 53, 0.25);
--accent-muted: rgba(255, 107, 53, 0.12);
```

**Usage Guidelines:**
- Active states and primary actions
- Accent highlights on hover
- Glow effects for emphasis
- Never overuse - maintain visual hierarchy

### 3. Typography Stack

**Avoid generic fonts.** The typography system creates immediate visual differentiation:

| Purpose | Font | Weight | Usage |
|---------|------|--------|-------|
| **Display** | Space Grotesk | 600-700 | Headlines, navigation labels, section titles |
| **Body** | Outfit | 300-600 | Body text, descriptions, UI labels |
| **Mono** | Fira Code | 400-600 | Code, data values, timestamps, badges |

### 4. Depth & Dimensionality

Cards and components use **layered depth** to create visual hierarchy:

```css
.card {
  background: linear-gradient(135deg, var(--card) 0%, rgba(22, 22, 31, 0.95) 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 4px 24px -4px rgba(0, 0, 0, 0.3);
}
```

---

## Component Design Guidelines

### Cards

- **Gradient backgrounds** for subtle depth
- **Inner glow** on inset border (rgba white)
- **Hover lift** with accent glow shadow
- **Rounded corners** at 12px (`rounded-xl`)

### Navigation

- **Active indicator bar** with gradient and glow
- **Icon containers** with background on active state
- **Stagger animations** for initial load
- **Spring physics** for hover interactions

### Status Indicators

All status dots include **glow effects** matching their semantic color:

```css
.status-running {
  background: var(--success);
  box-shadow: 0 0 12px var(--success);
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Badges

- **Monospace font** (Fira Code)
- **Uppercase** with letter-spacing
- **Glow shadow** matching badge color
- **Small size** (0.65rem) for subtlety

### Buttons

- **Gradient backgrounds** for primary
- **Tactile feedback** with scale on press
- **Glow shadows** on hover
- **Display font** for labels

---

## Animation Principles

### 1. Spring Physics

Use spring animations for natural, organic feel:

```typescript
const springPhysics = {
  smooth: { type: 'spring', stiffness: 200, damping: 25 },
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  bouncy: { type: 'spring', stiffness: 300, damping: 20 },
}
```

### 2. Stagger Effects

List items should animate in sequence:

```typescript
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}
```

### 3. Glow Animations

Active elements should "breathe" with subtle glow pulses:

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px var(--success); }
  50% { box-shadow: 0 0 16px var(--success); }
}
```

---

## Color System

### Semantic Colors

| Name | Value | Glow | Usage |
|------|-------|------|-------|
| Success | `#00e676` | rgba(0, 230, 118, 0.2) | Running states, completions |
| Warning | `#ffab00` | rgba(255, 171, 0, 0.2) | Idle states, cautions |
| Error | `#ff5252` | rgba(255, 82, 82, 0.2) | Errors, destructive actions |
| Info | `#40c4ff` | rgba(64, 196, 255, 0.2) | Informational states |

### Secondary Accent

**Electric Cyan** (`#00d4ff`) for contrast against RYNO Orange:

- Used sparingly for secondary highlights
- Links and interactive secondary elements
- Creates visual interest without competing with orange

---

## Maintaining Consistency

### Do

1. **Use CSS variables** - Never hardcode colors
2. **Apply font families** - Use `var(--font-display)` for headers
3. **Include glow effects** - Active states need visual emphasis
4. **Animate thoughtfully** - Spring physics over linear timing
5. **Layer depth** - Gradients and shadows create hierarchy

### Don't

1. **Use Inter font** - Too generic, breaks brand identity
2. **Flat buttons** - Missing tactile feedback
3. **Instant transitions** - Feels mechanical
4. **Overuse accent** - Dilutes visual hierarchy
5. **Generic grey borders** - Use depth instead

---

## File Structure

```
app/
  globals.css          # Core design tokens and component classes
components/
  layout/
    Sidebar.tsx        # Navigation with brand styling
  dashboard/
    ProjectCard.tsx    # Card components with depth effects
    EventTimeline.tsx  # Timeline with glow indicators
    TaskCard.tsx       # Kanban cards with hover effects
lib/
  animations.ts        # Spring physics and animation variants
```

---

## Implementation Checklist

When creating new components, verify:

- [ ] Uses `var(--font-display)` for headings
- [ ] Uses `var(--font-mono)` for data/code
- [ ] Has glow effect on active state
- [ ] Includes hover state with lift/scale
- [ ] Uses spring physics for animations
- [ ] Colors from CSS variables only
- [ ] Rounded corners consistent (`rounded-xl` for cards, `rounded-lg` for inputs)

---

## References

- **Supabase Dashboard** - Dark theme inspiration
- **Linear** - Animation and interaction patterns
- **Vercel Dashboard** - Information density
- **Raycast** - Command center aesthetic

---

*This document should be updated as the design system evolves. When adding new components, ensure they align with these principles to maintain a cohesive, distinctive experience.*
