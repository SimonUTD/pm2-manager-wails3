import {PM2Service} from "./bindings/changeme/index.js";

let processes = [];
let metrics = {};
let selectedProcesses = new Set();
let currentLogContent = '';

// Load initial data when page loads
document.addEventListener('DOMContentLoaded', () => {
    refreshData();
    loadPM2Version();
    // Auto-refresh every 5 seconds
    setInterval(refreshData, 5000);

    // Debug: Check if deleteProcess function is available
    console.log('deleteProcess function available:', typeof window.deleteProcess);

    // Bind functions to global scope for HTML onclick handlers
    window.startAllProcesses = startAllProcesses;
    window.stopAllProcesses = stopAllProcesses;
    window.restartAllProcesses = restartAllProcesses;
    window.refreshData = refreshData;
    window.startProcess = startProcess;
    window.stopProcess = stopProcess;
    window.restartProcess = restartProcess;
    window.showLogs = showLogs;
    window.closeLogModal = closeLogModal;
    window.copyLogsToClipboard = copyLogsToClipboard;
    window.exportLogsToFile = exportLogsToFile;
    window.toggleSelectAll = toggleSelectAll;
    window.toggleProcessSelection = toggleProcessSelection;
    window.showAddProcessDialog = showAddProcessDialog;
    window.showEditProcessDialog = showEditProcessDialog;
    window.deleteProcess = deleteProcess;
});

// Refresh all data
window.refreshData = async () => {
    try {
        await Promise.all([
            loadMetrics(),
            loadProcesses()
        ]);
    } catch (error) {
        console.error('Error refreshing data:', error);
        showError('刷新数据失败: ' + error.message);
    }
};

// Load metrics
async function loadMetrics() {
    try {
        metrics = await PM2Service.GetMetrics();
        updateMetricsDisplay();
    } catch (error) {
        console.error('Error loading metrics:', error);
        throw error;
    }
}

// Load processes
async function loadProcesses() {
    try {
        processes = await PM2Service.ListProcesses();
        updateProcessesDisplay();
    } catch (error) {
        console.error('Error loading processes:', error);
        throw error;
    }
}

// Load PM2 version
async function loadPM2Version() {
    try {
        const versionInfo = await PM2Service.GetPM2Version();
        updatePM2VersionDisplay(versionInfo);
    } catch (error) {
        console.error('Error loading PM2 version:', error);
        updatePM2VersionDisplay({
            installed: false,
            message: 'PM2 状态未知'
        });
    }
}

// Update metrics display
function updateMetricsDisplay() {
    document.getElementById('total-processes').textContent = metrics.totalProcesses || 0;
    document.getElementById('running-processes').textContent = metrics.running || 0;
    document.getElementById('errored-processes').textContent = metrics.errored || 0;
    document.getElementById('stopped-processes').textContent = metrics.stopped || 0;
}

// Update PM2 version display
function updatePM2VersionDisplay(versionInfo) {
    const versionElement = document.getElementById('pm2-version');
    if (versionElement) {
        versionElement.textContent = versionInfo.message;
        versionElement.className = versionInfo.installed ? 'pm2-version installed' : 'pm2-version not-installed';
    }
}

