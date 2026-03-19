use std::path::PathBuf;

use walkdir::WalkDir;

/// Supported image extensions (case-insensitive).
pub const SUPPORTED_EXTENSIONS: &[&str] = &[
    "bmp", "gif", "hdr", "ico", "jpg", "jpeg", "png", "tif", "tiff", "webp",
];

/// Recursively scan directories for image files with supported extensions.
/// Warns on stderr for missing/unreadable directories, continues scanning others.
pub fn scan_directories(dirs: &[PathBuf]) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    for dir in dirs {
        if !dir.is_dir() {
            eprintln!("Warning: '{}' is not a directory, skipping", dir.display());
            continue;
        }

        for entry in WalkDir::new(dir)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            if let Some(ext) = path.extension() {
                let ext_lower = ext.to_string_lossy().to_lowercase();
                if SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str()) {
                    candidates.push(path.to_path_buf());
                }
            }
        }
    }

    candidates
}
