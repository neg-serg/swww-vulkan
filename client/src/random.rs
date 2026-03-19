use std::path::{Path, PathBuf};

// Re-export scan_directories from common crate
pub use wl_common::scan::scan_directories;

/// Pick a random element from candidates using OS randomness.
pub fn pick_random(candidates: &[PathBuf]) -> &Path {
    assert!(!candidates.is_empty(), "pick_random called with empty list");
    let mut buf = [0u8; 8];
    getrandom::getrandom(&mut buf).expect("failed to get random bytes");
    let index = u64::from_ne_bytes(buf) as usize % candidates.len();
    &candidates[index]
}

/// Copy a wallpaper image to the greeter cache path.
/// Creates parent directories as needed. Non-fatal: errors are printed to stderr.
pub fn greeter_sync(source: &Path, dest: &Path) {
    if let Some(parent) = dest.parent()
        && let Err(e) = std::fs::create_dir_all(parent)
    {
        eprintln!("Warning: failed to create greeter cache directory: {e}");
        return;
    }
    if let Err(e) = std::fs::copy(source, dest) {
        eprintln!("Warning: failed to sync greeter wallpaper: {e}");
    }
}

/// Write the wallpaper absolute path to a notification file.
/// Creates parent directories as needed. Non-fatal: errors are printed to stderr.
pub fn write_notify(wallpaper_path: &Path, notify_file: &Path) {
    if let Some(parent) = notify_file.parent()
        && let Err(e) = std::fs::create_dir_all(parent)
    {
        eprintln!("Warning: failed to create notify file directory: {e}");
        return;
    }
    let abs_path = wallpaper_path
        .canonicalize()
        .unwrap_or_else(|_| wallpaper_path.to_path_buf());
    if let Err(e) = std::fs::write(notify_file, abs_path.to_string_lossy().as_bytes()) {
        eprintln!("Warning: failed to write notification file: {e}");
    }
}
