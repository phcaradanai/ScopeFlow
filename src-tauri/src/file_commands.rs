use std::fs;
use std::path::Path;

fn file_display_name(path: &Path) -> String {
    path.file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn update_file_content(path: String, content: String) -> Result<(), String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(format!("ไม่พบไฟล์ '{}'", file_display_name(file_path)));
    }

    if !file_path.is_file() {
        return Err(format!("'{}' ไม่ใช่ไฟล์ จึงไม่สามารถอัปเดตได้", file_display_name(file_path)));
    }

    fs::write(file_path, content).map_err(|e| format!("อัปเดตไฟล์ไม่สำเร็จ: {}", e))
}

#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(format!("ไม่พบไฟล์ '{}'", file_display_name(file_path)));
    }

    if !file_path.is_file() {
        return Err(format!("'{}' ไม่ใช่ไฟล์ จึงไม่สามารถลบได้", file_display_name(file_path)));
    }

    fs::remove_file(file_path).map_err(|e| format!("ลบไฟล์ไม่สำเร็จ: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn temp_file_path(name: &str) -> String {
        let mut path = env::temp_dir();
        path.push(format!("scopeflow_file_command_{}_{}.md", name, std::process::id()));
        let _ = fs::remove_file(&path);
        path.to_string_lossy().to_string()
    }

    #[test]
    fn update_file_content_requires_existing_file() {
        let path = temp_file_path("missing_update");
        let result = update_file_content(path, "new content".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn update_file_content_overwrites_existing_file() {
        let path = temp_file_path("update");
        fs::write(&path, "old content").unwrap();

        let result = update_file_content(path.clone(), "new content".to_string());
        assert!(result.is_ok());
        assert_eq!(fs::read_to_string(&path).unwrap(), "new content");

        let _ = fs::remove_file(&path);
    }

    #[test]
    fn delete_file_removes_existing_file() {
        let path = temp_file_path("delete");
        fs::write(&path, "delete me").unwrap();

        let result = delete_file(path.clone());
        assert!(result.is_ok());
        assert!(!Path::new(&path).exists());
    }
}
