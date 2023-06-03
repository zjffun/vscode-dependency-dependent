import * as fs from "fs";
import * as vscode from "vscode";
import webpackDep from "webpack-dep";
import { DepMap } from ".";
import { log } from "./extension";
import { webpackConfigFileName } from "./share";

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
    const fsPath = workspace?.uri?.fsPath;

    if (!path || !fsPath) {
      return new Map();
    }

    const config = vscode.workspace.getConfiguration("dependencyDependent");
    const excludesConfig = config.get<string[]>("excludes") || [];
    const entryPoints = DepService.getEntryPoints();
    let webpackConfigFn: any;

    try {
      webpackConfigFn = await DepService.getWebpackConfigFn();
    } catch (error) {
      log.appendLine(`Error get webpack config: ${error}`);
    }

    let dependencyMap = this.workspacePathDependencyMapMap.get(path);

    if (!dependencyMap || forceUpdate === true) {
      const options = {
        appDirectory: fsPath,
        excludes: excludesConfig,
        webpackConfig(config: any) {
          let _config = config;
          _config.entry = entryPoints;

          if (typeof webpackConfigFn === "function") {
            try {
              const configResult = webpackConfigFn(_config);
              if (!configResult) {
                throw Error("function return undefined");
              }
              _config = configResult;
            } catch (error) {
              log.appendLine(
                `Error run dependency-dependent-webpack-config.js: ${error}`
              );
            }
          }

          console.log("DepService.ts:99", _config);
          return _config;
        },
        errorCb(errors: any[]) {
          log.appendLine(
            `Error get dependency map: ${JSON.stringify(errors, null, 2)}`
          );
        },
      };

      log.appendLine(
        `Start get dependency map: ${JSON.stringify(options, null, 2)}`
      );

      dependencyMap = new Map();

      const rawDependencyMap = await webpackDep(options);
      console.log("DepService.ts:116", rawDependencyMap);

      for (const [key, rawDependencies] of rawDependencyMap) {
        const dependencies = new Set<string>();
        for (const rawDependency of rawDependencies) {
          dependencies.add(vscode.Uri.file(rawDependency).path);
        }

        dependencyMap.set(vscode.Uri.file(key).path, dependencies);
      }

      log.appendLine(
        `End get dependency map: ${JSON.stringify({
          dependencyMapSize: dependencyMap.size,
        })}`
      );

      this.workspacePathDependencyMapMap.set(path, dependencyMap!);
    }

    return dependencyMap!;
  }

  async getDependentMapByWorkspace(
    workspace?: vscode.WorkspaceFolder,
    forceUpdate?: boolean
  ): Promise<DepMap> {
    const path = workspace?.uri?.path;
    console.log("DepService.ts:142", path);

    if (!path) {
      return new Map();
    }

    let dependentMap = this.workspacePathDependentMapMap.get(path);

    if (!dependentMap || forceUpdate === true) {
      const dependencyMap = await this.getDependencyMapByWorkspace(workspace);
      dependentMap = new Map();

      for (const [dependent, dependencies] of dependencyMap) {
        console.log("DepService.ts:157", dependent);
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

  static getEntryPoints() {
    const uri = vscode.window.activeTextEditor?.document?.uri;
    if (!uri) {
      log.appendLine("No `activeTextEditor.document.uri` found.");
      return [];
    }

    const workspace = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspace?.uri) {
      log.appendLine("No `workspace.uri` found.");
      return [];
    }

    const config = vscode.workspace.getConfiguration("dependencyDependent");
    const entryConfig = config.get<string[]>("entryPoints") || [];

    const result = [];

    for (const entry of entryConfig) {
      const fsPath = vscode.Uri.joinPath(workspace.uri, entry).fsPath;
      if (fs.existsSync(fsPath)) {
        result.push(fsPath);
      }
    }

    if (!result.length) {
      throw new Error("No entry points found.");
    }

    return result;
  }

  static async getWebpackConfigFn() {
    const uri = vscode.window.activeTextEditor?.document?.uri;
    if (!uri) {
      log.appendLine("No `activeTextEditor.document.uri` found.");
      return;
    }

    const workspace = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspace?.uri) {
      log.appendLine("No `workspace.uri` found.");
      return;
    }

    const webpackConfigFileUri = vscode.Uri.joinPath(
      workspace.uri,
      ".vscode",
      webpackConfigFileName
    );

    try {
      await vscode.workspace.fs.stat(webpackConfigFileUri);
    } catch {
      return;
    }

    // Only support CommonJS
    delete require.cache[require.resolve(webpackConfigFileUri.fsPath)];
    const webpackConfigFn = require(webpackConfigFileUri.fsPath);

    return webpackConfigFn;
  }
}
