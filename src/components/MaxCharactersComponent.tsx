import * as React from "react";
import SettingIcon from "./SettingIcon";
import { CommandFromWebView, RepositoryCopierConfig } from "../enums";
import { InputLimitOption } from "../constants";

interface MaxCharactersComponentProps {
  characterLimit: { key: string; value: string; index: string }[];
  selectedLimitOption: string;
  customLimit: number;
  handleSelectionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleCustomLimitChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setCustomLimit: (value: React.SetStateAction<number>) => void,
}

const MaxCharactersComponent: React.FC<MaxCharactersComponentProps> = ({
  characterLimit,
  selectedLimitOption,
  customLimit,
  handleSelectionChange,
  handleCustomLimitChange,
  setCustomLimit,
}) => {

  const handleCustomLimitInput = (event: React.FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = event.currentTarget.value.replace(/^0+/, '');
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <label
          style={{ flex: "0 0 33%", display: "flex", alignItems: "center" }}
        >
          Maximum Characters Allowed Per Part&nbsp;
          <SettingIcon
            onClick={() =>
              window.vscode.postMessage({
                command: CommandFromWebView.openSettings,
                data: RepositoryCopierConfig.maxCharactersPerPart,
              })
            }
          />
          &nbsp;:&nbsp;
        </label>
        <select
          className="monaco-select-box"
          onChange={handleSelectionChange}
          value={selectedLimitOption}
          style={{
            flex: "1",
            padding: "0.5rem",
            marginLeft: "1rem",
            width: "100%",
          }}
        >
          <option value="" disabled>
            Choose a limit
          </option>
          {characterLimit.map(({ key, value, index }) => (
            <option key={index} value={index}>
              {key} - {value} characters
            </option>
          ))}
          <option value={InputLimitOption}>{InputLimitOption}</option>
        </select>
      </div>
      {selectedLimitOption === InputLimitOption && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <label
            style={{ flex: "0 0 33%", display: "flex", alignItems: "center" }}
          ></label>
          <input
            type="number"
            value={customLimit}
            onChange={(event) => setCustomLimit(event.target.valueAsNumber)}
            onBlur={handleCustomLimitChange}
            onInput={handleCustomLimitInput}
            placeholder="Enter the limit"
            style={{
              flex: "1",
              padding: "0.5rem",
              marginLeft: "1rem",
              width: "100%",
            }}
          />
        </div>
      )}
    </>
  );
};

export default MaxCharactersComponent;
