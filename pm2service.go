package main

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

// runPM2Command 是一个核心辅助函数，用于通过用户的 shell 执行任何 pm2 命令。
// 它现在是跨平台的，会自动检测操作系统并使用正确的 shell。
func runPM2Command(args ...string) ([]byte, error) {
	var cmd *exec.Cmd

	if runtime.GOOS == "windows" {
		// Windows 系统: 使用 "cmd /C pm2 ..."
		// pm2 在 Windows 上通常是 pm2.cmd，'cmd /C' 会处理路径和执行。
		fullArgs := append([]string{"/C", "pm2"}, args...)
		cmd = exec.Command("cmd", fullArgs...)
	} else {
		// macOS & Linux 系统: 使用 "sh -c 'pm2 ...'"
		// 为了安全，对每个参数进行引用，防止 shell 注入。
		fullCommand := "pm2"
		for _, arg := range args {
			fullCommand += " " + strconv.Quote(arg)
		}
		cmd = exec.Command("sh", "-c", fullCommand)
	}

	// 使用 CombinedOutput() 来执行命令并捕获其标准输出和标准错误的组合结果。
	return cmd.CombinedOutput()
}

// ProcessInfo represents PM2 process information
type ProcessInfo struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Status    string  `json:"status"`
	CPU       float64 `json:"cpu"`
	Memory    float64 `json:"memory"`
	Uptime    int64   `json:"uptime"`
	StartedAt string  `json:"startedAt"`
	Runtime   string  `json:"runtime"`
	PID       int     `json:"pid"`
	User      string  `json:"user"`
	Command   string  `json:"command"`
	Script    string  `json:"script"`
	AutoStart bool    `json:"autoStart"`
}

// MetricsData represents aggregated metrics
type MetricsData struct {
	TotalProcesses int     `json:"totalProcesses"`
	Running        int     `json:"running"`
	Errored        int     `json:"errored"`
	Stopped        int     `json:"stopped"`
	TotalMemory    float64 `json:"totalMemory"`
	TotalCPU       float64 `json:"totalCPU"`
}

// PM2VersionInfo represents PM2 version information
type PM2VersionInfo struct {
	Version   string `json:"version"`
	Installed bool   `json:"installed"`
	Message   string `json:"message"`
}

// ProcessConfig represents configuration for adding/updating a process
type ProcessConfig struct {
	Name      string `json:"name"`
	Script    string `json:"script"`
	Cwd       string `json:"cwd"`
	Args      string `json:"args"`
	AutoStart bool   `json:"autoStart"`
	Instances int    `json:"instances"`
}

// LogData represents process logs
type LogData struct {
	Stdout []string `json:"stdout"`
	Stderr []string `json:"stderr"`
}

// OperationResult represents the result of PM2 operations
type OperationResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// PM2Service handles all PM2 operations
type PM2Service struct {
	mu sync.RWMutex
}

// ListProcesses retrieves all PM2 processes
func (p *PM2Service) ListProcesses() ([]ProcessInfo, error) {
	output, err := runPM2Command("jlist")
	if err != nil {
		if strings.Contains(string(output), "PM2 is not running") {
			return []ProcessInfo{}, nil
		}
		return nil, fmt.Errorf("failed to execute pm2 jlist: %v. Output: %s", err, string(output))
	}

	var processes []map[string]interface{}
	if err := json.Unmarshal(output, &processes); err != nil {
		if len(output) == 0 || string(output) == "[]" {
			return []ProcessInfo{}, nil
		}
		return nil, fmt.Errorf("failed to parse PM2 output: %v. Output: %s", err, string(output))
	}

	var result []ProcessInfo
	for _, process := range processes {
		uptime := getInt64FromMap(process, "pm2_env.pm_uptime")
		startedAt := time.Unix(uptime/1000, 0).Format("2006-01-02 15:04:05")
		runtime := formatRuntime(time.Since(time.Unix(uptime/1000, 0)))
		scriptPath := getStringFromMap(process, "pm2_env.pm_exec_path")
		args := getStringFromMap(process, "pm2_env.args")
		fullCommand := scriptPath
		if args != "" {
			fullCommand += " " + args
		}

		proc := ProcessInfo{
			ID:        getIntFromMap(process, "pm_id"),
			Name:      getStringFromMap(process, "name"),
			Status:    getStringFromMap(process, "pm2_env.status"),
			CPU:       getFloatFromMap(process, "monit.cpu"),
			Memory:    getFloatFromMap(process, "monit.memory"),
			Uptime:    uptime,
			StartedAt: startedAt,
			Runtime:   runtime,
			PID:       getIntFromMap(process, "pid"),
			User:      getStringFromMap(process, "pm2_env.username"),
			Command:   fullCommand,
			Script:    scriptPath,
			AutoStart: getBoolFromMap(process, "pm2_env.pm_auto_restart"),
		}
		result = append(result, proc)
	}

	return result, nil
}

