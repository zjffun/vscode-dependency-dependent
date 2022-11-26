import * as assert from "assert";
import * as vscode from "vscode";
import getDependencyMap from "../../../core/getDependencyMap";
import getStatsModules from "../../../core/getStatsModules";
import { testWorkspaceRoot } from "../../util";

suite("getDependencyMap", () => {
  setup(async () => {});

  teardown(async () => {});

  test("should work", async () => {
    const statsModules = await getStatsModules(testWorkspaceRoot);
    const dependencyMap = getDependencyMap(statsModules, testWorkspaceRoot);

    const indexPath = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "src",
      "index.js"
    ).path;

    const vueComponentPath = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "src",
      "vue",
      "Component.vue"
    ).path;

    assert.equal(dependencyMap.get(indexPath)?.size, 8);
    assert.equal(dependencyMap.get(vueComponentPath)?.size, 5);
  });
});
