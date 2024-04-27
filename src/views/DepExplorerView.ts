import * as path from "node:path";
import * as vscode from "vscode";
import getRelativePath from "../core/getRelativePath";
import { DepService } from "../DepService";
import { log } from "../extension";
import { getLocked } from "../core/context";

const rootViewItemId = "dependency-dependent-DepExplorerView-root-viewItem";

let depExplorerView: DepExplorerView;

export enum DepTypeEnum {
  Root = "Root",
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

  protected treeView: vscode.TreeView<DepTreeItem>;

  protected currentRootUri?: vscode.Uri;

  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    depExplorerView = this;

    this.context = context;

    this.treeView = vscode.window.createTreeView(DepExplorerView.viewId, {
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
    if (!element) {
      return this.getTreeRoot();
    }

    if (element.depType === DepTypeEnum.Root) {
      return this.getSubTreeItems(element);
    }

    return this.getTreeElement(element);
  }

  protected getTreeElement = async (element: DepTreeItem) => {
    if (element.depType === DepTypeEnum.Dependency) {
      const dependencies = await DepService.singleton.getDependencies(
        element.depUri
      );
      const items: DepTreeItem[] = [];

      for (const dependency of dependencies) {
        const uri = vscode.Uri.file(dependency);
        const item = new DepTreeItem(uri);
        const itemDependencies = await DepService.singleton.getDependencies(
          uri
        );

        item.depUri = uri;
        item.command = {
          title: "open",
          command: "vscode.open",
          arguments: [item.depUri],
        };

        if (itemDependencies.length) {
          item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }

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
        const uri = vscode.Uri.file(dependent);
        const item = new DepTreeItem(uri);
        const itemDependents = await DepService.singleton.getDependents(uri);

        item.depUri = uri;
        item.command = {
          title: "open",
          command: "vscode.open",
          arguments: [item.depUri],
        };

        if (itemDependents.length) {
          item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }

        item.description = getRelativePath(element.depUri, item.depUri);
        item.depType = DepTypeEnum.Dependent;

        items.push(item);
      }

      return items;
    }
  };

  protected async getTreeRoot() {
    try {
      let uri: vscode.Uri | undefined;

      const locked = getLocked();
      if (locked === true && this.currentRootUri) {
        uri = this.currentRootUri;
      } else {
        uri = vscode.window.activeTextEditor?.document?.uri;

        if (!uri) {
          throw new Error("Can't get uri of activeTextEditor.");
        }

        this.currentRootUri = uri;
      }

      const dependencies = await DepService.singleton.getDependencies(uri);
      const dependents = await DepService.singleton.getDependents(uri);

      if (!dependencies.length && !dependents.length) {
        throw new Error("No dependency or dependent found.");
      }

      const workspaceUri = vscode.workspace.getWorkspaceFolder(uri)?.uri;

      this.treeView.message = undefined;
      const rootTreeItem = new DepTreeItem(uri);

      if (workspaceUri) {
        const description = path
          .relative(workspaceUri.fsPath, uri.fsPath)
          .replaceAll(path.sep, "/");

        rootTreeItem.description = description;
      }

      rootTreeItem.depType = DepTypeEnum.Root;
      rootTreeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      rootTreeItem.depUri = uri;
      rootTreeItem.contextValue = rootViewItemId;

      return [rootTreeItem];
    } catch (e: any) {
      this.treeView.message =
        "No dependency or dependent found for this file.\n Please check config, see https://github.com/zjffun/vscode-dependency-dependent";
      log.appendLine(e.message);
      return null;
    }
  }

  protected async getSubTreeItems(element) {
    const dependencyTreeItem = new DepTreeItem("Dependencies");
    dependencyTreeItem.depType = DepTypeEnum.Dependency;
    dependencyTreeItem.collapsibleState =
      vscode.TreeItemCollapsibleState.Expanded;
    dependencyTreeItem.depUri = element.depUri;

    const dependentTreeItem = new DepTreeItem("Dependents");
    dependentTreeItem.depType = DepTypeEnum.Dependent;
    dependentTreeItem.collapsibleState =
      vscode.TreeItemCollapsibleState.Expanded;
    dependentTreeItem.depUri = element.depUri;

    return [dependentTreeItem, dependencyTreeItem];
  }
}
