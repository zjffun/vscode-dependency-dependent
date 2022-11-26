import * as vscode from "vscode";
import type { StatsModule } from "webpack";
import { IStatsModule } from "..";

export default async function (uri: vscode.Uri) {
  const statsUri = vscode.Uri.joinPath(uri, "stats.json");
  const content = (await vscode.workspace.fs.readFile(statsUri)).toString();
  const stats = JSON.parse(content);
  const modules: StatsModule[] = stats.modules;
  const results: IStatsModule[] = [];

  for (const m of modules) {
    if (!m.name || !m.issuerName) {
      continue;
    }

    results.push({
      ...m,
      vscodeExporterPath: vscode.Uri.joinPath(uri, m.name).path,
      vscodeImporterPath: vscode.Uri.joinPath(uri, m.issuerName).path,
    });
  }

  return results;
}
