// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut("Shift+CmdOrCtrl+T")?
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            match window.is_visible() {
                                Ok(true) => {
                                    let _ = window.hide();
                                }
                                Ok(false) => {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                                Err(_) => {}
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet, get_platform])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                
                // Apply native macOS vibrancy effect with Menu material and custom radius
                apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::Menu,
                    Some(NSVisualEffectState::Active),
                    Some(6.0)
                ).expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
            }
            
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_acrylic;
                apply_acrylic(&window, Some((0x00, 0x00, 0x00, 0x80)))
                    .expect("Acrylic not supported on this Windows version");
            }

            #[cfg(target_os = "linux")]
            {
                use window_vibrancy::apply_blur;
                apply_blur(&window, Some((0, 0, 0, 128)))
                    .expect("Blur not supported on this Linux version");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    
    Ok(())
}
