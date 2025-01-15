import { IgnoreOption } from "./enums";
import { TreeActionTypes } from "./constants";

export type InitialData = {
  maxCharactersPerPart: { [key: string]: number };
  prompt: string | undefined;
  ignoreOption: { [key in IgnoreOption]?: boolean } | undefined;
  maxDepth: number | undefined;
  folderPathOrFiles: string | undefined;
};

export type FlattenedFileType = {
  path: string;
};

export type CopyPartType = {
  partIndex: number;
  prompt: string;
};

export type SplitStuctureType = {
  selectedFiles: FlattenedFileType[];
  maxCharacters: number;
  prompt: string;
};

export type GetStuctureType = {
  ignoreOption: { [key in IgnoreOption]?: boolean };
  maxDepth: number;
  folderPathOrFiles: string;
};

export type TreeNodeType = {
  id: string;
  node: string;
  display: string;
  type: "file" | "folder";
  tokens: number;
  checked: boolean;
  expanded: boolean;
  content: string | null;
  children?: TreeNodeType[];
  indeterminate?: boolean;
};

export type StructurePreviewProps = {
  initialData: InitialData;
};

export type CancellableTraverseOptions = {
  ignoreBinary?: boolean;
  maxDepth?: number;
  signal?: AbortSignal;
};

// Action and reducer for managing tree structure
export type Action =
  | { type: typeof TreeActionTypes.TOGGLE_CHECK; payload: { id: string } }
  | { type: typeof TreeActionTypes.TOGGLE_EXPAND; payload: { id: string } }
  | { type: typeof TreeActionTypes.SET_STRUCTURE; payload: TreeNodeType[] };
