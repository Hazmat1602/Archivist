const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

  getConfig: () => ipcRenderer.invoke("get-config"),

  saveConfig: (config) => ipcRenderer.invoke("save-config", config),

  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
});
