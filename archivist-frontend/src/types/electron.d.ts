interface ElectronAPI {
  isElectron: boolean;
  getConfig: () => Promise<{ serverUrl?: string }>;
  saveConfig: (config: { serverUrl: string }) => Promise<{ serverUrl: string }>;
  getConfigPath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
