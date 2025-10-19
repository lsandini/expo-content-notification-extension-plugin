# Expo Notification Content Extension Plugin

An Expo config plugin that adds iOS Notification Content Extension support, enabling custom UI for expanded push notifications.

## What It Does

This plugin automatically configures an iOS Notification Content Extension in your Expo app. When users long-press a notification, they see a custom-styled UI instead of the default iOS notification view.

## Features

- Custom notification UI with title, body text, and image support
- Works with Expo's managed workflow (CNG)
- Compatible with EAS Build
- Can coexist with Notification Service Extension (NSE) plugins
- Automatic provisioning and code signing via EAS

## Installation

1. Copy this plugin to your project (e.g., `plugins/expo-notification-content-extension-plugin/`)

2. Add to your `app.json`:

```json
{
  "plugins": [
    [
      "./plugins/expo-notification-content-extension-plugin",
      {
        "mode": "production",
        "categoryIdentifier": "YOUR_CATEGORY_ID"
      }
    ]
  ]
}
```

3. Run prebuild:

```bash
npx expo prebuild --clean
```

## Configuration Options

- **mode** (required): `"development"` or `"production"` - sets APNs environment
- **categoryIdentifier** (optional): Category ID for your notifications (default: `"CGMSIM_NOTIFICATION"`)
- **contentSizeRatio** (optional): Height-to-width ratio for the extension UI (default: `0.5`)
- **devTeam** (optional): Apple Developer Team ID (usually auto-managed by EAS)
- **iPhoneDeploymentTarget** (optional): Minimum iOS version (default: `"13.0"`)

## Usage

### Notification Payload

Your push notifications must include the `category` field matching your configuration:

```json
{
  "aps": {
    "alert": {
      "title": "Notification Title",
      "body": "Notification message"
    },
    "category": "YOUR_CATEGORY_ID",
    "mutable-content": 1
  }
}
```

### With Images

To display images, include an attachment (often added via NSE plugin):

```json
{
  "aps": {
    "alert": {
      "title": "Notification Title",
      "body": "Notification message"
    },
    "category": "YOUR_CATEGORY_ID",
    "mutable-content": 1
  },
  "image-url": "https://example.com/image.png"
}
```

## Customization

The plugin includes default styling with a light gray background, bold title, and rounded image corners. To customize:

1. Edit `ios/NotificationViewController.m` for styling changes
2. Modify `ios/MainInterface.storyboard` for layout changes
3. Run `npx expo prebuild --clean` to apply

## Building

### Local Development
```bash
npx expo prebuild --clean
npx expo run:ios
```

### Production (EAS)
```bash
eas build --platform ios --profile production
```

## How It Works

When you run `npx expo prebuild`, the plugin:
1. Creates the `ios/NotificationContentExtension/` directory
2. Adds native files (ViewController, storyboard, Info.plist)
3. Configures a new Xcode target with proper bundle identifier
4. Sets up app groups and entitlements
5. Configures automatic code signing

EAS Build automatically handles provisioning profiles and certificates.

## Troubleshooting

### Custom UI doesn't show
- Verify the `category` field in your notification matches `categoryIdentifier` in your config
- Ensure `mutable-content: 1` is set in the notification payload
- Check Xcode logs for extension build errors

### Build errors
```bash
rm -rf ios/
npx expo prebuild --clean
```

### Provisioning issues
- Ensure `ios.bundleIdentifier` is set in `app.json`
- Use EAS Build (not local builds) for automatic provisioning
- Check EAS dashboard for credential status

## License

MIT
