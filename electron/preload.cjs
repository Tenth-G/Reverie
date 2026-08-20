"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ncm", {
  apiBase: "http://127.0.0.1:3939",
  platform: process.platform,
  skipUpdate: process.env.REVERIE_SKIP_UPDATE === "1",
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  minimize: () => ipcRenderer.send("win:minimize"),
  maximize: () => ipcRenderer.send("win:maximize"),
  close: () => ipcRenderer.send("win:close"),
  isMaximized: () => ipcRenderer.invoke("win:isMaximized"),
  onMaximized: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("win:maximized", listener);
    return () => ipcRenderer.removeListener("win:maximized", listener);
  },
  // --- update (electron-updater) ---
  checkUpdate: () => ipcRenderer.invoke("update:check"),
  installUpdate: () => ipcRenderer.send("update:install"),
  onUpdateEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("update:event", listener);
    return () => ipcRenderer.removeListener("update:event", listener);
  },
});
