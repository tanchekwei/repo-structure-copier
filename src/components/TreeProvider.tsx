import * as React from "react";
import { useEffect, useReducer } from "react";
import { TreeActionTypes } from "../constants";
import { CommandFromWebView, IgnoreOption } from "../enums";
import { Action, GetStuctureType, TreeNodeType } from "../types";
import { treeReducer, updateCounts } from "../utils/treeUtils";

const TreeContext = React.createContext<
  | {
    state: TreeNodeType[];
    dispatch: React.Dispatch<Action>;
  }
  | undefined
>(undefined);

const TreeProvider: React.FC<{
  folderPathOrFiles: string;
  dispatch: any;
  state: any;
  children: React.ReactNode;
  structure: TreeNodeType[];
  setStructure: React.Dispatch<React.SetStateAction<TreeNodeType[]>>;
  ignoreOptions: IgnoreOption[];
  maxDepth: number;
  setIsStructureLoading: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  folderPathOrFiles,
  dispatch,
  state,
  children,
  structure,
  setStructure,
  ignoreOptions,
  maxDepth,
  setIsStructureLoading,
}) => {
  useEffect(() => {
    setStructure(structure);
  }, [structure]);

  useEffect(() => {
    setIsStructureLoading(true);
    const vscode = window.vscode;
    const ignoreOptionObject =
      ignoreOptions.length > 0
        ? ignoreOptions.reduce(
            (acc, option) => ({ ...acc, [option]: true }),
            {} as Record<IgnoreOption, boolean>
          )
        : {};
    vscode.postMessage({
      command: CommandFromWebView.getStructure,
      data: {
        ignoreOption: ignoreOptionObject,
        maxDepth,
        folderPathOrFiles,
      } as GetStuctureType,
    });
  }, [ignoreOptions, maxDepth]);

  useEffect(() => {
    dispatch({
      type: TreeActionTypes.SET_STRUCTURE,
      payload: updateCounts(structure),
    });
  }, [structure]);

  const contextValue = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <TreeContext.Provider value={contextValue}>
      {children}
    </TreeContext.Provider>
  );
};

export { TreeContext, TreeProvider };

