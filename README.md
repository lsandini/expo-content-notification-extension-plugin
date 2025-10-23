# Expo Notification Content Extension Plugin

Local Expo config plugin for iOS Notification Content Extension (NCE) - provides custom UI for expanded push notifications.

## What It Does

This plugin adds an iOS Notification Content Extension to your app that displays custom-styled notification UI when users long-press/expand a notification. It works independently or alongside the NSE plugin.

## Installation Status

✅ **Plugin is installed and configured**

## Project Structure

```
plugins/expo-notification-content-extension-plugin/
├── app.plugin.js                                   # Main entry point
├── withContentExtension.js                         # Core plugin logic
├── constants.js                                     # Configuration constants
├── utils.js                                         # Helper utilities
├── package.json                                     # Plugin metadata
└── ios/                                            # Native iOS files
    ├── NotificationViewController.h
    ├── NotificationViewController.m                # Custom UI logic
    ├── MainInterface.storyboard                    # UI layout
    ├── NotificationContentExtension-Info.plist     # Extension configuration
    └── NotificationContentExtension.entitlements   # Permissions
```

## Configuration (app.json)

```json
{
  "plugins": [
    [
      "./plugins/expo-notification-content-extension-plugin",
      {
        "mode": "production",
        "categoryIdentifier": "CGMSIM_NOTIFICATION",
        "contentSizeRatio": 0.5
      }
    ]
  ]
}
```

### Options

- **mode** (required): `"development"` or `"production"` - sets APS environment
- **categoryIdentifier** (optional): Category ID for notifications (default: `"CGMSIM_NOTIFICATION"`)
- **contentSizeRatio** (optional): Height/Width ratio for extension UI (default: `0.5`)
- **devTeam** (optional): Apple Developer Team ID (usually auto-managed by EAS)
- **iPhoneDeploymentTarget** (optional): iOS deployment target (default: `"13.0"`)

## How It Works

### 1. Continuous Native Generation (CNG)

When you run `npx expo prebuild`, the plugin:
- Creates `ios/NotificationContentExtension/` directory
- Copies native files (ViewController, storyboard, plists)
- Adds new Xcode target `NotificationContentExtension`
- Configures bundle identifier: `cgmsim.app.NotificationContentExtension`
- Sets up app groups: `group.cgmsim.app.nce`
- Configures automatic code signing

### 2. EAS Managed Credentials

EAS automatically handles:
- Creates App ID: `cgmsim.app.NotificationContentExtension`
- Generates provisioning profile for extension
- Manages signing certificates
- Configures entitlements

**No manual certificate management needed!**

### 3. Notification Flow

```
Server sends push notification with category → iOS delivers notification
                                                         ↓
                                  User long-presses notification
                                                         ↓
                              NCE shows custom styled UI
```

## Notification Payload Format

Your push notification payload **MUST** include the category identifier:

```json
{
  "aps": {
    "alert": {
      "title": "Blood Glucose Alert",
      "body": "Your glucose is 180 mg/dL"
    },
    "category": "CGMSIM_NOTIFICATION",
    "mutable-content": 1
  }
}
```

**Critical**: The `category` field must match the `categoryIdentifier` in your plugin configuration!

### With Images (Using NSE)

If you also use the NSE plugin:

```json
{
  "aps": {
    "alert": {
      "title": "Blood Glucose Alert",
      "body": "Your glucose is 180 mg/dL"
    },
    "category": "CGMSIM_NOTIFICATION",
    "mutable-content": 1
  },
  "image-url": "https://example.com/chart.png"
}
```

## Customization

### Styling (NotificationViewController.m:10-27)

Current styling:
- Background: Light gray (`rgb(242, 242, 242)`)
- Title: Bold, 17pt, black
- Body: Regular, 15pt, dark gray
- Image: Rounded corners (8pt), aspect fit

To customize, edit:
```
/plugins/expo-notification-content-extension-plugin/ios/NotificationViewController.m
```

Then run `npx expo prebuild --clean` to apply changes.

### Layout (MainInterface.storyboard)

Current layout:
- 16pt margins
- Title → Body → Image (vertical stack)
- 8pt spacing between elements
- Image hidden if no attachment

