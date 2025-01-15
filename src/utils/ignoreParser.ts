import { existsSync } from "fs";
import * as fs from "fs/promises";
import ignore from "ignore";
import * as path from "path";
import { IgnoreOption, RepositoryCopierConfig } from "../enums";
import { RepoStructureCopierSettings } from "../settings";

export async function parseRepoIgnore(
  rootPath: string,
  ignoreOption: { [key in IgnoreOption]?: boolean }
): Promise<ReturnType<typeof ignore>> {
  const ig = ignore();
  if (ignoreOption[IgnoreOption.ExtensionSetting]) {
    const ignorePattern =
      RepoStructureCopierSettings.get<string[]>(
        RepositoryCopierConfig.ignorePattern
      ) || [];
    ig.add(ignorePattern);
  }
  if (ignoreOption[IgnoreOption.Repoignore]) {
    const repoIgnorePath = path.join(rootPath, ".repoignore");
    if (existsSync(repoIgnorePath)) {
      let repoIgnoreContent = await fs.readFile(repoIgnorePath, "utf8");
      ig.add(repoIgnoreContent);
    }
  }
  if (ignoreOption[IgnoreOption.Gitignore]) {
    const gitignorePath = path.join(rootPath, ".gitignore");
    if (existsSync(gitignorePath)) {
      let gitignoreContent = await fs.readFile(gitignorePath, "utf8");
      ig.add(gitignoreContent);
    }
  }
  return ig;
}
