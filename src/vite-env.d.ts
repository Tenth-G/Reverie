/// <reference types="vite/client" />

interface Window {
  ncm?: {
    apiBase: string
    platform: string
    versions: { electron: string; chrome: string; node: string }
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    onMaximized: (callback: (maximized: boolean) => void) => () => void
  }
}
