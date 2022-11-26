import * as vscode from "vscode";
// nlsConfig must before other imports
import "./nlsConfig";

// Add a newline, wait for [Automatically create sort groups based on newlines in organize imports](https://github.com/microsoft/TypeScript/pull/48330)

import { setContext } from "./share";
import DepExplorerView from "./views/DepExplorerView";

export const log = vscode.window.createOutputChannel("Dependency & Dependent");

export function activate(context: vscode.ExtensionContext) {
  setContext(context);

  new DepExplorerView(context);

  vscode.window.onDidChangeActiveTextEditor(() => {
    DepExplorerView.singleton.refresh();
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("dependency-dependent.refresh", () => {
      DepExplorerView.singleton.refresh();
    })
  );
}

export function deactivate() {}
