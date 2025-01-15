# Repository Copier

Repository Copier helps you split your repository code into smaller parts, each within a customizable character limit. This is ideal for initializing chat contexts with Large Language Models (LLMs) without running into "message too long" errors.

## Usage

### Method 1

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
2. Type "Repository Copier" and select the command.
   ![](https://raw.githubusercontent.com/tanchekwei/repo-copier-gif/refs/heads/main/1.gif)

### Method 2

1. Hold `Ctrl` or `Cmd` and click on the files or folders you need to copy.
2. Right-click and select "Repository Copier".
   ![](https://raw.githubusercontent.com/tanchekwei/repo-copier-gif/refs/heads/main/2.gif)

## Features

- Split selected files into parts, each within a configurable character limit while keeping individual file content complete in each part.
- If a file's character count exceeds the limit, it will be its own part.
- Configurable ignore options using `.gitignore`, `.repoignore`, or extension settings.
- Provide an estimation of token count (4 bytes = 1 token).
- Customize the maximum depth for directory traversal.
- Stop the loading process if needed.
- Activate the extension via the command palette or by right-clicking on files or folders.
- Support for repositories with a large number of files and folders.

## Extension Settings

- `repo-copier.ignorePattern`: List of files or folders to exclude when displaying the repository structure.
- `repo-copier.ignoreOption`: Default options for ignoring specific files or folders in the repository structure.
  - `Use extension ignore pattern`: Enable or disable the use of the ignore pattern defined in the extension settings (`ignorePattern`).
  - `Use .gitignore`: Enable or disable the use of the `.gitignore` file located in the workspace directory.
  - `Use .repoignore`: Enable or disable the use of the `.repoignore` file located in the workspace directory.
  - `Ignore binary file`: Enable or disable ignoring binary files such as videos, images, executables, etc.
- `repo-copier.maxDepth`: Default maximum depth to traverse in the directory structure.
- `repo-copier.maxCharactersPerPart`: Default maximum number of characters allowed per prompt for various LLM models.
- `repo-copier.prompt`: Default prompt to be added above each part. Use placeholders `${PART_INDEX}` and `${TOTAL_PARTS}` to dynamically insert the part index and total number of parts.

## .repoignore

Create a `.repoignore` file in the root of your repository to specify files and directories to exclude. The syntax is similar to `.gitignore`.

Example `.repoignore`:

```
node_modules
*.log
.vscode
```
