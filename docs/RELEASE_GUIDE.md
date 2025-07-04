# Release Guide

This document describes how to create releases for PM2 Manager.

## Automated Release Process

The project uses GitHub Actions for automated building and releasing across multiple platforms.

### Supported Platforms

- **Windows**: x64, ARM64
- **macOS**: Intel (x64), Apple Silicon (ARM64)  
- **Linux**: x64, ARM64

### Release Workflow

#### 1. Automatic Builds (CI)

Every push to `main`/`master` and pull requests trigger:
- Cross-platform build testing
- Code quality checks
- Frontend linting and security audit

#### 2. Release Creation

When you push a version tag (e.g., `v1.0.0`):
- Automatic builds for all platforms
- GitHub Release creation with changelog
- Binary artifacts upload
- Installation packages generation

### Creating a Release

#### Step 1: Prepare the Release

1. **Update CHANGELOG.md**:
   ```bash
   # Add new version section with changes
   vim CHANGELOG.md
   ```

2. **Update version in package.json** (if applicable):
   ```bash
   cd frontend
   npm version patch|minor|major
   cd ..
   ```

3. **Test locally**:
   ```bash
   # Run local build script
   ./scripts/build.sh 1.0.0
   
   # Test the built application
   cd dist/pm2-manager-<platform>
   ./pm2-manager  # or pm2-manager.exe on Windows
   ```

#### Step 2: Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to trigger release workflow
git push origin v1.0.0
```

#### Step 3: Monitor Release Process

1. Go to **Actions** tab in GitHub repository
2. Watch the "Release" workflow progress
3. Check for any build failures

#### Step 4: Verify Release

1. Go to **Releases** tab in GitHub repository
2. Verify all platform binaries are uploaded
3. Test download and installation on different platforms

## Manual Release Process

If you need to create a release manually:

### Local Building

#### Using Build Scripts

**Linux/macOS**:
```bash
./scripts/build.sh 1.0.0
```

**Windows**:
```cmd
scripts\build.bat 1.0.0
```

#### Manual Building

1. **Build frontend**:
   ```bash
   cd frontend
   npm ci
   npm run build
   cd ..
   ```

2. **Build for specific platform**:
   ```bash
   # Windows
   GOOS=windows GOARCH=amd64 go build -ldflags="-H windowsgui -s -w" -o pm2-manager-windows-amd64.exe .
   
   # macOS
   GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o pm2-manager-macos-amd64 .
   
   # Linux
   GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o pm2-manager-linux-amd64 .
   ```

3. **Create packages**:
   ```bash
   # Create package directories
   mkdir -p dist/pm2-manager-<platform>
   
   # Copy files
   cp pm2-manager-<platform> dist/pm2-manager-<platform>/
   cp README.md README_zh.md CHANGELOG.md dist/pm2-manager-<platform>/
   
   # Create archives
   tar -czf pm2-manager-<platform>.tar.gz dist/pm2-manager-<platform>/
   ```

### Manual GitHub Release

1. **Create Release on GitHub**:
   - Go to repository → Releases → "Create a new release"
   - Choose tag: `v1.0.0`
   - Release title: `PM2 Manager v1.0.0`
   - Description: Copy from CHANGELOG.md

2. **Upload Assets**:
   - Drag and drop all platform archives
   - Ensure naming convention: `pm2-manager-<platform>-<arch>.<ext>`

## Release Checklist

### Pre-Release
- [ ] Update CHANGELOG.md with new version
- [ ] Test application locally
- [ ] Verify all features work correctly
- [ ] Check PM2 integration
- [ ] Test on different platforms (if possible)
- [ ] Update documentation if needed

### Release
- [ ] Create and push version tag
- [ ] Monitor GitHub Actions workflow
- [ ] Verify all platform builds succeed
- [ ] Check release assets are uploaded

### Post-Release
- [ ] Test download and installation from GitHub
- [ ] Update project documentation
- [ ] Announce release (if applicable)
- [ ] Monitor for issues and bug reports

## Troubleshooting

### Build Failures

**Frontend build fails**:
- Check Node.js version compatibility
- Verify npm dependencies
- Check for syntax errors in JavaScript

**Go build fails**:
- Verify Go version (1.21+)
- Check for missing dependencies: `go mod tidy`
- Ensure CGO is properly configured for cross-compilation

**GitHub Actions fails**:
- Check workflow logs in Actions tab
- Verify secrets are properly configured
- Check for platform-specific issues

### Common Issues

1. **Missing dependencies on Linux**:
   ```bash
   sudo apt-get install build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev
   ```

2. **Missing dependencies on macOS**:
   ```bash
   xcode-select --install
   ```

3. **Missing dependencies on Windows**:
   - Ensure WebView2 Runtime is installed (usually pre-installed on Windows 10/11)

2. **Cross-compilation issues**:
   - Ensure CGO_ENABLED=1 for GUI applications
   - Install platform-specific toolchains if needed

3. **Permission issues**:
   ```bash
   chmod +x scripts/build.sh
   chmod +x pm2-manager
   ```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Examples
- `v1.0.0`: Initial stable release
- `v1.1.0`: Added new process management features
- `v1.1.1`: Fixed process deletion bug
- `v2.0.0`: Major UI redesign (breaking changes)

## Release Notes Template

```markdown
## PM2 Manager v1.0.0

### 🎉 New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Bug fix 1
- Bug fix 2

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 📦 Installation
Download the appropriate package for your system and follow the installation instructions.

### 🖥️ Supported Platforms
- Windows (x64, ARM64)
- macOS (Intel, Apple Silicon)
- Linux (x64, ARM64)
```
