import { getCurrentWindow } from "@tauri-apps/api/window";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

type NativeBridge = NonNullable<Window["ncm"]>;
type UpdateEvent = Parameters<NativeBridge["onUpdateEvent"]>[0] extends (
  event: infer T,
) => void
  ? T
  : never;

const appWindow = getCurrentWindow();
const updateListeners = new Set<(event: UpdateEvent) => void>();
let pendingUpdate: Update | null = null;
let checking = false;
let downloading = false;

function emit(event: UpdateEvent) {
  for (const listener of updateListeners) listener(event);
}

function webviewVersion(): string {
  return navigator.userAgent.match(/(?:Edg|Chrome)\/(\S+)/)?.[1] ?? "unknown";
}

export const ncm: NativeBridge = {
  apiBase: "http://127.0.0.1:3939",
  platform: navigator.platform.toLowerCase().includes("win")
    ? "win32"
    : navigator.platform.toLowerCase().includes("mac")
      ? "darwin"
      : "linux",
  skipUpdate: import.meta.env.DEV,
  versions: {
    runtime: "Tauri 2",
    webview: webviewVersion(),
  },

  minimize: () => appWindow.minimize(),
  maximize: async () => {
    if (await appWindow.isMaximized()) await appWindow.unmaximize();
    else await appWindow.maximize();
  },
  close: () => appWindow.close(),
  isMaximized: () => appWindow.isMaximized(),
  onMaximized: (callback) => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void appWindow
      .onResized(async () => callback(await appWindow.isMaximized()))
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  },

  checkUpdate: async (manual = false) => {
    if (import.meta.env.DEV) return { ok: false, reason: "development" };
    if (checking || downloading) return { ok: false, reason: "busy" };

    checking = true;
    emit({ type: "checking", data: { manual } });
    try {
      await pendingUpdate?.close();
      pendingUpdate = await check({ timeout: 15000 });
      if (!pendingUpdate) {
        emit({ type: "not-available", data: { manual } });
        return { ok: true };
      }
      emit({
        type: "available",
        data: {
          version: pendingUpdate.version,
          notes: pendingUpdate.body ?? "",
          manual,
        },
      });
      return { ok: true };
    } catch (error) {
      emit({ type: "error", data: { manual, message: String(error) } });
      return { ok: false, reason: "check-failed" };
    } finally {
      checking = false;
    }
  },

  downloadUpdate: async () => {
    if (!pendingUpdate) return { ok: false, reason: "no-update" };
    if (downloading) return { ok: false, reason: "busy" };

    downloading = true;
    let transferred = 0;
    let total = 0;
    let lastBytes = 0;
    let lastTime = performance.now();
    try {
      await pendingUpdate.download((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
          return;
        }
        if (event.event !== "Progress") return;

        transferred += event.data.chunkLength;
        const now = performance.now();
        const elapsed = Math.max(1, now - lastTime);
        const speed = ((transferred - lastBytes) * 1000) / elapsed;
        lastBytes = transferred;
        lastTime = now;
        emit({
          type: "progress",
          data: {
            percent: total
              ? Math.min(100, Math.round((transferred / total) * 100))
              : 0,
            transferred,
            total,
            speed,
          },
        });
      });
      emit({ type: "downloaded" });
      return { ok: true };
    } catch (error) {
      emit({ type: "error", data: { message: String(error) } });
      return { ok: false, reason: "download-failed" };
    } finally {
      downloading = false;
    }
  },

  installUpdate: async () => {
    if (!pendingUpdate) return;
    try {
      await pendingUpdate.install();
      await relaunch();
    } catch (error) {
      emit({ type: "error", data: { message: String(error) } });
    }
  },
  onUpdateEvent: (callback) => {
    updateListeners.add(callback);
    return () => updateListeners.delete(callback);
  },
};

window.ncm = ncm;
