# 🔧 Widget Configuration System

A standardized system for managing widget configuration states and displaying consistent messages when required parameters are missing.

## 📋 Overview

The widget configuration system provides:
- **Standardized configuration checking** for all widgets
- **Consistent UI** for missing configuration states
- **Centralized configuration definitions** for easy maintenance
- **Automatic blurring and overlay** when widgets aren't configured
- **Detailed missing parameter display** to help users configure widgets

## 🏗️ Architecture

### Core Components

1. **`useWidgetConfig` Hook** - Manages configuration state
2. **`ConfigurableWidget` HOC** - Wraps widgets with configuration logic
3. **`ConfigOverlay` Component** - Displays configuration messages
4. **`widgetConfigs.ts`** - Centralized configuration definitions

### File Structure

```
src/
├── hooks/
│   └── useWidgetConfig.ts          # Configuration state hook
├── components/
│   ├── ConfigurableWidget.tsx      # HOC for widgets
│   ├── ConfigOverlay.tsx           # Configuration overlay UI
│   └── ConfigOverlay.css           # Overlay styling
├── config/
│   └── widgetConfigs.ts            # Widget configuration definitions
└── examples/
    └── WidgetConfigurationExample.tsx  # Usage examples
```

## 🚀 Usage

### 1. Define Widget Configuration

Add your widget to `src/config/widgetConfigs.ts`:

```typescript
export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  myWidget: {
    name: 'My Widget',
    requiredParams: ['API_KEY', 'ENDPOINT_URL'],
    icon: '🔧',
    message: 'My Widget Not Connected',
    hint: 'Add API_KEY and ENDPOINT_URL to your configuration'
  }
};
```

### 2. Create Configuration Check Function

```typescript
const checkMyWidgetConfig = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/setup/my-widget/status');
    const data = await response.json();
    return data.configured;
  } catch (error) {
    console.error('Error checking configuration:', error);
    return false;
  }
};
```

### 3. Wrap Your Widget

```tsx
import ConfigurableWidget from '../components/ConfigurableWidget';
import { getWidgetConfig } from '../config/widgetConfigs';

const MyWidget: React.FC = () => {
  const config = getWidgetConfig('myWidget')!;

  return (
    <ConfigurableWidget
      config={config}
      checkConfig={checkMyWidgetConfig}
      onConfigure={() => console.log('Configure clicked')}
      className="my-widget"
    >
      {/* Your widget content goes here */}
      <div className="my-widget-content">
        <h3>Widget Content</h3>
        <p>This content will be blurred when not configured</p>
      </div>
    </ConfigurableWidget>
  );
};
```

## 🎨 Configuration Overlay

The configuration overlay automatically displays when a widget is not configured:

### Features

- **Blurred background** - Widget content is blurred and disabled
- **Consistent messaging** - Standardized icon, message, and hint
- **Missing parameters** - Shows exactly which parameters are missing
- **Configure button** - Optional button to open configuration
- **Responsive design** - Works on all screen sizes

### Styling

The overlay uses the design system tokens:

```css
.config-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border-radius: var(--border-radius-3xl);
}

.config-icon {
  font-size: var(--font-size-5xl);
  opacity: 0.8;
}

.config-message {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
```

## 📝 Configuration Definitions

### WidgetConfig Interface

```typescript
interface WidgetConfig {
  name: string;              // Display name for the widget
  requiredParams: string[];  // Array of required parameter names
  icon: string;              // Emoji or icon for the overlay
  message: string;           // Main message when not configured
  hint: string;              // Helpful hint for configuration
}
```

### Example Configurations

```typescript
// Tesla Widget
{
  name: 'Tesla',
  requiredParams: ['TESSIE_API_KEY', 'TESSIE_VIN'],
  icon: '🚗',
  message: 'Tesla Not Connected',
  hint: 'Add TESSIE_API_KEY and TESSIE_VIN to your configuration'
}

// Weather Widget
{
  name: 'Weather',
  requiredParams: ['OPENWEATHER_API_KEY', 'WEATHER_LAT', 'WEATHER_LON'],
  icon: '🌤️',
  message: 'Weather Not Connected',
  hint: 'Add OPENWEATHER_API_KEY, WEATHER_LAT, and WEATHER_LON to your configuration'
}
```

## 🔄 State Management

### useWidgetConfig Hook

The hook manages configuration state:

```typescript
const { isConfigured, missingParams, config } = useWidgetConfig(
  config,
  checkConfig
);
```

**Returns:**
- `isConfigured: boolean` - Whether the widget is properly configured
- `missingParams: string[]` - Array of missing parameter names
- `config: WidgetConfig | null` - Widget configuration (null while loading)

### Configuration Check Function

Your check function should:
1. **Return a Promise<boolean>** - true if configured, false if not
2. **Handle errors gracefully** - Return false on error
3. **Be efficient** - Cache results if possible
4. **Be reliable** - Don't throw unhandled errors

```typescript
const checkConfig = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/setup/widget/status');
    const data = await response.json();
    return data.configured;
  } catch (error) {
    console.error('Configuration check failed:', error);
    return false;
  }
};
```

## 🎯 Best Practices

### 1. Consistent Naming
- Use descriptive widget names
- Use UPPER_CASE for parameter names
- Use clear, actionable messages

### 2. Parameter Validation
- List all required parameters
- Use environment variable names
- Include both API keys and configuration values

### 3. Error Handling
- Always handle errors in check functions
- Log errors for debugging
- Return false on any error

### 4. User Experience
- Provide clear configuration hints
- Use appropriate icons
- Make configure buttons actionable

### 5. Performance
- Cache configuration checks when possible
- Don't check configuration too frequently
- Use efficient API endpoints

## 🔧 Advanced Usage

### Custom Configuration Actions

```tsx
const handleConfigure = () => {
  // Open configuration modal
  setShowConfigModal(true);
  
  // Or redirect to settings page
  window.location.href = '/settings';
  
  // Or show inline configuration
  setShowInlineConfig(true);
};
```

### Conditional Configuration

```tsx
const checkConfig = async (): Promise<boolean> => {
  // Check multiple conditions
  const hasApiKey = !!process.env.REACT_APP_API_KEY;
  const hasEndpoint = !!process.env.REACT_APP_ENDPOINT;
  const isServiceAvailable = await checkServiceHealth();
  
  return hasApiKey && hasEndpoint && isServiceAvailable;
};
```

### Dynamic Configuration

```tsx
const getDynamicConfig = (): WidgetConfig => ({
  name: 'Dynamic Widget',
  requiredParams: getRequiredParams(),
  icon: getWidgetIcon(),
  message: getCustomMessage(),
  hint: getCustomHint()
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Widget not blurring** - Check that `checkConfig` returns false
2. **Overlay not showing** - Verify configuration is defined correctly
3. **Missing parameters not showing** - Check `requiredParams` array
4. **Configuration not updating** - Ensure `checkConfig` is reactive

### Debug Mode

Enable debug logging:

```typescript
const checkConfig = async (): Promise<boolean> => {
  console.log('[MyWidget] Checking configuration...');
  try {
    const response = await fetch('/api/setup/my-widget/status');
    const data = await response.json();
    console.log('[MyWidget] Configuration status:', data.configured);
    return data.configured;
  } catch (error) {
    console.error('[MyWidget] Configuration check failed:', error);
    return false;
  }
};
```

## 📚 Examples

See `src/examples/WidgetConfigurationExample.tsx` for complete examples of all widget types.

---

*This system ensures consistent user experience across all widgets and makes configuration management much easier!*
