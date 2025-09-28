# Build and Distribution Documentation

This directory contains comprehensive documentation for building, packaging, and distributing the AI Document Editor desktop application across Windows, macOS, and Linux platforms.

## Build System Overview

The desktop application uses Electron Builder for cross-platform packaging and distribution, integrated with the existing Vite-based frontend build system.

### Build Architecture

```
Source Code (React + Electron)
        │
        ▼
Frontend Build (Vite) ──→ /dist/
        │
        ▼
Electron Packaging (electron-builder)
        │
        ├── Windows (NSIS, Squirrel)
        ├── macOS (DMG, ZIP)
        └── Linux (AppImage, DEB, RPM)
```

## Build Configuration

### Package.json Scripts

```json
{
  "electron": "electron .",
  "electron:pack": "electron-builder",
  "electron:make": "electron-builder --publish=never"
}
```

### Electron Builder Configuration

The application uses electron-builder with configuration embedded in package.json:

```json
{
  "main": "electron/index.cjs",
  "homepage": "./",
  "dependencies": {
    "electron": "^38.1.0",
    "electron-builder": "^26.0.12",
    "electron-builder-squirrel-windows": "^26.0.12"
  }
}
```

## Development Build Process

### Local Development

#### Setup and Dependencies

```bash
# Install dependencies
yarn install --frozen-lockfile

# Development mode (with Vite dev server)
yarn dev              # Starts frontend dev server
yarn electron         # Runs Electron with dev server
```

#### Development Workflow

1. **Frontend Development**: `yarn dev` starts Vite dev server on port 5173
2. **Electron Development**: `yarn electron` connects Electron to dev server
3. **Hot Reload**: Changes automatically reflected in Electron window
4. **DevTools**: Automatically opened for debugging

### Development Build Configuration

```javascript
// electron/index.cjs - Development detection
const isDev = require('electron-is-dev');
const PORT = isDev ? '5173' : '51735';

if (isDev) {
  win.webContents.openDevTools({ mode: 'detach' });
}

win.loadURL(`http://localhost:${PORT}`);
```

## Production Build Process

### Frontend Build

```bash
# Build React application for production
yarn fe:build          # Vite build → /dist/ directory
```

**Build Output:**

- **Location**: `/dist/` directory
- **Assets**: Optimized HTML, CSS, JavaScript, images
- **Bundling**: Vite optimization and tree-shaking
- **Minification**: Production-ready minified assets

### Electron Packaging

```bash
# Package for distribution (all platforms)
yarn electron:pack

# Build for specific platforms
yarn electron:make
```

### Production Server Integration

```javascript
// Built-in HTTP server for production
const createServer = () => {
  const server = http.createServer((request, response) => {
    let filePath =
      request.url === '/'
        ? path.join(__dirname, '../dist/index.html')
        : path.join(__dirname, `../dist/${request.url}`);

    // Serve static assets with proper MIME types
    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(404);
        response.end('File Not Found');
      } else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });
  });

  server.listen(PORT);
};
```

## Platform-Specific Builds

### Windows Build Process

#### Windows Prerequisites

```bash
# Windows-specific dependencies
npm install -g windows-build-tools  # Visual Studio Build Tools
```

#### Windows Build Configuration

```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "squirrel",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    }
  }
}
```

#### Windows Build Commands

```bash
# Windows-specific builds
yarn electron:pack --win
yarn electron:make --win

# Build with specific architecture
yarn electron:make --win --x64
yarn electron:make --win --ia32
```

#### Windows Output Formats

- **NSIS Installer**: Full-featured installer with custom options
- **Squirrel**: Auto-updater compatible format
- **Portable**: Standalone executable (future enhancement)

### macOS Build Process

#### macOS Prerequisites

```bash
# macOS-specific requirements
xcode-select --install     # Command Line Tools
```

#### macOS Build Configuration

```json
{
  "build": {
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "zip",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "build/icon.icns",
      "category": "public.app-category.productivity"
    }
  }
}
```

#### macOS Build Commands

```bash
# macOS-specific builds
yarn electron:pack --mac
yarn electron:make --mac

# Universal binary (Intel + Apple Silicon)
yarn electron:make --mac --universal
```

#### macOS Output Formats

- **DMG**: macOS disk image for distribution
- **ZIP**: Compressed application bundle
- **Universal Binary**: Intel and Apple Silicon support

### Linux Build Process

#### Linux Prerequisites

```bash
# Linux build dependencies
sudo apt-get install -y build-essential libnss3-dev libatk-bridge2.0-dev libdrm2 libxss1 libgconf-2-4 libxrandr2 libasound2-dev libpangocairo-1.0-0 libatk1.0-dev libgtk2.0-dev libgdk-pixbuf2.0-dev libgtk-3-dev libglib2.0-dev
```

#### Linux Build Configuration

```json
{
  "build": {
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        },
        {
          "target": "rpm",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.png",
      "category": "Office"
    }
  }
}
```

#### Linux Build Commands

```bash
# Linux-specific builds
yarn electron:pack --linux
yarn electron:make --linux

