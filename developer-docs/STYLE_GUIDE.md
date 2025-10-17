# 🎨 Mancave Dashboard Style Guide

A comprehensive design system for maintaining visual consistency across all dashboard components and future add-ons.

## 📋 Table of Contents

- [Design Philosophy](#design-philosophy)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Layout Patterns](#layout-patterns)
- [Animation Guidelines](#animation-guidelines)
- [Responsive Design](#responsive-design)
- [Usage Examples](#usage-examples)

## 🎯 Design Philosophy

The Mancave Dashboard follows a **dark, modern, glassmorphism** design language that prioritizes:

- **Clarity**: High contrast text and clear visual hierarchy
- **Consistency**: Unified spacing, colors, and component patterns
- **Accessibility**: Sufficient contrast ratios and readable typography
- **Performance**: Optimized animations and efficient CSS
- **Scalability**: Easy to extend with new components and themes

## 🎨 Color System

### Primary Colors
```css
--color-primary: #667eea;        /* Main brand color */
--color-primary-dark: #5a6fd8;   /* Darker variant */
--color-primary-light: #7c8eec;  /* Lighter variant */
--color-secondary: #764ba2;      /* Secondary brand color */
--color-accent: #f093fb;         /* Accent color for highlights */
```

### Background Colors
```css
--color-bg-primary: #0a0a0a;                           /* Main background */
--color-bg-secondary: #1a1a1a;                         /* Secondary background */
--color-bg-tertiary: rgba(255, 255, 255, 0.03);       /* Card backgrounds */
--color-bg-quaternary: rgba(255, 255, 255, 0.05);     /* Interactive elements */
--color-bg-overlay: rgba(0, 0, 0, 0.6);               /* Overlays and modals */
```

### Text Colors
```css
--color-text-primary: rgba(255, 255, 255, 0.95);      /* Main text */
--color-text-secondary: rgba(255, 255, 255, 0.8);     /* Secondary text */
--color-text-tertiary: rgba(255, 255, 255, 0.6);      /* Tertiary text */
--color-text-quaternary: rgba(255, 255, 255, 0.5);    /* Muted text */
--color-text-muted: rgba(255, 255, 255, 0.4);         /* Very muted text */
```

### Status Colors
```css
--color-success: #10b981;        /* Success states */
--color-warning: #f59e0b;        /* Warning states */
--color-error: #ef4444;          /* Error states */
--color-info: #3b82f6;           /* Info states */
```

## 📝 Typography

### Font Family
```css
--font-family-primary: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Font Weights
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### Font Sizes
```css
--font-size-xs: 0.65rem;    /* 10.4px - Labels, captions */
--font-size-sm: 0.75rem;    /* 12px - Small text */
--font-size-base: 0.85rem;  /* 13.6px - Body text */
--font-size-md: 0.9rem;     /* 14.4px - Medium text */
--font-size-lg: 1rem;       /* 16px - Large text */
--font-size-xl: 1.1rem;     /* 17.6px - Card titles */
--font-size-2xl: 1.25rem;   /* 20px - Section headers */
--font-size-3xl: 1.5rem;    /* 24px - Page headers */
--font-size-4xl: 2rem;      /* 32px - Large headers */
--font-size-5xl: 3rem;      /* 48px - Display text */
```

### Line Heights
```css
--line-height-tight: 1.2;     /* Headers */
--line-height-normal: 1.4;    /* Body text */
--line-height-relaxed: 1.5;   /* Comfortable reading */
--line-height-loose: 1.6;     /* Very comfortable reading */
```

## 📏 Spacing

The spacing system uses a consistent scale based on 4px units:

```css
--space-1: 0.25rem;   /* 4px - Micro spacing */
--space-2: 0.5rem;    /* 8px - Small spacing */
--space-3: 0.75rem;   /* 12px - Medium spacing */
--space-4: 1rem;      /* 16px - Base spacing */
--space-5: 1.25rem;   /* 20px - Large spacing */
--space-6: 1.5rem;    /* 24px - Extra large spacing */
--space-8: 2rem;      /* 32px - Section spacing */
--space-10: 2.5rem;   /* 40px - Large section spacing */
--space-12: 3rem;     /* 48px - Extra large section spacing */
--space-16: 4rem;     /* 64px - Page spacing */
--space-20: 5rem;     /* 80px - Hero spacing */
```

## 🧩 Components

### Card System

The card is the fundamental building block of the dashboard:

```css
.card {
  background: var(--color-bg-tertiary);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-3xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: all var(--transition-normal);
}
```

#### Card Structure
```html
<div class="card">
  <div class="card-header">
    <span class="card-icon">🌡️</span>
    <h3 class="card-title">Weather</h3>
  </div>
  <div class="card-content">
    <!-- Card content goes here -->
  </div>
</div>
```

### Button System

#### Primary Button
```css
.btn.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  box-shadow: var(--shadow-glow);
}
```

#### Secondary Button
```css
.btn.btn-secondary {
  background: var(--color-bg-quaternary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

#### Button Sizes
```css
.btn-sm { padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); }
.btn { padding: var(--space-3) var(--space-4); font-size: var(--font-size-base); }
.btn-lg { padding: var(--space-4) var(--space-6); font-size: var(--font-size-lg); }
```

### Status Indicators

```css
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot-success { background: var(--color-success); }
.status-dot-warning { background: var(--color-warning); }
.status-dot-error { background: var(--color-error); }
.status-dot-info { background: var(--color-info); }
.status-dot-primary { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); }
```

## 🏗️ Layout Patterns

### Connection States

All components should handle disconnected states consistently:

```css
.disconnected {
  filter: blur(4px);
  opacity: 0.5;
  pointer-events: none;
}

.connection-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: var(--z-modal);
  pointer-events: none;
}
```

### Loading States

```css
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-md);
}
```

## ✨ Animation Guidelines

### Transition Timing
```css
--transition-fast: 0.15s ease;      /* Hover effects */
--transition-normal: 0.3s ease;     /* Standard transitions */
--transition-slow: 0.5s ease;       /* Complex animations */
--transition-very-slow: 1s ease;    /* Page transitions */
```

### Common Animations
```css
.animate-fade-in { animation: fadeIn 1s ease-in-out; }
.animate-slide-in { animation: slideIn 0.5s ease-out; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

### Animation Principles
- **Subtle**: Animations should enhance, not distract
- **Purposeful**: Every animation should have a clear purpose
- **Consistent**: Use the same timing functions across components
- **Accessible**: Respect `prefers-reduced-motion` when possible

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations
```css
@media (max-width: 768px) {
  .card {
    padding: var(--space-4);
  }
  
  .card-header {
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
  }
  
  .card-title {
    font-size: var(--font-size-lg);
  }
}
```

## 💡 Usage Examples

### Creating a New Component

1. **Import the design system**:
```css
@import '../styles/design-system.css';
```

2. **Use semantic class names**:
```css
.my-component {
  /* Use design tokens */
  background: var(--color-bg-tertiary);
  padding: var(--space-4);
  border-radius: var(--border-radius-lg);
  color: var(--color-text-primary);
}
```

3. **Follow the card pattern**:
```html
<div class="card my-component">
  <div class="card-header">
    <span class="card-icon">🔧</span>
    <h3 class="card-title">My Component</h3>
  </div>
  <div class="card-content">
    <!-- Content here -->
  </div>
</div>
```

### Adding Interactive Elements

```html
<button class="btn btn-primary btn-sm">
  <span class="card-icon">➕</span>
  Add Item
</button>
```

### Status Indicators

```html
<div class="flex items-center gap-2">
  <div class="status-dot status-dot-success"></div>
  <span class="text-sm text-secondary">Connected</span>
</div>
```

## 🚀 Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Follow the card pattern** for consistency
3. **Use semantic class names** that describe purpose, not appearance
4. **Test on multiple screen sizes** and devices
5. **Maintain accessibility** with proper contrast ratios
6. **Keep animations subtle** and purposeful
7. **Document new patterns** when they emerge

## 🔧 Maintenance

- **Update tokens** in `design-system.css` when making global changes
- **Test components** across all supported platforms
- **Validate accessibility** with automated tools
- **Keep documentation** up to date with changes
- **Review consistency** during code reviews

---

*This style guide is a living document. Update it as the design system evolves.*
