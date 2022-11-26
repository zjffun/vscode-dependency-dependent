import * as vscode from "vscode";
import type { StatsModule } from "webpack";
import { IStatsModule } from "..";

const vueReg = /\?vue\&/;

export default async function (uri: vscode.Uri) {
  const statsUri = vscode.Uri.joinPath(uri, "stats.json");
  const content = (await vscode.workspace.fs.readFile(statsUri)).toString();
  const stats = JSON.parse(content);
  const modules: StatsModule[] = stats.modules;
  const results: IStatsModule[] = [];

  for (const m of modules) {
    if (!m.name || !m.issuerName || vueReg.test(m.name)) {
      continue;
    }

    let issuerName;
    if (vueReg.test(m.issuerName)) {
      if (m.issuerPath) {
        for (let i = m.issuerPath.length - 1; i >= 0; i--) {
          const issuerPath = m.issuerPath[i];
          if (issuerPath.name && !vueReg.test(issuerPath.name)) {
            issuerName = issuerPath.name;
            break;
          }
        }
      }
    } else {
      issuerName = m.issuerName;
    }

    if (!issuerName || issuerName === m.name) {
      continue;
    }

    results.push({
      ...m,
      vscodeExporterPath: vscode.Uri.joinPath(uri, m.name).path,
      vscodeImporterPath: vscode.Uri.joinPath(uri, issuerName).path,
    });
  }

  return results;
}
