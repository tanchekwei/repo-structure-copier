import * as React from "react";
import SettingIcon from "./SettingIcon";
import { CommandFromWebView, RepositoryCopierConfig } from "../enums";

interface PromptComponentProps {
  prompt: string;
  handlePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PromptComponent: React.FC<PromptComponentProps> = ({
  prompt,
  handlePromptChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <label
        style={{ flex: "0 0 33%", display: "flex", alignItems: "center" }}
      >
        Prompt at Each Part Beginning&nbsp;
        <SettingIcon
          onClick={() =>
            window.vscode.postMessage({
              command: CommandFromWebView.openSettings,
              data: RepositoryCopierConfig.prompt,
            })
          }
        />
        &nbsp;:&nbsp;
      </label>
      <textarea
        value={prompt}
        onChange={handlePromptChange}
        rows={2}
        placeholder="Enter a prompt for the beginning of each part"
        style={{
          flex: "1",
          padding: "0.5rem",
          marginLeft: "1rem",
          width: "100%",
          resize: "vertical",
        }}
      />
    </div>
  );
};

export default PromptComponent;
