use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// ─── Data Structures ────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClientSummary {
    pub id: String,
    pub name: String,
    pub contact_person: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub project_type: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentInfo {
    pub path: String,
    pub filename: String,
    pub folder: String,
}

// ─── Workspace Commands ─────────────────────────────────────────

#[tauri::command]
pub fn create_workspace(path: String, name: String, config_content: String) -> Result<(), String> {
    let base = Path::new(&path);

    // Create workspace directory if it doesn't exist
    fs::create_dir_all(base).map_err(|e| format!("สร้างโฟลเดอร์ workspace ไม่สำเร็จ: {}", e))?;

    // Create sub-directories
    fs::create_dir_all(base.join("clients"))
        .map_err(|e| format!("สร้างโฟลเดอร์ clients ไม่สำเร็จ: {}", e))?;
    fs::create_dir_all(base.join("templates"))
        .map_err(|e| format!("สร้างโฟลเดอร์ templates ไม่สำเร็จ: {}", e))?;
    fs::create_dir_all(base.join(".scopeflow"))
        .map_err(|e| format!("สร้างโฟลเดอร์ .scopeflow ไม่สำเร็จ: {}", e))?;

    // Write scopeflow.yaml
    let config_path = base.join("scopeflow.yaml");
    fs::write(&config_path, &config_content)
        .map_err(|e| format!("เขียนไฟล์ scopeflow.yaml ไม่สำเร็จ: {}", e))?;

    // Write initial state.json
    let state_path = base.join(".scopeflow").join("state.json");
    fs::write(
        &state_path,
        serde_json::json!({
            "last_opened": name,
            "sidebar_collapsed": false
        })
        .to_string(),
    )
    .map_err(|e| format!("เขียนไฟล์ state.json ไม่สำเร็จ: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn open_workspace(path: String) -> Result<String, String> {
    let config_path = Path::new(&path).join("scopeflow.yaml");
    if !config_path.exists() {
        return Err("ไม่พบไฟล์ scopeflow.yaml ในโฟลเดอร์นี้ — ไม่ใช่ ScopeFlow workspace".to_string());
    }
    fs::read_to_string(&config_path)
        .map_err(|e| format!("อ่านไฟล์ scopeflow.yaml ไม่สำเร็จ: {}", e))
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("อ่านไฟล์ไม่สำเร็จ: {}", e))
}

#[tauri::command]
pub fn write_file_content(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("สร้างโฟลเดอร์ไม่สำเร็จ: {}", e))?;
    }
    fs::write(&path, &content).map_err(|e| format!("เขียนไฟล์ไม่สำเร็จ: {}", e))
}

#[tauri::command]
pub fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

// ─── Client Commands ────────────────────────────────────────────

