import * as vscode from "vscode";
import { extensionKey } from "./constants";
import { RepositoryCopierConfig as RepositoryCopierConfig } from "./enums";

export class RepoStructureCopierSettings {
  private static getFullKey(key: RepositoryCopierConfig): string {
    return `${extensionKey}.${key}`;
  }

  static get<T>(key: RepositoryCopierConfig, defaultValue?: T): T {
    const fullKey = this.getFullKey(key);
    const config = vscode.workspace.getConfiguration();
    return (
      defaultValue !== undefined
        ? config.get<T>(fullKey, defaultValue)
        : config.get<T>(fullKey)
    ) as T;
  }
}
