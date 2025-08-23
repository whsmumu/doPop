// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

// ... outras importações

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())  // <<< ADICIONE ESTA LINHA AQUI
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
        // ... resto do arquivo
        .invoke_handler(tauri::generate_handler![greet, get_platform])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // IMPORTANTE: Remover essa linha que estava causando o fundo branco
            // window.set_background_color(None).unwrap();
            
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                
                // OPÇÃO 1: Sempre manter ativo (mesmo quando perde foco)
                apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::Menu,
                    Some(NSVisualEffectState::Active), // Sempre Active = sempre mesmo visual
                    Some(6.0)
                ).expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
                
                // OPÇÃO 2: Se quiser que mude quando perde foco, use:
                // Some(NSVisualEffectState::FollowsWindowActiveState)
                
                // MATERIAIS DISPONÍVEIS para testar:
                // NSVisualEffectMaterial::Menu (atual - bom balance)
                // NSVisualEffectMaterial::Popover (mais transparente)
                // NSVisualEffectMaterial::Sidebar (menos transparente)
                // NSVisualEffectMaterial::HeaderView (muito transparente)
            }
            
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_acrylic;
                apply_acrylic(&window, Some((18, 18, 18, 125)))
                    .expect("Acrylic not supported on this Windows version");
            }

            #[cfg(target_os = "linux")]
            {
                use window_vibrancy::apply_blur;
                apply_blur(&window, Some((18, 18, 18, 125))) // Cinza escuro semi-transparente
                    .expect("Blur not supported on this Linux version");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    
    Ok(())
}