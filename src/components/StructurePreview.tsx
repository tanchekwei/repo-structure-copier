import * as React from "react";
import { useMemo } from "react";
import { CommandFromWebView } from "../enums";
import { StructurePreviewProps, TreeNodeType } from "../types";
import { calculateSummary } from "../utils/treeUtils";
import IgnoreOptionComponent from "./IgnoreOptionComponent";
import MaxCharactersComponent from "./MaxCharactersComponent";
import MaxDepthComponent from "./MaxDepthComponent";
import ProgressBarComponent from "./ProgressBarComponent";
import PromptComponent from "./PromptComponent";
import TreeNode from "./TreeNode";
import { TreeProvider } from "./TreeProvider";
import useStructure from "../hooks/useStructure";

const StructurePreview: React.FC<StructurePreviewProps> = ({ initialData }) => {
  const structure = useStructure({ initialData });
  const summary = useMemo(() => calculateSummary(structure.state), [structure.state]);

  return (
    <div>
      <div className="container"
      >
        {structure.isStructureLoading && (
          <div style={{
            transition: "opacity 0.5s",
            opacity: structure.isStructureLoading ? 1 : 0,
          }}>
            <ProgressBarComponent id="fileStructureProgress" />
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
              Loading repository file structure...&nbsp;
              <button
                className="split-button"
                style={{ marginBottom: "0.5rem", width: "auto" }}
                onClick={() =>
                  window.vscode.postMessage({
                    command: CommandFromWebView.stopSetStructure,
                  })
                }
              >
                Stop
              </button>
            </div>
          </div>
        )}
        <div style={{
          transition: "opacity 0.5s",
          opacity: structure.isStructureLoading ? 0.6 : 1,
        }}>
          <IgnoreOptionComponent
            ignoreOptions={structure.ignoreOptions}
            setIgnoreOptions={structure.setIgnoreOptions}
            isStructureLoading={structure.isStructureLoading}
          />
          <MaxDepthComponent
            maxDepth={structure.maxDepth}
            setMaxDepth={structure.setMaxDepth}
            isStructureLoading={structure.isStructureLoading}
          />
          <TreeProvider folderPathOrFiles={structure.folderPathOrFiles} state={structure.state} dispatch={structure.dispatch} structure={structure.structure} setStructure={structure.setStructure} ignoreOptions={structure.ignoreOptions} maxDepth={structure.maxDepth} setIsStructureLoading={structure.setIsStructureLoading}>
            <div>
              <div>
                <strong>Summary:</strong>
                <div>Selected Files: {summary.selectedFiles?.toLocaleString()}</div>
                <div>Selected Tokens: {summary.selectedTokens?.toLocaleString()}</div>
              </div>
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <ul className="tree">
                  {structure.state.map((node: TreeNodeType) => (
                    <TreeNode key={node.id} node={node} isStructureLoading={structure.isStructureLoading} />
                  ))}
                </ul>
              </div>
            </div>
          </TreeProvider>
        </div>
      </div>
      <br />
      <MaxCharactersComponent
        characterLimit={structure.characterLimit}
        selectedLimitOption={structure.selectedLimitOption}
        customLimit={structure.customLimit}
        setCustomLimit={structure.setCustomLimit}
        handleSelectionChange={structure.handleSelectionChange}
        handleCustomLimitChange={structure.handleCustomLimitChange}
      />
      <PromptComponent
        prompt={structure.prompt}
        handlePromptChange={structure.handlePromptChange}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
          overflowY: "auto",
        }}
      >
        <button
          style={{ marginBottom: "0.5rem" }}
          className="split-button"
          onClick={() => structure.splitContentIntoParts(structure.state, structure.prompt)}
          disabled={structure.isStructureLoading}
        >
          Split Content into Parts
        </button>
      </div>
      {structure.partsCount > 0 && (
        <div style={{
          transition: "opacity 0.5s",
          opacity: structure.isPartsLoading ? 0.8 : 1,
        }}>
          <label style={{ marginBottom: "0.25rem", display: "block" }}>
            Parts:
          </label>
          {structure.isPartsLoading && <ProgressBarComponent id="partsProgress" />}
          {Array.from({ length: structure.partsCount }, (_, i) => (
            <button className="copy-part-button" key={i} onClick={() => structure.copyPartToClipboard(i)}>
              Copy Part {i + 1}
            </button>
          ))}
        </div>
      )}
      <br />
    </div>
  );
};

export default React.memo(StructurePreview);
