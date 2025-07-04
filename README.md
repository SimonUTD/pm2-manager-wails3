# PM2 Manager - Desktop Application

[中文](./README_zh.md) | English

A modern desktop application for managing PM2 processes, built with Wails3 and native JavaScript. This application provides an intuitive interface to monitor, control, and manage your PM2 processes with advanced features.

## Features

- 🚀 **Process Management**: Add, edit, delete, and control PM2 processes
- 📊 **Real-time Monitoring**: Live process status, CPU, memory usage
- 🔧 **Advanced Configuration**: Set startup commands, working directories, auto-start options
- 📈 **System Metrics**: Overview of total processes, running, errored, and stopped processes
- 🔍 **Detailed Information**: View PID, user, full command, script path for each process
- 📝 **Process Logs**: Real-time log viewing with export capabilities
- ⚙️ **PM2 Version Detection**: Automatic PM2 installation status and version display
- 🎯 **Batch Operations**: Start, stop, restart all processes at once

## Prerequisites

- **PM2**: This application requires PM2 to be installed on your system
  ```bash
  npm install -g pm2
  ```
- **Go**: Version 1.19 or higher
- **Node.js**: For frontend dependencies

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd pm2-manager-wails3
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Build the application**:
   ```bash
   # Build frontend
   cd frontend && npm run build && cd ..

   # Build the desktop application
   go build -o pm2-manager .
   ```

4. **Run the application**:
   ```bash
   ./pm2-manager
   ```

## Development

### Development Mode
```bash
wails3 dev
```

### Manual Build Process
```bash
# Generate bindings
wails3 generate bindings

# Build frontend
cd frontend && npm run build && cd ..

# Build Go application
go build -o pm2-manager .
```

## Usage

### Main Interface

The application provides a clean, intuitive interface with the following sections:

1. **Header**: Displays PM2 version status in the top-right corner
2. **System Metrics**: Overview cards showing process statistics
3. **Process List**: Detailed table with all PM2 processes
4. **Action Buttons**: Quick access to common operations

### Managing Processes

#### Adding a New Process
1. Click the "添加进程" (Add Process) button
2. Fill in the process configuration:
   - **Process Name**: Unique identifier for your process
   - **Script Path**: Path to your application script
   - **Working Directory**: Optional working directory
   - **Arguments**: Command line arguments
   - **Instances**: Number of instances to run
   - **Auto Start**: Enable/disable automatic startup
3. Click "添加" (Add) to create the process

#### Editing an Existing Process
1. Click the "编辑" (Edit) button next to any process
2. Modify the configuration as needed
3. Click "更新" (Update) to apply changes

#### Process Operations
- **Start**: Start a stopped process
- **Stop**: Stop a running process
- **Restart**: Restart a process
- **Delete**: Remove a process from PM2
- **View Logs**: Open real-time log viewer

### Batch Operations
Use the header buttons to perform operations on all processes:
- **全部启动** (Start All): Start all stopped processes
- **全部停止** (Stop All): Stop all running processes
- **全部重启** (Restart All): Restart all processes

## Project Structure

```
pm2-manager-wails3/
├── frontend/                 # Frontend application
│   ├── dist/                # Built frontend files
│   ├── bindings/            # Auto-generated Wails bindings
│   ├── components/          # UI components (unused - native JS approach)
│   ├── index.html           # Main HTML file
│   ├── main.js              # Main JavaScript application
│   └── package.json         # Frontend dependencies
├── main.go                  # Application entry point
├── pm2service.go           # PM2 service implementation
├── go.mod                  # Go module dependencies
└── README.md               # This file
```

## Technical Details

### Architecture
- **Backend**: Go with Wails3 framework
- **Frontend**: Native JavaScript (no React/Vue dependencies)
- **Build System**: Vite for frontend bundling
- **PM2 Integration**: Direct command-line interface

### Key Components

#### Backend (`pm2service.go`)
- `PM2Service`: Main service struct
- `ProcessInfo`: Process data structure with extended fields
- `PM2VersionInfo`: PM2 installation status
- `ProcessConfig`: Configuration for adding/updating processes

#### Frontend (`main.js`)
- Native JavaScript implementation
- ES6 modules with Wails bindings
- Real-time data updates every 5 seconds
- Modal dialogs for process management

## API Reference

### Backend Methods
- `ListProcesses()`: Get all PM2 processes
- `GetMetrics()`: Get system metrics
- `GetPM2Version()`: Check PM2 installation
- `AddProcess(config)`: Add new process
- `UpdateProcess(id, config)`: Update existing process
- `DeleteProcess(id)`: Delete process
- `StartProcess(id)`: Start process
- `StopProcess(id)`: Stop process
- `RestartProcess(id)`: Restart process

## Troubleshooting

### Common Issues

1. **PM2 Not Found**
   - Ensure PM2 is installed globally: `npm install -g pm2`
   - Check PATH environment variable

2. **Build Errors**
   - Verify Go version (1.19+)
   - Run `go mod tidy` to resolve dependencies
   - Ensure frontend is built before Go build

3. **Frontend Not Loading**
   - Build frontend: `cd frontend && npm run build`
   - Check `frontend/dist/` directory exists

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Wails3](https://wails.io/) framework
- PM2 process manager integration
- Modern desktop application architecture
