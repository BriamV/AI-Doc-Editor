# Desktop Implementation Documentation

This directory contains implementation-specific documentation for the AI Document Editor desktop application, built with Electron and integrated with the React 18 frontend.

## Desktop Application Overview

The AI Document Editor desktop application provides a native desktop experience for the web-based React application using Electron. The implementation focuses on seamless integration between the web technologies and desktop-specific features.

### Key Features

- **Single Window Application**: Maximized window with auto-hide menu bar
- **System Tray Integration**: Persistent tray icon with context menu
- **Auto-Updater**: Automatic application updates via electron-updater
- **Single Instance Lock**: Prevents multiple application instances
- **Cross-Platform Support**: Windows, macOS, and Linux compatibility
- **Development/Production Modes**: Adaptive behavior based on environment

## Documentation Structure

### 📁 `architecture/`

- Electron main process architecture and design decisions
- Inter-process communication (IPC) patterns
- Security model and sandboxing configuration
- Performance optimization strategies

### 📁 `platform-integration/`

- Windows-specific features and integrations
- macOS native functionality and app store compliance
- Linux desktop environment integrations
- Cross-platform compatibility guidelines

### 📁 `build-distribution/`

- Electron-builder configuration and build processes
- Packaging strategies for different platforms
- Code signing and certificate management
- Distribution mechanisms and release workflows

### 📁 `security/`

- Desktop security model and best practices
- Electron security guidelines implementation
- Context isolation and preload scripts
- Permission management and sandbox configuration

### 📁 `auto-updater/`

- Auto-update configuration and implementation
- Update channels and distribution strategies
- Rollback mechanisms and error handling
- User experience and notification patterns

## Technical Implementation

### Electron Architecture

- **Main Process**: `electron/index.cjs` (3,943 bytes)
- **Renderer Process**: React 18 application (`src/`)
- **No Preload Scripts**: Direct renderer communication
- **HTTP Server**: Built-in static file server for production

### Core Dependencies

```json
{
  "electron": "^38.1.0",
  "electron-builder": "^26.0.12",
  "electron-is-dev": "^2.0.0",
  "electron-squirrel-startup": "^1.0.0",
  "electron-updater": "^6.6.8"
}
```

### Build Configuration

- **Main Entry**: `electron/index.cjs`
- **Build Commands**:
  - `yarn electron` - Run in development
  - `yarn electron:pack` - Package for distribution
  - `yarn electron:make` - Build for production
- **Target Platforms**: Windows, macOS, Linux

## Main Process Implementation

### Window Management

- **Auto-Hide Menu Bar**: Clean desktop experience
- **Maximized Window**: Full-screen workspace by default
- **Show/Hide Logic**: Proper window state management
- **Icon Integration**: Rounded icon for branding consistency

### System Tray Features

- **Persistent Tray**: Always-available system tray icon
- **Context Menu**: Show and Exit options
- **Click Handlers**: Single-click to restore window
- **Tooltip**: "Better ChatGPT" branding

### Development vs Production

- **Dev Server**: Connects to Vite dev server on port 5173
- **Production Server**: Built-in HTTP server on port 51735
- **DevTools**: Automatically opened in development mode
- **Icon Paths**: Adaptive icon loading based on environment

## Quick Navigation

### Development Setup

- **Environment**: See [/docs/setup/](../../../docs/setup/) for Electron prerequisites
- **Development Mode**: `yarn electron` to run desktop app in development
- **Building**: `yarn electron:pack` for distribution packages

### Implementation Guides

- **Main Process**: See `architecture/` for Electron main process patterns
- **Platform Features**: See `platform-integration/` for OS-specific functionality
- **Build Process**: See `build-distribution/` for packaging and distribution
- **Security**: See `security/` for desktop security implementation

### Integration Points

- **Frontend Integration**: See [../components/](../components/) for React component usage
- **State Management**: See [../state/](../state/) for Zustand store integration
- **API Communication**: See [../api/](../api/) for backend integration
- **Testing**: See [../testing/](../testing/) for desktop-specific testing

## Cross-References

### Frontend Integration

- **React Application**: [/src/docs/](../)
- **Component Architecture**: [/src/docs/components/](../components/)
- **State Management**: [/src/docs/state/](../state/)
- **API Layer**: [/src/docs/api/](../api/)

### Backend Integration

- **Backend API**: [/backend/docs/](../../../backend/docs/)
- **Authentication**: [/backend/docs/auth/](../../../backend/docs/auth/)
- **Database**: [/backend/docs/database/](../../../backend/docs/database/)

### Strategic Documentation

- **Architecture**: [/docs/architecture/](../../../docs/architecture/)
- **Security Strategy**: [/docs/security/](../../../docs/security/)
- **Project Management**: [/docs/project-management/](../../../docs/project-management/)

### Development Workflow

- **Claude Commands**: [/.claude/commands/](../../../.claude/commands/)
- **Quality Gates**: [/.claude/hooks.json](../../../.claude/hooks.json)
- **Scripts**: [/scripts/](../../../scripts/)

## Desktop-Specific Features

### Single Instance Management

- **Instance Lock**: Prevents multiple app instances
- **Second Instance Handling**: Focus existing window on second launch
- **Command Line Integration**: Proper command line argument handling

### Error Handling

- **Uncaught Exceptions**: Global error dialog and graceful exit
- **Process Management**: Proper cleanup on app termination
- **Logging**: Desktop-specific error logging

### Auto-Update Integration

- **Update Checks**: Automatic update checking on startup
- **Background Updates**: Non-intrusive update downloads
- **User Notifications**: Update availability notifications

## Development Guidelines

### File Organization

- **Main Process Code**: `/electron/index.cjs`
- **Desktop Documentation**: `/src/docs/desktop/`
- **Build Configuration**: `package.json` scripts section
- **Icons and Assets**: `/public/` directory

### Best Practices

1. **Security First**: Follow Electron security best practices
2. **Cross-Platform**: Test on Windows, macOS, and Linux
3. **User Experience**: Maintain consistent UX patterns
4. **Performance**: Optimize for desktop-specific performance patterns
5. **Integration**: Seamless integration with web application

### Quality Assurance

- **Desktop Testing**: Platform-specific testing procedures
- **Integration Testing**: Web-to-desktop feature testing
- **Performance Testing**: Desktop application performance metrics
- **Security Testing**: Desktop security validation

## Key Statistics

- **Main Process**: 1 file (3,943 bytes)
- **Dependencies**: 5 Electron-specific packages
- **Platforms**: 3 supported platforms (Windows, macOS, Linux)
- **Build Targets**: 2 build commands (pack/make)
- **Ports**: 2 server ports (dev: 5173, prod: 51735)

## Maintenance

This documentation is maintained by:

- **Desktop developers** for Electron implementation details
- **Frontend team** for React-Electron integration
- **DevOps team** for build and distribution processes
- **Security team** for desktop security guidelines

Last updated: 2025-09-22
