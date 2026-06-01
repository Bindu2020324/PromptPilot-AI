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

## 2. Environment misconfiguration

### 2.1. Node or npm version mismatch

Typical indicators:
- `npm install` fails with `unsupported engine` or `EBADENGINE`
- `npm run build` fails early with compiler or module errors

Solutions:
- use Node.js 18+ as required by the repository
- run `node -v` and `npm -v` to confirm versions

### 2.2. Jest Coverage Failures
If running unit tests fails due to code coverage threshold:
- Ensure new files have matching `*.test.js` or `*.test.jsx` test cases.
- Use `npm run test` or check config threshold under `jest.config.cjs`.
