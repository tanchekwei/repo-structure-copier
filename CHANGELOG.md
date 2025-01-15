# Changelog

All notable changes to the "Repository Copier" extension will be documented in this file.

## [1.0.4] - 2025-01-15

### Added

- Split selected files into parts, each within a configurable character limit while keeping individual file content complete in each part.
- If a file's character count exceeds the limit, it will be its own part.
- Configurable ignore options using `.gitignore`, `.repoignore`, or extension settings.
- Provide an estimation of token count (4 bytes = 1 token).
- Customize the maximum depth for directory traversal.
- Stop the loading process if needed.
- Activate the extension via the command palette or by right-clicking on files or folders.
- Support for repositories with a large number of files and folders.

## [1.0.3] - 2024-09-17

### Added

- Improved error handling for missing .repoignore file
- Changelog file

### Changed

- Refactored codebase for better maintainability
- Updated to use fs/promises for all file operations

### Fixed

- Issue with XML escaping interfering with LLM input

## [1.0.0] - 2024-09-15

### Added

- Initial release of Repository Structure Copier
- Feature to copy entire repository structure to clipboard
- Support for .repoignore file to exclude specific files/directories
- Token count calculation for copied structure
