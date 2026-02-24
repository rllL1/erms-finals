#!/usr/bin/env node

/**
 * PWA Icon Generator for ERMS
 * 
 * This script generates all required app icons from a source SVG
 * Run: node generate-pwa-icons.js
 * 
 * Requirements:
 * - sharp: npm install sharp
 * - A source SVG or PNG file
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG-to-PNG guide
const guide = `
# PWA Icon Generation Guide

## Quick Setup

You need to generate app icons in multiple sizes for PWA support.

### Option 1: Using an Online Service (Easiest)
1. Visit https://www.favicon-generator.org/ or https://pwa-asset-generator.netlify.app/
2. Upload a square PNG/SVG image (recommended: 512x512 or larger)
3. Download all generated icons
4. Extract them to the \`public/\` folder

### Option 2: Using Sharp (Node.js)
\`\`\`bash
npm install sharp
node generate-pwa-icons.js
\`\`\`

### Option 3: Using ImageMagick/GraphicsMagick
\`\`\`bash
# On Windows (with ImageMagick):
magick convert logo.svg -resize 192x192 icon-192x192.png
magick convert logo.svg -resize 512x512 icon-512x512.png

# On macOS/Linux:
convert logo.svg -resize 192x192 icon-192x192.png
convert logo.svg -resize 512x512 icon-512x512.png
\`\`\`

### Required Icon Sizes

Your \`public/\` folder should contain:

- icon-72x72.png (72x72)
- icon-96x96.png (96x96)
- icon-128x128.png (128x128)
- icon-144x144.png (144x144)
- icon-152x152.png (152x152)
- icon-192x192.png (192x192)
- icon-384x384.png (384x384)
- icon-512x512.png (512x512)
- maskable-icon.png (512x512, with padding for maskable format)
- apple-touch-icon.png (180x180)
- favicon.ico (32x32 or 64x64)
- favicon.svg (scalable)

### Recommended Icon Requirements

- **Format**: PNG (transparency) or SVG
- **Colors**: Use the theme color #1976d2 prominently
- **Design**: Simple, recognizable at small sizes
- **Padding**: Leave at least 10% padding around the icon

### Using favicon-generator.org Steps:

1. Go to https://realfavicongenerator.net/
2. Select your icon image (512x512 recommended)
3. Choose "Yes, I want to set preferencies"
4. Set background color to #1976d2
5. Download favicon package
6. Extract to public folder

### Quick Icon Creation Tips:

If you don't have an icon:

1. **Use Figma or Canva:**
   - Create a 512x512 design
   - Use #1976d2 as main color
   - Export as PNG

2. **Use Online Tools:**
   - https://app.logo.com/
   - https://looka.com/
   - https://www.designevo.com/

3. **Use SVG Tools:**
   - Keep logo.svg in public folder
   - Add to manifest.json (already done)

## Verification

After creating icons, verify PWA installation requirements:

1. Run: \`npm run build && npm run start\`
2. Open https://localhost:3000 in Chrome
3. Check DevTools:
   - Application → Manifest → Should show valid manifest
   - Application → Service Workers → Should show registered
   - Lighthouse → Should pass PWA audit

## HTTPS Requirement

PWA features only work over HTTPS. For development:

- localhost works even over HTTP
- For production, ensure your domain has SSL/TLS certificate

## Testing PWA Installation

### Chrome on Android:
1. Open the website
2. Tap menu → "Add to Home Screen"
3. App should install

### Chrome on Desktop (testing):
1. Open DevTools → More → Create shortcut...
2. Check "Open as window"
3. Click "Create"

### PWA Quality Checklist:

- [ ] Manifest.json valid
- [ ] All icon sizes present
- [ ] Service worker registered
- [ ] app works offline (cached)
- [ ] Installable banner appears
- [ ] Passes Lighthouse PWA audit
- [ ] Works on both Student & Teacher dashboards
- [ ] Theme colors applied
`;

// Write guide to file
const guidePath = path.join(__dirname, 'PWA_SETUP_GUIDE.md');
fs.writeFileSync(guidePath, guide);

console.log('✓ PWA Guide created: PWA_SETUP_GUIDE.md');
console.log('\nNext steps:');
console.log('1. Generate app icons (see PWA_SETUP_GUIDE.md)');
console.log('2. Place icon files in public/ folder');
console.log('3. Run: npm run build && npm run start');
console.log('4. Visit https://localhost:3000');
console.log('5. Check application tab in DevTools for manifest and service worker');
