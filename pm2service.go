package main

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"
)

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
	cmd := exec.Command("pm2", "jlist")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to execute pm2 jlist: %v", err)
	}

	var processes []map[string]interface{}
	if err := json.Unmarshal(output, &processes); err != nil {
		return nil, fmt.Errorf("failed to parse PM2 output: %v", err)
	}

	var result []ProcessInfo
	for _, process := range processes {
		uptime := getInt64FromMap(process, "pm2_env.pm_uptime")
		startedAt := time.Unix(uptime/1000, 0).Format("2006-01-02 15:04:05")
		runtime := formatRuntime(time.Since(time.Unix(uptime/1000, 0)))

		// Get the correct script path and command
		scriptPath := getStringFromMap(process, "pm2_env.pm_exec_path")
		args := getStringFromMap(process, "pm2_env.args")

		// Build full command
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

// RestartProcess restarts a PM2 process
func (p *PM2Service) RestartProcess(id interface{}) (*OperationResult, error) {
	idStr := fmt.Sprintf("%v", id)
	cmd := exec.Command("pm2", "restart", idStr)
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("重启进程 %s 失败", idStr),
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf("进程 %s 重启成功", idStr),
	}, nil
}

// StartProcess starts a PM2 process
func (p *PM2Service) StartProcess(id interface{}) (*OperationResult, error) {
	idStr := fmt.Sprintf("%v", id)
	cmd := exec.Command("pm2", "start", idStr)
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("启动进程 %s 失败", idStr),
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf("进程 %s 启动成功", idStr),
	}, nil
}

// StopProcess stops a PM2 process
func (p *PM2Service) StopProcess(id interface{}) (*OperationResult, error) {
	idStr := fmt.Sprintf("%v", id)
	cmd := exec.Command("pm2", "stop", idStr)
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("停止进程 %s 失败", idStr),
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf("进程 %s 停止成功", idStr),
	}, nil
}

// GetLogs retrieves logs for a specific process
func (p *PM2Service) GetLogs(id interface{}) (*LogData, error) {
	idStr := fmt.Sprintf("%v", id)
	cmd := exec.Command("pm2", "logs", idStr, "--lines", "100", "--nostream")
	output, err := cmd.Output()

	if err != nil {
		return nil, fmt.Errorf("获取进程 %s 日志失败: %v", idStr, err)
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
	cmd := exec.Command("pm2", "--version")
	output, err := cmd.Output()

	if err != nil {
		// Check if PM2 is not installed
		if strings.Contains(err.Error(), "executable file not found") ||
			strings.Contains(err.Error(), "command not found") {
			return &PM2VersionInfo{
				Version:   "",
				Installed: false,
				Message:   "PM2 未安装。请先安装 PM2: npm install -g pm2",
			}, nil
		}
		return nil, fmt.Errorf("failed to get PM2 version: %v", err)
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

	// Build PM2 start command with configuration
	args := []string{"start", config.Script, "--name", config.Name}

	if config.Cwd != "" {
		args = append(args, "--cwd", config.Cwd)
	}

	if config.Args != "" {
		args = append(args, "--", config.Args)
	}

	if config.Instances > 0 {
		args = append(args, "-i", fmt.Sprintf("%d", config.Instances))
	}

	cmd := exec.Command("pm2", args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("添加进程 %s 失败", config.Name),
			Error:   fmt.Sprintf("%v: %s", err, string(output)),
		}, nil
	}

	// If auto-start is enabled, save PM2 configuration
	if config.AutoStart {
		saveCmd := exec.Command("pm2", "save")
		if saveErr := saveCmd.Run(); saveErr != nil {
			// Log warning but don't fail the operation
			fmt.Printf("Warning: Failed to save PM2 configuration: %v\n", saveErr)
		}

		// Set up startup script (this might require sudo, so we'll just attempt it)
		startupCmd := exec.Command("pm2", "startup")
		if startupErr := startupCmd.Run(); startupErr != nil {
			// Log warning but don't fail the operation
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
	if config.Name == "" || config.Script == "" {
		return &OperationResult{
			Success: false,
			Message: "进程名称和脚本路径不能为空",
			Error:   "Invalid configuration",
		}, nil
	}

	idStr := fmt.Sprintf("%v", processId)

	// First, delete the existing process
	deleteCmd := exec.Command("pm2", "delete", idStr)
	if err := deleteCmd.Run(); err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("删除旧进程 %s 失败", idStr),
			Error:   err.Error(),
		}, nil
	}

	// Then add the process with new configuration
	result, err := p.AddProcess(config)
	if err != nil {
		return nil, err
	}

	if !result.Success {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("更新进程 %s 失败: %s", config.Name, result.Message),
			Error:   result.Error,
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf("进程 %s 更新成功", config.Name),
	}, nil
}

// DeleteProcess deletes a process from PM2
func (p *PM2Service) DeleteProcess(processId interface{}) (*OperationResult, error) {
	idStr := fmt.Sprintf("%v", processId)
	cmd := exec.Command("pm2", "delete", idStr)
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: fmt.Sprintf("删除进程 %s 失败", idStr),
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: fmt.Sprintf("进程 %s 删除成功", idStr),
	}, nil
}

