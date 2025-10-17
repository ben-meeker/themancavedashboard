# Widget Template

Use this template to create a new widget for the dashboard.

## Quick Start

1. **Copy this folder** and rename it to your widget name (e.g., `MyWidget`)
2. **Edit `widget.config.ts`** with your widget's metadata
3. **Edit `MyWidget.tsx`** with your widget's UI
4. **Add configuration requirements** in `widget.config.ts`
5. **Test your widget** by adding it to the dashboard in edit mode

## File Structure

```
MyWidget/
├── README.md              # This file (optional, for documentation)
├── widget.config.ts       # Widget metadata and registration
├── MyWidget.tsx           # Main widget component
├── MyWidget.css          # Widget styles (optional)
├── myWidgetApi.ts        # API/service functions (optional)
└── types.ts              # TypeScript types (optional)
```

## Widget Configuration (`widget.config.ts`)

This file defines your widget's metadata and registers it with the dashboard.

```typescript
import type { WidgetMetadata } from '../../types/widget.ts';
import MyWidget from './MyWidget.tsx';

export const widgetConfig: WidgetMetadata = {
  // Unique identifier (lowercase, no spaces)
  id: 'mywidget',
  
  // Display name shown in widget selector
  name: 'My Widget',
  
  // Short description
  description: 'A brief description of what this widget does',
  
  // Icon/emoji to display
  icon: '🎯',
  
  // Default size on the grid
  defaultSize: {
    width: 2,  // Grid cells wide (1-6)
    height: 2  // Grid cells tall (1-4)
  },
  
  // React component
  component: MyWidget,
  
  // Configuration requirements (what needs to be in config.json)
  requiredConfig: [
    {
      key: 'my_setting',
      label: 'My Setting',
      description: 'Description of what this setting does'
    }
  ],
  
  // Optional: Environment variables needed
  requiredEnv: [
    {
      key: 'MY_API_KEY',
      label: 'My API Key',
      description: 'Get this from https://example.com'
    }
  ]
};

// Auto-register the widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}
```

## Widget Component (`MyWidget.tsx`)

Your main React component. Use the `useWidgetConfig` hook to access configuration.

```typescript
import React, { useState, useEffect } from 'react';
import { useWidgetConfig } from '../../hooks/useWidgetConfig';
import './MyWidget.css';

interface MyWidgetData {
  // Define your data structure
  value: string;
}

const MyWidget: React.FC = () => {
  const { config, isConfigured, missingParams } = useWidgetConfig('mywidget');
  const [data, setData] = useState<MyWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) return;

    // Fetch your data
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/mywidget');
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [isConfigured]);

  // The widget wrapper will show configuration overlay if not configured
  if (!isConfigured) return null;

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="my-widget widget-card">
      <div className="widget-header">
        <h3>My Widget</h3>
      </div>
      <div className="widget-content">
        <p>{data.value}</p>
      </div>
    </div>
  );
};

export default MyWidget;
```

## Styling (`MyWidget.css`)

Use the dashboard's design system variables for consistent styling.

```css
.my-widget {
  /* Widget containers already have base styling */
  /* Add widget-specific styles here */
}

.my-widget .widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.my-widget .widget-content {
  /* Your content styles */
}

/* Use design system variables */
/* Colors: --color-primary, --color-bg-*, --color-text-*, --color-border-* */
/* Spacing: --space-1 through --space-8 */
/* Typography: --font-size-*, --font-weight-* */
/* Borders: --border-radius-*, --border-width-* */
```

## Configuration in `config.json`

Add your widget to the user's `config.json`:

```json
{
  "global": {
    "timezone": "America/Denver",
    "grid_columns": 6,
    "grid_rows": 4
  },
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

**Note:** The `width` and `height` fields in `location` are automatically populated from your widget's `defaultSize` when users save their layout in edit mode. Users don't need to manually set these values.

## Backend API (if needed)

If your widget needs a backend API endpoint, add it to `server/main.go`:

```go
// In server/main.go, add to the /api route group:
r.Get("/mywidget", getMyWidgetData)
```

Create `server/mywidget.go`:

```go
package main

import (
    "encoding/json"
    "net/http"
)

func getMyWidgetData(w http.ResponseWriter, r *http.Request) {
    // Your API logic here
    data := map[string]string{
        "value": "Hello from my widget!",
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(data)
}
```

## Testing Your Widget

1. **Build and restart**: `docker-compose build && docker-compose up -d`
2. **Enter edit mode**: Click the pencil icon
3. **Add widget**: Click "Add Widget" and select your widget
4. **Place widget**: Drag it to the desired position
5. **Click Done**: Save your layout

## Tips

- **Keep it simple**: Focus on displaying one piece of information clearly
- **Handle errors**: Always show user-friendly error messages
- **Loading states**: Show loading indicators while fetching data
- **Responsive**: Use grid units that work well at different screen sizes
- **Consistent styling**: Use the design system variables for colors, spacing, etc.
- **Accessibility**: Use semantic HTML and proper ARIA labels

## Common Patterns

### Fetching from external APIs
```typescript
const response = await fetch(`/api/mywidget?param=${config.my_setting}`);
```

### Using environment variables (via backend)
```go
apiKey := os.Getenv("MY_API_KEY")
```

### Auto-refresh data
```typescript
const interval = setInterval(fetchData, 60000); // Every minute
return () => clearInterval(interval);
```

### Reading widget config
```typescript
const { config } = useWidgetConfig('mywidget');
const mySetting = config?.my_setting;
```

## Need Help?

Check existing widgets for examples:
- **Simple widget**: `Weather/` - displays API data
- **Complex widget**: `Calendar/` - multiple data sources, services
- **Interactive widget**: `PhotoCarousel/` - user interactions
- **Configuration-heavy**: `PlantSensors/` - arrays of config items

Each widget folder is self-contained with its component, styles, services, and config!

