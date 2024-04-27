import * as vscode from "vscode";
import { globSync } from "glob";
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
    const fsPath = uri?.fsPath;
    if (!fsPath) {
      return [];
    }

    const dependencyMap = await this.getDependencyMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(uri)
    );

    const dependencies = [...(dependencyMap.get(fsPath) || [])];

    return dependencies;
  }

  async getDependents(uri?: vscode.Uri): Promise<string[]> {
    const fsPath = uri?.fsPath;
    if (!fsPath) {
      return [];
    }

    const dependentMap = await this.getDependentMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(uri)
    );

    const dependents = [...(dependentMap.get(fsPath) || [])];

    return dependents;
  }

  async getDependencyMapByWorkspace(
    workspace?: vscode.WorkspaceFolder,
    forceUpdate?: boolean
  ): Promise<DepMap> {
    const fsPath = workspace?.uri?.fsPath;

    if (!fsPath) {
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

    let dependencyMap = this.workspacePathDependencyMapMap.get(fsPath);

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

      for (const [key, rawDependencies] of rawDependencyMap) {
        const dependencies = new Set<string>();
        for (const rawDependency of rawDependencies) {
          dependencies.add(vscode.Uri.file(rawDependency).fsPath);
        }

        dependencyMap.set(vscode.Uri.file(key).fsPath, dependencies);
      }

      log.appendLine(
        `End get dependency map: ${JSON.stringify({
          dependencyMapSize: dependencyMap.size,
        })}`
      );

      this.workspacePathDependencyMapMap.set(fsPath, dependencyMap!);
    }

    return dependencyMap!;
  }

  async getDependentMapByWorkspace(
    workspace?: vscode.WorkspaceFolder,
    forceUpdate?: boolean
  ): Promise<DepMap> {
    const fsPath = workspace?.uri?.fsPath;

    if (!fsPath) {
      return new Map();
    }

    let dependentMap = this.workspacePathDependentMapMap.get(fsPath);

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

      this.workspacePathDependentMapMap.set(fsPath, dependentMap);
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
    const cwd = workspace?.uri?.fsPath;
    if (!cwd) {
      log.appendLine("No cwd (`workspace.uri.fsPath`) found.");
      return [];
    }

    const config = vscode.workspace.getConfiguration("dependencyDependent");
    const entryConfig = config.get<string[]>("entryPoints") || [];

    let result: string[] = [];

    for (const entry of entryConfig) {
      const found = globSync(entry, {
        cwd,
        absolute: true
      });

      result = [...found, ...result];
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
