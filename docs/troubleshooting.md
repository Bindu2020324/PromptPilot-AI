# Troubleshooting Guide

This document helps users and contributors debug common runtime, build, installation, and local environment issues for PromptPilot AI.

## 1. Runtime engine failures

### 1.1. Extension fails to load or crashes immediately

Typical indicators:
- extension does not appear in the browser extension list
- browser shows a failed manifest or invalid extension package
- console errors point to `manifest.json` or `background.js`

Solutions:
- verify `manifest.json` exists at the project root and is valid JSON
- ensure `dist/` is built before loading as an unpacked extension
- confirm the browser is using the correct extension folder (not the source root)
- use the browser developer console to inspect flags and error messages

### 1.2. Runtime errors from `content.js` or `background.js`

Typical indicators:
- `TypeError`, `ReferenceError`, or `Uncaught SyntaxError`
- content script fails to inject into the page
- background script disconnects or refuses to start

Solutions:
- run `npm run build` and inspect the build output for syntax issues
- verify that `manifest.json` permissions match the pages you expect to use
- check for unsupported Chrome/Edge extension APIs if using an older browser version

## 2. Environment misconfiguration

### 2.1. Node or npm version mismatch

Typical indicators:
- `npm install` fails with `unsupported engine` or `EBADENGINE`
- `npm run build` fails early with compiler or module errors

Solutions:
- use Node.js 14+ as required by the repository
- run `node -v` and `npm -v` to confirm versions
- if using `nvm`, switch to a compatible version with `nvm use 14`

### 2.2. Missing dependencies or corrupted `node_modules`

Typical indicators:
- `Cannot find module 'react'` or other dependency import failures
- build output references missing package files
- `npm install` finishes with warnings or incomplete installs

Solutions:
- delete `node_modules/` and reinstall: `rm -rf node_modules package-lock.json` then `npm install`
- verify `package-lock.json` and `package.json` are consistent
- if using Windows, run `npm install` from a PowerShell or terminal with administrative privileges when necessary

## 3. Build-step errors

### 3.1. Vite build fails

Typical indicators:
- errors from `vite build` or `npm run build`
- plugin or loader failures during bundling
- unresolved import paths or asset errors

Solutions:
- run `npm run build` and examine the first failure message carefully
- ensure source files use valid file paths and supported import syntax
- check `vite.config.js` for incorrect alias or plugin configuration

### 3.2. Output missing expected files

Typical indicators:
- `dist/` is created but missing `manifest.json` or `index.html`
- browser cannot load the unpacked extension because necessary files are absent

Solutions:
- confirm build output is written to the expected `dist/` directory
- if needed, copy `manifest.json` manually to `dist/` as part of the build or packaging process
- review the repository `package.json` build scripts for any custom output paths

## 4. Installation problems

### 4.1. Extension not loading in browser

Typical indicators:
- browser reports "Could not load extension"
- the extension folder is shown as invalid

Solutions:
- load the extension from the generated `dist/` folder, not the root source folder
- enable Developer Mode in Chrome/Edge and use "Load unpacked"
- clear stale extension cache or reload the page after build changes

### 4.2. Permission or manifest validation errors

Typical indicators:
- browser alert about invalid `manifest.json`
- unsupported manifest version or missing required fields

Solutions:
- validate `manifest.json` against the Chrome extension schema version used by the browser
- ensure `manifest_version`, `name`, `version`, and `permissions` are defined correctly
- compare against the repository's `manifest.json` template and browser compatibility requirements

## 5. Unhandled storage crashes and manifest injection issues

### 5.1. Storage failures in the extension

Typical indicators:
- browser storage API errors in the console
- inability to persist settings or local data
- extension resets unexpectedly between reloads

Solutions:
- check the browser console for `chrome.storage` or `browser.storage` errors
- verify that the extension has permission to use storage if required
- clear extension storage from the browser and reload the extension

### 5.2. Manifest injection or content script issues

Typical indicators:
- content script fails during injection
- browser logs mention blocked script injection or CSP violations

Solutions:
- confirm `content_scripts` entries in `manifest.json` target the correct URL patterns
- inspect the page Content Security Policy (CSP) if injection is blocked
- avoid injecting scripts on pages that disallow third-party script execution

## 6. FAQ: Standard runtime flags

### Q: How do I enable detailed logging?
A: Use browser developer tools and inspect console output. For local build validation, run `npm run build` and examine full Vite output for warnings.

### Q: Can I run this project without building first?
A: No. The extension must be built to generate the `dist/` package and valid manifest assets before loading into the browser.

### Q: What should I do if the extension works locally but fails in production?
A: Compare the local `dist/` build artifacts with your deployed package, and validate that `manifest.json` and all generated files were included.

### Q: What runtime flags are relevant for troubleshooting?
A: Focus on the browser extension flags and the Node build environment:
- browser developer mode / extension debugging
- `npm run build` output verbosity
- browser console errors for manifest or CSP issues

### Q: How do I verify local environment configuration?
A: Confirm Node and npm versions, reinstall dependencies, and run `npm run build` successfully. Use a clean workspace if dependency caching is suspected.

## 7. Additional recovery steps

- Always start troubleshooting by reproducing the issue and capturing exact error text.
- For build failures, address the first error in the log first before chasing later errors.
- If installation problems persist, remove stale browser extension instances and reload the package from `dist/`.
- Keep `manifest.json` consistent with the browser’s supported extension schema.
