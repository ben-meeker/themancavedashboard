# Photo Carousel Widget

Displays a rotating carousel of photos from a mounted directory.

## Features
- Automatic photo rotation every 10 seconds
- Smooth crossfade transitions
- Manual navigation with arrow buttons
- Supports common image formats (JPG, JPEG, PNG, HEIC, etc.)
- Touch/swipe support for mobile devices

## Configuration

### Required Volume Mount
```yaml
volumes:
  - ./public/photos:/app/public/photos
```

Place your photos in the `public/photos` directory on your host machine.

### Widget Config (`config.json`)
```json
{
  "id": "photos",
  "location": {
    "x": 5,
    "y": 2,
    "width": 1,
    "height": 2
  },
  "config": {
    "photo_rotation_seconds": 45
  }
}
```

### Config Parameters

#### `photo_rotation_seconds` (optional)
- **Type**: `number`
- **Description**: How many seconds to display each photo before rotating to the next
- **Default**: `45`
- **Example**: `30` for 30 seconds, `60` for 1 minute

## Size
- **Default**: 2x2 grid cells
- Recommended for proper photo display

## Supported Image Formats
- `.jpg` / `.jpeg`
- `.png`
- `.heic`
- `.gif`
- `.webp`

## How to Add Photos
1. Create a `public/photos` directory in your project root
2. Add your photos to this directory
3. The widget will automatically detect and display them
4. No restart required - photos are loaded dynamically

## API Endpoints Used
- `GET /api/photos` - List available photos from mounted directory

## Navigation
- **Automatic**: Photos change every 10 seconds
- **Manual**: Click left/right arrows to navigate
- **Mobile**: Swipe left/right to change photos

