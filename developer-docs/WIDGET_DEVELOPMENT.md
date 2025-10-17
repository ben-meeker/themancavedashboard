# Widget Development Guide

## 🚀 Quick Start: Adding a New Widget

This dashboard uses a fully modular widget architecture on both frontend and backend. Adding a widget is as simple as copying templates and filling in the blanks!

## Frontend Widget

### Step 1: Copy the Frontend Template

```bash
cd src/widgets
cp -r _template MyNewWidget
```

### Step 2: Edit the Config

Edit `MyNewWidget/widget.config.ts`:
- Change the `id` (must be unique, lowercase)
- Update `name`, `description`, and `icon`
- Set `defaultSize` (grid cells: 1-6 wide, 1-4 tall)
- Define `requiredConfig` (what goes in config.json)

### Step 3: Build Your Widget

Edit `MyNewWidget/MyNewWidget.tsx` with your widget logic

### Step 4: Register It

Add one line to `src/widgets/index.ts`:
```typescript
import './MyNewWidget/widget.config';
```

**Note**: Widget registration happens automatically via the import. No manual registry updates needed!

### Step 5: Done!

Rebuild and your widget will appear in the widget selector automatically!

```bash
docker-compose build && docker-compose up -d
```

## Backend Widget (Optional)

If your widget needs API endpoints:

### Step 1: Copy the Backend Template

```bash
cd server/widgets
cp -r _template mywidget
```

### Step 2: Implement the Widget

Edit `mywidget/widget.go`:
- Implement the `Widget` interface (ID, Initialize, RegisterRoutes, GetRequiredEnvVars)
- Add your HTTP handlers
- Use `os.Getenv()` to read environment variables

### Step 3: Register It

Add to `server/widgets/register.go`:
```go
import "themancavedashboard/widgets/mywidget"

func init() {
    Register(&mywidget.MyWidget{})
}
```

### Step 4: Rebuild

```bash
docker-compose build && docker-compose up -d
```

See `server/widgets/README.md` for complete backend documentation.

## 📁 Widget File Structure

### Frontend Structure
```
src/widgets/
├── _template/              # 📝 START HERE - Copy this!
│   ├── README.md          # Complete documentation
│   ├── widget.config.ts   # Widget metadata
│   ├── TemplateWidget.tsx # React component
│   └── TemplateWidget.css # Styles
│
├── MyWidget/              # Your new widget (self-contained!)
│   ├── widget.config.ts   # Widget metadata & registration
│   ├── MyWidget.tsx       # Main component
│   ├── MyWidget.css       # Styles
│   ├── myWidgetApi.ts     # API/services (if needed)
│   └── types.ts           # TypeScript types (if needed)
│
└── index.ts               # Add your import here
```

### Backend Structure
```
server/widgets/
├── _template/              # 📝 START HERE - Copy this!
│   ├── README.md          # Complete documentation
│   └── widget.go          # Widget template
│
├── mywidget/              # Your new widget (self-contained!)
│   └── widget.go          # All widget logic
│
└── register.go            # Add your import here
```

## 🎯 How It Works

1. **Auto-Registration**: When your `widget.config.ts` imports, it registers itself globally
2. **Auto-Discovery**: The widget registry automatically finds all registered widgets
3. **No Manual Updates**: You don't need to modify the widget registry manually
4. **Backward Compatible**: Existing widgets still work during migration

## 🔧 Widget Configuration

Widgets are configured in two places:

### 1. Widget Metadata (`widget.config.ts`)
Defines the widget itself - icon, size, what it needs to work

### 2. User Configuration (`config.json`)
User-specific data for each widget instance

Example `config.json`:
```json
{
  "widgets": [
    {
      "id": "mywidget",
      "location": {
        "x": 0,
        "y": 0,
        "width": 2,
        "height": 2
      },
      "config": {
        "my_setting": "value"
      }
    }
  ]
}
```

**Note:** The `width` and `height` in `location` are automatically populated from the widget's `defaultSize` when you save the layout in edit mode. You don't need to manually add them.

## 📚 Full Documentation

See `src/widgets/_template/README.md` for:
- Complete API reference
- Code examples
- Styling guidelines
- Backend integration
- Best practices

## 🎨 Design System

Use these CSS variables for consistent styling:

```css
/* Colors */
--color-primary
--color-bg-primary, --color-bg-secondary, --color-bg-tertiary
--color-text-primary, --color-text-secondary, --color-text-tertiary
--color-border-primary, --color-border-secondary

/* Spacing */
--space-1 through --space-8

/* Typography */
--font-size-xs, --font-size-sm, --font-size-base, --font-size-lg, --font-size-xl
--font-weight-normal, --font-weight-semibold, --font-weight-bold

/* Borders */
--border-radius-sm, --border-radius-md, --border-radius-lg
--border-width-thin, --border-width-medium
```

## 🐛 Troubleshooting

**Widget doesn't appear in selector?**
- Check that `widget.config.ts` is imported in `src/widgets/index.ts`
- Verify the widget ID is unique
- Check browser console for errors

**Configuration overlay shows incorrectly?**
- Ensure `requiredConfig` in `widget.config.ts` matches what you check for
- Make sure `useWidgetConfig` hook is used correctly

**Styles not applying?**
- Import your CSS file in the component
- Use design system variables for consistency
- Check for CSS class name conflicts

## 💡 Tips

- **Start simple**: Get it working, then add features
- **Use the template**: It has all the patterns you need
- **Check existing widgets**: See how others solve similar problems
- **Test in edit mode**: Add/remove widgets to test configuration
- **Keep it modular**: One widget = one responsibility

## 🎁 Examples

Check these existing widgets:
- **`_template/`** - The template with all patterns
- **`Weather/`** - Simple API data display with backend service
- **`Calendar/`** - Complex multi-source widget with calendar API
- **`PhotoCarousel/`** - Interactive widget with photo rotation
- **`PlantSensors/`** - Array-based config with multiple sensors
- **`Tesla/`** - Simple API integration with status display
- **`MealCalendar/`** - Cross-widget service usage (uses Calendar's API)

All widgets are fully self-contained in their folders!

---

Happy widget building! 🎉

For questions or issues, check the main README or the template documentation.

