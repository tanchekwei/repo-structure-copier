import * as vscode from "vscode";
import { extensionKey } from "./constants";
import { RepositoryCopier } from "./RepositoryCopier";

export function activate(context: vscode.ExtensionContext) {
  const repoStructurePreview = new RepositoryCopier(context);
  let previewDisposable = vscode.commands.registerCommand(
    `${extensionKey}.repositoryCopier`,
    (uri: vscode.Uri, uriList: vscode.Uri[]) => {
      if (uriList && uriList.length > 0) {
        const filePaths = uriList.map((uri) => uri.fsPath);
        repoStructurePreview.repositoryCopier(filePaths);
      } else if (uri) {
        repoStructurePreview.repositoryCopier(uri.fsPath);
      } else {
        repoStructurePreview.repositoryCopier();
      }
    }
  );
  context.subscriptions.push(previewDisposable);
}

export function deactivate() {}
