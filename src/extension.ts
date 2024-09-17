import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as tiktoken from 'tiktoken';
import ignore from 'ignore';

let ig: ReturnType<typeof ignore> | null = null;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.copyRepoStructure', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;
        
        // Parse .repoignore file
        ig = parseRepoIgnore(rootPath);
        const structure = await traverseDirectory(rootPath);
        
        const structureJson = structure;
        const tokenCount = countTokens(structureJson);
        const formattedTokenCount = formatTokenCount(tokenCount);
        await vscode.env.clipboard.writeText(structureJson);
        vscode.window.showInformationMessage(`Repository structure copied to clipboard. Token count: ${formattedTokenCount}`);
    });
    context.subscriptions.push(disposable);
}

function parseRepoIgnore(rootPath: string): ReturnType<typeof ignore> {
    const ig = ignore();
    const repoignorePath = path.join(rootPath, '.repoignore');
    
    if (fs.existsSync(repoignorePath)) {
        const repoignoreContent = fs.readFileSync(repoignorePath, 'utf8');
        ig.add(repoignoreContent);
    } else {
        vscode.window.showWarningMessage('No .repoignore file found. No files will be ignored.');
    }
    
    return ig;
}

function shouldIgnore(filePath: string, rootPath: string): boolean {
    if (!ig) {return false;}
    
    const relativePath = path.relative(rootPath, filePath);
    return ig.ignores(relativePath);
}

async function traverseDirectory(dir: string, rootPath: string = dir): Promise<string> {
    let result = '<codebase>'; // Start the XML structure
    const files = await fs.promises.readdir(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);
        
        if (shouldIgnore(filePath, rootPath)) {
            continue;
        }
        
        if (stat.isDirectory()) {
            result += await traverseDirectory(filePath, rootPath); // Recursively add directory contents
        } else {
            const content = await fs.promises.readFile(filePath, 'utf8'); // Read file content
            result += `<file><path>${filePath}</path><content>${content}</content></file>`;
        }
    }
    
    result += '</codebase>'; // End the XML structure
    return result;
}

function countTokens(text: string): number {
    const encoding = tiktoken.encoding_for_model("gpt-4");
    const tokens = encoding.encode(text);
    encoding.free();
    return tokens.length;
}

function formatTokenCount(count: number): string {
    if (count < 1000) {
        return count.toString();
    } else {
        return (count / 1000).toFixed(1) + 'k';
    }
}

export function deactivate() {}