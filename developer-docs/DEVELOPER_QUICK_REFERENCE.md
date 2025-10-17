# 🚀 Developer Quick Reference

Quick reference for using the Mancave Dashboard design system.

## 🎨 CSS Classes

### Layout
```css
.flex, .flex-col, .flex-row
.items-center, .items-start, .items-end
.justify-center, .justify-between, .justify-start, .justify-end
.gap-1, .gap-2, .gap-3, .gap-4, .gap-5, .gap-6
.w-full, .h-full, .min-h-0
```

### Cards
```css
.card                    /* Base card styling */
.card-header            /* Card header with icon and title */
.card-icon              /* Icon styling */
.card-title             /* Title styling */
.card-content           /* Content area */
```

### Buttons
```css
.btn                    /* Base button */
.btn-primary            /* Primary button (gradient) */
.btn-secondary          /* Secondary button */
.btn-ghost              /* Ghost button */
.btn-sm, .btn, .btn-lg  /* Button sizes */
```

### Status
```css
.status-dot             /* Status indicator dot */
.status-dot-success     /* Green dot */
.status-dot-warning     /* Yellow dot */
.status-dot-error       /* Red dot */
.status-dot-info        /* Blue dot */
.status-dot-primary     /* Brand color dot */
```

### States
```css
.disconnected           /* Blurred, disabled state */
.connection-overlay     /* Overlay for disconnected state */
.loading                /* Loading state */
.loading-spinner        /* Spinning loader */
```

### Text
```css
.text-xs, .text-sm, .text-base, .text-md, .text-lg, .text-xl, .text-2xl, .text-3xl, .text-4xl, .text-5xl
.font-light, .font-normal, .font-medium, .font-semibold, .font-bold, .font-extrabold
.text-primary, .text-secondary, .text-tertiary, .text-quaternary, .text-muted
```

### Utilities
```css
.opacity-50, .opacity-60, .opacity-70, .opacity-80, .opacity-90
.rounded-sm, .rounded-md, .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-full
.shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl
.transition-fast, .transition-normal, .transition-slow
```

## 🧩 Component Patterns

### Basic Card Structure
```jsx
<div className="card">
  <div className="card-header">
    <span className="card-icon">🌡️</span>
    <h3 className="card-title">Weather</h3>
  </div>
  <div className="card-content">
    {/* Your content here */}
  </div>
</div>
```

### Connection States
```jsx
{!isConnected ? (
  <div className="connection-overlay">
    <div className="overlay-icon">🔌</div>
    <div className="overlay-message">Not Connected</div>
    <div className="overlay-hint">Check your configuration</div>
  </div>
) : (
  <div className="card-content">
    {/* Your content here */}
  </div>
)}
```

### Loading States
```jsx
{isLoading ? (
  <div className="loading">
    <div className="loading-spinner"></div>
    <span>Loading...</span>
  </div>
) : (
  <div className="card-content">
    {/* Your content here */}
  </div>
)}
```

### Status Indicators
```jsx
<div className="flex items-center gap-2">
  <div className="status-dot status-dot-success"></div>
  <span className="text-sm text-secondary">Connected</span>
</div>
```

### Buttons
```jsx
<button className="btn btn-primary btn-sm">
  <span className="card-icon">🔄</span>
  Refresh
</button>

<button className="btn btn-secondary">
  Settings
</button>
```

### Lists
```jsx
<div className="flex flex-col gap-2">
  <div className="flex items-center gap-2 p-2 bg-quaternary rounded-lg">
    <div className="status-dot status-dot-info"></div>
    <span className="text-sm">Item 1</span>
  </div>
</div>
```

## 🎨 CSS Custom Properties

### Colors
```css
var(--color-primary)           /* #667eea */
var(--color-secondary)         /* #764ba2 */
var(--color-bg-primary)        /* #0a0a0a */
var(--color-bg-tertiary)       /* rgba(255, 255, 255, 0.03) */
var(--color-text-primary)      /* rgba(255, 255, 255, 0.95) */
var(--color-text-secondary)    /* rgba(255, 255, 255, 0.8) */
var(--color-text-tertiary)     /* rgba(255, 255, 255, 0.6) */
```

### Spacing
```css
var(--space-1)    /* 0.25rem - 4px */
var(--space-2)    /* 0.5rem - 8px */
var(--space-3)    /* 0.75rem - 12px */
var(--space-4)    /* 1rem - 16px */
var(--space-5)    /* 1.25rem - 20px */
var(--space-6)    /* 1.5rem - 24px */
```

### Typography
```css
var(--font-size-xs)     /* 0.65rem */
var(--font-size-sm)     /* 0.75rem */
var(--font-size-base)   /* 0.85rem */
var(--font-size-lg)     /* 1rem */
var(--font-size-xl)     /* 1.1rem */
var(--font-size-2xl)    /* 1.25rem */
```

### Transitions
```css
var(--transition-fast)      /* 0.15s ease */
var(--transition-normal)    /* 0.3s ease */
var(--transition-slow)      /* 0.5s ease */
```

## 📱 Responsive Design

### Mobile Breakpoint
```css
@media (max-width: 768px) {
  .card {
    padding: var(--space-4);
  }
}
```

## ✅ Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Follow the card pattern** for consistency
3. **Use semantic class names** that describe purpose
4. **Test on multiple screen sizes**
5. **Maintain accessibility** with proper contrast
6. **Keep animations subtle** and purposeful

## 🔧 Common Patterns

### Data Display
```jsx
<div className="flex justify-between items-center p-3 bg-quaternary rounded-lg">
  <span className="text-sm text-tertiary">Label</span>
  <span className="text-base font-semibold text-primary">Value</span>
</div>
```

### Interactive Lists
```jsx
<div className="flex flex-col gap-2">
  {items.map((item, index) => (
    <div key={index} className="flex items-center gap-3 p-3 bg-quaternary rounded-lg hover:bg-tertiary transition-normal">
      <div className="status-dot status-dot-primary"></div>
      <span className="text-sm flex-1">{item.name}</span>
      <button className="btn btn-ghost btn-sm">→</button>
    </div>
  ))}
</div>
```

### Form Elements
```jsx
<input 
  className="input" 
  placeholder="Enter value..."
  value={value}
  onChange={handleChange}
/>
```

---

*Keep this reference handy while developing new components!*
