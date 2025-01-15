import { CommandFromWebView, CommandToWebView } from "../enums";
import { InitialData } from "../types";

export interface VscodePostMessage {
  command: CommandFromWebView | CommandToWebView;
  data?: any;
}

type VSCode = {
  postMessage(message: VscodePostMessage): void;
  getState(): any;
  setState(state: any): void;
};

declare global {
  interface Window {
    vscode: VSCode;
    initialData: InitialData;
  }
}
