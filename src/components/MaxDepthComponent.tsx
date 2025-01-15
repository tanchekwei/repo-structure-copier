import * as React from "react";
import { CommandFromWebView, RepositoryCopierConfig } from "../enums";
import SettingIcon from "./SettingIcon";

interface MaxDepthComponentProps {
  maxDepth: number;
  setMaxDepth: React.Dispatch<React.SetStateAction<number>>;
  isStructureLoading: boolean;
}

const MaxDepthComponent: React.FC<MaxDepthComponentProps> = ({
  maxDepth,
  setMaxDepth,
  isStructureLoading,
}) => {

  const handleMaxDepthChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    setMaxDepth(isNaN(value) ? 0 : value);
  };

  React.useEffect(() => {
    const getMaxDepthFromSettings = async () => {
      const setting = maxDepth || 5;
      setMaxDepth(setting);
    };
    getMaxDepthFromSettings();
  }, [maxDepth]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <label
        style={{ flex: "0 0 12%", display: "flex", alignItems: "center" }}
      >
        Max Depth&nbsp;
        <SettingIcon
          onClick={() =>
            window.vscode.postMessage({
              command: CommandFromWebView.openSettings,
              data: RepositoryCopierConfig.maxDepth,
            })
          }
        />
        &nbsp;:&nbsp;
      </label>
      <input
        type="number"
        min={1}
        value={maxDepth}
        onChange={(event) => setMaxDepth(event.target.valueAsNumber)}
        onBlur={handleMaxDepthChange}
        placeholder="Enter the max depth"
        style={{
          flex: "1",
          padding: "0.5rem",
          marginLeft: "1rem",
          width: "100%",
        }}
        disabled={isStructureLoading} // Disable input when loading
      />
    </div>
  );
};

export default MaxDepthComponent;
