import * as React from "react";
// @ts-ignore
import SettingsGear from "../../assets/settings-gear.svg";

const SettingIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <SettingsGear
    className="codicon"
    onClick={onClick}
    style={{ cursor: "pointer" }}
  />
);

export default SettingIcon;
