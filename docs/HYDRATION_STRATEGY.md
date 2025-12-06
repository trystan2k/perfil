# Astro Hydration Strategy

**Version:** 1.0  
**Date:** 2025-12-05  
**Status:** Active

## Table of Contents

1. [Overview](#overview)
2. [The Problem with client:only](#the-problem-with-clientonly)
3. [Directive Usage Guide](#directive-usage-guide)
4. [Decision Tree](#decision-tree)
5. [Migration Rules](#migration-rules)
6. [Code Examples](#code-examples)
7. [Verification Checklist](#verification-checklist)
8. [Related Documents](#related-documents)

---

## Overview

This document defines the official hydration strategy for the Perfil project. It prescribes when to use each Astro client directive and establishes limits to maintain optimal performance.

### Goals

- ✅ Minimize Time to Interactive (TTI)
- ✅ Reduce initial JavaScript bundle size
- ✅ Maintain excellent user experience
- ✅ Prevent Flash of Unstyled Content (FOUC)
- ✅ Ensure critical features hydrate immediately

### Key Principles

1. **Progressive Enhancement:** Server-render everything possible
2. **Strategic Hydration:** Only hydrate what needs interactivity
3. **Prioritization:** Critical features hydrate first, nice-to-haves wait
4. **Hard Limit:** Maximum 2-3 `client:only` instances per page

---

## The Problem with client:only

### What client:only Does

```astro
<MyComponent client:only="react" />
```

- **Skips SSR entirely** - component only renders on client
- **Forces eager hydration** - loads and executes immediately on page load
- **No progressive enhancement** - users with JS disabled see nothing
- **Increases TTI** - all client:only components compete for main thread

### Performance Impact

| Metric | Impact | Severity |
|--------|--------|----------|
| Time to Interactive (TTI) | ⬆️ Increases | High |
| Initial JS Bundle | ⬆️ Larger | High |
| First Contentful Paint (FCP) | ⬇️ May delay | Medium |
| Cumulative Layout Shift (CLS) | ⬆️ Risk increases | Medium |

### When client:only is Justified

Use `client:only` **ONLY** when:
- Component uses browser-only APIs that cannot be polyfilled
- Library absolutely requires `window` or `document` during module initialization
- SSR causes irrecoverable hydration mismatches
- You've exhausted all other options

**Maximum instances:** 2-3 per page

---

## Directive Usage Guide

### client:load (High Priority Hydration)

**When to Use:**
- Critical app state providers (theme, error boundaries)
- Components required for First Meaningful Paint
- Features that prevent FOUC
- Essential user experience features

**Behavior:**
- Hydrates as soon as possible after page load
- Component SSR'd, then immediately hydrated
- JavaScript loads in `<head>` or early in `<body>`

**Examples:**
- Theme providers
- Error boundaries
- Critical navigation
- Authentication state

```astro
<ThemeProvider client:load>
  <!-- Critical for preventing FOUC -->
</ThemeProvider>
```

---

### client:idle (Deferred Hydration)

**When to Use:**
- Non-critical interactive components
- User-initiated controls (buttons, switches, dropdowns)
- Background services (analytics, PWA updates)
- Features users must actively engage with

**Behavior:**
- Waits for browser's `requestIdleCallback`
- Hydrates when main thread is free
- Component SSR'd, hydration deferred

**Examples:**
- Theme switchers
- Language switchers
- User preference controls
- Non-critical navigation
- PWA installers

```astro
<ThemeSwitcher client:idle />
<!-- User must click to interact, can wait -->
```

---

### client:visible (Lazy Hydration)

**When to Use:**
- Below-the-fold content
- Offscreen components
- Secondary features
- Widgets in sidebars or footers

**Behavior:**
- Uses IntersectionObserver
- Hydrates when component enters viewport
- Perfect for lazy-loading

**Examples:**
- Footer widgets
- Offscreen modals
- Lazy-loaded content sections
- Secondary navigation

```astro
<NewsletterSignup client:visible />
<!-- Only loads when user scrolls to footer -->
```

---

### client:media (Conditional Hydration)

**When to Use:**
- Responsive components that differ by breakpoint
- Mobile-only or desktop-only features
- Components for specific device types

**Behavior:**
- Hydrates when media query matches
- Can save bandwidth on wrong device types

**Examples:**
- Mobile navigation menu
- Desktop-only features
- Tablet-specific layouts

```astro
<MobileMenu client:media="(max-width: 768px)" />
<!-- Only hydrates on mobile -->
```

---

## Decision Tree

```
Is the component interactive?
├─ NO → No client directive needed (static Astro)
└─ YES → Continue...

Does it absolutely require client-only rendering?
├─ YES → Use client:only (document why!)
└─ NO → Continue...

Is it critical for first paint / FOUC prevention?
├─ YES → Use client:load
└─ NO → Continue...

Is it above the fold?
├─ YES → Does user need it immediately?
│   ├─ YES → Use client:load
│   └─ NO → Use client:idle
└─ NO → Is it currently visible?
    ├─ NO → Use client:visible
    └─ YES → Use client:idle
```

---

## Migration Rules

### From client:only to Strategic Directives

Follow this checklist when replacing `client:only`:

#### Step 1: Identify Component Type

1. **Provider/Context components** that wrap other components
   - ThemeProvider, ErrorProvider, StateProvider
   - **Usually:** `client:load` (if critical) or `client:idle`

2. **Interactive UI components** with click handlers
   - Buttons, switchers, dropdowns, forms
   - **Usually:** `client:idle`

3. **Background/Service components**
   - Analytics, PWA updaters, service workers
   - **Usually:** `client:idle` or `client:visible`

4. **Below-fold components**
   - Footers, sidebars, modals
   - **Usually:** `client:visible`

#### Step 2: Test for SSR Compatibility

```bash
# Build the project to check for SSR errors
pnpm build

# If build fails with "window is not defined" or similar:
# - Add browser checks: if (typeof window !== 'undefined')
# - Move browser code to useEffect
# - Consider dynamic imports
```

#### Step 3: Verify Functionality

- ✅ Component renders correctly on server
- ✅ Component hydrates and becomes interactive
- ✅ No hydration mismatches in console
- ✅ User interactions work as expected

#### Step 4: Measure Impact

- 📊 Check Lighthouse scores (before/after)
- 📊 Measure TTI improvement
- 📊 Verify JS bundle size reduction

---

## Code Examples

### Example 1: Theme Provider (client:only → client:load)

**❌ Before: Unnecessary client:only**

```astro
<ThemeProvider client:only="react">
  <slot />
</ThemeProvider>
```

**Problems:**
- Forces client-side rendering
- Increases TTI
- No SSR benefits

**✅ After: Strategic client:load**

```astro
<ThemeProvider client:load>
  <slot />
</ThemeProvider>
```

**Benefits:**
- SSR'd wrapper HTML
- Still hydrates immediately (prevents FOUC)
- Reduces main thread contention
- Better progressive enhancement

**Rationale:** Theme provider is critical for preventing FOUC. Must hydrate early but doesn't need to skip SSR.

---

### Example 2: Theme Switcher (client:only → client:idle)

**❌ Before: Over-eager hydration**

```astro
<ThemeSwitcher client:only="react" />
```

**Problems:**
- Competes with critical components on page load
- User can't interact until JS loads anyway
- Not needed for first paint

**✅ After: Deferred hydration**

```astro
<ThemeSwitcher client:idle />
```

**Benefits:**
- SSR'd button markup (users see UI faster)
- Hydrates when browser is idle
- Doesn't block critical resources
- Still ready before user can click

**Rationale:** User must actively click theme button. Can wait until main thread is free. Not critical for initial render.

---

### Example 3: Error State Provider (client:only → client:load)

**❌ Before: Unnecessary client:only**

```astro
<ErrorStateProviderWrapper client:only="react">
  <slot />
</ErrorStateProviderWrapper>
```

**Problems:**
- No error handling during SSR
- Delayed error boundary setup

**✅ After: Critical hydration**

```astro
<ErrorStateProviderWrapper client:load>
  <slot />
</ErrorStateProviderWrapper>
```

**Benefits:**
- Error boundary active ASAP
- Catches errors in other components
- Critical for app stability

**Rationale:** Error boundaries must be ready immediately to catch errors from any part of the app.

---

### Example 4: Additional Optimizations

Even components already using strategic directives can be optimized:

**⚠️ Before: Over-prioritized**

```astro
<LanguageSwitcher client:load />
<PwaUpdater client:load />
```

**✅ After: Right-sized**

```astro
<LanguageSwitcher client:idle />
<!-- User-initiated, can wait -->

<PwaUpdater client:idle />
<!-- Background task, not critical -->
```

---

## Verification Checklist

Use this checklist when implementing hydration changes:

### Pre-Implementation

- [ ] Read audit inventory (`docs/hydration-audit-inventory.md`)
- [ ] Identify component type (provider, UI, service, below-fold)
- [ ] Determine criticality (is it needed for first paint?)
- [ ] Check current `client:*` directive usage

### Implementation

- [ ] Replace `client:only` with appropriate directive
- [ ] Add code comment explaining directive choice
- [ ] Test component SSR (run `pnpm build`)
- [ ] Verify no hydration errors in console
- [ ] Confirm page has ≤ 2-3 `client:only` instances

### Testing

- [ ] Run full test suite: `pnpm test`
- [ ] Manual testing of interactive features
- [ ] Check for visual regressions
- [ ] Verify no FOUC (theme/layout shifts)
- [ ] Test on slow 3G network (throttle in DevTools)

### Performance Validation

- [ ] Run Lighthouse audit (before/after)
- [ ] Measure TTI improvement
- [ ] Check JS bundle size reduction
- [ ] Verify no CLS regressions
- [ ] Test on mobile device

### Documentation

- [ ] Update component comments with directive rationale
- [ ] Document any exceptions to the rules
- [ ] Add entry to performance metrics log
- [ ] Update this strategy doc if new patterns emerge

---

## Related Documents

- **Audit Inventory:** [`docs/hydration-audit-inventory.md`](./hydration-audit-inventory.md) - Complete audit of current `client:only` usage
- **Task:** Task Master #42 - Replace Excessive client:only with Strategic Hydration
- **Official Docs:** [Astro Client Directives](https://docs.astro.build/en/reference/directives-reference/#client-directives)

---

## Quick Reference Table

| Directive | When to Use | Hydration Timing | Example Use Cases |
|-----------|-------------|------------------|-------------------|
| **client:load** | Critical components | Immediately on page load | Theme providers, error boundaries, critical state |
| **client:idle** | Non-critical interactions | When browser is idle | Switchers, dropdowns, user preferences |
| **client:visible** | Below-fold components | When scrolled into view | Footer widgets, lazy sections |
| **client:media** | Responsive components | When media query matches | Mobile menus, breakpoint-specific features |
| **client:only** | Browser-only components | Immediately (no SSR) | ⚠️ **Last resort only!** Max 2-3 per page |

---

## Updates and Maintenance

This is a living document. Update it when:
- New patterns emerge in the codebase
- Performance requirements change
- Astro releases new hydration features
- Team discovers better practices

**Last Updated:** 2025-12-05  
**Next Review:** After task #42 completion
