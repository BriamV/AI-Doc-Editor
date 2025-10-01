# Desktop Architecture Documentation

This directory contains architectural documentation for the Electron-based desktop application, focusing on main process design, inter-process communication, and desktop-specific architectural decisions.

## Electron Architecture Overview

The AI Document Editor desktop application follows a classic Electron architecture with a main process managing the application lifecycle and a renderer process hosting the React application.

### Process Architecture

```
┌─────────────────────────────────────────────┐
│                Main Process                 │
│            (electron/index.cjs)             │
├─────────────────────────────────────────────┤
│  • Window Management                        │
│  • Application Lifecycle                    │
│  • System Tray Integration                  │
│  • Auto-Updater                            │
│  • HTTP Server (Production)                 │
│  • Single Instance Management               │
└─────────────────────────────────────────────┘
                        │
                        │ No IPC
                        │ (Direct HTTP)
                        ▼
┌─────────────────────────────────────────────┐
│              Renderer Process               │
│             (React 18 App)                  │
├─────────────────────────────────────────────┤
│  • React 18 + TypeScript                   │
│  • Zustand State Management                 │
│  • TailwindCSS Styling                      │
│  • Vite Development Server                  │
│  • Frontend Business Logic                  │
└─────────────────────────────────────────────┘
```

## Main Process Implementation

### Core Responsibilities

The main process (`electron/index.cjs`) handles:

1. **Application Lifecycle Management**
   - App initialization and ready state
   - Window creation and management
   - Graceful shutdown handling
   - Single instance enforcement

2. **Window Management**
   - Browser window creation with auto-hide menu bar
   - Window state management (maximize, show, hide)
   - Icon and branding integration
   - Development vs production window configuration

3. **System Integration**
   - System tray icon and context menu
   - Platform-specific behavior adaptation
   - Error handling and dialog management
   - Process monitoring and cleanup

4. **Development Support**
   - DevTools integration in development mode
   - Hot reload support with Vite dev server
   - Development environment detection

5. **Production Optimization**
   - Built-in HTTP server for static assets
   - Asset path resolution for packaged applications
   - Performance optimization for production builds

### Single Instance Architecture

```javascript
const instanceLock = app.requestSingleInstanceLock();

if (!instanceLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}
```

**Design Decisions:**

- **Single Instance Enforcement**: Prevents multiple app instances for better user experience
- **Focus Management**: Second instance attempts focus existing window
- **Resource Conservation**: Reduces memory and system resource usage

### Window Management Architecture

```javascript
function createWindow() {
  win = new BrowserWindow({
    autoHideMenuBar: true,
    show: false,
    icon: iconPath,
  });

  win.maximize();
  win.show();

  return win;
}
```

**Design Decisions:**

- **Auto-Hide Menu Bar**: Clean desktop application experience
- **Show False Initially**: Prevents flash during window creation
- **Immediate Maximize**: Provides full workspace on startup
- **Icon Integration**: Consistent branding across platforms

### System Tray Implementation

```javascript
const createTray = window => {
  const tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        win.maximize();
        window.show();
      },
    },
    {
      label: 'Exit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  return tray;
};
```

**Design Decisions:**

- **Persistent Tray Icon**: Always-available application access
- **Minimal Context Menu**: Essential actions only (Show/Exit)
- **Click Handler**: Single-click to restore window
- **Proper Exit Handling**: Clean application termination

## Communication Architecture

### No IPC Design

The application uses a simplified architecture without traditional Electron IPC:

```
Frontend (Renderer) ──HTTP──→ Backend API (FastAPI)
        │                           │
        │                           │
        └──HTTP (localhost)──→ Static Assets ←── Main Process Server
```

**Benefits:**

- **Simplified Architecture**: No complex IPC message handling
- **Web Compatibility**: Same codebase works in browser and desktop
- **Security**: Reduced attack surface by avoiding IPC channels
- **Development Efficiency**: Single communication pattern

### Asset Serving Strategy

**Development Mode:**

- Renderer connects to Vite dev server (port 5173)
- Hot module replacement and development features
- Direct asset serving from Vite

**Production Mode:**

- Built-in HTTP server serves static assets (port 51735)
- Optimized asset delivery
- Self-contained application package

## Error Handling Architecture

### Global Error Management

