# Photo Carousel Widget

Displays a rotating carousel of photos from a mounted directory.

## Features
- Automatic photo rotation every 10 seconds
- Smooth crossfade transitions
- Manual navigation with arrow buttons
- Supports common image formats (JPG, JPEG, PNG, HEIC, etc.)
- Touch/swipe support for mobile devices

## Configuration

### Required Setup

Photos should be placed in the `photos/` folder inside your `CONFIG_DIR`:

```
config/
├── config.json
├── credentials.json
├── token.json
└── photos/           ← Add your photos here
    ├── photo1.jpg
    ├── photo2.png
    └── ...
```

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
    "photo_rotation_seconds": 45,
    "photos_folder": "photos"
  }
}
```

### Config Parameters

#### `photo_rotation_seconds` (optional)
- **Type**: `number`
- **Description**: How many seconds to display each photo before rotating to the next
- **Default**: `45`
- **Example**: `30` for 30 seconds, `60` for 1 minute

#### `photos_folder` (optional)
- **Type**: `string`
- **Description**: Name of the photos folder within `CONFIG_DIR`
- **Default**: `photos`
- **Example**: Set to `my-photos` to use `config/my-photos/` instead

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
1. Navigate to your `CONFIG_DIR` (e.g., `~/Desktop/mancave-config/`)
2. Add photos to the `photos/` folder (or your custom `PHOTOS_FOLDER`)
3. Photos are automatically detected and displayed
4. **No restart required** - new photos appear immediately!

## API Endpoints Used
- `GET /api/photos` - List available photos from mounted directory

## Navigation
- **Automatic**: Photos change every 10 seconds
- **Manual**: Click left/right arrows to navigate
- **Mobile**: Swipe left/right to change photos

