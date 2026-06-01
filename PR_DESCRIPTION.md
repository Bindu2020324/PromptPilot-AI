## Description

Implements the **File & Code Context Drag-and-Drop** feature. Users can now easily provide extensive context to their prompts by dropping files directly into the extension or selecting them via a new paperclip icon. The extension parses the files using the native `FileReader` API and automatically tracks the token payload size in real-time.

### What's New

**UI Components & Drag Area** (`src/App.jsx`)
- Wrapped the main prompt textarea in a container that listens to `onDragOver`, `onDragLeave`, and `onDrop` events.
- Added a visual overlay with a dashed border and instructional text ("Drop files to append as context") that smoothly appears when hovering a file over the input.
- Added a sleek **Paperclip SVG Button** beneath the prompt area to trigger a native file selector for manual file uploads.

**File Handling Logic** (`src/App.jsx`)
- Integrated the native `FileReader` API via a `handleFiles` function.
- Reads `.js`, `.py`, `.md`, `.txt`, and other text-based files dropped into the extension.
- Automatically formats and appends the file contents directly into the user's prompt using clear demarcation (`--- File: filename.js ---`).
- Real-time token count estimation updates instantly without needing extra API calls, as it inherently reacts to the textarea's state changes.

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Documentation update
- [ ] Refactor

## Testing Done
- ✅ Successfully builds using `npm run build` locally.
- ✅ Tested drag-and-drop mechanism with multiple simultaneous files.
- ✅ Verified paperclip icon file-selector works natively.
- ✅ Validated that the visual dragging overlay functions properly and safely disables browser-default behaviors (which would otherwise navigate away from the extension popup).

## Checklist
- [x] Build passes successfully
- [x] Tested in Chrome manually
- [x] Code follows project guidelines
