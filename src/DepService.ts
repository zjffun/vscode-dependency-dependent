import * as vscode from "vscode";
import { IStatsModule } from ".";
import getStatsModules from "./core/getStatsModules";

let singletonInstance: DepService;

export class DepService {
  static get singleton() {
    if (!singletonInstance) {
      singletonInstance = new DepService();
    }
    return singletonInstance;
  }

  workspacePathStatsModulesMap = new Map<string, IStatsModule[]>();

  constructor() {}

  async getDependencies(uri?: vscode.Uri): Promise<IStatsModule[]> {
    const path = uri?.path;
    if (!path) {
      return [];
    }

    const statsModules = await this.getStatsModules(uri);

    const dependencies = statsModules.filter(
      (statsModule) => statsModule.vscodeImporterPath === path
    );

    return dependencies;
  }

  async getDependents(uri?: vscode.Uri): Promise<IStatsModule[]> {
    const path = uri?.path;
    if (!path) {
      return [];
    }

    const statsModules = await this.getStatsModules(uri);

    const dependencies = statsModules.filter(
      (statsModule) => statsModule.vscodeExporterPath === path
    );

    return dependencies;
  }

  async getStatsModules(uri: vscode.Uri): Promise<IStatsModule[]> {
    const workspace = vscode.workspace.getWorkspaceFolder(uri);

    const statsModules = await this.getStatsModulesByWorkspace(workspace);

    return statsModules;
  }

  async getStatsModulesByWorkspace(
    workspace?: vscode.WorkspaceFolder
  ): Promise<IStatsModule[]> {
    const path = workspace?.uri?.path;

    if (!path) {
      return [];
    }

    if (this.workspacePathStatsModulesMap.has(path)) {
      return this.workspacePathStatsModulesMap.get(path) || [];
    }

    const statsModules = await getStatsModules(workspace.uri);

    this.workspacePathStatsModulesMap.set(path, statsModules);

    return statsModules;
  }
}
