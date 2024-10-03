import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as tiktoken from 'tiktoken';
import ignore from 'ignore';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import StructurePreview from './components/StructurePreview';

class RepoStructureBase {
    protected ig: ReturnType<typeof ignore> | null = null;
    protected encoding: any;

    constructor() {
        this.encoding = tiktoken.encoding_for_model("gpt-4");
    }

    protected getRootPath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return null;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    protected async parseRepoIgnore(rootPath: string): Promise<ReturnType<typeof ignore>> {
        const ig = ignore();
        const repoIgnorePath = path.join(rootPath, '.repoignore');
        const gitignorePath = path.join(rootPath, '.gitignore');

        try {
            const repoIgnoreContent = await fs.readFile(repoIgnorePath, 'utf8');
            ig.add(repoIgnoreContent);
        } catch (error) {
            try {
                let gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
                if (!gitignoreContent.includes('.git')) {
                    gitignoreContent += '\n.git';
                }
                await fs.writeFile(repoIgnorePath, gitignoreContent);
                ig.add(gitignoreContent);
                vscode.window.showInformationMessage('.repoignore file created from .gitignore');
            } catch (gitignoreError) {
                const basicIgnore = '.git\nnode_modules';
                await fs.writeFile(repoIgnorePath, basicIgnore);
                ig.add(basicIgnore);
                vscode.window.showInformationMessage('Basic .repoignore file created');
            }
        }

        return ig;
    }

    protected shouldIgnore(filePath: string, rootPath: string): boolean {
        if (!this.ig) {
            return false;
        }
        const relativePath = path.relative(rootPath, filePath);
        return this.ig.ignores(relativePath);
    }

    protected countTokens(text: string): number {
        const tokens = this.encoding.encode(text);
        return tokens.length;
    }

    protected formatTokenCount(count: number): string {
        return count < 1000 ? count.toString() : `${(count / 1000).toFixed(1)}k`;
    }

    protected escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
            }
            return c;
        });
    }

    dispose() {
        this.encoding.free();
    }
}

class RepoStructureCopier extends RepoStructureBase {
    async copyRepoStructure() {
        const rootPath = this.getRootPath();
        if (!rootPath) {
            return;
        }

        this.ig = await this.parseRepoIgnore(rootPath);
        const structure = await this.traverseDirectory(rootPath);
        const tokenCount = this.countTokens(structure);
        const formattedTokenCount = this.formatTokenCount(tokenCount);

        await vscode.env.clipboard.writeText(structure);
        vscode.window.showInformationMessage(`Repository structure copied to clipboard. Token count: ${formattedTokenCount}`);
    }

    private async traverseDirectory(dir: string, rootPath: string = dir): Promise<string> {
        let result = '<codebase>';
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);

            if (this.shouldIgnore(filePath, rootPath)) {
                continue;
            }

            if (stat.isDirectory()) {
                result += await this.traverseDirectory(filePath, rootPath);
            } else {
                const content = await fs.readFile(filePath, 'utf8');
                const escapedContent = this.escapeXml(content);
                const relativePath = path.relative(rootPath, filePath);
                result += `<file><path>${relativePath}</path><content>${escapedContent}</content></file>`;
            }
        }

        result += '</codebase>';
        return result;
    }
}

class RepoStructurePaster {
    async pasteRepoStructure() {
        const rootPath = this.getRootPath();
        if (!rootPath) {
            return;
        }

        const clipboardContent = await vscode.env.clipboard.readText();
        if (!this.isValidCodebaseStructure(clipboardContent)) {
            vscode.window.showErrorMessage('Invalid codebase structure in clipboard.');
            return;
        }

        try {
            await this.writeFiles(clipboardContent, rootPath);
            vscode.window.showInformationMessage('Repository structure pasted successfully.');
        } catch (error) {
            vscode.window.showErrorMessage(`Error pasting repository structure: ${(error as any).message}`);
        }
    }

    private getRootPath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return null;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    private isValidCodebaseStructure(content: string): boolean {
        return content.startsWith('<codebase>') && content.endsWith('</codebase>');
    }