```javascript
process.on('uncaughtException', error => {
  dialog.showErrorBox('An error occurred', error.stack);
  process.exit(1);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

**Design Decisions:**

- **User-Friendly Error Dialogs**: Clear error communication
- **Graceful Degradation**: Proper cleanup before exit
- **Platform-Specific Behavior**: macOS dock behavior preservation
- **Development Debugging**: Full stack traces in development

## Security Architecture

### Security Model

The application implements security through:

1. **No Node.js in Renderer**: Renderer process runs standard web technologies
2. **HTTP-Only Communication**: No direct file system or Node.js API access
3. **Isolated Context**: Renderer operates in isolated browsing context
4. **Asset Control**: Static assets served through controlled HTTP server

### Security Configuration

```javascript
// No nodeIntegration or contextIsolation needed
// Renderer runs as standard web application
const win = new BrowserWindow({
  autoHideMenuBar: true,
  show: false,
  icon: iconPath,
  // Default security: nodeIntegration: false, contextIsolation: true
});
```

## Development vs Production Architecture

### Development Configuration

- **Server**: Vite dev server (external)
- **Port**: 5173 (standard Vite port)
- **DevTools**: Automatically opened
- **Hot Reload**: Full Vite hot module replacement
- **Icons**: Loaded from `/public/` directory

### Production Configuration

- **Server**: Built-in HTTP server (internal)
- **Port**: 51735 (custom port for packaged app)
- **DevTools**: Disabled for security
- **Assets**: Served from `/dist/` directory
- **Icons**: Loaded from packaged assets

## Performance Architecture

### Optimization Strategies

1. **Lazy Loading**: Window shown only after full initialization
2. **Asset Caching**: HTTP server with appropriate cache headers
3. **Memory Management**: Proper cleanup on window close
4. **Single Instance**: Prevents resource duplication

### Resource Management

```javascript
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

**Performance Benefits:**

- **Automatic Cleanup**: App quits when all windows closed (non-macOS)
- **Memory Efficiency**: Resources freed on application exit
- **System Integration**: Follows platform conventions

## Extensibility Architecture

### Future Enhancement Points

1. **IPC Integration**: Can add IPC channels for desktop-specific features
2. **Native Modules**: Support for platform-specific native functionality
3. **Menu Integration**: Custom application menus for enhanced UX
4. **Notification System**: Desktop notification integration
5. **File System Access**: Secure file system operations

### Plugin Architecture

The current design supports extension through:

- **HTTP API Integration**: Additional backend endpoints
- **Frontend Plugin System**: React component-based extensions
- **Configuration Management**: Runtime configuration updates
- **Theme System**: Desktop-specific theme integration

## Cross-Platform Considerations

### Platform Adaptations

```javascript
let iconPath = '';
if (isDev) {
  iconPath = path.join(__dirname, '../public/icon-rounded.png');
} else {
  iconPath = path.join(__dirname, '../dist/icon-rounded.png');
}
```

**Platform Support:**

- **Windows**: Standard Electron Windows support
- **macOS**: App store compliance ready
- **Linux**: Standard Linux desktop integration

### Icon and Asset Management

- **Format Support**: PNG icons for cross-platform compatibility
- **Size Variants**: Single high-resolution icon for all platforms
- **Asset Bundling**: Proper asset packaging for each platform

## Architecture Decision Records (ADRs)

### ADR-001: No IPC Communication Pattern

**Decision**: Use HTTP communication instead of IPC
**Rationale**: Simplified architecture, web compatibility, security benefits
**Status**: Accepted

### ADR-002: Single Window Application

**Decision**: Single maximized window with system tray
**Rationale**: Focused user experience, resource efficiency
**Status**: Accepted

### ADR-003: Built-in Production Server

**Decision**: HTTP server in main process for production
**Rationale**: Self-contained application, consistent asset serving
**Status**: Accepted

### ADR-004: Auto-Hide Menu Bar

**Decision**: Hide traditional menu bar by default
**Rationale**: Clean modern desktop application experience
**Status**: Accepted

## Troubleshooting and Debugging

### Common Architecture Issues

1. **Port Conflicts**: Production port 51735 conflicts
2. **Asset Loading**: Icon path resolution in different environments
3. **Window State**: Improper window show/hide sequencing
4. **Single Instance**: Instance lock conflicts during development

### Debugging Tools

- **DevTools**: Available in development mode
- **Console Logging**: Main process console output
- **Error Dialogs**: User-friendly error presentation
- **Process Monitoring**: System-level process observation

## Future Architecture Considerations

### Planned Enhancements

1. **Native Menu Integration**: Custom application menus
2. **File Association**: Document type associations
3. **Protocol Handlers**: Custom URL protocol support
4. **Background Processing**: Optional background operation mode
5. **Update UI**: Enhanced auto-updater user interface

### Scalability Considerations

- **Multi-Window Support**: Future support for multiple document windows
- **Workspace Management**: Session and workspace persistence
- **Plugin Architecture**: Third-party extension support
- **Performance Monitoring**: Application performance metrics

Last updated: 2025-09-22
