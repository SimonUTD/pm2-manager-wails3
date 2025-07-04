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
APP_NAME="pm2-manager"
VERSION=${1:-"dev"}
BUILD_DIR="dist"
PLATFORMS=(
    "windows/amd64"
    "windows/arm64"
    "darwin/amd64"
    "darwin/arm64"
    "linux/amd64"
    "linux/arm64"
)

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
    
    print_status "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    print_info "Cleaning previous builds..."
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    print_status "Build directory cleaned"
}

# Install frontend dependencies
install_frontend_deps() {
    print_info "Installing frontend dependencies..."
    cd frontend
    npm ci
    cd ..
    print_status "Frontend dependencies installed"
}

# Build frontend
build_frontend() {
    print_info "Building frontend..."
    cd frontend
    npm run build
    cd ..
    print_status "Frontend built successfully"
}

# Build for specific platform
build_platform() {
    local platform=$1
    local goos=$(echo $platform | cut -d'/' -f1)
    local goarch=$(echo $platform | cut -d'/' -f2)
    local extension=""
    
    if [ "$goos" = "windows" ]; then
        extension=".exe"
    fi
    
    local output_name="${APP_NAME}-${goos}-${goarch}${extension}"
    local package_name="${APP_NAME}-${goos}-${goarch}"
    
    print_info "Building for $goos/$goarch..."
    
    # Set environment variables
    export GOOS=$goos
    export GOARCH=$goarch
    export CGO_ENABLED=1
    
    # Build flags
    local ldflags="-s -w"
    if [ "$goos" = "windows" ]; then
        ldflags="-H windowsgui -s -w"
    fi
    
    # Build the application
    if go build -ldflags="$ldflags" -o "$BUILD_DIR/$output_name" .; then
        print_status "Built $output_name"
        
        # Create package directory
        local package_dir="$BUILD_DIR/$package_name"
        mkdir -p "$package_dir"
        
        # Copy files
        cp "$BUILD_DIR/$output_name" "$package_dir/"
        cp README.md "$package_dir/"
        cp README_zh.md "$package_dir/"
        cp CHANGELOG.md "$package_dir/"
        
        # Create installation instructions
        if [ "$goos" = "windows" ]; then
            cat > "$package_dir/INSTALL.txt" << EOF
PM2 Manager Installation Instructions
====================================

1. Prerequisites:
   - Ensure Node.js is installed
   - Install PM2 globally: npm install -g pm2

2. Installation:
   - Extract this archive to your desired location
   - Double-click ${output_name} to run the application

3. Usage:
   - The application will automatically detect your PM2 installation
   - If PM2 is not found, install it using: npm install -g pm2

For more information, see README.md
EOF
        else
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
chmod +x ${output_name}
echo "✓ Made ${output_name} executable"

echo ""
echo "Installation complete! Run ./${output_name} to start the application"
EOF
            chmod +x "$package_dir/install.sh"
            chmod +x "$package_dir/$output_name"
        fi
        
        # Create archive
        cd "$BUILD_DIR"
        if [ "$goos" = "windows" ]; then
            if command -v zip &> /dev/null; then
                zip -r "${package_name}.zip" "$package_name/"
                print_status "Created ${package_name}.zip"
            else
                print_warning "zip command not found, skipping archive creation"
            fi
        else
            tar -czf "${package_name}.tar.gz" "$package_name/"
            print_status "Created ${package_name}.tar.gz"
        fi
        cd ..
        
    else
        print_error "Failed to build for $goos/$goarch"
        return 1
    fi
}

# Build all platforms
build_all_platforms() {
    print_info "Building for all platforms..."
    
    for platform in "${PLATFORMS[@]}"; do
        build_platform "$platform"
    done
    
    print_status "All platforms built successfully"
}

# Show build summary
show_summary() {
    echo ""
    echo -e "${BLUE}📦 Build Summary${NC}"
    echo -e "${BLUE}================${NC}"
    echo ""
    
    print_info "Build artifacts in $BUILD_DIR/:"
    ls -la "$BUILD_DIR"/ | grep -E '\.(zip|tar\.gz|exe)$' || echo "No archives found"
    
    echo ""
    print_info "Package directories:"
    ls -la "$BUILD_DIR"/ | grep '^d' | grep -v '^\.$' | grep -v '^\.\.$' || echo "No package directories found"
    
    echo ""
    print_status "Build completed successfully!"
    echo ""
    print_info "To test a build:"
    echo "  cd $BUILD_DIR/<platform-package>/"
    echo "  ./<executable-name>"
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
    clean_build
    install_frontend_deps
    build_frontend
    build_all_platforms
    show_summary
}

# Run main function
main "$@"
