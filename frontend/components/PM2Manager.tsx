// app/components/PM2Manager.tsx
"use client";

import { useState, useEffect } from "react";
import {
  listProcesses,
  restartProcess,
  getLogs,
  getMetrics,
  startProcess,
  stopProcess,
  startAllProcesses,
  stopAllProcesses,
  restartAllProcesses,
  getPM2Version,
  addProcess,
  updateProcess,
  deleteProcess,
} from "../lib/pm2Actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import LogViewerModal from "@/components/pm2/LogViewerModal";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CircleIcon, Loader2, PlayIcon, StopCircleIcon } from "lucide-react";
import LogViewerModal from "./pm2/LogViewerModal";
import ProcessDialog from "./pm2/ProcessDialog";
interface ProcessInfo {
  id: number;
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  startedAt: string;
  runtime: string;
  pid: number;
  user: string;
  command: string;
  script: string;
  autoStart: boolean;
}

interface LogData {
  stdout: string[];
  stderr: string[];
}

interface MetricsData {
  totalProcesses: number;
  running: number;
  errored: number;
}

interface PM2VersionInfo {
  version: string;
  installed: boolean;
  message: string;
}

export default function PM2Manager({
  initialProcesses,
  initialMetrics,
}: {
  initialProcesses: ProcessInfo[];
  initialMetrics: MetricsData;
}) {
  const [processes, setProcesses] = useState<ProcessInfo[]>(
    initialProcesses || []
  );
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogData>({ stdout: [], stderr: [] });
  const [metrics, setMetrics] = useState<MetricsData | null>(
    initialMetrics || null
  );
  const [pm2Version, setPM2Version] = useState<PM2VersionInfo | null>(null);
  const [error, setError] = useState<string>("");
  const [isLogViewerOpen, setLogViewerOpen] = useState<{
    open: boolean;
    openedID: string | number | null;
  }>({
    open: false,
    openedID: null,
  });

  // New state to track loading actions for each process
  const [loadingActions, setLoadingActions] = useState<{
    [processId: number]: {
      start: boolean;
      stop: boolean;
      restart: boolean;
      viewLogs: boolean;
    };
  }>({});

  // New state for global actions
  const [globalLoading, setGlobalLoading] = useState({
    startAll: false,
    stopAll: false,
    restartAll: false,
  });

  // Add confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  async function fetchData() {
    try {
      const [processesData, metricsData, versionData] = await Promise.all([
        listProcesses(),
        getMetrics(),
        getPM2Version(),
      ]);
      setProcesses(processesData);
      setMetrics(metricsData);
      setPM2Version(versionData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function handleRestart(processId: number) {
    try {
      // Set loading state for restart
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          restart: true,
        },
      }));

      setLogViewerOpen({
        open: true,
        openedID: processId,
      });
      await restartProcess(processId);
      fetchData(); // Refresh the data
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          restart: false,
        },
      }));
    }
  }

  async function handleStart(processId: number) {
    try {
      // Set loading state for start
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          start: true,
        },
      }));

      setLogViewerOpen({
        open: true,
        openedID: processId,
      });
      await startProcess(processId);
      fetchData(); // Refresh the data
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          start: false,
        },
      }));
    }
  }

  async function handleStop(processId: number) {
    try {
      // Set loading state for stop
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          stop: true,
        },
      }));

      await stopProcess(processId);
      fetchData(); // Refresh the data
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          stop: false,
        },
      }));
    }
  }

  async function handleViewLogs(processId: number) {
    try {
      // Set loading state for view logs
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          viewLogs: true,
        },
      }));

      const logData = await getLogs(processId);
      setLogs(logData);
      setSelectedProcess(processId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        [processId]: {
          ...prev[processId],
          viewLogs: false,
        },
      }));
    }
  }

  // Global operations handlers
  async function handleStartAll() {
    setConfirmDialog({
      open: true,
      title: "确认启动所有进程",
      message: "确定要启动所有已停止的进程吗？",
      onConfirm: async () => {
        try {
          setGlobalLoading((prev) => ({ ...prev, startAll: true }));
          const result = await startAllProcesses();
          if (result?.success) {
            setError("");
          } else {
            setError(result?.message || "启动失败");
          }
          fetchData(); // Refresh the data
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setGlobalLoading((prev) => ({ ...prev, startAll: false }));
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  }

  async function handleStopAll() {
    setConfirmDialog({
      open: true,
      title: "确认停止所有进程",
      message: "确定要停止所有运行中的进程吗？",
      onConfirm: async () => {
        try {
          setGlobalLoading((prev) => ({ ...prev, stopAll: true }));
          const result = await stopAllProcesses();
          if (result?.success) {
            setError("");
          } else {
            setError(result?.message || "停止失败");
          }
          fetchData(); // Refresh the data
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setGlobalLoading((prev) => ({ ...prev, stopAll: false }));
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  }

  async function handleRestartAll() {
    setConfirmDialog({
      open: true,
      title: "确认重启所有进程",
      message: "确定要重启所有进程吗？",
      onConfirm: async () => {
        try {
          setGlobalLoading((prev) => ({ ...prev, restartAll: true }));
          const result = await restartAllProcesses();
          if (result?.success) {
            setError("");
          } else {
            setError(result?.message || "重启失败");
          }
          fetchData(); // Refresh the data
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setGlobalLoading((prev) => ({ ...prev, restartAll: false }));
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  }

  async function handleAddProcess(config: any) {
    try {
      const result = await addProcess(config);
      if (result?.success) {
        setError("");
        fetchData(); // Refresh the data
      } else {
        setError(result?.message || "添加进程失败");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("添加进程时发生未知错误");
      }
      throw err;
    }
  }

  async function handleUpdateProcess(config: any, processId: number) {
    try {
      const result = await updateProcess(processId, config);
      if (result?.success) {
        setError("");
        fetchData(); // Refresh the data
      } else {
        setError(result?.message || "更新进程失败");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("更新进程时发生未知错误");
      }
      throw err;
    }
  }

  async function handleDeleteProcess(processId: number) {
    setConfirmDialog({
      open: true,
      title: "确认删除进程",
      message: `确定要删除进程 ${processId} 吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          const result = await deleteProcess(processId);
          if (result?.success) {
            setError("");
            fetchData(); // Refresh the data
          } else {
            setError(result?.message || "删除进程失败");
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("删除进程时发生未知错误");
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  }

  return (
    <div className="container mx-auto p-4">
      {/* PM2 Version Info */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">PM2 Manager</h1>
        {pm2Version && (
          <div className={`px-3 py-1 rounded-md text-sm ${
            pm2Version.installed
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}>
            {pm2Version.message}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Processes</p>
                <p className="text-2xl font-bold">{metrics.totalProcesses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{metrics.running}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Errored</p>
                <p className="text-2xl font-bold">{metrics.errored}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Processes</CardTitle>
          <div className="space-x-2">
            <ProcessDialog
              mode="add"
              onSubmit={handleAddProcess}
            />
            <Button
              variant="outline"
              onClick={handleStartAll}
              disabled={globalLoading.startAll}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {globalLoading.startAll ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <PlayIcon className="h-4 w-4 mr-1" />
              )}
              全部启动
            </Button>
            <Button
              variant="outline"
              onClick={handleStopAll}
              disabled={globalLoading.stopAll}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {globalLoading.stopAll ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <StopCircleIcon className="h-4 w-4 mr-1" />
              )}
              全部停止
            </Button>
            <Button
              variant="default"
              onClick={handleRestartAll}
              disabled={globalLoading.restartAll}
            >
              {globalLoading.restartAll ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                "全部重启"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processes.map((process) => (
              <div
                key={process.id}
                className="flex items-center justify-between p-4 border rounded"
              >
                <div>
                  <h3 className="font-medium flex flex-row items-center">
                    <HoverCard>
                      <HoverCardTrigger>
                        <div className="flex items-center">
                          <CircleIcon
                            className={`h-4 w-4 mr-2 ${
                              process.status === "running"
                                ? "text-green-500"
                                : process.status === "errored"
                                ? "text-red-500"
                                : "text-yellow-500"
                            }`}
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm"><strong>Process ID:</strong> {process.id}</p>
                          <p className="text-sm"><strong>PID:</strong> {process.pid}</p>
                          <p className="text-sm"><strong>User:</strong> {process.user}</p>
                          <p className="text-sm"><strong>Auto Start:</strong> {process.autoStart ? "Yes" : "No"}</p>
                          <p className="text-sm"><strong>Script:</strong> {process.script}</p>
                          <p className="text-sm break-all"><strong>Command:</strong> {process.command}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>{" "}
                    {process.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Status: {process.status} | PID: {process.pid} | User: {process.user}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CPU: {process.cpu.toFixed(1)}% | Memory: {(process.memory / 1024 / 1024).toFixed(2)}MB |
                    Auto Start: {process.autoStart ? "✓" : "✗"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    Command: {process.command}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStart(process.id)}
                    disabled={loadingActions[process.id]?.start}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {loadingActions[process.id]?.start ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <PlayIcon className="h-4 w-4 mr-1" />
                    )}
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStop(process.id)}
                    disabled={loadingActions[process.id]?.stop}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {loadingActions[process.id]?.stop ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <StopCircleIcon className="h-4 w-4 mr-1" />
                    )}
                    Stop
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewLogs(process.id)}
                    disabled={loadingActions[process.id]?.viewLogs}
                  >
                    {loadingActions[process.id]?.viewLogs ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      "View Logs"
                    )}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleRestart(process.id)}
                    disabled={loadingActions[process.id]?.restart}
                  >
                    {loadingActions[process.id]?.restart ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      "Restart"
                    )}
                  </Button>
                  <LogViewerModal
                    processId={process.id}
                    processName={process.name}
                    isLogViewerOpen={isLogViewerOpen}
                    setLogViewerOpen={setLogViewerOpen}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs View */}
      {selectedProcess && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Logs for Process {selectedProcess}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Standard Output</h4>
                <pre className="bg-secondary p-4 rounded overflow-x-auto">
                  {logs.stdout.join("\n")}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Standard Error</h4>
                <pre className="bg-secondary p-4 rounded overflow-x-auto">
                  {logs.stderr.join("\n")}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              >
                取消
              </Button>
              <Button
                onClick={confirmDialog.onConfirm}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
