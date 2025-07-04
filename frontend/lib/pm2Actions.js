// frontend/lib/pm2Actions.js
import {
  ListProcesses,
  StartProcess,
  StopProcess,
  RestartProcess,
  StartAllProcesses,
  StopAllProcesses,
  RestartAllProcesses,
  GetLogs,
  GetMetrics,
  GetPM2Version,
  AddProcess,
  UpdateProcess,
  DeleteProcess
} from "../bindings/changeme/pm2service.js";

// List all processes
export async function listProcesses() {
  try {
    const result = await ListProcesses();
    return result || [];
  } catch (error) {
    console.error("Failed to list processes:", error);
    throw error;
  }
}

// Start a single process
export async function startProcess(id) {
  try {
    const result = await StartProcess(id);
    return result;
  } catch (error) {
    console.error(`Failed to start process ${id}:`, error);
    throw error;
  }
}

// Stop a single process
export async function stopProcess(id) {
  try {
    const result = await StopProcess(id);
    return result;
  } catch (error) {
    console.error(`Failed to stop process ${id}:`, error);
    throw error;
  }
}

// Restart a single process
export async function restartProcess(id) {
  try {
    const result = await RestartProcess(id);
    return result;
  } catch (error) {
    console.error(`Failed to restart process ${id}:`, error);
    throw error;
  }
}

// Start all processes
export async function startAllProcesses() {
  try {
    const result = await StartAllProcesses();
    return result;
  } catch (error) {
    console.error("Failed to start all processes:", error);
    throw error;
  }
}

// Stop all processes
export async function stopAllProcesses() {
  try {
    const result = await StopAllProcesses();
    return result;
  } catch (error) {
    console.error("Failed to stop all processes:", error);
    throw error;
  }
}

// Restart all processes
export async function restartAllProcesses() {
  try {
    const result = await RestartAllProcesses();
    return result;
  } catch (error) {
    console.error("Failed to restart all processes:", error);
    throw error;
  }
}

// Get process logs
export async function getLogs(id) {
  try {
    const result = await GetLogs(id);
    return result || { stdout: [], stderr: [] };
  } catch (error) {
    console.error(`Failed to get logs for process ${id}:`, error);
    throw error;
  }
}

// Get metrics
export async function getMetrics() {
  try {
    const result = await GetMetrics();
    return result || { totalProcesses: 0, running: 0, errored: 0, stopped: 0 };
  } catch (error) {
    console.error("Failed to get metrics:", error);
    throw error;
  }
}

// Get PM2 version
export async function getPM2Version() {
  try {
    const result = await GetPM2Version();
    return result || { version: "", installed: false, message: "Unknown" };
  } catch (error) {
    console.error("Failed to get PM2 version:", error);
    throw error;
  }
}

// Add new process
export async function addProcess(config) {
  try {
    const result = await AddProcess(config);
    return result;
  } catch (error) {
    console.error("Failed to add process:", error);
    throw error;
  }
}

// Update process
export async function updateProcess(processId, config) {
  try {
    const result = await UpdateProcess(processId, config);
    return result;
  } catch (error) {
    console.error(`Failed to update process ${processId}:`, error);
    throw error;
  }
}

// Delete process
export async function deleteProcess(processId) {
  try {
    const result = await DeleteProcess(processId);
    return result;
  } catch (error) {
    console.error(`Failed to delete process ${processId}:`, error);
    throw error;
  }
}