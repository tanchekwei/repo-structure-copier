import * as fs from "fs/promises";
import { Ignore } from "ignore";
import * as path from "path";
import * as vscode from "vscode";
import { CancellableTraverseOptions, TreeNodeType } from "../types";
const isBinaryFile = require("isbinaryfile").isBinaryFile;

export class DirectoryTraverser {
  /**
   * Checks if a file should be ignored based on its path and the ignore list.
   * @param {string} filePath The path to the file.
   * @param {string} rootPath The root directory of the repository.
   * @returns {boolean} True if the file should be ignored, false otherwise.
   */
  static shouldIgnore(
    ig: Ignore | null,
    filePath: string,
    rootPath: string
  ): boolean {
    if (!ig) {
      console.log("Ignore instance not initialized");
      return false;
    }
    const relativePath = path.relative(rootPath, filePath);
    const ignoreResult = ig.ignores(relativePath);
    return ignoreResult;
  }

  static estimateTokensFromSize(sizeInBytes: number): number {
    const averageTokenSize = 4; // Approx. characters per token
    return Math.ceil(sizeInBytes / averageTokenSize);
  }

  static async traverseDirectory(
    ig: Ignore,
    folderPathOrFiles: string,
    rootPath: string = folderPathOrFiles,
    options: CancellableTraverseOptions = {},
    progressCallback = (structure: TreeNodeType) => {}
  ): Promise<TreeNodeType> {
    const { ignoreBinary = true, maxDepth = 5, signal } = options;
    const structure: TreeNodeType = {
      id: "-",
      node: "\\",
      display: path.basename(rootPath),
      type: "folder",
      tokens: 0,
      checked: true,
      expanded: true,
      content: "",
      children: [],
    };

    function checkCancellation() {
      if (signal?.aborted) {
        throw new Error("Directory traversal was cancelled");
      }
    }

    function findOrCreateNode(pathParts: string[]): TreeNodeType {
      checkCancellation();
      let current = structure;
      let currentPath = "";

      for (const part of pathParts) {
        currentPath = currentPath ? path.join(currentPath, part) : part;

        let child = current.children?.find(
          (c) => c.display === part && c.type === "folder"
        );

        if (!child) {
          child = {
            id: `-${currentPath}`,
            node: `\\${currentPath}`,
            display: part,
            type: "folder",
            tokens: 0,
            checked: true,
            expanded: true,
            content: "",
            children: [],
          };
          current.children?.push(child);
        }

        current = child;
      }

      return current;
    }

    async function processDirectory(
      currentPath: string,
      currentDepth: number = 0
    ) {
      if (currentDepth >= maxDepth) {
        return;
      }

      const files = await fs.readdir(currentPath, { withFileTypes: true });

      for (const file of files) {
        checkCancellation();
        const filePath = path.join(currentPath, file.name);
        const relativeFilePath = path.relative(rootPath, filePath);

        if (DirectoryTraverser.shouldIgnore(ig, filePath, rootPath)) {
          continue;
        }

        if (file.isDirectory()) {
          const nextDepth = currentDepth + 1;
          const node = findOrCreateNode(relativeFilePath.split(path.sep));

          await processDirectory(filePath, nextDepth);

          if (node.children) {
            node.tokens = node.children.reduce(
              (sum: number, child: TreeNodeType) => sum + child.tokens,
              0
            );
          }
          progressCallback(structure);
        } else {
          if (ignoreBinary) {
            try {
              if (await isBinaryFile(filePath)) {
                continue;
              }
            } catch {}
          }

          const parentNode = findOrCreateNode(
            path.dirname(relativeFilePath).split(path.sep)
          );

          let content = "";
          let tokenCount = 0;
          try {
            const stat = await fs.stat(filePath);
            tokenCount = DirectoryTraverser.estimateTokensFromSize(stat.size);
          } catch {}

          const fileNode: TreeNodeType = {
            content,
            id: `-${relativeFilePath}`,
            node: `\\${relativeFilePath}`,
            display: file.name,
            type: "file",
            tokens: tokenCount,
            checked: true,
            expanded: true,
          };

          parentNode.children?.push(fileNode);

          let current: TreeNodeType | null = parentNode;
          while (current) {
            current.tokens += tokenCount;
            current =
              current.children?.find(
                (c) =>
                  c.type === "folder" && relativeFilePath.startsWith(c.display)
              ) || null;
          }

          progressCallback(structure);
        }
      }
    }

    async function processFile(filePath: string) {
      checkCancellation();
      const rootPath = DirectoryTraverser.getRootPath() || "";
      const relativeFilePath = path.relative(rootPath, filePath);

      if (DirectoryTraverser.shouldIgnore(ig, filePath, rootPath)) {
        return;
      }

      const parentNode = findOrCreateNode(
        path.dirname(relativeFilePath).split(path.sep)
      );

      let content = "";
      let tokenCount = 0;
      try {
        const stat = await fs.stat(filePath);
        tokenCount = DirectoryTraverser.estimateTokensFromSize(stat.size);
      } catch {}

      const fileNode: TreeNodeType = {
        content,
        id: `-${relativeFilePath}`,
        node: `\\${relativeFilePath}`,
        display: path.basename(filePath),
        type: "file",
        tokens: tokenCount,
        checked: true,
        expanded: true,
      };

      parentNode.children?.push(fileNode);

      let current: TreeNodeType | null = parentNode;
      while (current) {
        current.tokens += tokenCount;
        current =
          current.children?.find(
            (c) => c.type === "folder" && relativeFilePath.startsWith(c.display)
          ) || null;
      }

      progressCallback(structure);
    }

    try {
      const paths = folderPathOrFiles.split(",");
      for (const dir of paths) {
        const trimmedPath = dir.trim();
        const stat = await fs.stat(trimmedPath);
        if (stat.isDirectory()) {
          await processDirectory(trimmedPath);
        } else {
          await processFile(trimmedPath);
        }
      }
      return structure;
    } catch (error: any) {
      if (error.message === "Directory traversal was cancelled") {
        return structure;
      }
      throw error;
    }
  }

  static getRootPath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
  }

  static generateId(path: string): string {
    return `-${path.replace(/\//g, "-")}`;
  }
}
