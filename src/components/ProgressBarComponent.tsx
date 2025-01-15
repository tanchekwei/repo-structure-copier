import * as React from "react";

interface ProgressBarComponentProps {
  id: string;
}

const ProgressBarComponent: React.FC<ProgressBarComponentProps> = ({ id }) => {
  return (
    <div
      id={id}
      className="active done infinite monaco-progress-container"
      role="progressbar"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <div
        className="progress-bit"
        style={{
          backgroundColor: "var(--vscode-progressBar-background)",
          opacity: 1,
          width: "2%",
        }}
      ></div>
    </div>
  );
};

export default ProgressBarComponent;
