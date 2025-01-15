import * as vscode from "vscode";

export function showStatusBarMessage(message: string) {
  const statusBarMessage = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarMessage.text = `$(info) ${message}`;
  statusBarMessage.show();
  setTimeout(() => {
    statusBarMessage.hide();
  }, 5000); // Hide the message after 5 seconds
}
