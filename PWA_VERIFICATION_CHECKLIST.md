# PWA Verification Checklist

Complete this checklist to verify your PWA is working correctly.

## Development Setup

- [ ] Run `npm run build` successfully
- [ ] Run `npm run start` without errors
- [ ] App loads at http://localhost:3000
- [ ] No errors in browser console

## Service Worker

Check Chrome DevTools → **Application** → **Service Workers**

- [ ] Service Worker shows as "registered"
- [ ] Status shows "(running)"
- [ ] No error messages
- [ ] Scope is "/"

## Manifest

Check Chrome DevTools → **Application** → **Manifest**

- [ ] Manifest loads successfully
- [ ] All fields display correctly:
  - [ ] Name: "ERMS - Exam Records Management System"
  - [ ] Short name: "ERMS"
  - [ ] Start URL: "/"
  - [ ] Display: "standalone"
  - [ ] Theme color: "#1976d2"
  - [ ] Background color: "#ffffff"

## Icons

Check Chrome DevTools → **Application** → **Manifest** → Icons section

- [ ] At least 4 icons listed
- [ ] Icon preview shows (not broken)
- [ ] Icons have different size variants

In `public/` folder:

- [ ] `icon-192x192.png` exists
- [ ] `icon-512x512.png` exists
- [ ] `apple-touch-icon.png` exists
- [ ] `maskable-icon.png` exists (optional)
- [ ] `favicon.ico` or `favicon.svg` exists

## Cache Storage

Check Chrome DevTools → **Application** → **Cache Storage**

- [ ] "erms-v1" cache exists
- [ ] Cache contains assets (click to expand)
- [ ] Can see cached files like:
  - `/`
  - `/favicon.ico`
  - Icon files

## Meta Tags

Check page source (`Ctrl+U`) or DevTools → **Head** section

Look for these tags:

- [ ] `<meta name="theme-color" content="#1976d2">`
- [ ] `<meta name="mobile-web-app-capable" content="yes">`
- [ ] `<meta name="apple-mobile-web-app-capable" content="yes">`
- [ ] `<link rel="manifest" href="/manifest.json">`
- [ ] Service worker registration script present

## Lighthouse PWA Audit

In Chrome DevTools → **Lighthouse**:

1. Select **PWA** category
2. Click **Analyze page load**
3. Check results:

- [ ] Installable ✓
- [ ] PWA optimized ✓
- [ ] Apple touch icon ✓
- [ ] Maskable icon ✓
- [ ] Provides offline experience ✓
- [ ] Redirects HTTP to HTTPS ✓ (if applicable)
- [ ] Service worker ✓
- [ ] Web app manifest ✓
- [ ] Splash screen ✓
- [ ] Address bar matches brand color ✓

## Desktop Installation Test

1. Go to http://localhost:3000
2. Click menu (⋮) in Chrome address bar
3. Look for one of these:
   - [ ] "Create shortcut..." option appears
   - [ ] "Install app" option appears
   - [ ] Install button in address bar appears

4. Click to install
5. Confirm app name and icon
6. Check desktop for new shortcut:
   - [ ] Shortcut created
   - [ ] Icon shows correctly

## Android Testing (Actual Device or Emulator)

### Prerequisites
- Android device or Chrome emulator
- Chrome browser
- HTTPS connection (or localhost with USB forwarding)

### Installation Test

1. Open Chrome on Android
2. Navigate to your HTTPS URL or use port forwarding
3. Wait for page to load
4. Tap menu (⋮)
5. Look for:
   - [ ] "Add to Home Screen" option appears
   - [ ] (Or just a notification banner)

6. Tap "Add to Home Screen"
7. Confirm app name and icon
8. Tap "Add" or "Install"
9. Verify:
   - [ ] Icon appears on home screen
   - [ ] App name appears below icon
   - [ ] App launches when tapped

### Running App Test

1. Tap the installed app icon
2. Verify:
   - [ ] App opens in standalone mode (no address bar)
   - [ ] App title shows in status bar
   - [ ] Theme color matches (#1976d2)
   - [ ] Student Dashboard loads
   - [ ] Teacher Dashboard loads
   - [ ] Navigation works
   - [ ] Can access student grades
   - [ ] Can access teacher records

### Offline Test

1. App is open on Android
2. Enable Airplane Mode
3. Tap the "back" button or navigate in app
4. Verify:
   - [ ] Previously visited pages still load
   - [ ] Offline page shows for new pages
   - [ ] Can access cached resources
   - [ ] Error message is clear

## Functionality Test

- [ ] Student Dashboard accessible
- [ ] Teacher Dashboard accessible
- [ ] Can view grades
- [ ] Can view messages
- [ ] Can submit forms (when online)
- [ ] Theme colors applied
- [ ] Responsive on all screen sizes

## Performance

- [ ] App loads quickly (< 3 seconds on 3G)
- [ ] Cached content loads instantly
- [ ] No console errors
- [ ] Network tab shows efficient caching

## Browser Compatibility

Test in these browsers (Desktop):

- [ ] Chrome/Chromium - Install button works
- [ ] Edge - Install button works
- [ ] Firefox - No PWA install (OK, uses Add-on marketplace)
- [ ] Safari - No install prompt (OK for iOS use apple-touch-icon)

## Common Issues

If any checks fail, review:

| Issue | Solution |
|-------|----------|
| Service Worker not showing | Hard refresh (Ctrl+Shift+R), check console |
| Icons not loading | Verify file names match manifest.json |
| No install prompt | Ensure HTTPS, clear browser cache |
| Offline not working | Check Cache Storage, verify sw.js |
| Wrong theme colors | Verify theme-color meta tag |

## Final Sign-Off

When all checks pass:

- [ ] PWA is fully functional
- [ ] Ready for production deployment
- [ ] Users can install on Android
- [ ] All dashboards accessible
- [ ] Offline mode working
- [ ] Performance acceptable

---

**Last Verified**: [Date]
**Verified By**: [Your Name]
**Notes**: [Any issues or special configurations]