To modify layout, edit the storyboard file or replace with programmatic UI.

## Coexistence with NSE Plugin

**Both plugins can work together!**

```json
{
  "plugins": [
    [
      "expo-notification-service-extension-plugin",
      {
        "mode": "production",
        "iosNSEFilePath": "./assets/NotificationService.m"
      }
    ],
    [
      "./plugins/expo-notification-content-extension-plugin",
      {
        "mode": "production",
        "categoryIdentifier": "CGMSIM_NOTIFICATION",
        "contentSizeRatio": 0.5
      }
    ]
  ]
}
```

**Workflow**:
1. NSE intercepts notification → downloads image → attaches it
2. Notification delivered with attachment
3. User expands → NCE shows custom UI with styled content + image

**Note**: Use different app group identifiers if running both:
- NSE: `group.cgmsim.app.nse`
- NCE: `group.cgmsim.app.nce`

## Building

### Local Development

```bash
# Clean and rebuild native code
npx expo prebuild --clean

# Build iOS app
npx expo run:ios
```

### EAS Build

```bash
# Build for production
eas build --platform ios --profile production
```

EAS automatically provisions the extension target.

## Testing

### 1. Test Notification (Without Custom UI)

Send a notification **without** the category - it will display normally:

```json
{
  "aps": {
    "alert": {
      "title": "Test",
      "body": "Normal notification"
    }
  }
}
```

### 2. Test Notification (With Custom UI)

Send a notification **with** the category:

```json
{
  "aps": {
    "alert": {
      "title": "Blood Glucose Alert",
      "body": "Your glucose is 180 mg/dL"
    },
    "category": "CGMSIM_NOTIFICATION"
  }
}
```

Long-press the notification → Custom UI appears!

### 3. Debugging

If custom UI doesn't appear:
- ✅ Verify `category` matches plugin config
- ✅ Check Xcode for extension build errors
- ✅ Ensure notification isn't silent (`content-available: 1` only)
- ✅ Confirm extension target builds successfully
- ✅ Check extension's Info.plist has correct category

View extension logs:
```bash
# In Xcode: Product → Scheme → NotificationContentExtension
# Run the extension target, then send notification
```

## Verification

After running `npx expo prebuild`, verify:

```bash
# Check extension directory exists
ls -la ios/NotificationContentExtension/

# Check bundle identifier
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/cgmsimapp.xcodeproj/project.pbxproj | grep NotificationContentExtension

# Check category in Info.plist
cat ios/NotificationContentExtension/NotificationContentExtension-Info.plist | grep -A 1 "UNNotificationExtensionCategory"

# Check app group
cat ios/cgmsimapp/cgmsimapp.entitlements | grep -A 3 "application-groups"
```

Expected values:
- Bundle ID: `cgmsim.app.NotificationContentExtension`
- Category: `CGMSIM_NOTIFICATION`
- App Group: `group.cgmsim.app.nce`

## Troubleshooting

### "No matching provisioning profile found"

EAS should auto-create this. If it fails:
1. Ensure `ios.bundleIdentifier` is set in app.json
2. Run `eas build --platform ios` (not local build)
3. Check EAS dashboard for credential status

### Extension doesn't appear in Xcode

Run: `npx expo prebuild --clean`

### Custom UI doesn't show

1. Verify notification payload includes `"category": "CGMSIM_NOTIFICATION"`
2. Check that `categoryIdentifier` in app.json matches
3. Ensure `mutable-content: 1` is set (for iOS 10+)

### Build errors after modifying plugin

```bash
# Clean everything
rm -rf ios/
npx expo prebuild --clean
```

## Updating the Plugin

After modifying plugin files:

1. Clean native code: `rm -rf ios/`
2. Rebuild: `npx expo prebuild --clean`
3. Test locally: `npx expo run:ios`
4. Build with EAS: `eas build --platform ios`

## Support

For issues:
1. Check Xcode build logs
2. Verify notification payload format
3. Ensure category identifier matches
4. Review EAS build logs for provisioning issues

---

**Created**: October 2025
**Tested**: Expo SDK 54, iOS 13+
