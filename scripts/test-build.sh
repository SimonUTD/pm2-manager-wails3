#!/bin/bash

set -e

echo "=== PM2 Manager Build Test ==="

# Check prerequisites
echo "Checking prerequisites..."
go version
node --version
npm --version

# Check if wails3 is installed
if ! command -v wails3 &> /dev/null; then
    echo "Installing Wails3..."
    go install github.com/wailsapp/wails/v3/cmd/wails3@latest
fi

wails3 version

# Check if task is installed
if ! command -v task &> /dev/null; then
    echo "Task is not installed. Please install it first."
    echo "Visit: https://taskfile.dev/installation/"
    exit 1
fi

task --version

echo "Running Wails3 doctor..."
wails3 doctor

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Generating bindings..."
wails3 task common:generate:bindings

echo "Building frontend..."
wails3 task common:build:frontend

echo "Building application..."
wails3 task build

echo "Listing bin directory:"
ls -la bin/

echo "=== Build test completed ==="
