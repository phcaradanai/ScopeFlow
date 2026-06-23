mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_workspace,
            open_workspace,
            read_file_content,
            write_file_content,
            path_exists,
            create_client,
            list_clients,
            create_project,
            list_projects,
            create_document,
            list_project_documents,
            get_workspace_tree,
            copy_evidence_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
