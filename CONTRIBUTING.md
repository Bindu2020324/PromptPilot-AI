# Contributing to PromptPilot-AI

Thank you for your interest in contributing! This document explains how to set up the project locally, how to work with branches, and how to submit a pull request.

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Bindu2020324/PromptPilot-AI.git
   cd PromptPilot-AI
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Load the extension into Chrome/Edge:
   - Open `chrome://extensions/` or `edge://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the generated `dist/` folder

## Coding & Styling Conventions

- **Linting**: Ensure all code passes ESLint rules. Run `npm run lint`.
- **Formatting**: Format your code using Prettier before committing: `npm run format`.
- **Testing**: Run unit tests to verify the code behaves as expected: `npm run test`.
- **Coverage**: Maintain test coverage for new business logic.

## Development Workflow

### Run in watch mode

To build and watch for changes locally:
```bash
npm run dev
```

Then refresh the loaded unpacked extension page after changes.

## Branch Naming

Use descriptive branch names based on the type of work:

- `feature/<short-description>` for new features
- `fix/<short-description>` for bug fixes
- `docs/<short-description>` for documentation updates
- `chore/<short-description>` for maintenance tasks

Examples:
- `feature/add-extension-options`
- `fix/popup-rendering-issue`
- `docs/add-contributing-guidelines`

## Pull Request Checklist

Before submitting a PR, make sure to:

- [ ] Fork the repository and create a new branch
- [ ] Install dependencies and build the project
- [ ] Verify the extension loads in the browser from `dist/`
- [ ] Confirm the change works and does not break existing behavior
- [ ] Add or update documentation if needed
- [ ] Run linter and formatter validation locally
- [ ] Provide a clear PR description and link any related issue
- [ ] Keep changes focused to a single task when possible

## Testing the Extension

To test the unpacked extension in Chrome/Edge:

1. Build the project with `npm run build`
2. Open the browser extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Choose the `dist/` folder created by the build
6. Reload the extension after making code changes

## Reporting Issues

Please open a GitHub issue for:

- bugs or unexpected behavior
- feature requests
- documentation improvements
- compatibility issues

If you can, include:

- steps to reproduce
- expected behavior
- actual behavior
- browser and OS details

## Notes

- Node.js 14+ is required
- Use `npm run build` when preparing a PR
- For rapid changes, `npm run dev` is helpful, but the browser still needs the latest `dist/` build loaded