// formatRuntime formats duration to a human-readable string
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

// Helper functions for safe map access
func getStringFromMap(m map[string]interface{}, key string) string {
	keys := strings.Split(key, ".")
	current := m

	for i, k := range keys {
		if i == len(keys)-1 {
			if val, ok := current[k].(string); ok {
				return val
			}
			return ""
		}

		if next, ok := current[k].(map[string]interface{}); ok {
			current = next
		} else {
			return ""
		}
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
	current := m

	for i, k := range keys {
		if i == len(keys)-1 {
			if val, ok := current[k]; ok {
				switch v := val.(type) {
				case float64:
					return v
				case int:
					return float64(v)
				}
			}
			return 0.0
		}

		if next, ok := current[k].(map[string]interface{}); ok {
			current = next
		} else {
			return 0.0
		}
	}
	return 0.0
}

func getInt64FromMap(m map[string]interface{}, key string) int64 {
	keys := strings.Split(key, ".")
	current := m

	for i, k := range keys {
		if i == len(keys)-1 {
			if val, ok := current[k]; ok {
				switch v := val.(type) {
				case float64:
					return int64(v)
				case int64:
					return v
				case int:
					return int64(v)
				}
			}
			return 0
		}

		if next, ok := current[k].(map[string]interface{}); ok {
			current = next
		} else {
			return 0
		}
	}
	return 0
}

func getBoolFromMap(m map[string]interface{}, key string) bool {
	keys := strings.Split(key, ".")
	current := m

	for i, k := range keys {
		if i == len(keys)-1 {
			if val, ok := current[k]; ok {
				switch v := val.(type) {
				case bool:
					return v
				case string:
					return v == "true" || v == "1"
				case float64:
					return v != 0
				case int:
					return v != 0
				}
			}
			return false
		}

		if next, ok := current[k].(map[string]interface{}); ok {
			current = next
		} else {
			return false
		}
	}
	return false
}

// StartAllProcesses starts all PM2 processes
func (p *PM2Service) StartAllProcesses() (*OperationResult, error) {
	cmd := exec.Command("pm2", "start", "all")
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: "启动所有进程失败",
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: "所有进程启动成功",
	}, nil
}

// StopAllProcesses stops all PM2 processes
func (p *PM2Service) StopAllProcesses() (*OperationResult, error) {
	cmd := exec.Command("pm2", "stop", "all")
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: "停止所有进程失败",
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: "所有进程停止成功",
	}, nil
}

// RestartAllProcesses restarts all PM2 processes
func (p *PM2Service) RestartAllProcesses() (*OperationResult, error) {
	cmd := exec.Command("pm2", "restart", "all")
	err := cmd.Run()

	if err != nil {
		return &OperationResult{
			Success: false,
			Message: "重启所有进程失败",
			Error:   err.Error(),
		}, nil
	}

	return &OperationResult{
		Success: true,
		Message: "所有进程重启成功",
	}, nil
}
