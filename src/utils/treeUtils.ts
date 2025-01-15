import { TreeNodeType, Action } from "../types";
import { TreeActionTypes } from "../constants";

export function treeReducer(
  state: TreeNodeType[],
  action: Action
): TreeNodeType[] {
  switch (action.type) {
    case TreeActionTypes.TOGGLE_CHECK:
      const updatedState = toggleNodeChecked(state, action.payload.id);
      return updateParentCheckedStatus(updatedState);
    case TreeActionTypes.TOGGLE_EXPAND:
      return toggleNodeExpanded(state, action.payload.id);
    case TreeActionTypes.SET_STRUCTURE:
      return mergeStates(action.payload, state);
    default:
      return state;
  }
}

function mergeStates(
  newStructure: TreeNodeType[],
  existingStructure: TreeNodeType[]
): TreeNodeType[] {
  const existingMap = new Map(existingStructure.map((node) => [node.id, node]));

  return newStructure.map((newNode) => {
    const existingNode = existingMap.get(newNode.id);
    if (existingNode) {
      return {
        ...newNode,
        checked: existingNode.checked,
        indeterminate: existingNode.indeterminate,
        children: newNode.children
          ? mergeStates(newNode.children, existingNode.children || [])
          : undefined,
      };
    }
    return newNode;
  });
}

function toggleNodeExpanded(nodes: TreeNodeType[], id: string): TreeNodeType[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleNodeExpanded(node.children, id) };
    }
    return node;
  });
}

export function updateCounts(nodes: TreeNodeType[]): TreeNodeType[] {
  return nodes.map((node) => {
    if (node.type === "file") {
      return node;
    }
    if (node.children) {
      const updatedChildren = updateCounts(node.children);
      const { tokens, files } = calculateFolderCounts(updatedChildren);
      return {
        ...node,
        children: updatedChildren,
        tokens,
      };
    }
    return node;
  });
}

function calculateFolderCounts(children: TreeNodeType[]): {
  tokens: number;
  files: number;
} {
  return children.reduce(
    (acc, child) => {
      if (child.type === "file" && child.checked) {
        acc.tokens += child.tokens;
        acc.files += 1;
      } else if (child.type !== "file") {
        const { tokens, files } = calculateFolderCounts(child.children || []);
        acc.tokens += tokens;
        acc.files += files;
      }
      return acc;
    },
    { tokens: 0, files: 0 }
  );
}

function toggleNodeChecked(nodes: TreeNodeType[], id: string): TreeNodeType[] {
  return nodes.map((node) => {
    if (node.id === id) {
      const newChecked = !node.checked;
      return {
        ...node,
        checked: newChecked,
        children: node.children
          ? toggleAllChildren(node.children, newChecked)
          : undefined,
      };
    }
    if (node.children) {
      return { ...node, children: toggleNodeChecked(node.children, id) };
    }
    return node;
  });
}

function toggleAllChildren(
  children: TreeNodeType[],
  checked: boolean
): TreeNodeType[] {
  return children.map((child) => ({
    ...child,
    checked,
    children: child.children
      ? toggleAllChildren(child.children, checked)
      : undefined,
  }));
}

function updateParentCheckedStatus(nodes: TreeNodeType[]): TreeNodeType[] {
  return nodes.map((node) => {
    if (node.children) {
      const updatedChildren = updateParentCheckedStatus(node.children);
      const allChildrenChecked = updatedChildren.every(
        (child) => child.checked
      );
      const someChildrenChecked = updatedChildren.some(
        (child) => child.checked
      );
      return {
        ...node,
        children: updatedChildren,
        checked: allChildrenChecked,
        indeterminate: someChildrenChecked && !allChildrenChecked,
      };
    }
    return node;
  });
}

export function calculateSummary(nodes: TreeNodeType[]): {
  selectedFiles: number;
  selectedTokens: number;
} {
  return nodes.reduce(
    (summary, node) => {
      if (node.type === "file") {
        if (node.checked) {
          summary.selectedFiles += 1;
          summary.selectedTokens += node.tokens;
        }
      } else if (node.children) {
        const childSummary = calculateSummary(node.children);
        summary.selectedFiles += childSummary.selectedFiles;
        summary.selectedTokens += childSummary.selectedTokens;
      }
      return summary;
    },
    { selectedFiles: 0, selectedTokens: 0 }
  );
}
