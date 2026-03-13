# Data Model: random-wallpaper

**Branch**: `7-random-wallpaper` | **Date**: 2026-03-13

## Entities

### WallpaperCandidate

Represents a file discovered during directory scanning that matches supported image extensions.

| Field | Type | Description |
|-------|------|-------------|
| path | Absolute file path | Full path to the image file |
| extension | String (lowercase) | File extension used for format filtering |

**Validation**: Extension must be one of: bmp, gif, hdr, ico, jpg, jpeg, png, tif, tiff, webp (case-insensitive comparison).

### RandomOptions

CLI options specific to the `random` subcommand.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| directories | List of paths | (required) | One or more directories to scan recursively |
| greeter_sync | Boolean | true | Whether to copy wallpaper to greeter cache |
| greeter_path | File path | ~/.cache/greeter-wallpaper | Destination for greeter wallpaper copy |
| notify | Boolean | true | Whether to write wallpaper path to notification file |
| notify_path | File path | ~/.cache/quickshell-wallpaper-path | Destination for notification file |

### Inherited from Img Command

The `random` subcommand reuses all transition parameters from the existing `Img` command without modification:

- `outputs` — target output names (default: all)
- `resize` — scaling strategy (crop/fit/no)
- `transition_type`, `transition_duration`, `transition_step`, `transition_fps`
- `transition_angle`, `transition_pos`, `transition_bezier`, `transition_wave`
- `upscale`, `upscale_cmd`, `upscale_scale`

These are passed through directly to `IpcCommand::Img` — no new IPC types needed.

## State Transitions

```
[Start] → Scan directories → Filter by extension → Collect candidates
    ↓
[No candidates?] → Error exit (code 1)
    ↓
[Has candidates] → Random selection → Resolve absolute path
    ↓
[Daemon running?] → No → Auto-start daemon → Wait for socket
    ↓
[Daemon ready] → Send IpcCommand::Img with selected path
    ↓
[Apply success] → Run post-hooks (if enabled):
    ├── Greeter sync: copy file to greeter_path
    └── Notify: write absolute path to notify_path
    ↓
[Done] → Exit 0
```

## No New IPC Types

The daemon receives a standard `IpcCommand::Img` — it does not know or care that the image was randomly selected. All randomness and hook logic is client-side.
