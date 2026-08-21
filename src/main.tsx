import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./tauri-api"; // 初始化 Tauri API

// Lets the stylesheet adapt to the native window chrome (see [data-platform]).
document.documentElement.setAttribute(
  "data-platform",
  window.ncm?.platform ?? "",
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
