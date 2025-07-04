# PM2 管理器 - 桌面应用程序

中文 | [English](./README.md)

一个现代化的桌面应用程序，用于管理 PM2 进程，基于 Wails3 和原生 JavaScript 构建。该应用程序提供直观的界面来监控、控制和管理您的 PM2 进程，具有高级功能。

## 功能特性

- 🚀 **进程管理**: 添加、编辑、删除和控制 PM2 进程
- 📊 **实时监控**: 实时进程状态、CPU、内存使用情况
- 🔧 **高级配置**: 设置启动命令、工作目录、自启动选项
- 📈 **系统指标**: 总进程数、运行中、错误和停止进程的概览
- 🔍 **详细信息**: 查看每个进程的 PID、用户、完整命令、脚本路径
- 📝 **进程日志**: 实时日志查看和导出功能
- ⚙️ **PM2 版本检测**: 自动检测 PM2 安装状态和版本显示
- 🎯 **批量操作**: 一键启动、停止、重启所有进程

## 系统要求

- **PM2**: 此应用程序需要在系统上安装 PM2
  ```bash
  npm install -g pm2
  ```
- **Go**: 版本 1.21 或更高
- **Node.js**: 用于前端依赖

### 平台特定要求

#### Linux
- 标准 GCC 构建工具
- GTK3 开发库
- WebKit2GTK 开发库
```bash
sudo apt-get install build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev
```

#### macOS
- Xcode 命令行工具
```bash
xcode-select --install
```

#### Windows
- WebView2 Runtime（Windows 10/11 通常预装）

## 安装和设置

1. **克隆仓库**:
   ```bash
   git clone <repository-url>
   cd pm2-manager-wails3
   ```

2. **安装前端依赖**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **构建应用程序**:
   ```bash
   # 构建前端
   cd frontend && npm run build && cd ..
   
   # 构建桌面应用程序
   go build -o pm2-manager .
   ```

4. **运行应用程序**:
   ```bash
   ./pm2-manager
   ```

## 开发

### 开发模式
```bash
wails3 dev
```

### 手动构建流程
```bash
# 生成绑定
wails3 generate bindings

# 构建前端
cd frontend && npm run build && cd ..

# 构建 Go 应用程序
go build -o pm2-manager .
```

## 使用方法

### 主界面

应用程序提供简洁直观的界面，包含以下部分：

1. **头部**: 右上角显示 PM2 版本状态
2. **系统指标**: 显示进程统计信息的概览卡片
3. **进程列表**: 包含所有 PM2 进程的详细表格
4. **操作按钮**: 快速访问常用操作

### 管理进程

#### 添加新进程
1. 点击"添加进程"按钮
2. 填写进程配置：
   - **进程名称**: 进程的唯一标识符
   - **脚本路径**: 应用程序脚本的路径
   - **工作目录**: 可选的工作目录
   - **启动参数**: 命令行参数
   - **实例数量**: 要运行的实例数
   - **开机自启**: 启用/禁用自动启动
3. 点击"添加"创建进程

#### 编辑现有进程
1. 点击任何进程旁边的"编辑"按钮
2. 根据需要修改配置
3. 点击"更新"应用更改

#### 进程操作
- **启动**: 启动已停止的进程
- **停止**: 停止正在运行的进程
- **重启**: 重启进程
- **删除**: 从 PM2 中移除进程
- **查看日志**: 打开实时日志查看器

### 批量操作
使用头部按钮对所有进程执行操作：
- **全部启动**: 启动所有已停止的进程
- **全部停止**: 停止所有正在运行的进程
- **全部重启**: 重启所有进程

## 项目结构

```
pm2-manager-wails3/
├── frontend/                 # 前端应用程序
│   ├── dist/                # 构建的前端文件
│   ├── bindings/            # 自动生成的 Wails 绑定
│   ├── components/          # UI 组件（未使用 - 原生 JS 方法）
│   ├── index.html           # 主 HTML 文件
│   ├── main.js              # 主 JavaScript 应用程序
│   └── package.json         # 前端依赖
├── main.go                  # 应用程序入口点
├── pm2service.go           # PM2 服务实现
├── go.mod                  # Go 模块依赖
└── README.md               # 此文件
```

## 技术细节

### 架构
- **后端**: Go 与 Wails3 框架
- **前端**: 原生 JavaScript（无 React/Vue 依赖）
- **构建系统**: Vite 用于前端打包
- **PM2 集成**: 直接命令行接口

### 核心组件

#### 后端 (`pm2service.go`)
- `PM2Service`: 主服务结构体
- `ProcessInfo`: 扩展字段的进程数据结构
- `PM2VersionInfo`: PM2 安装状态
- `ProcessConfig`: 添加/更新进程的配置

#### 前端 (`main.js`)
- 原生 JavaScript 实现
- ES6 模块与 Wails 绑定
- 每 5 秒实时数据更新
- 进程管理的模态对话框

## API 参考

### 后端方法
- `ListProcesses()`: 获取所有 PM2 进程
- `GetMetrics()`: 获取系统指标
- `GetPM2Version()`: 检查 PM2 安装
- `AddProcess(config)`: 添加新进程
- `UpdateProcess(id, config)`: 更新现有进程
- `DeleteProcess(id)`: 删除进程
- `StartProcess(id)`: 启动进程
- `StopProcess(id)`: 停止进程
- `RestartProcess(id)`: 重启进程

## 故障排除

### 常见问题

1. **找不到 PM2**
   - 确保全局安装 PM2: `npm install -g pm2`
   - 检查 PATH 环境变量

2. **构建错误**
   - 验证 Go 版本 (1.19+)
   - 运行 `go mod tidy` 解决依赖
   - 确保在 Go 构建前先构建前端

3. **前端无法加载**
   - 构建前端: `cd frontend && npm run build`
   - 检查 `frontend/dist/` 目录是否存在

## 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 彻底测试
5. 提交 pull request

## 许可证

此项目基于 MIT 许可证。

## 致谢

- 使用 [Wails3](https://wails.io/) 框架构建
- PM2 进程管理器集成
- 现代桌面应用程序架构
