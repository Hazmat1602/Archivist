let _serverUrl: string | null = null;
let _configured: boolean | null = null;

export function isElectron(): boolean {
  return !!window.electronAPI?.isElectron;
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
  if (!window.electronAPI) return;
  const config = await window.electronAPI.getConfig();
  if (config.serverUrl) {
    _serverUrl = config.serverUrl;
    _configured = true;
  } else {
    _configured = false;
  }
}

export async function saveServerUrl(url: string): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.saveConfig({ serverUrl: url });
  }
  _serverUrl = url;
  _configured = true;
}

export function isServerConfigured(): boolean {
  if (!isElectron()) return true;
  return _configured === true;
}
