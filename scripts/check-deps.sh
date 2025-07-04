#!/bin/bash

# PM2 Manager Dependency Check Script
# This script checks if all required dependencies are installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 PM2 Manager Dependency Check${NC}"
echo -e "${BLUE}================================${NC}"
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

# Check basic tools
echo "Checking basic tools..."

if command -v go &> /dev/null; then
    GO_VERSION=$(go version | cut -d' ' -f3)
    print_status "Go is installed: $GO_VERSION"
else
    print_error "Go is not installed"
    echo "  Install from: https://golang.org/dl/"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm is installed: v$NPM_VERSION"
else
    print_error "npm is not installed"
    echo "  Install Node.js from: https://nodejs.org/"
    exit 1
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    echo "  Install from: https://nodejs.org/"
    exit 1
fi

if command -v wails3 &> /dev/null; then
    WAILS_VERSION=$(wails3 version)
    print_status "Wails3 is installed: $WAILS_VERSION"
else
    print_warning "Wails3 is not installed"
    echo "  Install with: go install github.com/wailsapp/wails/v3/cmd/wails3@latest"
fi

# Check PM2
echo ""
echo "Checking PM2..."

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    print_status "PM2 is installed: v$PM2_VERSION"
else
    print_warning "PM2 is not installed"
    echo "  Install with: npm install -g pm2"
fi

# Platform-specific checks
echo ""
echo "Checking platform-specific dependencies..."

case "$(uname -s)" in
    Linux*)
        print_info "Platform: Linux"
        
        if command -v gcc &> /dev/null; then
            GCC_VERSION=$(gcc --version | head -n1)
            print_status "GCC is installed: $GCC_VERSION"
        else
            print_error "GCC is not installed"
            echo "  Install with: sudo apt-get install build-essential"
        fi
        
        if command -v pkg-config &> /dev/null; then
            print_status "pkg-config is installed"
        else
            print_error "pkg-config is not installed"
            echo "  Install with: sudo apt-get install pkg-config"
        fi
        
        if pkg-config --exists gtk+-3.0 2>/dev/null; then
            GTK_VERSION=$(pkg-config --modversion gtk+-3.0)
            print_status "GTK3 development libraries: v$GTK_VERSION"
        else
            print_error "GTK3 development libraries not found"
            echo "  Install with: sudo apt-get install libgtk-3-dev"
        fi
        
        if pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
            WEBKIT_VERSION=$(pkg-config --modversion webkit2gtk-4.1)
            print_status "WebKit2GTK development libraries: v$WEBKIT_VERSION"
        elif pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
            WEBKIT_VERSION=$(pkg-config --modversion webkit2gtk-4.0)
            print_status "WebKit2GTK development libraries: v$WEBKIT_VERSION"
        else
            print_error "WebKit2GTK development libraries not found"
            echo "  Install with: sudo apt-get install libwebkit2gtk-4.1-dev"
        fi
        ;;
        
    Darwin*)
        print_info "Platform: macOS"
        
        if xcode-select -p &> /dev/null; then
            XCODE_PATH=$(xcode-select -p)
            print_status "Xcode command line tools: $XCODE_PATH"
        else
            print_error "Xcode command line tools not found"
            echo "  Install with: xcode-select --install"
        fi
        
        if command -v lipo &> /dev/null; then
            print_status "lipo is available (for universal binaries)"
        else
            print_warning "lipo not found (needed for universal binaries)"
        fi
        ;;
        
    MINGW*|CYGWIN*|MSYS*)
        print_info "Platform: Windows"
        print_info "WebView2 Runtime should be pre-installed on Windows 10/11"
        
        if command -v go.exe &> /dev/null; then
            print_status "Go Windows executable found"
        fi
        ;;
        
    *)
        print_warning "Unknown platform: $(uname -s)"
        ;;
esac

# Check Go modules
echo ""
echo "Checking Go modules..."

if [ -f "go.mod" ]; then
    print_status "go.mod found"
    
    if go mod verify &> /dev/null; then
        print_status "Go modules verified"
    else
        print_warning "Go modules verification failed"
        echo "  Run: go mod tidy"
    fi
else
    print_error "go.mod not found"
    echo "  Make sure you're in the project root directory"
fi

# Check frontend dependencies
echo ""
echo "Checking frontend dependencies..."

if [ -f "frontend/package.json" ]; then
    print_status "frontend/package.json found"
    
    if [ -d "frontend/node_modules" ]; then
        print_status "Frontend dependencies installed"
    else
        print_warning "Frontend dependencies not installed"
        echo "  Run: cd frontend && npm install"
    fi
else
    print_error "frontend/package.json not found"
fi

# Summary
echo ""
echo -e "${BLUE}📋 Summary${NC}"
echo -e "${BLUE}==========${NC}"

if [ "$(uname -s)" = "Linux" ]; then
    if pkg-config --exists gtk+-3.0 && (pkg-config --exists webkit2gtk-4.1 || pkg-config --exists webkit2gtk-4.0); then
        print_status "All Linux dependencies are satisfied"
    else
        print_error "Some Linux dependencies are missing"
        echo ""
        echo "Install missing dependencies with:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev"
    fi
elif [ "$(uname -s)" = "Darwin" ]; then
    if xcode-select -p &> /dev/null; then
        print_status "All macOS dependencies are satisfied"
    else
        print_error "Xcode command line tools are missing"
        echo ""
        echo "Install with:"
        echo "  xcode-select --install"
    fi
else
    print_info "Windows platform detected - ensure WebView2 Runtime is installed"
fi

echo ""
if command -v pm2 &> /dev/null; then
    print_status "Ready to build PM2 Manager!"
else
    print_warning "Don't forget to install PM2: npm install -g pm2"
fi

echo ""
print_info "To check Wails3 dependencies:"
echo "  wails3 doctor"
echo ""
print_info "To build the application:"
echo "  ./scripts/build.sh"
echo "  # or directly: wails3 build"
echo ""
print_info "To run in development mode:"
echo "  wails3 dev"
echo ""
print_info "To package for distribution:"
echo "  wails3 package"
