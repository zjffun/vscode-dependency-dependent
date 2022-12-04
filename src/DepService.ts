import * as vscode from "vscode";
import webpackDep from "webpack-dep";
import { DepMap } from ".";

let singletonInstance: DepService;

export class DepService {
  static get singleton() {
    if (!singletonInstance) {
      singletonInstance = new DepService();
    }
    return singletonInstance;
  }

  workspacePathDependencyMapMap = new Map<string, DepMap>();
  workspacePathDependentMapMap = new Map<string, DepMap>();

  constructor() {}

  async getDependencies(uri?: vscode.Uri): Promise<string[]> {
    const path = uri?.path;
    if (!path) {
      return [];
    }

    const dependencyMap = await this.getDependencyMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(uri)
    );

    const dependencies = [...(dependencyMap.get(path) || [])];

    return dependencies;
  }

  async getDependents(uri?: vscode.Uri): Promise<string[]> {
    const path = uri?.path;
    if (!path) {
      return [];
    }

    const dependentMap = await this.getDependentMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(uri)
    );

    const dependents = [...(dependentMap.get(path) || [])];

    return dependents;
  }

  async getDependencyMapByWorkspace(
    workspace?: vscode.WorkspaceFolder,
    forceUpdate?: boolean
  ): Promise<DepMap> {
    const path = workspace?.uri?.path;

    if (!path) {
      return new Map();
    }

    const config = vscode.workspace.getConfiguration("dependencyDependent");
    const excludesConfig = config.get<string[]>("excludes") || [];
    const entryConfig = config.get<string[]>("entryPoints") || [];
    const entry = entryConfig.map(
      (entry) => vscode.Uri.joinPath(workspace.uri, entry).path
    );

    let dependencyMap = this.workspacePathDependencyMapMap.get(path);

    if (!dependencyMap || forceUpdate === true) {
      dependencyMap = new Map();

      const rawDependencyMap = await webpackDep({
        entry,
        appDirectory: path,
        excludes: excludesConfig,
      });

      for (const [key, rawDependencies] of rawDependencyMap) {
        const dependencies = new Set<string>();
        for (const rawDependency of rawDependencies) {
          dependencies.add(vscode.Uri.file(rawDependency).path);
        }

        dependencyMap.set(vscode.Uri.file(key).path, dependencies);
      }

      this.workspacePathDependencyMapMap.set(path, dependencyMap!);
    }

    return dependencyMap!;
  }

  async getDependentMapByWorkspace(
    workspace?: vscode.WorkspaceFolder,
    forceUpdate?: boolean
  ): Promise<DepMap> {
    const path = workspace?.uri?.path;

    if (!path) {
      return new Map();
    }

    let dependentMap = this.workspacePathDependentMapMap.get(path);

    if (!dependentMap || forceUpdate === true) {
      const dependencyMap = await this.getDependencyMapByWorkspace(workspace);
      dependentMap = new Map();

      for (const [dependent, dependencies] of dependencyMap) {
        for (const dependency of dependencies) {
          let dependents = dependentMap.get(dependency);
          if (!dependents) {
            dependents = new Set();
            dependentMap.set(dependency, dependents);
          }
          dependents.add(dependent);
        }
      }

      this.workspacePathDependentMapMap.set(path, dependentMap);
    }

    return dependentMap;
  }

  async updateActiveWorkspaceDepMap() {
    const uri = vscode.window.activeTextEditor?.document?.uri;

    if (!uri) {
      return false;
    }

    const workspace = vscode.workspace.getWorkspaceFolder(uri);

    await this.getDependencyMapByWorkspace(workspace, true);
    await this.getDependentMapByWorkspace(workspace, true);

    return true;
  }
}
