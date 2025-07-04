#!/bin/bash

# PM2 Manager Build Script
# This script builds the application for multiple platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="pm2-manager-wails3"
VERSION=${1:-"dev"}
BUILD_DIR="dist"

echo -e "${BLUE}🚀 PM2 Manager Build Script${NC}"
echo -e "${BLUE}=============================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    if ! command -v go &> /dev/null; then
        print_error "Go is not installed or not in PATH"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi

    if ! command -v wails3 &> /dev/null; then
        print_warning "Wails3 CLI not found, installing..."
        go install github.com/wailsapp/wails/v3/cmd/wails3@latest
        if ! command -v wails3 &> /dev/null; then
            print_error "Failed to install Wails3 CLI"
            exit 1
        fi
        print_status "Wails3 CLI installed"
    fi

    # Check platform-specific dependencies
    case "$(uname -s)" in
        Linux*)
            print_info "Checking Linux dependencies..."
            if ! pkg-config --exists gtk+-3.0; then
                print_error "GTK3 development libraries not found"
                print_error "Install with: sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev"
                exit 1
            fi
            if ! pkg-config --exists webkit2gtk-4.1; then
                print_error "WebKit2GTK development libraries not found"
                print_error "Install with: sudo apt-get install libwebkit2gtk-4.1-dev"
                exit 1
            fi
            ;;
        Darwin*)
            print_info "Checking macOS dependencies..."
            if ! xcode-select -p &> /dev/null; then
                print_error "Xcode command line tools not found"
                print_error "Install with: xcode-select --install"
                exit 1
            fi
            ;;
        MINGW*|CYGWIN*|MSYS*)
            print_info "Windows detected - WebView2 Runtime should be pre-installed"
            ;;
    esac

    print_status "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    print_info "Cleaning previous builds..."
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    print_status "Build directory cleaned"
}

# Check Wails3 dependencies
check_wails_deps() {
    print_info "Checking Wails3 dependencies..."
    wails3 doctor
    print_status "Wails3 dependencies check completed"
}

# Build using Wails3
build_wails() {
    print_info "Building application with Wails3..."

    if wails3 build; then
        print_status "Wails3 build completed successfully"
    else
        print_error "Wails3 build failed"
        return 1
    fi
}

# Package using Wails3
package_wails() {
    print_info "Packaging application with Wails3..."

    if wails3 package; then
        print_status "Wails3 packaging completed successfully"
    else
        print_error "Wails3 packaging failed"
        return 1
    fi
}

# Create distribution package
create_dist_package() {
    print_info "Creating distribution package..."

    local platform_name=""
    case "$(uname -s)" in
        Linux*)   platform_name="linux-amd64" ;;
        Darwin*)  platform_name="macos-universal" ;;
        MINGW*|CYGWIN*|MSYS*) platform_name="windows-amd64" ;;
        *) platform_name="unknown" ;;
    esac

    local package_dir="$BUILD_DIR/pm2-manager-$platform_name"
    mkdir -p "$package_dir"

    # Copy built application
    if [ -d "bin" ]; then
        cp -r bin/* "$package_dir/" 2>/dev/null || true
    fi

    # Copy documentation
    cp README.md "$package_dir/" 2>/dev/null || true
    cp README_zh.md "$package_dir/" 2>/dev/null || true
    cp CHANGELOG.md "$package_dir/" 2>/dev/null || true

    # Create installation instructions
    case "$(uname -s)" in
        MINGW*|CYGWIN*|MSYS*)
            cat > "$package_dir/INSTALL.txt" << 'EOF'
PM2 Manager Installation Instructions
====================================

1. Prerequisites:
   - Ensure Node.js is installed
   - Install PM2 globally: npm install -g pm2

2. Installation:
   - Extract this archive to your desired location
   - Double-click the .exe file to run the application

3. Usage:
   - The application will automatically detect your PM2 installation
   - If PM2 is not found, install it using: npm install -g pm2

For more information, see README.md
EOF
            ;;
        *)
            cat > "$package_dir/install.sh" << 'EOF'
#!/bin/bash
echo "PM2 Manager Installation"
echo "======================="
echo ""

# Check for PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚠ PM2 not found. Installing PM2..."
    if command -v npm &> /dev/null; then
        npm install -g pm2
        echo "✓ PM2 installed successfully"
    else
        echo "✗ npm not found. Please install Node.js and npm first"
        echo "  Then run: npm install -g pm2"
        exit 1
    fi
else
    echo "✓ PM2 is already installed"
fi

# Make executable
chmod +x pm2-manager* 2>/dev/null || chmod +x *.app/Contents/MacOS/* 2>/dev/null || true
echo "✓ Made application executable"

echo ""
echo "Installation complete! Run the application to start PM2 Manager"
EOF
            chmod +x "$package_dir/install.sh"
            ;;
    esac

    # Create archive
    cd "$BUILD_DIR"
    case "$(uname -s)" in
        MINGW*|CYGWIN*|MSYS*)
            if command -v powershell &> /dev/null; then
                powershell -command "Compress-Archive -Path 'pm2-manager-$platform_name' -DestinationPath 'pm2-manager-$platform_name.zip'"
                print_status "Created pm2-manager-$platform_name.zip"
            elif command -v zip &> /dev/null; then
                zip -r "pm2-manager-$platform_name.zip" "pm2-manager-$platform_name/"
                print_status "Created pm2-manager-$platform_name.zip"
            else
                print_warning "No zip utility found, skipping archive creation"
            fi
            ;;
        *)
            tar -czf "pm2-manager-$platform_name.tar.gz" "pm2-manager-$platform_name/"
            print_status "Created pm2-manager-$platform_name.tar.gz"
            ;;
    esac
    cd ..
}

# Show build summary
show_summary() {
    echo ""
    echo -e "${BLUE}📦 Build Summary${NC}"
    echo -e "${BLUE}================${NC}"
    echo ""

    print_info "Build artifacts in $BUILD_DIR/:"
    ls -la "$BUILD_DIR"/ 2>/dev/null || echo "No build directory found"

    echo ""
    print_info "Binary files in bin/:"
    ls -la bin/ 2>/dev/null || echo "No bin directory found"

    echo ""
    print_status "Build completed successfully!"
    echo ""
    print_info "To test the application:"
    echo "  wails3 dev"
    echo ""
    print_info "To create a release:"
    echo "  git tag v$VERSION"
    echo "  git push origin v$VERSION"
}

# Main execution
main() {
    echo -e "${BLUE}Building PM2 Manager v$VERSION${NC}"
    echo ""

    check_prerequisites
    check_wails_deps
    clean_build
    build_wails
    package_wails
    create_dist_package
    show_summary
}

# Run main function
main "$@"