    private async writeFiles(content: string, rootPath: string) {
        const fileRegex = /<file><path>(.*?)<\/path><content>([\s\S]*?)<\/content><\/file>/g;
        let match;

        while ((match = fileRegex.exec(content)) !== null) {
            const [, filePath, fileContent] = match;
            const fullPath = path.join(rootPath, filePath);

            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, this.unescapeXml(fileContent));
        }
    }

    private unescapeXml(escaped: string): string {
        return escaped.replace(/&lt;|&gt;|&amp;|&apos;|&quot;/g, (match) => {
            switch (match) {
                case '&lt;': return '<';
                case '&gt;': return '>';
                case '&amp;': return '&';
                case '&apos;': return "'";
                case '&quot;': return '"';
                default: return match;
            }
        });
    }
}

class RepoStructurePreview extends RepoStructureBase {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
    }

    async previewRepoStructure() {
        const rootPath = this.getRootPath();
        if (!rootPath) {
            return;
        }

        this.ig = await this.parseRepoIgnore(rootPath);
        const structure = await this.traverseDirectory(rootPath);

        this.showPreviewPanel(structure);
    }

    private async traverseDirectory(dir: string, rootPath: string = dir): Promise<any> {
        const relativePath = path.relative(rootPath, dir);
        const result: any = {
            id: this.generateId(relativePath),
            node: `/${relativePath}`,
            display: path.basename(dir),
            type: 'folder',
            tokens: 0,
            checked: true,
            expanded: true,
            content: '<codebase>',
            children: []
        };
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const relativeFilePath = path.relative(rootPath, filePath);

            if (this.shouldIgnore(filePath, rootPath)) {
                continue;
            }

            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                const subDir = await this.traverseDirectory(filePath, rootPath);
                result.children.push(subDir);
                result.tokens += subDir.tokens;
                result.content += subDir.content;
            } else {
                const content = await fs.readFile(filePath, 'utf8');
                const tokenCount = this.countTokens(content);
                const escapedContent = this.escapeXml(content);
                const fileContent = `<file><path>${relativeFilePath}</path><content>${escapedContent}</content></file>`;
                result.children.push({
                    id: this.generateId(relativeFilePath),
                    node: `/${relativeFilePath}`,
                    display: file,
                    type: 'file',
                    tokens: tokenCount,
                    checked: true,
                    expanded: true,
                    content: fileContent
                });
                result.tokens += tokenCount;
                result.content += fileContent;
            }
        }

        result.content += '</codebase>';
        return result;
    }

    private generateId(path: string): string {
        return `-${path.replace(/\//g, '-')}`;
    }

    private showPreviewPanel(structure: any) {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'repoStructurePreview',
                'Repository Structure Preview',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'dist'))]
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }

        const webviewUri = this.panel.webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'dist', 'webview.js')
        ));

        this.panel.webview.html = this.getWebviewContent([structure], webviewUri);
    }

    private getWebviewContent(structure: any, webviewUri: vscode.Uri): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel?.webview.cspSource} 'unsafe-inline'; script-src ${this.panel?.webview.cspSource} 'unsafe-inline';">
                <title>Repository Structure Preview</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .tree, .tree ul { list-style-type: none; padding-left: 1.5em; }
                    .tree li { position: relative; }
                </style>
            </head>
            <body>
                <h1>Repository Structure Preview</h1>
                <div id="root">Loading...</div>
                <script>
                    window.initialData = ${JSON.stringify(structure)};
                    console.log('Initial data set:', window.initialData);
                </script>
                <script src="${webviewUri}"></script>
            </body>
            </html>
        `;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const repoStructureCopier = new RepoStructureCopier();
    const repoStructurePaster = new RepoStructurePaster();
    const repoStructurePreview = new RepoStructurePreview(context);

    let copyDisposable = vscode.commands.registerCommand('extension.copyRepoStructure', () => repoStructureCopier.copyRepoStructure());
    let pasteDisposable = vscode.commands.registerCommand('extension.pasteRepoStructure', () => repoStructurePaster.pasteRepoStructure());
    let previewDisposable = vscode.commands.registerCommand('extension.previewRepoStructure', () => repoStructurePreview.previewRepoStructure());

    context.subscriptions.push(copyDisposable, pasteDisposable, previewDisposable);
    context.subscriptions.push(
        { dispose: () => repoStructureCopier.dispose() },
        { dispose: () => repoStructurePreview.dispose() }
    );
}

export function deactivate() { }
