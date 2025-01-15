import React, {
  useCallback,
  useEffect,
  useReducer,
  useState,
  useMemo,
} from "react";
import { CommandFromWebView, CommandToWebView, IgnoreOption } from "../enums";
import {
  FlattenedFileType,
  GetStuctureType,
  InitialData,
  TreeNodeType,
} from "../types";
import { treeReducer, updateCounts } from "../utils/treeUtils";
import { InputLimitOption, TreeActionTypes } from "../constants";

const useStructure = ({ initialData }: { initialData: InitialData }) => {
  const [isStructureLoading, setIsStructureLoading] = useState<boolean>(true);
  const [isPartsLoading, setIsPartsLoading] = useState<boolean>(true);
  const [structure, setStructure] = useState<TreeNodeType[]>([]);
  const [state, dispatch] = useReducer(treeReducer, structure);
  const [partsCount, setPartsCount] = useState<number>(0);
  const [ignoreOptions, setIgnoreOptions] = useState<IgnoreOption[]>(
    Object.keys(initialData.ignoreOption || {})
      .filter((key) => initialData.ignoreOption![key as IgnoreOption] === true)
      .map((key) => key as IgnoreOption)
  );
  const [maxDepth, setMaxDepth] = useState<number>(initialData.maxDepth || 5);
  const [characterLimit, setCharacterLimit] = useState<
    { key: string; value: string; index: string }[]
  >([]);
  const [prompt, setPrompt] = useState<string>("");
  const [customLimit, setCustomLimit] = useState<number>(0);
  const [selectedLimitOption, setSelectedLimitOption] = useState<string>("");
  const [folderPathOrFiles] = useState<string>(
    initialData.folderPathOrFiles || ""
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log(
        `Received "${message.command}" command from VS Code extension:`
      );
      switch (message.command) {
        case CommandToWebView.setStructure:
          setStructure(JSON.parse(message.data));
          break;
        case CommandToWebView.setStructureCompleted:
          setIsStructureLoading(false);
          break;
        case CommandToWebView.setParts:
          setPartsCount(message.data);
          break;
        case CommandToWebView.setPartsCompleted:
          setIsPartsLoading(false);
          break;
        case CommandToWebView.setPartCopySuccess:
          const buttons = document.querySelectorAll(".copy-part-button");
          if (buttons.length > message.data) {
            const buttonCopySuccess = buttons[message.data];
            buttonCopySuccess.classList.add("success");
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    window.vscode.postMessage({
      command: CommandFromWebView.getStructure,
    });
  }, []);

  useEffect(() => {
    const getCharacterLimitFromSettings = async () => {
      const setting = initialData.maxCharactersPerPart || {};
      const mapped = Object.keys(setting).map((key, index) => ({
        key,
        value: setting[key].toString(),
        index: `${key}-${index}`,
      }));
      setSelectedLimitOption(mapped[0].index);
      setCharacterLimit(mapped);
    };
    getCharacterLimitFromSettings();
  }, [initialData.maxCharactersPerPart]);

  useEffect(() => {
    const getPromptFromSettings = async () => {
      const setting = initialData.prompt || "";
      setPrompt(setting);
    };
    getPromptFromSettings();
  }, [initialData.prompt]);

  useEffect(() => {
    const getIgnoreOptionFromSettings = async () => {
      const setting = initialData.ignoreOption || {};
      const defaultValue = Object.keys(setting)
        .filter((key) => setting[key as IgnoreOption] === true)
        .map((key) => key as IgnoreOption);
      setIgnoreOptions(defaultValue);
    };
    getIgnoreOptionFromSettings();
  }, [initialData.ignoreOption]);

  const handleSelectionChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setSelectedLimitOption(value);
    },
    []
  );

  const handleCustomLimitChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      setCustomLimit(isNaN(value) ? 0 : value);
    },
    []
  );

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    },
    []
  );
  const generateSelectedStructureArray = useCallback(
    (nodes: TreeNodeType[]): FlattenedFileType[] => {
      let result: FlattenedFileType[] = [];
      nodes.forEach((node) => {
        if (node.checked) {
          if (node.type === "file") {
            result.push({
              path: node.node,
            });
          } else if (node.children) {
            result = result.concat(
              generateSelectedStructureArray(node.children)
            );
          }
        } else if (node.children) {
          result = result.concat(generateSelectedStructureArray(node.children));
        }
      });
      return result;
    },
    []
  );
  const splitContentIntoParts = useCallback(
    (structure: TreeNodeType[], prompt: string) => {
      setPartsCount(0);
      removeButtonSuccessClass();
      const selectedFiles = generateSelectedStructureArray(structure);
      const vscode = window.vscode;
      let maxCharacters = customLimit;
      if (selectedLimitOption === InputLimitOption) {
        maxCharacters = customLimit;
      } else {
        const selectedOption = characterLimit.find(
          (item) => item.index === selectedLimitOption
        );
        maxCharacters = parseInt(selectedOption!.value);
      }
      vscode.postMessage({
        command: CommandFromWebView.splitContentIntoParts,
        data: {
          selectedFiles,
          maxCharacters,
          prompt,
        },
      });
    },
    [customLimit, selectedLimitOption, characterLimit, prompt]
  );

  const removeButtonSuccessClass = useCallback(() => {
    const buttons = document.querySelectorAll(".copy-part-button");
    buttons.forEach((button) => {
      button.classList.remove("success");
    });
  }, []);

  const copyPartToClipboard = useCallback(
    (partIndex: number) => {
      const vscode = window.vscode;
      vscode.postMessage({
        command: CommandFromWebView.copyPartToClipboard,
        data: {
          partIndex,
          prompt,
        },
      });
    },
    [prompt]
  );

  return {
    state,
    dispatch,
    isStructureLoading,
    partsCount,
    isPartsLoading,
    ignoreOptions,
    maxDepth,
    characterLimit,
    prompt,
    customLimit,
    selectedLimitOption,
    setIgnoreOptions,
    setMaxDepth,
    setCustomLimit,
    setPrompt,
    setSelectedLimitOption,
    splitContentIntoParts,
    copyPartToClipboard,
    handleSelectionChange,
    handleCustomLimitChange,
    handlePromptChange,
    structure,
    setStructure,
    setIsStructureLoading,
    folderPathOrFiles,
  };
};

export default useStructure;
