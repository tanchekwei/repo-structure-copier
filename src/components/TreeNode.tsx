import * as React from "react";
import { TreeNodeType } from "../types";
import { TreeContext } from "./TreeProvider";
import { TreeActionTypes } from "../constants";
// @ts-ignore
import ChevronRight from "../../assets/chevron-right.svg";
// @ts-ignore
import ChevronDown from "../../assets/chevron-down.svg";

const TreeNode = React.memo(
  ({
    node,
    isStructureLoading,
  }: {
    node: TreeNodeType;
    isStructureLoading: boolean;
  }) => {
    const { dispatch } = React.useContext(TreeContext)!;

    const handleCheckboxChange = React.useCallback(() => {
      dispatch({
        type: TreeActionTypes.TOGGLE_CHECK,
        payload: { id: node.id },
      });
    }, [dispatch, node.id]);

    const handleToggleExpand = React.useCallback(() => {
      if (node.type === "folder") {
        dispatch({
          type: TreeActionTypes.TOGGLE_EXPAND,
          payload: { id: node.id },
        });
      }
    }, [dispatch, node.id, node.type]);

    return (
      <li>
        <input
          type="checkbox"
          checked={node.checked}
          ref={(el) => {
            if (el) {
              el.indeterminate = node.indeterminate || false;
            }
          }}
          onChange={handleCheckboxChange}
          disabled={isStructureLoading} // Disable checkbox when loading
        />
        <span onClick={handleToggleExpand} style={{ cursor: "pointer" }}>
          {node.type === "folder" &&
            (node.expanded ? <ChevronDown /> : <ChevronRight />)}{" "}
          {node.display}
        </span>
        <span style={{ color: "var(--vscode-minimap-infoHighlight)" }}>
          {" "}
          ({node.tokens?.toLocaleString()} tokens)
        </span>
        {node.type === "folder" &&
          node.expanded &&
          node.children &&
          node.children.length > 0 && (
            <ul>
              {node.children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  isStructureLoading={isStructureLoading}
                />
              ))}
            </ul>
          )}
      </li>
    );
  }
);

export default TreeNode;
