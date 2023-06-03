import * as vscode from "vscode";
import getRelativePath from "../core/getRelativePath";
import { DepService } from "../DepService";
import { log } from "../extension";

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
        const uri = vscode.Uri.file(dependency);
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
        const uri = vscode.Uri.file(dependent);
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
    try {
      await DepService.getEntryPoints();
    } catch (e: any) {
      log.appendLine(e.message);
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

    return [dependentTreeItem, dependencyTreeItem];
  }
}
