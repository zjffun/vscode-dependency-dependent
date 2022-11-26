import * as vscode from "vscode";
import type { StatsModule } from "webpack";

const vueReg = /\?vue\&/;

export default function (statsModules: StatsModule[], uri: vscode.Uri) {
  const identifierStatsModuleMap = new Map<string, StatsModule>();
  const dependencyMap = new Map<string, Set<string>>();

  for (const statsModule of statsModules) {
    if (statsModule.identifier) {
      identifierStatsModuleMap.set(statsModule.identifier, statsModule);
    }
  }

  for (const statsModule of statsModules) {
    const dependencyName = statsModule.nameForCondition;
    if (!dependencyName) {
      continue;
    }
    if (statsModule.reasons) {
      for (const reason of statsModule.reasons) {
        const identifier = reason.resolvedModuleIdentifier;

        if (identifier) {
          const dependentStatsModule = identifierStatsModuleMap.get(identifier);

          let dependentName = dependentStatsModule?.nameForCondition;

          if (!dependentName) {
            continue;
          }

          if (vueReg.test(dependentName)) {
            const issuerPaths = dependentStatsModule?.issuerPath;

            let find = false;
            if (issuerPaths) {
              for (let i = issuerPaths.length - 1; i >= 0; i--) {
                const issuerPath = issuerPaths[i];
                if (issuerPath.name && !vueReg.test(issuerPath.name)) {
                  if (!issuerPath.identifier) {
                    break;
                  }

                  const name = identifierStatsModuleMap.get(
                    issuerPath.identifier
                  )?.nameForCondition;

                  if (!name) {
                    break;
                  }

                  dependentName = name;
                  find = true;
                  break;
                }
              }

              if (!find) {
                continue;
              }
            }
          }

          const dependentPath = vscode.Uri.file(dependentName).path;
          const dependencyPath = vscode.Uri.file(dependencyName).path;

          if (dependentPath === dependencyPath) {
            continue;
          }

          let dependency = dependencyMap.get(dependentPath);
          if (!dependency) {
            dependency = new Set();
            dependencyMap.set(dependentPath, dependency);
          }

          dependency.add(dependencyPath);
        }
      }
    }
  }

  return dependencyMap;
}