// genericPM2Operation is a generic handler for actions like start, stop, restart
func (p *PM2Service) genericPM2Operation(action string, id interface{}, successMsg, errorMsg string) (*OperationResult, error) {
	idStr := fmt.Sprintf("%v", id)
	output, err := runPM2Command(action, idStr)

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf(errorMsg, idStr),
			Error:   fmt.Sprintf("%v: %s", err, string(output)),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf(successMsg, idStr),
	}, nil
}

// RestartProcess restarts a PM2 process
func (p *PM2Service) RestartProcess(id interface{}) (*OperationResult, error) {
	return p.genericPM2Operation("restart", id, "进程 %s 重启成功", "重启进程 %s 失败")
}

// StartProcess starts a PM2 process
func (p *PM2Service) StartProcess(id interface{}) (*OperationResult, error) {
	return p.genericPM2Operation("start", id, "进程 %s 启动成功", "启动进程 %s 失败")
}

// StopProcess stops a PM2 process
func (p *PM2Service) StopProcess(id interface{}) (*OperationResult, error) {
	return p.genericPM2Operation("stop", id, "进程 %s 停止成功", "停止进程 %s 失败")
}

// GetLogs retrieves logs for a specific process
func (p *PM2Service) GetLogs(id interface{}) (*LogData, error) {
	idStr := fmt.Sprintf("%v", id)
	output, err := runPM2Command("logs", idStr, "--lines", "100", "--nostream")

	if err != nil {
		return nil, fmt.Errorf("获取进程 %s 日志失败: %v. Output: %s", idStr, err, string(output))
	}

	lines := strings.Split(string(output), "\n")
	return &LogData{
		Stdout: lines,
		Stderr: []string{},
	}, nil
}

// GetMetrics calculates and returns aggregated metrics
func (p *PM2Service) GetMetrics() (*MetricsData, error) {
	processes, err := p.ListProcesses()
	if err != nil {
		return nil, err
	}

	metrics := &MetricsData{
		TotalProcesses: len(processes),
	}

	for _, proc := range processes {
		switch proc.Status {
		case "online":
			metrics.Running++
		case "errored":
			metrics.Errored++
		case "stopped":
			metrics.Stopped++
		}
		metrics.TotalCPU += proc.CPU
		metrics.TotalMemory += proc.Memory
	}

	return metrics, nil
}

// GetPM2Version retrieves PM2 version information
func (p *PM2Service) GetPM2Version() (*PM2VersionInfo, error) {
	// 跨平台检查 PM2 是否存在
	var checkCmd *exec.Cmd
	if runtime.GOOS == "windows" {
		// Windows: 使用 'where' 命令
		checkCmd = exec.Command("cmd", "/C", "where pm2")
	} else {
		// macOS & Linux: 使用 'command -v'
		checkCmd = exec.Command("sh", "-c", "command -v pm2")
	}

	if err := checkCmd.Run(); err != nil {
		return &PM2VersionInfo{
			Version:   "",
			Installed: false,
			Message:   "PM2 未安装。请先安装 PM2: npm install -g pm2",
		}, nil
	}

	// 如果存在，再获取版本号
	output, err := runPM2Command("--version")
	if err != nil {
		return nil, fmt.Errorf("failed to get PM2 version: %v. Output: %s", err, string(output))
	}

	version := strings.TrimSpace(string(output))
	return &PM2VersionInfo{
		Version:   version,
		Installed: true,
		Message:   fmt.Sprintf("PM2 版本: %s", version),
	}, nil
}

// AddProcess adds a new process to PM2
func (p *PM2Service) AddProcess(config *ProcessConfig) (*OperationResult, error) {
	if config.Name == "" || config.Script == "" {
		return &OperationResult{
			Success: false,
			Message: "进程名称和脚本路径不能为空",
			Error:   "Invalid configuration",
		}, nil
	}

	args := []string{"start", config.Script, "--name", config.Name}
	if config.Cwd != "" {
		args = append(args, "--cwd", config.Cwd)
	}
	if config.Args != "" {
		args = append(args, "--")
		args = append(args, strings.Split(config.Args, " ")...)
	}
	if config.Instances > 0 {
		args = append(args, "-i", fmt.Sprintf("%d", config.Instances))
	}

	output, err := runPM2Command(args...)
	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("添加进程 %s 失败", config.Name),
			Error:   fmt.Sprintf("%v: %s", err, string(output)),
		}, nil
	}

	if config.AutoStart {
		_, saveErr := runPM2Command("save")
		if saveErr != nil {
			fmt.Printf("Warning: Failed to save PM2 configuration: %v\n", saveErr)
		}
		_, startupErr := runPM2Command("startup")
		if startupErr != nil {
			fmt.Printf("Warning: Failed to setup PM2 startup: %v\n", startupErr)
		}
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf("进程 %s 添加成功", config.Name),
	}, nil
}

