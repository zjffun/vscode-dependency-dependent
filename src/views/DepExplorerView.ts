import * as fs from "fs";
import * as vscode from "vscode";
import getRelativePath from "../core/getRelativePath";
import { DepService } from "../DepService";

let depExplorerView: DepExplorerView;

export enum DepTypeEnum {
  Dependency = "Dependency",
  Dependent = "Dependent",
}

export class DepTreeItem extends vscode.TreeItem {
  depType: DepTypeEnum = DepTypeEnum.Dependency;
  depUri: vscode.Uri | undefined;
}

export default class DepExplorerView
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  static get singleton() {
    return depExplorerView;
  }

  public static viewId = "dependency-dependent-DepExplorerView";

  protected context: vscode.ExtensionContext;

  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    depExplorerView = this;

    this.context = context;

    vscode.window.createTreeView(DepExplorerView.viewId, {
      treeDataProvider: this,
      showCollapseAll: true,
    });
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(
    element?: DepTreeItem
  ): DepTreeItem[] | null | Thenable<DepTreeItem[] | null> {
    return element ? this.getTreeElement(element) : this.getTreeRoot();
  }

  protected getTreeElement = async (element: DepTreeItem) => {
    if (element.depType === DepTypeEnum.Dependency) {
      const dependencies = await DepService.singleton.getDependencies(
        element.depUri
      );
      const items: DepTreeItem[] = [];

      for (const dependency of dependencies) {
        const uri = vscode.Uri.parse(dependency);
        const item = new DepTreeItem(uri);
        item.depUri = uri;
        item.command = {
          title: "open",
          command: "vscode.open",
          arguments: [item.depUri],
        };
        item.description = getRelativePath(element.depUri, item.depUri);
        item.depType = DepTypeEnum.Dependency;

        items.push(item);
      }

      return items;
    } else {
      const dependents = await DepService.singleton.getDependents(
        element.depUri
      );
      const items: DepTreeItem[] = [];

      for (const dependent of dependents) {
        const uri = vscode.Uri.parse(dependent);
        const item = new DepTreeItem(uri);
        item.depUri = uri;
        item.command = {
          title: "open",
          command: "vscode.open",
          arguments: [item.depUri],
        };
        item.description = getRelativePath(element.depUri, item.depUri);
        item.depType = DepTypeEnum.Dependent;

        items.push(item);
      }

      return items;
    }
  };

  protected async getTreeRoot() {
    if (!this.anyEntryPointExist()) {
      return null;
    }

    const dependencyTreeItem = new DepTreeItem("Dependencies");
    dependencyTreeItem.depType = DepTypeEnum.Dependency;
    dependencyTreeItem.collapsibleState =
      vscode.TreeItemCollapsibleState.Expanded;
    dependencyTreeItem.depUri = vscode.window.activeTextEditor?.document?.uri;

    const dependentTreeItem = new DepTreeItem("Dependents");
    dependentTreeItem.depType = DepTypeEnum.Dependent;
    dependentTreeItem.collapsibleState =
      vscode.TreeItemCollapsibleState.Expanded;
    dependentTreeItem.depUri = vscode.window.activeTextEditor?.document?.uri;

    return [dependencyTreeItem, dependentTreeItem];
  }

  protected anyEntryPointExist() {
    const uri = vscode.window.activeTextEditor?.document?.uri;
    if (!uri) {
      return true;
    }

    const workspace = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspace?.uri) {
      return true;
    }

    const config = vscode.workspace.getConfiguration("dependencyDependent");
    const entryConfig = config.get<string[]>("entryPoints") || [];
    const result = entryConfig.some((entry) =>
      fs.existsSync(vscode.Uri.joinPath(workspace.uri, entry).fsPath)
    );

    return result;
  }
}
