import * as React from "react";
import * as ReactDOM from "react-dom/client";
import StructurePreview from "../components/StructurePreview";

console.log("Webview script loaded with initial data:", window.initialData);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    {window.initialData ? (
      <StructurePreview initialData={window.initialData} />
    ) : (
      <div>No valid initial data available</div>
    )}
  </React.StrictMode>
);

if (!window.initialData) {
  console.error("Invalid or missing initial data:", window.initialData);
}