// UpdateProcess updates an existing process configuration
func (p *PM2Service) UpdateProcess(processId interface{}, config *ProcessConfig) (*OperationResult, error) {
	deleteResult, err := p.DeleteProcess(processId)
	if err != nil || !deleteResult.Success {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("更新进程失败：无法删除旧进程 %v", processId),
			Error:   deleteResult.Error,
		}, nil
	}

	time.Sleep(500 * time.Millisecond)

	return p.AddProcess(config)
}

// DeleteProcess deletes a process from PM2
func (p *PM2Service) DeleteProcess(processId interface{}) (*OperationResult, error) {
	return p.genericPM2Operation("delete", processId, "进程 %s 删除成功", "删除进程 %s 失败")
}

// --- 批量操作 ---
func (p *PM2Service) StartAllProcesses() (*OperationResult, error) {
	return p.genericPM2Operation("start", "all", "所有进程启动成功", "启动所有进程失败")
}

func (p *PM2Service) StopAllProcesses() (*OperationResult, error) {
	return p.genericPM2Operation("stop", "all", "所有进程停止成功", "停止所有进程失败")
}

func (p *PM2Service) RestartAllProcesses() (*OperationResult, error) {
	return p.genericPM2Operation("restart", "all", "所有进程重启成功", "重启所有进程失败")
}

// --- 辅助函数 (无需修改) ---

func formatRuntime(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%.0f秒", d.Seconds())
	} else if d < time.Hour {
		return fmt.Sprintf("%.0f分钟", d.Minutes())
	} else if d < 24*time.Hour {
		hours := int(d.Hours())
		minutes := int(d.Minutes()) % 60
		return fmt.Sprintf("%d小时%d分钟", hours, minutes)
	} else {
		days := int(d.Hours()) / 24
		hours := int(d.Hours()) % 24
		return fmt.Sprintf("%d天%d小时", days, hours)
	}
}

func getStringFromMap(m map[string]interface{}, key string) string {
	keys := strings.Split(key, ".")
	var current interface{} = m
	for _, k := range keys {
		nextMap, ok := current.(map[string]interface{})
		if !ok {
			return ""
		}
		current, ok = nextMap[k]
		if !ok {
			return ""
		}
	}
	if val, ok := current.(string); ok {
		return val
	}
	return ""
}

func getIntFromMap(m map[string]interface{}, key string) int {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case float64:
			return int(v)
		case int:
			return v
		case string:
			if i, err := strconv.Atoi(v); err == nil {
				return i
			}
		}
	}
	return 0
}

func getFloatFromMap(m map[string]interface{}, key string) float64 {
	keys := strings.Split(key, ".")
	var current interface{} = m
	for _, k := range keys {
		nextMap, ok := current.(map[string]interface{})
		if !ok {
			return 0.0
		}
		current, ok = nextMap[k]
		if !ok {
			return 0.0
		}
	}
	switch v := current.(type) {
	case float64:
		return v
	case int:
		return float64(v)
	}
	return 0.0
}

func getInt64FromMap(m map[string]interface{}, key string) int64 {
	keys := strings.Split(key, ".")
	var current interface{} = m
	for _, k := range keys {
		nextMap, ok := current.(map[string]interface{})
		if !ok {
			return 0
		}
		current, ok = nextMap[k]
		if !ok {
			return 0
		}
	}
	switch v := current.(type) {
	case float64:
		return int64(v)
	case int64:
		return v
	case int:
		return int64(v)
	}
	return 0
}

func getBoolFromMap(m map[string]interface{}, key string) bool {
	keys := strings.Split(key, ".")
	var current interface{} = m
	for _, k := range keys {
		nextMap, ok := current.(map[string]interface{})
		if !ok {
			return false
		}
		current, ok = nextMap[k]
		if !ok {
			return false
		}
	}
	switch v := current.(type) {
	case bool:
		return v
	case string:
		return v == "true" || v == "1"
	case float64:
		return v != 0
	case int:
		return v != 0
	}
	return false
}
