import * as vscode from "vscode";
import { WebviewManager } from "./WebviewManager";
import { DirectoryTraverser } from "./utils/directoryTraverser";

export class RepositoryCopier {
  private webviewManager: WebviewManager;

  constructor(context: vscode.ExtensionContext) {
    this.webviewManager = new WebviewManager(context);
  }

  async repositoryCopier(folderPathOrFiles?: string | string[]) {
    if (!folderPathOrFiles) {
      folderPathOrFiles = DirectoryTraverser.getRootPath() || "";
    }
    if (Array.isArray(folderPathOrFiles)) {
      // Handle array of file paths
      this.webviewManager.showPreviewPanel(folderPathOrFiles.join(","));
    } else {
      // Handle single folder path
      this.webviewManager.showPreviewPanel(folderPathOrFiles);
    }
  }
}
