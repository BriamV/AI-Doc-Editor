# Platform Integration Documentation

This directory contains documentation for platform-specific features and integrations across Windows, macOS, and Linux desktop environments.

## Cross-Platform Architecture

The AI Document Editor desktop application is designed to provide consistent functionality across all major desktop platforms while respecting platform-specific conventions and user expectations.

### Supported Platforms

| Platform | Status | Features | Special Considerations |
|----------|--------|----------|----------------------|
| **Windows** | ✅ Full Support | System tray, auto-updater, Squirrel installer | Windows Defender integration |
| **macOS** | ✅ Full Support | Dock integration, app store ready | Code signing requirements |
| **Linux** | ✅ Full Support | Desktop integration, package managers | Multiple distro support |

## Platform Detection and Adaptation

### Runtime Platform Detection

```javascript
// Platform-specific behavior adaptation
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### Environment-Aware Asset Loading

```javascript
let iconPath = '';
if (isDev) {
  iconPath = path.join(__dirname, '../public/icon-rounded.png');
} else {
  iconPath = path.join(__dirname, '../dist/icon-rounded.png');
}
```

## Windows Integration

### Windows-Specific Features

#### System Tray Integration
- **Persistent Tray Icon**: Always visible in system notification area
- **Context Menu**: Right-click menu with Show/Exit options
- **Click Behavior**: Single-click to restore window
- **Icon Format**: PNG format optimized for Windows tray display

#### Squirrel Installer Support
```javascript
if (require('electron-squirrel-startup')) app.quit();
```
- **Auto-Update Integration**: Seamless updates via Squirrel
- **Installation Handling**: Proper installation lifecycle management
- **Uninstall Support**: Clean uninstallation process

#### Windows Defender Integration
- **Code Signing**: Certificates for Windows Defender whitelist
- **SmartScreen Compatibility**: Proper executable metadata
- **Antivirus Exclusions**: Guidance for enterprise deployments

### Windows Build Configuration

```json
{
  "electron:pack": "electron-builder",
  "electron:make": "electron-builder --publish=never"
}
```

**Windows-Specific Build Options:**
- **Target**: `nsis` installer format
- **Code Signing**: Authenticode certificate integration
- **Auto-Updater**: Windows-compatible update mechanism

### Windows Development Setup

#### Prerequisites
- **Node.js**: Version 18.16.0 or higher
- **Python**: For native module compilation
- **Visual Studio Build Tools**: C++ compiler support
- **Code Signing Certificate**: For production builds

#### Windows-Specific Testing
- **User Account Control (UAC)**: Installation privilege testing
- **Windows Versions**: Windows 10/11 compatibility validation
- **Antivirus Compatibility**: Multiple antivirus solution testing

## macOS Integration

### macOS-Specific Features

#### Dock Integration
```javascript
// macOS dock behavior preservation
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```
- **Dock Persistence**: App remains in dock when window closed
- **Dock Menu**: Custom dock menu integration (future enhancement)
- **Badge Integration**: Notification badge support (future enhancement)

#### App Store Compliance
- **Sandboxing**: Ready for App Store sandbox requirements
- **Entitlements**: Proper entitlement configuration
- **Review Guidelines**: Adherence to App Store review guidelines

#### Native macOS Features
- **Touch Bar Support**: Ready for Touch Bar integration
- **Dark Mode**: Automatic dark mode adaptation
- **Retina Support**: High-DPI display optimization

### macOS Build Configuration

**Code Signing:**
```bash
# Development signing
electron-builder --mac --publish=never

