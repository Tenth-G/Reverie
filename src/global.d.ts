/// <reference types="vite/client" />

/** Bridge exposed by electron/preload.cjs */
interface NcmBridge {
  apiBase: string;
  platform: string;
  /** True when launched with REVERIE_SKIP_UPDATE=1 (used by e2e tests). */
  skipUpdate: boolean;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximized: (callback: (maximized: boolean) => void) => () => void;
  /** Trigger a manual update check (electron-updater). */
  checkUpdate: () => Promise<{ ok: boolean; reason?: string }>;
  /** Quit the app and install the downloaded update. */
  installUpdate: () => void;
  /** Subscribe to updater events pushed from the main process. */
  onUpdateEvent: (
    callback: (event: {
      type:
        | "checking"
        | "available"
        | "not-available"
        | "progress"
        | "downloaded"
        | "error";
      data?: unknown;
    }) => void,
  ) => () => void;
}

declare global {
  interface Window {
    ncm?: NcmBridge;
  }
  /** App version injected by Vite (see vite.config.ts). */
  const __APP_VERSION__: string;
}

export {};
