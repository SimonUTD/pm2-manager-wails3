import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Edit } from "lucide-react";

interface ProcessConfig {
  name: string;
  script: string;
  cwd: string;
  args: string;
  autoStart: boolean;
  instances: number;
}

interface ProcessDialogProps {
  mode: "add" | "edit";
  processId?: number;
  initialData?: Partial<ProcessConfig>;
  onSubmit: (config: ProcessConfig, processId?: number) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function ProcessDialog({
  mode,
  processId,
  initialData,
  onSubmit,
  trigger,
}: ProcessDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<ProcessConfig>({
    name: "",
    script: "",
    cwd: "",
    args: "",
    autoStart: false,
    instances: 1,
  });

  useEffect(() => {
    if (initialData) {
      setConfig({
        name: initialData.name || "",
        script: initialData.script || "",
        cwd: initialData.cwd || "",
        args: initialData.args || "",
        autoStart: initialData.autoStart || false,
        instances: initialData.instances || 1,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!config.name.trim()) {
      setError("进程名称不能为空");
      return;
    }
    if (!config.script.trim()) {
      setError("脚本路径不能为空");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(config, processId);
      setOpen(false);
      // Reset form for add mode
      if (mode === "add") {
        setConfig({
          name: "",
          script: "",
          cwd: "",
          args: "",
          autoStart: false,
          instances: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant={mode === "add" ? "default" : "outline"} size="sm">
      {mode === "add" ? (
        <>
          <Plus className="h-4 w-4 mr-1" />
          添加进程
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-1" />
          编辑
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "添加新进程" : "编辑进程"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">进程名称 *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="my-app"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="script">脚本路径 *</Label>
            <Input
              id="script"
              value={config.script}
              onChange={(e) => setConfig({ ...config, script: e.target.value })}
              placeholder="/path/to/app.js 或 npm start"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cwd">工作目录</Label>
            <Input
              id="cwd"
              value={config.cwd}
              onChange={(e) => setConfig({ ...config, cwd: e.target.value })}
              placeholder="/path/to/project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="args">启动参数</Label>
            <Input
              id="args"
              value={config.args}
              onChange={(e) => setConfig({ ...config, args: e.target.value })}
              placeholder="--port 3000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instances">实例数量</Label>
            <Input
              id="instances"
              type="number"
              min="1"
              value={config.instances}
              onChange={(e) => setConfig({ ...config, instances: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoStart"
              checked={config.autoStart}
              onCheckedChange={(checked) => 
                setConfig({ ...config, autoStart: checked as boolean })
              }
            />
            <Label htmlFor="autoStart">开机自启</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              {mode === "add" ? "添加" : "更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
