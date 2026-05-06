import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Server, Wifi, WifiOff, ArrowRight } from "lucide-react";
import { saveServerUrl, setApiBase } from "@/lib/config";

interface ServerSetupProps {
  onComplete: () => void;
}

export function ServerSetup({ onComplete }: ServerSetupProps) {
  const [serverHost, setServerHost] = useState("localhost");
  const [serverPort, setServerPort] = useState("8000");
  const [useHttps, setUseHttps] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const buildUrl = () => {
    const protocol = useHttps ? "https" : "http";
    const port = serverPort ? `:${serverPort}` : "";
    return `${protocol}://${serverHost}${port}`;
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult("idle");
    setErrorMessage("");

    const url = buildUrl();

    try {
      const res = await fetch(`${url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        setTestResult("success");
      } else {
        setTestResult("error");
        setErrorMessage(`Server responded with status ${res.status}`);
      }
    } catch (err) {
      setTestResult("error");
      if (err instanceof DOMException && err.name === "TimeoutError") {
        setErrorMessage("Connection timed out. Check the server address and ensure the backend is running.");
      } else {
        setErrorMessage("Could not connect. Verify the server is running and the address is correct.");
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const url = buildUrl();
    try {
      await saveServerUrl(url);
      setApiBase(url);
      onComplete();
    } catch {
      setErrorMessage("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Connect to Server</CardTitle>
          <CardDescription>
            Enter the address of the Archivist server to get started.
            This is the server where the backend and database are hosted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Server Address
            </label>
            <Input
              placeholder="e.g. 192.168.1.100 or archivist.company.local"
              value={serverHost}
              onChange={(e) => {
                setServerHost(e.target.value);
                setTestResult("idle");
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Port
            </label>
            <Input
              placeholder="8000"
              value={serverPort}
              onChange={(e) => {
                setServerPort(e.target.value);
                setTestResult("idle");
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useHttps"
              checked={useHttps}
              onChange={(e) => {
                setUseHttps(e.target.checked);
                setTestResult("idle");
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="useHttps" className="text-sm text-slate-600 dark:text-slate-400">
              Use HTTPS (secure connection)
            </label>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Server URL</span>
            <Badge variant="outline" className="font-mono text-xs">{buildUrl()}</Badge>
          </div>

          {testResult === "success" && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">Connection successful</span>
            </div>
          )}

          {testResult === "error" && (
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Connection failed</span>
              </div>
              {errorMessage && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={testConnection}
              disabled={testing || !serverHost}
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={testResult !== "success" || saving}
            >
              {saving ? "Saving..." : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400">
            You can change this later in Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