# Distribution signing (requires certificates)
electron-builder --mac --publish=always
```

**macOS-Specific Build Options:**
- **Target**: `dmg` and `zip` formats
- **Code Signing**: Apple Developer certificate integration
- **Notarization**: Apple notarization for Gatekeeper
- **Universal Binary**: Intel and Apple Silicon support

### macOS Development Setup

#### Prerequisites
- **Xcode Command Line Tools**: Required for native compilation
- **Apple Developer Account**: For code signing and distribution
- **macOS Version**: macOS 10.15 (Catalina) or higher
- **Certificates**: Developer ID Application certificate

#### macOS-Specific Testing
- **Gatekeeper**: Code signing and notarization validation
- **macOS Versions**: Compatibility across macOS versions
- **Apple Silicon**: Native Apple M1/M2 chip support

## Linux Integration

### Linux-Specific Features

#### Desktop Environment Integration
- **Desktop Files**: `.desktop` file generation for application launchers
- **Icon Themes**: Integration with system icon themes
- **Notification System**: Native Linux notification support
- **File Associations**: Document type association support

#### Package Manager Support
- **AppImage**: Universal Linux application format
- **Snap**: Ubuntu Snap package support
- **Flatpak**: Universal Linux app distribution
- **Traditional Packages**: `.deb` and `.rpm` package formats

#### Window Manager Compatibility
- **GNOME**: Full GNOME Shell integration
- **KDE**: KDE Plasma desktop compatibility
- **XFCE**: Lightweight desktop environment support
- **Other WMs**: Compatibility with alternative window managers

### Linux Build Configuration

```json
{
  "linux": {
    "target": [
      { "target": "AppImage", "arch": ["x64"] },
      { "target": "deb", "arch": ["x64"] },
      { "target": "rpm", "arch": ["x64"] }
    ]
  }
}
```

**Linux-Specific Build Options:**
- **AppImage**: Universal Linux executable
- **Debian Package**: `.deb` format for Debian/Ubuntu
- **RPM Package**: `.rpm` format for Red Hat/Fedora
- **Snap**: Snap package for universal Linux distribution

### Linux Development Setup

#### Prerequisites
- **Node.js**: Version 18.16.0 or higher
- **Build Tools**: `build-essential` package (Ubuntu/Debian)
- **Graphics Libraries**: X11 and OpenGL development libraries
- **Package Tools**: `fpm` for package generation

#### Linux Distribution Testing
- **Ubuntu**: LTS versions (20.04, 22.04)
- **Fedora**: Recent Fedora versions
- **Debian**: Stable Debian releases
- **Arch Linux**: Rolling release compatibility
- **SUSE**: openSUSE Leap and Tumbleweed

## Cross-Platform Asset Management

### Icon System

#### Platform-Specific Icon Requirements

| Platform | Format | Sizes | Location |
|----------|--------|-------|----------|
| Windows | PNG/ICO | 16x16 to 256x256 | System tray, taskbar, installer |
| macOS | PNG/ICNS | 16x16 to 1024x1024 | Dock, Finder, Touch Bar |
| Linux | PNG/SVG | 16x16 to 512x512 | Desktop files, window managers |

#### Icon Implementation
```javascript
const tray = new Tray(
  path.join(__dirname, isDev ? '../public/icon-rounded.png' : '../dist/icon-rounded.png')
);
```

**Cross-Platform Considerations:**
- **Unified Format**: PNG format for maximum compatibility
- **High DPI**: Retina/HiDPI display support
- **Size Variants**: Multiple size variants for different contexts

### Asset Bundling Strategy

#### Development Assets
- **Location**: `/public/` directory
- **Access**: Direct file system access
- **Hot Reload**: Automatic asset reloading

#### Production Assets
- **Location**: `/dist/` directory
- **Access**: HTTP server serving
- **Optimization**: Compressed and optimized assets

## Platform-Specific Configuration

### Environment Variables

```javascript
const isDev = require('electron-is-dev');
const PORT = isDev ? '5173' : '51735';
```

### Platform-Specific Settings

#### Windows Configuration
```javascript
// Windows-specific window configuration
const win = new BrowserWindow({
  autoHideMenuBar: true,
  show: false,
  icon: iconPath,
  // Windows-specific options
  titleBarStyle: 'default'
});
```

#### macOS Configuration
```javascript
// macOS-specific app configuration
if (process.platform === 'darwin') {
  app.dock.setIcon(iconPath);
}
```

#### Linux Configuration
```javascript
// Linux-specific desktop integration
if (process.platform === 'linux') {
  // Linux-specific configuration
}
```

## Security Considerations

### Platform-Specific Security

#### Windows Security
- **Code Signing**: Authenticode certificates for trust
- **Windows Defender**: Whitelist and exclusion management
- **UAC Integration**: Proper privilege escalation handling

#### macOS Security
- **Gatekeeper**: Code signing and notarization requirements
- **System Integrity Protection**: SIP compliance
- **Privacy Permissions**: Camera, microphone, file access permissions

#### Linux Security
- **AppArmor/SELinux**: Security framework compatibility
- **Flatpak Sandboxing**: Sandbox permission management
- **File Permissions**: Proper file system permission handling

## Testing Strategy

### Platform-Specific Testing

#### Automated Testing
```bash
# Platform-specific test commands
yarn test:e2e:windows
yarn test:e2e:macos
yarn test:e2e:linux
```

#### Manual Testing Checklist

**Windows Testing:**
- [ ] System tray icon display and functionality
- [ ] Windows 10/11 compatibility
- [ ] Installer behavior and UAC prompts
- [ ] Auto-updater functionality
- [ ] Antivirus compatibility

**macOS Testing:**
- [ ] Dock integration and behavior
- [ ] macOS version compatibility
- [ ] Code signing verification
- [ ] App Store compliance (if applicable)
- [ ] Retina display support

**Linux Testing:**
- [ ] Desktop environment integration
- [ ] Package manager installation
- [ ] File association functionality
- [ ] Distribution compatibility
- [ ] Wayland vs X11 compatibility

## Troubleshooting

### Common Platform Issues

#### Windows Issues
- **Antivirus False Positives**: Code signing mitigates detection
- **UAC Prompts**: Proper manifest configuration required
- **Path Length Limitations**: Long path support consideration

#### macOS Issues
- **Gatekeeper Blocking**: Notarization required for distribution
- **Permission Dialogs**: System permission requests
- **Quarantine Attributes**: Proper certificate signing needed

#### Linux Issues
- **Missing Dependencies**: System library requirements
- **Desktop Integration**: `.desktop` file installation
- **Permission Issues**: File system access permissions

### Support Channels

#### Platform-Specific Support
- **Windows**: Windows-specific documentation and forums
- **macOS**: Apple Developer documentation and support
- **Linux**: Distribution-specific package management guidance

## Future Platform Integration

### Planned Enhancements

#### Enhanced Windows Integration
- **Windows 11 Features**: Windows 11-specific API integration
- **Timeline Integration**: Windows Timeline activity integration
- **Cortana Integration**: Voice command support

#### Advanced macOS Features
- **Shortcuts App**: macOS Shortcuts automation support
- **Spotlight Integration**: Enhanced search integration
- **Touch Bar**: Touch Bar controls and shortcuts

#### Extended Linux Support
- **Wayland Protocol**: Native Wayland compositor support
- **Flatpak Portals**: Enhanced sandboxing and permissions
- **System Integration**: Deeper desktop environment integration

### Cross-Platform Future Features
- **Native Notifications**: Platform-native notification systems
- **File Associations**: Document type associations
- **Protocol Handlers**: Custom URL protocol support
- **Global Shortcuts**: System-wide keyboard shortcuts

Last updated: 2025-09-22