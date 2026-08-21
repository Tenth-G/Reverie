#[cfg(debug_assertions)]
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{webview::PageLoadEvent, AppHandle, Manager, Window};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

// NCM API 服务器进程
struct ApiServer(Mutex<Option<CommandChild>>);

const API_PORT: u16 = 3939;
const API_HOST: &str = "127.0.0.1";

fn sanitize_api_log(line: &[u8]) -> String {
    let text = String::from_utf8_lossy(line);
    let Some(start) = text.find("cookie=") else {
        return text.into_owned();
    };
    let value_start = start + "cookie=".len();
    let value_end = text[value_start..]
        .find('&')
        .map(|offset| value_start + offset)
        .unwrap_or(text.len());
    format!("{}[redacted]{}", &text[..value_start], &text[value_end..])
}

// 窗口控制命令
#[tauri::command]
fn minimize_window(window: Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn maximize_window(window: Window) {
    if window.is_maximized().unwrap() {
        window.unmaximize().unwrap();
    } else {
        window.maximize().unwrap();
    }
}

#[tauri::command]
fn close_window(window: Window) {
    window.close().unwrap();
}

#[tauri::command]
fn is_maximized(window: Window) -> bool {
    window.is_maximized().unwrap_or(false)
}

// 检查端口是否被占用
fn is_port_available(port: u16) -> bool {
    !port_check::is_port_reachable(format!("127.0.0.1:{}", port))
}

// 启动 NCM API 服务器
fn start_ncm_api_server(app: &AppHandle) -> Result<Option<CommandChild>, String> {
    // 检查端口
    if !is_port_available(API_PORT) {
        log::warn!(
            "Port {} already in use, assuming API server is running",
            API_PORT
        );
        return Ok(None);
    }

    #[cfg(debug_assertions)]
    let command = {
        let script = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .ok_or_else(|| "Cannot resolve project root".to_string())?
            .join("sidecar")
            .join("api-server.cjs");
        app.shell().command("node").arg(script)
    };

    #[cfg(not(debug_assertions))]
    let command = app
        .shell()
        .sidecar("reverie-api")
        .map_err(|e| format!("Cannot resolve API sidecar: {e}"))?;

    let (mut events, child) = command
        .env("PORT", API_PORT.to_string())
        .env("HOST", API_HOST)
        .env("PARENT_PID", std::process::id().to_string())
        .spawn()
        .map_err(|e| format!("Failed to start API sidecar: {e}"))?;

    tauri::async_runtime::spawn(async move {
        while let Some(event) = events.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    log::info!("API: {}", sanitize_api_log(&line));
                }
                CommandEvent::Stderr(line) => {
                    log::warn!("API: {}", sanitize_api_log(&line));
                }
                CommandEvent::Error(error) => log::error!("API sidecar error: {error}"),
                CommandEvent::Terminated(payload) => {
                    log::warn!("API sidecar exited with code {:?}", payload.code);
                }
                _ => {}
            }
        }
    });

    log::info!("NCM API server started on {}:{}", API_HOST, API_PORT);
    Ok(Some(child))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .on_page_load(|webview, payload| {
            if payload.event() == PageLoadEvent::Finished {
                if let Err(error) = webview.window().show() {
                    log::error!("Failed to show the main window: {error}");
                }
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 启动 NCM API 服务器
            match start_ncm_api_server(app.handle()) {
                Ok(child) => {
                    app.manage(ApiServer(Mutex::new(child)));
                    log::info!("API server started successfully");
                }
                Err(e) => {
                    log::error!("Failed to start API server: {}", e);
                    return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)));
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            maximize_window,
            close_window,
            is_maximized
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // 清理 API 服务器
                if let Some(api_server) = window.app_handle().try_state::<ApiServer>() {
                    if let Ok(mut child) = api_server.0.lock() {
                        if let Some(process) = child.take() {
                            let _ = process.kill();
                            log::info!("API server stopped");
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
