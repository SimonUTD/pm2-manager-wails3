# Changelog

All notable changes to PM2 Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions for automated cross-platform builds
- Automated release workflow
- CI/CD pipeline for testing

## [1.0.0] - 2024-01-XX

### Added
- 🚀 **Process Management**: Complete PM2 process lifecycle management
  - Add new processes with custom configuration
  - Edit existing process settings
  - Delete processes with confirmation dialog
  - Start, stop, restart individual processes
  - Batch operations for all processes

- 📊 **Real-time Monitoring**: Live system monitoring
  - Real-time process status updates (every 5 seconds)
  - CPU and memory usage tracking
  - Process uptime and runtime display
  - System metrics overview

- 🔧 **Advanced Configuration**: Comprehensive process setup
  - Process name and script path configuration
  - Working directory specification
  - Command line arguments support
  - Instance count configuration
  - Auto-start on boot settings

- 📈 **System Metrics**: Dashboard overview
  - Total processes count
  - Running processes indicator
  - Errored processes tracking
  - Stopped processes count

- 🔍 **Detailed Information**: Extended process details
  - Process ID (PM2 ID) display
  - System PID showing
  - Process owner/user information
  - Full command line display
  - Script path information
  - Auto-start status indicator

- 📝 **Process Logs**: Log management features
  - Real-time log viewing
  - Log export functionality
  - Copy logs to clipboard
  - Modal log viewer with search

- ⚙️ **PM2 Version Detection**: System integration
  - Automatic PM2 installation detection
  - Version information display
  - Installation reminder for missing PM2
  - Status indicator in top-right corner

- 🎯 **Batch Operations**: Bulk process management
  - Start all processes at once
  - Stop all processes with confirmation
  - Restart all processes
  - Selective process operations

- 🖥️ **Cross-platform Support**: Multi-OS compatibility
  - Windows (x64, ARM64)
  - macOS (Intel, Apple Silicon)
  - Linux (x64, ARM64)

- 🎨 **Modern UI**: Clean and intuitive interface
  - Responsive design
  - Native JavaScript implementation
  - Modal dialogs for process management
  - Status indicators and progress feedback
  - Error handling and user notifications

### Technical Features
- **Backend**: Go with Wails3 framework
- **Frontend**: Native JavaScript (no React/Vue dependencies)
- **Build System**: Vite for frontend bundling
- **PM2 Integration**: Direct command-line interface
- **Real-time Updates**: Automatic data refresh
- **Error Handling**: Comprehensive error management
- **Cross-platform**: Native builds for all major platforms

### Security
- Input validation for all process configurations
- Safe PM2 command execution
- Error boundary protection
- Secure file operations

### Performance
- Efficient real-time updates
- Minimal resource usage
- Fast startup time
- Responsive UI interactions

## [0.1.0] - Initial Development

### Added
- Basic project structure
- Initial Wails3 setup
- Basic PM2 integration
- Simple process listing

---

## Release Notes

### How to Update
1. Download the latest release for your platform
2. Replace the old executable with the new one
3. Restart the application

### Breaking Changes
- None in this release

### Migration Guide
- No migration required for this initial release

### Known Issues
- None currently reported

### Upcoming Features
- Process grouping and filtering
- Custom themes and UI customization
- Process performance graphs
- Export/import process configurations
- Process templates and presets
- Advanced log filtering and search
- Process dependency management
- Notification system for process events

---

For more information about releases, visit the [GitHub Releases](https://github.com/your-username/pm2-manager-wails3/releases) page.
