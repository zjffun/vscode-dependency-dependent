import * as vscode from "vscode";
import type { StatsModule } from "webpack";

export default async function (uri: vscode.Uri) {
  const statsUri = vscode.Uri.joinPath(uri, "stats.json");
  const content = (await vscode.workspace.fs.readFile(statsUri)).toString();
  const stats = JSON.parse(content);

  let statsModules: StatsModule[] = stats.modules;
  for (let i = 0; i < statsModules.length; i++) {
    const element = statsModules[i];

    if (element.modules) {
      statsModules = statsModules.concat(element.modules);
    }
  }

  return statsModules;
}
