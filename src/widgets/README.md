# 🧩 Frontend Widgets

This folder contains all dashboard widgets. Each widget is **self-contained** with its own component, styles, services, and configuration.

## 📁 Structure

```
src/widgets/
├── README.md              # This documentation
├── index.ts               # Auto-registration entry point
├── _template/             # Widget template (copy this to create new widgets)
│   ├── README.md
│   ├── widget.config.ts
│   ├── TemplateWidget.tsx
│   └── TemplateWidget.css
├── Calendar/              # ✅ Google Calendar widget
│   ├── widget.config.ts   # Widget metadata & registration
│   ├── Calendar.tsx       # Main component
│   ├── Calendar.css       # Styles
│   └── googleCalendarApi.ts # Google Calendar service
├── Tesla/                 # ✅ Tesla widget
├── Weather/               # ✅ Weather widget
├── PlantSensors/          # ✅ Plant care widget
├── MealCalendar/          # ✅ Meal calendar widget
└── PhotoCarousel/         # ✅ Photo carousel widget
```

## 🚀 Creating a New Widget

### Quick Start

1. **Copy the template:**
   ```bash
   cp -r _template MyWidget
   ```

2. **Edit `widget.config.ts`:**
   - Change the `id` (must be unique)
   - Update `name`, `description`, `icon`
   - Set `defaultSize` (grid cells)
   - Define `requiredConfig` parameters

3. **Build your component:**
   Edit `MyWidget.tsx` with your widget logic

4. **Register it:**
   Add to `index.ts`:
   ```typescript
   import './MyWidget/widget.config';
   ```

5. **Done!** Your widget will appear in the widget selector

See `_template/README.md` for complete documentation.

## 🎯 Widget Architecture

### Auto-Registration
Widgets register themselves via their `widget.config.ts` file. No manual registry updates needed!

### Self-Contained
Each widget folder contains:
- **Component** - React component (`.tsx`)
- **Styles** - CSS file (`.css`)
- **Config** - Widget metadata (`widget.config.ts`)
- **Services** - API calls (`.ts` files, optional)
- **Types** - TypeScript types (optional)

### Configuration
Widgets use the `useWidgetConfig` hook to access their configuration from `config.json`:

```typescript
const { config, isConfigured, missingParams } = useWidgetConfig('mywidget');
```

## 🎨 Styling

All widgets use the design system from `src/styles/design-system.css`:

```css
/* Use these CSS custom properties */
--color-primary
--color-bg-primary, --color-bg-secondary, --color-bg-tertiary
--color-text-primary, --color-text-secondary
--space-1 through --space-8
--border-radius-md
```

See `developer-docs/STYLE_GUIDE.md` for the complete design system.

## 📋 Widget Interface

Every widget must export a `widgetConfig` object:

```typescript
export const widgetConfig: WidgetMetadata = {
  id: 'mywidget',              // Unique identifier
  name: 'My Widget',           // Display name
  description: 'What it does', // Short description
  icon: '🔧',                   // Icon/emoji
  defaultSize: {               // Grid size
    width: 2,
    height: 2
  },
  component: MyWidget,         // React component
  requiredConfig: [            // Required config parameters
    {
      key: 'api_key',
      label: 'API Key',
      description: 'Your API key'
    }
  ],
  requiredEnv: []              // Required env vars (optional)
};
```

## 🔧 Configuration Overlay

Widgets automatically show a configuration overlay when not configured:

```typescript
const { config, isConfigured, missingParams } = useWidgetConfig('mywidget');

if (!isConfigured) return null; // Overlay shows automatically
```

The `ConfigurableWidget` HOC (deprecated) has been replaced with the `useWidgetConfig` hook.

## 📚 Examples

Check these widgets for reference:

- **`_template/`** - Complete template with all patterns
- **`Calendar/`** - Complex widget with external API and OAuth
- **`Weather/`** - Simple API integration
- **`PlantSensors/`** - Array-based configuration
- **`PhotoCarousel/`** - Interactive media widget
- **`Tesla/`** - Simple status display
- **`MealCalendar/`** - Cross-widget service usage

## 🎁 Widget Capabilities

Widgets can:
- ✅ Display data from backend APIs
- ✅ Have their own configuration parameters
- ✅ Define their own grid size
- ✅ Include their own services/APIs
- ✅ Use the design system
- ✅ Show configuration overlays automatically
- ✅ Be dragged and repositioned in edit mode

## 🧪 Testing

When developing a widget:

1. **Build and run:**
   ```bash
   docker-compose build && docker-compose up -d
   ```

2. **Enter edit mode** (pencil icon)

3. **Add your widget** from the widget selector

4. **Test configuration states:**
   - Configured (with valid config.json)
   - Not configured (missing parameters)
   - Loading states
   - Error states

## 🔄 Backend Integration

If your widget needs API endpoints, create a corresponding backend widget in `server/widgets/`.

See `server/widgets/README.md` for backend widget development.

## 🎯 Best Practices

### Code Organization
- One widget = one responsibility
- Keep all widget code in its folder
- Use TypeScript for type safety
- Document complex logic

### Performance
- Use proper loading states
- Handle errors gracefully
- Avoid unnecessary re-renders
- Lazy load heavy dependencies

### User Experience
- Provide clear feedback
- Handle edge cases
- Use consistent patterns
- Follow accessibility guidelines

### Configuration
- Define clear, user-friendly config parameters
- Provide helpful descriptions
- Validate configuration properly
- Show meaningful error messages

---

**See `_template/README.md` for complete documentation and examples!**
