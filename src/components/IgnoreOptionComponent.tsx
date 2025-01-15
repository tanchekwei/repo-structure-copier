import * as React from "react";
import { CommandFromWebView, IgnoreOption, RepositoryCopierConfig } from "../enums";
import SettingIcon from "./SettingIcon";

interface IgnoreOptionComponentProps {
  ignoreOptions: IgnoreOption[];
  setIgnoreOptions: React.Dispatch<React.SetStateAction<IgnoreOption[]>>;
  isStructureLoading: boolean;
}

const IgnoreOptionComponent: React.FC<IgnoreOptionComponentProps> = ({
  ignoreOptions,
  setIgnoreOptions,
  isStructureLoading,
}) => {

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <label
        style={{ flex: "0 0 15%", display: "flex", alignItems: "center" }}
      >
        Ignore Option&nbsp;
        <SettingIcon
          onClick={() =>
            window.vscode.postMessage({
              command: CommandFromWebView.openSettings,
              data: RepositoryCopierConfig.ignoreOption,
            })
          }
        />
        &nbsp;:&nbsp;
      </label>
      {Object.values(IgnoreOption).map((option) => (
        <label
          key={option}
          style={{ paddingRight: "0.5rem", display: "flex" }}
        >
          <input
            type="checkbox"
            value={option}
            checked={ignoreOptions.includes(option)}
            onChange={(e) => {
              const isChecked = e.target.checked;
              if (isChecked) {
                setIgnoreOptions([
                  ...ignoreOptions,
                  option,
                ]);
              } else {
                setIgnoreOptions(
                  ignoreOptions.filter((opt) => opt !== option)
                );
              }
            }}
            disabled={isStructureLoading} // Disable checkbox when loading
          />
          {option}&nbsp;
          {option === IgnoreOption.ExtensionSetting ? (
            <SettingIcon
              onClick={() =>
                window.vscode.postMessage({
                  command: CommandFromWebView.openSettings,
                  data: RepositoryCopierConfig.ignorePattern,
                })
              }
            />
          ) : (
            <div></div>
          )}
        </label>
      ))}
    </div>
  );
};

export default IgnoreOptionComponent;