#[tauri::command]
pub fn create_client(
    workspace_path: String,
    client_id: String,
    client_yaml: String,
) -> Result<(), String> {
    let client_dir = Path::new(&workspace_path)
        .join("clients")
        .join(&client_id);

    if client_dir.exists() {
        return Err(format!("ลูกค้า '{}' มีอยู่แล้ว", client_id));
    }

    // Create client directory
    fs::create_dir_all(&client_dir)
        .map_err(|e| format!("สร้างโฟลเดอร์ลูกค้าไม่สำเร็จ: {}", e))?;

    // Create projects directory
    fs::create_dir_all(client_dir.join("projects"))
        .map_err(|e| format!("สร้างโฟลเดอร์ projects ไม่สำเร็จ: {}", e))?;

    // Write _client.yaml
    fs::write(client_dir.join("_client.yaml"), &client_yaml)
        .map_err(|e| format!("เขียนไฟล์ _client.yaml ไม่สำเร็จ: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn list_clients(workspace_path: String) -> Result<Vec<ClientSummary>, String> {
    let clients_dir = Path::new(&workspace_path).join("clients");
    if !clients_dir.exists() {
        return Ok(vec![]);
    }

    let mut clients = Vec::new();
    let entries = fs::read_dir(&clients_dir)
        .map_err(|e| format!("อ่านโฟลเดอร์ clients ไม่สำเร็จ: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("อ่านรายการไม่สำเร็จ: {}", e))?;
        let path = entry.path();
        if path.is_dir() {
            let client_yaml = path.join("_client.yaml");
            if client_yaml.exists() {
                let content = fs::read_to_string(&client_yaml).unwrap_or_default();
                // Simple YAML parsing for name and contact_person
                let name = extract_yaml_value(&content, "name");
                let contact = extract_yaml_value(&content, "contact_person");
                let id = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                clients.push(ClientSummary {
                    id,
                    name,
                    contact_person: contact,
                });
            }
        }
    }

    clients.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(clients)
}

// ─── Project Commands ───────────────────────────────────────────

#[tauri::command]
pub fn create_project(
    workspace_path: String,
    client_id: String,
    project_id: String,
    project_yaml: String,
    project_type: String,
    current_system_files: Option<Vec<(String, String)>>,
) -> Result<(), String> {
    let project_dir = Path::new(&workspace_path)
        .join("clients")
        .join(&client_id)
        .join("projects")
        .join(&project_id);

    if project_dir.exists() {
        return Err(format!("โครงการ '{}' มีอยู่แล้ว", project_id));
    }

    // Create project directory and all subfolders
    let subfolders = [
        "baseline",
        "change-requests",
        "support-requests",
        "approvals",
        "acceptance",
        "exports",
        "attachments",
    ];

    for folder in &subfolders {
        fs::create_dir_all(project_dir.join(folder))
            .map_err(|e| format!("สร้างโฟลเดอร์ {} ไม่สำเร็จ: {}", folder, e))?;
    }

    // Create current-system folder for maintenance/support projects
    if project_type == "maintenance" || project_type == "support-contract" {
        fs::create_dir_all(project_dir.join("current-system"))
            .map_err(|e| format!("สร้างโฟลเดอร์ current-system ไม่สำเร็จ: {}", e))?;

        // Write current-system template files
        if let Some(files) = current_system_files {
            for (filename, content) in files {
                fs::write(project_dir.join("current-system").join(&filename), &content)
                    .map_err(|e| {
                        format!("เขียนไฟล์ current-system/{} ไม่สำเร็จ: {}", filename, e)
                    })?;
            }
        }
    }

    // Write _project.yaml
    fs::write(project_dir.join("_project.yaml"), &project_yaml)
        .map_err(|e| format!("เขียนไฟล์ _project.yaml ไม่สำเร็จ: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn list_projects(
    workspace_path: String,
    client_id: String,
) -> Result<Vec<ProjectSummary>, String> {
    let projects_dir = Path::new(&workspace_path)
        .join("clients")
        .join(&client_id)
        .join("projects");

    if !projects_dir.exists() {
        return Ok(vec![]);
    }

    let mut projects = Vec::new();
    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("อ่านโฟลเดอร์ projects ไม่สำเร็จ: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("อ่านรายการไม่สำเร็จ: {}", e))?;
        let path = entry.path();
        if path.is_dir() {
            let project_yaml = path.join("_project.yaml");
            if project_yaml.exists() {
                let content = fs::read_to_string(&project_yaml).unwrap_or_default();
                let name = extract_yaml_value(&content, "name");
                let ptype = extract_yaml_value(&content, "type");
                let status = extract_yaml_value(&content, "status");
                let id = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                projects.push(ProjectSummary {
                    id,
                    name,
                    project_type: ptype,
                    status,
                });
            }
        }
    }

    projects.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(projects)
}

// ─── Document Commands ──────────────────────────────────────────

#[tauri::command]
pub fn create_document(path: String, content: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if file_path.exists() {
        return Err(format!(
            "ไฟล์ '{}' มีอยู่แล้ว",
            file_path.file_name().unwrap_or_default().to_string_lossy()
        ));
    }

    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("สร้างโฟลเดอร์ไม่สำเร็จ: {}", e))?;
    }

    fs::write(file_path, &content).map_err(|e| format!("เขียนไฟล์ไม่สำเร็จ: {}", e))
}

#[tauri::command]
pub fn copy_evidence_files(source_paths: Vec<String>, target_dir: String) -> Result<Vec<String>, String> {
    let t_dir = Path::new(&target_dir);
    if !t_dir.exists() {
        fs::create_dir_all(t_dir).map_err(|e| format!("สร้างโฟลเดอร์ attachments ไม่สำเร็จ: {}", e))?;
    }

    let mut copied_filenames = Vec::new();

    for src_str in source_paths {
        let src_path = Path::new(&src_str);
        if !src_path.exists() || !src_path.is_file() {
            continue;
        }

        let original_name = src_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let mut target_path = t_dir.join(&original_name);
        let mut final_name = original_name.clone();

        // Handle duplicate names by adding a suffix
        let mut counter = 1;
        while target_path.exists() {
            let stem = src_path.file_stem().unwrap_or_default().to_string_lossy();
            let ext = src_path.extension().unwrap_or_default().to_string_lossy();
            if ext.is_empty() {
                final_name = format!("{}-{}", stem, counter);
            } else {
                final_name = format!("{}-{}.{}", stem, counter, ext);
            }
            target_path = t_dir.join(&final_name);
            counter += 1;
        }

        fs::copy(src_path, &target_path)
            .map_err(|e| format!("คัดลอกไฟล์ไม่สำเร็จ ({}): {}", final_name, e))?;
        
        copied_filenames.push(final_name);
    }

    Ok(copied_filenames)
}

#[tauri::command]
pub fn list_project_documents(
    workspace_path: String,
    client_id: String,
    project_id: String,
) -> Result<Vec<DocumentInfo>, String> {
    let project_dir = Path::new(&workspace_path)
        .join("clients")
        .join(&client_id)
        .join("projects")
        .join(&project_id);

    if !project_dir.exists() {
        return Ok(vec![]);
    }

    let doc_folders = [
        "baseline",
        "change-requests",
        "support-requests",
        "acceptance",
    ];

    let mut docs = Vec::new();

    for folder in &doc_folders {
        let folder_path = project_dir.join(folder);
        if folder_path.exists() {
            if let Ok(entries) = fs::read_dir(&folder_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension() {
                            if ext == "md" {
                                docs.push(DocumentInfo {
                                    path: path.to_string_lossy().to_string(),
                                    filename: path
                                        .file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .to_string(),
                                    folder: folder.to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    docs.sort_by(|a, b| a.filename.cmp(&b.filename));
    Ok(docs)
}

// ─── Sidebar Tree ───────────────────────────────────────────────

#[tauri::command]
pub fn get_workspace_tree(workspace_path: String) -> Result<FileEntry, String> {
    let base = Path::new(&workspace_path);
    if !base.exists() {
        return Err("workspace ไม่มีอยู่".to_string());
    }

    let config_path = base.join("scopeflow.yaml");
    let workspace_name = if config_path.exists() {
        let content = fs::read_to_string(&config_path).unwrap_or_default();
        extract_yaml_value(&content, "name")
    } else {
        base.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    };

    let mut root = FileEntry {
        name: workspace_name,
        path: workspace_path.clone(),
        is_dir: true,
        children: Some(Vec::new()),
    };

    // Build client tree
    let clients_dir = base.join("clients");
    if clients_dir.exists() {
        if let Ok(entries) = fs::read_dir(&clients_dir) {
            let mut client_entries: Vec<FileEntry> = Vec::new();
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() && path.join("_client.yaml").exists() {
                    let client_yaml =
                        fs::read_to_string(path.join("_client.yaml")).unwrap_or_default();
                    let client_name = extract_yaml_value(&client_yaml, "name");
                    let client_id = path
                        .file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();

                    let mut client_node = FileEntry {
                        name: if client_name.is_empty() {
                            client_id
                        } else {
                            client_name
                        },
                        path: path.to_string_lossy().to_string(),
                        is_dir: true,
                        children: Some(Vec::new()),
                    };

                    // Build project tree for this client
                    let projects_dir = path.join("projects");
                    if projects_dir.exists() {
                        if let Ok(proj_entries) = fs::read_dir(&projects_dir) {
                            let mut project_nodes: Vec<FileEntry> = Vec::new();
                            for proj_entry in proj_entries.flatten() {
                                let proj_path = proj_entry.path();
                                if proj_path.is_dir()
                                    && proj_path.join("_project.yaml").exists()
                                {
                                    let proj_yaml = fs::read_to_string(
                                        proj_path.join("_project.yaml"),
                                    )
                                    .unwrap_or_default();
                                    let proj_name = extract_yaml_value(&proj_yaml, "name");
                                    let proj_id = proj_path
                                        .file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .to_string();

                                    // List documents in this project
                                    let mut doc_nodes: Vec<FileEntry> = Vec::new();
                                    for folder in &[
                                        "baseline",
                                        "change-requests",
                                        "support-requests",
                                        "acceptance",
                                    ] {
                                        let folder_path = proj_path.join(folder);
                                        if folder_path.exists() {
                                            if let Ok(doc_entries) =
                                                fs::read_dir(&folder_path)
                                            {
                                                for doc_entry in doc_entries.flatten() {
                                                    let doc_path = doc_entry.path();
                                                    if doc_path.is_file() {
                                                        if let Some(ext) = doc_path.extension()
                                                        {
                                                            if ext == "md" || ext == "yaml" {
                                                                let fname = doc_path
                                                                    .file_name()
                                                                    .unwrap_or_default()
                                                                    .to_string_lossy()
                                                                    .to_string();
                                                                // Skip _project.yaml
                                                                if !fname.starts_with('_') {
                                                                    doc_nodes.push(FileEntry {
                                                                        name: fname,
                                                                        path: doc_path
                                                                            .to_string_lossy()
                                                                            .to_string(),
                                                                        is_dir: false,
                                                                        children: None,
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    doc_nodes.sort_by(|a, b| a.name.cmp(&b.name));

                                    project_nodes.push(FileEntry {
                                        name: if proj_name.is_empty() {
                                            proj_id
                                        } else {
                                            proj_name
                                        },
                                        path: proj_path.to_string_lossy().to_string(),
                                        is_dir: true,
                                        children: Some(doc_nodes),
                                    });
                                }
                            }
                            project_nodes.sort_by(|a, b| a.name.cmp(&b.name));
                            client_node.children = Some(project_nodes);
                        }
                    }

                    client_entries.push(client_node);
                }
            }
            client_entries.sort_by(|a, b| a.name.cmp(&b.name));
            root.children = Some(client_entries);
        }
    }

    Ok(root)
}

// ─── Helpers ────────────────────────────────────────────────────

/// Extract a value from YAML content by key name (simple line-based parsing)
/// This avoids pulling in a full YAML parser dependency
fn extract_yaml_value(content: &str, key: &str) -> String {
    for line in content.lines() {
        let trimmed = line.trim();
        // Match "key: value" or "  key: value"
        if let Some(rest) = trimmed.strip_prefix(&format!("{}:", key)) {
            let val = rest.trim();
            // Remove surrounding quotes
            if (val.starts_with('"') && val.ends_with('"'))
                || (val.starts_with('\'') && val.ends_with('\''))
            {
                return val[1..val.len() - 1].to_string();
            }
            return val.to_string();
        }
    }
    String::new()
}

// ─── Tests ──────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs;

    fn get_temp_dir(test_name: &str) -> String {
        let mut temp_dir = env::temp_dir();
        temp_dir.push(format!("scopeflow_test_{}", test_name));
        // Ensure clean state
        let _ = fs::remove_dir_all(&temp_dir);
        temp_dir.to_string_lossy().to_string()
    }

    #[test]
    fn test_create_workspace() {
        let temp_dir = get_temp_dir("workspace");
        
        let result = create_workspace(
            temp_dir.clone(),
            "Test Workspace".to_string(),
            "workspace:\n  name: \"Test Workspace\"\n".to_string(),
        );

        assert!(result.is_ok());

        let base = Path::new(&temp_dir);
        assert!(base.join("clients").exists());
        assert!(base.join("templates").exists());
        assert!(base.join(".scopeflow").exists());
        assert!(base.join("scopeflow.yaml").exists());
        assert!(base.join(".scopeflow/state.json").exists());
    }

    #[test]
    fn test_create_client_and_project() {
        let temp_dir = get_temp_dir("client_project");
        let _ = create_workspace(temp_dir.clone(), "W".to_string(), "".to_string());

        // Create client
        let client_result = create_client(
            temp_dir.clone(),
            "client-1".to_string(),
            "client:\n  name: \"Test Client\"\n".to_string(),
        );
        assert!(client_result.is_ok());

        let client_dir = Path::new(&temp_dir).join("clients").join("client-1");
        assert!(client_dir.join("_client.yaml").exists());
        assert!(client_dir.join("projects").exists());

        // Create project
        let project_result = create_project(
            temp_dir.clone(),
            "client-1".to_string(),
            "proj-1".to_string(),
            "project:\n  name: \"Test Project\"\n".to_string(),
            "new-project".to_string(),
            None,
        );
        assert!(project_result.is_ok());

        let project_dir = client_dir.join("projects").join("proj-1");
        assert!(project_dir.join("_project.yaml").exists());
        assert!(project_dir.join("baseline").exists());
        assert!(project_dir.join("change-requests").exists());
    }

    #[test]
    fn test_create_document_and_overwrite_protection() {
        let temp_dir = get_temp_dir("docs");
        let doc_path = Path::new(&temp_dir).join("test-doc.md");
        let doc_path_str = doc_path.to_string_lossy().to_string();

        let result1 = create_document(doc_path_str.clone(), "# Test".to_string());
        assert!(result1.is_ok());
        assert!(doc_path.exists());

        // Trying to create it again should fail (overwrite protection)
        let result2 = create_document(doc_path_str, "# Test 2".to_string());
        assert!(result2.is_err());
        assert_eq!(
            result2.unwrap_err(),
            "ไฟล์ 'test-doc.md' มีอยู่แล้ว".to_string()
        );
    }

    #[test]
    fn test_workspace_reconstruction_without_state() {
        let temp_dir = get_temp_dir("workspace_reconstruct");
        
        // Setup initial workspace
        let _ = create_workspace(
            temp_dir.clone(),
            "W".to_string(),
            "workspace:\n  name: \"Test Workspace\"\n".to_string(),
        );

        // Create client and project
        let _ = create_client(
            temp_dir.clone(),
            "client-1".to_string(),
            "client:\n  name: \"Test Client\"\n".to_string(),
        );
        let _ = create_project(
            temp_dir.clone(),
            "client-1".to_string(),
            "proj-1".to_string(),
            "project:\n  name: \"Test Project\"\n".to_string(),
            "new-project".to_string(),
            None,
        );

        // Create a document
        let doc_path = Path::new(&temp_dir)
            .join("clients")
            .join("client-1")
            .join("projects")
            .join("proj-1")
            .join("baseline")
            .join("scope-v1.0.md");
        let _ = create_document(doc_path.to_string_lossy().to_string(), "# Scope".to_string());

        // Now delete the .scopeflow directory
        let scopeflow_dir = Path::new(&temp_dir).join(".scopeflow");
        assert!(scopeflow_dir.exists());
        let _ = fs::remove_dir_all(scopeflow_dir);

        // Calling get_workspace_tree should still reconstruct the full tree correctly
        let result = get_workspace_tree(temp_dir.clone());
        assert!(result.is_ok());

        let root = result.unwrap();
        assert_eq!(root.name, "Test Workspace");
        
        let clients = root.children.unwrap();
        assert_eq!(clients.len(), 1);
        assert_eq!(clients[0].name, "Test Client");

        let projects = clients[0].children.clone().unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].name, "Test Project");

        let docs = projects[0].children.clone().unwrap();
        // Since we ignore _project.yaml, we should have 1 doc (scope-v1.0.md)
        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].name, "scope-v1.0.md");
    }

    #[test]
    fn test_copy_evidence_files() {
        let temp_dir = get_temp_dir("evidence_files");
        
        let attachments_dir = Path::new(&temp_dir).join("attachments");
        fs::create_dir_all(&attachments_dir).unwrap();

        // Create a dummy source file
        let source_file = Path::new(&temp_dir).join("dummy.jpg");
        fs::write(&source_file, "dummy content").unwrap();

        // Copy it
        let result = copy_evidence_files(
            vec![source_file.to_string_lossy().to_string()],
            attachments_dir.to_string_lossy().to_string()
        );

        assert!(result.is_ok());
        let copied_files = result.unwrap();
        assert_eq!(copied_files.len(), 1);
        assert_eq!(copied_files[0], "dummy.jpg");
        assert!(attachments_dir.join("dummy.jpg").exists());
        
        // Ensure original is NOT deleted
        assert!(source_file.exists());

        // Copy again to test renaming
        let result2 = copy_evidence_files(
            vec![source_file.to_string_lossy().to_string()],
            attachments_dir.to_string_lossy().to_string()
        );
        assert!(result2.is_ok());
        let copied_files2 = result2.unwrap();
        assert_eq!(copied_files2.len(), 1);
        assert!(copied_files2[0].starts_with("dummy-") && copied_files2[0].ends_with(".jpg"));
        assert!(attachments_dir.join(&copied_files2[0]).exists());
    }
}