// Update processes display
function updateProcessesDisplay() {
    const container = document.getElementById('processes-list');
    
    if (!processes || processes.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="loading">暂无进程</td></tr>';
        return;
    }
    
    container.innerHTML = processes.map(process => `
        <tr>
            <td>
                <input type="checkbox"
                       class="process-checkbox"
                       value="${process.id}"
                       onchange="toggleProcessSelection(${process.id})"
                       ${selectedProcesses.has(process.id) ? 'checked' : ''}/>
            </td>
            <td>
                <div class="process-name">${process.name}</div>
                
                <div class="process-user">User: ${process.user || '-'} | Auto Start: ${process.autoStart ? '✓' : '✗'}</div>
                <div class="process-command" title="${process.command || '-'}">${truncateText(process.command || '-', 50)}</div>
            </td>
            <td>
                <div class="process-id">ID: ${process.id} | PID: ${process.pid || '-'}</div>
            </td>
            <td>
                <span class="status ${getStatusClass(process.status)}">${getStatusText(process.status)}</span>
            </td>
            <td>${process.cpu ? process.cpu.toFixed(1) + '%' : '0%'}</td>
            <td>${formatMemory(process.memory)}</td>
            <td>${process.startedAt || '-'}</td>
            <td>${process.runtime || '-'}</td>
            <td>
                <div class="actions">
                    ${process.status === 'online' ?
                        `<button class="btn danger" onclick="stopProcess(${process.id})">停止</button>
                         <button class="btn secondary" onclick="restartProcess(${process.id})">重启</button>` :
                        `<button class="btn success" onclick="startProcess(${process.id})">启动</button>`
                    }
                    <button class="btn outline" onclick="showLogs(${process.id}, '${process.name}')">日志</button>
                    <button class="btn outline" onclick="showEditProcessDialog(${process.id})">编辑</button>
                    <button class="btn danger" onclick="deleteProcess(${process.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Get status CSS class
function getStatusClass(status) {
    switch(status) {
        case 'online': return 'online';
        case 'stopped': return 'stopped';
        case 'error': return 'error';
        default: return 'stopped';
    }
}

// Get status display text
function getStatusText(status) {
    switch(status) {
        case 'online': return '运行中';
        case 'stopped': return '已停止';
        case 'error': return '异常';
        default: return '未知';
    }
}

// Format memory display
function formatMemory(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

// Truncate text for display
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Process management functions
window.startProcess = async (id) => {
    try {
        const result = await PM2Service.StartProcess(id);
        if (result.success) {
            showSuccess(`进程 ${id} 启动成功`);
            await refreshData();
        } else {
            showError(`启动失败: ${result.message}`);
        }
    } catch (error) {
        showError(`启动进程失败: ${error.message}`);
    }
};

window.stopProcess = async (id) => {
    try {
        const result = await PM2Service.StopProcess(id);
        if (result.success) {
            showSuccess(`进程 ${id} 停止成功`);
            await refreshData();
        } else {
            showError(`停止失败: ${result.message}`);
        }
    } catch (error) {
        showError(`停止进程失败: ${error.message}`);
    }
};

window.restartProcess = async (id) => {
    try {
        const result = await PM2Service.RestartProcess(id);
        if (result.success) {
            showSuccess(`进程 ${id} 重启成功`);
            await refreshData();
        } else {
            showError(`重启失败: ${result.message}`);
        }
    } catch (error) {
        showError(`重启进程失败: ${error.message}`);
    }
};

// Batch operations
window.startAllProcesses = async () => {
    try {
        const result = await PM2Service.StartAllProcesses();
        if (result.success) {
            showSuccess(result.message);
        } else {
            showError(result.message || result.error);
        }
        await refreshData();
    } catch (error) {
        showError(`启动所有进程失败: ${error.message}`);
    }
};

window.stopAllProcesses = async () => {
    try {
        const result = await PM2Service.StopAllProcesses();
        if (result.success) {
            showSuccess(result.message);
        } else {
            showError(result.message || result.error);
        }
        await refreshData();
    } catch (error) {
        showError(`停止所有进程失败: ${error.message}`);
    }
};

window.restartAllProcesses = async () => {
    try {
        const result = await PM2Service.RestartAllProcesses();
        if (result.success) {
            showSuccess(result.message);
        } else {
            showError(result.message || result.error);
        }
        await refreshData();
    } catch (error) {
        showError(`重启所有进程失败: ${error.message}`);
    }
};

// Selection functions
window.toggleSelectAll = () => {
    const selectAllCheckbox = document.getElementById('select-all');
    const processCheckboxes = document.querySelectorAll('.process-checkbox[value]');
    
    if (selectAllCheckbox.checked) {
        processCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedProcesses.add(parseInt(checkbox.value));
        });
    } else {
        processCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedProcesses.clear();
    }
};

window.toggleProcessSelection = (id) => {
    if (selectedProcesses.has(id)) {
        selectedProcesses.delete(id);
    } else {
        selectedProcesses.add(id);
    }
    
    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('select-all');
    const processCheckboxes = document.querySelectorAll('.process-checkbox[value]');
    const checkedCount = Array.from(processCheckboxes).filter(cb => cb.checked).length;
    
    selectAllCheckbox.checked = checkedCount === processCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < processCheckboxes.length;
};

// Log management functions
window.showLogs = async (id, name) => {
    try {
        document.getElementById('modal-title').textContent = `${name} (ID: ${id}) - 进程日志`;
        document.getElementById('log-modal').classList.add('show');
        document.getElementById('logs-container').innerHTML = '<div class="loading">加载日志中...</div>';
        
        const logData = await PM2Service.GetLogs(id);
        currentLogContent = logData.content || '暂无日志';
        
        displayLogs(currentLogContent);
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logs-container').innerHTML = '<div class="error">加载日志失败: ' + error.message + '</div>';
    }
};

window.closeLogModal = () => {
    document.getElementById('log-modal').classList.remove('show');
    currentLogContent = '';
};

window.copyLogsToClipboard = async () => {
    if (!currentLogContent) {
        showError('没有可复制的日志内容');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentLogContent);
        showSuccess('日志已复制到剪贴板');
    } catch (error) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = currentLogContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('日志已复制到剪贴板');
    }
};

window.exportLogsToFile = () => {
    if (!currentLogContent) {
        showError('没有可导出的日志内容');
        return;
    }
    
    const processName = document.getElementById('modal-title').textContent.split(' ')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${processName}-logs-${timestamp}.txt`;
    
    const blob = new Blob([currentLogContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess(`日志已导出为 ${filename}`);
};

// Display logs with proper formatting
function displayLogs(logContent) {
    const container = document.getElementById('logs-container');
    
    if (!logContent || logContent.trim() === '') {
        container.innerHTML = '<div class="loading">暂无日志</div>';
        return;
    }
    
    const lines = logContent.split('\n');
    const formattedLines = lines.map(line => {
        let className = 'log-line';
        if (line.toLowerCase().includes('error')) {
            className += ' error';
        } else if (line.toLowerCase().includes('warn')) {
            className += ' warn';
        } else if (line.toLowerCase().includes('info')) {
            className += ' info';
        }
        
        return `<div class="${className}">${escapeHtml(line)}</div>`;
    }).join('');
    
    container.innerHTML = formattedLines;
    
    // Auto scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        word-wrap: break-word;
        transition: all 0.3s ease;
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'info':
            notification.style.backgroundColor = '#3b82f6';
            break;
        default:
            notification.style.backgroundColor = '#6b7280';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Show add process dialog
window.showAddProcessDialog = function() {
    const dialog = createProcessDialog('add');
    document.body.appendChild(dialog);
}

// Show edit process dialog
window.showEditProcessDialog = function(processId) {
    const process = processes.find(p => p.id === processId);
    if (!process) {
        showError('进程不存在');
        return;
    }

    const dialog = createProcessDialog('edit', process);
    document.body.appendChild(dialog);
}

// Delete process
async function deleteProcess(processId) {
    console.log('deleteProcess called with ID:', processId);

    // Create custom confirmation dialog
    const confirmDialog = createConfirmDialog(
        '确认删除',
        `确定要删除进程 ${processId} 吗？此操作不可撤销。`,
        async () => {
            try {
                console.log('Calling PM2Service.DeleteProcess...');
                const result = await PM2Service.DeleteProcess(processId);
                console.log('Delete result:', result);
                if (result.success) {
                    showSuccess(`进程 ${processId} 删除成功`);
                    await refreshData();
                } else {
                    showError(result.message || '删除进程失败');
                }
            } catch (error) {
                console.error('Error deleting process:', error);
                showError('删除进程时发生错误: ' + error.message);
            }
        }
    );

    document.body.appendChild(confirmDialog);
}

// Create process dialog
function createProcessDialog(mode, process = null) {
    const dialog = document.createElement('div');
    dialog.className = 'modal show';
    dialog.style.zIndex = '2000';

    const isEdit = mode === 'edit';
    const title = isEdit ? '编辑进程' : '添加新进程';

    dialog.innerHTML = `
        <div class="modal-content" style="max-width: 500px; height: auto;">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="closeProcessDialog()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <form id="process-form" style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">进程名称 *</label>
                        <input type="text" id="process-name" required
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="${process ? process.name : ''}" placeholder="my-app">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">脚本路径 *</label>
                        <input type="text" id="process-script" required
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="${process ? process.script : ''}" placeholder="/path/to/app.js 或 npm start">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">工作目录</label>
                        <input type="text" id="process-cwd"
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="" placeholder="/path/to/project">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">启动参数</label>
                        <input type="text" id="process-args"
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="" placeholder="--port 3000">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">实例数量</label>
                        <input type="number" id="process-instances" min="1"
                               style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"
                               value="1">
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="process-autostart" ${process && process.autoStart ? 'checked' : ''}>
                        <label for="process-autostart">开机自启</label>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn outline" onclick="closeProcessDialog()">取消</button>
                        <button type="submit" class="btn primary">${isEdit ? '更新' : '添加'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Handle form submission
    const form = dialog.querySelector('#process-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const config = {
            name: document.getElementById('process-name').value.trim(),
            script: document.getElementById('process-script').value.trim(),
            cwd: document.getElementById('process-cwd').value.trim(),
            args: document.getElementById('process-args').value.trim(),
            instances: parseInt(document.getElementById('process-instances').value) || 1,
            autoStart: document.getElementById('process-autostart').checked
        };

        if (!config.name || !config.script) {
            showError('进程名称和脚本路径不能为空');
            return;
        }

        try {
            let result;
            if (isEdit) {
                result = await PM2Service.UpdateProcess(process.id, config);
            } else {
                result = await PM2Service.AddProcess(config);
            }

            if (result.success) {
                showSuccess(result.message || `进程${isEdit ? '更新' : '添加'}成功`);
                closeProcessDialog();
                await refreshData();
            } else {
                showError(result.message || `${isEdit ? '更新' : '添加'}进程失败`);
            }
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'adding'} process:`, error);
            showError(`${isEdit ? '更新' : '添加'}进程时发生错误: ` + error.message);
        }
    });

    return dialog;
}

// Close process dialog
function closeProcessDialog() {
    const dialogs = document.querySelectorAll('.modal[style*="z-index: 2000"]');
    dialogs.forEach(dialog => {
        if (dialog.parentNode) {
            document.body.removeChild(dialog);
        }
    });
}

// Make closeProcessDialog available globally
window.closeProcessDialog = closeProcessDialog;

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('log-modal');
    if (e.target === modal) {
        closeLogModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeLogModal();
    }
    
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }
});

// Create confirmation dialog
function createConfirmDialog(title, message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'modal show';
    dialog.style.zIndex = '2000';

    dialog.innerHTML = `
        <div class="modal-content" style="width: 400px; height: auto; max-width: 90vw;">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <p style="margin-bottom: 20px; color: #374151;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn outline" onclick="this.closest('.modal').remove()">取消</button>
                    <button class="btn danger confirm-btn">确认删除</button>
                </div>
            </div>
        </div>
    `;

    // Add confirm button event listener
    const confirmBtn = dialog.querySelector('.confirm-btn');
    confirmBtn.addEventListener('click', () => {
        dialog.remove();
        onConfirm();
    });

    return dialog;
}

console.log('PM2 Manager frontend loaded successfully');
