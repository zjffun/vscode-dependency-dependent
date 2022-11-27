import * as vscode from "vscode";
import { DepMap } from ".";
import getDependencyMap from "./core/getDependencyMap";
import getStatsModules from "./core/getStatsModules";

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

    let dependencyMap = this.workspacePathDependencyMapMap.get(path);

    if (!dependencyMap || forceUpdate === true) {
      const statsModules = await getStatsModules(workspace.uri);
      dependencyMap = getDependencyMap(statsModules, workspace.uri);
      this.workspacePathDependencyMapMap.set(path, dependencyMap);
    }

    return dependencyMap;
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
