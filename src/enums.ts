export enum RepositoryCopierConfig {
  ignorePattern = "ignorePattern",
  ignoreOption = "ignoreOption",
  maxDepth = "maxDepth",
  maxCharactersPerPart = "maxCharactersPerPart",
  prompt = "prompt",
}

export enum CommandToWebView {
  setStructure = "setStrucutre",
  setStructureCompleted = "setStructureCompleted",
  setParts = "setParts",
  setPartsCompleted = "setPartsCompleted",
  setPartCopySuccess = "setPartCopySuccess",
}

export enum CommandFromWebView {
  getStructure = "getStrucutre",
  getStructureProgress = "getStructureProgress",
  stopSetStructure = "stopSetStructure",
  splitContentIntoParts = "splitContentIntoParts",
  copyPartToClipboard = "copyPartToClipboard",
  openSettings = "openSettings",
}

export enum IgnoreOption {
  ExtensionSetting = "Use extension ignore pattern",
  Gitignore = "Use .gitignore",
  Repoignore = "Use .repoignore",
  IgnoreBinaryFile = "Ignore binary file",
}
