import * as vscode from "vscode";
import { webpackConfigFileName } from "../share";

const defaultWebpackConfigContent = `const path = require('path');

/**
 * This function will receive the current webpack config 
 * and need return the final webpack config.
 * @param {import("webpack").Configuration} webpackConfig
 * @returns {import("webpack").Configuration}
 */
function modifyWebpackConfig(webpackConfig) {
  webpackConfig.resolve.alias = {
    ...webpackConfig.resolve.alias,
    // Add your alias here, for example:
    // Utilities: path.resolve(__dirname, '../src/utilities/'),
    // Templates: path.resolve(__dirname, '../src/templates/'),
  };

  return webpackConfig;
}

module.exports = modifyWebpackConfig;
`;

async function getWebpackConfigUri() {
  const { activeTextEditor } = vscode.window;

  const activeWorkspaceFolder =
    activeTextEditor &&
    vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri);

  if (activeWorkspaceFolder?.uri) {
    return vscode.Uri.joinPath(
      activeWorkspaceFolder.uri,
      ".vscode",
      webpackConfigFileName
    );
  }

  if (vscode.workspace.workspaceFolders?.length === 1) {
    return vscode.Uri.joinPath(
      vscode.workspace.workspaceFolders[0].uri,
      ".vscode",
      webpackConfigFileName
    );
  }

  if (vscode.workspace.workspaceFolders?.length) {
    const items = vscode.workspace.workspaceFolders.map((folder) => ({
      label: folder.name,
      uri: folder.uri,
    }));

    const workspaceFolder = await vscode.window.showQuickPick<{
      label: string;
      uri: vscode.Uri;
    }>(items, {
      placeHolder: "Select a workspace folder for config webpack",
    });

    if (!workspaceFolder) {
      return;
    }

    return vscode.Uri.joinPath(
      workspaceFolder.uri,
      ".vscode",
      webpackConfigFileName
    );
  }
}

export default async (webpackConfigUri?: vscode.Uri) => {
  let _webpackConfigUri = webpackConfigUri;

  if (!_webpackConfigUri) {
    _webpackConfigUri = await getWebpackConfigUri();
  }

  if (!_webpackConfigUri) {
    return;
  }

  try {
    await vscode.workspace.fs.stat(_webpackConfigUri);
  } catch {
    await vscode.workspace.fs.writeFile(
      _webpackConfigUri,
      Uint8Array.from(Buffer.from(defaultWebpackConfigContent))
    );
  }

  await vscode.commands.executeCommand("vscode.open", _webpackConfigUri);

  return true;
};
