import * as React from 'react';

type TreeNodeType = {
  id: string;
  node: string;
  display: string;
  type: 'file' | 'folder';
  tokens: number;
  checked: boolean;
  expanded: boolean;
  content: string | null;
  children?: TreeNodeType[];
  indeterminate?: boolean;
};

type StructurePreviewProps = {
  structure: TreeNodeType[];
};

function formatNumber(num: number | undefined): string {
  if (num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type Action =
  | { type: 'TOGGLE_CHECK'; payload: { id: string } }
  | { type: 'TOGGLE_EXPAND'; payload: { id: string } }
  | { type: 'SET_STRUCTURE'; payload: TreeNodeType[] };

function treeReducer(state: TreeNodeType[], action: Action): TreeNodeType[] {
  switch (action.type) {
    case 'TOGGLE_CHECK':
      const updatedState = toggleNodeChecked(state, action.payload.id);
      return updateParentCheckedStatus(updatedState);
    case 'TOGGLE_EXPAND':
      return toggleNodeExpanded(state, action.payload.id);
    case 'SET_STRUCTURE':
      return action.payload;
    default:
      return state;
  }
}

function toggleNodeChecked(nodes: TreeNodeType[], id: string): TreeNodeType[] {
  return nodes.map(node => {
    if (node.id === id) {
      const newChecked = !node.checked;
      return {
        ...node,
        checked: newChecked,
        children: node.children ? toggleAllChildren(node.children, newChecked) : undefined
      };
    }
    if (node.children) {
      return { ...node, children: toggleNodeChecked(node.children, id) };
    }
    return node;
  });
}

function toggleAllChildren(children: TreeNodeType[], checked: boolean): TreeNodeType[] {
  return children.map(child => ({
    ...child,
    checked,
    children: child.children ? toggleAllChildren(child.children, checked) : undefined
  }));
}

function updateParentCheckedStatus(nodes: TreeNodeType[]): TreeNodeType[] {
  return nodes.map(node => {
    if (node.children) {
      const updatedChildren = updateParentCheckedStatus(node.children);
      const allChildrenChecked = updatedChildren.every(child => child.checked);
      const someChildrenChecked = updatedChildren.some(child => child.checked);
      return {
        ...node,
        children: updatedChildren,
        checked: someChildrenChecked,
        indeterminate: someChildrenChecked && !allChildrenChecked
      };
    }
    return node;
  });
}

function updateCounts(nodes: TreeNodeType[]): TreeNodeType[] {
  return nodes.map(node => {
    if (node.type === 'file') {
      return node;
    }
    if (node.children) {
      const updatedChildren = updateCounts(node.children);
      const { tokens, files } = calculateFolderCounts(updatedChildren);
      return {
        ...node,
        children: updatedChildren,
        tokens: tokens, // Remove the node.checked condition
      };
    }
    return node;
  });
}

function calculateFolderCounts(children: TreeNodeType[]): { tokens: number; files: number } {
  return children.reduce((acc, child) => {
    if (child.type === 'file') {
      if (child.checked) {
        acc.tokens += child.tokens;
        acc.files += 1;
      }
    } else {
      const { tokens, files } = calculateFolderCounts(child.children || []);
      acc.tokens += tokens;
      acc.files += files;
    }
    return acc;
  }, { tokens: 0, files: 0 });
}

function toggleNodeExpanded(nodes: TreeNodeType[], id: string): TreeNodeType[] {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleNodeExpanded(node.children, id) };
    }
    return node;
  });
}

const TreeContext = React.createContext<{
  state: TreeNodeType[];
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function TreeNode({ node }: { node: TreeNodeType }) {
  const { dispatch } = React.useContext(TreeContext)!;

  const handleCheckboxChange = () => {
    dispatch({ type: 'TOGGLE_CHECK', payload: { id: node.id } });
  };

  const handleToggleExpand = () => {
    if (node.type === 'folder') {
      dispatch({ type: 'TOGGLE_EXPAND', payload: { id: node.id } });
    }
  };

  return (
    <li>
      <input
        type="checkbox"
        checked={node.checked}
        ref={el => {
          if (el) {
            el.indeterminate = node.indeterminate || false;
          }
        }}
        onChange={handleCheckboxChange}
      />
      <span onClick={handleToggleExpand} style={{ cursor: 'pointer' }}>
        {node.type === 'folder' && (node.expanded ? '▼' : '▶')} {node.display}
      </span>
      <span style={{ color: 'lightblue' }}> ({formatNumber(node.tokens)} tokens)</span>
      {node.type === 'folder' && node.expanded && node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function calculateSummary(nodes: TreeNodeType[]): { selectedFiles: number; selectedTokens: number } {
  return nodes.reduce((summary, node) => {
    if (node.type === 'file') {
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
  }, { selectedFiles: 0, selectedTokens: 0 });
}

function StructurePreview({ structure }: StructurePreviewProps) {
  const [state, dispatch] = React.useReducer(treeReducer, structure);

  React.useEffect(() => {
    dispatch({ type: 'SET_STRUCTURE', payload: updateCounts(structure) });
  }, [structure]);

  const summary = calculateSummary(state);

  const handleCopy = () => {
    const selectedStructure = generateSelectedStructureXML(state);
    // Instead of using vscode.postMessage, we'll dispatch a custom event
    window.dispatchEvent(new CustomEvent('copy-to-clipboard', { detail: selectedStructure }));
  };

  return (
    <TreeContext.Provider value={{ state, dispatch }}>
      <div>
        <h2>Repository Structure</h2>
        <div style={{ marginBottom: '20px' }}>
          <strong>Summary:</strong>
          <div>Selected Files: {formatNumber(summary.selectedFiles)}</div>
          <div>Selected Tokens: {formatNumber(summary.selectedTokens)}</div>
          <button onClick={handleCopy}>Copy Selected Structure</button>
        </div>
        <ul className="tree">
          {state.map((node) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </ul>
      </div>
    </TreeContext.Provider>
  );
}

function generateSelectedStructureXML(nodes: TreeNodeType[]): string {
  let result = '<codebase>';
  nodes.forEach(node => {
    if (node.checked) {
      if (node.type === 'file') {
        result += `<file><path>${node.node}</path><content>${node.content}</content></file>`;
      } else if (node.children) {
        result += generateSelectedStructureXML(node.children);
      }
    }
  });
  result += '</codebase>';
  return result;
}

export default StructurePreview;
