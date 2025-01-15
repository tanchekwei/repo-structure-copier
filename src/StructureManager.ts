import ignore from "ignore";
import debounce from "lodash/debounce";
import * as vscode from "vscode";
import {
  CommandToWebView,
  IgnoreOption,
  RepositoryCopierConfig,
} from "./enums";
import { RepoStructureCopierSettings } from "./settings";
import { GetStuctureType, TreeNodeType } from "./types";
import { DirectoryTraverser } from "./utils/directoryTraverser";
import { parseRepoIgnore } from "./utils/ignoreParser";
import { WebviewManager } from "./WebviewManager";

export class StructureManager {
  private context: vscode.ExtensionContext;
  private webviewManager: WebviewManager;
  private structure: TreeNodeType | undefined = undefined;
  private stopSetStructureAbortController: AbortController | undefined;
  protected ig: ReturnType<typeof ignore> | null = null;

  constructor(
    context: vscode.ExtensionContext,
    webviewManager: WebviewManager
  ) {
    this.context = context;
    this.webviewManager = webviewManager;
  }

  debouncedGetStructure = debounce(
    (...args: Parameters<typeof this.getStructure>) => {
      return this.getStructure(...args);
    },
    200,
    { leading: true, trailing: false }
  );

  private debouncedSetStructure = debounce((structure: TreeNodeType) => {
    console.log("debounced setStructure called", structure);
    this.webviewManager.panel!.webview.postMessage({
      command: CommandToWebView.setStructure,
      data: JSON.stringify([structure]),
    });
  }, 0);

  async getStructure(request: GetStuctureType) {
    console.log("getStructure called", request);
    const ignoreOption =
      request?.ignoreOption ||
      RepoStructureCopierSettings.get<{ [key in IgnoreOption]?: boolean }>(
        RepositoryCopierConfig.ignoreOption,
        {
          [IgnoreOption.IgnoreBinaryFile]: true,
          [IgnoreOption.ExtensionSetting]: true,
          [IgnoreOption.Repoignore]: true,
          [IgnoreOption.Gitignore]: true,
        }
      );
    const maxDepth =
      request?.maxDepth ??
      RepoStructureCopierSettings.get<number>(
        RepositoryCopierConfig.maxDepth,
        5
      );

    if (!this.webviewManager.panel) {
      return;
    }

    const rootPath = request.folderPathOrFiles;
    if (!rootPath) {
      console.error("No root path found for repository.");
      return;
    }

    const ig = await parseRepoIgnore(rootPath, ignoreOption);
    this.ig = ig;
    this.stopSetStructureAbortController = new AbortController();

    try {
      this.structure = await DirectoryTraverser.traverseDirectory(
        this.ig,
        rootPath,
        DirectoryTraverser.getRootPath(),
        {
          ignoreBinary: ignoreOption[IgnoreOption.IgnoreBinaryFile],
          maxDepth,
          signal: this.stopSetStructureAbortController.signal,
        },
        (structure) => this.debouncedSetStructure(structure)
      );
    } catch (error) {
      await this.webviewManager.panel.webview.postMessage({
        command: CommandToWebView.setStructureCompleted,
      });
    }

    if (this.structure) {
      await this.debouncedSetStructure(this.structure);
    }
    await this.webviewManager.panel.webview.postMessage({
      command: CommandToWebView.setStructureCompleted,
    });
    if (!this.webviewManager.panel.visible) {
      this.webviewManager.panel.reveal(vscode.ViewColumn.One);
    }
  }

  stopSetStructure() {
    if (this.stopSetStructureAbortController) {
      this.stopSetStructureAbortController.abort();
    }
  }
}