# Specific format builds
yarn electron:make --linux appimage
yarn electron:make --linux deb
yarn electron:make --linux rpm
```

#### Linux Output Formats

- **AppImage**: Universal Linux executable
- **DEB**: Debian/Ubuntu package format
- **RPM**: Red Hat/Fedora package format
- **Snap**: Snap package (future enhancement)
- **Flatpak**: Flatpak package (future enhancement)

## Code Signing and Security

### Windows Code Signing

#### Certificate Requirements

```bash
# Windows code signing certificate
# Required for Windows Defender trust and auto-updater
```

#### Signing Configuration

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "process.env.CERTIFICATE_PASSWORD",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

#### Signing Process

```bash
# Sign Windows builds
yarn electron:make --win --publish=never
```

### macOS Code Signing and Notarization

#### Certificate Requirements

```bash
# Apple Developer certificates required:
# - Developer ID Application
# - Developer ID Installer (for pkg)
```

#### Signing Configuration

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "notarize": {
        "teamId": "TEAM_ID"
      }
    }
  }
}
```

#### Notarization Process

```bash
# Build and notarize for macOS
yarn electron:make --mac --publish=always
```

### Linux Security

#### Package Signing

```bash
# GPG signing for Linux packages
gpg --detach-sign package.deb
gpg --detach-sign package.rpm
```

## Distribution Strategies

### Development Distribution

#### Local Testing

```bash
# Build and test locally
yarn fe:build
yarn electron:pack
```

#### Internal Distribution

- **Direct File Sharing**: Packaged applications via file sharing
- **Internal Repositories**: Private npm/package repositories
- **CI/CD Artifacts**: Build artifacts from CI/CD pipelines

### Production Distribution

#### Public Release Channels

- **GitHub Releases**: Public release distribution
- **Official Website**: Direct download links
- **Package Managers**: Platform-specific package managers

#### Auto-Update Distribution

```javascript
// Auto-updater configuration
const { autoUpdater } = require('electron-updater');
autoUpdater.checkForUpdatesAndNotify();
```

## CI/CD Integration

### GitHub Actions Build Pipeline

```yaml
# .github/workflows/build.yml (example)
name: Build Desktop Apps
on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install --frozen-lockfile
      - run: yarn fe:build
      - run: yarn electron:make --win

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install --frozen-lockfile
      - run: yarn fe:build
      - run: yarn electron:make --mac

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install --frozen-lockfile
      - run: yarn fe:build
      - run: yarn electron:make --linux
```

### Build Matrix Strategy

```yaml
strategy:
  matrix:
    os: [windows-latest, macos-latest, ubuntu-latest]
    arch: [x64, arm64]
    exclude:
      - os: windows-latest
        arch: arm64
      - os: ubuntu-latest
        arch: arm64
```

## Build Optimization

### Performance Optimization

#### Bundle Size Optimization

```bash
# Analyze bundle size
yarn build:analyze
```

#### Asset Optimization

- **Image Compression**: Optimized PNG/ICO icons
- **JavaScript Minification**: Vite build optimization
- **CSS Optimization**: TailwindCSS purging
- **Tree Shaking**: Unused code elimination

### Build Speed Optimization

#### Caching Strategies

```bash
# Use yarn cache for faster builds
yarn install --immutable --check-cache
```

#### Parallel Builds

```bash
# Build multiple platforms in parallel
yarn electron:make --parallel
```

## Troubleshooting

### Common Build Issues

#### Windows Issues

- **Visual Studio Build Tools**: Missing C++ compiler
- **Python Dependencies**: Native module compilation failures
- **Certificate Issues**: Code signing certificate problems

#### macOS Issues

- **Xcode Command Line Tools**: Missing development tools
- **Notarization Failures**: Apple notarization process issues
- **Architecture Conflicts**: Intel vs Apple Silicon build issues

#### Linux Issues

- **Missing Dependencies**: System library requirements
- **AppImage Issues**: FUSE filesystem requirements
- **Package Conflicts**: Distribution-specific package issues

### Build Debugging

#### Verbose Logging

```bash
# Enable detailed build logging
DEBUG=electron-builder yarn electron:make
```

#### Build Cache Clearing

```bash
# Clear build cache
yarn clean
rm -rf node_modules/.cache
yarn install --frozen-lockfile
```

## Version Management

### Semantic Versioning

```json
{
  "version": "1.0.0",
  "build": {
    "buildVersion": "1.0.0.${env.BUILD_NUMBER}"
  }
}
```

### Release Workflow

```bash
# Version bump and build
npm version patch
yarn fe:build
yarn electron:make --publish=always
```

## Quality Assurance

### Build Validation

#### Automated Testing

```bash
# Post-build testing
yarn e2e:fe:packaged
```

#### Manual Validation Checklist

- [ ] Application launches successfully
- [ ] All features function correctly
- [ ] Auto-updater operates properly
- [ ] Platform integration works as expected
- [ ] Performance meets requirements

### Security Validation

#### Code Signing Verification

```bash
# Verify Windows code signing
signtool verify /pa app.exe

# Verify macOS code signing
codesign --verify --verbose app.app

# Verify Linux package integrity
gpg --verify package.deb.sig package.deb
```

## Future Build Enhancements

### Planned Improvements

#### Enhanced CI/CD

- **Multi-platform builds**: Simultaneous platform builds
- **Automated testing**: Post-build automated validation
- **Security scanning**: Automated security vulnerability scanning
- **Performance monitoring**: Build performance metrics

#### Distribution Enhancements

- **Snap packages**: Ubuntu Snap store distribution
- **Flatpak packages**: Flathub distribution
- **Windows Store**: Microsoft Store distribution
- **Mac App Store**: Apple App Store distribution

#### Build Optimization

- **Incremental builds**: Faster development builds
- **Module federation**: Micro-frontend architecture
- **Progressive loading**: Lazy-loaded application modules

Last updated: 2025-09-22
