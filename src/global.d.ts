/// <reference types="vite/client" />

/** Bridge exposed by electron/preload.cjs */
interface NcmBridge {
  apiBase: string
  platform: string
  versions: {
    electron: string
    chrome: string
    node: string
  }
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximized: (callback: (maximized: boolean) => void) => () => void
}

declare global {
  interface Window {
    ncm?: NcmBridge
  }
}

export {}
