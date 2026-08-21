import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import "./index.css";
import "./tauri-api"; // 初始化 Tauri API

// Lets the stylesheet adapt to the native window chrome (see [data-platform]).
document.documentElement.setAttribute(
  "data-platform",
  window.ncm?.platform ?? "",
);

const root = createRoot(document.getElementById("root")!);
flushSync(() => root.render(<App />));
