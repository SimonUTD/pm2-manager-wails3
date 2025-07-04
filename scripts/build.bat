@echo off
setlocal enabledelayedexpansion

REM PM2 Manager Build Script for Windows
REM This script builds the application for multiple platforms

echo.
echo ================================
echo PM2 Manager Build Script
echo ================================
echo.

REM Configuration
set APP_NAME=pm2-manager-wails3
set VERSION=%1
if "%VERSION%"=="" set VERSION=dev
set BUILD_DIR=dist

REM Check prerequisites
echo Checking prerequisites...

where go >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    exit /b 1
)

echo ✓ Prerequisites check passed

REM Clean previous builds
echo.
echo Cleaning previous builds...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"
echo ✓ Build directory cleaned

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
call npm ci
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
cd ..
echo ✓ Frontend dependencies installed

REM Build frontend
echo.
echo Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    exit /b 1
)
cd ..
echo ✓ Frontend built successfully

REM Build for Windows platforms
echo.
echo Building for Windows platforms...

REM Windows AMD64
echo Building for windows/amd64...
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=1
go build -ldflags="-H windowsgui -s -w" -o "%BUILD_DIR%\%APP_NAME%-windows-amd64.exe" .
if %errorlevel% neq 0 (
    echo ERROR: Failed to build for windows/amd64
    exit /b 1
)

REM Create Windows AMD64 package
mkdir "%BUILD_DIR%\%APP_NAME%-windows-amd64"
copy "%BUILD_DIR%\%APP_NAME%-windows-amd64.exe" "%BUILD_DIR%\%APP_NAME%-windows-amd64\"
copy "README.md" "%BUILD_DIR%\%APP_NAME%-windows-amd64\"
copy "README_zh.md" "%BUILD_DIR%\%APP_NAME%-windows-amd64\"
copy "CHANGELOG.md" "%BUILD_DIR%\%APP_NAME%-windows-amd64\"

REM Create installation instructions for Windows
echo PM2 Manager Installation Instructions > "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo ==================================== >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo. >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo 1. Prerequisites: >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo    - Ensure Node.js is installed >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo    - Install PM2 globally: npm install -g pm2 >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo. >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo 2. Installation: >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo    - Extract this archive to your desired location >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo    - Double-click %APP_NAME%-windows-amd64.exe to run >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo. >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo 3. Usage: >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo    - The application will detect your PM2 installation >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo    - If PM2 is not found, install it: npm install -g pm2 >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo. >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"
echo For more information, see README.md >> "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt"

echo ✓ Built %APP_NAME%-windows-amd64.exe

REM Windows ARM64
echo Building for windows/arm64...
set GOOS=windows
set GOARCH=arm64
set CGO_ENABLED=1
go build -ldflags="-H windowsgui -s -w" -o "%BUILD_DIR%\%APP_NAME%-windows-arm64.exe" .
if %errorlevel% neq 0 (
    echo ERROR: Failed to build for windows/arm64
    exit /b 1
)

REM Create Windows ARM64 package
mkdir "%BUILD_DIR%\%APP_NAME%-windows-arm64"
copy "%BUILD_DIR%\%APP_NAME%-windows-arm64.exe" "%BUILD_DIR%\%APP_NAME%-windows-arm64\"
copy "README.md" "%BUILD_DIR%\%APP_NAME%-windows-arm64\"
copy "README_zh.md" "%BUILD_DIR%\%APP_NAME%-windows-arm64\"
copy "CHANGELOG.md" "%BUILD_DIR%\%APP_NAME%-windows-arm64\"
copy "%BUILD_DIR%\%APP_NAME%-windows-amd64\INSTALL.txt" "%BUILD_DIR%\%APP_NAME%-windows-arm64\"

echo ✓ Built %APP_NAME%-windows-arm64.exe

REM Create ZIP archives if possible
echo.
echo Creating archives...

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -command "Compress-Archive -Path '%BUILD_DIR%\%APP_NAME%-windows-amd64' -DestinationPath '%BUILD_DIR%\%APP_NAME%-windows-amd64.zip' -Force"
    echo ✓ Created %APP_NAME%-windows-amd64.zip
    
    powershell -command "Compress-Archive -Path '%BUILD_DIR%\%APP_NAME%-windows-arm64' -DestinationPath '%BUILD_DIR%\%APP_NAME%-windows-arm64.zip' -Force"
    echo ✓ Created %APP_NAME%-windows-arm64.zip
) else (
    echo ⚠ PowerShell not available, skipping ZIP creation
)

REM Show summary
echo.
echo ================================
echo Build Summary
echo ================================
echo.
echo Build artifacts in %BUILD_DIR%:
dir "%BUILD_DIR%" /b

echo.
echo ✓ Build completed successfully!
echo.
echo To test a build:
echo   cd %BUILD_DIR%\^<platform-package^>
echo   ^<executable-name^>
echo.
echo To create a release:
echo   git tag v%VERSION%
echo   git push origin v%VERSION%
echo.

pause
