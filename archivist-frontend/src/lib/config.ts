let _serverUrl: string | null = null;
let _configured: boolean | null = null;

export function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export function getApiBase(): string {
  if (_serverUrl) return _serverUrl;
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export function setApiBase(url: string): void {
  _serverUrl = url;
  _configured = true;
}

export async function loadConfig(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const config = await invoke<{ server_url: string | null }>("get_config");
    if (config.server_url) {
      _serverUrl = config.server_url;
      _configured = true;
    } else {
      _configured = false;
    }
  } catch {
    _configured = false;
  }
}

export async function saveServerUrl(url: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_config", { serverUrl: url });
  }
  _serverUrl = url;
  _configured = true;
}

export function isServerConfigured(): boolean {
  if (!isTauri()) return true;
  return _configured === true;
}
