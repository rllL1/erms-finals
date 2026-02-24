# PWA Setup for ERMS - Exam Records Management System

## Overview

Your ERMS system is now configured as a Progressive Web App (PWA). Users can install it directly from Chrome on Android without needing an APK.

## What's Been Configured

### ✅ Files Created/Modified:

1. **next.config.ts** - Added service worker cache headers
2. **app/layout.tsx** - Added PWA meta tags and service worker registration
3. **public/manifest.json** - Web app manifest with app metadata
4. **public/sw.js** - Service worker for offline support and caching
5. **public/offline.html** - Offline fallback page
6. **public/logo.svg** - Template SVG logo

## Installation Steps

### Step 1: Generate App Icons

The PWA requires icon files in multiple sizes. Choose one of these methods:

#### Option A: Using Online Tools (Easiest - Recommended)

1. Visit [Favicon Generator](https://realfavicongenerator.net/)
2. Click "Select a picture"
3. Upload a square image (PNG or SVG) at least 512x512px
   - Use the provided `logo.svg` as reference, or create your own with color #1976d2
4. Follow these settings in the generator:
   - Background color: #1976d2
   - Margin: 10-15%
   - Android: True (generates app icons)
   - iOS: True (apple touch icon)

5. Download the favicon package
6. Extract all PNG files to your `public/` folder
7. Make sure these files exist:
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `maskable-icon.png`
   - `apple-touch-icon.png`
   - `favicon.ico` or `favicon.png`

#### Option B: Using Sharp (Node.js - For Developers)

```bash
# Install dependencies
npm install sharp

# You'll need to create a script to convert your logo.svg to PNG files
# Example using sharp in a Node.js script
```

#### Option C: Manual Design

Design a square image:
- **Size**: 512x512 pixels minimum
- **Format**: PNG with transparency
- **Colors**: Use #1976d2 (primary blue) prominently
- **Style**: Simple, recognizable at small sizes

Then scale it down using any image editor:
- 192x192, 384x384, 512x512 (required)
- Plus: 72, 96, 128, 144, 152 (optional but recommended)

### Step 2: Verify Icon Files

Place these files in the `public/` folder:

```
public/
├── icon-72x72.png           (72x72)
├── icon-96x96.png           (96x96)
├── icon-128x128.png         (128x128)
├── icon-144x144.png         (144x144)
├── icon-152x152.png         (152x152)
├── icon-192x192.png         ✅ Required (192x192)
├── icon-384x384.png         (384x384)
├── icon-512x512.png         ✅ Required (512x512)
├── maskable-icon.png        (512x512, with safe zone)
├── apple-touch-icon.png     ✅ Required (180x180)
├── favicon.ico              (32x32 or 64x64)
├── favicon.svg              ✅ Created (scalable)
├── manifest.json            ✅ Created
└── sw.js                    ✅ Created
```

At minimum, you need:
- `icon-192x192.png`
- `icon-512x512.png`  
- `apple-touch-icon.png`

### Step 3: Test Locally

1. **Build and Start**:
   ```bash
   npm run build
   npm run start
   ```

2. **Open in Chrome**:
   - Go to http://localhost:3000 (works over HTTP for localhost)
   - Do NOT try http:// on non-localhost domains

3. **Check Service Worker** (DevTools):
   - Open Chrome DevTools (F12)
   - Go to **Application** tab
   - Check **Manifest** - Should show valid manifest file
   - Check **Service Workers** - Should show registered `/sw.js`

4. **Test Installation** (Chrome Desktop):
   - Click the address bar menu (⋮) → "Create shortcut"
   - Enable "Open as window"
   - Click "Create"
   - App should open as standalone

### Step 4: Deploy to HTTPS

**Important**: PWA features only work over HTTPS (except localhost).

For production:
1. Ensure your domain has a valid SSL/TLS certificate
2. Redirect all HTTP traffic to HTTPS
3. Update your deployment configuration

## Testing PWA Features

### On Android Chrome

1. **Open the Website**:
   - Visit your HTTPS domain (e.g., https://erms.example.com)

2. **Install the App**:
   - Tap the menu button (⋯)
   - Tap "Add to Home Screen"
   - Confirm app name and icon
   - App icon appears on home screen

3. **Verify Installation**:
   - Tap the icon to launch
   - Verify it opens in standalone mode (no address bar)
   - Test both Student and Teacher dashboards

### On Chrome Desktop/Laptop

1. **Check Installation Button**:
   - App install button should appear in address bar (if requirements met)
   - Or use: menu → "Install app"

2. **Lighthouse Audit**:
   - Open DevTools → Lighthouse
   - Run PWA audit
   - Should pass all checks

## Features Enabled

### ✅ Offline Support
- Service worker caches key assets
- Users can access previously visited pages offline
- Offline fallback page shown when needed

### ✅ App Installation
- "Add to Home Screen" button available on Android
- Manifest provides app metadata
- Custom app icons and splash screen

### ✅ Standalone Mode
- Installs without browser UI
- Full-screen experience
- Custom theme colors (#1976d2)

### ✅ Push Notifications
- Service worker configured for push notifications
- Can notify users of important messages

### ✅ App Shortcuts
- Quick access to "Student Dashboard"
- Quick access to "View Grades"
- Configure more in `manifest.json`

## Configuration Files

### manifest.json
Contains:
- App name and short name
- App description
- Start URL and scope
- Display mode (standalone)
- Theme and background colors
- Icon definitions
- Shortcuts for common pages

**Customize**:
```json
{
  "name": "Your App Name",
  "short_name": "Your Short Name",
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

### sw.js (Service Worker)
Implements:
- **Cache-First Strategy**: For JS, CSS, images (cached assets)
- **Network-First Strategy**: For HTML, API requests (fresh data)
- **Offline Fallback**: Shows offline page when no connection
- **Push Notification Handling**: For future notification features

**Customize**:
- Adjust cache names: `CACHE_NAME`
- Modify caching strategies per file type
- Add your API endpoints

### app/layout.tsx
Includes:
- PWA meta tags
- Service worker registration script
- Manifest link
- Theme colors for browser UI
- Apple iOS compatibility tags

## Troubleshooting

### Service Worker Not Registering

**Problem**: "Service Worker failed to register"

**Solution**:
1. Check browser console for errors
2. Ensure `/sw.js` is accessible (public folder)
3. Verify manifest.json is valid (DevTools → Application → Manifest)
4. Try hard refresh: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)

### No Install Prompt in Chrome

**Problem**: "Add to Home Screen" option doesn't appear

**Requirements Check**:
- ✅ Must be HTTPS (exceptions: localhost, 127.0.0.1)
- ✅ Manifest.json must be valid
- ✅ Service worker must be registered
- ✅ Icon files must exist and load
- ✅ App must have a service worker

**Solutions**:
1. Run Lighthouse audit: DevTools → Lighthouse → PWA
2. Check DevTools → Application → Manifest for errors
3. Verify all icon files exist in public folder
4. Clear browser cache and try again
5. Test on actual Android device (Chrome emulator may not show install prompt)

### Icons Not Loading

**Problem**: Icons appear as broken images

**Solution**:
1. Check file names match manifest.json exactly
2. Verify icon files are in `public/` folder
3. Ensure correct image format (PNG recommended)
4. Check file sizes and dimensions match manifest
5. Hard refresh cache: `Ctrl+Shift+R`

### App Not Going Offline

**Problem**: Offline functionality not working

**Solution**:
1. Verify service worker is registered
2. Check Service Worker → Cache Storage → erms-v* exists
3. Verify assets are being cached (network tab)
4. Check sw.js for errors in console
5. Test with DevTools → Network → Offline checkbox

## Security Considerations

1. **HTTPS Required**: PWA features disabled over HTTP (except localhost)
2. **Service Worker Scope**: Limited to `/` - controls all requests
3. **Cache Security**: Only caches public, safe content
4. **API Requests**: Network-first strategy ensures fresh authentication

## Performance Tips

1. **Optimize Icons**: Compress PNG files using tools like:
   - TinyPNG (https://tinypng.com/)
   - ImageOptim
   - SVGO for SVGs

2. **Cache Strategy**: Adjust cache policies in `sw.js` based on your needs:
   - Static assets: Cache-first
   - API: Network-first
   - HTML: Network-first with fallback

3. **Bundle Size**: Minimize what's cached to save user storage

## Next Steps

1. ✅ **Generate Icons** - Use favicon-generator.net or your own design
2. ✅ **Place Icon Files** - Add to `public/` folder
3. ✅ **Test Locally** - Run and verify in Chrome DevTools
4. ✅ **Deploy to HTTPS** - Enable PWA on production
5. ✅ **Test Installation** - Try "Add to Home Screen" on Android

## Support

For PWA-related questions:
- [PWA Documentation](https://developers.google.com/web/progressive-web-apps)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Manifest Spec](https://www.w3.org/TR/appmanifest/)

## Summary

Your ERMS system now supports PWA installation. Users visiting from Android Chrome can:

1. Tap menu → "Add to Home Screen"
2. See your custom app icon
3. App installs like a native mobile app
4. Opens in full-screen standalone mode
5. Works offline with cached content

No APK generation needed! The installation happens entirely through Chrome.
