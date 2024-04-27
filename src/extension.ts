import * as vscode from "vscode";
// nlsConfig must before other imports
import "./nlsConfig";

// Add a newline, wait for [Automatically create sort groups based on newlines in organize imports](https://github.com/microsoft/TypeScript/pull/48330)

import { DepService } from "./DepService";
import configWebpack from "./commands/configWebpack";
import { getLocked, setLocked } from "./core/context";
import { setContext } from "./share";
import DepExplorerView from "./views/DepExplorerView";

export const log = vscode.window.createOutputChannel("Dependency & Dependent");

export function activate(context: vscode.ExtensionContext) {
  setContext(context);

  new DepExplorerView(context);

  vscode.window.onDidChangeActiveTextEditor(async () => {
    const locked = getLocked();
    if (locked === true) {
      return;
    }

    DepExplorerView.singleton.refresh();
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "dependency-dependent.refresh",
      async () => {
        await DepService.singleton.updateActiveWorkspaceDepMap();
        DepExplorerView.singleton.refresh();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "dependency-dependent.configEntryPoints",
      async () => {
        vscode.commands.executeCommand(
          "workbench.action.openWorkspaceSettings",
          {
            query: "dependencyDependent.entryPoints",
          }
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "dependency-dependent.configWebpack",
      async () => {
        return configWebpack();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dependency-dependent.lock", async () => {
      return setLocked(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dependency-dependent.unlock", async () => {
      return setLocked(false);
    })
  );
}

export function deactivate() {}
