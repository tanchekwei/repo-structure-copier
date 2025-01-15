import * as fs from "fs/promises";
import path from "path";
import * as vscode from "vscode";
import { extensionKey } from "./constants";
import {
  CommandFromWebView,
  CommandToWebView,
  IgnoreOption,
  RepositoryCopierConfig,
} from "./enums";
import { RepoStructureCopierSettings } from "./settings";
import { StructureManager } from "./StructureManager";
import {
  CopyPartType,
  GetStuctureType,
  InitialData,
  SplitStuctureType,
  TreeNodeType,
} from "./types";
import { DirectoryTraverser } from "./utils/directoryTraverser";
import { showStatusBarMessage } from "./utils/statusBar";

export class WebviewManager {
  panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private parts: string[] = [];
  private structureManager: StructureManager;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.structureManager = new StructureManager(context, this);
  }

  showPreviewPanel(folderPathOrFiles: string) {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
    } else {
      this.createWebviewPanel();
      this.setupWebviewMessageListener();
    }

    const webviewUri = this.panel!.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "dist", "webview.js")
      )
    );
    const initialData = this.getInitialData(folderPathOrFiles);
    this.getStyles(this.context.extensionUri).then((styles) => {
      this.panel!.webview.html = this.getWebviewContent(
        initialData,
        webviewUri,
        styles
      );
    });
  }

  private createWebviewPanel() {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    this.panel = vscode.window.createWebviewPanel(
      extensionKey,
      "Repository Copier",
      column || vscode.ViewColumn.One,
      {
        enableFindWidget: true,
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath)),
        ],
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private setupWebviewMessageListener() {
    this.panel!.webview.onDidReceiveMessage(
      async (message) => {
        console.log("Received message from webview: ", message.data);
        switch (message.command) {
          case CommandFromWebView.getStructure:
            this.structureManager.debouncedGetStructure(
              message.data as GetStuctureType
            );
            break;
          case CommandFromWebView.stopSetStructure:
            this.structureManager.stopSetStructure();
            break;
          case CommandFromWebView.splitContentIntoParts:
            this.splitContentIntoParts(message.data as SplitStuctureType);
            break;
          case CommandFromWebView.copyPartToClipboard:
            this.copyPartToClipboard(message.data as CopyPartType);
            break;
          case CommandFromWebView.openSettings:
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              `${extensionKey}.${message.data}`
            );
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private getInitialData(folderPathOrFiles: string): InitialData {
    const maxCharactersPerPart =
      RepoStructureCopierSettings.get<{ [key: string]: number }>(
        RepositoryCopierConfig.maxCharactersPerPart
      ) || {};
    const prompt = RepoStructureCopierSettings.get<string>(
      RepositoryCopierConfig.prompt
    );
    const ignoreOption = RepoStructureCopierSettings.get<{
      [key in IgnoreOption]?: boolean;
    }>(RepositoryCopierConfig.ignoreOption, {});
    const maxDepth = RepoStructureCopierSettings.get<number>(
      RepositoryCopierConfig.maxDepth,
      5
    );
    return {
      maxCharactersPerPart,
      prompt,
      ignoreOption,
      maxDepth,
      folderPathOrFiles,
    };
  }

  private async getStyles(extensionUri: vscode.Uri): Promise<string> {
    const styles = [
      "dropdown.css",
      "progressbar.css",
      "styles.css",
      "selectBox.css",
    ];
    return styles
      .map(
        (style) =>
          `<link href="${this.panel?.webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, "assets", style)
          )}" rel="stylesheet" />`
      )
      .join("\n");
  }

  private getWebviewContent(
    initialData: InitialData,
    webviewUri: vscode.Uri,
    styles: string
  ): string {
    const cspSource = this.panel?.webview.cspSource;
    const extensionUri = this.context.extensionUri;
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none';
            font-src ${cspSource};
            style-src ${cspSource} 'unsafe-inline';
            script-src ${cspSource} 'unsafe-inline';">
          <title>Repository Copier</title>
          ${styles}
      </head>
      <body>
          <div id="root">Loading React..</div>
          <script>
              window.initialData = ${JSON.stringify(initialData)};
              console.log('Initial data set:', window.initialData);
          </script>
          <script src="${webviewUri}"></script>
          <script>
              const vscode = acquireVsCodeApi();
              window.vscode = vscode;
          </script>
      </body>
      </html>
    `;
  }

  private getPartWithPrompt = (
    partIndex: number,
    prompt: string
  ): string | undefined => {
    if (partIndex < this.parts.length) {
      const totalParts = this.parts.length;
      const promptReplaced = prompt
        .replace("${PART_INDEX}", (partIndex + 1).toString())
        .replace("${TOTAL_PARTS}", totalParts.toString());
      return promptReplaced + "\n" + this.parts[partIndex];
    }
    return undefined;
  };

  private async copyPartToClipboard({ partIndex, prompt }: CopyPartType) {
    if (partIndex < this.parts.length) {
      const finalPart = this.getPartWithPrompt(partIndex, prompt);
      if (finalPart) {
        await vscode.env.clipboard.writeText(finalPart);
        this.panel!.webview.postMessage({
          command: CommandToWebView.setPartCopySuccess,
          data: partIndex,
        });
        showStatusBarMessage(`Part ${partIndex + 1} copied.`);
      }
    }
  }

  private async splitContentIntoParts({
    selectedFiles,
    maxCharacters,
    prompt,
  }: SplitStuctureType) {
    if (!this.panel) {
      return;
    }

    this.parts = [];
    let currentPart = "<repo>";
    const rootPath = DirectoryTraverser.getRootPath() || "";

    for (const file of selectedFiles) {
      const fullPath = path.join(rootPath, file.path);
      const content = await fs.readFile(fullPath, "utf8");
      const fileXml = `<file><path>${file.path}</path><content>${
        content || ""
      }</content></file>`;

      if (
        currentPart.length + fileXml.length > maxCharacters &&
        currentPart !== "<repo>"
      ) {
        this.addPart(currentPart);
        currentPart = "<repo>";
      }

      if (fileXml.length > maxCharacters) {
        if (currentPart !== "<repo>") {
          this.addPart(currentPart);
        }
        this.addPart("<repo>" + fileXml + "</repo>");
        currentPart = "<repo>";
      } else {
        currentPart += fileXml;
      }
    }

    if (currentPart !== "<repo>") {
      this.addPart(currentPart);
    }
    this.panel!.webview.postMessage({
      command: CommandToWebView.setPartsCompleted,
    });
    showStatusBarMessage("Split operation completed.");
  }

  private addPart(part: string) {
    this.parts.push(part + "</repo>");
    this.panel!.webview.postMessage({
      command: CommandToWebView.setParts,
      data: this.parts.length,
    });
  }
}
