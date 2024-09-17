# Repository Structure Copier

This Visual Studio Code extension allows you to copy the structure of your repository to the clipboard, including file contents, while respecting ignore rules.

## Features

- Copies the entire structure of your repository to the clipboard
- Includes file contents in the copied structure
- Respects `.repoignore` rules for excluding files and directories
- Provides a token count for the copied structure

## Usage

1. Open a repository in VS Code
2. Use the keyboard shortcut:
   - Windows: `Ctrl+Alt+C`
   - macOS: `Cmd+Alt+C`
3. Alternatively, you can:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette
   - Type "Copy Repository Structure" and select the command
4. The repository structure will be copied to your clipboard, and you'll see a notification with the token count

## .repoignore

Create a `.repoignore` file in the root of your repository to specify files and directories to exclude. The syntax is similar to `.gitignore`.

Example `.repoignore`:

```
node_modules
*.log
.vscode
```

If no `.repoignore` file is found, a warning will be shown, and no files will be ignored.

## Token Count

The extension provides a token count for the copied structure, which can be useful for estimating usage with large language models. The count is displayed in the notification after copying.

## Requirements

- Visual Studio Code 1.60.0 or higher

## Extension Settings

This extension does not add any VS Code settings.

## Known Issues

- Large repositories may take some time to process
- Very large files might cause performance issues

**Enjoy!**